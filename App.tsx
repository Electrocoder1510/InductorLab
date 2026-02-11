
import React, { useState, useEffect, useRef } from 'react';
import { PhysicsState, CalculatedData, SourceType, HistoryPoint } from './types';
import { calculatePhysics } from './services/physicsEngine';
import Controls from './components/Controls';
import SimulationCanvas from './components/SimulationCanvas';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [state, setState] = useState<PhysicsState>({
    magnetX: -80,
    magnetY: 0,
    magnetVelocity: 0,
    fieldStrength: 1.5,
    isReversed: false,
    turns: 12,
    isPaused: false,
    sourceType: SourceType.DC_MAGNET,
    acFrequency: 1.0,
    currentTime: 0
  });

  const [data, setData] = useState<CalculatedData>({
    flux: 0,
    dFluxDt: 0,
    emf: 0,
    currentDirection: 0
  });

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastStateRef = useRef<PhysicsState>(state);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMove = (x: number, y: number) => {
    setState(prev => ({ ...prev, magnetX: x, magnetY: y }));
  };

  useEffect(() => {
    const update = (time: number) => {
      if (!state.isPaused) {
        const dt = 0.016; 
        
        const vel = (state.magnetX - lastStateRef.current.magnetX) / dt;
        lastStateRef.current = state;

        const results = calculatePhysics({ ...state, magnetVelocity: vel, currentTime: time / 1000 }, dt);
        setData(results);

        setHistory(prev => {
          const newPoint = { time: Date.now(), emf: results.emf, flux: results.flux };
          return [...prev, newPoint].slice(-100);
        });

        setState(prev => ({
            ...prev,
            currentTime: prev.currentTime + dt
        }));
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [state.isPaused, state.magnetX, state.magnetY, state.fieldStrength, state.isReversed, state.turns, state.sourceType, state.acFrequency]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {/* Background Simulation - Lowest Layer */}
      <div className="absolute inset-0 z-0">
        <SimulationCanvas 
          state={state} 
          data={data} 
          isDarkMode={isDarkMode} 
          isUiVisible={isUiVisible}
          onPositionChange={handleMove} 
        />
      </div>

      {/* Overlay: Header - Hides completely to allow background clicks */}
      <nav className="absolute top-0 left-0 right-0 z-50 pointer-events-none p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div className={`flex items-center gap-3 sm:gap-4 bg-black/40 backdrop-blur-md px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 ${isUiVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-atom text-base sm:text-xl"></i>
            </div>
            <div>
              <h1 className="text-sm sm:text-xl font-black leading-none tracking-tight">InductorLab</h1>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Visualization</p>
            </div>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setIsUiVisible(!isUiVisible)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all ${!isUiVisible ? 'bg-indigo-600/50 border-indigo-500/50' : ''}`}
              title={isUiVisible ? "Hide Controls" : "Show Controls"}
            >
              <i className={`fa-solid ${isUiVisible ? 'fa-eye' : 'fa-eye-slash'} text-[10px] sm:text-sm`}></i>
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
            >
              {isDarkMode ? <i className="fa-solid fa-sun text-[10px] sm:text-sm"></i> : <i className="fa-solid fa-moon text-[10px] sm:text-sm"></i>}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay: Telemetry Card - Stays visible as requested */}
      <div className="absolute top-20 left-4 right-4 sm:top-auto sm:bottom-8 sm:left-8 sm:right-auto z-40 pointer-events-none">
        <div className="pointer-events-auto w-full sm:w-72 bg-black/60 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className={`w-2 h-2 rounded-full ${Math.abs(data.emf) > 0.01 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Live Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:block gap-4 sm:space-y-5">
            <div>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-0.5 sm:mb-1">Flux (Φ)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-2xl font-mono font-bold">{data.flux.toFixed(3)}</span>
                <span className="text-[8px] sm:text-xs text-gray-500 font-bold uppercase">Wb</span>
              </div>
            </div>

            <div>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-0.5 sm:mb-1">EMF (ε)</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg sm:text-2xl font-mono font-bold transition-colors ${Math.abs(data.emf) > 0.05 ? 'text-green-400' : 'text-gray-300'}`}>
                  {data.emf.toFixed(3)}
                </span>
                <span className="text-[8px] sm:text-xs text-gray-500 font-bold uppercase">V</span>
              </div>
            </div>

            <div className="col-span-2 pt-2 sm:pt-4 border-t border-white/5 flex justify-between">
              <div>
                <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Pos</p>
                <p className="text-[10px] sm:text-xs font-mono font-bold text-indigo-400">
                    X:{state.magnetX.toFixed(0)} Y:{state.magnetY.toFixed(0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Flow</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase">
                  {data.currentDirection === 0 ? 'Static' : data.currentDirection > 0 ? 'CW' : 'CCW'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay: Controls Card - Completely disables pointer events when hidden */}
      <div className={`absolute bottom-4 left-4 right-4 sm:bottom-8 sm:right-8 sm:left-auto z-40 pointer-events-none transition-all duration-500 ease-in-out ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className={`${isUiVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <Controls 
            state={state} 
            setState={setState} 
          />
        </div>
      </div>

      {/* Center Top Message */}
      <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center transition-all duration-700 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
            Interactive Physics Environment
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
