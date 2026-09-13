import React, { useState } from 'react';

interface PhysicalMotorProps {
  rpm: number;
  temperature: number;
  torque: number;
  driveMode: string;
}

export default function PhysicalMotorSVG({ rpm, temperature, torque, driveMode }: PhysicalMotorProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Animation de l'arbre de transmission
  const isRotating = rpm > 5;
  const rawDuration = rpm > 0 ? 60 / rpm : 0;
  const animDuration = isRotating ? `${Math.max(rawDuration, 0.1)}s` : '0s';

  // Couleurs dynamiques
  const casingColor = temperature > 90 ? '#ef4444' : temperature > 60 ? '#f59e0b' : '#334155';

  // Dictionnaire des informations au survol
  const partInfo: Record<string, { title: string; desc: string; data: string }> = {
    shaft: {
      title: "Arbre de Transmission",
      desc: "Transmet l'énergie mécanique à la charge.",
      data: `Vitesse: ${rpm.toFixed(0)} tr/min | Couple: ${torque.toFixed(1)} N.m`
    },
    casing: {
      title: "Carcasse & Ailettes",
      desc: "Maintient le stator et dissipe la chaleur par convection.",
      data: `Température: ${temperature.toFixed(1)} °C`
    },
    terminal: {
      title: "Boîte à Bornes",
      desc: "Connexion au réseau électrique (U, V, W).",
      data: `Couplage actuel: ${driveMode}`
    },
    fan: {
      title: "Capot de Ventilation",
      desc: "Protège le ventilateur. Le refroidissement dépend de la vitesse.",
      data: `Refroidissement: ${isRotating ? 'ACTIF' : 'ARRÊTÉ'}`
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 min-h-[250px]">
      
      {/* Panneau d'information flottant (Tooltip interactif) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-slate-900 border border-scada-border rounded p-2 flex flex-col justify-center items-center transition-opacity shadow-lg z-20">
        {hoveredPart && partInfo[hoveredPart] ? (
          <>
            <span className="text-signal-power font-bold text-sm uppercase">{partInfo[hoveredPart].title}</span>
            <span className="text-slate-400 text-[10px] font-mono">{partInfo[hoveredPart].desc}</span>
            <span className="text-white text-xs font-mono font-bold">{partInfo[hoveredPart].data}</span>
          </>
        ) : (
          <span className="text-slate-500 text-xs font-mono animate-pulse">SURVOLEZ LE MOTEUR POUR INSPECTER LES PIÈCES</span>
        )}
      </div>

      <svg viewBox="0 0 400 250" className="w-full h-full max-h-[220px] drop-shadow-2xl mt-12 cursor-crosshair">
        <defs>
          <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="darkMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* 1. ARBRE MOTEUR (SHAFT) - Rotatif */}
        <g 
          onMouseEnter={() => setHoveredPart('shaft')} 
          onMouseLeave={() => setHoveredPart(null)}
          className="transition-all"
        >
          <rect x="20" y="115" width="70" height="20" fill="url(#metal)" 
                stroke={hoveredPart === 'shaft' ? '#3b82f6' : '#1e293b'} strokeWidth={hoveredPart === 'shaft' ? 3 : 1} />
          {/* Ligne de clavette animée (pour simuler la rotation 3D) */}
          <line x1="30" y1="125" x2="80" y2="125" stroke="#1e293b" strokeWidth="2" strokeDasharray="10 5" 
                style={{ animation: isRotating ? `dashMove ${animDuration} linear infinite` : 'none' }} />
        </g>

        {/* 2. FLASQUE AVANT */}
        <path d="M 85 80 Q 95 80 95 125 Q 95 170 85 170 Z" fill="url(#darkMetal)" stroke="#1e293b" strokeWidth="2" />

        {/* 3. CARCASSE (STATOR FRAME) */}
        <g 
          onMouseEnter={() => setHoveredPart('casing')} 
          onMouseLeave={() => setHoveredPart(null)}
        >
          <rect x="95" y="70" width="180" height="110" fill={casingColor} 
                stroke={hoveredPart === 'casing' ? '#3b82f6' : '#0f172a'} strokeWidth={hoveredPart === 'casing' ? 3 : 2} 
                className="transition-colors duration-1000" />
          {/* Ailettes de refroidissement */}
          {[80, 90, 100, 110, 120, 130, 140, 150, 160].map(y => (
            <line key={y} x1="95" y1={y} x2="275" y2={y} stroke="#0f172a" strokeWidth="2" opacity="0.4" />
          ))}
          {/* Pieds du moteur */}
          <path d="M 110 180 L 130 180 L 130 200 L 100 200 Z" fill="url(#darkMetal)" stroke="#0f172a" />
          <path d="M 240 180 L 260 180 L 270 200 L 240 200 Z" fill="url(#darkMetal)" stroke="#0f172a" />
        </g>

        {/* 4. BOÎTE À BORNES (TERMINAL BOX) */}
        <g 
          onMouseEnter={() => setHoveredPart('terminal')} 
          onMouseLeave={() => setHoveredPart(null)}
        >
          <rect x="140" y="30" width="60" height="40" rx="3" fill="url(#darkMetal)" 
                stroke={hoveredPart === 'terminal' ? '#3b82f6' : '#0f172a'} strokeWidth={hoveredPart === 'terminal' ? 3 : 2} />
          <path d="M 150 30 L 160 15 L 180 15 L 190 30 Z" fill="#475569" stroke="#0f172a" />
          <circle cx="170" cy="50" r="3" fill="#ef4444" />
        </g>

        {/* 5. CAPOT VENTILATEUR (FAN COVER) */}
        <g 
          onMouseEnter={() => setHoveredPart('fan')} 
          onMouseLeave={() => setHoveredPart(null)}
        >
          <rect x="275" y="65" width="60" height="120" rx="10" fill="url(#metal)" 
                stroke={hoveredPart === 'fan' ? '#3b82f6' : '#1e293b'} strokeWidth={hoveredPart === 'fan' ? 3 : 2} />
          {/* Grille d'aération */}
          {[75, 95, 115, 135, 155, 175].map(y => (
            <line key={y} x1="315" y1={y} x2="335" y2={y} stroke="#0f172a" strokeWidth="3" />
          ))}
        </g>

      </svg>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dashMove {
          from { stroke-dashoffset: 15; }
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </div>
  );
}