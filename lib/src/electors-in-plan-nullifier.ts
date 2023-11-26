/*
import { MerkleTree,  } from "o1js";
export {

}

export class VoteLeaf extends Struct({}) {
  static hash(
    electorPuk: PublicKey, 
    claimUid: Field,
    result: Field 
  ): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
      .concat(result.toFields())
    );
    return hashed;
  } 
}

export class NullifierLeaf extends Struct({}) {
  static key(
    electorPuk: PublicKey, 
    claimUid: Field
  ): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
    );
    return hashed;
  } 
}

const MERKLE_HEIGHT = 10;
class VotingBatchWitness extends MerkleWitness(MERKLE_HEIGHT) {}
*/