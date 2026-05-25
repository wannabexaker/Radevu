import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { resolveUploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const contentTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

/**
 * Serves uploaded business images from the protected upload root.
 *
 * @param _request - Incoming public upload request.
 * @param context - Route context containing the requested upload path.
 * @returns Streamed image response, 400 for traversal, or 404 when missing.
 */
export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const params = await context.params;
  const relativePath = params.path.join("/");
  const absolutePath = resolveUploadPath(relativePath);

  if (!absolutePath) {
    return new Response("Invalid path", { status: 400 });
  }

  try {
    const fileStat = await stat(absolutePath);

    if (!fileStat.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const extension = path.extname(absolutePath).toLowerCase();
    const contentType = contentTypeByExtension[extension];

    if (!contentType) {
      return new Response("Not found", { status: 404 });
    }

    const stream = Readable.toWeb(createReadStream(absolutePath));

    return new Response(stream as ReadableStream<Uint8Array>, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType
      }
    });
  } catch (error) {
    console.error("Failed to serve upload", {
      absolutePath,
      error
    });
    return new Response("Not found", { status: 404 });
  }
}
