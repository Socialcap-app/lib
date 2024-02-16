import { Field, MerkleMap, PublicKey, Poseidon } from "o1js";
import { PlanElectorNullifier, PlanElectorNullifierLeaf } from "../plan-elector-nullifier.js";


export function addElectorsToNullifier(
  planUid: Field, 
  electors: PublicKey[]
): PlanElectorNullifier {
  // initialize a Merkle Map
  let mt = new PlanElectorNullifier();
  
  mt.set(Field(0), Field(0));

  // add electors to Nullifier
  for (let j=0; j < electors.length; j++) {
    let key = PlanElectorNullifierLeaf.getKey(electors[j], planUid);
    mt.set(key, Field(1)); // assigned
    console.log("addElectorsToNullifier \nroot=", mt.root().toString(), "\nkey=", key.toString());

    let witness = mt.witness(key);
    const [witnessRoot, witnessKey] = witness.computeRootAndKey(
      Field(1) /* WAS ASSIGNED BUT NOT VOTED YET */
    );
    console.log("\nwitnessRoot=", witnessRoot.toString(), "\nwitnessKey=", witnessKey.toString());
    console.log(" \n\n")
  }

  return mt;  
}
