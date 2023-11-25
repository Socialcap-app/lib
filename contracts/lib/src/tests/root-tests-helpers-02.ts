import {
  Field,
  MerkleMap,
  CircuitString,
  UInt32,
  Mina,
  PrivateKey,
  PublicKey
} from 'o1js';

import { MerkleMapUpdate, MerkleMapProxy } from "../CommunitiesContract.js";
import { ClaimingsContract } from "../ClaimingsContract.js"

import { ProvableClaim } from "../models/provable-claims.js";
import { ProvablePlan } from "../models/provable-plans.js";
import { aClaim, aPlan } from "./mockups.js";
import { startTest, assertTest } from './test-helpers.js';


export async function testUpdateClaim(
  zkApp: ClaimingsContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdateClaim");

    // create a Community obj
    let o: ProvableClaim = new ProvableClaim(aClaim);
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
      id: UInt32.from(5), // assign a dummy ID
      name: CircuitString.fromString("claims"),
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
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.updateClaim(o, map, witness, updated);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedRoot = zkApp.claimsRoot.get();
    assertTest(updated, updatedRoot);
}

export async function testUpdatePlan(
  zkApp: ClaimingsContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdatePlan");

    // create a Community obj
    let o: ProvablePlan = new ProvablePlan(aPlan);
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
      id: UInt32.from(4), // assign a dummy ID
      name: CircuitString.fromString("plans"),
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
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.updatePlan(o, map, witness, updated);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedRoot = zkApp.plansRoot.get();
    assertTest(updated, updatedRoot);
}
