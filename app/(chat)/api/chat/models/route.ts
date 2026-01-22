import { getChatModels } from "@/lib/ai/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const models = await getChatModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching chat models:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
