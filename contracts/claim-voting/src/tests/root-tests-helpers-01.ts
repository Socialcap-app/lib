import {
  Field,
  MerkleMap,
  CircuitString,
  UInt32,
  Mina,
  PrivateKey,
  PublicKey
} from 'o1js';

import { MerkleMapUpdate, LeafInstance, MerkleMapProxy} from "../CommunitiesContract.js";
import { CommunitiesContract } from "../CommunitiesContract.js";

import { ProvableCommunity } from "../models/provable-community.js";
import { ProvablePerson } from "../models/provable-person.js";
import { ProvableMember } from "../models/provable-member.js";

import { aCommunity, aPerson, aMember } from "./mockups.js";
import { startTest, assertTest } from './test-helpers.js';


export async function testUpdateCommunity(
  zkApp: CommunitiesContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdateCommunity");

    // create a Community obj
    let org: ProvableCommunity = new ProvableCommunity(aCommunity);
    console.log(org);

    // we must simulate calling the Offchain storage

    // initialize a Merkle Map
    let mt = new MerkleMap();
    mt.set(Field(0), Field(0));
    const zeroRoot = mt.getRoot();

    // update the MerkleMap with aCommunity
    let key = org.uid;
    let hashed = org.hash(); // the struct hashed using Poseidon
    mt.set(key, hashed);

    // Map after update
    let map: MerkleMapProxy = {
      id: UInt32.from(1), // assign a dummy ID
      name: CircuitString.fromString("orgs"),
      root: mt.getRoot(),
      count: Field(2), // now we have 2 leafs
    }; 

    // prepare the Update transition 
    let updated: MerkleMapUpdate = {
      mapId: map.id,
      txId: Field(10),
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
      zkApp.updateCommunity(org, map, witness, updated);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedRoot = zkApp.communitiesRoot.get();
    assertTest(updated, updatedRoot);
}

export async function testUpdatePerson(
  zkApp: CommunitiesContract,
  senderAccount: PublicKey,
  senderKey: PrivateKey
) {
    startTest("testUpdatePerson");

    // create a Community obj
    let o: ProvablePerson = new ProvablePerson(aPerson);
    console.log(o);

    // we must simulate calling the Offchain storage

    // initialize a Merkle Map
    let mt = new MerkleMap();
    mt.set(Field(0), Field(0));
    const zeroRoot = mt.getRoot();

    // update the MerkleMap with aCommunity
    let key = o.key();
    let hashed = o.hash(); // the struct hashed using Poseidon
    mt.set(key, hashed);

    // Map after update
    let map: MerkleMapProxy = {
      id: UInt32.from(2), // assign a dummy ID
      name: CircuitString.fromString("persons"),
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
      zkApp.updatePerson(o, map, witness, updated);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedRoot = zkApp.personsRoot.get();
    assertTest(updated, updatedRoot);
}

export async function testUpdateMember(
    zkApp: CommunitiesContract,
    senderAccount: PublicKey,
    senderKey: PrivateKey
  ) {
    startTest("testUpdateMember");

    let o: ProvableMember = new ProvableMember(aMember);
    console.log(o);

    // we must simulate calling the Offchain storage

    // initialize a Merkle Map
    let mt = new MerkleMap();
    mt.set(Field(0), Field(0));
    const zeroRoot = mt.getRoot();

    // update the MerkleMap with aCommunity
    let key = o.key();
    let hashed = o.hash(); // the struct hashed using Poseidon
    mt.set(key, hashed);

    // Map after update
    let map: MerkleMapProxy = {
      id: UInt32.from(3), // assign a dummy ID
      name: CircuitString.fromString("members"),
      root: mt.getRoot(),
      count: Field(2), // now we have 2 leafs
    }; 

    // prepare the Update transition 
    let updated: MerkleMapUpdate = {
      mapId: map.id,
      txId: Field(12),
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
      zkApp.updateMember(o, map, witness, updated);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedRoot = zkApp.membersRoot.get();
    assertTest(updated, updatedRoot);
}
