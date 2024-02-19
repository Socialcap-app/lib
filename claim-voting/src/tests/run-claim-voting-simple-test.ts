import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ASSIGNED } from '@socialcap/contracts-lib';
import { BatchVoteNullifier, BatchVoteNullifierLeaf } from '@socialcap/batch-voting';
import { VoteValue } from '../ClaimVotingContract.js';
import { ClaimVotingInstance, deployClaimVotingContract } from "../claims-voting-factory.js";
import { ClaimElectorNullifier, ClaimElectorNullifierLeaf } from '../claim-elector-nullifier.js';
import { dispatchTheVote } from './dispatch-test-case.js';

// set instance
const Local = Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

// get some accounts
function getLocalAccount(j: number): { puk: PublicKey, prk: PrivateKey } {
  let acc = Local.testAccounts[j];
  return {
    puk: acc.publicKey, 
    prk: acc.privateKey
  };
}

let deployer = getLocalAccount(0);
let sender = getLocalAccount(1);
console.log("deployer Addr=", deployer.puk.toBase58());
console.log("sender Addr=", sender.puk.toBase58());

let claimUid = Field(1001); // the first Claim

//// deploy 4 instances, one for each test case ////
let zkClaim1: ClaimVotingInstance = await deployClaimVotingContract({
  claimUid: claimUid, // claimUid (simulated)
  requiredVotes: Field(3), // 3 total votes required
  requiredPositives: Field(2),  // 2 positives is approved
  deployerAccount: deployer.puk, 
  deployerKey: deployer.prk,
  isLocal: true 
});

//// we need to get some electors with their accountIds ////

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = getLocalAccount(3);
electors[1] = getLocalAccount(4);
electors[2] = getLocalAccount(5);
electors[3] = getLocalAccount(6);
electors[4] = getLocalAccount(7);

//// we need to build the electors Nullifier for assuring it has not voted twice ////

let assigned = Field(ASSIGNED);

let electorsInClaim = (new ClaimElectorNullifier())
  .addLeafs([ 
    { key: ClaimElectorNullifierLeaf.key(electors[0].puk, claimUid), value:assigned } 
    ,{ key: ClaimElectorNullifierLeaf.key(electors[1].puk, claimUid), value:assigned } 
    ,{ key: ClaimElectorNullifierLeaf.key(electors[2].puk, claimUid), value:assigned } 
    ,{ key: ClaimElectorNullifierLeaf.key(electors[3].puk, claimUid), value:assigned } 
  ]);

let electorPuks = electors.map((t) => t.puk); // as an array of Pubkeys

// assert
for (let k=0; k < 4; k++) {
  let root = electorsInClaim.root();
  let witness = electorsInClaim.witness(ClaimElectorNullifierLeaf.key(electors[k].puk, claimUid));
  const [witnessRoot, witnessKey] = witness.computeRootAndKey(ClaimElectorNullifierLeaf.ASSIGNED);
  witnessRoot.assertEquals(root);
}


//// RUN A simple test cases  ////

const bvnullified = (votes: any[]) => {
  return (new BatchVoteNullifier()).addLeafs(votes.map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }}))  
}

// All 3 votes are positive
{
  const votes = [
    { electorPuk: electors[0].puk, claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[1].puk, claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[2].puk, claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ];
  const votesInBatch = bvnullified(votes);
  
  for (let j=0; j < votes.length; j++) {
    let elector = electors[j];

    const VOTING_TX_FEE = 300_000_000;
    const senderAndFee = { sender: elector.puk, fee: VOTING_TX_FEE };

    let zkApp = zkClaim1.instance;

    let tx = await Mina.transaction(senderAndFee, () => { 
      zkApp.dispatchVote(
        elector.puk,
        votes[j].result, // +1 positive, -1 negative or 0 ignored
        votesInBatch.root(), // batchRoot: Field,
        votesInBatch.witness(BigInt(j)), // batchWitness: BatchVoteNullifierWitness, 
        electorsInClaim.root(), // nullifierRoot: Field,
        electorsInClaim.witness( // nullifierWitness: MerkleMapWitness
          ClaimElectorNullifierLeaf.key(elector.puk, claimUid)
        )        
      ); 
    });
    await tx.prove();
    tx.sign([elector.prk]);
    let pendingTx = await tx.send();
  }
}
