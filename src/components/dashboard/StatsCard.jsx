import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue }) {
  const isPositive = trend === 'up';

  return (
    <div className="bg-kg-surface rounded-xl p-6 md:p-8 border border-kg-green/25 hover:border-kg-green/40 hover:shadow-kg-glow-sm transition-all">
      <div className="flex items-start justify-between mb-5">
        <div className="p-3 bg-kg-green-muted rounded-xl border border-kg-green/20">
          <Icon className="w-6 h-6 text-kg-green" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-normal ${
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
      <h3 className="text-gray-400 text-[13px] font-normal mb-2 leading-snug">{title}</h3>
      <p className="text-white text-2xl font-medium tracking-tight">{value}</p>
    </div>
  );
}
