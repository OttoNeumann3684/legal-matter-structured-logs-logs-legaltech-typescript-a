import assert from "node:assert/strict";
import { nextMatterAction, matterIntake } from "./legal_matter_job.ts";

const input = matterIntake.parse({ matterId: "matter-104", clientName: "Northstar Legal", documentId: "signed-88", deadline: "2026-10-25T17:00:00Z" });
assert.equal(nextMatterAction(input, new Date("2026-10-24T12:00:00Z")), "signed-document-delivery");
assert.equal(nextMatterAction(input, new Date("2026-10-26T12:00:00Z")), "deadline-follow-up");
console.log("matter action decision passed");
