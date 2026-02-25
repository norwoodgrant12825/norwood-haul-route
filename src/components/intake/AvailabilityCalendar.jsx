import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isBefore, startOfDay } from "date-fns";

function useDateCapacities(year, month) {
  // Fetch orders for the visible month range
  const monthStart = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");

  const { data: orders = [] } = useQuery({
    queryKey: ["cal-orders", year, month],
    queryFn: () => base44.entities.DeliveryOrder.filter({}),
    staleTime: 30000,
  });

  const { data: capacities = [] } = useQuery({
    queryKey: ["cal-capacities", year, month],
    queryFn: () => base44.entities.DailyCapacity.filter({}),
    staleTime: 30000,
  });

  return { orders, capacities };
}

export default function AvailabilityCalendar({ selectedDate, onSelect }) {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = React.useState(() => {
    if (selectedDate) return new Date(selectedDate + "T00:00:00");
    return today;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const { orders, capacities } = useDateCapacities(year, month);

  // Build a map of date => { slotsUsed, totalSlots, isLocked }
  const dayStatus = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!o.delivery_date || o.status === "Cancelled") return;
      map[o.delivery_date] = (map[o.delivery_date] || 0) + 1;
    });
    const capMap = {};
    capacities.forEach(c => {
      capMap[c.date] = c;
    });

    const result = {};
    // For all dates that have orders or capacity records
    const allDates = new Set([...Object.keys(map), ...Object.keys(capMap)]);
    allDates.forEach(d => {
      const cap = capMap[d] || { total_slots: 20, is_locked: false };
      const used = map[d] || 0;
      const pct = used / cap.total_slots;
      result[d] = {
        used,
        total: cap.total_slots,
        isLocked: cap.is_locked,
        isFull: cap.is_locked || used >= cap.total_slots,
        isLimited: !cap.is_locked && pct >= 0.7 && used < cap.total_slots,
      };
    });
    return result;
  }, [orders, capacities]);

  const calStart = startOfWeek(startOfMonth(new Date(year, month)));
  const calEnd = endOfWeek(endOfMonth(new Date(year, month)));

  const days = [];
  let cur = calStart;
  while (cur <= calEnd) {
    days.push(cur);
    cur = addDays(cur, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : null;

  return (
    <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{format(new Date(year, month), "MMMM yyyy")}</span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {week.map((day, di) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = day.getMonth() === month;
            const isPast = isBefore(day, today);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDateObj && isSameDay(day, selectedDateObj);
            const status = dayStatus[dateStr];
            const isFull = status?.isFull;
            const isLimited = status?.isLimited;
            const isDisabled = isPast || isFull;

            let bgClass = "hover:bg-white/10";
            let textClass = isCurrentMonth ? "text-white" : "text-gray-700";
            let dotColor = null;

            if (isFull) {
              bgClass = "bg-red-500/10";
              textClass = "text-red-500/60 cursor-not-allowed";
            } else if (isLimited) {
              dotColor = "bg-yellow-400";
            } else if (status && status.used > 0) {
              dotColor = "bg-green-500";
            }

            if (isSelected) {
              bgClass = "bg-amber-500 hover:bg-amber-600";
              textClass = "text-black font-bold";
            } else if (isToday && !isFull) {
              bgClass = "ring-1 ring-amber-500/60 hover:bg-white/10";
            }

            if (isPast && !isSelected) {
              textClass = "text-gray-700 cursor-not-allowed";
              bgClass = "";
            }

            return (
              <button
                key={di}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelect(dateStr)}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-colors ${bgClass} ${textClass} ${isDisabled ? "pointer-events-none" : ""}`}
              >
                <span>{format(day, "d")}</span>
                {dotColor && !isSelected && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${dotColor}`} />
                )}
                {isFull && isCurrentMonth && !isPast && (
                  <span className="w-1 h-1 rounded-full mt-0.5 bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[hsl(0,0%,15%)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-gray-500">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-gray-500">Limited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-gray-500">Full</span>
        </div>
      </div>
    </div>
  );
}