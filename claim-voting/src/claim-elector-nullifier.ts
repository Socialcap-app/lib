import { PublicKey, Field, Struct, Poseidon, MerkleMap, MerkleMapWitness } from "o1js";
import { sliced, NullifierMM, ASSIGNED } from "@socialcap/contracts-lib";

export {
  ClaimElectorNullifierLeaf,
  ClaimElectorNullifier
}

class ClaimElectorNullifierLeaf extends Struct({
  electorPuk: PublicKey,
  claimUid: Field
}) {
  static UNASSIGNED = Field(0); // Not assigned to this elector
  static ASSIGNED = Field(ASSIGNED);   // Assigned to elector but has not voted yet
  static VOTED = Field(2);      // Assigned to elector and has already voted

  static key(electorPuk: PublicKey, claimUid: Field): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
    );
    return hashed;
  } 
}

class ClaimElectorNullifier extends NullifierMM {}
