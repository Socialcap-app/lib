import { Field } from "snarkyjs";
import { UID, ASSIGNED, UTCDateTime } from "@socialcap/contracts";
import { logger } from "../global.js";
import { updateEntity } from "../dbs/any-entity-helpers.js";
import { sendEmail } from "./email-service.js";

export {
  assignTaskToElectors
}


async function assignTaskToElectors(
  claim: any, 
  electors: any[]
) {

  (electors || []).forEach(async (elector) => {
    const now = UTCDateTime.now(); // millisecs since 1970
    const due = BigInt(10*24*60*60*1000) + now.toBigInt(); // 10 days

    let task = {
      uid: UID.uuid4(),
      claimUid: claim.uid,
      assigneeUid: elector.uid,
      state: ASSIGNED,
      assignedUTC: UTCDateTime.fromField(now),
      completedUTC: null,
      dueUTC: UTCDateTime.fromField(Field(due)),
      rewarded: 0,
      reason: 0,
    }

    let params: any = task;
    params.new = true;
    let tp = await updateEntity("task", task.uid, task);

    logger.debug("Assigned to=", elector.email, "task=", task)

    // send notifications
    const mailBody = `
      Hi there validator,

      You have been assigned task #${task.uid} !
      Please go to the Socialcap app and open the tab "My tasks".
      There you can evaluate this claim and emit your vote,
      Thanks in advance !

      The SocialCap team.
    `;

    await sendEmail ({
      email: elector.email,
      subject: "SocialCap is requesting your vote",
      text: "We need you to complete this task",
      content: mailBody,
    });
  })
} 
