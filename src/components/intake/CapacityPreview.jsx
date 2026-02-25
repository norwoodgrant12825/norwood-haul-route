import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, Lock } from "lucide-react";
import CapacityBar from "../shared/CapacityBar";

export default function CapacityPreview({ selectedDate }) {
  const { data: orders = [] } = useQuery({
    queryKey: ["date-orders", selectedDate],
    queryFn: () => base44.entities.DeliveryOrder.filter({ delivery_date: selectedDate }),
    enabled: !!selectedDate,
  });

  const { data: capacityData } = useQuery({
    queryKey: ["date-capacity", selectedDate],
    queryFn: async () => {
      const caps = await base44.entities.DailyCapacity.filter({ date: selectedDate });
      return caps[0] || { total_slots: 20, total_yards_capacity: 200, is_locked: false };
    },
    enabled: !!selectedDate,
  });

  if (!selectedDate) return null;

  const cap = capacityData || { total_slots: 20, total_yards_capacity: 200, is_locked: false };
  const activeOrders = orders.filter(o => o.status !== "Cancelled");
  const slotsUsed = activeOrders.length;
  const yardsUsed = activeOrders.reduce((sum, o) => sum + (o.quantity_yards || 0), 0);
  const isFull = slotsUsed >= cap.total_slots || cap.is_locked;

  const amCount = activeOrders.filter(o => o.time_slot === "AM").length;
  const midCount = activeOrders.filter(o => o.time_slot === "Midday").length;
  const pmCount = activeOrders.filter(o => o.time_slot === "PM").length;

  return (
    <div className={`rounded-xl border p-4 ${
      isFull
        ? "bg-red-500/5 border-red-500/30"
        : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)]"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {isFull ? (
          <>
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Date Full — Cannot Schedule</span>
          </>
        ) : slotsUsed >= cap.total_slots * 0.8 ? (
          <>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Limited Availability</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">Available</span>
          </>
        )}
      </div>

      <div className="space-y-3">
        <CapacityBar used={slotsUsed} total={cap.total_slots} label="Delivery Slots" />
        <CapacityBar used={yardsUsed} total={cap.total_yards_capacity} label="Yardage" unit=" yd" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "AM", count: amCount },
          { label: "Midday", count: midCount },
          { label: "PM", count: pmCount },
        ].map(slot => (
          <div key={slot.label} className="text-center py-2 rounded-lg bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,15%)]">
            <p className="text-xs text-gray-500">{slot.label}</p>
            <p className="text-sm font-bold">{slot.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}