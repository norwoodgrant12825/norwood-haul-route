import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Truck, Package, MapPin, DollarSign,
  Calendar, Plus, ArrowRight, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import StatCard from "../components/shared/StatCard";
import CapacityBar from "../components/shared/CapacityBar";
import StatusBadge from "../components/shared/StatusBadge";

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayOrders = [] } = useQuery({
    queryKey: ["orders-today"],
    queryFn: () => base44.entities.DeliveryOrder.filter({ delivery_date: today }),
  });

  const { data: todayRoutes = [] } = useQuery({
    queryKey: ["routes-today"],
    queryFn: () => base44.entities.Route.filter({ date: today }),
  });

  const { data: capacity } = useQuery({
    queryKey: ["capacity-today"],
    queryFn: async () => {
      const caps = await base44.entities.DailyCapacity.filter({ date: today });
      return caps[0] || { total_slots: 20, slots_used: 0, total_yards_capacity: 200, yards_scheduled: 0 };
    },
  });

  const totalYards = todayOrders.reduce((sum, o) => sum + (o.quantity_yards || 0), 0);
  const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.revenue || 0), 0);
  const delivered = todayOrders.filter(o => o.status === "Delivered").length;
  const inTransit = todayOrders.filter(o => o.status === "In Transit").length;
  const slotsUsed = todayOrders.filter(o => o.status !== "Cancelled").length;
  const cap = capacity || { total_slots: 20, slots_used: 0, total_yards_capacity: 200, yards_scheduled: 0 };

  const capacityStatus = slotsUsed >= cap.total_slots ? "Full" : slotsUsed >= cap.total_slots * 0.8 ? "Near Full" : "Open";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Dispatch</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("IntakeForm")}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-medium gap-2">
              <Plus className="w-4 h-4" /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Loads" value={todayOrders.length} icon={Package} accent />
        <StatCard label="Total Yards" value={`${totalYards} yd`} icon={Truck} />
        <StatCard label="Delivered" value={delivered} icon={MapPin} subtitle={`${inTransit} in transit`} />
        <StatCard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      {/* Capacity */}
      <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Today's Capacity
          </h2>
          <StatusBadge status={capacityStatus} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <CapacityBar used={slotsUsed} total={cap.total_slots} label="Delivery Slots" />
          <CapacityBar used={totalYards} total={cap.total_yards_capacity} label="Yardage" unit=" yd" />
        </div>
      </div>

      {/* Routes and Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Active Routes */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Active Routes
            </h2>
            <Link to={createPageUrl("DispatchBoard")} className="text-amber-500 text-xs hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {todayRoutes.length === 0 ? (
            <p className="text-sm text-gray-600 py-8 text-center">No routes scheduled today</p>
          ) : (
            <div className="space-y-2">
              {todayRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,15%)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{route.name}</p>
                      <p className="text-xs text-gray-500">
                        {route.assigned_driver_name || "Unassigned"} · {route.total_stops || 0} stops · {route.total_yards || 0} yd
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={route.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Today's Orders
            </h2>
            <span className="text-xs text-gray-500">{todayOrders.length} orders</span>
          </div>
          {todayOrders.length === 0 ? (
            <p className="text-sm text-gray-600 py-8 text-center">No orders for today</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {todayOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,15%)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.material_type} · {order.quantity_yards} yd · {order.time_slot || "TBD"}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}