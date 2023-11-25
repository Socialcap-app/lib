import 'dotenv/config';
import { ClaimsVotingFactory } from "../claims-voting-factory.js";
import { startTest, getAccountsForTesting, getArgvs } from './test-helpers.js';

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

// we set a fixed claimUid 

// now deploy  ONE Claim
let zkClaim1 = await ClaimsVotingFactory.deploy(
  Field(1001), //UID.toField(claimUid), // claimUid (simulated)
  Field(3), // 3 total votes required
  Field(2),  // 2 positives is approved
  deployerAccount, deployerKey
);
