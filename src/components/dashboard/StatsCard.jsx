import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue }) {
  const isPositive = trend === 'up';
  
  return (
    <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#333333] hover:border-[#00c600] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-[#00c600] bg-opacity-10 rounded-lg">
          <Icon className="w-6 h-6 text-[#00c600]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-500 bg-opacity-10 text-green-400' : 'bg-red-500 bg-opacity-10 text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  );
}