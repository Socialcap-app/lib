import { SmartContract, state, State, method, PublicKey, Bool} from "o1js";
import { Field, UInt32, MerkleMap, MerkleMapWitness, Circuit, CircuitString, Struct } from "o1js";
import { ProvableCommunity } from "./models/provable-community.js";
import { ProvablePerson } from "./models/provable-person.js";
import { ProvableMember } from "./models/provable-member.js";
/*
import { ProvableClaim } from "./models/provable-claims.js";
import { ProvablePlan } from "./models/provable-plans.js";
import { ProvableTask } from "./models/provable-tasks.js";
import { ProvableCredential } from "./models/provable-credentials.js";
import { ProvableElector } from "./models/nullifier.js";
*/

/**
 * LeafInstance
 * Describes a MerkleMap leaf, which contains both the 'data' stored in the
 * leaf and the 'hash' of this data. The 'hash' value is calculated by
 * the 'set(key,data)' method when we update the MerkleMap.
 */
export class LeafInstance extends Struct({
  key: Field, // the key of this Leaf (may be redundant but useful)
  hash: Field, // the hashed(data) value as 
}) {}

/**
 * MerkleMapUpdate
 * Describes the last "provable?" change applied to a given OffchainMerkleMap 
 * after using the .set(key,data) method on it. It can be used to update the
 * state of commitment (a Merkle root) in a MINA account.
 * Contains both the previous map state and the current updated state.
*/
export class MerkleMapUpdate extends Struct({
  // transaction id of the transaction which produced the change
  txId: Field, 

  // the map index (may be redundant but useful)
  mapId: UInt32, 

  // root and leaf value BEFORE we applied the update
  beforeRoot: Field, 
  beforeLeaf: LeafInstance,
  
  // root and leaf value AFTER we applied this update
  afterRoot: Field, 
  afterLeaf: LeafInstance 
}) {}

/**
 * Represents a MerkleMap existing in the offchain storage.
 * We dont have the map data (nodes or leafs) here, we just 
 * have the root and some identification info.
 */
export class MerkleMapProxy extends Struct({
  id: UInt32,
  name: CircuitString,
  root: Field,
  count: Field,
}) {}


export class CommunitiesContract extends SmartContract {
  // the Communities dataset, binded to the Provable Community entity
  // key: community.uid, value: community.hash()
  @state(Field) communitiesRoot = State<Field>();

  // the Persons dataset, binded to the Provable Person entity
  // key: person.uid, value: person.hash()
  @state(Field) personsRoot = State<Field>();

  // the Members dataset, defining a person's role in a given community
  // key: hash([personUid,communityUid,nonce?]), value: Status
  // where Status is 0: NONE, 1: MEMBER, 2: VALIDATOR, 3: AUDITOR
  // NOTE that all validators are members, and all auditors are validators
  @state(Field) membersRoot = State<Field>();

  init() {
    super.init();
    const zero = this.zeroRoot(); 
    this.communitiesRoot.set(zero);
    this.personsRoot.set(zero);
    this.membersRoot.set(zero);
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

  @method updateCommunity(
    org: ProvableCommunity,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.communitiesRoot.get();
		this.communitiesRoot.assertEquals(currentRoot);

    this.checkMerkleUpdate(
      org.key(), org.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    this.communitiesRoot.set(updated.afterRoot);
    Circuit.log("new communititesRoot=", updated.afterRoot);
  }

  @method updatePerson(
    person: ProvablePerson,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.personsRoot.get();
		this.personsRoot.assertEquals(currentRoot);

    this.checkMerkleUpdate(
      person.key(), person.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.personsRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newRoot=", updated.afterRoot);
  }

  @method updateMember(
    member: ProvableMember,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
    const currentRoot = this.membersRoot.get();
    this.membersRoot.assertEquals(currentRoot);

    this.checkMerkleUpdate(
      member.key(), member.hash(),
      map, witness, updated,
      currentRoot,
    )
    
    // set the new root
    this.membersRoot.set(updated.afterRoot);
    Circuit.log("Circuit.log newRoot=", updated.afterRoot);
  }
}
