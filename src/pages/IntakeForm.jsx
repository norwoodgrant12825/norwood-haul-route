import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import IntakeFormFields from "../components/intake/IntakeFormFields";
import CapacityPreview from "../components/intake/CapacityPreview";
import PhotoCapture from "../components/shared/PhotoCapture";

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
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeliveryOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setForm(EMPTY_FORM);
      window.location.href = createPageUrl("AdminDashboard");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      status: "Pending",
    });
  };

  const canSubmit = form.customer_name && form.address && form.phone && form.material_type && form.quantity_yards > 0 && form.delivery_date;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("AdminDashboard")}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Delivery Order</h1>
          <p className="text-xs text-gray-500 mt-0.5">Fill in customer and delivery details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Order Details
          </h2>
          <IntakeFormFields form={form} setForm={setForm} />
        </div>

        {/* Capacity Preview */}
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
            Attachments (Optional)
          </h2>
          <PhotoCapture
            label="Reference Photo"
            onPhotoUploaded={(url) => {
              if (url) {
                setForm(prev => ({
                  ...prev,
                  attachment_urls: [...(prev.attachment_urls || []), url]
                }));
              }
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