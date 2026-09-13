import React from 'react';

interface MotorSVGProps {
  rpm: number;
  temperature: number;
  isTripped: boolean;
}

export default function MotorSVG({ rpm, temperature, isTripped }: MotorSVGProps) {
  // 1. Calcul de la couleur du bobinage (Thermodynamique visuelle)
  // Cuivre normal (#b87333) -> Jaune (>60°C) -> Orange (>90°C) -> Rouge feu (>120°C)
  let coilColor = '#b87333'; 
  if (temperature > 120) coilColor = '#ef4444';
  else if (temperature > 90) coilColor = '#f97316';
  else if (temperature > 60) coilColor = '#eab308';

  // 2. Calcul de l'animation de rotation CSS
  // Si le moteur tourne, on calcule la durée d'un tour en secondes.
  // Exemple: 1500 tr/min = 25 tr/sec = 0.04s par tour.
  // On limite l'affichage visuel à 0.1s min pour éviter les bugs graphiques du navigateur.
  const isRotating = rpm > 5;
  const rawDuration = rpm > 0 ? 60 / rpm : 0;
  const animDuration = isRotating ? `${Math.max(rawDuration, 0.1)}s` : '0s';

  return (
    <div className="relative w-full aspect-square max-w-[250px] mx-auto flex items-center justify-center">
      {/* Lueur de surchauffe (Glow effect derrière le moteur) */}
      <div 
        className="absolute inset-0 rounded-full transition-opacity duration-1000 blur-2xl"
        style={{
          backgroundColor: coilColor,
          opacity: temperature > 60 ? (temperature - 60) / 100 : 0
        }}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl relative z-10">
        <defs>
          <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <linearGradient id="rotorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* CARCASSE STATOR */}
        <circle cx="100" cy="100" r="95" fill="url(#statorGrad)" stroke="#334155" strokeWidth="4" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 8" />

        {/* BOBINAGES (6 Pôles Visuels) */}
        <g style={{ transition: 'fill 1s ease-in-out' }} fill={coilColor}>
          <rect x="85" y="10" width="30" height="25" rx="5" />
          <rect x="85" y="165" width="30" height="25" rx="5" />
          <rect x="10" y="85" width="25" height="30" rx="5" />
          <rect x="165" y="85" width="25" height="30" rx="5" />
          {/* Bobines en diagonale */}
          <rect x="35" y="35" width="25" height="25" rx="5" transform="rotate(45 47.5 47.5)" />
          <rect x="140" y="140" width="25" height="25" rx="5" transform="rotate(45 152.5 152.5)" />
          <rect x="140" y="35" width="25" height="25" rx="5" transform="rotate(-45 152.5 47.5)" />
          <rect x="35" y="140" width="25" height="25" rx="5" transform="rotate(-45 47.5 152.5)" />
        </g>

        {/* ROTOR (Avec animation de rotation CSS) */}
        <g 
          style={{
            transformOrigin: '100px 100px',
            animation: isRotating ? `spin ${animDuration} linear infinite` : 'none'
          }}
        >
          {/* Masse du rotor */}
          <circle cx="100" cy="100" r="55" fill="url(#rotorGrad)" stroke="#334155" strokeWidth="2" />
          
          {/* Barres de la cage d'écureuil / Encoches */}
          <circle cx="100" cy="100" r="45" fill="none" stroke="#1e293b" strokeWidth="4" strokeDasharray="10 15" />
          
          {/* Arbre de transmission (Shaft) central */}
          <circle cx="100" cy="100" r="15" fill="#cbd5e1" stroke="#0f172a" strokeWidth="3" />
          
          {/* Clavette (Keyway) pour bien voir la rotation */}
          <rect x="97" y="80" width="6" height="10" fill="#0f172a" />
        </g>

        {/* Effet d'alerte global si moteur en défaut */}
        {isTripped && (
          <circle cx="100" cy="100" r="95" fill="rgba(239, 68, 68, 0.2)" className="animate-pulse pointer-events-none" />
        )}
      </svg>

      {/* Ajout des keyframes CSS globales directement dans le composant */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}