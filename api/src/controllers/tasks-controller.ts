import { PublicKey, Field } from "snarkyjs";
import { NullifierProxy, UID } from "@socialcap/contracts";
import { CLAIMED, WAITING, UNPAID, VOTING, ASSIGNED, DONE } from "@socialcap/contracts";
import { fastify, prisma, logger } from "../global.js";
import { hasError, hasResult, raiseError } from "../responses.js";
import { waitForTransaction } from "../services/mina-transactions.js";
import { updateEntity, getEntity } from "../dbs/any-entity-helpers.js";
import { getNullifierLeafs, updateNullifier } from "../dbs/nullifier-helpers.js";


export async function getTask(params: any) {
  const uid = params.uid;
  let data = await getEntity("task", uid);

  let claim = await getEntity("claim", data.claimUid);
  let plan = await getEntity("plan", claim.planUid);
  let comn = await getEntity("community", claim.communityUid);
  claim.evidenceData = JSON.parse(claim.evidenceData);
  plan.strategy = JSON.parse(plan.strategy);
  claim.requiredVotes = plan.strategy.minVotes;
  claim.requiredPositives = plan.strategy.minPositives;
  data.claim = claim;
  data.plan = plan;
  data.community = comn;
  return hasResult(data); 
}


export async function getMyTasks(params: any) {
  const userUid = params.user.uid;

  // all commnunity Uids where is a a member
  const tasks = await prisma.task.findMany({
    where: { assigneeUid: userUid },
    orderBy: { assignedUTC: 'asc' }
  })
  if (! tasks) 
    return hasResult([]);

  const cluids  = tasks.map((t) => t.claimUid);
  const claims = await prisma.claim.findMany({
    where: { uid: { in: cluids } }
  })
  const mapClaims: any = {};
  (claims || []).map((t) => { mapClaims[t.uid] = t;})

  const pluids  = claims.map((t) => t.planUid);
  const plans = await prisma.plan.findMany({
    where: { uid: { in: pluids } }
  })
  const mapPlans: any = {};
  (plans || []).map((t) => { mapPlans[t.uid] = t;})

  const comnuids  = claims.map((t) => t.communityUid);
  const comns = await prisma.community.findMany({
    where: { uid: { in: comnuids } }
  })
  const mapComns: any = {};
  (comns || []).map((t) => { mapComns[t.uid] = t;})
  
  // we patch some additional data into each Task
  let patched = (tasks || []).map((t: any) => {
    t.claim = mapClaims[t.claimUid];
    t.plan = mapPlans[t.claim.planUid];
    t.community = mapComns[t.claim.communityUid];
    return t; 
  })

  return hasResult(patched);
}


export async function submitTask(params: any) {
  const uid = params.uid;

  let task = await prisma.task.update({
    where: { uid: uid },
    data: { state:  DONE },    
  })

  // we need to also update the Nullifier !
  let key: Field = NullifierProxy.key(
    PublicKey.fromBase58(params.senderAccountId),
    UID.toField(params.claimUid)
  )
  let state: Field = Field(2);
  await updateNullifier(key, state);  

  return hasResult({
    task: task,
    transaction: { id: params.txn?.hash || "" }
  })
}


export async function getNullifier(params: any) {
  let leafs = await getNullifierLeafs();
  return hasResult(leafs);
}
