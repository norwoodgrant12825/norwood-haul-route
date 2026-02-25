import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, FileImage, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TicketScanner({ onExtracted }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setScanning(true);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are extracting delivery order information from a paper ticket or work order photo.
Extract the following fields if visible:
- customer_name: full name of the customer
- address: delivery address (full street address)
- phone: contact phone number
- material_type: type of material (must be one of: Topsoil, Gravel, Sand, Crushed Stone, Fill Dirt, Mulch, Compost, Recycled Asphalt, Clay, Other)
- quantity_yards: quantity in cubic yards (number only)
- delivery_date: delivery date in YYYY-MM-DD format (if present)
- time_slot: one of AM, Midday, PM (if indicated)
- special_instructions: any special delivery notes
- placement_instructions: where to place the material

Return only fields that are clearly visible. Leave others as empty string or null.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            customer_name: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            material_type: { type: "string" },
            quantity_yards: { type: "number" },
            delivery_date: { type: "string" },
            time_slot: { type: "string" },
            special_instructions: { type: "string" },
            placement_instructions: { type: "string" },
          },
        },
      });

      setScanning(false);
      // Filter out null/empty values before passing up
      const cleaned = Object.fromEntries(
        Object.entries(result).filter(([_, v]) => v !== null && v !== "" && v !== undefined)
      );
      onExtracted(cleaned);
    } catch (err) {
      setUploading(false);
      setScanning(false);
      setError("Could not read ticket. Please try a clearer photo or fill in manually.");
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLoading = uploading || scanning;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">AI Ticket Scanner</h2>
        <span className="text-xs text-gray-500 ml-1">— photo a paper ticket to auto-fill the form</span>
      </div>

      {!preview ? (
        <div
          className="border-2 border-dashed border-amber-500/20 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <Camera className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Tap to take a photo or upload a ticket image</p>
          <p className="text-xs text-gray-600 mt-1">AI will extract the order details automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-[hsl(0,0%,20%)]">
            <img src={preview} alt="Ticket" className="w-full max-h-48 object-contain bg-[hsl(0,0%,8%)]" />
            {!isLoading && (
              <button
                type="button"
                onClick={clear}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-black"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploading ? "Uploading photo..." : "AI is reading your ticket..."}</span>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Sparkles className="w-4 h-4" />
              <span>Form filled from ticket — review and submit</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}