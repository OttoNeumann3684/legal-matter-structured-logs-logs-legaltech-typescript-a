import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const matterIntake = z.object({
  matterId: z.string().min(1), clientName: z.string().min(1), documentId: z.string().min(1), deadline: z.string().min(1)
});
export type MatterIntake = z.infer<typeof matterIntake>;

export function nextMatterAction(input: MatterIntake, now = new Date()): "signed-document-delivery" | "deadline-follow-up" {
  const deadline = new Date(input.deadline);
  return deadline.getTime() <= now.getTime() ? "deadline-follow-up" : "signed-document-delivery";
}

export async function runMatterJob(input: unknown, client: InfraiClient, now = new Date()) {
  const matter = matterIntake.parse(input);
  const action = nextMatterAction(matter, now);
  const entry = { message: `matter ${matter.matterId}: ${action}`, level: "info", context: { matter_id: matter.matterId, client_name: matter.clientName, document_id: matter.documentId, deadline: matter.deadline, action } };
  await client.ingest([entry], `matter-${matter.matterId}-${action}`);
  const keys = await client.listKeys();
  const credential = keys.items?.find((item) => item.name === "legal-matter-service") ?? keys.items?.[0];
  return { matterId: matter.matterId, action, credentialKeyId: credential?.key_id ?? "unresolved" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const client = new InfraiClient(key);
  const result = await runMatterJob({ matterId: "matter-104", clientName: "Northstar Legal", documentId: "signed-88", deadline: "2099-06-30T17:00:00Z" }, client);
  const matches = await client.search(result.matterId);
  console.log(JSON.stringify({ result, matches }, null, 2));
}
