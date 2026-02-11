
import React from 'react';
import { PhysicsState, SourceType } from '../types';

interface Props {
  state: PhysicsState;
  setState: React.Dispatch<React.SetStateAction<PhysicsState>>;
}

const Controls: React.FC<Props> = ({ state, setState }) => {
  const updateState = (updates: Partial<PhysicsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="w-full sm:w-80 bg-black/60 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col gap-4 sm:gap-6">
      
      {/* Physical Parameters */}
      <div className="grid grid-cols-2 sm:block gap-4 sm:space-y-5">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Magnet Strength</label>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-400">{state.fieldStrength.toFixed(1)}T</span>
          </div>
          <input 
            type="range" min="0.1" max="5.0" step="0.1"
            value={state.fieldStrength}
            onChange={(e) => updateState({ fieldStrength: parseFloat(e.target.value) })}
            className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Coil Turns (N)</label>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-400">{state.turns}</span>
          </div>
          <input 
            type="range" min="1" max="50" step="1"
            value={state.turns}
            onChange={(e) => updateState({ turns: parseInt(e.target.value) })}
            className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
         <label className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Magnet Polarity</label>
         <button
            onClick={() => updateState({ isReversed: !state.isReversed })}
            className="flex h-10 items-center justify-between px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
         >
            <div className="flex items-center gap-3">
              <div className="flex items-center h-4 w-12 rounded-sm overflow-hidden border border-white/20">
                <div className={`h-full flex-1 transition-all duration-300 ${state.isReversed ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${state.isReversed ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                {state.isReversed ? 'S | N' : 'N | S'}
              </span>
            </div>
            <i className="fa-solid fa-rotate text-[10px] text-gray-500 group-hover:text-white transition-colors"></i>
         </button>
      </div>

      {state.sourceType === SourceType.AC_COIL && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">AC Frequency</label>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-400">{state.acFrequency.toFixed(1)}Hz</span>
          </div>
          <input 
            type="range" min="0.1" max="5.0" step="0.1"
            value={state.acFrequency}
            onChange={(e) => updateState({ acFrequency: parseFloat(e.target.value) })}
            className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* Bottom Toggles */}
      <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-4 border-t border-white/5">
        <button
          onClick={() => updateState({ sourceType: SourceType.DC_MAGNET })}
          className={`flex-1 h-10 sm:h-12 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl transition-all border ${
            state.sourceType === SourceType.DC_MAGNET 
            ? 'bg-indigo-600 border-indigo-500 text-white' 
            : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <i className="fa-solid fa-magnet text-[10px] sm:text-xs"></i>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">DC</span>
        </button>
        <button
          onClick={() => updateState({ sourceType: SourceType.AC_COIL })}
          className={`flex-1 h-10 sm:h-12 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl transition-all border ${
            state.sourceType === SourceType.AC_COIL 
            ? 'bg-indigo-600 border-indigo-500 text-white' 
            : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <i className="fa-solid fa-bolt text-[10px] sm:text-xs"></i>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">AC</span>
        </button>
        
        <button 
          onClick={() => updateState({ isPaused: !state.isPaused })}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
            state.isPaused 
              ? 'bg-green-500 text-white' 
              : 'bg-white/10 text-white'
          }`}
        >
          {state.isPaused ? <i className="fa-solid fa-play text-sm"></i> : <i className="fa-solid fa-pause text-sm"></i>}
        </button>
      </div>
    </div>
  );
};

export default Controls;
