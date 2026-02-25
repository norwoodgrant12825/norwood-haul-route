import React from "react";
import {
  MapPin, Phone, Package, MessageSquare,
  Navigation, ChevronDown, ChevronUp, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "../shared/StatusBadge";

export default function DriverStopCard({ order, index, isActive, onSelect, onNavigate, onMarkArrived }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className={`rounded-xl border transition-all ${
        isActive
          ? "bg-amber-500/5 border-amber-500/30"
          : order.status === "Delivered"
          ? "bg-green-500/5 border-green-500/20 opacity-60"
          : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)]"
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Stop number */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
            isActive
              ? "bg-amber-500 text-black"
              : order.status === "Delivered"
              ? "bg-green-500/20 text-green-400"
              : "bg-[hsl(0,0%,15%)] text-gray-400"
          }`}>
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm truncate">{order.customer_name}</p>
              <div className="flex items-center gap-2 ml-2">
                <StatusBadge status={order.status} />
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {order.material_type} · {order.quantity_yards} yd
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[hsl(0,0%,15%)] pt-3">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300">{order.address}</p>
          </div>

          {/* Phone */}
          {order.phone && (
            <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-amber-400">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{order.phone}</span>
            </a>
          )}

          {/* Material */}
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">{order.material_type} — {order.quantity_yards} yards</span>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-300">{order.special_instructions}</p>
            </div>
          )}

          {/* Placement */}
          {order.placement_instructions && (
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-1">Placement</p>
              <p className="text-sm text-gray-300">{order.placement_instructions}</p>
            </div>
          )}

          {/* Attached photos */}
          {order.attachment_urls?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {order.attachment_urls.map((url, i) => (
                <img key={i} src={url} alt="ref" className="w-20 h-20 rounded-lg object-cover border border-[hsl(0,0%,20%)]" />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={(e) => { e.stopPropagation(); onNavigate(order); }}
              className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
            >
              <Navigation className="w-5 h-5" />
              Navigate
            </Button>
            {order.status !== "Delivered" && order.status !== "In Transit" && (
              <Button
                onClick={(e) => { e.stopPropagation(); onMarkArrived(order); }}
                variant="outline"
                className="flex-1 h-12 border-green-500/30 text-green-400 hover:bg-green-500/10 font-semibold"
              >
                Mark Arrived
              </Button>
            )}
            {order.status === "In Transit" && (
              <Button
                onClick={(e) => { e.stopPropagation(); onSelect(order); }}
                variant="outline"
                className="flex-1 h-12 border-green-500/30 text-green-400 hover:bg-green-500/10 font-semibold"
              >
                Complete Delivery
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}