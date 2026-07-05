"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEMBER_IMPORT_FIELDS } from "@/lib/member-import";
import { LABEL_STAFFS } from "@/lib/ui-labels";

type MemberBulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => Promise<void>;
};

export function MemberBulkImportDialog({ open, onOpenChange, onImported }: MemberBulkImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  function resetFile() {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetFile();
    }
    onOpenChange(next);
  }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await fetch("/api/members/import/template");
      if (!res.ok) {
        throw new Error("Could not download template");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "gps-staff-import-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download template");
    } finally {
      setDownloading(false);
    }
  }

  async function uploadFile() {
    if (!file) {
      toast.error("Choose a spreadsheet first");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/members/import", {
        method: "POST",
        body: form,
      });

      const payload = (await res.json()) as { imported?: number; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Import failed");
      }

      toast.success(`Imported ${payload.imported ?? 0} ${LABEL_STAFFS.toLowerCase()}`);
      await onImported();
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk upload staff</DialogTitle>
          <DialogDescription>
            Download the Excel template, fill in your staff rows, then upload the file here. Photo is not included in
            bulk import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-navy-100 bg-navy-50/60 p-4">
            <p className="mb-2 text-sm font-medium text-navy-800">Template columns</p>
            <p className="text-xs leading-relaxed text-navy-600">{MEMBER_IMPORT_FIELDS.join(", ")}</p>
          </div>

          <button
            type="button"
            onClick={() => void downloadTemplate()}
            disabled={downloading}
            className="app-btn app-btn-outline w-full"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            Download Excel template
          </button>

          <div className="rounded-lg border border-dashed border-navy-200 p-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="app-btn app-btn-outline w-full"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              {file ? file.name : "Choose spreadsheet"}
            </button>
            <p className="mt-2 text-center text-xs text-navy-500">Accepts .xlsx, .xls, or .csv · up to 500 rows</p>
          </div>

          <button
            type="button"
            onClick={() => void uploadFile()}
            disabled={!file || uploading}
            className="app-btn app-btn-gold w-full"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {uploading ? "Uploading…" : "Upload and import"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
