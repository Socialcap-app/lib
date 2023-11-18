import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, fetchAccount } from "o1js";
import { CommunitiesContract, MerkleMapUpdate } from "../CommunitiesContract.js";
import { ElectorsContract } from "../ElectorsContract.js";
import { ClaimingsContract } from "../ClaimingsContract.js";

const BERKELEY_URL = "https://proxy.berkeley.minaexplorer.com/graphql";

let ADDR = "B62qoDKpskFZwQ8ULYEbGdxFZKDnjz6kDNBHasZXmxu34QK2LCEGEyY"
//"B62qjKryhLSWn4uWZE16RZrGCS4xv3jM2KUMhgpnbaJUkZaX2C7fFeP";
// Key=EKDkhXRmMMi62h713Hc8pNdf2A51RApoNP5bjPof5AhtBBhpfs2p
let publicKey = PublicKey.fromBase58(ADDR);

const Berkeley = Mina.Network(BERKELEY_URL);
Mina.setActiveInstance(Berkeley);

let response = await fetchAccount(
  { publicKey: publicKey }
);

console.log("Account exists ?", response);

console.log("zkApp status=", response.account?.zkapp?.appState);

// await ElectorsContract.compile();

let zkApp = new ElectorsContract(publicKey);
//console.log("zkApp=", zkApp); 

let actualRoot = await zkApp.tasksRoot.get();
console.log("zkApp tasksRoot=", actualRoot.toString()); 
