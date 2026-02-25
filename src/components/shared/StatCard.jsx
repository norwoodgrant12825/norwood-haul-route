import React from "react";

export default function StatCard({ label, value, icon: Icon, accent = false, subtitle }) {
  return (
    <div className={`
      rounded-xl border p-4
      ${accent
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)]"
      }
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent ? "text-amber-500" : "text-white"}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center
            ${accent ? "bg-amber-500/20" : "bg-white/5"}
          `}>
            <Icon className={`w-4.5 h-4.5 ${accent ? "text-amber-500" : "text-gray-400"}`} />
          </div>
        )}
      </div>
    </div>
  );
}