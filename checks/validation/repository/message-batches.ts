/**
 * Message Batches helper for the behavioral-eval harness.
 *
 * Same-tick createMessage calls coalesce into one batch (scenario prompts).
 * Calls that only start after that batch ends form the next batch (grades).
 * Results are always joined by `custom_id`, never by array position — the
 * Batches API may return rows in any order. Anthropic documents a 24-hour
 * completion window (`expires_at`); we accept that window by polling until
 * `processing_status === "ended"` (or the caller abandons and `--resume`s).
 *
 * See https://platform.claude.com/docs/en/build-with-claude/batch-processing
 */

/** Documented Batches API processing window we accept (hours). */
export const BATCH_COMPLETION_WINDOW_HOURS = 24;

/** custom_id shape required by the Message Batches API. */
export const CUSTOM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export interface BatchMessage {
  content: unknown;
  stop_reason?: unknown;
  usage?: unknown;
}

export interface BatchResult {
  custom_id: string;
  result: { type: string; message?: BatchMessage };
}

export interface BatchApi {
  create(input: {
    requests: Array<{ custom_id: string; params: Record<string, unknown> }>;
    betas?: string[];
  }): Promise<{ id: string; processing_status: string }>;
  retrieve(id: string): Promise<{ id: string; processing_status: string }>;
  results(id: string): Promise<AsyncIterable<BatchResult>>;
}

export type BatchCreateParams = Record<string, unknown> & {
  /** Optional caller-supplied id; must match CUSTOM_ID_PATTERN. Stripped before the Messages params are sent. */
  custom_id?: string;
  betas?: string[];
};

/** Strip harness-only fields and shape one Batches API request row. */
export function shapeBatchRequest(customId: string, params: Record<string, unknown>): { custom_id: string; params: Record<string, unknown> } {
  if (!CUSTOM_ID_PATTERN.test(customId)) {
    throw new Error(`Invalid batch custom_id "${customId}" (must match ${CUSTOM_ID_PATTERN})`);
  }
  const { custom_id: _customId, betas: _betas, ...body } = params as BatchCreateParams;
  return { custom_id: customId, params: body };
}

/** Map a result row to a message; failed items become empty content with a batch_* stop_reason. */
export function messageFromBatchResult(row: BatchResult): BatchMessage {
  return row.result.type === "succeeded" && row.result.message ? row.result.message : { content: [], stop_reason: `batch_${row.result.type}` };
}

/**
 * Join result rows by custom_id. Throws on unexpected or duplicate ids.
 * Order of `rows` is irrelevant — never index by position.
 */
export function mapResultsByCustomId(expectedIds: Iterable<string>, rows: Iterable<BatchResult>): Map<string, BatchMessage> {
  const expected = new Set(expectedIds);
  const received = new Map<string, BatchMessage>();
  for (const row of rows) {
    if (!expected.has(row.custom_id) || received.has(row.custom_id)) {
      throw new Error(`Unexpected or duplicate batch custom_id: ${row.custom_id}`);
    }
    received.set(row.custom_id, messageFromBatchResult(row));
  }
  return received;
}

/** Same-tick requests form one batch. A dependent grading stage forms the next. */
export function batchedMessages(
  api: BatchApi,
  persist: (event: unknown) => void,
  wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  resume: (requests: unknown) => string | undefined = () => undefined,
) {
  let sequence = 0;
  let pending: Array<{
    id: string;
    params: Record<string, unknown>;
    resolve: (message: BatchMessage) => void;
    reject: (error: unknown) => void;
  }> = [];

  async function flush(): Promise<void> {
    const requests = pending;
    pending = [];
    try {
      const betas = [...new Set(requests.flatMap((request) => (Array.isArray(request.params.betas) ? (request.params.betas as string[]) : [])))];
      const requestIdentity = requests.map(({ id, params }) => shapeBatchRequest(id, params));
      const resumedId = resume(requestIdentity);
      let batch = resumedId
        ? await api.retrieve(resumedId)
        : await api.create({
            requests: requestIdentity,
            ...(betas.length ? { betas } : {}),
          });
      persist({ stage: "submitted", batch_id: batch.id, requests: requestIdentity });
      // Accept the Batches API completion window (BATCH_COMPLETION_WINDOW_HOURS):
      // poll until ended; do not invent a shorter local deadline.
      while (batch.processing_status !== "ended") {
        await wait(30_000);
        batch = await api.retrieve(batch.id);
        persist({ stage: "poll", batch_id: batch.id, processing_status: batch.processing_status });
      }
      const rows: BatchResult[] = [];
      for await (const row of await api.results(batch.id)) {
        persist({ stage: "result", batch_id: batch.id, ...row });
        rows.push(row);
      }
      const received = mapResultsByCustomId(
        requests.map(({ id }) => id),
        rows,
      );
      // Resolve together only after validating the entire result set. Grading
      // therefore submits once, regardless of result arrival order.
      for (const request of requests) {
        request.resolve(received.get(request.id) ?? { content: [], stop_reason: "batch_missing_result" });
      }
    } catch (error) {
      for (const request of requests) request.reject(error);
    }
  }

  return (params: BatchCreateParams): Promise<BatchMessage> =>
    new Promise((resolve, reject) => {
      const id = typeof params.custom_id === "string" && params.custom_id.length > 0 ? params.custom_id : `request_${++sequence}`;
      if (!CUSTOM_ID_PATTERN.test(id)) {
        reject(new Error(`Invalid batch custom_id "${id}" (must match ${CUSTOM_ID_PATTERN})`));
        return;
      }
      pending.push({ id, params, resolve, reject });
      if (pending.length === 1) {
        queueMicrotask(() => {
          void flush();
        });
      }
    });
}
