import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Send, Loader2, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import IntakeFormFields from "../components/intake/IntakeFormFields";
import CapacityPreview from "../components/intake/CapacityPreview";
import AvailabilityCalendar from "../components/intake/AvailabilityCalendar";
import PhotoCapture from "../components/shared/PhotoCapture";
import TicketScanner from "../components/intake/TicketScanner";

const EMPTY_FORM = {
  customer_name: "",
  address: "",
  phone: "",
  material_type: "",
  quantity_yards: 0,
  special_instructions: "",
  delivery_date: "",
  time_slot: "",
  placement_instructions: "",
  attachment_urls: [],
};

export default function IntakeForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeliveryOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, status: "Pending" });
  };

  const handleTicketExtracted = (data) => {
    setForm(prev => ({
      ...prev,
      ...data,
      // Keep attachment_urls as-is
      attachment_urls: prev.attachment_urls,
    }));
  };

  const canSubmit = form.customer_name && form.address && form.phone && form.material_type && form.quantity_yards > 0 && form.delivery_date;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Order Submitted!</h2>
          <p className="text-gray-500 text-sm mt-1">Your delivery request has been received and will be scheduled.</p>
        </div>
        <Button
          onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); }}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          Submit Another Order
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header — no back button, public page */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Delivery Order</h1>
          <p className="text-xs text-gray-500 mt-0.5">Norwood Haul Route — Order Intake</p>
        </div>
      </div>

      {/* AI Ticket Scanner */}
      <TicketScanner onExtracted={handleTicketExtracted} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order fields */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Order Details
          </h2>
          <IntakeFormFields form={form} setForm={setForm} />
        </div>

        {/* Availability Calendar */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Select Delivery Date
          </h2>
          <AvailabilityCalendar
            selectedDate={form.delivery_date}
            onSelect={(date) => setForm(prev => ({ ...prev, delivery_date: date }))}
          />
        </div>

        {/* Capacity preview for selected date */}
        {form.delivery_date && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Date Availability
            </h2>
            <CapacityPreview selectedDate={form.delivery_date} />
          </div>
        )}

        {/* Attachments */}
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Reference Photos (Optional)
          </h2>
          <PhotoCapture
            label="Reference Photo"
            onPhotoUploaded={(url) => {
              if (url) setForm(prev => ({ ...prev, attachment_urls: [...(prev.attachment_urls || []), url] }));
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={!canSubmit || createMutation.isPending}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base gap-2"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          Submit Order
        </Button>
      </form>
    </div>
  );
}