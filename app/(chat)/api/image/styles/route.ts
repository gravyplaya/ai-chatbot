import { fetchVeniceImageStyles } from "@/lib/ai/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const imageStyles = await fetchVeniceImageStyles();
    return NextResponse.json(imageStyles);
  } catch (error) {
    console.error("Error fetching image styles:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
