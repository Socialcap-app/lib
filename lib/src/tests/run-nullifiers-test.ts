import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ElectorsInClaimNullifier } from '../index.js';
import { VoteInBatchLeaf, VotesInBatchNullifier, VotesInBatchWitness } from '../votes-in-batch-nullifier.js';

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

// this will be the test Claim Uid
let claimUid = Field(1001);

//// we need to add some electors with their accountIds ////

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = getLocalAccount(3);
electors[1] = getLocalAccount(4);
electors[2] = getLocalAccount(5);
electors[3] = getLocalAccount(6);
electors[4] = getLocalAccount(7);

//// need to create the ElectorsinClaim Nullifier ////

let electorsInClaim = (new ElectorsInClaimNullifier()).addElectors(claimUid, [ 
  electors[0].puk, 
  electors[1].puk, 
  electors[2].puk, 
  electors[3].puk 
]);

//// need to create some batches and its Nullis ////
let lastValue = Field(0), lastIndex = 0;

console.log(`\nBatch #0`);
console.log(`\nBatch #0`);
const votes0 = [
  { electorPuk: electors[0].puk, claimUid:  Field(1001), result: Field(+1)},
  { electorPuk: electors[0].puk, claimUid:  Field(1002), result: Field(+1)},
  { electorPuk: electors[0].puk, claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch0 = (new VotesInBatchNullifier()).addLeafs(votes0);
lastIndex = Number(votesInBatch0.lastIndex());
lastValue = VoteInBatchLeaf.value(votes0[lastIndex])  
votesInBatch0.assertLeaf(votesInBatch0.root(), BigInt(lastIndex), lastValue);

console.log(`\nBatch #1`);
const votes1 = [
  { electorPuk: electors[1].puk, claimUid:  Field(1001), result: Field(+1)},
  { electorPuk: electors[1].puk, claimUid:  Field(1002), result: Field(+1)},
  { electorPuk: electors[1].puk, claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch1 = (new VotesInBatchNullifier()).addLeafs(votes1);
lastIndex = Number(votesInBatch1.lastIndex());
lastValue = VoteInBatchLeaf.value(votes1[lastIndex])  
votesInBatch1.assertLeaf(votesInBatch1.root(), BigInt(lastIndex), lastValue);

console.log(`\nBatch #2`);
const votes2 = [
  { electorPuk: electors[2].puk, claimUid:  Field(1001), result: Field(+1)},
  { electorPuk: electors[2].puk, claimUid:  Field(1002), result: Field(+1)},
  { electorPuk: electors[2].puk, claimUid:  Field(1003), result: Field(+1)}
]
const votesInBatch2 = (new VotesInBatchNullifier()).addLeafs(votes2);
lastIndex = Number(votesInBatch2.lastIndex());
lastValue = VoteInBatchLeaf.value(votes2[lastIndex])  
votesInBatch2.assertLeaf(votesInBatch2.root(), BigInt(lastIndex), lastValue);
