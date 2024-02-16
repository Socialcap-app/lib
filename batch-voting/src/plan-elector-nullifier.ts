import { PublicKey, Field, Struct, Poseidon, MerkleMapWitness } from "o1js";
import { NullifierMM } from "@socialcap/contracts-lib";

export {
  PlanElectorNullifierLeaf,
  PlanElectorNullifier
}

class PlanElectorNullifierLeaf extends Struct({
  root: Field,
  witness: MerkleMapWitness,
  key: Field,
  value: Field
}) {
  static ASSIGNED = Field(1);   // Assigned elector to plan

  static getKey(
    electorPuk: PublicKey,
    planUid: Field
  ): Field {
    // Circuit.log(electorId, planUid)
    return Poseidon.hash(
      electorPuk.toFields()
      .concat(planUid.toFields())
    );
  } 
}


class PlanElectorNullifier extends NullifierMM {
  constructor() {
    super()
  }

  getLeaf(electorPuk: PublicKey, planUid: Field): PlanElectorNullifierLeaf {
    let key = PlanElectorNullifierLeaf.getKey(
      electorPuk, planUid
    )
    return {
      root: this.root(),
      witness: this.witness(key),
      key: key,
      value: this.get(key)
    }
  }
}
