import { PublicKey, Field, Struct, Poseidon, MerkleTree, MerkleWitness} from "o1js";
import { sliced } from "./long-string.js";

export {
  VoteInBatchLeaf,
  VotesInBatchNullifier,
  MERKLE_HEIGHT,
  VotesInBatchWitness
}

class VoteInBatchLeaf extends Struct({
  electorPuk: PublicKey,
  claimUid: Field,
  result: Field
}) {

  static value(electorPuk: PublicKey, claimUid: Field, result: Field): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
      .concat(result.toFields())
    );
    return hashed;
  } 
}


const MERKLE_HEIGHT = 8;

class VotesInBatchWitness extends MerkleWitness(MERKLE_HEIGHT) {}

class VotesInBatchNullifier {

    merkleTree: MerkleTree;
    index: bigint;

    constructor() {
      this.merkleTree = new MerkleTree(MERKLE_HEIGHT);
      this.index = 0n;
    }

    build(leafs: { value: Field }[]): this {
      for (let j=0; j < (leafs || []).length; j++) {
        let index = this.index;
        this.merkleTree.setLeaf(index, leafs[j].value); 
        this.index = this.index + 1n;
      }
      return this;
    }

    /** 
     * Adds an array of votes (electors+claim+result) to a given batch. 
     * @returns: the modified Nullifier
     */
    addVotes(
      electorPuk: PublicKey, 
      votes: { claimUid: Field, result: Field }[]
    ): this {
      for (let j=0; j < (votes || []).length; j++) {
        let index = this.index;

        let { claimUid, result } = votes[j];
        let value = VoteInBatchLeaf.value(electorPuk, claimUid, result);
        this.merkleTree.setLeaf(index, value); 
        logLeaf(this.merkleTree, index, value);

        let witness = this.merkleTree.getWitness(index);
        const circuitWitness = new VotesInBatchWitness(witness);
        const witnessRoot = circuitWitness.calculateRoot(value);
        logWitness(witnessRoot, index, value);

        this.index = this.index + 1n;
      }

      return this;
    }

    root(): Field {
      return this.merkleTree.getRoot();
    }

    witness(index: bigint): VotesInBatchWitness {
      let witness = this.merkleTree.getWitness(index);
      const circuitWitness = new VotesInBatchWitness(witness);
      return circuitWitness;
    }
}


const logLeaf = (mt: MerkleTree, index: bigint, value: Field) => {
  console.log(`VotesInBatchNullifier addElectors()`
    +` root=${sliced(mt.getRoot().toString())} index=${index} witnessValue=${sliced(value.toString())}`);
}

const logWitness = (root: Field, index: bigint, value: Field) => {
  console.log(`VotesInBatchNullifier addElectors()`
    +` witnessRoot=${sliced(root.toString())} index=${index} witnessValue=${sliced(value.toString())}`);
}
