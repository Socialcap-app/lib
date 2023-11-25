import { Field, MerkleMap, PublicKey, Poseidon } from "o1js";
import { ElectorsInPlanNullifierProxy as NullifierProxy} from "../VotingBatchesContract.js";


export function addElectorsToNullifier(
  planUid: Field, 
  electors: PublicKey[]
): MerkleMap {
  // initialize a Merkle Map
  let mt = new MerkleMap();
  mt.set(Field(0), Field(0));

  // add electors to Nullifier
  for (let j=0; j < electors.length; j++) {
    let key = NullifierProxy.key(electors[j], planUid);
    mt.set(key, Field(1)); // assigned
    console.log("addElectorsToNullifier \nroot=", mt.getRoot().toString(), "\nkey=", key.toString());

    let witness = mt.getWitness(key);
    const [witnessRoot, witnessKey] = witness.computeRootAndKey(
      Field(1) /* WAS ASSIGNED BUT NOT VOTED YET */
    );
    console.log("\nwitnessRoot=", witnessRoot.toString(), "\nwitnessKey=", witnessKey.toString());
    console.log(" \n\n")
  }

  return mt;  
}


export function getNullifierProxy(
  nullifier: MerkleMap,
  electorPuk: PublicKey,
  planUid: Field
): NullifierProxy {
  const key = NullifierProxy.key(electorPuk, planUid);

  let witness = nullifier.getWitness(key);
  console.log("getNullifierProxy root=", nullifier.getRoot().toString(), "\nkey=", key.toString());
  const [witnessRoot, witnessKey] = witness.computeRootAndKey(
    Field(1) /* WAS ASSIGNED BUT NOT VOTED YET */
  );
  console.log("witnessRoot=", witnessRoot.toString(), "\nwitnessKey=", witnessKey.toString());

  return {
    root: nullifier.getRoot(),
    witness: nullifier.getWitness(key)
  }
}


