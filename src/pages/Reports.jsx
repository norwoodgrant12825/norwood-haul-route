import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Package, Truck, Clock, DollarSign,
  Calendar, Download, ChevronLeft, ChevronRight
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
import StatCard from "../components/shared/StatCard";

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export default function Reports() {
  const [dateRange, setDateRange] = useState("week");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: allOrders = [] } = useQuery({
    queryKey: ["report-orders"],
    queryFn: () => base44.entities.DeliveryOrder.list("-delivery_date", 500),
  });

  const { data: allTimeLogs = [] } = useQuery({
    queryKey: ["report-logs"],
    queryFn: () => base44.entities.TimeLog.list("-date", 1000),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["report-drivers"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === "driver");
    },
  });

  // Filter orders by date range
  const filteredOrders = allOrders.filter(o => {
    if (!o.delivery_date) return false;
    return o.delivery_date >= startDate && o.delivery_date <= endDate;
  });

  const delivered = filteredOrders.filter(o => o.status === "Delivered");
  const totalYards = delivered.reduce((s, o) => s + (o.quantity_yards || 0), 0);
  const totalRevenue = delivered.reduce((s, o) => s + (o.revenue || 0), 0);

  // Loads per day chart
  const loadsByDay = {};
  filteredOrders.forEach(o => {
    const day = o.delivery_date;
    if (!loadsByDay[day]) loadsByDay[day] = { date: day, loads: 0, yards: 0 };
    loadsByDay[day].loads += 1;
    loadsByDay[day].yards += o.quantity_yards || 0;
  });
  const dailyChart = Object.values(loadsByDay).sort((a, b) => a.date.localeCompare(b.date));

  // Material breakdown
  const materialBreakdown = {};
  filteredOrders.forEach(o => {
    const mat = o.material_type || "Unknown";
    materialBreakdown[mat] = (materialBreakdown[mat] || 0) + (o.quantity_yards || 0);
  });
  const pieData = Object.entries(materialBreakdown).map(([name, value]) => ({ name, value }));

  // Driver productivity
  const driverStats = {};
  filteredOrders.forEach(o => {
    const driver = o.assigned_driver_name || "Unassigned";
    if (!driverStats[driver]) driverStats[driver] = { name: driver, loads: 0, yards: 0, revenue: 0 };
    driverStats[driver].loads += 1;
    driverStats[driver].yards += o.quantity_yards || 0;
    driverStats[driver].revenue += o.revenue || 0;
  });
  const driverChart = Object.values(driverStats).sort((a, b) => b.loads - a.loads);

  const handleExport = () => {
    const headers = ["Date", "Customer", "Address", "Material", "Yards", "Status", "Driver", "Revenue"];
    const rows = filteredOrders.map(o => [
      o.delivery_date, o.customer_name, o.address, o.material_type,
      o.quantity_yards, o.status, o.assigned_driver_name, o.revenue || 0
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `norwood-report-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePresetRange = (range) => {
    setDateRange(range);
    const now = new Date();
    if (range === "today") {
      const d = format(now, "yyyy-MM-dd");
      setStartDate(d);
      setEndDate(d);
    } else if (range === "week") {
      setStartDate(format(subDays(now, 7), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    } else if (range === "month") {
      setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <Button onClick={handleExport} variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["today", "week", "month"].map(r => (
          <Button
            key={r}
            size="sm"
            variant={dateRange === r ? "default" : "outline"}
            onClick={() => handlePresetRange(r)}
            className={dateRange === r
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "border-[hsl(0,0%,25%)] text-gray-400 hover:bg-white/5"
            }
          >
            {r === "today" ? "Today" : r === "week" ? "Last 7 Days" : "Last 30 Days"}
          </Button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <Input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setDateRange("custom"); }}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white w-36 h-9 text-xs"
          />
          <span className="text-gray-500 text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setDateRange("custom"); }}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white w-36 h-9 text-xs"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Loads" value={filteredOrders.length} icon={Package} accent />
        <StatCard label="Delivered" value={delivered.length} icon={Truck} />
        <StatCard label="Total Yards" value={`${totalYards} yd`} icon={Package} />
        <StatCard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily Loads */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Loads Per Day</h3>
          {dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyChart}>
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickFormatter={d => format(new Date(d), "MM/dd")} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                  labelStyle={{ color: "#999" }}
                />
                <Bar dataKey="loads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-600 text-center py-12">No data for this period</p>
          )}
        </div>

        {/* Material Breakdown */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Material Breakdown (yd)</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400">{d.name}</span>
                    <span className="text-white font-medium">{d.value} yd</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-12">No data</p>
          )}
        </div>
      </div>

      {/* Driver Productivity */}
      <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Driver Productivity</h3>
        {driverChart.length > 0 ? (
          <div className="space-y-2">
            {driverChart.map((d, i) => (
              <div key={d.name} className="flex items-center gap-4 p-3 rounded-lg bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,15%)]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-amber-500 font-bold text-sm">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{d.loads} loads</p>
                  <p className="text-xs text-gray-500">{d.yards} yd · ${d.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-8">No driver data</p>
        )}
      </div>
    </div>
  );
}