import { put } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const { prompt, model, style_preset } = await request.json();

  if (!prompt) {
    return new ChatSDKError(
      "bad_request:api",
      "Prompt is required.",
    ).toResponse();
  }

  try {
    const veniceResponse = await fetch(
      "https://api.venice.ai/api/v1/image/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || "venice-sd35",
          prompt,
          width: 1024,
          height: 1024,
          return_binary: true,
          format: "png",
          style_preset: style_preset,
          hide_watermark: true,
          safe_mode: false,
        }),
      },
    );

    if (!veniceResponse.ok) {
      const errorData = await veniceResponse.json();
      const errorMessage =
        errorData?.issues?.[0]?.message || JSON.stringify(errorData);
      return new ChatSDKError(
        "bad_request:api",
        `Venice API error: ${errorMessage}`,
      ).toResponse();
    }

    const imageBuffer = await veniceResponse.arrayBuffer();

    const filename = `generated-image-${Date.now()}.png`;

    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Error generating image:", error);
    return new ChatSDKError(
      "offline:chat",
      "Failed to generate image.",
    ).toResponse();
  }
}
