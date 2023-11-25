import 'dotenv/config';
import { Mina, PrivateKey, PublicKey, AccountUpdate, fetchAccount} from 'o1js';
import { UID } from "../lib/uid.js";
import { ElectorsContract } from "../ElectorsContract.js";
import { testUpdateTask, testUpdateNullifier } from "./root-tests-helpers-03.js"
import { startTest, getAccountsForTesting, getArgvs } from './test-helpers.js';
import { deployContract, useContract } from '../deploy/deploy-helpers.js';

startTest("ElectorsContract");

let Contract = ElectorsContract;

let [netw, proofsEnabled] = getArgvs();

// set network and some accounts
let { 
  deployerAccount, deployerKey, 
  senderAccount, senderKey 
} = await getAccountsForTesting(netw, proofsEnabled);

// compile Contract
console.log("\nCompiling Contract ...", Contract);
console.log("with proofsEnabled=", proofsEnabled);
if (proofsEnabled) await ElectorsContract.compile();
console.log("compiled !");

// create zkapp keys and instance 
/*
let zkApp = await deployContract(
  "Electors", 
  deployerAccount, 
  deployerKey
); 
*/

let zkAppAddr = process.env.ELECTORS_CONTRACT_ID as string;
let zkApp = await useContract(
  "Electors", 
  zkAppAddr
);

console.log("tasksRoot.get=", zkApp.tasksRoot.get().toString());
console.log("nullifierRoot.get=", zkApp.nullifierRoot.get().toString());

// testing ElectorsContract now ...

/*
await testUpdateTask(
  zkApp, 
  senderAccount, 
  senderKey
)
*/

await testUpdateNullifier(
  zkApp, 
  senderAccount, 
  senderKey
)

