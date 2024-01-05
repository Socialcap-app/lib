import { PublicKey, Field, Struct, Poseidon, MerkleTree, MerkleWitness, Nullifier} from "o1js";
import { NullifierMT, NullifierMTWitness } from "./generic-nullifier-mt.js";

export {
  VoteInBatchLeaf,
  VotesInBatchMT,
  VotesInBatchWitness
}

class VoteInBatchLeaf extends Struct({
  electorPuk: PublicKey,
  claimUid: Field,
  result: Field
}) {
  static value(t: VoteInBatchLeaf): Field {
    return Poseidon.hash(
      t.electorPuk.toFields()
      .concat(t.claimUid.toFields())
      .concat(t.result.toFields())
    );
  } 
}

class VotesInBatchMT extends NullifierMT {
  constructor() {
    super(VoteInBatchLeaf);
  }
}

class VotesInBatchWitness extends NullifierMTWitness {}
