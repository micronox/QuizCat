import { NextResponse } from "next/server";
import { getQuestionExamples, listQuestionTypes } from "@/lib/queries";
import {
  generateGovernedQuestion,
  questionLabStatus,
} from "@/lib/harness/worker";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ...questionLabStatus(),
    questionTypes: await listQuestionTypes(),
  });
}

export async function POST(request: Request) {
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
      message.includes("QUESTION_LAB_ENABLED");
    return NextResponse.json(
      { error: message },
      { status: configurationError ? 503 : 500 }
    );
  }
}
