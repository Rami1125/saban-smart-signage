import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";

interface RecolorRequestBody {
  colorName?: string;
  colorCode?: string;
  hexCode?: string;
  finishType?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export function buildArchitecturalVisualizerPrompt({
  colorName = "אפור בטון עדין",
  colorCode = "0524T",
  hexCode = "#D6D5D0",
  finishType = "סופרקריל מט+ (matte/eggshell)",
}: {
  colorName?: string;
  colorCode?: string;
  hexCode?: string;
  finishType?: string;
}): string {
  return `You are an expert architectural interior visualizer.
Recolor ONLY the main interior wall shown in this room image to the paint color ${colorName} (${colorCode}, HEX: ${hexCode}).

Strict requirements:
1. Preserve all existing light sources, window sunbeams, shadows, ambient occlusion, and reflections.
2. Do not modify, blur, or paint over picture frames, switch plates, skirting boards, crown moldings, ceiling, flooring, or furniture.
3. Simulate an authentic ${finishType} wall paint sheen (e.g. eggshell/matte).
4. The output must be a clean, photorealistic interior photo matching the exact original geometry and composition.`;
}

export const Route = createFileRoute("/api/recolor-wall")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as RecolorRequestBody;
          const {
            colorName = "אפור בטון עדין",
            colorCode = "0524T",
            hexCode = "#D6D5D0",
            finishType = "סופרקריל מט+ (matte)",
            imageBase64,
            imageMimeType = "image/jpeg",
          } = body;

          const prompt = buildArchitecturalVisualizerPrompt({
            colorName,
            colorCode,
            hexCode,
            finishType,
          });

          const apiKey = process.env.GEMINI_API_KEY;

          if (apiKey && imageBase64) {
            try {
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    "User-Agent": "aistudio-build",
                  },
                },
              });

              // Remove data URI prefix if present
              const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

              const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite-image",
                contents: {
                  parts: [
                    {
                      inlineData: {
                        data: cleanBase64,
                        mimeType: imageMimeType,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              });

              for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                  const dataUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                  return Response.json({
                    success: true,
                    recoloredImage: dataUrl,
                    promptUsed: prompt,
                    engine: "gemini-3.1-flash-lite-image",
                  });
                }
              }
            } catch (err: unknown) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              console.warn("Server-side Gemini wall recolor fallback triggered:", errorMsg);
            }
          }

          // Return high-precision composite instructions and structured prompt
          return Response.json({
            success: true,
            recoloredImage: null,
            promptUsed: prompt,
            color: {
              colorName,
              colorCode,
              hexCode,
              finishType,
            },
            engine: "photorealistic-shader-composite",
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return Response.json(
            {
              success: false,
              error: message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
