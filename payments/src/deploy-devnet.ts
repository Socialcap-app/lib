import 'dotenv/config';
import fs from "fs/promises";
import { Mina, PrivateKey, PublicKey, AccountUpdate} from 'o1js';
import { fetchAccount } from 'o1js';
import { SocialcapDeposits } from './Deposits.js';

const TXNFEE = 150_000_000;
let deployer: { publicKey: PublicKey, privateKey: PrivateKey };

const Devnet = {
  // the only one supported by o1js 1+
  mina: [
    "https://api.minascan.io/node/devnet/v1/graphql",
    //"https://proxy.devnet.minaexplorer.com/graphql",
  ],
  archive: [
    "https://api.minascan.io/archive/devnet/v1/graphql",
    //"https://archive.devnet.minaexplorer.com",
  ],
  explorerAccountUrl: "https://minascan.io/devnet/account/",
  explorerTransactionUrl: "https://minascan.io/devnet/tx/",
  chainId: "devnet",
  name: "Devnet",
};

async function setup() {
  const Network = await Mina.Network(Devnet.mina[0]);
  Mina.setActiveInstance(Network);

  deployer = {
    privateKey: PrivateKey.fromBase58(process.env.DEPLOYER_KEY as string),
    publicKey: PublicKey.fromBase58(process.env.DEPLOYER_ID as string)
  };
}

async function deploy() {
    if (!deployer) return;

    let vk = await SocialcapDeposits.compile();
    //console.log("vk: ", vk);
  
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();
    let zkApp = new SocialcapDeposits(zkAppAddress);
    console.log("zkAppAddress: ", zkAppAddress.toBase58());
  
    await fetchAccount({ publicKey: deployer.publicKey });

    const txn = await Mina.transaction(
      { sender: deployer.publicKey, fee: TXNFEE }, 
      async () => {
        AccountUpdate.fundNewAccount(deployer.publicKey);
        await zkApp.deploy();
      }
    );
    await txn.prove();

    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
}

async function main() {
  await setup();
  await deploy();
}

main().catch((error) => {
  console.log(error);
});
