import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "In Transit": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  Planned: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Active: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Completed: "bg-green-500/15 text-green-400 border-green-500/30",
  Open: "bg-green-500/15 text-green-400 border-green-500/30",
  "Near Full": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Full: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-medium ${STATUS_STYLES[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
    >
      {status}
    </Badge>
  );
}