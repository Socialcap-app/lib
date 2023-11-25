import { SmartContract, state, State, method, PublicKey, Bool} from "o1js";
import { Field, UInt32, MerkleMap, MerkleMapWitness, Circuit, CircuitString, Struct } from "o1js";
import { MerkleMapProxy, MerkleMapUpdate } from "./CommunitiesContract.js";

import { ProvableClaim } from "./models/provable-claims.js";
import { ProvablePlan } from "./models/provable-plans.js";
import { ProvableCredential } from "./models/provable-credentials.js";


export class ClaimingsContract extends SmartContract {
  // the MasterPlans dataset, binded to the Provable MasterPlan entity
  // key: plan.uid, value: plan.hash()
  @state(Field) plansRoot = State<Field>();

  // the Claims dataset, binded to the Provable Claim entity
  // key: claim.uid, value: claim.hash()
  @state(Field) claimsRoot = State<Field>();

  // the Approved Credentials dataset, binded to the Provable Credential entity
  // key: credential.uid, value: credential.hash()
  // NOTE that the the credential uid === the claim uid that claimed it
  @state(Field) credentialsRoot = State<Field>();

  init() {
    super.init();
    const zero = this.zeroRoot(); 
    this.plansRoot.set(zero);
    this.claimsRoot.set(zero);
    this.credentialsRoot.set(zero);
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

  
  @method updateClaim(
    claim: ProvableClaim,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.claimsRoot.get();
    this.claimsRoot.assertEquals(currentRoot);

    // assertOnlyDeployer();

    this.checkMerkleUpdate(
      claim.key(), claim.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.claimsRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newRoot=", updated.afterRoot);
  }


  @method updatePlan(
    plan: ProvablePlan,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.plansRoot.get();
    this.plansRoot.assertEquals(currentRoot);

    // assertOnlyDeployer();

    this.checkMerkleUpdate(
      plan.key(), plan.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.plansRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newRoot=", updated.afterRoot);
  }

  
  @method updateCredential(
    credential: ProvableCredential,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.credentialsRoot.get();
    this.credentialsRoot.assertEquals(currentRoot);

    // assertOnlyDeployer();

    this.checkMerkleUpdate(
      credential.key(), credential.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.credentialsRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newRoot=", updated.afterRoot);
  }
}
