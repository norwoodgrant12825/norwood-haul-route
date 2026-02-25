import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Truck, Package, Clock, CheckCircle } from "lucide-react";
import StatCard from "../components/shared/StatCard";
import ClockInOut from "../components/driver/ClockInOut";
import DriverStopCard from "../components/driver/DriverStopCard";
import DeliveryVerification from "../components/driver/DeliveryVerification";

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myOrders = [] } = useQuery({
    queryKey: ["my-orders", user?.email, today],
    queryFn: () => base44.entities.DeliveryOrder.filter({
      assigned_driver: user.email,
      delivery_date: today,
    }),
    enabled: !!user?.email,
  });

  const { data: timeLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["my-logs", user?.email, today],
    queryFn: () => base44.entities.TimeLog.filter({
      driver_email: user.email,
      date: today,
    }),
    enabled: !!user?.email,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeliveryOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setCompletingOrder(null);
    },
  });

  const sortedOrders = [...myOrders].sort((a, b) => (a.stop_order || 99) - (b.stop_order || 99));
  const delivered = sortedOrders.filter(o => o.status === "Delivered").length;
  const totalYards = sortedOrders.reduce((s, o) => s + (o.quantity_yards || 0), 0);
  const currentStop = sortedOrders.find(o => o.status !== "Delivered" && o.status !== "Cancelled");

  const handleNavigate = (order) => {
    const addr = encodeURIComponent(order.address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, "_blank");
  };

  const handleMarkArrived = async (order) => {
    await base44.entities.DeliveryOrder.update(order.id, {
      status: "In Transit",
      arrival_time: new Date().toISOString(),
    });
    await base44.entities.TimeLog.create({
      driver_email: user.email,
      driver_name: user.full_name,
      log_type: "job_arrival",
      timestamp: new Date().toISOString(),
      order_id: order.id,
      date: today,
    });
    queryClient.invalidateQueries();
  };

  const handleCompleteDelivery = async ({ loadPhoto, dumpPhoto, sitePhoto, notes }) => {
    await base44.entities.DeliveryOrder.update(completingOrder.id, {
      status: "Delivered",
      load_photo_url: loadPhoto,
      dump_photo_url: dumpPhoto,
      site_photo_url: sitePhoto,
      driver_notes: notes,
      completion_time: new Date().toISOString(),
    });
    await base44.entities.TimeLog.create({
      driver_email: user.email,
      driver_name: user.full_name,
      log_type: "job_complete",
      timestamp: new Date().toISOString(),
      order_id: completingOrder.id,
      date: today,
    });
    queryClient.invalidateQueries();
    setCompletingOrder(null);
  };

  if (!user) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (completingOrder) {
    return (
      <DeliveryVerification
        order={completingOrder}
        onSubmit={handleCompleteDelivery}
        onCancel={() => setCompletingOrder(null)}
        isSubmitting={updateOrderMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Route</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {format(new Date(), "EEEE, MMMM d")} · {user.full_name}
        </p>
      </div>

      {/* Clock In/Out */}
      <ClockInOut user={user} todayLogs={timeLogs} onClockAction={refetchLogs} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Stops" value={sortedOrders.length} icon={Package} />
        <StatCard label="Done" value={delivered} icon={CheckCircle} />
        <StatCard label="Yards" value={totalYards} icon={Truck} />
      </div>

      {/* Stops */}
      {sortedOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No stops assigned for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Today's Stops ({sortedOrders.length})
          </h2>
          {sortedOrders.map((order, idx) => (
            <DriverStopCard
              key={order.id}
              order={order}
              index={idx}
              isActive={currentStop?.id === order.id}
              onSelect={setCompletingOrder}
              onNavigate={handleNavigate}
              onMarkArrived={handleMarkArrived}
            />
          ))}
        </div>
      )}
    </div>
  );
}