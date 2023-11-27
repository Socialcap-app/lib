import { Mina, PrivateKey, PublicKey, Field, MerkleMapWitness } from 'o1js';
import { ClaimVotingContract } from '../ClaimVotingContract.js';
import { 
  ElectorsInClaimNullifier, 
  VotesInBatchNullifier, 
  VotesInBatchWitness 
} from '@socialcap/contracts-lib';


async function dispatchTheVote(
  zkClaim: ClaimVotingContract,
  sender: {puk: PublicKey, prk: PrivateKey}, // sender and voter MUST be the same!
  vote: Field, // +1 positive, -1 negative or 0 ignored
  batchRoot: Field,
  batchWitness: VotesInBatchWitness, 
  nullifierRoot: Field,
  nullifierWitness: MerkleMapWitness
) {
  // send the Vote Now
  const VOTING_TX_FEE = 300_000_000;
  const senderAndFee = { sender: sender.puk, fee: VOTING_TX_FEE };
  console.log(`\ndispatchVote claim=${zkClaim.claimUid.get()} vote=${vote} payer=${sender.puk.toBase58()}`);  

  try {
    let tx = await Mina.transaction(senderAndFee, () => { 
      zkClaim.dispatchVote(
        sender.puk,
        vote, // +1 positive, -1 negative or 0 ignored
        batchRoot,
        batchWitness,
        nullifierRoot,
        nullifierWitness
      ); 
    });
    await tx.prove();
    tx.sign([sender.prk]);
    let pendingTx = await tx.send();

    // check if Tx was success or failed
    if (!pendingTx.isSuccess) {
      console.log('error sending transaction (see above)');
      // process.exit(0); // we will NOT exit here, but retry latter !!!
      // break; 
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
    console.log("helpers sendVote ERROR=", err.toString())
  }
}


export async function dispatchTestCase(
  zkClaim: ClaimVotingContract,
  claimUid: Field,
  testCase: { batches: any[], nullis: VotesInBatchNullifier[] },
  electors: { puk: PublicKey, prk: PrivateKey }[],
  electorsInClaim: ElectorsInClaimNullifier
) {
  for (let j=0; j < testCase.batches.length; j++) {
    let votes = testCase.batches[j];
    let nulli = testCase.nullis[j];
  
    // now we dispatch the votes for this claim in each batch
    await dispatchTheVote(
      zkClaim, 
      electors[j],
      votes[0].result, // first batch
      nulli.root(),
      nulli.witness(0n),
      electorsInClaim.root(),
      electorsInClaim.witness(electors[j].puk, claimUid)
    );
  }

  let result = zkClaim.result.get();
  return result;
}
