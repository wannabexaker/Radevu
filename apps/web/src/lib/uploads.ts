import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_ROOT = "/srv/radevu/uploads";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp"
] as const;

export type UploadKind = "logo" | "photo";

type SavedUpload = {
  absolutePath: string;
  url: string;
};

const mimeToExtension: Record<(typeof ALLOWED_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function isAllowedMimeType(
  value: string
): value is (typeof ALLOWED_MIME_TYPES)[number] {
  return ALLOWED_MIME_TYPES.includes(
    value as (typeof ALLOWED_MIME_TYPES)[number]
  );
}

function safeBusinessId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Resolves a public upload path under the configured upload root.
 *
 * @param relativePath - Path segments after `/uploads/`.
 * @returns Absolute path when safely inside UPLOAD_ROOT, otherwise null.
 */
export function resolveUploadPath(relativePath: string): string | null {
  const uploadRoot = path.resolve(UPLOAD_ROOT);
  const absolutePath = path.resolve(uploadRoot, relativePath);
  const rootWithSeparator = `${uploadRoot}${path.sep}`;

  if (
    absolutePath !== uploadRoot &&
    !absolutePath.startsWith(rootWithSeparator)
  ) {
    return null;
  }

  return absolutePath;
}

/**
 * Validates and saves an uploaded business image.
 *
 * Images are stored as originals in Phase 1; resizing is deferred so the
 * browser handles display sizing without adding image-processing dependencies.
 *
 * @param input - Business id, upload kind, and browser File payload.
 * @returns Public URL and absolute path for the saved file.
 * @throws Error with code INVALID_TYPE or FILE_TOO_LARGE for invalid uploads.
 */
export async function saveUpload(input: {
  businessId: string;
  file: File;
  kind: UploadKind;
}): Promise<SavedUpload> {
  if (!isAllowedMimeType(input.file.type)) {
    const error = new Error("Invalid upload type");
    error.name = "INVALID_TYPE";
    throw error;
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    const error = new Error("Upload file is too large");
    error.name = "FILE_TOO_LARGE";
    throw error;
  }

  const businessId = safeBusinessId(input.businessId);
  const directory = resolveUploadPath(businessId);

  if (!directory) {
    const error = new Error("Invalid business upload path");
    error.name = "INVALID_TYPE";
    throw error;
  }

  const extension = mimeToExtension[input.file.type];
  const filename = `${input.kind}-${Date.now()}.${extension}`;
  const absolutePath = resolveUploadPath(`${businessId}/${filename}`);

  if (!absolutePath) {
    const error = new Error("Invalid upload path");
    error.name = "INVALID_TYPE";
    throw error;
  }

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await input.file.arrayBuffer()));

  return {
    absolutePath,
    url: `/uploads/${businessId}/${filename}`
  };
}

/**
 * Deletes an uploaded file by its public `/uploads/...` URL.
 *
 * @param url - Public upload URL to delete.
 * @returns Resolves after deletion, or after logging a non-fatal warning.
 */
export async function deleteUploadByUrl(url: string | null): Promise<void> {
  if (!url) {
    return;
  }

  if (!url.startsWith("/uploads/")) {
    console.warn("Skipped deleting non-upload URL", {
      url
    });
    return;
  }

  const relativePath = url.slice("/uploads/".length);
  const absolutePath = resolveUploadPath(relativePath);

  if (!absolutePath) {
    console.warn("Skipped deleting unsafe upload URL", {
      url
    });
    return;
  }

  try {
    await stat(absolutePath);
    await unlink(absolutePath);
  } catch (error) {
    console.warn("Failed to delete upload file", {
      absolutePath,
      error
    });
  }
}
