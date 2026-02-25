import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MATERIALS = [
  "Topsoil", "Gravel", "Sand", "Crushed Stone", "Fill Dirt",
  "Mulch", "Compost", "Recycled Asphalt", "Clay", "Other"
];

export default function IntakeFormFields({ form, setForm }) {
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase tracking-wider">Customer Name *</Label>
          <Input
            value={form.customer_name}
            onChange={e => update("customer_name", e.target.value)}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11"
            placeholder="Enter customer name"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase tracking-wider">Contact Phone *</Label>
          <Input
            value={form.phone}
            onChange={e => update("phone", e.target.value)}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-xs uppercase tracking-wider">Delivery Address *</Label>
        <Input
          value={form.address}
          onChange={e => update("address", e.target.value)}
          className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11"
          placeholder="Full delivery address"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase tracking-wider">Material Type *</Label>
          <Select value={form.material_type} onValueChange={v => update("material_type", v)}>
            <SelectTrigger className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)]">
              {MATERIALS.map(m => (
                <SelectItem key={m} value={m} className="text-white hover:bg-white/10">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase tracking-wider">Quantity (yards) *</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={form.quantity_yards}
            onChange={e => update("quantity_yards", parseFloat(e.target.value) || 0)}
            className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11"
            placeholder="0"
          />
        </div>
      </div>

      {form.delivery_date && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
          <span className="text-xs uppercase tracking-wider text-amber-500/60 font-medium">Selected Date:</span>
          <span className="font-semibold">{new Date(form.delivery_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-gray-400 text-xs uppercase tracking-wider">Time Slot</Label>
        <Select value={form.time_slot} onValueChange={v => update("time_slot", v)}>
          <SelectTrigger className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white h-11">
            <SelectValue placeholder="Select preferred time window" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)]">
            <SelectItem value="AM" className="text-white hover:bg-white/10">AM (7:00 - 11:00)</SelectItem>
            <SelectItem value="Midday" className="text-white hover:bg-white/10">Midday (11:00 - 2:00)</SelectItem>
            <SelectItem value="PM" className="text-white hover:bg-white/10">PM (2:00 - 5:00)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-xs uppercase tracking-wider">Special Instructions</Label>
        <Textarea
          value={form.special_instructions}
          onChange={e => update("special_instructions", e.target.value)}
          className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white min-h-[80px]"
          placeholder="Any special instructions for this delivery..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-xs uppercase tracking-wider">Placement Instructions</Label>
        <Textarea
          value={form.placement_instructions}
          onChange={e => update("placement_instructions", e.target.value)}
          className="bg-[hsl(0,0%,8%)] border-[hsl(0,0%,20%)] text-white min-h-[80px]"
          placeholder="Where to place material on site..."
        />
      </div>
    </div>
  );
}