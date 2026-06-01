import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sniffMime } from "@/lib/mime-sniff";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_PDF = 20 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    return NextResponse.json({ error: "Unsupported or unrecognized file type" }, { status: 400 });
  }

  const declared = file.type;
  const declaredOk =
    declared === sniffed ||
    (sniffed === "audio/webm" && (declared === "audio/webm" || declared === "video/webm")) ||
    (sniffed === "audio/mp4" && (declared === "audio/mp4" || declared === "video/mp4"));
  if (!declaredOk) {
    return NextResponse.json({ error: "File content does not match declared MIME type" }, { status: 400 });
  }

  let max = MAX_IMAGE;
  if (sniffed === "application/pdf") {
    max = MAX_PDF;
  }
  if (sniffed === "audio/webm" || sniffed === "audio/mp4") {
    max = MAX_AUDIO;
  }
  if (buffer.length > max) {
    return NextResponse.json({ error: "File exceeds maximum allowed size" }, { status: 400 });
  }

  const originalName = file.name || "upload";

  if (sniffed === "image/jpeg" || sniffed === "image/png") {
    const { url } = await uploadToCloudinary(buffer, "gps-pms/uploads/images", "image");
    return NextResponse.json({
      url,
      fileType: "IMAGE",
      fileName: originalName,
      size: buffer.length,
    });
  }

  if (sniffed === "application/pdf") {
    const { url } = await uploadToCloudinary(buffer, "gps-pms/uploads/docs", "raw");
    return NextResponse.json({
      url,
      fileType: "PDF",
      fileName: originalName,
      size: buffer.length,
    });
  }

  const { url } = await uploadToCloudinary(buffer, "gps-pms/uploads/voice", "video");
  return NextResponse.json({
    url,
    fileType: "VOICE",
    fileName: originalName,
    size: buffer.length,
  });
}
