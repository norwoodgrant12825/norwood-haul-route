import React, { useState, useEffect } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ClockInOut({ user, todayLogs, onClockAction }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const yardClockIn = todayLogs.find(l => l.log_type === "yard_clock_in");
  const yardClockOut = todayLogs.find(l => l.log_type === "yard_clock_out");
  const isClockedIn = yardClockIn && !yardClockOut;

  const handleClock = async (type) => {
    setLoading(true);
    await base44.entities.TimeLog.create({
      driver_email: user.email,
      driver_name: user.full_name,
      log_type: type,
      timestamp: new Date().toISOString(),
      latitude: location?.lat,
      longitude: location?.lng,
      date: new Date().toISOString().split("T")[0],
    });
    onClockAction();
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border p-4 ${
      isClockedIn
        ? "bg-green-500/5 border-green-500/20"
        : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)]"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Yard Status</span>
        </div>
        {isClockedIn && (
          <span className="text-xs text-green-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Clocked In
          </span>
        )}
      </div>

      {!yardClockIn ? (
        <Button
          onClick={() => handleClock("yard_clock_in")}
          disabled={loading}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          Clock In at Yard
        </Button>
      ) : isClockedIn ? (
        <Button
          onClick={() => handleClock("yard_clock_out")}
          disabled={loading}
          variant="outline"
          className="w-full h-14 border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-base gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
          Clock Out
        </Button>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">Shift Complete</p>
          <p className="text-xs text-gray-600">
            {new Date(yardClockIn.timestamp).toLocaleTimeString()} — {new Date(yardClockOut.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}