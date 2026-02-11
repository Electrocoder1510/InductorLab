
import React, { useState, useEffect } from 'react';
import { PhysicsState, CalculatedData } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  state: PhysicsState;
  data: CalculatedData;
}

const ExplanationPanel: React.FC<Props> = ({ state, data }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAiExplanation = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Explain the current state of this Faraday's Law simulation:
        Magnet Position: X:${state.magnetX}mm, Y:${state.magnetY}mm
        Field Strength: ${state.fieldStrength}T
        Coil Turns: ${state.turns}
        Current Induced EMF: ${data.emf.toFixed(4)}V
        Current Flux: ${data.flux.toFixed(4)}Wb
        Current Rate of Change of Flux (dPhi/dt): ${data.dFluxDt.toFixed(4)}Wb/s`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are an expert physics professor. Provide a concise 3-4 sentence explanation of what is happening physically, focusing on Lenz's Law and the cause of the EMF. Provide deep insights appropriate for a university undergraduate.`,
        },
      });

      setAiAnalysis(response.text || "Unable to generate explanation.");
    } catch (err) {
      console.error('Gemini API Error:', err);
      setAiAnalysis("Error connecting to the AI Tutor. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.isPaused) {
      fetchAiExplanation();
    } else {
      setAiAnalysis(null);
    }
  }, [state.isPaused]);

  const getBasicExplanation = () => {
    if (Math.abs(data.dFluxDt) < 0.001) {
      return "The magnetic flux is constant. No EMF is being induced because there is no change in the magnetic environment of the coil.";
    }
    const direction = data.dFluxDt > 0 ? "increasing" : "decreasing";
    return `The magnetic flux through the coil is ${direction}. According to Faraday's Law, this change induces an EMF of ${data.emf.toFixed(2)}V. Lenz's Law states the induced current will create its own magnetic field to oppose this ${direction} flux.`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold dark:text-gray-100">
            <i className="fa-solid fa-graduation-cap mr-2 text-indigo-500"></i>
            Live Tutor Insights
        </h2>
        {state.isPaused && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase tracking-wider">Analysis Mode</span>
        )}
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-indigo-500">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
            "{getBasicExplanation()}"
          </p>
        </div>

        {state.isPaused && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-fade-in">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Deep Insights (AI Powered)</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-indigo-500 py-2">
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span className="text-sm">Synthesizing physical derivation...</span>
              </div>
            ) : (
              <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                {aiAnalysis}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 pt-4">
           <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Formula</span>
              <span className="text-sm font-serif italic font-bold text-indigo-600 dark:text-indigo-400">ε = -N (dΦ/dt)</span>
           </div>
           <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Magnetic Flux (Φ)</span>
              <span className="text-sm font-mono font-bold dark:text-gray-200">{data.flux.toFixed(2)} Wb</span>
           </div>
           <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Induced EMF (ε)</span>
              <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">{data.emf.toFixed(2)} V</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
