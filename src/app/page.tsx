'use client'; 
import { useEffect, useRef, useState } from "react";
import { 
  Activity, Gauge, AlertTriangle, Info, Eye, ShieldAlert, 
  Wrench, Settings2, GraduationCap, HardHat, ClipboardList, CheckCircle2, Circle, Play, Square, Database, RefreshCcw, User, Award, BookOpen, X, Code,
  LineChart as ChartIcon, MessageSquarePlus 
} from "lucide-react";
import { useSimulationStore, MotorType, StartMethod, MechanicalApplication } from "@/lib/store/simulationStore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MotorSVG from "@/components/svg-models/MotorSVG"; 
import WiringSchematic from "@/components/svg-models/WiringSchematic"; 
import PhysicalMotorSVG from "@/components/svg-models/PhysicalMotorSVG";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  
  // CORRECTION: 'loadTorque' a été retiré ici pour éviter l'erreur "defined but never used"
  const { 
    appMode, setAppMode, missionActive, currentMission, missionSteps, generateRandomMission, userProfile,
    powerOn, motorType, startMethod, vfdFreq, actualVfdFreq, rotoricStep, 
    appType, loadParamPct, processMetrics, nameplate,
    displayRpm, displayCurrent, displayTorque, temperature, acceleration, vibrationRms, history, fault, faultMsg, faultAdvice,
    instructorMode, hardwareFaults, toggleInstructorMode, setHardwareFault, repairHardware,
    togglePower, ackFault, setMotorType, setStartMethod, updateNameplate, setAppType, setLoadParam, setVfdFreq, setRotoricStep, tick 
  } = useSimulationStore();
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [activeTab, setActiveTab] = useState<'3D' | 'WIRING'>('3D');
  const [visualMode, setVisualMode] = useState<'PHYSICAL' | 'INTERNAL'>('PHYSICAL');
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<{success: boolean, msg: string} | null>(null);

  useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = "hidden"; 
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const animate = (time: number) => {
      if (lastTimeRef.current !== 0) tick(Math.min((time - lastTimeRef.current) / 1000, 0.1)); 
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [tick, isMounted]);

  const handleRepair = (target: 'BEARINGS' | 'FUSES' | 'GRID') => {
    const result = repairHardware(target);
    setMaintenanceFeedback({ success: result.success, msg: result.message });
    setTimeout(() => setMaintenanceFeedback(null), 4000);
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans text-slate-300 overflow-hidden relative">
      
      {guideOpen && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t-4 border-blue-500 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><BookOpen className="text-blue-400 w-8 h-8" /> GUIDE D&apos;UTILISATION - TOTAL VIRTUAL LAB</h2>
              <button onClick={() => setGuideOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-sm leading-relaxed">
              <section>
                <h3 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-2 mb-3">1. Les Profils Utilisateurs</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-white">GMAO APPRENANT :</strong> Mode d&apos;évaluation Serious Game. L&apos;utilisateur reçoit des Ordres de Travail générés aléatoirement. Les paramètres de conception sont bloqués. L&apos;objectif est de diagnostiquer et réparer sans provoquer d&apos;accident.</li>
                  <li><strong className="text-white">INGÉNIERIE :</strong> Mode bac à sable. Le technicien a accès à la modification complète des paramètres du moteur et de la charge mécanique pour tester le dimensionnement de l&apos;installation.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-bold text-orange-400 border-b border-slate-700 pb-2 mb-3">2. Outils Formateurs & Sécurité</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-white">INJECTION PANNES (Formateur) :</strong> En mode Ingénierie, ce panneau caché permet de saboter l&apos;installation en provoquant des sous-tensions, des pertes de phases ou des grippages mécaniques.</li>
                  <li><strong className="text-white">INTERVENTIONS (LOTO) :</strong> Le module de réparation. <strong>Important :</strong> Conformément aux règles de consignation, toute intervention matérielle est refusée si le moteur est sous tension.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-bold text-green-400 border-b border-slate-700 pb-2 mb-3">3. Télémétrie ISO 10816</h3>
                <p>Le simulateur intègre la norme ISO 10816 pour les vibrations industrielles. Une vitesse RMS supérieure à <span className="text-red-400 font-bold">11.2 mm/s</span> provoque une alarme critique d&apos;arrêt matériel pour prévenir la destruction des paliers.</p>
              </section>
            </div>
            <div className="bg-slate-950 p-6 border-t border-slate-800 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/50 p-3 rounded-full border border-blue-500/50"><Code className="text-blue-400 w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Architecte Logiciel & Ingénierie</p>
                  <p className="text-lg font-bold text-white tracking-wide">OLINOUDE OLIVIER</p>
                </div>
              </div>
              <button onClick={() => setGuideOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors">FERMER LE GUIDE</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 border-b-2 border-slate-700 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 w-6 h-6" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-widest leading-none">TOTAL VIRTUAL LAB</h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">Système Expert - IEC 60034</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 mr-2 shadow-inner">
            <User className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase leading-none">Missions</span><span className="text-xs font-mono text-white leading-none mt-1">{userProfile.completedMissionIds.length}</span></div>
            <div className="w-px h-6 bg-slate-800 mx-1"></div>
            <Award className="w-4 h-4 text-orange-400" />
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase leading-none">Score</span><span className="text-xs font-mono text-orange-400 font-bold leading-none mt-1">{userProfile.totalScore}</span></div>
          </div>

          <div className="flex bg-slate-950 rounded border border-slate-700 p-0.5">
            <button onClick={() => setAppMode('STUDENT')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all rounded-sm ${appMode === 'STUDENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><GraduationCap className="w-4 h-4" /> GMAO APPRENANT</button>
            <button onClick={() => setAppMode('EXPERT')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all rounded-sm ${appMode === 'EXPERT' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><HardHat className="w-4 h-4" /> INGÉNIERIE</button>
          </div>

          {appMode === 'EXPERT' && (
            <button onClick={() => { toggleInstructorMode(); setMaintenanceOpen(false); }} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all border ${instructorMode ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-orange-500 hover:text-orange-500'}`}><ShieldAlert className="w-4 h-4" /> FORMATEUR</button>
          )}

          <button onClick={() => { setMaintenanceOpen(!maintenanceOpen); if(instructorMode) toggleInstructorMode(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all border ${maintenanceOpen ? 'bg-blue-500 text-white border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-blue-400 hover:text-blue-400'}`}><Wrench className="w-4 h-4" /> INTERVENTIONS</button>

          <button onClick={() => setGuideOpen(true)} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-blue-500" title="Guide d'Utilisation">
            <BookOpen className="w-4 h-4" />
          </button>

          <a 
            href="https://tally.so/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all border bg-slate-800 text-purple-400 border-slate-600 hover:border-purple-500 hover:text-white hover:bg-purple-600"
            title="Suggérer une amélioration ou signaler un bug"
          >
            <MessageSquarePlus className="w-4 h-4" /> FEEDBACK
          </a>

          <div className="flex items-center gap-2 text-xs font-mono text-white bg-slate-950 px-3 py-1.5 rounded border border-slate-700 ml-2">
            <div className={`w-3 h-3 rounded-full shadow-inner ${fault !== 'NONE' ? 'bg-red-500 animate-pulse' : (powerOn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-slate-600')}`}></div>
            {fault !== 'NONE' ? 'DÉFAUT ACTIF' : (powerOn ? 'SYSTÈME EN LIGNE' : 'HORS TENSION')}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-4 pb-20 custom-scrollbar relative z-0">
        
        {instructorMode && appMode === 'EXPERT' && (
          <div className="bg-slate-900 border-l-4 border-orange-500 p-4 mb-4 rounded shadow-lg">
            <h3 className="text-orange-500 font-bold flex items-center gap-2 text-sm mb-4"><ShieldAlert className="w-4 h-4" /> INJECTION DE PANNES PHYSIQUES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 p-3 rounded border border-slate-700"><label className="text-slate-300 flex justify-between text-xs font-bold mb-2">Tension Ligne <span className="text-orange-400">{(400 * hardwareFaults.voltageDrop).toFixed(0)} V</span></label><input type="range" min="0.7" max="1.0" step="0.05" value={hardwareFaults.voltageDrop} onChange={(e) => setHardwareFault('voltageDrop', Number(e.target.value))} className="w-full accent-orange-500" /></div>
              <div className="bg-slate-800 p-3 rounded border border-slate-700"><label className="text-slate-300 flex justify-between text-xs font-bold mb-2">Usure Mécanique <span className="text-orange-400">x{hardwareFaults.bearingWear.toFixed(1)}</span></label><input type="range" min="1.0" max="5.0" step="0.5" value={hardwareFaults.bearingWear} onChange={(e) => setHardwareFault('bearingWear', Number(e.target.value))} className="w-full accent-orange-500" /></div>
              <div className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center"><label className="text-slate-300 font-bold text-xs">Coupure Phase (L3)</label><input type="checkbox" checked={hardwareFaults.phaseLoss} onChange={(e) => setHardwareFault('phaseLoss', e.target.checked)} className="w-5 h-5 accent-red-500" /></div>
            </div>
          </div>
        )}

        {maintenanceOpen && (
          <div className="bg-slate-900 border-l-4 border-blue-500 p-4 mb-4 rounded shadow-lg">
            <h3 className="text-blue-400 font-bold flex items-center gap-2 text-sm mb-4"><Wrench className="w-4 h-4" /> OUTILLAGE & CONSIGNATION (LOTO)</h3>
            {maintenanceFeedback && <div className={`p-2 mb-4 rounded text-sm font-bold border flex items-center gap-2 ${maintenanceFeedback.success ? 'bg-green-900/50 text-green-400 border-green-500' : 'bg-red-900/50 text-red-400 border-red-500'}`}><Info className="w-4 h-4" /> {maintenanceFeedback.msg}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => handleRepair('GRID')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded text-left transition-colors"><span className="text-white font-bold block mb-1">Régler Transformateur</span><span className="text-xs text-slate-400">Rétablit 400V.</span></button>
              <button onClick={() => handleRepair('BEARINGS')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded text-left transition-colors"><span className="text-white font-bold block mb-1">Remplacer Roulements</span><span className="text-xs text-slate-400">Élimine le grippage mécanique et les vibrations.</span></button>
              <button onClick={() => handleRepair('FUSES')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded text-left transition-colors"><span className="text-white font-bold block mb-1">Changer Fusibles (Q1)</span><span className="text-xs text-slate-400">Rétablit les 3 phases.</span></button>
            </div>
          </div>
        )}

        {appMode === 'STUDENT' && (
          <div className="bg-slate-900 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg p-5 mb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-700 pb-3 mb-4 gap-4">
              <h2 className="text-blue-400 font-bold text-lg flex items-center gap-2 tracking-wide"><Database className="w-5 h-5" /> GMAO - ORDRES DE TRAVAIL (Curatif)</h2>
              <button onClick={generateRandomMission} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-lg"><RefreshCcw className="w-4 h-4" /> GÉNÉRER MISSION</button>
            </div>
            
            {missionActive && currentMission ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-slate-800/50 p-4 rounded border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white text-sm font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-400"/> {currentMission.title}</h3>
                    <span className="bg-slate-950 px-2 py-1 rounded text-[10px] font-mono text-slate-400">{currentMission.id}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4 italic">&quot;{currentMission.context}&quot;</p>
                  <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
                    <span className="text-blue-400 font-bold">ÉQUIPEMENT:</span> Moteur Asynchrone Pn: {nameplate.Pn}kW<br/>
                    <span className="text-blue-400 font-bold">PROCÉDÉ:</span> {currentMission.equipmentInfo}
                  </div>
                </div>
                <div className="lg:col-span-2 flex flex-col justify-center gap-3 bg-slate-950/50 p-4 rounded border border-slate-800">
                  {currentMission.steps.map((desc, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm font-bold transition-all ${missionSteps[i] ? 'text-green-500' : (i===0 || missionSteps[i-1] ? 'text-white' : 'text-slate-600')}`}>
                      {missionSteps[i] ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />} Étape {i+1} : {desc}
                    </div>
                  ))}
                  {missionSteps[3] && <div className="mt-2 text-green-400 font-bold text-lg bg-green-950/50 py-2 px-4 rounded border border-green-800 text-center flex items-center justify-center gap-2"><Award className="w-6 h-6" /> MISSION VALIDÉE ! +100 POINTS</div>}
                </div>
              </div>
            ) : (<div className="text-slate-500 text-sm text-center py-6 font-mono">EN ATTENTE D&apos;UN ORDRE D&apos;INTERVENTION...</div>)}
          </div>
        )}

        {fault !== 'NONE' && (
          <div className="bg-red-950 border-l-4 border-red-500 p-4 mb-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 text-white">
              <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />
              <div className="flex flex-col gap-1"><h2 className="font-bold text-lg text-red-500 tracking-wide uppercase">{faultMsg}</h2><p className="text-red-200 text-sm font-semibold">{faultAdvice}</p></div>
            </div>
            <button onClick={ackFault} className={`font-bold py-2 px-6 text-sm rounded transition-all whitespace-nowrap border ${temperature > 60 && fault === 'OVERHEAT' ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white border-red-400'}`}>ACQUITTEMENT</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col gap-3 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 border-b border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-wider"><Settings2 className="w-4 h-4"/> 1. Plaque Signalétique</h2>
            <select value={motorType} onChange={(e) => setMotorType(e.target.value as MotorType)} disabled={appMode === 'STUDENT'} className="w-full bg-slate-950 text-white p-2 rounded text-xs border border-slate-800 disabled:opacity-50">
              <option value="SQUIRREL_CAGE">Cage d&apos;Écureuil (Induction)</option><option value="SLIP_RING">Rotor Bobiné (À bagues)</option>
            </select>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><label className="text-slate-500 block mb-1">Pn (kW)</label><input type="number" step="0.5" value={nameplate.Pn} onChange={(e) => updateNameplate('Pn', Number(e.target.value))} disabled={appMode === 'STUDENT'} className="w-full bg-slate-800 p-1.5 rounded text-white border border-slate-700 disabled:opacity-50" /></div>
              <div><label className="text-slate-500 block mb-1">Nn (tr/min)</label><input type="number" step="10" value={nameplate.Nn} onChange={(e) => updateNameplate('Nn', Number(e.target.value))} disabled={appMode === 'STUDENT'} className="w-full bg-slate-800 p-1.5 rounded text-white border border-slate-700 disabled:opacity-50" /></div>
              <div><label className="text-slate-500 block mb-1">Un (V)</label><input type="number" step="10" value={nameplate.Un} onChange={(e) => updateNameplate('Un', Number(e.target.value))} disabled={appMode === 'STUDENT'} className="w-full bg-slate-800 p-1.5 rounded text-white border border-slate-700 disabled:opacity-50" /></div>
              <div><label className="text-slate-500 block mb-1">Cos(φ)</label><input type="number" step="0.01" value={nameplate.cosPhi} onChange={(e) => updateNameplate('cosPhi', Number(e.target.value))} disabled={appMode === 'STUDENT'} className="w-full bg-slate-800 p-1.5 rounded text-white border border-slate-700 disabled:opacity-50" /></div>
            </div>
            <div className="mt-auto pt-2 border-t border-slate-800"><label className="text-blue-400 font-bold block text-xs mb-1">Courant Nominal In (A)</label><input type="number" value={nameplate.In} readOnly className="w-full bg-slate-950 p-2 rounded text-blue-400 font-bold border border-blue-900/50" /></div>
          </div>

          <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col gap-3 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 border-b border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-wider"><Activity className="w-4 h-4"/> 2. Process & Commande</h2>
            <div className="text-xs">
              <label className="text-slate-500 block mb-1">Application Mécanique</label>
              <select value={appType} onChange={(e) => setAppType(e.target.value as MechanicalApplication)} disabled={appMode === 'STUDENT'} className="w-full bg-slate-950 p-2 rounded text-white font-bold border border-slate-700 disabled:opacity-50">
                <option value="PUMP">Pompe Centrifuge</option><option value="CONVEYOR">Convoyeur à Bande</option><option value="HOIST">Treuil / Levage</option><option value="MIXER">Mélangeur Industriel</option>
              </select>
            </div>
            <div className="text-xs">
              <label className="text-slate-400 font-bold block mb-1 flex justify-between">Point de Fonctionnement <span className="text-blue-400">{loadParamPct.toFixed(0)} %</span></label>
              <input type="range" min="0" max="120" value={loadParamPct} onChange={(e) => setLoadParam(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div className="text-xs mt-auto pt-2 border-t border-slate-800">
              <label className="text-slate-500 block mb-1">Mode de Démarrage</label>
              <select value={startMethod} onChange={(e) => setStartMethod(e.target.value as StartMethod)} className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700">
                {motorType === 'SQUIRREL_CAGE' ? (<><option value="DOL_DELTA">Direct (DOL) Triangle</option><option value="DOL_STAR">Direct (DOL) Étoile</option><option value="STAR_DELTA">Automatique Y/Δ</option><option value="VFD">Variateur de Vitesse (VSD)</option></>) : (<option value="ROTORIC">Démarrage Rotorique</option>)}
              </select>
            </div>
            {startMethod === 'ROTORIC' && (<div className="flex gap-2 text-xs"><button onClick={() => setRotoricStep(0)} className={`flex-1 p-1.5 rounded border ${rotoricStep===0 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>R Max</button><button onClick={() => setRotoricStep(1)} className={`flex-1 p-1.5 rounded border ${rotoricStep===1 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>R Moy</button><button onClick={() => setRotoricStep(2)} className={`flex-1 p-1.5 rounded border ${rotoricStep===2 ? 'bg-green-600 text-white border-green-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>CC</button></div>)}
            {startMethod === 'VFD' && (<div className="text-xs"><label className="text-blue-400 flex justify-between">Consigne: {vfdFreq} Hz <span className="text-slate-400">Sortie: {actualVfdFreq.toFixed(1)} Hz</span></label><input type="range" min="10" max="60" value={vfdFreq} onChange={(e) => setVfdFreq(Number(e.target.value))} className="w-full accent-blue-500" /></div>)}
            <button onClick={togglePower} disabled={fault !== 'NONE'} className={`w-full p-2.5 rounded font-bold text-sm flex justify-center items-center gap-2 mt-2 shadow-lg transition-all ${fault !== 'NONE' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : powerOn ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500' : 'bg-green-600 hover:bg-green-500 text-white border border-green-500'}`}>{powerOn ? <><Square className="w-4 h-4 fill-current"/> ARRÊT MOTEUR</> : <><Play className="w-4 h-4 fill-current"/> DÉMARRAGE</>}</button>
          </div>

          <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col gap-2 shadow-md lg:col-span-1 xl:col-span-2 relative min-h-[250px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 z-10">
              <h2 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider"><Eye className="w-4 h-4" /> 3. Jumeau Numérique</h2>
              <div className="flex bg-slate-950 rounded border border-slate-700 p-0.5"><button onClick={() => setActiveTab('3D')} className={`px-3 py-1 text-[10px] font-bold rounded-sm uppercase tracking-widest ${activeTab === '3D' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>CAO 3D</button><button onClick={() => setActiveTab('WIRING')} className={`px-3 py-1 text-[10px] font-bold rounded-sm uppercase tracking-widest ${activeTab === 'WIRING' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Câblage</button></div>
            </div>
            {activeTab === '3D' && (
              <div className="flex justify-center mt-2 z-10"><div className="flex bg-slate-950 rounded-full border border-slate-700 p-1 shadow-inner"><button onClick={() => setVisualMode('PHYSICAL')} className={`px-4 py-1 text-[10px] font-bold rounded-full transition-all uppercase tracking-widest ${visualMode === 'PHYSICAL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Externe</button><button onClick={() => setVisualMode('INTERNAL')} className={`px-4 py-1 text-[10px] font-bold rounded-full transition-all uppercase tracking-widest ${visualMode === 'INTERNAL' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}>Interne</button></div></div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
              {activeTab === 'WIRING' ? <WiringSchematic powerOn={powerOn} isTripped={fault !== 'NONE'} driveMode={startMethod} motorType={motorType} rotoricStep={rotoricStep} /> : visualMode === 'PHYSICAL' ? <PhysicalMotorSVG rpm={displayRpm} temperature={temperature} torque={displayTorque} driveMode={startMethod} /> : <MotorSVG rpm={displayRpm} temperature={temperature} isTripped={fault !== 'NONE'} />}
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 w-full min-h-[350px]">
          <div className="w-full xl:w-2/5 bg-slate-900 p-4 rounded border border-slate-700 flex flex-col gap-3 shadow-md">
             <h2 className="text-xs font-bold text-slate-400 border-b border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-wider"><Gauge className="w-4 h-4"/> 4. Télémétrie Globale (ISO 10816)</h2>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner"><p className="text-[9px] text-slate-500 font-bold tracking-wider">VITESSE</p><p className="text-xl font-mono text-white">{displayRpm.toFixed(0)} <span className="text-[10px] text-slate-500">rpm</span></p></div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner"><p className="text-[9px] text-slate-500 font-bold tracking-wider">COURANT</p><p className={`text-xl font-mono ${displayCurrent > nameplate.In*1.15 ? 'text-red-500 font-bold' : 'text-blue-400'}`}>{displayCurrent.toFixed(1)} <span className="text-[10px] text-slate-500">A</span></p></div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner"><p className="text-[9px] text-slate-500 font-bold tracking-wider">TEMPÉRATURE</p><p className={`text-xl font-mono ${temperature > 90 ? 'text-red-500 animate-pulse font-bold' : 'text-white'}`}>{temperature.toFixed(0)} <span className="text-[10px] text-slate-500">°C</span></p></div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner"><p className="text-[9px] text-slate-500 font-bold tracking-wider">COUPLE</p><p className="text-xl font-mono text-orange-400">{displayTorque.toFixed(1)} <span className="text-[10px] text-slate-500">N.m</span></p></div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                  <p className="text-[9px] text-slate-500 font-bold tracking-wider z-10">VIBRATION RMS</p>
                  <p className={`text-xl font-mono z-10 ${vibrationRms < 4.5 ? 'text-green-400' : vibrationRms < 7.1 ? 'text-yellow-400' : 'text-red-500 font-bold animate-pulse'}`}>{vibrationRms.toFixed(1)} <span className="text-[10px] text-slate-500">mm/s</span></p>
                  {vibrationRms > 11.2 && <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>}
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center items-center shadow-inner"><p className="text-[9px] text-slate-500 font-bold tracking-wider">ACCÉLÉRATION</p><p className="text-xl font-mono text-purple-400">{acceleration.toFixed(1)} <span className="text-[10px] text-slate-500">rad/s²</span></p></div>
             </div>

             <div className="border-t border-slate-700 pt-2 mt-1 bg-slate-950/50 p-2 rounded">
               {appType === 'PUMP' && (<div className="grid grid-cols-2 gap-2"><div className="text-center"><p className="text-[9px] text-slate-500 font-bold tracking-wider">DÉBIT (m³/h)</p><p className="text-sm font-mono text-cyan-400">{processMetrics.flowRate.toFixed(1)}</p></div><div className="text-center"><p className="text-[9px] text-slate-500 font-bold tracking-wider">PRESSION (Bar)</p><p className="text-sm font-mono text-cyan-400">{processMetrics.pressure.toFixed(1)}</p></div></div>)}
               {appType === 'CONVEYOR' && <div className="text-center"><p className="text-[9px] text-slate-500 font-bold tracking-wider">VITESSE BANDE</p><p className="text-sm font-mono text-yellow-400">{processMetrics.speedMs.toFixed(2)} m/s</p></div>}
               {appType === 'HOIST' && <div className="text-center"><p className="text-[9px] text-slate-500 font-bold tracking-wider">VITESSE LEVAGE</p><p className="text-sm font-mono text-orange-400">{processMetrics.speedMs.toFixed(2)} m/s</p></div>}
               {appType === 'MIXER' && <div className="text-center"><p className="text-[9px] text-slate-500 font-bold tracking-wider">CISAILLEMENT</p><p className="text-sm font-mono text-purple-400">Actif</p></div>}
             </div>
          </div>

          <div className="w-full xl:w-3/5 bg-slate-900 p-4 rounded border border-slate-700 flex flex-col shadow-md min-h-[300px]">
            <h2 className="text-xs font-bold text-slate-400 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2 uppercase tracking-wider"><ChartIcon className="w-4 h-4"/> 5. Oscilloscope (Trend)</h2>
            <div className="flex-1 w-full h-full relative">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tickFormatter={(v)=>`${v}s`} fontSize={10} tickMargin={5} />
                    <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ffffff" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '12px' }} itemStyle={{ padding: 0 }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                    <Line yAxisId="left" type="stepAfter" dataKey="current" name="Courant (A)" stroke="#3b82f6" dot={false} strokeWidth={2} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="rpm" name="Vitesse (rpm)" stroke="#ffffff" dot={false} strokeWidth={2} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-left: 1px solid #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}