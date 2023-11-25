import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ClaimsVotingFactory } from "../claims-voting-factory.js";
import { rollupClaims } from "../claims-roller.js";
import { sendVote, addElectorsToNullifier, getNullifierProxy } from './voting-tests-helpers.js';

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
await ClaimsVotingFactory.compile();

// now deploy  ONE Claim
let zkClaim1 = await ClaimsVotingFactory.deploy(
  Field(1001), // claimUid (simulated)
  Field(3), // 3 total votes required
  Field(2),  // 2 positives is approved
  deployer.puk, deployer.prk,
  true
);

/*
// now deploy TWO Claims
let zkClaim2 = await ClaimsVotingFactory.deploy(
  Field(1002), Field(15), Field(9), 
  deployerAccount, deployerKey
);

// now deploy THREE Claims
let zkClaim3 = await ClaimsFactory.deploy(
  Field(1003), Field(100), Field(51), 
  deployerAccount, deployerKey
);
*/

// we need to add some electors with their accountIds
let claimUid = Field(1001); // the first Claim

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = getLocalAccount(3);
electors[1] = getLocalAccount(4);
electors[2] = getLocalAccount(5);
electors[3] = getLocalAccount(6);
electors[4] = getLocalAccount(7);

let nullifier = addElectorsToNullifier(claimUid, 
  [ electors[0].puk, electors[1].puk, electors[2].puk, electors[3].puk ]
);

// now we vote 3 times !!!
let null00 = getNullifierProxy(nullifier, electors[0].puk, claimUid);
await sendVote(
  zkClaim1.instance, 
  electors[0],
  Field(1), // positive vote!
  null00
);

let null01 = getNullifierProxy(nullifier, electors[1].puk, claimUid);
await sendVote(
  zkClaim1.instance, 
  electors[1],
  Field(1), // positive vote!
  null01
);

let null02 = getNullifierProxy(nullifier, electors[2].puk, claimUid);
await sendVote(
  zkClaim1.instance, 
  electors[2],
  Field(1), // positive vote!
  null02
);

// This vote MUST not be counted
let null03 = getNullifierProxy(nullifier, electors[3].puk, claimUid);
await sendVote(
  zkClaim1.instance, 
  electors[3],
  Field(1), // positive vote!
  null03
);

// This vote MUST FAIL because it is not in Nullifier
await sendVote(
  zkClaim1.instance, 
  electors[4],
  Field(1), // positive vote!
  null03
);


// run the rollups for all open claims ...
for (let j=0; j < 5; j++) {
  await rollupClaims(
    //[zkClaim1, zkClaim2, zkClaim3],
    [zkClaim1],
    // we should think about who will be the payer here, maybe a special 
    // Socialcap account for this funded on demand ?
    sender.puk, sender.prk
  )
}
