import { fetchVeniceImageModels } from "@/lib/ai/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const imageModels = await fetchVeniceImageModels();
    return NextResponse.json(imageModels);
  } catch (error) {
    console.error("Error fetching image models:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
