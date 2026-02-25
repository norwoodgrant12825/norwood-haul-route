import React, { useState } from "react";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PhotoCapture from "../shared/PhotoCapture";

export default function DeliveryVerification({ order, onSubmit, onCancel, isSubmitting }) {
  const [loadPhoto, setLoadPhoto] = useState(order.load_photo_url || null);
  const [dumpPhoto, setDumpPhoto] = useState(order.dump_photo_url || null);
  const [sitePhoto, setSitePhoto] = useState(order.site_photo_url || null);
  const [notes, setNotes] = useState(order.driver_notes || "");

  const allPhotos = loadPhoto && dumpPhoto && sitePhoto;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-gray-400 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">Complete Delivery</h2>
          <p className="text-xs text-gray-500">{order.customer_name} · {order.quantity_yards} yd {order.material_type}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-4 space-y-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Required Photos (All 3 mandatory)
        </p>
        <PhotoCapture label="1. Load in Truck" onPhotoUploaded={setLoadPhoto} existingUrl={loadPhoto} />
        <PhotoCapture label="2. Material Dumped" onPhotoUploaded={setDumpPhoto} existingUrl={dumpPhoto} />
        <PhotoCapture label="3. Final Site Photo" onPhotoUploaded={setSitePhoto} existingUrl={sitePhoto} />
      </div>

      <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Driver Notes</p>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white min-h-[80px]"
          placeholder="Add any notes about this delivery..."
        />
      </div>

      <Button
        onClick={() => onSubmit({ loadPhoto, dumpPhoto, sitePhoto, notes })}
        disabled={!allPhotos || isSubmitting}
        className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
        {allPhotos ? "Mark as Delivered" : "Upload All 3 Photos to Continue"}
      </Button>
    </div>
  );
}