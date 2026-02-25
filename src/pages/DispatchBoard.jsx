import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar, Truck, Package, MapPin,
  ChevronLeft, ChevronRight, Plus, User,
  GripVertical, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import StatCard from "../components/shared/StatCard";
import StatusBadge from "../components/shared/StatusBadge";
import CapacityBar from "../components/shared/CapacityBar";
import RouteCard from "../components/dispatch/RouteCard";

export default function DispatchBoard() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [assignDialog, setAssignDialog] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["dispatch-orders", selectedDate],
    queryFn: () => base44.entities.DeliveryOrder.filter({ delivery_date: selectedDate }),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["dispatch-routes", selectedDate],
    queryFn: () => base44.entities.Route.filter({ date: selectedDate }),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === "driver" && u.is_active !== false);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeliveryOrder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const createRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.Route.create(data),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const handleReorder = async (routeId, reorderedOrders) => {
    // Save new stop_order for each order
    await Promise.all(
      reorderedOrders.map((order, idx) =>
        base44.entities.DeliveryOrder.update(order.id, { stop_order: idx + 1 })
      )
    );
    queryClient.invalidateQueries();
  };

  const activeOrders = orders.filter(o => o.status !== "Cancelled");
  const totalYards = activeOrders.reduce((s, o) => s + (o.quantity_yards || 0), 0);
  const totalRevenue = activeOrders.reduce((s, o) => s + (o.revenue || 0), 0);
  const unassigned = activeOrders.filter(o => !o.assigned_driver);

  const navigateDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  const handleAssign = () => {
    if (!assignDialog || !selectedDriver) return;
    const driver = drivers.find(d => d.email === selectedDriver);
    updateOrderMutation.mutate({
      id: assignDialog.id,
      data: {
        assigned_driver: selectedDriver,
        assigned_driver_name: driver?.full_name || selectedDriver,
        status: "Scheduled"
      }
    });
    setAssignDialog(null);
    setSelectedDriver("");
  };

  const handleAutoRoute = async () => {
    // Group unassigned orders and create routes
    if (unassigned.length === 0 || drivers.length === 0) return;

    const ordersPerDriver = Math.ceil(unassigned.length / drivers.length);
    for (let i = 0; i < drivers.length && i * ordersPerDriver < unassigned.length; i++) {
      const driverOrders = unassigned.slice(i * ordersPerDriver, (i + 1) * ordersPerDriver);
      const driver = drivers[i];

      const route = await base44.entities.Route.create({
        name: `Route ${i + 1} - ${driver.full_name}`,
        date: selectedDate,
        assigned_driver: driver.email,
        assigned_driver_name: driver.full_name,
        total_yards: driverOrders.reduce((s, o) => s + (o.quantity_yards || 0), 0),
        total_stops: driverOrders.length,
        status: "Planned",
        order_ids: driverOrders.map(o => o.id),
      });

      for (let j = 0; j < driverOrders.length; j++) {
        await base44.entities.DeliveryOrder.update(driverOrders[j].id, {
          assigned_driver: driver.email,
          assigned_driver_name: driver.full_name,
          route_id: route.id,
          stop_order: j + 1,
          status: "Scheduled",
        });
      }
    }
    queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dispatch Board</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="text-gray-400 hover:text-white hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white w-44"
          />
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} className="text-gray-400 hover:text-white hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Loads" value={activeOrders.length} icon={Package} accent />
        <StatCard label="Total Yards" value={`${totalYards} yd`} icon={Truck} />
        <StatCard label="Unassigned" value={unassigned.length} icon={User} />
        <StatCard label="Routes" value={routes.length} icon={MapPin} />
      </div>

      {/* Capacity */}
      <CapacityBar used={activeOrders.length} total={20} label="Delivery Slots" />

      {/* Actions */}
      {unassigned.length > 0 && (
        <Button
          onClick={handleAutoRoute}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium gap-2"
        >
          <Truck className="w-4 h-4" /> Auto-Route {unassigned.length} Unassigned Orders
        </Button>
      )}

      {/* Routes */}
      {routes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Routes</h2>
          {routes.map(route => {
            const routeOrders = orders.filter(o => o.route_id === route.id);
            return (
              <RouteCard
                key={route.id}
                route={route}
                orders={routeOrders}
                onReorder={handleReorder}
              />
            );
          })}
        </div>
      )}

      {/* Unassigned Orders */}
      {unassigned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Unassigned Orders</h2>
          {unassigned.filter(o => !o.route_id).map(order => (
            <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{order.customer_name}</p>
                <p className="text-xs text-gray-500 truncate">{order.address} · {order.material_type} · {order.quantity_yards} yd</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssignDialog(order)}
                className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 text-xs"
              >
                Assign
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* All orders if no routes */}
      {routes.length === 0 && unassigned.length === 0 && activeOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">All Orders</h2>
          {activeOrders.map(order => (
            <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{order.customer_name}</p>
                <p className="text-xs text-gray-500 truncate">{order.address} · {order.material_type} · {order.quantity_yards} yd</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>
      )}

      {activeOrders.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No orders for this date</p>
        </div>
      )}

      {/* Assign Driver Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)] text-white">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            Assign a driver to: <span className="text-white font-medium">{assignDialog?.customer_name}</span>
          </p>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white">
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)]">
              {drivers.map(d => (
                <SelectItem key={d.email} value={d.email} className="text-white hover:bg-white/10">
                  {d.full_name} {d.truck_number ? `(${d.truck_number})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignDialog(null)} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedDriver} className="bg-amber-500 hover:bg-amber-600 text-black">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}