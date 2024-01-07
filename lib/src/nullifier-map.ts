import { PublicKey, Field, Struct, Poseidon, MerkleMap, MerkleMapWitness } from "o1js";
import { sliced } from "./long-string.js";
import { DEBUG_LOG } from "./logs.js";

export {
  NullifierMM
}


class NullifierMM {

    private merkleMap: MerkleMap;
    private leafs: Map<Field,Field>;

    constructor() {
      this.merkleMap = new MerkleMap();
      this.merkleMap.set(Field(0), Field(0));
      this.leafs = new Map<Field,Field>();
    }

    build(leafs: { key: Field, value: Field }[]): this {
      for (let j=0; j < (leafs || []).length; j++) {
        this.merkleMap.set(leafs[j].key, leafs[j].value); 
        this.leafs.set(leafs[j].key, leafs[j].value);
      }
      return this;
    }

    addLeafs(leafs: { key: Field, value: Field }[]): this {
      for (let j=0; j < (leafs || []).length; j++) {
        let key = leafs[j].key;
        let value = leafs[j].value;
        this.merkleMap.set(key, value); 
        this.leafs.set(key, value); 
        logLeaf(this.merkleMap, key);
      }
      return this;
    }

    toJSON(): string {
      return JSON.stringify(Object.fromEntries(this.leafs));      
    }

    fromJson(json: string): this {
      let map = new Map(Object.entries(JSON.parse(json))); 
      map.forEach((value, key) => {
        this.addLeafs([
          { key: Field(key), value: Field(value as string) }
        ])
      })
      return this
    }

    root(): Field {
      return this.merkleMap.getRoot();
    }

    witness(key: Field): MerkleMapWitness {
      return this.merkleMap.getWitness(key);
    }

    /** Assert this leaf(index,value) belongs to this Nullifier */
    assertLeaf(root: Field, key: Field, value: Field): boolean {
      let witness = this.merkleMap.getWitness(key);
      const [witnessRoot, witnessKey] = witness.computeRootAndKey(value);
      logWitness(witnessRoot, witnessKey);
      const asserted = (root.toString() === witnessRoot.toString());
      logAssert(root, witnessRoot, asserted);
      return asserted;
    }
}


const logLeaf = (mp: MerkleMap, key: Field) => {
  if (! DEBUG_LOG) return;
  console.log(`NullifierMM addLeafs()`
    +` root=${sliced(mp.getRoot().toString())}  key=${sliced(key.toString())}`);
}

const logWitness = (root: Field, key: Field) => {
  if (! DEBUG_LOG) return;
  console.log(`NullifierMM addLeafs()`
    +` witnessRoot=${sliced(root.toString())} witnessKey=${sliced(key.toString())}`);
}

const logAssert = (root: Field, witnessRoot: Field, asserted: boolean) => {
  console.log(`NullifierMM assert()`
    +` root=${sliced(root.toString())}`
    +` witnessRoot=${sliced(witnessRoot.toString())}`
    +` ${asserted ? 'ASSERTED' : 'FAILED'}`);
}
