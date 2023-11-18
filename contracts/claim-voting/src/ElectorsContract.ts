import { SmartContract, state, State, method, PublicKey, Bool} from "o1js";
import { Field, UInt32, MerkleMap, MerkleMapWitness, Circuit, CircuitString, Struct } from "o1js";
import { MerkleMapProxy, MerkleMapUpdate } from "./CommunitiesContract.js";

import { ProvableTask } from "./models/provable-tasks.js";
import { ProvableElector } from "./models/nullifier.js";


export class ElectorsContract extends SmartContract {
  // the tasks dataset, binded to the Provable Task entity
  // key: task.uid, value: task.hash()
  @state(Field) tasksRoot = State<Field>();

  // a common nullifier we will use in all the voting processes 
  // to avoid double voting and unassigned electors
  // key: hash([personUid,claimUid,nonce?]) value: State
  // where State is 0=UNASSIGNED, 1=ASSIGNED (but not voted), 2=VOTED
  @state(Field) nullifierRoot = State<Field>();

  init() {
    super.init();
    const zero = this.zeroRoot(); 
    this.tasksRoot.set(zero);
    this.nullifierRoot.set(zero);
  }

  zeroRoot(): Field {
    const mt = new MerkleMap();
    mt.set(Field(0), Field(0)); // we set a first NULL key, with a NULL value
    return mt.getRoot(); 
  }
  
  /**
   * Check that only the contract deployer can call the method.
   * The deployer will be the Socialcap main account, which will also act
   * as fee payer for most method calls that imply commited roots bookeeping.
   * WARNING: If the Socialcap account changes we need to redeploy the contract.
   */
  @method assertOnlyDeployer() {
    const DEPLOYER_ADDR = "B62qo1gZFRgGhsozfGeqHv9bbkACr2sHA7qRsf4r9Tadk3dHH3Fwwmy";
    let deployer = PublicKey.fromBase58(DEPLOYER_ADDR);
    this.sender.assertEquals(deployer);
  }

  /**
   * Checks that the given update (key and leaf data after and before) 
   * efectively belong to the commited Merkle Map.
   */
  @method checkMerkleUpdate(
    // map: MerkleMapProxy,
    key: Field, hashed: Field,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate,
    currentRoot: Field,
  ) {
    // check the initial state matches what we expect
    const [ previousRoot, previousKey ] = witness.computeRootAndKey(
      updated.beforeLeaf.hash
    );
    Circuit.log("Circuit.log previousRoot=", previousRoot);
    Circuit.log("Circuit.log currentRoot=", currentRoot);

    // check root is correct and match the Witness
    previousRoot.assertEquals(currentRoot);
    Circuit.log("Circuit.log previousRoot=", previousRoot);

    // check the updated keys we have used are correct and match the Witness
    previousKey.assertEquals(updated.afterLeaf.key);
    Circuit.log("Circuit.log previousKey=", previousKey);
    Circuit.log("Circuit.log equals afterLeaf.key=", updated.afterLeaf.key);

    // check the key corresponds with this entity UID
    previousKey.assertEquals(key);
    Circuit.log("Circuit.log previousKey=", previousKey);

    // check the new leaf hash matchs the hashed Entity struct
    updated.afterLeaf.hash.assertEquals(hashed);
    Circuit.log("Circuit.log hash=", hashed);

    // compute the new root for the existent key and hash using the given Witness 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ newRoot, _ ] = witness.computeRootAndKey(
      updated.afterLeaf.hash
    );

    // check the newRoot matchs the MerkleMapProxy root
    map.root.assertEquals(newRoot) ; 

    // and the updated root
    updated.afterRoot.assertEquals(newRoot);
  }


  @method updateTask(
    task: ProvableTask,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.tasksRoot.get();
    this.tasksRoot.assertEquals(currentRoot);

    // assertOnlyDeployer();

    this.checkMerkleUpdate(
      task.key(), task.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.tasksRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newTasksRoot=", updated.afterRoot);
    const changedRoot = this.tasksRoot.get();
    this.tasksRoot.assertEquals(changedRoot);
  }


  @method updateNullifier(
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.nullifierRoot.get();
    this.nullifierRoot.assertEquals(currentRoot);

    // assertOnlyDeployer();
//     const [ newRoot, newKey ] = witness.computeRootAndKey(
//       updated.afterLeaf.hash
//     );
//     Circuit.log("Circuit.log newRoot=", newRoot);
//     Circuit.log("Circuit.log newKey=", newKey);
// 
//     // assert the received update is consistent with the newRoot
//     newRoot.assertEquals(updated.afterRoot);
//     Circuit.log("Circuit.log asserted newRoot");
//     newKey.assertEquals(updated.afterLeaf.key);
//     Circuit.log("Circuit.log asserted newKey");

    // set the new root
    let newRoot = updated.afterRoot;
    newRoot.assertEquals(updated.afterRoot);

    this.nullifierRoot.set(newRoot);
    Circuit.log("Circuit.log nullifierRoot=", newRoot);
  }
}
