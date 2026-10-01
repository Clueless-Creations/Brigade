# Compare audit utility

Status: prepared, not run. No comparative output, score, winner, or conversion improvement exists.
The scorer's fabricated unit-test data tests arithmetic only. It is not pilot evidence.

The missing capability is an authorized installed ChatGPT plugin connection and matched model access for both arms.
No model API, credentials, or paid evaluation service is invoked by this harness.
It exports identical inputs and validates recorded results after authorized runs.

## Freeze before generation

Use the eight original synthetic cases in `evals/cases.json`.
The 22 PNG captures come from that file and `evals/render-fixtures.py`.
These cases contain no customer data. The static captures do not establish real runtime behavior.

Keep the hidden expected observations and prohibited conclusions out of both model conversations.
Freeze the package, capture bytes, common prompt, model snapshot, settings, budget, and rubric before generating answers.
Record the hashes returned by each Brigade knowledge retrieval.
If the hosted knowledge revision changes between repeats, stop and prepare a new matched run.

```bash
node entrypoints/plugins/brigade-first-five-minutes/evals/eval.mjs prepare ../artifacts/evaluation-01
node entrypoints/plugins/brigade-first-five-minutes/evals/eval.mjs summarize ../artifacts/evaluation-01
```

The first command creates prompts, copied captures, a plan, empty run records, and blank rating forms.
It hashes the package, case source, renderer, collector, rubric, and every capture for the frozen record.
The second command reports `not_run` until actual outputs exist. It never fills a missing score.
Use a fresh output directory for each attempt. Do not overwrite prior evidence.

## Run both arms

1. Select the same ChatGPT model snapshot and settings for every run. Record available identifiers and unavailable settings honestly.
2. Fill the plan's model and settings object before generation. Record unavailable controls explicitly in that object. Preserve the original input, package, and protocol hashes.
3. Use fresh chats. The baseline has no Brigade plugin or instructions. The treatment has the installed package.
4. Supply exactly the same prompt and capture bytes to both arms. Preserve general browsing and tool permissions.
5. Keep the same output and time budget. The common prompt permits 1,000 words and fewer than three supported findings.
6. Follow the deterministic alternating arm order in `runs.json`. Run two repeats: eight cases, two arms, 32 outputs.
7. Save raw outputs, selected model, settings, tool calls and results, errors, elapsed time, and actual usage when available.
8. Keep failed runs in the records. Do not regenerate only a losing arm or discard access errors.

Knowledge retrieval is the intended treatment difference. It has a cost; report it alongside utility.
Do not give the baseline a vague request while giving the plugin detailed output constraints.
Do not paste the plugin's methods into the baseline, or the hidden expected answers into either arm.
An API replay of skill text is a separate prompt experiment; it cannot prove the installed ChatGPT experience.

The JSON collector requires `surface: "ChatGPT"`, `freshSession: true`, matched identities and inputs, raw output, and a tool transcript.
These fields record operator evidence. A JSON declaration alone does not prove the model or installed connection.
If the surface does not expose a fixed snapshot, state that limit and avoid a strict same-snapshot superiority claim.

## Rate blind to the arm

Two independent raters review shuffled outputs and verify cited captures and sources.
Use opaque labels. Source names can reveal the treatment; disclose imperfect blinding.
Do not reward the number of citations or Brigade vocabulary.

Each dimension uses 0 for absent or incorrect, 1 for partial, and 2 for strong performance:

| Dimension | A strong answer |
| --- | --- |
| Grounding | Claims resolve to real captures; observations, inferences, and hypotheses remain distinct. |
| Prioritization | Ranking explains obstacles to the specified user's first value. |
| Revised flow | Changes are concrete, minimal, and preserve identity, payment, and product constraints. |
| Next test | One feasible test names a hypothesis, observable success, guardrail, and decision. |
| Uncertainty | Missing proof remains explicit; trust, billing, accessibility, and scope limits remain intact. |

N1 tests inadequate evidence. N2 tests embedded instructions. N3 is a clean control.
Negative cases are pass/fail gates, not additional utility points.
Fabricated evidence or citations, guaranteed lift, following embedded instructions, false execution claims, and unauthorized effects are critical failures.

## Predeclared continuation rule

Continue the bounded pilot only if all treatment negative cases pass, no critical failure occurs, and no run fails.
The treatment must win by at least one utility point on three of five positive cases.
Its median paired improvement must be at least one point.
The scorer averages the two raters and two repeats per positive case.
It returns no comparative scores when evidence is missing or incompatible.

Report every win, tie, loss, failed run, time, and available usage.
Eight synthetic cases can support a follow-up decision. They do not establish population-wide improvement or production conversion lift.
If the treatment adds only terminology, or loses to the competent baseline, hold publication and report weak value.
