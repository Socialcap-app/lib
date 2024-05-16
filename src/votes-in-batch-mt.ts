import { PublicKey, Field, Struct, Poseidon } from "o1js";
import { NullifierMTH16, NullifierMTH16Witness } from "./nullifier-treeh16.js";

export {
  BatchVoteNullifierLeaf,
  BatchVoteNullifier,
  BatchVoteNullifierWitness
}

class BatchVoteNullifierLeaf extends Struct({
  electorPuk: PublicKey,
  claimUid: Field,
  result: Field
}) {
  static value(t: BatchVoteNullifierLeaf): Field {
    return Poseidon.hash(
      t.electorPuk.toFields()
      .concat(t.claimUid.toFields())
      .concat(t.result.toFields())
    );
  } 
}

class BatchVoteNullifier extends NullifierMTH16 {}

class BatchVoteNullifierWitness extends NullifierMTH16Witness {}
