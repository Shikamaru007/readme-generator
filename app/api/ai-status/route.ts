import { NextResponse } from "next/server";
import { getGeminiConfig } from "@/utils/aiReadmeGenerator";

export async function GET() {
  try {
    const { model } = getGeminiConfig();

    return NextResponse.json({
      ok: true,
      configured: true,
      model,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI configuration could not be verified.";

    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
