import { v2 as cloudinary } from "cloudinary";

const configured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function isCloudinaryConfigured(): boolean {
  return configured;
}

/**
 * Best-effort public id extraction from a Cloudinary HTTPS URL for destroy API.
 */
export function tryPublicIdFromCloudinaryUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("res.cloudinary.com")) {
      return null;
    }
    const withoutQuery = u.pathname;
    const marker = "/upload/";
    const idx = withoutQuery.indexOf(marker);
    if (idx === -1) {
      return null;
    }
    let rest = withoutQuery.slice(idx + marker.length);
    if (rest.startsWith("v")) {
      const slash = rest.indexOf("/");
      if (slash !== -1) {
        rest = rest.slice(slash + 1);
      }
    }
    const lastDot = rest.lastIndexOf(".");
    if (lastDot > 0) {
      rest = rest.slice(0, lastDot);
    }
    return rest.length > 0 ? decodeURIComponent(rest) : null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryBySecureUrl(url: string | null | undefined): Promise<void> {
  if (!configured || !url) {
    return;
  }
  const publicId = tryPublicIdFromCloudinaryUrl(url);
  if (!publicId) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<{ url: string; publicId: string }> {
  if (!configured) {
    throw new Error("Cloudinary is not configured");
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
