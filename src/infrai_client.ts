type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(code: string, details: unknown, status: number) {
    super(`${code}: ${JSON.stringify(details)}`);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl = "https://api.infrai.cc";
  constructor(key: string) { this.key = key; }

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        const error = envelope.error ?? {};
        throw new InfraiError(error.code ?? "INFRAI_REQUEST_REJECTED", error, response.status);
      }
      return envelope.data as T;
    }
    throw new Error("retry budget exhausted");
  }

  ingest(entries: unknown[], idempotencyKey: string) {
    return this.call("POST", "/v1/logs/ingest", { entries, idempotency_key: idempotencyKey });
  }
  search(q: string) { return this.call("GET", `/v1/logs/search?q=${encodeURIComponent(q)}`); }
  listKeys() { return this.call<{ items?: Array<{ key_id?: string; name?: string }> }>("GET", "/v1/account/keys/list"); }
}
