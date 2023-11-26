import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ClaimVotingInstance, deployVotingContract, compileVotingContract } from "../claims-voting-factory.js";
import { ElectorsInClaimNullifier, VotesInBatchNullifier } from '../../../lib/build/src/index.js';
import { dispatchTheVote } from './dispatch-vote.js';

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

// first compile it
await compileVotingContract();

let claimUid = Field(1001); // the first Claim

// now deploy  ONE Claim
let zkClaim1: ClaimVotingInstance = await deployVotingContract({
  claimUid: claimUid, // claimUid (simulated)
  requiredVotes: Field(3), // 3 total votes required
  requiredPositives: Field(2),  // 2 positives is approved
  deployerAccount: deployer.puk, 
  deployerKey: deployer.prk,
  isLocal: true 
});


//// we need to add some electors with their accountIds ////

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = getLocalAccount(3);
electors[1] = getLocalAccount(4);
electors[2] = getLocalAccount(5);
electors[3] = getLocalAccount(6);
electors[4] = getLocalAccount(7);

let electorsInClaim = new ElectorsInClaimNullifier();

let nullifier = electorsInClaim.addElectors(claimUid, [ 
  electors[0].puk, 
  electors[1].puk, 
  electors[2].puk, 
  electors[3].puk 
]);

//// need to create some batches and its Nullis ////

const votes0 = [
  { claimUid:  Field(1001), result: Field(+1)},
  { claimUid:  Field(1002), result: Field(+1)},
  { claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch0 = (new VotesInBatchNullifier()).addVotes(
  electors[0].puk, 
  votes0
)

const votes1 = [
  { claimUid:  Field(1001), result: Field(+1)},
  { claimUid:  Field(1002), result: Field(+1)},
  { claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch1 = (new VotesInBatchNullifier()).addVotes(
  electors[1].puk, 
  votes1
)

const votes2 = [
  { claimUid:  Field(1001), result: Field(+1)},
  { claimUid:  Field(1002), result: Field(+1)},
  { claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch2 = (new VotesInBatchNullifier()).addVotes(
  electors[2].puk, 
  votes2
)

//// now we dispatch the votes for this claim in each batch ////

await dispatchTheVote(
  zkClaim1.instance, 
  electors[0],
  votes0[0].result, // first batch
  votesInBatch0.root(),
  votesInBatch0.witness(0n),
  electorsInClaim.root(),
  electorsInClaim.witness(electors[0].puk, claimUid)
);

await dispatchTheVote(
  zkClaim1.instance, 
  electors[1],
  votes1[1].result, // 2nd batch
  votesInBatch1.root(),
  votesInBatch1.witness(0n),
  electorsInClaim.root(),
  electorsInClaim.witness(electors[1].puk, claimUid)
);

await dispatchTheVote(
  zkClaim1.instance, 
  electors[2],
  votes2[2].result, // 3rd batch
  votesInBatch2.root(),
  votesInBatch2.witness(0n),
  electorsInClaim.root(),
  electorsInClaim.witness(electors[2].puk, claimUid)
);
