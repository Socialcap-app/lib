/** 
 * Deploys a contract to Local or Berkeley
 * 
 * Usage:
 * ~~~
 * node build/src/deploy/deploy-zkapp.js Berkeley proofsEnabled ContractName 
 * ~~~
 */
import 'dotenv/config';
import { startTest, getAccountsForTesting, getArgvs } from '../tests/test-helpers.js';
import { deployContract } from './deploy-helpers.js';

startTest("Deploy all contracts");

let [netw, proofsEnabled, contractName] = getArgvs();

// set network and some accounts
let { 
  deployerAccount, deployerKey, 
  senderAccount, senderKey 
} = await getAccountsForTesting(netw, proofsEnabled);

let zkApp = await deployContract(
  contractName, 
  deployerAccount, 
  deployerKey,
  (proofsEnabled === undefined ? true : proofsEnabled)
); 

