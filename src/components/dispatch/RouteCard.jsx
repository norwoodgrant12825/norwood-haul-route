import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Truck, GripVertical, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";

// Smart buffer calculation based on time-of-day traffic patterns and job size
function calcBufferMinutes(order, stopIndex, timeSlot) {
  // Base on-site time per yard (dump trucks average ~3 min/yd on-site)
  const onSiteMinutes = Math.max(15, Math.round((order.quantity_yards || 10) * 2.5));

  // Travel buffer: time-of-day heuristic
  // AM rush (7-9am), Midday (11am-1pm light), PM rush (4-6pm)
  const trafficMultipliers = { AM: 1.35, Midday: 1.1, PM: 1.4 };
  const trafficFactor = trafficMultipliers[timeSlot] || 1.2;

  // Base travel time estimate: 15 min avg between stops, adjusted for traffic
  const baseTravelMin = Math.round(15 * trafficFactor);

  // Add extra buffer for each additional stop (fatigue, adjustments)
  const stopBuffer = stopIndex * 3;

  return { onSiteMinutes, travelMinutes: baseTravelMin, bufferMinutes: stopBuffer + 5 };
}

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getStartHour(timeSlot) {
  if (timeSlot === "AM") return 7;
  if (timeSlot === "Midday") return 11;
  return 14;
}

function calcETA(orders, timeSlot) {
  let currentMin = getStartHour(timeSlot) * 60;
  return orders.map((order, idx) => {
    const { onSiteMinutes, travelMinutes, bufferMinutes } = calcBufferMinutes(order, idx, timeSlot);
    if (idx > 0) currentMin += travelMinutes + bufferMinutes;
    const arrivalMin = currentMin;
    currentMin += onSiteMinutes;
    return {
      order,
      arrivalMin,
      departureMin: currentMin,
      travelMinutes: idx > 0 ? travelMinutes + bufferMinutes : 0,
      onSiteMinutes,
    };
  });
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function trafficLabel(timeSlot) {
  if (timeSlot === "AM") return { label: "AM Rush", color: "text-red-400" };
  if (timeSlot === "PM") return { label: "PM Rush", color: "text-red-400" };
  return { label: "Light Traffic", color: "text-green-400" };
}

export default function RouteCard({ route, orders, onReorder }) {
  const [expanded, setExpanded] = useState(true);

  const sortedOrders = [...orders].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
  const timeSlot = sortedOrders[0]?.time_slot || "AM";
  const etaData = calcETA(sortedOrders, timeSlot);
  const traffic = trafficLabel(timeSlot);

  const totalRouteMin = etaData.length > 0
    ? etaData[etaData.length - 1].departureMin - (getStartHour(timeSlot) * 60)
    : 0;

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...sortedOrders];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(route.id, reordered);
  };

  return (
    <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)]">
      {/* Route Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">{route.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500">
                {route.assigned_driver_name} · {sortedOrders.length} stops · {route.total_yards} yd
              </span>
              <span className={`text-xs font-medium ${traffic.color}`}>· {traffic.label}</span>
              {totalRouteMin > 0 && (
                <span className="text-xs text-gray-500">· Est. {formatMinutes(totalRouteMin)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={route.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {/* Drag-and-drop stops */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> Drag stops to reorder
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={route.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-1.5"
                >
                  {etaData.map(({ order, arrivalMin, travelMinutes, onSiteMinutes }, idx) => (
                    <Draggable key={order.id} draggableId={order.id} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                            snapshot.isDragging
                              ? "bg-amber-500/10 border-amber-500/40 shadow-lg"
                              : "bg-[hsl(0,0%,8%)] border-[hsl(0,0%,15%)]"
                          }`}
                        >
                          {/* Drag handle */}
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          </div>

                          {/* Stop number */}
                          <span className="text-xs font-bold text-amber-500 w-5 flex-shrink-0">#{idx + 1}</span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{order.customer_name}</p>
                            <p className="text-xs text-gray-500 truncate">{order.address}</p>
                          </div>

                          {/* ETA & buffer */}
                          <div className="text-right flex-shrink-0 space-y-0.5">
                            <div className="flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-white font-medium">
                                {minutesToTime(arrivalMin)}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600">
                              {order.quantity_yards} yd · {formatMinutes(onSiteMinutes)} on-site
                            </div>
                            {idx > 0 && travelMinutes > 0 && (
                              <div className="text-[10px] text-gray-600">
                                +{formatMinutes(travelMinutes)} travel
                              </div>
                            )}
                          </div>

                          <StatusBadge status={order.status} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Route Summary */}
          {etaData.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[hsl(0,0%,15%)] grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Start</p>
                <p className="text-xs font-medium">{minutesToTime(etaData[0].arrivalMin)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</p>
                <p className="text-xs font-medium">{formatMinutes(totalRouteMin)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Done</p>
                <p className="text-xs font-medium">{minutesToTime(etaData[etaData.length - 1].departureMin)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}