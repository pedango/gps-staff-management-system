export type SniffedKind = "image/jpeg" | "image/png" | "application/pdf" | "audio/webm" | "audio/mp4";

export function sniffMime(buffer: Buffer): SniffedKind | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 5) {
    const head = buffer.subarray(0, 5).toString("utf8");
    if (head === "%PDF-") {
      return "application/pdf";
    }
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "audio/webm";
  }
  if (buffer.length >= 12) {
    const ftyp = buffer.subarray(4, 8).toString("ascii");
    if (ftyp === "ftyp") {
      return "audio/mp4";
    }
  }
  return null;
}
