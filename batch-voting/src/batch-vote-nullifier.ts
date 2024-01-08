import { PublicKey, Field, Struct, Poseidon, MerkleTree, MerkleWitness, Nullifier} from "o1js";
import { NullifierMTH16, NullifierMTH16Witness } from "@socialcap/contracts-lib";

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
  static value(
    electorPuk: PublicKey,
    claimUid: Field,
    result: Field
  ): Field {
    return Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
      .concat(result.toFields())
    );
  } 
}

class BatchVoteNullifierWitness extends NullifierMTH16Witness {}

class BatchVoteNullifier extends NullifierMTH16 {}
