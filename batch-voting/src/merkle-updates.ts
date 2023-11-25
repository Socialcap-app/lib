import { Field, UInt32, CircuitString, Struct, MerkleMapWitness } from "o1js";

/**
 * LeafInstance
 * Describes a MerkleMap leaf, which contains both the 'data' stored in the
 * leaf and the 'hash' of this data. The 'hash' value is calculated by
 * the 'set(key,data)' method when we update the MerkleMap.
 */
export class LeafInstance extends Struct({
  key: Field, // the key of this Leaf (may be redundant but useful)
  hash: Field, // the hashed(data) value as 
}) {}

/**
 * MerkleMapUpdate
 * Describes the last "provable?" change applied to a given OffchainMerkleMap 
 * after using the .set(key,data) method on it. It can be used to update the
 * state of commitment (a Merkle root) in a MINA account.
 * Contains both the previous map state and the current updated state.
*/
export class MerkleMapUpdate extends Struct({
  // transaction id of the transaction which produced the change
  txId: Field, 

  // the map index (may be redundant but useful)
  mapId: UInt32, 

  // root and leaf value BEFORE we applied the update
  beforeRoot: Field, 
  beforeLeaf: LeafInstance,
  
  // root and leaf value AFTER we applied this update
  afterRoot: Field, 
  afterLeaf: LeafInstance,
}) {}

/**
 * Represents a MerkleMap existing in the offchain storage.
 * We dont have the map data (nodes or leafs) here, we just 
 * have the root and some identification info.
 */
export class MerkleMapProxy extends Struct({
  id: UInt32,
  name: CircuitString,
  root: Field,
  count: Field,
}) {}
