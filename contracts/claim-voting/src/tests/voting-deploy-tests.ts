import 'dotenv/config';
import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ClaimsVotingFactory } from "../claims-voting-factory.js";
import { rollupClaims } from "../claims-roller.js";
import { sendVote, addElectorsToNullifier, getNullifierProxy } from './voting-tests-helpers.js';
import { UID }  from "../lib/uid.js";
import { startTest, getAccountsForTesting, getArgvs } from './test-helpers.js';
import { deployContract, useContract } from '../deploy/deploy-helpers.js';

console.log(
"\n============================================================================="
);
startTest("ClaimVotingContract");

let [netw, proofsEnabled, claimUid] = getArgvs();

// set network and some accounts
let { 
  deployerAccount, deployerKey, 
  senderAccount, senderKey 
} = await getAccountsForTesting(netw, proofsEnabled);

// first compile it
await ClaimsVotingFactory.compile();

// now deploy  ONE Claim
let zkClaim1 = await ClaimsVotingFactory.deploy(
  UID.toField(claimUid), // claimUid (simulated)
  Field(3), // 3 total votes required
  Field(2),  // 2 positives is approved
  deployerAccount, deployerKey
);
