
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryPoint } from '../types';

interface Props {
  history: HistoryPoint[];
  isDarkMode: boolean;
}

const Graphs: React.FC<Props> = ({ history, isDarkMode }) => {
  const gridColor = isDarkMode ? '#374151' : '#f3f4f6';
  const labelStyle = { fontSize: '10px', fill: isDarkMode ? '#9ca3af' : '#6b7280' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-64">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">Induced EMF (ε) vs Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[-100, 100]} stroke={labelStyle.fill} fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Line type="monotone" dataKey="emf" stroke="#6366f1" strokeWidth={2} dot={false} animationDuration={0} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-64">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">Magnetic Flux (Φ) vs Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[-500, 500]} stroke={labelStyle.fill} fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#f59e0b' }}
            />
            <Line type="monotone" dataKey="flux" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={0} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Graphs;
