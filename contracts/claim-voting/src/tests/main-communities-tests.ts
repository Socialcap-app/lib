import { Mina, PrivateKey, PublicKey, AccountUpdate,} from 'o1js';
import { UID } from "../lib/uid.js";

import { CommunitiesContract } from "../CommunitiesContract.js";

import { 
  testUpdateCommunity, 
  testUpdatePerson, 
  testUpdateMember,
} from "./root-tests-helpers-01.js"
import { startTest } from './test-helpers.js';

let Contract = CommunitiesContract;

startTest("CommunitiesContract");

let proofsEnabled = true;
console.log("\nProofs enabled=", proofsEnabled);

let 
  deployerAccount: PublicKey,
  deployerKey: PrivateKey,
  senderAccount: PublicKey,
  senderKey: PrivateKey,
  zkAppAddr: PublicKey,
  zkAppKey: PrivateKey;

// compile Contract
console.log("\nCompiling Contract ...", Contract);
if (proofsEnabled) 
  await Contract.compile();
console.log("compiled !");

// set instance
const Local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(Local);

// get some accounts
console.log("\nDeploy");
({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
({ privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1]);
console.log("deployer Addr=", deployerAccount);
console.log("sender Addr=", senderAccount);

// create zkapp keys and instance 
zkAppKey = PrivateKey.random();
zkAppAddr = zkAppKey.toPublicKey();
let zkApp = new Contract(zkAppAddr);
console.log("zkApp Addr=", zkAppAddr.toBase58());
console.log("zkApp=", zkApp);

// deploy it 
const txn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkApp.deploy();
});
await txn.prove();
// this tx needs .sign(), because `deploy()` adds an account update 
// that requires signature authorization
await txn.sign([deployerKey, zkAppKey]).send();
console.log("Deployed")

// testing CommunitiesContract now ...

await testUpdateCommunity(
  zkApp, 
  senderAccount, 
  senderKey
)

await testUpdatePerson(
  zkApp, 
  senderAccount, 
  senderKey
)

await testUpdateMember(
  zkApp, 
  senderAccount, 
  senderKey
)
