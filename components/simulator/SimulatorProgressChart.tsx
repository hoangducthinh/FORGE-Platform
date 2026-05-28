'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface HistoryRecord {
  date: string;
  score: number;
  outcome: string;
  persona: string;
  productName: string;
}

export function SimulatorProgressChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const historyData = localStorage.getItem('forge-simulator-history');
    if (historyData) {
      try {
        const parsed: HistoryRecord[] = JSON.parse(historyData);
        // Format data for chart
        const formatted = parsed.map((item, index) => ({
          name: `S${index + 1}`,
          date: format(new Date(item.date), 'MMM dd, HH:mm'),
          score: item.score,
          fullData: item,
        }));
        setData(formatted);
      } catch (e) {
        console.error('Error parsing history', e);
      }
    }
  }, []);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-gray-200 dark:border-slate-700 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Simulation Data Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Complete a sales simulation to see your progress chart here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Simulator Progress</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your recent sales performance scores</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload.fullData;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 shadow-md rounded-md">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Score: {payload[0].value}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Product: {d.productName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">Persona: {d.persona.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Date: {format(new Date(d.date), 'MMM dd, HH:mm')}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#ea580c"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
