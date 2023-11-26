import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ElectorsInClaimNullifier, VotesInBatchNullifier } from '../index.js';

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
