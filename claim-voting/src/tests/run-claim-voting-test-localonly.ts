import { Mina, PrivateKey, PublicKey, Field } from 'o1js';
import { ClaimVotingInstance, deployClaimVotingContract } from "../claims-voting-factory.js";
import { ElectorsInClaimNullifier } from '@socialcap/contracts-lib';
import { dispatchTestCase } from './dispatch-test-case.js';
import { APPROVED, REJECTED, VOTING } from '../ClaimVotingContract.js';
import { 
  caseAllPositives, 
  caseAllNegatives,
  caseNotEnoughVotes,
  caseNotEnoughPositives, 
} from './all-test-cases.js';

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

let zkClaim2: ClaimVotingInstance = await deployClaimVotingContract({
  claimUid: claimUid, // claimUid (simulated)
  requiredVotes: Field(3), // 3 total votes required
  requiredPositives: Field(2),  // 2 positives is approved
  deployerAccount: deployer.puk, 
  deployerKey: deployer.prk,
  isLocal: true 
});

let zkClaim3: ClaimVotingInstance = await deployClaimVotingContract({
  claimUid: claimUid, // claimUid (simulated)
  requiredVotes: Field(3), // 3 total votes required
  requiredPositives: Field(2),  // 2 positives is approved
  deployerAccount: deployer.puk, 
  deployerKey: deployer.prk,
  isLocal: true 
});

let zkClaim4: ClaimVotingInstance = await deployClaimVotingContract({
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

let electorsInClaim = (new ElectorsInClaimNullifier())
  .addElectors(claimUid, [ 
    electors[0].puk, 
    electors[1].puk, 
    electors[2].puk, 
    electors[3].puk 
  ]);

let electorPuks = electors.map((t) => t.puk); // as an array of Pubkeys

//// RUN all tests cases ////

console.log("\n\n///////////////////////////////////////////////////////////////////");
console.log("\nAll 3 votes are positive => FINISHED & APPROVED");
let case1 = caseAllPositives(electorPuks);
let result1 = await dispatchTestCase(
  zkClaim1.instance,
  claimUid,
  case1,
  electors,
  electorsInClaim
)

console.log("\n\n///////////////////////////////////////////////////////////////////");
console.log("\nAll 3 votes are negative  => FINISHED & REJECTED");
let case2 = caseAllNegatives(electorPuks);
let result2 = await dispatchTestCase(
  zkClaim2.instance,
  claimUid,
  case2,
  electors,
  electorsInClaim
)

console.log("\n\n///////////////////////////////////////////////////////////////////");
console.log("\nOnly 2 total votes, and 2 positives  => NOT FINISHED")
let case3 = caseNotEnoughVotes(electorPuks);
let result3 = await dispatchTestCase(
  zkClaim3.instance,
  claimUid,
  case3,
  electors,
  electorsInClaim
)

console.log("\n\n///////////////////////////////////////////////////////////////////");
console.log("\nOnly 1 positive vote, total votes is 3 => FINISHED & REJECTED");
let case4 = caseNotEnoughPositives(electorPuks);
let result4 = await dispatchTestCase(
  zkClaim4.instance,
  claimUid,
  case4,
  electors,
  electorsInClaim
)

console.log("\n\n///////////////////////////////////////////////////////////////////");
console.log("\n\nFinal results");
console.log(`
  Case 1 (3 positives / 3 total): Expected= ${APPROVED} , Result: ${result1} ${result1.equals(APPROVED) ? 'PASSED' : 'FAILED'}
  Case 2 (3 negatives / 3 total): Expected= ${REJECTED} , Result: ${result2} ${result2.equals(REJECTED) ? 'PASSED' : 'FAILED'}
  Case 3 (2 positives / 2 total): Expected= ${VOTING} , Result: ${result3} ${result3.equals(VOTING) ? 'PASSED' : 'FAILED'}
  Case 4 (1 positive  / 3 total): Expected= ${REJECTED} , Result: ${result4} ${result4.equals(REJECTED) ? 'PASSED' : 'FAILED'}
`)
