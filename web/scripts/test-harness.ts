import assert from "node:assert/strict";
import { calculate } from "../lib/harness/calculator";
import { runCheckpoints } from "../lib/harness/checkpoints";
import type { CandidateQuestion, Question } from "../lib/types";

assert.equal(calculate("2 + 3 * 4"), 14);
assert.equal(calculate("(2 + 3) ^ 2"), 25);
assert.throws(() => calculate("process.exit()"));
assert.throws(() => calculate("1 / 0"));

const example: Question = {
  id: 1,
  externalId: null,
  origin: "test",
  sourceExam: null,
  sourceFile: null,
  sourceCategory: null,
  sourceQuestionNumber: null,
  category: "Numerical",
  questionType: "Number Series",
  prompt: "What number comes next?",
  stimulus: "1, 2, 3, 4",
  stimulusType: "text",
  correctChoiceLabel: "A",
  correctChoiceText: "5",
  explanation: "The sequence increases by one, so the answer is 5.",
  choices: [
    { label: "A", text: "5", position: 1 },
    { label: "B", text: "6", position: 2 },
    { label: "C", text: "7", position: 3 },
    { label: "D", text: "8", position: 4 },
  ],
};

const candidate: CandidateQuestion = {
  category: "Numerical",
  questionType: "Number Series",
  prompt: "What number comes next in the sequence?",
  stimulus: "7, 10, 13, 16",
  choices: [
    { label: "A", text: "18" },
    { label: "B", text: "19" },
    { label: "C", text: "20" },
    { label: "D", text: "21" },
  ],
  correctChoiceLabel: "B",
  explanation:
    "Each term increases by three, so adding three to sixteen gives the correct answer 19.",
  verificationExpression: "16 + 3",
};

const passing = runCheckpoints(candidate, "Number Series", [example]);
assert.equal(
  passing.filter((checkpoint) => !checkpoint.passed).length,
  0,
  JSON.stringify(passing)
);

const failing = runCheckpoints(
  { ...candidate, correctChoiceLabel: "D" },
  "Number Series",
  [example]
);
assert.equal(
  failing.find((checkpoint) => checkpoint.name === "Math")?.passed,
  false
);

console.log("Harness deterministic checks passed.");
