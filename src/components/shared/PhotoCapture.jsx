import React, { useRef, useState } from "react";
import { Camera, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function PhotoCapture({ label, onPhotoUploaded, existingUrl }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(existingUrl || null);

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPreviewUrl(file_url);
    onPhotoUploaded(file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-[hsl(0,0%,18%)]">
          <img src={previewUrl} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            {uploading ? (
              <div className="bg-black/70 rounded-full p-1.5">
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              </div>
            ) : (
              <div className="bg-green-500/80 rounded-full p-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <button
              onClick={() => {
                setPreviewUrl(null);
                onPhotoUploaded(null);
              }}
              className="bg-black/70 rounded-full p-1.5 hover:bg-black"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 border-dashed border-[hsl(0,0%,25%)] bg-[hsl(0,0%,10%)] hover:bg-[hsl(0,0%,12%)] text-gray-400"
        >
          <Camera className="w-5 h-5 mr-2" />
          Take Photo
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </div>
  );
}