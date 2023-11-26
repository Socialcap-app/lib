import { Mina, PrivateKey, PublicKey } from "o1js";

let tstart = 0;


export function getArgvs(): [string, boolean, string] {
  let args = process.argv.slice(2);
  const netw = args[0] || "Local";
  const proofsEnabled = (args[1] === "proofsEnabled");
  console.log(`\nUsing network=${netw}, proofsEnabled=${proofsEnabled}`)
  const contractName = (args.length > 2) ? args[2] : "";
  return [netw, proofsEnabled, contractName];
}


export function startTest(testName: string) {
  console.log("\nBegin testing '"+testName+"' at=", (new Date()).toISOString());
  tstart = (new Date()).getTime();
}


export async function getAccountsForTesting(
  netw: string, 
  proofsEnabled: boolean
): Promise<{
  deployerAccount: PublicKey,
  deployerKey: PrivateKey,
  senderAccount: PublicKey,
  senderKey: PrivateKey
}> {
  let deployer: any, sender: any

  if (netw === "Local") {
    console.log("\nRun on Mina.LocalBlockchain");
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    
    deployer = Local.testAccounts[0];
    sender = Local.testAccounts[1];
  }
  
  if (netw === "Berkeley") {
    console.log("\nRun on Mina.Berkeley");
    const 
      BERKELEY_URL = 'https://proxy.berkeley.minaexplorer.com/graphql',
      ARCHIVE_URL = 'https://archive.berkeley.minaexplorer.com/',
      SENDER_KEY = process.env.SENDER_KEY as string,
      SENDER_ID = process.env.SENDER_ID as string,
      DEPLOYER_KEY = process.env.DEPLOYER_KEY as string,
      DEPLOYER_ID = process.env.DEPLOYER_ID as string;

    const Berkeley = Mina.Network({
      mina: BERKELEY_URL, 
      archive: ARCHIVE_URL
    });
    Mina.setActiveInstance(Berkeley);

    deployer = { 
      publicKey: PublicKey.fromBase58(DEPLOYER_ID), 
      privateKey: PrivateKey.fromBase58(DEPLOYER_KEY)
    };
    sender = {
      publicKey: PublicKey.fromBase58(SENDER_ID),
      privateKey: PrivateKey.fromBase58(SENDER_KEY)
    };
  }

  console.log("deployer Addr=", deployer.publicKey.toBase58());
  console.log("sender Addr=", sender.publicKey.toBase58());

  return {
    deployerAccount: deployer.publicKey, 
    deployerKey: deployer.privateKey, 
    senderAccount: sender.publicKey, 
    senderKey: sender.privateKey
  }
}


export function checkTransaction(pendingTx: any) {
  // check if Tx was success or failed
  if (!pendingTx.isSuccess) {
    console.log('Error sending transaction (see above)');
    // process.exit(0); // we will NOT exit here, but retry latter !!!
  }
  console.log(
    `Transaction: https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}`
    +`\nWaiting for transaction to be included...`
    );
}


