import { Mina, Field, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { VotingInstance, ClaimsVotingFactory } from "./claims-voting-factory.js";
import { ClaimVotingContract } from './ClaimVotingContract.js';

export { rollupClaims };

const ROLLUP_TX_FEE = 300_000_000;


async function rollupClaims(
  running: VotingInstance[],
  payerAccount: PublicKey,
  payerSecret: PrivateKey
): Promise<VotingInstance[]> {
  let updatedQueue = [];

  for (let j=0; j < running.length; j++) {
    let instance = running[j].instance;
    let instancePuk = running[j].address;

    // first check if finished (result > 0)
    let result: Field = instance.result.get();
    const isFinished = result.greaterThan(Field(0)).toBoolean();
    if (isFinished)
      continue; // it will not be copied to the updated queue 

    // still voting, must leave it in the queue and go on ...
    updatedQueue.push(running[j]);

    let claimUid: Field = instance.claimUid.get();
    console.log("\nrollingClaims running claimUid= ", claimUid.toString());

    // do we have pending votes ?
    // CAUTION: we must be sure about what does reducer.getActions() really
    // returns because it may be misgiding
    let actionsState: Field = await instance.actionsState.get();
    console.log("actionsState=", actionsState.toString());

    let pending: any = await Mina.fetchActions(instancePuk, {
      fromActionState: actionsState
    });
    console.log("rollingClaims pending votes= ", JSON.stringify(pending,null,2));
    let pendingCount = pending.length;
    
    // if no pending votes we just go to the next instance ...
    // we run rollup ONLY when we have something to rollup
    // if (pendingCount === 0) continue;
    
    // we should check here if payer has funds for TX fees
    // ...

    // run the rollup now
    try {
      let tx = await Mina.transaction(
        { sender: payerAccount, fee: ROLLUP_TX_FEE }, 
        () => { instance.rollupVotes(); }
      );
      await tx.prove();
      tx.sign([payerSecret]);
      let pendingTx = await tx.send();
  
      // check if Tx was success or failed
      if (!pendingTx.isSuccess) {
        console.log('error sending transaction (see above)');
        // process.exit(0); // we will NOT exit here, but retry latter !!!
        continue; 
      }
      console.log(
        `See transaction at https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}
        Waiting for transaction to be included...`
      );
  
      // TODO: I am not sure we need to do this or if we can send another transaction
      // while this one is being processed ...
      await pendingTx.wait();
    }
    catch (err: any) {
      console.log("rollingClaims failed on rollup=", err.toString())
    }
  }

  return updatedQueue; // the modified running queue
}

/*
async function runRollerService(
  payerAccount: PublicKey,
  payerSecret: PrivateKey
) {
  // VERY NAIVE IMPL just to test running multiple claims 
  // this will not good in prod because of tx fees will escalate ??? 
  // Would need to use a scheduler instead of this, but anyway
  // fees should only be paid when we have pending votes to process
  let isRolling = false;
  const ROLLUP_EVERY = (60*1000*1); // 1 min

  let running: VotingInstance[] = [];
  // we should load the list of open claims from the database and then
  // instantiate them here to fill the runningClaims queue
  // TODO ...
  let openClaims: any[] = [];// await API.query("get_open_claims");
  (openClaims || []).forEach(async (claim: any) => {
    // const address = claims.accountId.toPublicKey();
    // const instance = await ClaimsVotingFactory.getInstance(address);
    // running.push(instance); 
  })

  // run the rollups forever ...
  // activate every minute
  setInterval(async () => {
    if (!isRolling) {
      isRolling = true; 
      let updated = await rollupClaims(
        running,
        // we should think about who will be the payer here, maybe a special 
        // Socialcap account for this funded on demand ?
        payerAccount, payerSecret 
      )
      running = updated;
      isRolling = false;
    }
  }, ROLLUP_EVERY);  
}
*/