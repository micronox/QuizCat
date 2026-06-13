## Mathematical & Numerical Tools

CCAT math heavily features word problems, number series, algebraic logic, and data interpretation. LLMs notoriously struggle with precise mental arithmetic and multi-step algebraic manipulation.

- **Python Code Interpreter (Sandboxed):** This is the single most critical tool. Instead of letting the LLM calculate answers, it should write a Python script to solve the problem.
  - *Why it’s needed:* Solving complex algebra, calculating percentages, and finding the next number in a tricky sequence (e.g., $+2, -1, *3$ patterns).
  - *Libraries to include:* `sympy` (for symbolic math and solving equations), `numpy` (for fast array operations).
- **Fraction & Percentage Normalizer:** CCAT math loves mixing formats (e.g., "What is $1/4$ of $80\%$ of $X$?").
  - *Why it’s needed:* A simple utility tool that converts all mixed numbers, fractions, and percentages into standard decimals before processing can drastically reduce LLM reasoning errors.

------

## 2. Tables & Graphs Tools (Text-Based Data Interpretation)

Since you are not using vision, graphs (bar charts, line graphs, pie charts) and tables must be converted into a textual format (like Markdown tables, CSV strings, or JSON) *before* being fed to the agent. The agent needs tools to query this data efficiently.

- **Structured Data Query Tool (Pandas/SQL Wrapper):** * *Why it’s needed:* CCAT data interpretation questions usually ask the agent to compare data points across a large table (e.g., "Which department had the highest percentage growth between 2022 and 2024?").
  - *How it works:* The agent passes a question or a specific command, and the tool executes a `pandas` query (like `.loc`, `.groupby()`, or `.max()`) against the data dataframe. This prevents the LLM from hallucinating numbers when looking at a large text-based table.
- **Coordinate/Geometry Translation Engine:** CCAT sometimes includes basic geometric word problems or coordinate-based chart reading.
  - *Why it’s needed:* If a graph relies on reading specific $X, Y$ data points, you should provide a tool that allows the agent to look up exact values by key, rather than forcing it to read a messy raw text dump of a graph.

------

## 3. Verbal & Logic Tools

The CCAT verbal section tests vocabulary, word analogies, antonyms, and syllogisms (logical deductions). While LLMs are naturally better at verbal tasks, they can still stumble on nuance or strict formal logic.

- **Strict Syllogism Solver / SAT Solver:** CCAT logic questions look like: *"All inputs are outputs. Some outputs are errors. Therefore..."*
  - *Why it’s needed:* LLMs can fall into "common sense" traps rather than adhering to strict formal logic rules. A tool where the agent can map premises (e.g., `A -> B`, `Some B are C`) and evaluate validity using a formal logic parser prevents these logical slip-ups.
- **Dictionary / Thesaurus API:** * *Why it’s needed:* For advanced vocabulary and obscure antonym/synonym questions, relying entirely on the LLM's internal weights can fail if the word has multiple meanings. Giving it a tool to look up exact definitions, synonyms, and antonyms ensures near-100% accuracy on vocabulary matrices.
- **String Manipulation & Edit Distance Tool:** * *Why it’s needed:* Useful for word patterns or anagram-style questions (e.g., identifying word roots, prefixes, or letter rearrangements).

------

## Recommended Agent Architecture for the Harness

To make these tools effective, your harness should enforce a **Reasoning-Act-Observation (ReAct)** loop:

```
[Agent receives CCAT Question] 
              │
              ▼
    [Thought: I need to solve for X]
              │
              ▼
    [Call Tool: Python Interpreter] 
              │
              ▼
    [Observation: Output is 42]
              │
              ▼
    [Final Answer: Select Option C]
```

> **Crucial Tip for Your Harness:** Because CCAT is a strictly timed test (50 questions in 15 minutes), if you are trying to benchmark *human-like* pacing or optimization, you should add a **Time-Tracking Wrapper** to your harness. This tool tells the agent how many virtual "seconds" it has left, allowing you to test if the agent can learn to skip overly complex math problems to farm easier verbal points.