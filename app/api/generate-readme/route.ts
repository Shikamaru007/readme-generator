import { NextResponse } from "next/server";
import {
  synthesizeReadme,
  type GenerationMode,
  type ReadmeGenerationInput,
} from "@/utils/synthesizeReadme";

type GenerateReadmeRequest = {
  mode?: GenerationMode;
  formData?: {
    repositoryUrl?: string;
    projectName?: string;
    description?: string;
    installation?: string;
    usage?: string;
    techStack?: string;
    license?: string;
    author?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateReadmeRequest;
    const input = buildInput(body);
    const result = await synthesizeReadme(input);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to generate the README right now." },
      { status: 500 },
    );
  }
}

function buildInput(body: GenerateReadmeRequest): ReadmeGenerationInput {
  return {
    mode: body.mode === "manual" ? "manual" : "github",
    repositoryUrl: body.formData?.repositoryUrl,
    projectName: body.formData?.projectName,
    description: body.formData?.description,
    installation: body.formData?.installation,
    usage: body.formData?.usage,
    techStack: body.formData?.techStack,
    license: body.formData?.license,
    author: body.formData?.author,
  };
}
