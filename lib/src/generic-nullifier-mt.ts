import { PublicKey, Field, Struct, Poseidon, MerkleTree, MerkleWitness} from "o1js";
import { sliced } from "./long-string.js";
import { DEBUG_LOG } from "./logs.js";

export {
  NullifierMTWitness,
  NullifierMT,
  MERKLE_HEIGHT,
}


// the specific Witness type to be used in contracts (max 2024 leafs)
const MERKLE_HEIGHT = 12;
class NullifierMTWitness extends MerkleWitness(MERKLE_HEIGHT) {}


class NullifierMT {
    // privates
    private merkleTree: MerkleTree;
    private index: bigint;
    private leafClass: any;

    constructor(instanceOf: any) {
      this.merkleTree = new MerkleTree(MERKLE_HEIGHT);
      this.index = 0n; // next free leaf slot
      this.leafClass = instanceOf;
    }

    build(leafs: { value: Field }[]): this {
      for (let j=0; j < (leafs || []).length; j++) {
        let index = this.index;
        this.merkleTree.setLeaf(index, leafs[j].value); 
        this.index = this.index + 1n;
      }
      return this;
    }

    addLeafs(leafs: any[]): this {
      for (let j=0; j< (leafs || []).length; j++) {
        let index = this.index;

        let value = (this.leafClass).value(leafs[j]);
        this.merkleTree.setLeaf(index, value); 
        logLeaf(this.merkleTree, index, value);
  
        this.index = this.index + 1n;
      }
      return this;
    }

    /** Total number of active leafs in the tree */
    size(): bigint {
      return this.index;
    }

    /** Index of last leaf in the tree */
    lastIndex(): bigint {
      return this.index -1n;
    }

    root(): Field {
      return this.merkleTree.getRoot();
    }

    witness(index: bigint): NullifierMTWitness {
      let witness = this.merkleTree.getWitness(index);
      const circuitWitness = new NullifierMTWitness(witness);
      return circuitWitness;
    }

    /** Assert this leaf(index,value) belongs to this Nullifier */
    assertLeaf(root: Field, index: bigint, value: Field): boolean {
      const witness = this.witness(index);
      const witnessRoot = witness.calculateRoot(value);
      const asserted = (root.toString() === witnessRoot.toString());
      logAssert(root, witnessRoot, asserted);
      return asserted;
    }
}


const logLeaf = (mt: MerkleTree, index: bigint, value: Field) => {
  if (! DEBUG_LOG) return;
  console.log(`NullifierMT addLeafs()`
    +` root=${sliced(mt.getRoot().toString())} index=${index} witnessValue=${sliced(value.toString())}`);
}

const logWitness = (root: Field, index: bigint, value: Field) => {
  if (! DEBUG_LOG) return;
  console.log(`NullifierMT addLeafs()`
    +` witnessRoot=${sliced(root.toString())} index=${index} witnessValue=${sliced(value.toString())}`);
}

const logAssert = (root: Field, witnessRoot: Field, asserted: boolean) => {
  console.log(`NullifierMT assert()`
    +` root=${sliced(root.toString())}`
    +` witnessRoot=${sliced(witnessRoot.toString())}`
    +` ${asserted ? 'ASSERTED' : 'FAILED'}`);
}
