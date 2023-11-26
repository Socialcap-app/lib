import { PublicKey, Field, Struct, Poseidon, MerkleMap, MerkleMapWitness } from "o1js";
import { sliced } from "./long-string.js";

export {
  ElectorInClaimLeaf,
  ElectorsInClaimNullifier
}


class ElectorInClaimLeaf extends Struct({
  electorPuk: PublicKey,
  claimUid: Field
}) {

  static UNASSIGNED = Field(0); // Not assigned to this elector
  static ASSIGNED = Field(1);   // Assigned to elector but has not voted yet
  static VOTED = Field(2);      // Assigned to elector and has already voted

  static key(electorPuk: PublicKey, claimUid: Field): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
    );
    return hashed;
  } 
}


class ElectorsInClaimNullifier {

    merkleMap: MerkleMap;

    constructor() {
      this.merkleMap = new MerkleMap();
      this.merkleMap.set(Field(0), Field(0));
    }

    build(leafs: { key: Field, value: Field }[]): this {
      for (let j=0; j < (leafs || []).length; j++) {
        this.merkleMap.set(leafs[j].key, leafs[j].value); 
      }
      return this;
    }

    /** 
     * Adds an array of electors to a given claim. 
     * @returns: the modified Nullifier
     */
    addElectors(
      claimUid: Field, 
      electorPuks: PublicKey[]
    ): this {
      for (let j=0; j < (electorPuks || []).length; j++) {

        let key = ElectorInClaimLeaf.key(electorPuks[j], claimUid);
        this.merkleMap.set(key, ElectorInClaimLeaf.ASSIGNED); 
        logLeaf(this.merkleMap, key);

        let witness = this.merkleMap.getWitness(key);
        const [witnessRoot, witnessKey] = witness.computeRootAndKey(
          ElectorInClaimLeaf.ASSIGNED /* WAS ASSIGNED BUT NOT VOTED YET */
        );
        logWitness(witnessRoot, witnessKey);
      }

      return this;
    }

    root(): Field {
      return this.merkleMap.getRoot();
    }

    witness(
      electorPuk: PublicKey,
      claimUid: Field
    ): MerkleMapWitness {
      let key = ElectorInClaimLeaf.key(electorPuk, claimUid);
      return this.merkleMap.getWitness(key);
    }
}


const logLeaf = (mp: MerkleMap, key: Field) => {
  console.log(`ElectorsinClaimNullifier addElectors()`
    +` root=${sliced(mp.getRoot().toString())}  key=${sliced(key.toString())}`);
}

const logWitness = (root: Field, key: Field) => {
  console.log(`ElectorsinClaimNullifier addElectors()`
    +` witnessRoot=${sliced(root.toString())} witnessKey=${sliced(key.toString())}`);
}