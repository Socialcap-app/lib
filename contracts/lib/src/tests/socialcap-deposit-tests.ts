import 'dotenv/config';
import { Mina, PrivateKey, PublicKey, Field, UInt64 } from 'o1js';
import { ClaimsVotingFactory } from "../claims-voting-factory.js";
import { rollupClaims } from "../claims-roller.js";
import { sendVote, addElectorsToNullifier, getNullifierProxy } from './voting-tests-helpers.js';

import { startTest, getAccountsForTesting, getArgvs } from './test-helpers.js';
import { useContract } from '../deploy/deploy-helpers.js';
import { SocialcapContract } from '../SocialcapContract.js';

startTest("SocialcapContract");

let [netw, proofsEnabled] = getArgvs();

// set network and some accounts
let { 
  deployerAccount, deployerKey, 
  senderAccount, senderKey 
} = await getAccountsForTesting(netw, proofsEnabled);

// the deployed Contracts
//let ADDR="B62qqtMwEzbCkcoJykdYsYk1ypvxUjQX2vmU7JJeUyP8kjYCerrZYn7"
//let KEY="EKENsj7AVnpvtNvVN8zBTEYoZij1G863U1GGPDyHFpFSC9BcKwDa"
//let ADDR="B62qnv3p9m4ysHbZcFW1Qtp5BRuC1mVxhrMuExXEYKEnWnQdNx3b4D8";
//zkApp instance Key=EKEUSu3XiDnYDkEdGjkUZNGzDAtCbrYjFPR2NpGEbkk5CfnAPWu7
//let ADDR="B62qoKK1Kb136iBTAhXgWD1BYK5ooPfbcGA8PYqTv9xjSXVHkFYXacz"
//zkApp instance Key=EKE2duTmt8nJLBfMojSL9UFYH6GyPg3UX3SDUXPcw84gy5dVCjWe
let ADDR="B62qmkZq3jJJDyq7kW5Q4sEEq6CbdpzZTw8HDvWmXt9p7Ekxyau441C";
//zkApp instance Key=EKEF26uPdiQLUiuqYRpQ7f3TbD2Py6PyrT4Q8YcWQEA9ySURzqRg

let zkSocialcap = await useContract("Socialcap", ADDR, proofsEnabled) ;

await sendDeposit(
  zkSocialcap, 
  { puk: senderAccount, prk: senderKey },
  UInt64.from(2.00*1e9) // 2 MINA
)

await sendDeposit(
  zkSocialcap, 
  { puk: senderAccount, prk: senderKey },
  UInt64.from(1.50*1e9) // 1.5 MINA
)

let total = zkSocialcap.totalDeposits.get();
console.log("Socialcap totalDeposits=", total);
// Final Balance should be 3.5 MINA !


/**
 * Helper to send a deposit transaction
 */
async function sendDeposit(
  zkApp: SocialcapContract,
  sender: {puk: PublicKey, prk: PrivateKey}, // sender and voter MUST be the same!
  amount: UInt64
  ) {
  // send the Vote Now
  const DEPOSIT_TX_FEE = 100_000_000;
  console.log(
    "\nsendDeposit from=", sender.puk.toBase58(), 
    " amount=", amount
  )  

  try {
    let tx = await Mina.transaction(
      { sender: sender.puk, fee: DEPOSIT_TX_FEE }, 
      () => { 
        zkApp.deposit(amount); 
      }
    );
    await tx.prove();
    tx.sign([sender.prk]);
    let pendingTx = await tx.send();

    // check if Tx was success or failed
    if (!pendingTx.isSuccess) {
      console.log('error sending transaction (see above)');
      // process.exit(0); // we will NOT exit here, but retry latter !!!
      // break; 
    }
    console.log(
      `Transaction at https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}`
      +`\n... waiting for transaction to be included...`
    );

    // We NEED to do this because we can NOT send another transaction while this
    // one is still being processed and not included
    await pendingTx.wait();
  }
  catch (err: any) {
    console.log("sendDeposit ERROR=", err.toString())
  }
}
