import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue }) {
  const isPositive = trend === 'up';

  return (
    <div className="bg-[#2a2a2a] rounded-xl p-6 md:p-8 border border-[#333333] hover:border-[#00c600]/50 transition-all">
      <div className="flex items-start justify-between mb-5">
        <div className="p-3 bg-[#00c600]/15 rounded-xl">
          <Icon className="w-6 h-6 text-[#00c600]" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2 leading-snug">{title}</h3>
      <p className="text-white text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}
