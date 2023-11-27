import { PrivateKey, PublicKey, Mina, Field, AccountUpdate, fetchAccount } from "o1js";
import { ClaimVotingContract } from "./ClaimVotingContract.js";
import { checkTransaction } from "./tests/test-helpers.js";

export { 
  compileClaimVotingContract,
  deployClaimVotingContract,
  ClaimVotingInstance 
};

let proofsEnabled = true;
let isCompiled = false;

type ClaimVotingInstance = {
  instance: any,
  address: PublicKey,
  secret?: PrivateKey,
  txn?: string
}

const DEPLOY_TX_FEE = 300_000_000;


async function compileClaimVotingContract(proofsEnabled?: boolean) {
  // compile Contract
  proofsEnabled = proofsEnabled === undefined ? true : proofsEnabled;
  //console.log("proofs enabled=", proofsEnabled);
  //console.log("compiling Contract ...");
  if (proofsEnabled) 
    await ClaimVotingContract.compile();
  //console.log("compiled !");
  isCompiled = true;
}


async function deployClaimVotingContract(params: {
  claimUid: Field,
  requiredVotes: Field,
  requiredPositives: Field,
  deployerAccount: PublicKey,
  deployerKey: PrivateKey,
  isLocal?: boolean
}): Promise<ClaimVotingInstance> {
  const { 
    claimUid, 
    requiredVotes, 
    requiredPositives, 
    deployerAccount,
    deployerKey,
    isLocal
  } = params;

  // we need to compile it just once
  if (!isCompiled) await compileClaimVotingContract(proofsEnabled);

  // we need to generate a new key pair for each deploy
  const zkAppKey = PrivateKey.random();
  const zkAppAddr = zkAppKey.toPublicKey();
  //console.log(`\nzkApp instance address=${zkAppAddr.toBase58()}`);

  let zkApp = new ClaimVotingContract(zkAppAddr);
  //console.log("zkApp instance created!");
  
  // deploy it 
  let txn = await Mina.transaction(
    { sender:deployerAccount, fee: DEPLOY_TX_FEE }, () => {
    // IMPORTANT: the deployer account must already be funded 
    // or this will fail miserably ughhh
    AccountUpdate.fundNewAccount(deployerAccount);
    zkApp.deploy();
    zkApp.claimUid.set(claimUid);
    zkApp.requiredVotes.set(requiredVotes);
    zkApp.requiredPositives.set(requiredPositives);
  });
  await txn.prove();

  // this tx needs .sign(), because `deploy()` adds an account update 
  // that requires signature authorization
  txn.sign([deployerKey, zkAppKey]);
  let pendingTx = await txn.send();
  //console.log("zkApp instance deployed !")
  
  checkTransaction(pendingTx);

  // wait for account ...
  await fetchAccount({ publicKey: zkAppAddr });

  let counter = 0;
  if (isLocal === undefined || !isLocal) {
    await loopUntilAccountExists({
      account: zkAppAddr,
      eachTimeNotExist: () => {
        let ts = (new Date()).toISOString();
        counter = counter+5; // every 5 secs
        //console.log(`${ts} ${counter} ... waiting for zkApp account to be fully available ...`);
      },
      isZkAppAccount: true,
    });
  }

  // DEPRECTATED -- DON'T NEED THIS ANYMORE 
  // now we initialize the contract values on the deploy transaction itself
  // initialize it !
  // we can only call setup() AFTER we are sure the deployed account exists
  // otherwise we have failures when initializing ...
  //   console.log(`\nInitializing instance for claim='${claimUid.toString()}'`);
  //   console.log(`...requiredVotes='${requiredVotes}'`);
  //   console.log(`...requiredPositives='${requiredPositives}'`);
  //   txn = await Mina.transaction(
  //     { sender:deployerAccount, fee: DEPLOY_TX_FEE }, () => {
  //     zkApp.setup(claimUid, requiredVotes, requiredPositives);
  //   });
  //   await txn.prove();
  //   let pndTx2 = await txn.sign([deployerKey]).send();
  //   console.log("zkApp instance initialized !")
  // 
  //   checkTransaction(pndTx2);

  // get some value after deploy
  let actionsState = zkApp.actionsState.get(); 
  //console.log("zkApp instance actionsState=", actionsState.toString())

  const instance: ClaimVotingInstance = {
    instance: zkApp, 
    address: zkAppAddr, 
    secret: zkAppKey,
    txn: pendingTx.hash() 
  };

  logIt(instance);
  return instance;
}

function logIt(zkapp: any) {
  console.log(
    `instance= ${JSON.stringify(zkapp.instance.account, null, 2)}`
    +`\naddress= ${zkapp.address.toBase58()}`
    +`\nsecret= ${zkapp?.secret?.toBase58() || ''}`  
  );
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
    //console.log(response.account);

    if (isZkAppAccount) {
      // CHANGED: accountExists = response.account?.appState !== undefined;
      accountExists = response.account?.zkapp?.appState !== undefined;
    }

    if (!accountExists) {
      eachTimeNotExist();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // TODO add optional check that verification key is correct once this is available in o1js
      return response.account!;
    }
  }
}
