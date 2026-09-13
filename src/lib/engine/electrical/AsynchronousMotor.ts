export type MotorType = 'SQUIRREL_CAGE' | 'SLIP_RING';
export type ConnectionType = 'DELTA' | 'STAR';
export type MechanicalApplication = 'PUMP' | 'CONVEYOR' | 'HOIST' | 'MIXER';

export interface Nameplate {
  Pn: number; Un: number; Nn: number; In: number; cosPhi: number;
}

export interface HardwareFaults {
  voltageDrop: number; phaseLoss: boolean; bearingWear: number;
}

export class AsynchronousMotor {
  public type: MotorType = 'SQUIRREL_CAGE';
  public nameplate: Nameplate = { Pn: 4.0, Un: 400, Nn: 1440, In: 8.5, cosPhi: 0.82 };

  private p = 2; private Rs = 1.0; private Rr_base = 1.0; private X_base = 3.0; 
  private J = 0.5; private f_visc_base = 0.02; private mass = 60; 
  private C_th = 27000; private h_0 = 5.0; private h_1 = 0.1;

  private omega_m = 0;
  public temperature = 25; 
  private ambient_temp = 25;

  public calculateModelFromNameplate() {
    if (this.nameplate.Nn > 1500) this.p = 1;
    else if (this.nameplate.Nn > 1000) this.p = 2;
    else if (this.nameplate.Nn > 750) this.p = 3;
    else this.p = 4;

    const Ns = (50 * 60) / this.p;
    const gn = Math.max(0.01, (Ns - this.nameplate.Nn) / Ns);

    const In_safe = Math.max(0.1, this.nameplate.In);
    const P_utile = Math.max(0.1, this.nameplate.Pn * 1000);
    const cosPhi_safe = Math.max(0.1, Math.min(1.0, this.nameplate.cosPhi));

    let P_absorb = Math.sqrt(3) * this.nameplate.Un * In_safe * cosPhi_safe;
    let P_pertes = P_absorb - P_utile;
    if (P_pertes < P_utile * 0.05) { P_pertes = P_utile * 0.05; P_absorb = P_utile + P_pertes; }

    const I_phase_nom = In_safe / Math.sqrt(3);

    this.Rs = Math.max(0.01, (P_pertes * 0.4) / (3 * Math.pow(I_phase_nom, 2)));
    this.Rr_base = Math.max(0.01, (gn * (P_utile + P_pertes * 0.2)) / (3 * Math.pow(I_phase_nom, 2)));

    const S = Math.sqrt(3) * this.nameplate.Un * In_safe;
    const Q_sq = Math.max(0, Math.pow(S, 2) - Math.pow(P_absorb, 2));
    this.X_base = Math.max(0.1, (Math.sqrt(Q_sq) * 0.8) / (3 * Math.pow(I_phase_nom, 2)));

    this.mass = Math.max(10, 15 * this.nameplate.Pn);
    this.J = Math.max(0.05, 0.04 * this.nameplate.Pn);
    this.f_visc_base = 0.005 * this.nameplate.Pn;
    
    this.C_th = this.mass * 450; 
    this.h_0 = 3.0 * Math.pow(this.nameplate.Pn, 0.6);
    this.h_1 = 0.05 * Math.pow(this.nameplate.Pn, 0.6);

    this.omega_m = 0; 
    this.temperature = this.ambient_temp;
  }

  public update(dt: number, V_line_input: number, f: number, appType: MechanicalApplication, loadParamPct: number, connection: ConnectionType, R_ext_mult: number, faults: HardwareFaults) {
    const omega_n = this.nameplate.Nn * (Math.PI / 30);
    const Tn = (this.nameplate.Pn * 1000) / omega_n;
    const param = loadParamPct / 100; 
    let T_load = 0;
    let flowRate = 0, pressure = 0, speedMs = 0;

    switch (appType) {
      case 'PUMP':
        const k_pump = Tn / Math.pow(omega_n, 2);
        T_load = param * k_pump * Math.pow(Math.max(0, this.omega_m), 2);
        flowRate = (Math.max(0, this.omega_m) / omega_n) * param * (this.nameplate.Pn * 15);
        pressure = Math.pow(Math.max(0, this.omega_m) / omega_n, 2) * 4.0;
        break;
      case 'CONVEYOR':
        T_load = Tn * param;
        speedMs = (Math.max(0, this.omega_m) / omega_n) * 2.5;
        break;
      case 'HOIST':
        T_load = Tn * param * 1.2; 
        speedMs = (this.omega_m / omega_n) * 1.0; 
        break;
      case 'MIXER':
        const k_mixer = Tn / omega_n;
        T_load = param * k_mixer * Math.max(0, this.omega_m);
        break;
    }

    let I_line = 0, T_em = 0, g = 0, Rr_total = this.Rr_base, I_phase = 0;
    const V_line = V_line_input * faults.voltageDrop;

    if (V_line > 0 && f > 0) {
      const omega_s = (2 * Math.PI * f) / this.p;
      g = (omega_s - this.omega_m) / omega_s;
      if (g > 1) g = 1; if (g <= 0) g = 0.0001;

      Rr_total = this.type === 'SLIP_RING' ? (this.Rr_base * (1 + R_ext_mult)) : (this.Rr_base * (1 + 1.2 * Math.pow(g, 2)));
      const X_dynamic = this.X_base * (f / 50);
      const Z_sq = Math.pow(this.Rs + Rr_total / g, 2) + Math.pow(X_dynamic, 2);
      
      const V_phase = connection === 'STAR' ? V_line / Math.sqrt(3) : V_line;
      I_phase = V_phase / Math.sqrt(Z_sq);
      I_line = connection === 'STAR' ? I_phase : I_phase * Math.sqrt(3);
      T_em = (3 * Math.pow(V_phase, 2) * (Rr_total / g)) / (omega_s * Z_sq);

      if (faults.phaseLoss) {
        if (Math.abs(this.omega_m) < 10) { T_em = 0; I_line *= 0.86; } 
        else { T_em *= 0.4; I_line *= 1.732; }
      }
    } else { g = 1; }

    const current_f_visc = this.f_visc_base * faults.bearingWear;
    const direction = this.omega_m > 0 ? 1 : (this.omega_m < 0 ? -1 : 0);
    const static_friction = faults.bearingWear > 1.5 ? (faults.bearingWear * 2.0 * direction) : 0; 
    const total_friction = (current_f_visc * this.omega_m) + static_friction;

    let acceleration = 0;
    
    if (V_line === 0 && appType === 'HOIST') {
        this.omega_m = 0; 
        acceleration = 0;
    } else {
        acceleration = (T_em - T_load - total_friction) / this.J;
        this.omega_m += acceleration * dt;
    }
    
    if (appType !== 'HOIST') {
      if (this.omega_m < 0.5 && T_em === 0) this.omega_m = 0; 
      if (this.omega_m < 0) this.omega_m = 0; 
    }
    if (isNaN(this.omega_m)) this.omega_m = 0;

    const P_joule = 3 * (this.Rs + Rr_total) * Math.pow(I_phase, 2);
    const P_frict = Math.abs(total_friction * this.omega_m); 
    const cooling = (this.h_0 + this.h_1 * Math.abs(this.omega_m)) * (this.temperature - this.ambient_temp);
    
    this.temperature += ((P_joule + P_frict - cooling) / this.C_th) * dt;
    if (this.temperature < this.ambient_temp || isNaN(this.temperature)) this.temperature = this.ambient_temp;

    // --- CALCUL VIBRATOIRE (RMS mm/s) SELON NORME ISO 10816 ---
    let vibrationRms = 0.0;
    if (Math.abs(this.omega_m) > 1) {
        const rpmNorm = Math.abs(this.omega_m * 60 / (2 * Math.PI)) / 1500; // Base 1500 tr/min
        
        // Vibration de base + impact exponentiel de l'usure des roulements
        vibrationRms = 0.5 + (rpmNorm * 1.5) * Math.pow(faults.bearingWear, 1.8);
        
        // Déséquilibre magnétique grave si perte de phase
        if (faults.phaseLoss) vibrationRms += 8.5 * rpmNorm;
        
        // Effets liés au procédé (Cavitation pompe, cisaillement malaxeur)
        if (appType === 'MIXER') vibrationRms += 1.5 * param;
        if (appType === 'PUMP' && param < 0.25 && rpmNorm > 0.8) vibrationRms += 4.5; // Cavitation !
        
        // Bruit mécanique aléatoire haute fréquence
        vibrationRms += Math.random() * 0.3;
    }

    return {
      motorRpm: (this.omega_m * 60) / (2 * Math.PI),
      lineCurrent: isNaN(I_line) ? 0 : I_line,
      motorTorque: isNaN(T_em) ? 0 : T_em,
      loadTorque: T_load,
      slip: g * 100,
      temp: this.temperature,
      acceleration: acceleration, // rad/s²
      vibration: vibrationRms,    // mm/s RMS
      process: { flowRate, pressure, speedMs }
    };
  }
}