#!/usr/bin/env node
/**
 * Credential-free self-test for message-batches.ts.
 * Fixture green ≠ live Message Batches proof — this only shapes requests and
 * joins results by custom_id against an in-memory fake API.
 */
import assert from "node:assert/strict";
import {
  BATCH_COMPLETION_WINDOW_HOURS,
  CUSTOM_ID_PATTERN,
  batchedMessages,
  mapResultsByCustomId,
  shapeBatchRequest,
  type BatchApi,
  type BatchResult,
} from "./message-batches.js";

function fakeApi(opts: {
  resultsByBatch?: Map<string, BatchResult[]>;
  statuses?: Map<string, string[]>;
}): BatchApi & { created: Array<{ requests: Array<{ custom_id: string; params: Record<string, unknown> }>; betas?: string[] }> } {
  let nextId = 1;
  const created: Array<{ requests: Array<{ custom_id: string; params: Record<string, unknown> }>; betas?: string[] }> = [];
  const resultsByBatch = opts.resultsByBatch ?? new Map<string, BatchResult[]>();
  const statuses = opts.statuses ?? new Map<string, string[]>();
  return {
    created,
    async create(input) {
      const id = `msgbatch_test_${nextId++}`;
      created.push({ requests: input.requests, betas: input.betas });
      if (!resultsByBatch.has(id)) {
        resultsByBatch.set(
          id,
          input.requests.map((request) => ({
            custom_id: request.custom_id,
            result: {
              type: "succeeded",
              message: { content: [{ type: "text", text: `ok:${request.custom_id}` }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } },
            },
          })),
        );
      }
      statuses.set(id, ["in_progress", "ended"]);
      return { id, processing_status: "in_progress" };
    },
    async retrieve(id) {
      const queue = statuses.get(id) ?? ["ended"];
      const processing_status = queue.length > 1 ? (queue.shift() as string) : queue[0]!;
      return { id, processing_status };
    },
    async results(id) {
      const rows = resultsByBatch.get(id) ?? [];
      return (async function* () {
        for (const row of rows) yield row;
      })();
    },
  };
}

async function main(): Promise<void> {
  assert.equal(BATCH_COMPLETION_WINDOW_HOURS, 24, "completion window constant must match documented Batches API");
  assert.ok(CUSTOM_ID_PATTERN.test("agent_stale-installed-skill-runtime_r1"));
  assert.ok(!CUSTOM_ID_PATTERN.test("bad id with spaces"));

  {
    const shaped = shapeBatchRequest("agent_demo_r1", {
      custom_id: "agent_demo_r1",
      betas: ["server-side-fallback-2026-07-01"],
      model: "claude-opus-5",
      max_tokens: 16,
      messages: [{ role: "user", content: "hi" }],
    });
    assert.equal(shaped.custom_id, "agent_demo_r1");
    assert.equal("custom_id" in shaped.params, false, "custom_id must not leak into Messages params");
    assert.equal("betas" in shaped.params, false, "betas belong on the batch create, not per-request params");
    assert.equal(shaped.params.model, "claude-opus-5");
  }

  {
    const rows: BatchResult[] = [
      {
        custom_id: "b",
        result: { type: "succeeded", message: { content: [{ type: "text", text: "second" }], stop_reason: "end_turn" } },
      },
      {
        custom_id: "a",
        result: { type: "succeeded", message: { content: [{ type: "text", text: "first" }], stop_reason: "end_turn" } },
      },
    ];
    const mapped = mapResultsByCustomId(["a", "b"], rows);
    assert.equal((mapped.get("a")?.content as Array<{ text: string }>)[0]?.text, "first");
    assert.equal((mapped.get("b")?.content as Array<{ text: string }>)[0]?.text, "second");
  }

  {
    assert.throws(
      () =>
        mapResultsByCustomId(
          ["a"],
          [
            { custom_id: "a", result: { type: "succeeded", message: { content: [] } } },
            { custom_id: "a", result: { type: "errored" } },
          ],
        ),
      /duplicate batch custom_id/,
    );
    assert.throws(
      () => mapResultsByCustomId(["a"], [{ custom_id: "z", result: { type: "succeeded", message: { content: [] } } }]),
      /Unexpected or duplicate batch custom_id/,
    );
  }

  {
    const api = fakeApi({});
    const events: unknown[] = [];
    const createMessage = batchedMessages(
      api,
      (event) => events.push(event),
      async () => undefined,
    );
    const [one, two] = await Promise.all([
      createMessage({ custom_id: "agent_one_r1", model: "claude-opus-5", max_tokens: 8, messages: [{ role: "user", content: "1" }] }),
      createMessage({ custom_id: "agent_two_r1", model: "claude-opus-5", max_tokens: 8, messages: [{ role: "user", content: "2" }] }),
    ]);
    assert.equal(api.created.length, 1, "same-tick agent calls must form one batch");
    assert.deepEqual(api.created[0]!.requests.map((request) => request.custom_id).sort(), ["agent_one_r1", "agent_two_r1"]);
    assert.equal((one.content as Array<{ text: string }>)[0]?.text, "ok:agent_one_r1");
    assert.equal((two.content as Array<{ text: string }>)[0]?.text, "ok:agent_two_r1");
    assert.ok(events.some((event) => (event as { stage?: string }).stage === "submitted"));
  }

  {
    const api = fakeApi({});
    const createMessage = batchedMessages(
      api,
      () => undefined,
      async () => undefined,
    );
    const agent = await createMessage({
      custom_id: "agent_scenario_r1",
      betas: ["server-side-fallback-2026-07-01"],
      model: "claude-opus-5",
      max_tokens: 8,
      messages: [{ role: "user", content: "agent" }],
    });
    const grade = await createMessage({
      custom_id: "grade_scenario_r1",
      betas: ["server-side-fallback-2026-07-01"],
      model: "claude-opus-5",
      max_tokens: 8,
      messages: [{ role: "user", content: `grade:${String((agent.content as Array<{ text: string }>)[0]?.text)}` }],
    });
    assert.equal(api.created.length, 2, "grades after agents resolve must form a second batch");
    assert.equal(api.created[0]!.requests[0]!.custom_id, "agent_scenario_r1");
    assert.equal(api.created[1]!.requests[0]!.custom_id, "grade_scenario_r1");
    assert.deepEqual(api.created[0]!.betas, ["server-side-fallback-2026-07-01"]);
    assert.equal((grade.content as Array<{ text: string }>)[0]?.text, "ok:grade_scenario_r1");
  }

  {
    const resultsByBatch = new Map<string, BatchResult[]>();
    const api = fakeApi({ resultsByBatch });
    // Intercept create to plant an out-of-order errored+succeeded mix.
    const originalCreate = api.create.bind(api);
    api.create = async (input) => {
      const batch = await originalCreate(input);
      resultsByBatch.set(batch.id, [
        { custom_id: "item_b", result: { type: "errored" } },
        {
          custom_id: "item_a",
          result: {
            type: "succeeded",
            message: { content: [{ type: "text", text: "alive" }], stop_reason: "end_turn", usage: { input_tokens: 2, output_tokens: 2 } },
          },
        },
      ]);
      return batch;
    };
    const createMessage = batchedMessages(
      api,
      () => undefined,
      async () => undefined,
    );
    const [a, b] = await Promise.all([
      createMessage({ custom_id: "item_a", model: "m", max_tokens: 1, messages: [] }),
      createMessage({ custom_id: "item_b", model: "m", max_tokens: 1, messages: [] }),
    ]);
    assert.equal((a.content as Array<{ text: string }>)[0]?.text, "alive");
    assert.equal(a.stop_reason, "end_turn");
    assert.deepEqual(b.content, []);
    assert.equal(b.stop_reason, "batch_errored");
  }

  {
    const api = fakeApi({});
    const createMessage = batchedMessages(
      api,
      () => undefined,
      async () => undefined,
      () => "msgbatch_resumed",
    );
    // Seed retrieve/results for the resumed id.
    const statuses = new Map<string, string[]>([["msgbatch_resumed", ["ended"]]]);
    api.retrieve = async (id) => ({ id, processing_status: (statuses.get(id) ?? ["ended"])[0]! });
    api.results = async (id) =>
      (async function* () {
        yield {
          custom_id: "resume_one",
          result: { type: "succeeded", message: { content: [{ type: "text", text: "resumed" }], stop_reason: "end_turn" } },
        };
        void id;
      })();
    const message = await createMessage({ custom_id: "resume_one", model: "m", max_tokens: 1, messages: [] });
    assert.equal(api.created.length, 0, "resume must not create a new batch");
    assert.equal((message.content as Array<{ text: string }>)[0]?.text, "resumed");
  }

  console.log("ALL_PASSED");
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
