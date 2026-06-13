import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getQuestionExamples, listQuestionTypes } from "@/lib/queries";
import {
  generateGovernedQuestion,
  questionLabStatus,
} from "@/lib/harness/worker";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 3;
const requestsByClient = new Map<string, number[]>();

export async function GET() {
  return NextResponse.json({
    ...questionLabStatus(),
    questionTypes: await listQuestionTypes(),
  });
}

export async function POST(request: Request) {
  if (!hasAccess(request)) {
    return NextResponse.json(
      { error: "Question Lab access token is missing or invalid." },
      { status: 401 }
    );
  }
  if (!withinRateLimit(request)) {
    return NextResponse.json(
      { error: "Question Lab rate limit reached. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    questionType?: unknown;
    exampleCount?: unknown;
  } | null;
  if (!body || typeof body.questionType !== "string") {
    return NextResponse.json(
      { error: "questionType must be a string." },
      { status: 400 }
    );
  }

  const questionTypes = await listQuestionTypes();
  if (!questionTypes.includes(body.questionType)) {
    return NextResponse.json({ error: "Unknown question type." }, { status: 400 });
  }

  const count =
    typeof body.exampleCount === "number" ? Math.round(body.exampleCount) : 5;
  try {
    const examples = await getQuestionExamples(body.questionType, count);
    return NextResponse.json(
      await generateGovernedQuestion(body.questionType, examples)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    const configurationError =
      message.includes("OPENAI_API_KEY") ||
      message.includes("QUESTION_LAB_ENABLED") ||
      message.includes("exceeded your current quota");
    return NextResponse.json(
      { error: message },
      { status: configurationError ? 503 : 500 }
    );
  }
}

function hasAccess(request: Request): boolean {
  const expected = process.env.QUESTION_LAB_ACCESS_TOKEN;
  if (!expected) return true;
  const supplied = request.headers.get("x-question-lab-token") ?? "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

function withinRateLimit(request: Request): boolean {
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const recent = (requestsByClient.get(client) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_REQUESTS) return false;
  recent.push(now);
  requestsByClient.set(client, recent);
  return true;
}
