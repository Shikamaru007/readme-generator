import { type ReadmeGenerationInput } from "@/utils/synthesizeReadme";
import { type InspectedRepository } from "@/utils/githubRepoInspection";

type GenerateAiReadmeParams = {
  input: ReadmeGenerationInput;
  repository: InspectedRepository | null;
};

export class AIConfigurationError extends Error {
  statusCode: number;
  fallbackNotice: string;

  constructor(message: string, statusCode = 500, fallbackNotice?: string) {
    super(message);
    this.name = "AIConfigurationError";
    this.statusCode = statusCode;
    this.fallbackNotice = fallbackNotice || message;
  }
}

export async function generateReadmeWithAI({
  input,
  repository,
}: GenerateAiReadmeParams) {
  const { apiKey, model } = getGeminiConfig();

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
    const details = classifyGeminiError(response.status, model, upstreamMessage);

    throw new AIConfigurationError(
      details.logMessage,
      response.status >= 400 && response.status < 600 ? response.status : 502,
      details.userMessage,
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
      "The AI service returned an empty response, so the README was assembled with the fallback generator.",
    );
  }

  return {
    markdown,
  };
}

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new AIConfigurationError(
      "No Gemini API key was found in the server environment.",
      500,
      "AI generation is unavailable because the deployment is missing `GEMINI_API_KEY` or `GOOGLE_API_KEY`, so the fallback generator was used.",
    );
  }

  return { apiKey, model };
}

function classifyGeminiError(
  statusCode: number,
  model: string,
  upstreamMessage?: string,
) {
  const normalizedMessage = upstreamMessage?.toLowerCase() || "";

  if (statusCode === 400 && normalizedMessage.includes("api key")) {
    return {
      logMessage: upstreamMessage || "Gemini rejected the API key.",
      userMessage:
        "AI generation is unavailable because the configured Gemini API key was rejected, so the fallback generator was used.",
    };
  }

  if (statusCode === 400 && normalizedMessage.includes("model")) {
    return {
      logMessage: upstreamMessage || `Gemini model '${model}' is not available.`,
      userMessage:
        `AI generation is unavailable because the configured Gemini model \`${model}\` is not available to this deployment, so the fallback generator was used.`,
    };
  }

  if (statusCode === 403) {
    return {
      logMessage: upstreamMessage || "Gemini access was forbidden.",
      userMessage:
        "AI generation is unavailable because the Gemini API key does not have permission for this request, so the fallback generator was used.",
    };
  }

  if (statusCode === 404) {
    return {
      logMessage: upstreamMessage || `Gemini model '${model}' was not found.`,
      userMessage:
        `AI generation is unavailable because the configured Gemini model \`${model}\` could not be found, so the fallback generator was used.`,
    };
  }

  if (statusCode === 429) {
    return {
      logMessage: upstreamMessage || "Gemini rate limit hit.",
      userMessage:
        "AI generation is temporarily rate-limited, so the fallback generator was used for this request.",
    };
  }

  return {
    logMessage:
      upstreamMessage ||
      "The AI README generator could not produce a result right now. Try again in a moment.",
    userMessage:
      "AI generation is temporarily unavailable, so the README was assembled from repository evidence and your provided details.",
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
