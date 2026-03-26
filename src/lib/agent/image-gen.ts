import { put } from "@vercel/blob";
import { GoogleGenAI } from "@google/genai";
import type { ImageGenContext } from "./tools";

const IMAGEN_MODEL = process.env.IMAGEN_MODEL ?? "imagen-3.0-generate-002";

const ASPECT_MAP: Record<string, string> = {
  square: "1:1",
  landscape: "3:2",
  portrait: "2:3",
};

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (_client) return _client;

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1";
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (project) {
    // Use Vertex AI with service account
    _client = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  } else if (apiKey) {
    // Fallback to API key
    _client = new GoogleGenAI({ apiKey });
  } else {
    throw new Error(
      "Either GOOGLE_VERTEX_PROJECT or GOOGLE_GENERATIVE_AI_API_KEY is required for image generation",
    );
  }
  return _client;
}

async function generateImageWithImagen(args: {
  prompt: string;
  aspectRatio: string;
  background: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const client = getClient();

  const response = await client.models.generateImages({
    model: IMAGEN_MODEL,
    prompt: args.prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: ASPECT_MAP[args.aspectRatio] ?? "1:1",
      ...(args.background === "transparent" && {
        outputMimeType: "image/png",
      }),
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    throw new Error("Imagen returned no image data");
  }

  const base64 =
    typeof image.image.imageBytes === "string"
      ? image.image.imageBytes
      : Buffer.from(image.image.imageBytes).toString("base64");

  return {
    buffer: Buffer.from(base64, "base64"),
    mimeType: image.image.mimeType ?? "image/png",
  };
}

async function uploadToVercelBlob(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: mimeType,
  });
  return blob.url;
}

export function buildImageContext(): ImageGenContext {
  return {
    generateAndUpload: async ({ id, prompt, aspectRatio, background }) => {
      const { buffer, mimeType } = await generateImageWithImagen({
        prompt,
        aspectRatio,
        background,
      });

      const ext = mimeType.includes("png") ? "png" : "jpg";
      const filename = `gen-${id}-${Date.now().toString(36)}.${ext}`;

      const url = await uploadToVercelBlob(buffer, mimeType, filename);
      console.warn(`[generate_image] ${id} → ${url}`);
      return url;
    },
  };
}
