import 'dotenv/config';
import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ClaimsVotingFactory } from "../claims-voting-factory.js";
import { rollupClaims } from "../claims-roller.js";
import { sendVote, addElectorsToNullifier, getNullifierProxy } from './voting-tests-helpers.js';

import { startTest, getAccountsForTesting, getArgvs } from './test-helpers.js';

startTest("ClaimVotingContract");

let [netw, proofsEnabled] = getArgvs();

// set network and some accounts
let { 
  deployerAccount, deployerKey, 
  senderAccount, senderKey 
} = await getAccountsForTesting(netw, proofsEnabled);

// first compile it
//await ClaimsVotingFactory.compile();

/*
// now deploy  ONE Claim
let zkClaim1 = await ClaimsVotingFactory.deploy(
  Field(1001), // claimUid (simulated)
  Field(3), // 3 total votes required
  Field(2),  // 2 positives is approved
  deployerAccount, deployerKey
);
*/
let ADDR="B62qrKCbhsYXDyUe85BVcVe5Ue2dPkP3AJow5F8qQxBdXefWRkuagUK";

let zkClaim1 = await ClaimsVotingFactory.getInstance(
  PublicKey.fromBase58(ADDR)
);

// we need to add some electors with their accountIds
let claimUid = Field(4099); // the first Claim

// ## learn4
// - "B62qmTfY9auDwpm4bjTV7jdzcmv9xTThAwK6j9f1B37vhchH96HFH5Z"
// - "EKE3edWvaYqbrK3K4AsB5i5wB1ny9uU99SD1ZkYKn3EgP2tYUhSS"
// 
// ## learn5
// - "B62qmVuwdMgnTxpLPGd1kjcMTyof9XUcqAhQZ6TYaT3U6mrMNxkjQgY"
// - "EKF4ZWDdH7sztxpb3S5QZtkTu9J9ea8hq8DQKgFXvXmXtfJxGtYD"
// 
// ## learn6
// - "B62qixo7ZaNjibjRh3dhU1rNLVzNUqDtgwyUB6n9xxYFrHEHmfJXbBf"
// - "EKFLSV4LXCGBGqC7aLKvRhg6NmR9RieEZ1S65F1f2E4n8uDqunmx"

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = {
  puk: PublicKey.fromBase58("B62qmTfY9auDwpm4bjTV7jdzcmv9xTThAwK6j9f1B37vhchH96HFH5Z"),
  prk: PrivateKey.fromBase58("EKE3edWvaYqbrK3K4AsB5i5wB1ny9uU99SD1ZkYKn3EgP2tYUhSS")
};
electors[1] = {
  puk: PublicKey.fromBase58("B62qmVuwdMgnTxpLPGd1kjcMTyof9XUcqAhQZ6TYaT3U6mrMNxkjQgY"),
  prk: PrivateKey.fromBase58("EKF4ZWDdH7sztxpb3S5QZtkTu9J9ea8hq8DQKgFXvXmXtfJxGtYD")
};
electors[2] = {
  puk: PublicKey.fromBase58("B62qixo7ZaNjibjRh3dhU1rNLVzNUqDtgwyUB6n9xxYFrHEHmfJXbBf"),
  prk: PrivateKey.fromBase58("EKFLSV4LXCGBGqC7aLKvRhg6NmR9RieEZ1S65F1f2E4n8uDqunmx")
};

let nullifier = addElectorsToNullifier(claimUid, 
  [ electors[0].puk, electors[1].puk, electors[2].puk ]
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

/*
// run the rollups for all open claims ...
for (let j=0; j < 5; j++) {
  await rollupClaims(
    //[zkClaim1, zkClaim2, zkClaim3],
    [zkClaim1],
    // we should think about who will be the payer here, maybe a special 
    // Socialcap account for this funded on demand ?
    senderAccount, senderKey
  )
}
*/