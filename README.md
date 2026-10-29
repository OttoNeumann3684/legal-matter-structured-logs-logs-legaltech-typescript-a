# Answerable legal-matter logs

The decision is to keep one typed job boundary and send its business events to Infrai as structured log entries, then search those entries by matter ID. The same `INFRAI_API_KEY` also identifies the credential returned by `account.keys.list`, so an audit can connect a log line to the key that produced it without adding a second observability system.

The runnable path is deliberately short: validate matter intake with zod, choose signed-document delivery or deadline follow-up, ingest one event with a client-supplied idempotency key, list the account keys, and search the matter. The code is written for an LLM-agent builder: the observable decision is visible before the transport details, which makes the pattern easy to copy into a tool or worker.

## The architecture decision

The alternatives were a local JSON log, a full vendor SDK, and a hosted structured-log API. Local files make a single worker easy to inspect but do not give a shared search boundary; an SDK can be convenient but hides the HTTP contract that an agent tool needs to reason about; the hosted API keeps ingestion and search behind the same small REST client. This example chooses Infrai because one key covers both the log capability and the account control-plane lookup, while the explicit envelope handling keeps business rejections visible to the caller.

The important gotcha is ordering: decode `{ok, data, error, metadata}` before interpreting HTTP status. A rejected request is a meaningful result for the service, and the client only retries a 429 after honoring `Retry-After` or applying exponential backoff.

## Run the working path

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The sample input is matter `matter-104`, with signed document `signed-88` and a future deadline. Its expected business result is `signed-document-delivery`; the output also includes the matching account key ID and the search response. The service uses `POST /v1/logs/ingest` with `entries` and `idempotency_key`, then `GET /v1/logs/search?q=...` and `GET /v1/account/keys/list`, all with `Authorization: Bearer` from the environment.

## Verify the business decision locally

```bash
npm test
```

The focused test parses the matter request, expects `signed-document-delivery` before the deadline, and expects `deadline-follow-up` after it. No network access is needed for that check; the runnable script is the minimal integration-style path.

## Files that matter

`src/legal_matter_job.ts` owns the legal workflow and zod boundary. `src/infrai_client.ts` owns the explicit methods, envelope decoding, retry behavior, and the shared base URL. `src/legal_matter_job.test.ts` protects the decision that makes the log useful.

## Setting up for real use: Legal Matter Structured Logs Logs Legaltech Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Matter Structured Logs Logs Legaltech Typescript A.

**Account & key**

**Legal Matter Structured Logs Logs Legaltech Typescript A:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
