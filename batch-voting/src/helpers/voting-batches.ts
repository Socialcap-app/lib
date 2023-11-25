import { Field, MerkleMap, UInt32, PublicKey, Poseidon, MerkleMapWitness } from "o1js";
import { MerkleTree, MerkleWitness } from "o1js";
import { UID } from "../lib/uid.js";
import { MerkleMapUpdate } from "../merkle-updates.js";
import { VotesBatch, VotingBatchesWitness, MERKLE_HEIGHT } from "../VotingBatchesContract.js";
import { NONCE } from "../lib/nonces.js";

export {
  buildVotesBatch,
  mergeAllBatches
}


function buildVotesBatch(
  electorPuk: PublicKey,
  planUid: Field,
  communityUid: Field,
  votes: { claimUid: Field, value: number }[]
): VotesBatch {
  // initialize a Merkle Map
  let mt = new MerkleMap();
  mt.set(Field(0), Field(0));

  // add votes to the MerkleMap
  for (let j=0; j < votes.length; j++) {

    // this is the Key of the Leaf
    let key = Poseidon.hash(
        electorPuk.toFields()
        .concat(votes[j].claimUid.toFields())
        .concat(planUid.toFields()
        .concat(NONCE))
    );
  
    // this is the VOTE value itself
    // do we need to hash it too ?
    let value = Field(votes[0].value)
    let hashed = Poseidon.hash(
      value.toFields()
      .concat(NONCE)
    );
    mt.set(key, hashed); 

    console.log(`buildVotesBatch 
      root= ${mt.getRoot().toString()}, 
      key= ${key.toString()}
      value = ${value.toString()}
      hashed = ${hashed.toString()}
    `);

    let witness = mt.getWitness(key);
    const [witnessRoot, witnessKey] = witness.computeRootAndKey(
      hashed 
    );
    console.log(`
      witnessRoot= ${witnessRoot.toString()}
      , witnessKey= ${witnessKey.toString()}`
    );
  }

  return {
    communityUid: communityUid, // the community where the voting process is happening
    planUid: planUid, // the Master Plan Uid of the credential being voted
    electorPubkey: electorPuk, // the elector PublicKey who submitted this batch
    uid: UID.toField(UID.uuid4()), // an unique Uid for this batch
    commited: mt.getRoot(), // the Root of the batch MerkleTree
    size: Field(votes.length), // Total number of votes received in this batch
    submitedUTC: Field(0) 
  }
}


/**
 * It creates a new Merkle map merging all the received batches, into a new 
 * Merkle map. Each batch becomes a Leaf of the merged map, where 
 * the leaf key=uid and the leaf value=batchComittment.
 */
function OLD_mergeAllBatches(
  batches: VotesBatch[]
): [MerkleMapUpdate, MerkleMapWitness] {
  // initialize a Merkle Map
  let mt = new MerkleMap();
  mt.set(Field(0), Field(0));
  let zeroRoot = mt.getRoot();
  console.log("zeroRoot=", zeroRoot.toString());

  // keep the witness, key and value available
  let witness, key, value;

  // add votes to the MerkleMap
  for (let j=0; j < batches.length; j++) {

    // this is the Key of the Leaf, the uid
    key = batches[j].uid;
  
    // this is the Leaf value
    value = batches[j].commited;
    mt.set(key, value); 

    console.log(
      `commitAllBatches 
      root= ${mt.getRoot().toString()}, 
      key= ${key.toString()}
      value = ${value.toString()}`);

    witness = mt.getWitness(key);
    const [witnessRoot, witnessKey] = witness.computeRootAndKey(
      value 
    );
    console.log(
      `witnessRoot= ${witnessRoot.toString()}
      , witnessKey= ${witnessKey.toString()}`);
  }

  let zeroWitness = mt.getWitness(key as Field);
  const [zeroWitnessRoot, zeroWitnessKey] = zeroWitness.computeRootAndKey(
    Field(0)
  );
  console.log(
    `zero witnessRoot= ${zeroWitnessRoot.toString()}
    , zero witnessKey= ${zeroWitnessKey.toString()}`);


  // we return the Update transition 
  let updated = {
    mapId: UInt32.from(1000), // a dummy value , not needed really
    txId: Field(UID.toField(UID.uuid4())), // set an Id for this transaction

    // the initial MerkleMap state
    beforeRoot: zeroRoot,
    beforeLeaf: {
      key: Field(0),
      hash: Field(0)
    },

    // the final added key,value and state of MerkleMap
    afterRoot: mt.getRoot(),
    afterLeaf: { 
      key: key as Field,
      hash: value as Field
    }
  }

  return [
    updated as MerkleMapUpdate, 
    mt.getWitness(key as Field) as MerkleMapWitness
  ];
}


function mergeAllBatches(
  batches: VotesBatch[]
) {
  // initialize a Merkle Tree
  const tree = new MerkleTree(MERKLE_HEIGHT);
  tree.setLeaf(BigInt(0), Field(0)); // we set a first NULL key, with a NULL value
  let witness = new VotingBatchesWitness(tree.getWitness(0n));
  
  // keep the key and value available
  let index = BigInt(0), value = Field(0);

  // add votes to the MerkleMap
  for (let j=0; j < batches.length; j++) {

    // this is the Indexof the Leaf
    index = BigInt(j)
  
    // this is the Leaf value
    value = batches[j].commited;
    tree.setLeaf(index, value); 
    witness = new VotingBatchesWitness(tree.getWitness(index));          

    console.log(
      `commitAllBatches ${j} value=${value.toString()}, root=${tree.getRoot().toString()}`);
  }
  
  return {
    index: Field(index), 
    value: value, 
    root: tree.getRoot(), 
    witness: witness
  };
}
