import React from 'react';

interface WiringSchematicProps {
  powerOn: boolean;
  isTripped: boolean;
  driveMode: string; // 'DOL_DELTA', 'DOL_STAR', 'STAR_DELTA', 'VFD', 'ROTORIC'
  motorType?: string;
  rotoricStep?: number;
}

export default function WiringSchematic({ powerOn, isTripped, driveMode, motorType, rotoricStep = 0 }: WiringSchematicProps) {
  const isPowered = powerOn && !isTripped;
  const liveColor = isPowered ? '#ef4444' : '#475569'; 
  const lineColor = '#94a3b8'; 

  const isVFD = driveMode === 'VFD';
  const isRotoric = driveMode === 'ROTORIC' || motorType === 'SLIP_RING';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      <svg viewBox="0 0 300 400" className="w-full h-full max-h-[300px] drop-shadow-md font-mono">
        
        {/* --- RÉSEAU AMONT (Fixe) --- */}
        <text x="70" y="20" fill={lineColor} fontSize="12" fontWeight="bold">L1</text>
        <text x="130" y="20" fill={lineColor} fontSize="12" fontWeight="bold">L2</text>
        <text x="190" y="20" fill={lineColor} fontSize="12" fontWeight="bold">L3</text>
        
        <line x1="80" y1="25" x2="80" y2="70" stroke={lineColor} strokeWidth="2" />
        <line x1="140" y1="25" x2="140" y2="70" stroke={lineColor} strokeWidth="2" />
        <line x1="200" y1="25" x2="200" y2="70" stroke={lineColor} strokeWidth="2" />

        {/* --- SECTIONNEUR (Q1) --- */}
        <text x="45" y="95" fill={lineColor} fontSize="10">Q1</text>
        {[80, 140, 200].map((x, i) => (
          <g key={`q1-${i}`}>
            <rect x={x-4} y="75" width="8" height="20" fill="none" stroke={lineColor} strokeWidth="2" />
            <line x1={x} y1="95" x2={x} y2="120" stroke={lineColor} strokeWidth="2" />
          </g>
        ))}

        {/* --- VARIATEUR OU CONTACTEUR --- */}
        {isVFD ? (
          <g transform="translate(60, 120)">
            <rect x="0" y="0" width="160" height="70" fill="#1e293b" stroke={isPowered ? '#3b82f6' : lineColor} strokeWidth="2" rx="4" />
            <text x="10" y="20" fill="#fff" fontSize="10" fontWeight="bold">VFD (Variateur)</text>
            <text x="10" y="40" fill="#cbd5e1" fontSize="12">AC ~</text>
            <line x1="70" y1="25" x2="90" y2="55" stroke="#fff" strokeWidth="2" />
            <text x="120" y="60" fill="#cbd5e1" fontSize="12">AC ~</text>
            <text x="65" y="60" fill="#3b82f6" fontSize="10">{isPowered ? "RUN" : "STOP"}</text>
            {/* Lignes sortantes du VFD */}
            {[20, 80, 140].map((x) => (
              <line key={`vfd-out-${x}`} x1={x} y1="70" x2={x} y2="100" stroke={isPowered ? liveColor : lineColor} strokeWidth="2" />
            ))}
          </g>
        ) : (
          <g transform="translate(0, 0)">
            <text x="45" y="145" fill={isPowered ? '#10b981' : lineColor} fontSize="10" fontWeight="bold">KM1</text>
            {[80, 140, 200].map((x, i) => (
              <g key={`km1-${i}`}>
                <circle cx={x} cy="120" r="3" fill={lineColor} />
                <line x1={x} y1="120" x2={isPowered ? x : x - 12} y2="160" stroke={isPowered ? '#10b981' : lineColor} strokeWidth="2" style={{ transition: 'all 0.15s ease-in-out' }}/>
                <circle cx={x} cy="160" r="3" fill={isPowered ? liveColor : lineColor} />
                <line x1={x} y1="160" x2={x} y2="190" stroke={isPowered ? liveColor : lineColor} strokeWidth="2" />
              </g>
            ))}
            <line x1="70" y1="140" x2="210" y2="140" stroke={isPowered ? '#10b981' : lineColor} strokeWidth="1" strokeDasharray="4 4" />
          </g>
        )}

        {/* --- RELAIS THERMIQUE (F1) --- */}
        <g transform={`translate(0, ${isVFD ? 30 : 0})`}>
          <text x="45" y="230" fill={isTripped ? '#ef4444' : lineColor} fontSize="10" fontWeight="bold">F1</text>
          {[80, 140, 200].map((x, i) => (
            <g key={`f1-${i}`}>
              <path d={`M ${x} 190 L ${x+6} 190 L ${x+6} 200 L ${x-6} 200 L ${x-6} 210 L ${x} 210`} fill="none" stroke={isPowered ? liveColor : lineColor} strokeWidth="2" />
              <circle cx={x} cy="215" r="3" fill={isPowered ? liveColor : lineColor} />
              <line x1={x} y1="215" x2={!isTripped ? x : x - 10} y2="245" stroke={!isTripped ? (isPowered ? liveColor : lineColor) : '#ef4444'} strokeWidth="2" style={{ transition: 'all 0.2s ease-out' }}/>
              <circle cx={x} cy="245" r="3" fill={!isTripped && isPowered ? liveColor : lineColor} />
              <line x1={x} y1="245" x2={x} y2="280" stroke={!isTripped && isPowered ? liveColor : lineColor} strokeWidth="2" />
            </g>
          ))}
        </g>

        {/* --- MOTEUR (M1) ET ROTOR --- */}
        <g transform={`translate(140, ${isVFD ? 330 : 300})`}>
          <circle cx="0" cy="0" r="25" fill="url(#statorGrad)" stroke={!isTripped && isPowered ? liveColor : lineColor} strokeWidth="2" />
          <text x="-8" y="-2" fill="#fff" fontSize="12" fontWeight="bold">M</text>
          <text x="-8" y="10" fill="#fff" fontSize="10">3~</text>
          
          {/* CÂBLAGE ROTORIQUE (Si Moteur à Bagues) */}
          {isRotoric && (
            <g>
              <line x1="25" y1="0" x2="60" y2="0" stroke={isPowered ? '#f59e0b' : lineColor} strokeWidth="2" />
              <line x1="22" y1="10" x2="60" y2="10" stroke={isPowered ? '#f59e0b' : lineColor} strokeWidth="2" />
              <line x1="22" y1="-10" x2="60" y2="-10" stroke={isPowered ? '#f59e0b' : lineColor} strokeWidth="2" />
              
              <rect x="60" y="-20" width="40" height="40" fill="#1e293b" stroke={isPowered ? '#f59e0b' : lineColor} strokeWidth="2" rx="2" />
              <text x="65" y="-5" fill="#fff" fontSize="8">R_ext</text>
              <text x="65" y="10" fill={rotoricStep === 2 ? '#10b981' : '#f59e0b'} fontSize="10" fontWeight="bold">
                {rotoricStep === 0 ? 'MAX' : rotoricStep === 1 ? 'MOY' : 'CC (0)'}
              </text>
            </g>
          )}
        </g>

      </svg>
    </div>
  );
}