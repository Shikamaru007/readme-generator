import { type ReadmeGenerationInput } from "@/utils/synthesizeReadme";
import { type InspectedRepository } from "@/utils/githubRepoInspection";

type GenerateAiReadmeParams = {
  input: ReadmeGenerationInput;
  repository: InspectedRepository | null;
};

export class AIConfigurationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AIConfigurationError";
    this.statusCode = statusCode;
  }
}

export async function generateReadmeWithAI({
  input,
  repository,
}: GenerateAiReadmeParams) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new AIConfigurationError(
      "GEMINI_API_KEY is missing. Add it to .env.local before using AI README generation.",
      500,
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: buildSystemInstruction(),
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildUserPrompt(input, repository),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | {
          error?: {
            message?: string;
            code?: string;
          };
        }
      | null;
    const upstreamMessage = errorPayload?.error?.message?.trim();

    throw new AIConfigurationError(
      upstreamMessage ||
        "The AI README generator could not produce a result right now. Try again in a moment.",
      response.status >= 400 && response.status < 600 ? response.status : 502,
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const markdown = normalizeMarkdown(extractTextFromCandidates(data.candidates));

  if (!markdown) {
    throw new AIConfigurationError(
      "The AI README generator returned an empty result.",
      502,
    );
  }

  return {
    markdown,
  };
}

function buildSystemInstruction() {
  return [
    "You write high-quality README.md files for software repositories.",
    "Use repository evidence first, manual user details second.",
    "Write the README as if the project owner or maintainer wrote it.",
    "Use natural first-person project-owner language when appropriate, such as 'I built', 'we use', 'this project includes', or direct instructional language.",
    "Do not mention AI, generation, prompts, repository analysis, source material, or that the text was produced automatically.",
    "Do not sound generic, robotic, or overly promotional.",
    "Prefer confident, clear documentation language over meta explanations.",
    "When information is missing, omit unsupported claims instead of filling the README with placeholders or obvious filler.",
    "Do not invent features, commands, architecture, or setup steps that are not supported by the repository context.",
    "If something is uncertain, state it cautiously and keep the README useful.",
    "Return only markdown for the README body.",
  ].join("\n");
}

function buildUserPrompt(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const manualContext = [
    `User-selected mode: ${input.mode}`,
    `Manual project name: ${input.projectName || "Not provided"}`,
    `Manual description: ${input.description || "Not provided"}`,
    `Manual installation details: ${input.installation || "Not provided"}`,
    `Manual usage details: ${input.usage || "Not provided"}`,
    `Manual tech stack: ${input.techStack || "Not provided"}`,
    `Manual license: ${input.license || "Not provided"}`,
    `Manual author: ${input.author || "Not provided"}`,
    `Repository URL: ${input.repositoryUrl || "Not provided"}`,
  ].join("\n");

  const repositoryContext = repository
    ? repository.summary
    : "No repository contents were inspected for this request.";

  return [
    "Generate a polished README.md for this project.",
    "The final README must read like the maintainer wrote it for real users.",
    "Do not use wording like 'this README was generated', 'the inspected repository', 'the available source material', 'based on the provided context', or similar meta phrasing.",
    "Avoid placeholder language unless a section would otherwise be empty; if evidence is weak, keep the wording simple and neutral.",
    "",
    "Manual user context:",
    manualContext,
    "",
    "Repository analysis:",
    repositoryContext,
    "",
    "The README should include a project title, description, installation, usage, tech stack, license, and author/maintainer section when the evidence supports it.",
  ].join("\n");
}

function extractTextFromCandidates(
  candidates:
    | Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>
    | undefined,
) {
  const text = (candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text?.trim() || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "";
}

function normalizeMarkdown(value: string) {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);

  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}
