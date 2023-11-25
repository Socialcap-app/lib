import {
  Field,
  MerkleMap,
  CircuitString,
  UInt32,
  Mina,
  PrivateKey,
  PublicKey
} from 'o1js';

import { MerkleMapUpdate, LeafInstance, MerkleMapProxy } from "../CommunitiesContract.js";
import { ElectorsContract } from "../ElectorsContract.js"

import { ProvableTask } from "../models/provable-tasks.js";
import { ProvableElector } from "../models/nullifier.js";
import { aTask, aElector } from "./mockups.js";
import { startTest, assertTest } from './test-helpers.js';

const UPDATE_TX_FEE = 300_000_000;

export async function testUpdateTask(
  zkApp: ElectorsContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdateTask");

    // create a Community obj
    let o: ProvableTask = new ProvableTask(aTask);
    console.log(o);

    // we must simulate calling the Offchain storage

    // initialize a Merkle Map
    let mt = new MerkleMap();
    mt.set(Field(0), Field(0));
    const zeroRoot = mt.getRoot();

    // update the MerkleMap with aClaim
    let key = o.key();
    let hashed = o.hash(); // the struct hashed using Poseidon
    mt.set(key, hashed);

    // Map after update
    let map: MerkleMapProxy = {
      id: UInt32.from(6), // assign a dummy ID
      name: CircuitString.fromString("tasks"),
      root: mt.getRoot(),
      count: Field(2), // now we have 2 leafs
    }; 

    // prepare the Update transition 
    let updated: MerkleMapUpdate = {
      mapId: map.id,
      txId: Field(11),
      beforeRoot: zeroRoot,
      beforeLeaf: {
        key: key,
        hash: Field(0)
      },
      afterRoot: map.root,
      afterLeaf: { 
        key: key,
        hash: hashed
      }
    };

    // get the Witness from the given key
    // offchain: map.getWitness(key);
    let witness = mt.getWitness(key);

    // update transaction
    const txn = await Mina.transaction(
      {sender: senderAccount, fee: UPDATE_TX_FEE}, 
      () => {
        zkApp.updateTask(o, map, witness, updated);
      }
    );
    await txn.prove();

    txn.sign([senderKey]);
    let pendingTx = await txn.send();

    // check if Tx was success or failed
    if (!pendingTx.isSuccess) {
      console.log('Error sending transaction (see above)');
      // process.exit(0); // we will NOT exit here, but retry latter !!!
    }
    console.log(
      `See transaction at https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}
      Waiting for transaction to be included...`
    );

    const updatedRoot = zkApp.tasksRoot.get();
    assertTest(updated, updatedRoot);
}


export async function testUpdateNullifier(
  zkApp: ElectorsContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdateNullifier");

    // create a Community obj
    let o: ProvableElector = new ProvableElector(aElector);
    console.log(o);

    // we must simulate calling the Offchain storage

    // initialize a Merkle Map
    let mt = new MerkleMap();
    mt.set(Field(0), Field(0));
    const zeroRoot = mt.getRoot();

    // update the MerkleMap with aClaim
    let key = o.key();
    let hashed = o.hash(); // the struct hashed using Poseidon
    mt.set(key, hashed);

    // Map after update
    let map: MerkleMapProxy = {
      id: UInt32.from(8), // assign a dummy ID
      name: CircuitString.fromString("nullifier"),
      root: mt.getRoot(),
      count: Field(2), // now we have 2 leafs
    }; 

    // prepare the Update transition 
    let updated: MerkleMapUpdate = {
      mapId: map.id,
      txId: Field(11),
      beforeRoot: zeroRoot,
      beforeLeaf: {
        key: key,
        hash: Field(0)
      },
      afterRoot: map.root,
      afterLeaf: { 
        key: key,
        hash: hashed
      }
    };

    // get the Witness from the given key
    // offchain: map.getWitness(key);
    let witness = mt.getWitness(key);

    // update transaction
    const txn = await Mina.transaction(
      {sender: senderAccount, fee: UPDATE_TX_FEE}, 
      () => {
        zkApp.updateNullifier(map, witness, updated);
      }
    );
    await txn.prove();

    txn.sign([senderKey]);
    let pendingTx = await txn.send();

    // check if Tx was success or failed
    if (!pendingTx.isSuccess) {
      console.log('Error sending transaction (see above)');
      // process.exit(0); // we will NOT exit here, but retry latter !!!
    }
    console.log(
      `See transaction at https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}
      Waiting for transaction to be included...`
    );

    const updatedRoot = zkApp.nullifierRoot.get();
    assertTest(updated, updatedRoot);
}
