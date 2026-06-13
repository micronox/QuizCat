import type {
  CandidateQuestion,
  HarnessCheckpoint,
  Question,
} from "@/lib/types";
import { calculate } from "./calculator";

const MATH_TYPES = new Set([
  "Applied Quantitative Word Problems",
  "Basic Numeric Calculation & Comparison",
  "Number Series",
  "Percent, Ratio & Proportion",
  "Tables & Graphs",
]);

export function runCheckpoints(
  candidate: CandidateQuestion,
  requestedType: string,
  examples: Question[]
): HarnessCheckpoint[] {
  const choices = candidate.choices ?? [];
  const labels = choices.map((choice) => choice.label.trim().toUpperCase());
  const correctLabel = candidate.correctChoiceLabel.trim().toUpperCase();
  const correctChoice = choices.find(
    (choice) => choice.label.trim().toUpperCase() === correctLabel
  );
  const similarity = highestSimilarity(
    `${candidate.stimulus} ${candidate.prompt}`,
    examples.map((example) => `${example.stimulus} ${example.prompt}`)
  );

  const checkpoints: HarnessCheckpoint[] = [
    check(
      "Schema",
      Boolean(
        candidate.prompt?.trim() &&
          candidate.questionType?.trim() &&
          candidate.category?.trim() &&
          candidate.explanation?.trim()
      ) &&
        choices.length === 4 &&
        choices.every((choice) => choice.label?.trim() && choice.text?.trim()),
      "Required fields are present and exactly four choices are provided."
    ),
    check(
      "Single answer",
      new Set(labels).size === choices.length &&
        Boolean(correctChoice) &&
        labels.filter((label) => label === correctLabel).length === 1,
      "Choice labels are unique and the declared answer identifies one choice."
    ),
    check(
      "Explanation",
      candidate.explanation.trim().length >= 30 &&
        Boolean(
          correctChoice &&
            candidate.explanation
              .toLowerCase()
              .includes(correctChoice.text.trim().toLowerCase())
        ),
      "The explanation is substantive and names the correct choice text."
    ),
    check(
      "Category",
      candidate.questionType.trim() === requestedType,
      `Question type must exactly match "${requestedType}".`
    ),
    check(
      "Similarity",
      similarity < 0.72,
      `Highest seed-question token similarity is ${similarity.toFixed(2)}; limit is 0.72.`
    ),
    check(
      "Content safety",
      !/\b(?:suicide|self-harm|porn|slur|graphic violence)\b/i.test(
        `${candidate.stimulus} ${candidate.prompt} ${candidate.explanation}`
      ),
      "Basic study-tool content safety screen passed."
    ),
    check(
      "Export readiness",
      canSerialize(candidate),
      "Candidate can be serialized into the review package."
    ),
  ];

  if (MATH_TYPES.has(requestedType)) {
    checkpoints.splice(4, 0, mathCheckpoint(candidate, correctChoice?.text));
  }

  return checkpoints;
}

function mathCheckpoint(
  candidate: CandidateQuestion,
  correctChoiceText: string | undefined
): HarnessCheckpoint {
  if (!candidate.verificationExpression.trim()) {
    return check(
      "Math",
      false,
      "A deterministic verification expression is required for this question type."
    );
  }
  try {
    const result = calculate(candidate.verificationExpression);
    const numericChoice = Number(
      correctChoiceText?.replace(/[$,%\s,]/g, "") ?? Number.NaN
    );
    const passed =
      Number.isFinite(numericChoice) && Math.abs(result - numericChoice) < 1e-8;
    return check(
      "Math",
      passed,
      `Safe calculator result: ${result}; declared answer value: ${
        Number.isFinite(numericChoice) ? numericChoice : "not numeric"
      }.`
    );
  } catch (error) {
    return check(
      "Math",
      false,
      `Safe calculator rejected the expression: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

function check(
  name: string,
  passed: boolean,
  successOrFailureDetail: string
): HarnessCheckpoint {
  return { name, passed, detail: successOrFailureDetail };
}

function canSerialize(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function highestSimilarity(text: string, examples: string[]): number {
  const target = tokens(text);
  return examples.reduce(
    (highest, example) => Math.max(highest, jaccard(target, tokens(example))),
    0
  );
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / union.size;
}
