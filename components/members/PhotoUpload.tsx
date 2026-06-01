"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] } as const;
const MAX_BYTES = 2 * 1024 * 1024;

export function PhotoUpload({
  valueUrl,
  onChangeFile,
  onClear,
}: {
  valueUrl?: string | null;
  onChangeFile: (file: File | null) => void;
  onClear?: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(valueUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        return prev;
      }
      return valueUrl ?? null;
    });
  }, [valueUrl]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setError(null);
      const file = accepted[0] ?? null;
      if (!file) {
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Photo must be 2MB or smaller.");
        return;
      }
      onChangeFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    },
    [onChangeFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center py-8">
      <div className="relative">
        <div
          {...getRootProps()}
          className={cn(
            "flex h-[120px] w-[120px] cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors",
            preview ? "border-navy-200 bg-white" : "border-navy-200 bg-navy-50",
            isDragActive ? "border-gold-600 bg-gold-50" : "hover:border-navy-400 hover:bg-navy-50/80",
          )}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <Image src={preview} alt="Preview" fill className="object-cover" unoptimized={preview.startsWith("blob:")} />
            </div>
          ) : (
            <>
              <Camera className="h-7 w-7 text-navy-300" />
              <span className="mt-1 text-xs text-navy-300">Upload Photo</span>
            </>
          )}
        </div>
        {preview ? (
          <button
            type="button"
            className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-navy-100 bg-white text-navy-600 shadow-sm hover:bg-navy-50"
            aria-label="Remove photo"
            onClick={(e) => {
              e.stopPropagation();
              onChangeFile(null);
              setPreview(valueUrl ?? null);
              onClear?.();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <p className="mt-4 max-w-xs text-center text-xs text-navy-300">JPG or PNG only. Max 2MB. Passport size recommended.</p>
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
