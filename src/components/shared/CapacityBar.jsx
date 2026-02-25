import React from "react";

export default function CapacityBar({ used, total, label, unit = "" }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";
  const textColor = pct >= 90 ? "text-red-400" : pct >= 70 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={textColor}>
          {used}{unit} / {total}{unit}
        </span>
      </div>
      <div className="h-2 bg-[hsl(0,0%,15%)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}