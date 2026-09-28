import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  createImageRecord,
  updateImageRecord,
  getUserImages,
  deleteImage,
  type GenerateImageDto,
} from "./ai-image.model";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { nanoid } from "nanoid";

const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: "photorealistic, 8k resolution, highly detailed, professional photography, studio lighting, hyperrealistic",
  anime: "anime style, Japanese animation aesthetic, vibrant colors, clean lineart, Makoto Shinkai style, studio ghibli inspired",
  cinematic: "cinematic shot, 35mm film photograph, dramatic lighting, depth of field, blockbuster movie still",
  cyberpunk: "cyberpunk aesthetic, neon lighting, futuristic city, glowing lights, high tech, dark rainy atmosphere",
  "3d-render": "3D render, octane render, Unreal Engine 5, raytracing, smooth plastic and metallic textures, volumetric lighting",
  fantasy: "epic fantasy art, magical atmosphere, glowing particles, intricate details, concept art, trending on artstation",
  "pixel-art": "pixel art, 16-bit retro game style, nostalgic pixelated detail, clean sprite art",
  watercolor: "soft watercolor painting, artistic brush strokes, pastel color palette, paper texture, fluid ink wash",
};

// Local Stable Diffusion (Automatic1111 / SD.Next) generator (txt2img & img2img)
async function generateLocalSD(data: GenerateImageDto, prompt: string, width: number, height: number) {
  const endpoint = data.localEndpoint || "http://localhost:7860";
  const isImg2Img = !!data.initImage;
  const url = endpoint.replace(/\/$/, "") + (isImg2Img ? "/sdapi/v1/img2img" : "/sdapi/v1/txt2img");

  const cleanImage = data.initImage?.replace(/^data:image\/[a-z]+;base64,/, "");

  const bodyPayload: Record<string, unknown> = {
    prompt: prompt,
    negative_prompt: data.negativePrompt || "blurry, bad quality, distorted, deformed, lowres",
    width,
    height,
    steps: 25,
    cfg_scale: 7,
    seed: data.seed ?? -1,
  };

  if (isImg2Img && cleanImage) {
    bodyPayload.init_images = [cleanImage];
    bodyPayload.denoising_strength = data.denoisingStrength ?? 0.75;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(60000), // 60s timeout for local GPU
    });

    if (!res.ok) {
      throw new Error(`Local SD returned HTTP ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as { images?: string[] };
    if (!json.images || json.images.length === 0) {
      throw new Error("No image returned from local Stable Diffusion");
    }

    const base64Image = `data:image/png;base64,${json.images[0]}`;
    return {
      url: base64Image,
      revised_prompt: prompt,
    };
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      throw new Error("Local Stable Diffusion request timed out. Please check your local GPU server.");
    }
    throw new Error(
      `Cannot connect to Local Stable Diffusion at ${endpoint}. Make sure Automatic1111/WebUI is running with '--api' enabled (e.g. webui-user.bat with COMMANDLINE_ARGS=--api).`
    );
  }
}

// OpenAI DALL-E generator
async function generateDallE(data: GenerateImageDto, prompt: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai-key")) {
    throw new Error("OpenAI API Key is not configured.");
  }

  const payload: Record<string, unknown> = {
    model: data.model === "dall-e-2" ? "dall-e-2" : "dall-e-3",
    prompt,
    n: 1,
    size: data.size || "1024x1024",
    response_format: "url",
  };

  if (payload.model === "dall-e-3") {
    if (data.quality) payload.quality = data.quality;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "OpenAI Image Generation failed");
  }

  const result = (await response.json()) as { data: { url: string; revised_prompt?: string }[] };
  if (!result.data?.[0]?.url) {
    throw new Error("No image URL returned from DALL-E");
  }

  return result.data[0];
}

// FLUX / SDXL / Anime / Turbo generator (Pollinations AI)
function generatePollinations(data: GenerateImageDto, prompt: string, width: number, height: number) {
  let modelName = "flux";
  if (data.model === "flux-realism") modelName = "flux-realism";
  else if (data.model === "flux-anime" || data.model === "anime") modelName = "flux-anime";
  else if (data.model === "sdxl") modelName = "turbo";
  else if (data.model === "turbo") modelName = "turbo";

  const seed = data.seed ?? Math.floor(Math.random() * 1000000);
  const negative = data.negativePrompt ? `&negative=${encodeURIComponent(data.negativePrompt)}` : "";
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${modelName}&seed=${seed}&nologo=true${negative}`;

  return {
    url: imageUrl,
    revised_prompt: prompt,
  };
}

// Synthesize photo context + user edit instructions into a comprehensive prompt using Gemini Vision
async function synthesizePhotoEditPrompt(image: string, userInstruction: string): Promise<string> {
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY!;
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const model = google("gemini-3.5-flash-lite");

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert generative AI prompt engineer for FLUX and Stable Diffusion.
A user uploaded this photo and requested this edit/modification:
"${userInstruction}"

Analyze the uploaded photo (subjects, people, clothes, pose, setting, lighting, composition) and write a single complete, vivid, high-resolution generative image prompt that faithfully retains the subjects/people from the photo while precisely applying the user's requested edit.
Do NOT just repeat the edit instruction. Describe the actual people/subjects from the photo combined with the requested modifications into one detailed scene.
Return ONLY the final prompt text. Do NOT include quotes, prefixes, or markdown.`,
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    const enriched = result.text.replace(/["'\n]/g, " ").trim();
    if (enriched && enriched.length > 10) {
      return enriched;
    }
  } catch (e) {
    console.warn("Failed to synthesize photo edit prompt:", e);
  }
  return userInstruction;
}

export const aiImageService = {
  async generateImage(userId: string, data: GenerateImageDto) {
    const record = await createImageRecord(userId, data);

    const [w, h] = (data.size || "1024x1024").split("x");
    const width = parseInt(w) || 1024;
    const height = parseInt(h) || 1024;

    let effectivePrompt = data.prompt.trim();

    // If a photo was attached, synthesize the photo contents with the user's edit instruction
    if (data.initImage) {
      const synthesized = await synthesizePhotoEditPrompt(data.initImage, effectivePrompt);
      if (synthesized) {
        effectivePrompt = synthesized;
      }
    }

    // Apply style enhancement if chosen
    if (data.style && STYLE_PROMPTS[data.style]) {
      effectivePrompt = `${effectivePrompt}, ${STYLE_PROMPTS[data.style]}`;
    }

    try {
      let imageData: { url: string; revised_prompt?: string };

      if (data.model === "local-sd") {
        imageData = await generateLocalSD(data, effectivePrompt, width, height);
      } else if (data.model === "dall-e-3" || data.model === "dall-e-2") {
        try {
          imageData = await generateDallE(data, effectivePrompt);
        } catch (dalleErr: any) {
          // If DALL-E fails due to quota or key, fallback to FLUX automatically
          console.warn("DALL-E failed, falling back to FLUX:", dalleErr.message);
          imageData = generatePollinations(data, effectivePrompt, width, height);
        }
      } else {
        imageData = generatePollinations(data, effectivePrompt, width, height);
      }

      const updated = await updateImageRecord(record.id, {
        imageUrl: imageData.url,
        revisedPrompt: imageData.revised_prompt || effectivePrompt,
        status: "completed",
      });

      // Log usage
      try {
        await db.insert(aiUsage).values({
          id: nanoid(),
          userId,
          tool: "image",
          provider: data.model === "local-sd" ? "local" : "openai",
          model: data.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
      } catch {}

      return updated;
    } catch (error) {
      await updateImageRecord(record.id, { status: "failed" });
      throw error;
    }
  },

  async listImages(userId: string) {
    return getUserImages(userId);
  },

  async deleteImage(id: string, userId: string) {
    const images = await getUserImages(userId);
    const image = images.find((img) => img.id === id);
    if (!image) throw new Error("Image not found");
    await deleteImage(id);
  },

  async describePhoto(image: string) {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY!;
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const model = google("gemini-3.5-flash-lite");

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and write a detailed, high-quality descriptive generative prompt for AI image generators (FLUX, Midjourney, Stable Diffusion). Describe the subject, aesthetic style, lighting, composition, colors, and mood. Return ONLY the prompt text directly without any introductory text, quotes, or markdown.",
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    return result.text.trim();
  },
};
