import { SmartContract, state, State, method, MerkleMap, MerkleMapWitness, Circuit, Reducer, Struct } from "o1js";
import { Field, UInt32, Bool } from "o1js";
import { MerkleMapUpdate, LeafInstance, MerkleMapProxy } from "../CommunitiesContract.js";
import { ProvableCommunity } from "../models/provable-community.js";
import { ProvablePerson } from "../models/provable-person.js";
import { ProvableMember } from "../models/provable-member.js";
import { stat } from "fs";

/*
IMPORTANT: Reducers though possible may not be a good idea here because we can 
not guarantee the order of actions so the second update may be processed before 
the first one and this may be a problem.
*/

const zeroRoot = ((): Field => {
  const mt = new MerkleMap();
  mt.set(Field(0), Field(0)); // we set a first NULL key, with a NULL value
  return mt.getRoot(); 
})();

class RootsState extends Struct({
  communitiesRoot: Field,
  personsRoot: Field,
  membersRoot: Field,
  plansRoot: Field,
  claimsRoot: Field,
  credentialsRoot: Field,
  nullifierRoot: Field
}){}

class UpdateRootAction extends Struct({
  updateCommunities: Bool,
  updatePersons: Bool,
  updateMembers: Bool,
  updatePlans: Bool,
  updateClaims: Bool,
  updateCredentials: Bool,
  updateNullifier: Bool,
  root: Field,
}){}


export class RootsContract extends SmartContract {

  // the "reducer" field describes a type of action that we can dispatch, and reduce later
  reducer = Reducer({ actionType: UpdateRootAction });

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

  // the tasks dataset, binded to the Provable Task entity
  // key: task.uid, value: task.hash()
  // @state(Field) tasksRoot = State<Field>();

  // a common nullifier we will use in all the voting processes 
  // to avoid double voting and unassigned electors
  // key: hash([personUid,claimUid,nonce?]) value: State
  // where State is 0=UNASSIGNED, 1=ASSIGNED (but not voted), 2=VOTED
  @state(Field) nullifierRoot = State<Field>();

  // helper field to store the actual point in the actions history
  @state(Field) actionsState = State<Field>(); 

  init() {
    super.init();
    this.communitiesRoot.set(zeroRoot);
    this.personsRoot.set(zeroRoot);
    this.plansRoot.set(zeroRoot);
    this.claimsRoot.set(zeroRoot);
    this.membersRoot.set(zeroRoot);
    this.credentialsRoot.set(zeroRoot);
    // this.tasksRoot.set(zeroRoot);
    this.nullifierRoot.set(zeroRoot);
    this.actionsState.set(Reducer.initialActionState); // TODO: is this the right way to initialize this ???
  }

  resetAction(): UpdateRootAction {
    return {
      updateCommunities: Bool(false),
      updatePersons: Bool(false),
      updateMembers: Bool(false),
      updatePlans: Bool(false),
      updateClaims: Bool(false),
      updateCredentials: Bool(false),
      updateNullifier: Bool(false),
      root: zeroRoot,
    }
  }

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
    
    let action = this.resetAction();
    action.updateCommunities = Bool(true);
    action.root = updated.afterRoot; // send the new root

    this.reducer.dispatch(action);
    // this.communitiesRoot.set(updated.afterRoot);
    // Circuit.log("new communititesRoot=", updated.afterRoot);
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

  updateMember(
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

  //updateClaim(...)

  //updateTask(...)
  @method rollupUpdates() {
    const communitiesRoot = this.communitiesRoot.get();
    this.communitiesRoot.assertEquals(communitiesRoot);
    const personsRoot = this.personsRoot.get();
    this.personsRoot.assertEquals(personsRoot);
    const membersRoot = this.membersRoot.get();
    this.membersRoot.assertEquals(membersRoot);
    const plansRoot = this.plansRoot.get();
    this.plansRoot.assertEquals(plansRoot);
    const claimsRoot = this.claimsRoot.get();
    this.claimsRoot.assertEquals(claimsRoot);
    const credentialsRoot = this.credentialsRoot.get();
    this.credentialsRoot.assertEquals(credentialsRoot);
    const nullifierRoot = this.nullifierRoot.get();
    this.nullifierRoot.assertEquals(nullifierRoot);

    // get the point in history where we left the last rollup
    let actionsState = this.actionsState.get();
    this.actionsState.assertEquals(actionsState);
    Circuit.log("rollupUpdates actionsState=", actionsState);
    
    // get all updates not applied since last rollup
    let pendingUpdates = this.reducer.getActions({
      fromActionState: actionsState,
    });
    Circuit.log("rollupUpdates pendingVotes.length=", pendingUpdates.length);

    // build state for Reducer
    let rootsState: RootsState = {
      communitiesRoot: communitiesRoot,
      personsRoot: personsRoot,
      membersRoot: membersRoot,
      plansRoot: plansRoot,
      claimsRoot: claimsRoot,
      credentialsRoot: credentialsRoot,
      nullifierRoot: nullifierRoot
    };

    let { 
      state: newRoots, 
      actionState: newActionsState 
    } = this.reducer.reduce(
      pendingUpdates, // pending votes to reduce
      RootsState,     // the state type
      function (      // function that says how to apply the action
        state: RootsState, 
        action: UpdateRootAction
      ) {
        state.communitiesRoot = Circuit.if(action.updateCommunities, action.root, state.communitiesRoot);
        state.personsRoot = Circuit.if(action.updatePersons, action.root, state.personsRoot);
        state.membersRoot = Circuit.if(action.updateMembers, action.root, state.membersRoot);
        return state;
      },
      { state: rootsState, actionState: actionsState } // initial state and actions point
    );

    // update with the last actions point
    this.actionsState.set(newActionsState);

    // update on-chain states
    this.communitiesRoot.set(newRoots.communitiesRoot);
    this.personsRoot.set(newRoots.personsRoot);
    this.membersRoot.set(newRoots.membersRoot);
  }
}
