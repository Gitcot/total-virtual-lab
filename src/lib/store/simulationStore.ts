import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AsynchronousMotor, MotorType, MechanicalApplication, Nameplate, ConnectionType, HardwareFaults } from '../engine/electrical/AsynchronousMotor';

export type { MotorType, MechanicalApplication };

export type StartMethod = 'DOL_STAR' | 'DOL_DELTA' | 'STAR_DELTA' | 'VFD' | 'ROTORIC';
export type FaultCode = 'NONE' | 'OVERHEAT' | 'OVERLOAD' | 'LOCKED_ROTOR' | 'PHASE_LOSS_ALARM' | 'HIGH_VIBRATION';
export type AppMode = 'STUDENT' | 'EXPERT';

export interface Mission {
  id: string; title: string; context: string; equipmentInfo: string;
  targetRepair: 'BEARINGS' | 'FUSES' | 'GRID'; steps: string[];
  setup: { appType: MechanicalApplication; motorType: MotorType; startMethod: StartMethod; loadPct: number; faults: HardwareFaults; nameplate: Nameplate; };
}

export interface DataPoint { time: number; rpm: number; current: number; torque: number; }
export interface UserProfile { totalScore: number; completedMissionIds: string[]; }

interface SimulationState {
  appMode: AppMode; userProfile: UserProfile;
  powerOn: boolean; motorType: MotorType; startMethod: StartMethod;
  vfdFreq: number; actualVfdFreq: number; rotoricStep: number; starDeltaPhase: 'STAR' | 'DELTA';
  appType: MechanicalApplication; loadParamPct: number; 
  
  displayRpm: number; displayCurrent: number; displayTorque: number; loadTorque: number; temperature: number;
  acceleration: number; vibrationRms: number;

  processMetrics: { flowRate: number, pressure: number, speedMs: number };
  nameplate: Nameplate; history: DataPoint[]; timeElapsed: number;
  fault: FaultCode; faultMsg: string; faultAdvice: string; faultTimer: number; 
  missionActive: boolean; currentMission: Mission | null; missionSteps: boolean[]; missionTimer: number;
  instructorMode: boolean; hardwareFaults: HardwareFaults;
  
  setAppMode: (mode: AppMode) => void; generateRandomMission: () => void;
  toggleInstructorMode: () => void; setHardwareFault: (key: keyof HardwareFaults, value: number | boolean) => void;
  repairHardware: (target: 'BEARINGS' | 'FUSES' | 'GRID') => { success: boolean; message: string };
  togglePower: () => void; ackFault: () => void;
  setMotorType: (type: MotorType) => void; setStartMethod: (method: StartMethod) => void;
  updateNameplate: (key: keyof Nameplate, value: number) => void;
  setAppType: (type: MechanicalApplication) => void; setLoadParam: (val: number) => void;
  setVfdFreq: (f: number) => void; setRotoricStep: (step: number) => void;
  tick: (dt: number) => void;
}

const motor = new AsynchronousMotor();
motor.calculateModelFromNameplate();

const MISSION_TEMPLATES: Omit<Mission, 'id' | 'setup'>[] = [
  { title: "Urgence Ligne 4 - Convoyeur d'Expédition", context: "Le convoyeur vibre violemment et sent le chaud. Déclenchement de la sécurité RMS.", equipmentInfo: "Convoyeur à Bande (Charge Constante)", targetRepair: 'BEARINGS', steps: ["Diagnostiquer l'anomalie (Surveillance Vibration)", "Consigner l'installation (LOTO)", "Remplacer les roulements mécaniques", "Redémarrer et vérifier Vitesse & RMS"] },
  { title: "Station de Pompage - Baisse de Débit", context: "La pompe de relevage cale au démarrage.", equipmentInfo: "Pompe Centrifuge (VFD)", targetRepair: 'GRID', steps: ["Analyser le défaut (Sous-tension)", "Consigner l'installation", "Rétablir 400V en cellule HT/BT", "Redémarrer et valider le débit"] },
  { title: "Atelier Chimie - Malaxeur Bloqué", context: "Le malaxeur refuse de démarrer. Grognement magnétique fort.", equipmentInfo: "Mélangeur Industriel", targetRepair: 'FUSES', steps: ["Détecter la perte de phase", "Consigner l'installation", "Changer les fusibles (Q1)", "Redémarrer et stabiliser le courant"] },
  { title: "Pont Roulant - Treuil Hors Service", context: "Le moteur de levage chauffe au démarrage et ne lève pas.", equipmentInfo: "Treuil (Moteur à Bagues)", targetRepair: 'FUSES', steps: ["Diagnostiquer l'absence de champ tournant", "Consigner l'installation", "Remplacer les sectionneurs amont", "Valider la montée saine de la charge"] }
];

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      appMode: 'EXPERT', userProfile: { totalScore: 0, completedMissionIds: [] },
      powerOn: false, motorType: 'SQUIRREL_CAGE', startMethod: 'DOL_DELTA', 
      vfdFreq: 50, actualVfdFreq: 0, rotoricStep: 0, starDeltaPhase: 'STAR',
      appType: 'PUMP', loadParamPct: 0,
      
      displayRpm: 0, displayCurrent: 0, displayTorque: 0, loadTorque: 0, temperature: 25,
      acceleration: 0, vibrationRms: 0,

      processMetrics: { flowRate: 0, pressure: 0, speedMs: 0 },
      nameplate: motor.nameplate, history: [], timeElapsed: 0,
      fault: 'NONE', faultMsg: '', faultAdvice: '', faultTimer: 0,
      missionActive: false, currentMission: null, missionSteps: [false, false, false, false], missionTimer: 0,
      instructorMode: false, hardwareFaults: { voltageDrop: 1.0, phaseLoss: false, bearingWear: 1.0 },

      setAppMode: (mode) => {
        if (mode === 'STUDENT') set({ appMode: mode, instructorMode: false, powerOn: false, fault: 'NONE', history: [], timeElapsed: 0, missionActive: false, currentMission: null });
        else set({ appMode: mode, missionActive: false, currentMission: null, hardwareFaults: { voltageDrop: 1.0, phaseLoss: false, bearingWear: 1.0 } });
      },

      generateRandomMission: () => {
        const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
        let newAppType: MechanicalApplication = 'CONVEYOR', newMotorType: MotorType = 'SQUIRREL_CAGE', newStartMethod: StartMethod = 'DOL_DELTA', newPn = 4.0;
        
        // CORRECTION 1: const au lieu de let
        const newFaults: HardwareFaults = { voltageDrop: 1.0, phaseLoss: false, bearingWear: 1.0 };
        
        if (template.targetRepair === 'BEARINGS') { newAppType = 'CONVEYOR'; newPn = 5.5; newFaults.bearingWear = 4.8; } 
        else if (template.targetRepair === 'GRID') { newAppType = 'PUMP'; newPn = 15.0; newStartMethod = 'VFD'; newFaults.voltageDrop = 0.75; } 
        else if (template.targetRepair === 'FUSES' && template.equipmentInfo.includes("Treuil")) { newAppType = 'HOIST'; newMotorType = 'SLIP_RING'; newStartMethod = 'ROTORIC'; newPn = 22.0; newFaults.phaseLoss = true; }
        else if (template.targetRepair === 'FUSES') { newAppType = 'MIXER'; newPn = 7.5; newStartMethod = 'STAR_DELTA'; newFaults.phaseLoss = true; }

        const newIn = parseFloat(((newPn * 1000) / (Math.sqrt(3) * 400 * 0.85 * 0.85)).toFixed(1)); 
        const mission: Mission = { ...template, id: `WO-${Math.floor(Math.random() * 10000)}`, setup: { appType: newAppType, motorType: newMotorType, startMethod: newStartMethod, loadPct: 75 + Math.random() * 15, faults: newFaults, nameplate: { Pn: newPn, Un: 400, Nn: 1460, In: newIn, cosPhi: 0.85 } } };

        motor.nameplate = mission.setup.nameplate; motor.calculateModelFromNameplate();

        set({ 
          missionActive: true, currentMission: mission, missionSteps: [false, false, false, false], missionTimer: 0,
          appType: mission.setup.appType, motorType: mission.setup.motorType, startMethod: mission.setup.startMethod,
          loadParamPct: mission.setup.loadPct, hardwareFaults: mission.setup.faults, nameplate: mission.setup.nameplate,
          powerOn: false, fault: 'NONE', history: [], displayRpm: 0, displayCurrent: 0, displayTorque: 0, temperature: 25, vfdFreq: 50, acceleration: 0, vibrationRms: 0
        });
      },

      toggleInstructorMode: () => set((state) => ({ instructorMode: !state.instructorMode })),
      setHardwareFault: (key, value) => set((state) => ({ hardwareFaults: { ...state.hardwareFaults, [key]: value } })),

      repairHardware: (target) => {
        const state = get();
        if (state.powerOn) return { success: false, message: "REFUS (LOTO) : Vous devez couper la tension avant d'intervenir !" };
        if (target === 'BEARINGS') { set((s) => ({ hardwareFaults: { ...s.hardwareFaults, bearingWear: 1.0 } })); return { success: true, message: "Roulements remplacés." }; }
        if (target === 'FUSES') { set((s) => ({ hardwareFaults: { ...s.hardwareFaults, phaseLoss: false } })); return { success: true, message: "Fusibles remplacés." }; }
        if (target === 'GRID') { set((s) => ({ hardwareFaults: { ...s.hardwareFaults, voltageDrop: 1.0 } })); return { success: true, message: "Réseau rétabli à 400V." }; }
        return { success: false, message: "" };
      },

      togglePower: () => {
        const state = get();
        if (state.fault !== 'NONE') return;
        if (!state.powerOn) {
          set({ powerOn: true, starDeltaPhase: 'STAR', rotoricStep: 0, faultTimer: 0, actualVfdFreq: 0 });
          if (state.startMethod === 'STAR_DELTA') setTimeout(() => { if (get().powerOn) set({ starDeltaPhase: 'DELTA' }); }, 3000);
        } else set({ powerOn: false });
      },
      
      ackFault: () => {
        if (get().temperature > 60) return set({ faultAdvice: `Refus d'acquittement : Bobinage trop chaud (${get().temperature.toFixed(0)}°C). Laissez refroidir.` });
        if (get().vibrationRms > 11.2 && get().powerOn) return set({ faultAdvice: `Refus : Arrêtez le moteur avant d'acquitter un défaut de vibration grave !`});
        set({ fault: 'NONE', faultMsg: '', faultAdvice: '', faultTimer: 0 });
      },

      setMotorType: (type) => set({ motorType: type, startMethod: type === 'SLIP_RING' ? 'ROTORIC' : 'DOL_DELTA', powerOn: false }),
      setStartMethod: (method) => set({ startMethod: method, powerOn: false }),
      updateNameplate: (key, value) => {
        motor.nameplate[key] = value;
        if (key === 'Pn' || key === 'Un' || key === 'cosPhi') motor.nameplate.In = parseFloat(((motor.nameplate.Pn * 1000) / (Math.sqrt(3) * motor.nameplate.Un * motor.nameplate.cosPhi * 0.85)).toFixed(1));
        motor.calculateModelFromNameplate();
        set({ nameplate: { ...motor.nameplate }, powerOn: false });
      },
      setAppType: (type) => set({ appType: type, powerOn: false }),
      setLoadParam: (val) => set({ loadParamPct: val }),
      setVfdFreq: (f) => set({ vfdFreq: f }),
      setRotoricStep: (step) => set({ rotoricStep: step }),

      tick: (dt) => {
        const state = get();
        let V_line = 0, f = 50, connection: ConnectionType = 'DELTA', R_ext_mult = 0;
        
        let newActualFreq = state.actualVfdFreq;
        if (state.powerOn && state.fault === 'NONE' && state.startMethod === 'VFD') {
            const rampRate = 15; 
            if (newActualFreq < state.vfdFreq) newActualFreq = Math.min(state.vfdFreq, newActualFreq + rampRate * dt);
            if (newActualFreq > state.vfdFreq) newActualFreq = Math.max(state.vfdFreq, newActualFreq - rampRate * dt);
        } else if (!state.powerOn) { newActualFreq = 0; }

        if (state.powerOn && state.fault === 'NONE') {
          if (state.startMethod === 'DOL_STAR') { V_line = 400; connection = 'STAR'; }
          else if (state.startMethod === 'DOL_DELTA') { V_line = 400; connection = 'DELTA'; }
          else if (state.startMethod === 'STAR_DELTA') { V_line = 400; connection = state.starDeltaPhase; }
          else if (state.startMethod === 'VFD') { f = newActualFreq; V_line = Math.min(400, (400 / 50) * f + (f > 0 && f < 50 ? 20 * (1 - f/50) : 0)); }
          else if (state.startMethod === 'ROTORIC') { V_line = 400; connection = 'DELTA'; R_ext_mult = state.rotoricStep === 0 ? 4.0 : state.rotoricStep === 1 ? 1.5 : 0.0; }
        }
        
        const res = motor.update(dt, V_line, f, state.appType, state.loadParamPct, connection, R_ext_mult, state.hardwareFaults);
        let newFault = state.fault, newMsg = state.faultMsg, newAdvice = state.faultAdvice, newTimer = state.faultTimer;

        // CORRECTION 2: const au lieu de let
        const newSteps = [...state.missionSteps];
        let mTimer = state.missionTimer;
        
        if (state.appMode === 'STUDENT' && state.missionActive && state.currentMission) {
          const target = state.currentMission.targetRepair;
          if (!newSteps[0] && newFault !== 'NONE') newSteps[0] = true;
          if (newSteps[0] && !newSteps[1] && !state.powerOn) newSteps[1] = true;
          if (newSteps[1] && !newSteps[2]) {
             if (target === 'BEARINGS' && state.hardwareFaults.bearingWear === 1.0) newSteps[2] = true;
             if (target === 'FUSES' && !state.hardwareFaults.phaseLoss) newSteps[2] = true;
             if (target === 'GRID' && state.hardwareFaults.voltageDrop === 1.0) newSteps[2] = true;
          }
          
          const isHealthyAndRunning = state.powerOn && Math.abs(res.motorRpm) > 50 && newFault === 'NONE' && res.lineCurrent <= state.nameplate.In * 1.10;

          if (newSteps[2] && !newSteps[3]) {
            if (isHealthyAndRunning) {
              mTimer += dt;
              if (mTimer > 5.0) {
                newSteps[3] = true;
                if (!state.userProfile.completedMissionIds.includes(state.currentMission.id)) {
                  set((s) => ({ userProfile: { ...s.userProfile, completedMissionIds: [...s.userProfile.completedMissionIds, s.currentMission!.id], totalScore: s.userProfile.totalScore + 100 } }));
                }
              }
            } else { mTimer = 0; }
          }
        }

        if (state.powerOn && state.fault === 'NONE') {
          if (res.vibration > 11.2) {
             newFault = 'HIGH_VIBRATION'; newMsg = 'VIBRATION CRITIQUE (ISO 10816)'; 
             newAdvice = "Dépassement du seuil de 11.2 mm/s RMS. Destruction mécanique imminente. Vérifiez les roulements de l'arbre.";
          }
          else if (state.hardwareFaults.phaseLoss && Math.abs(res.motorRpm) < 10) {
             newTimer += dt;
             if (newTimer > 1.5) { newFault = 'PHASE_LOSS_ALARM'; newMsg = 'PERTE DE PHASE (L3)'; newAdvice = "Déséquilibre critique détecté."; }
          }
          else if (res.temp > 120) { newFault = 'OVERHEAT'; newMsg = 'SURCHAUFFE THERMIQUE'; newAdvice = `Bobinages à plus de 120°C.`; }
          else if (Math.abs(res.motorRpm) < 50 && res.lineCurrent > state.nameplate.In * 1.8 && state.appType !== 'HOIST') {
            newTimer += dt;
            if (newTimer > 2.0) { newFault = 'LOCKED_ROTOR'; newMsg = 'ROTOR BLOQUÉ / CALAGE'; newAdvice = `Couple mécanique trop élevé.`; }
          }
          else if (Math.abs(res.motorRpm) >= 50 && res.lineCurrent > state.nameplate.In * 1.15) {
            newTimer += dt;
            if (newTimer > 5.0) { newFault = 'OVERLOAD'; newMsg = 'SURINTENSITÉ CONTINUE'; newAdvice = `Courant supérieur à In. Réduisez la charge process.`; }
          } else newTimer = 0;
        }

        if (newFault !== 'NONE' && state.powerOn) set({ powerOn: false });

        const sf = 0.15; 
        
        // CORRECTION 3: const au lieu de let
        const newTime = state.timeElapsed + dt;
        let newHistory = state.history;
        if (newHistory.length === 0 || newTime - newHistory[newHistory.length - 1].time >= 0.1) {
          newHistory = [...newHistory, { time: parseFloat(newTime.toFixed(1)), rpm: Math.round(res.motorRpm || 0), current: parseFloat((res.lineCurrent || 0).toFixed(1)), torque: parseFloat((res.motorTorque || 0).toFixed(1)) }].slice(-100);
        }

        set({
          rawRpm: res.motorRpm, temperature: res.temp, faultTimer: newTimer, actualVfdFreq: newActualFreq,
          acceleration: state.acceleration + (res.acceleration - state.acceleration) * 0.3,
          vibrationRms: res.vibration, 
          missionSteps: newSteps, missionTimer: mTimer,
          displayRpm: state.displayRpm + ((isNaN(res.motorRpm)?0:res.motorRpm) - state.displayRpm) * sf,
          displayCurrent: state.displayCurrent + ((isNaN(res.lineCurrent)?0:res.lineCurrent) - state.displayCurrent) * sf,
          displayTorque: state.displayTorque + ((isNaN(res.motorTorque)?0:res.motorTorque) - state.displayTorque) * sf,
          loadTorque: state.loadTorque + ((isNaN(res.loadTorque)?0:res.loadTorque) - state.loadTorque) * sf,
          processMetrics: res.process,
          fault: newFault, faultMsg: newMsg, faultAdvice: newAdvice,
          timeElapsed: newTime, history: newHistory
        });
      }
    }),
    { name: 'total-virtual-lab-storage', partialize: (state) => ({ appMode: state.appMode, userProfile: state.userProfile }) }
  )
);