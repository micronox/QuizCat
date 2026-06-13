# HARNESS.md — CCAT Leash

Purpose & System Overview

This harness governs a CCAT-style question generation system. The **worker agent** creates and revises one practice question at a time (comprising a prompt, answer choices, one correct answer, and an explanation). The **harness** completely owns the surrounding governance: it determines final acceptance, runs checkpoints, executes tools, handles persistence, and monitors safety/operational metrics. The worker agent cannot decide when a question is acceptable.  

```
User Request ➔ Harness ➔ Generation Request ➔ Worker Agent ➔ Candidate Question ➔ Harness Checkpoints ➔ Accepted/Revised/Rejected/Escalated
```

## Core Loop & Checkpoints

The harness runs a continuous loop until a user's `requestedQuestionCount` is successfully reached. If a candidate fails a checkpoint, the harness returns structured `CheckpointFeedback`  and permits a **maximum of 3 revisions** before emitting a `MAX_REVISIONS_EXCEEDED` alarm and forcing a new regeneration.  

### Checkpoint Validation Matrix

| **Checkpoint Name**      | **Pass Criteria**                                           | **Failure Behavior**                               |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| **Schema Check**         | Required fields are present, valid JSON, and structured     | Reject and regenerate using schema feedback        |
| **Answerability Check**  | Question prompt has sufficient information to solve         | Ask agent to revise stimulus or prompt wording     |
| **Single Answer Check**  | Exactly one answer choice is valid and correct              | Ask agent to revise choices or prompt              |
| **Explanation Check**    | Reasoning fully supports the declared correct answer        | Ask agent to correct/expand explanation logic      |
| **Math Check**           | Calculations strictly match deterministic tool output       | Revise math calculation, choices, or regenerate    |
| **Similarity Check**     | Question does not closely paraphrase seed or prior examples | Reject completely and regenerate fresh candidate   |
| **Category Check**       | Layout maps accurately to the requested taxonomy            | Revise taxonomy targeting or relabel category      |
| **Difficulty Check**     | Complexity aligns reasonably with requested target          | Revise or relabel difficulty                       |
| **Content Safety Check** | Content is appropriate for a general study tool             | Reject or revise offensive/unsafe entries          |
| **Export Readiness**     | Final record can be cleanly packaged to output schemas      | Fix structure to ensure clean output serialization |

## Technical Interfaces & Tooling

The harness treats the worker agent as completely replaceable via a swappable interface supporting two core operations:  

1. `generateQuestion(input: GenerationRequest): CandidateQuestion`   
2. `reviseQuestion(candidate: CandidateQuestion, feedback: CheckpointFeedback[]): CandidateQuestion`   

All data flowing through the loop is rigorously structured as programmatic objects. The worker never executes tools directly; it must request actions through the harness, which intercepts, executes, and records them into a `ToolCallTrace` object. Approved tools include an exact arithmetic calculator, deterministic math checkers, similarity detectors, and formatting validators.  

## Observability, Alarms, & Escalation

The system maintains strict observability across two data layers: **Quality Traces** (logging every candidate version, tool call trace, guardrail failure, and rejection reason)  and **Operational Metrics** (tracking token usage, cost limits, latency, and checkpoint failure frequencies).  

The harness will instantly halt automated processing and bundle a `HumanReviewPackage` for manual escalation when:  

- Tool outputs conflict directly with agent explanations.  
- A single checkpoint type repeatedly fails or a similarity score remains borderline.  
- Configured financial cost thresholds or token limits are approaching.  
- The system-wide acceptance rate falls below a designated threshold.  

## Implementation Priorities

- **Phase 1 — Basic Harness:** Enforce the minimum working loop. Run basic validation (schema, single answer, explanation), accept or reject candidates, and persist successful questions directly to a local JSON layout.  
- **Phase 2 — Tool-Based Validation:** Implement the integration of external deterministic tools (exact arithmetic calculator, math verifier, similarity checking engines).  
- **Phase 3 — Revision Loop:** Deploy the structured feedback array mechanism, enabling the swappable worker to process specific checkpoint failures within the revision ceiling.  
- **Phase 4 — Observability:** Build the logging and monitoring architecture to compute real-time operational metrics, token consumption, and cost tracking.  
- **Phase 5 — Alarms & Escalation:** Add final production safety controls, structured alarm handling, and automated human-in-the-loop packaging templates.  

> **Final Design Principle:** The worker agent creates. The harness governs. The harness must be deterministic wherever possible, explicit in every checkpoint, conservative in acceptance, and complete in traceability. No question is accepted simply because it looks good.  