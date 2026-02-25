import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  ClipboardPlus,
  Truck,
  Map,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_PAGES = [
  { name: "AdminDashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "IntakeForm", label: "New Order", icon: ClipboardPlus },
  { name: "DispatchBoard", label: "Dispatch", icon: Map },
  { name: "Reports", label: "Reports", icon: BarChart3 },
];

const DRIVER_PAGES = [
  { name: "DriverDashboard", label: "My Route", icon: Truck },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const role = user?.role || "driver";
  const isAdmin = role === "admin" || role === "dispatch";
  const pages = isAdmin ? [...ADMIN_PAGES, ...DRIVER_PAGES] : DRIVER_PAGES;

  // Driver-only pages don't show the full sidebar
  const isDriverOnlyPage = currentPageName === "DriverDashboard";

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7%)] text-white flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[hsl(0,0%,8%)] border-b border-[hsl(0,0%,18%)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
              <Truck className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm tracking-wide">NORWOOD</span>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <User className="w-3.5 h-3.5" />
            <span>{user.full_name}</span>
          </div>
        )}
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-60
        bg-[hsl(0,0%,8%)] border-r border-[hsl(0,0%,18%)]
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-[hsl(0,0%,18%)]">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
            <Truck className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest">NORWOOD</div>
            <div className="text-[10px] text-gray-500 tracking-wider">HAUL ROUTE</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {pages.map((page) => {
            const isActive = currentPageName === page.name;
            const Icon = page.icon;
            return (
              <Link
                key={page.name}
                to={createPageUrl(page.name)}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{page.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="border-t border-[hsl(0,0%,18%)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-500 text-xs font-bold">
                  {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.full_name}</div>
                <div className="text-xs text-gray-500 capitalize">{role}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}