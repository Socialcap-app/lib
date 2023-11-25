import { Mina, PrivateKey, PublicKey, AccountUpdate, fetchAccount } from "o1js";
import { VotingBatchesContract } from "../VotingBatchesContract.js";

const CONTRACTS: any = {
  "PlanVoting": VotingBatchesContract
} ;

const DEPLOY_TX_FEE = 300_000_000;


export async function useContract(
  name: string,
  zkAppAccountId: string,
  proofsEnabled?: boolean
): Promise<any> {
  console.log(`\nUsing '${name}Contract' ...`)

  // if proofsEnabled we need to compile first !
  if (proofsEnabled !== undefined && !!proofsEnabled) {
    console.log(`\nCompiling ${name}Contract ..`) 
    await CONTRACTS[name].compile();
    console.log(`compiled done !`) 
  }
  
  let publicKey = PublicKey.fromBase58(zkAppAccountId); 

  let response = await fetchAccount(
    { publicKey: publicKey }
  );
  console.log("\nzkApp account exists ?", (response?.account !== undefined));
  console.log("zkApp status=", response.account?.zkapp?.appState.toString());
  
  let zkApp = new CONTRACTS[name](publicKey);
  console.log(`zkApp instance for ${name}Contract at ADDR=${zkAppAccountId}`);
  // console.log(`zkApp verificationKey=${verificationKey}`);

  return zkApp;
}


export async function deployContract(
  name: string,
  deployerAccount: PublicKey,
  deployerKey: PrivateKey,
  proofsEnabled: boolean,
): Promise<any> {

  // if proofsEnabled we need to compile first !
  if (proofsEnabled) {
    console.log(`\nCompiling ${name}Contract ..`) 
    await CONTRACTS[name].compile();
    console.log(`compiled done !`) 
  }

  console.log(`\nDeploying '${name}Contract' ...`)

  // we need to generate a new key pair for each deploy !
  const zkAppKey = PrivateKey.random();
  const zkAppAddr = zkAppKey.toPublicKey();
  console.log(`zkApp instance Addr=${zkAppAddr.toBase58()}`);
  console.log(`zkApp instance Key=${zkAppKey.toBase58()}`);

  let zkApp = new CONTRACTS[name](zkAppAddr);
  console.log(`zkApp instance created for ${name}Contract`);
  // console.log(`zkApp verificationKey=${verificationKey}`);

  // deploy it 
  let txn = await Mina.transaction(
    { sender: deployerAccount, fee: DEPLOY_TX_FEE }, 
    () => {
      // IMPORTANT: the deployer account must already be funded 
      // or this will fail miserably ughhh
      AccountUpdate.fundNewAccount(deployerAccount);
      // NOTE: this calls `init()` if this is the first deploy
      zkApp.deploy();
    }
  );
  await txn.prove();

  // this tx needs .sign(), because `deploy()` adds an account update 
  // that requires signature authorization
  console.log("deployerKey=", deployerKey.toBase58());
  await txn.sign([deployerKey, zkAppKey]).send();
  // await txn.sign([deployerKey]).send();
  console.log("zkApp instance deployed !")
  
  // wait for account ...
  await fetchAccount({ publicKey: zkAppAddr });
  console.log("zkApp account exists !")

  await loopUntilAccountExists({
    account: zkAppAddr,
    eachTimeNotExist: () => {
      console.log('... waiting for zkApp account to be fully available ...');
    },
    isZkAppAccount: true,
  });
  console.log("zkApp is available now !")

  return zkApp;
}


async function loopUntilAccountExists({
  account,
  eachTimeNotExist,
  isZkAppAccount,
}: {
  account: PublicKey;
  eachTimeNotExist: () => void;
  isZkAppAccount: boolean;
}) {
  for (;;) {
    let response = await fetchAccount({ publicKey: account });
    let accountExists = response.account !== undefined;
    
    if (isZkAppAccount) {
      // CHANGED: accountExists = response.account?.appState !== undefined;
      accountExists = response.account?.zkapp?.appState !== undefined;
    }
    console.log("account exists ? ", accountExists);

    if (!accountExists) {
      eachTimeNotExist();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // TODO add optional check that verification key is correct once this is available in SnarkyJS
      return response.account!;
    }
  }
}
