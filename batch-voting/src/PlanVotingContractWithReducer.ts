import { SmartContract, state, State, method, Reducer, PublicKey, UInt32 } from "o1js";
import { Field, Struct, Circuit, Poseidon } from "o1js";
import { MerkleMapWitness, MerkleWitness, MerkleTree, Provable } from "o1js";
import { MerkleMapProxy, MerkleMapUpdate } from "./merkle-updates.js";

export {
  VotesBatch, ElectorsInPlanNullifierProxy, PlanVotingContractWithReducer
}

/** States of the Voting process */
const 
  ACTIVE = 1,
  ENDED = 2,
  CANCELED = 3;

/**
 * This is an actual batch of votes sent by a given elector, on a given
 * voting process (the planUid represents this voting process).
 */
class VotesBatch extends Struct({
  communityUid: Field, // the community where the voting process is happening
  planUid: Field, // the Master Plan Uid of the credential being voted
  electorPubkey: PublicKey, // the elector Uid who submitted this batch
  uid: Field, // an unique Uid for this batch
  commited: Field, // the Root of the batch MerkleTree
  size: Field, // Total number of votes received in this batch
  submitedUTC: Field 
}){}

/**
 * This action will be dispatched by the receiveVotesBatch @method
 * when a new batch of votes is received. We use "actions" here because
 * we want this to be settled in MINA archive nodes.
 */
class VotesBatchReceivedAction extends VotesBatch {}

/**
 * This event will be dispatched by the receiveVotesBatch @method
 * when a new batch of votes is received. It is assumed it will
 * be consumed by some off chain process.
 */
class VotesBatchReceivedEvent extends VotesBatch {}


/**
 * This is the resulta of rolling upp all received batches into one 
 * commited Merkle Tree, composed of the roots of each batch.
 */
class RolledBatches extends Struct({
  // tree: MerkleTree, 
  commitments: Field,
  count: UInt32,
}) {}


/** Voting states for an Elector on this voting Plan */
const 
  UNASSIGNED = Field(0), // not assigned to this elector
  ASSIGNED = Field(1),   // assigned to elector but has not voted yet
  VOTED = Field(2);      // assigned to elector and has already voted


class ElectorsInPlanNullifierProxy extends Struct({
  root: Field,
  witness: MerkleMapWitness
}) {
  static key(
    electorId: PublicKey,
    planUid: Field
  ): Field {
    // Circuit.log(electorId, planUid)
    const keyd = Poseidon.hash(
      electorId.toFields()
      .concat(planUid.toFields())
    );
    Circuit.log("Key (",electorId, planUid, ") =>", keyd)
    return keyd;
  } 
}


const MERKLE_HEIGHT = 8;

class MyMerkleWitness extends MerkleWitness(MERKLE_HEIGHT) {}


/**
 * This is the voting contract binded to a given credential voting process, which
 * is represented by its master plan.
 * 
 * It manages all votes batches received from electors, emit actions on each 
 * batch, and finally commit all received batches. 
 * 
 * This contract mainly asserts that the electors voted and dispatched their 
 * batches. We can not know if some electors did not dispatch them, this may 
 * be validated in other parts (such as the UI or the API)
 */
class PlanVotingContractWithReducer extends SmartContract {
  // events to update VotingBatchesMerkleTree
  events = {
    'votes_batch_received': VotesBatchReceivedEvent 
  };

  // the "reducer" field describes a type of action that we can dispatch, and reduce later
  reducer = Reducer({ actionType: VotesBatchReceivedAction });

  // associated MasterPlan. This is the voting process Uid 
  // and is binded to a given Credentials voting process.
  @state(Field) planUid = State<Field>(); 

  // associated Community where voting took place
  @state(Field) communityUid = State<Field>(); 

  // current Voting Batches MerkleTree commitment
  @state(Field) batchesCommitment = State<Field>(); 

  // final state of the voting process // 2: FINISHED, 1: ACTIVE
  @state(Field) votingState = State<Field>(); 

  // helper field to store the actual point in the actions history
  @state(Field) actionsState = State<Field>(); 

  init() {
    super.init();
    this.planUid.set(Field(0));
    this.communityUid.set(Field(0));
    this.batchesCommitment.set(this.zeroTree().getRoot());
    this.votingState.set(Field(ACTIVE)); // it starts as an active voting
    this.actionsState.set(Reducer.initialActionState); // TODO: is this the right way to initialize this ???
  }

  zeroTree(): MerkleTree {
    const mt = new MerkleTree(MERKLE_HEIGHT);
    mt.setLeaf(BigInt(0), Field(0)); // we set a first NULL key, with a NULL value
    return mt; 
  }


  /**
   * Setup initial values for some state vars. Should be done when 
   * the account is really available, or it will fail.
   */
  @method setup(
    planUid: Field,
    communityUid: Field,
  ) {
    const currentPlanUid = this.planUid.getAndAssertEquals();
    const currentCommunityUid = this.communityUid.getAndAssertEquals();
    this.planUid.set(planUid);
    this.communityUid.set(communityUid);
  }

  /**
   * Checks if the given elector has been assigned to this voting process
   */
  @method assertIsValidElector(
    electorPuk: PublicKey,
    planUid: Field,
    nullifier: ElectorsInPlanNullifierProxy
  ) {
    // compute a root and key from the given Witness using the only valid 
    // value ASSIGNED, other values indicate that the elector was 
    // never assigned to this claim or that he has already voted on it
    const [witnessRoot, witnessKey] = nullifier.witness.computeRootAndKey(
      ASSIGNED /* WAS ASSIGNED */
    );
    Circuit.log("assertIsValidElector witnessRoot", witnessRoot);
    Circuit.log("assertIsValidElector witnessKey", witnessKey);

    // check the witness obtained root matchs the Nullifier root
    nullifier.root.assertEquals(witnessRoot, "Invalid elector root") ;

    // check the witness obtained key matchs the elector+claim key 
    const key: Field = ElectorsInPlanNullifierProxy.key(electorPuk, planUid);
    Circuit.log("assertIsValidElector recalculated Key", key);

    witnessKey.assertEquals(key, "Invalid elector key");
  }
  

  /**
   * Receives a VotesBatch, asserts it, and emits an Action and en Event
   */
  @method receiveVotesBatch(
    votesBatch: VotesBatch,
    nullifier: ElectorsInPlanNullifierProxy
  ) {
    const planUid = this.planUid.getAndAssertEquals();
    const communityUid = this.communityUid.getAndAssertEquals();
    const votingState = this.votingState.getAndAssertEquals();

    // assert the batch corresponds to this community and plan
    communityUid.assertEquals(votesBatch.communityUid);
    planUid.assertEquals(votesBatch.planUid);

    // the elector Pub key is the one sending the Tx
    let electorPuk = this.sender;
    electorPuk.assertEquals(this.sender);
    
    // check this elector is part of the Electors set 
    Circuit.log("elector key=", ElectorsInPlanNullifierProxy.key(electorPuk, planUid));
    this.assertIsValidElector(electorPuk, planUid, nullifier);

    // check that we have not already finished 
    // and that we can receive additional batches
    votingState.assertEquals(ACTIVE);

    // dispatch action
    const action: VotesBatchReceivedAction = votesBatch;
    this.reducer.dispatch(action);  
    Circuit.log("dispatched action", action);

    // send event to change this elector state in Nullifier
    this.emitEvent("votes_batch_received", votesBatch);
  }




  @method rollupAllBatches() {
    const planUid = this.planUid.getAndAssertEquals();
    const communityUid = this.communityUid.getAndAssertEquals();
    const votingState = this.votingState.getAndAssertEquals();
    const batchesCommitment = this.batchesCommitment.getAndAssertEquals();

    Circuit.log("current commitment=", this.batchesCommitment);

    // check that this claim is still open (in the voting process)
    votingState.assertEquals(ACTIVE, "Voting has already finished !");

    // get all votes not counted since last rollup
    let actionsState = this.actionsState.getAndAssertEquals();
    let pendingBatches = this.reducer.getActions({
      fromActionState: actionsState,
    });
    Circuit.log("rollupVotes pendingBatches.length=", pendingBatches.length);

    // initialize the Merkle Tree where we are going to commit all batches
    let tree = this.zeroTree();
    let witness = new MyMerkleWitness(tree.getWitness(0n));

    // build rolled batches initial state for Reducer
    let unrolled: RolledBatches = {
      commitments: batchesCommitment,
      count: UInt32.from(0),
    };

    let { 
      state: rolledUp, 
      actionState: rolledActionsState 
    } = this.reducer.reduce(
      // pending batches to reduce (the Actions queue)
      pendingBatches, 

      // the state type for the unrolled ad rolledUp instances
      RolledBatches,  

      // function that says how to apply the action
      function (      
        state: RolledBatches, 
        action: VotesBatchReceivedAction
      ) {
        // we can use a reducer here because it is not important if batches 
        // arrive in different order than the one they were emited.
        Circuit.log("---");
        Circuit.log("reducer action=", action);
        Circuit.log("reducer state before=", state);

        // increase batches count
        state.count = state.count.add(1);
        
        // add to Merkle Tree Leaf
        Provable.asProver(() => {
          let index = state.count.toBigint();
          tree.setLeaf(index, action.commited);
          witness = new MyMerkleWitness(tree.getWitness(index));          
        })
        
        // we MUST assert this !
        let root = tree.getRoot(); 
        let recalculatedRoot = witness.calculateRoot(action.commited);
        recalculatedRoot.assertEquals(root);  

        // update roled batches commitment
        state.commitments = root;

        Circuit.log("reducer state after=", state);
        return state;
      },

      // initial state and actions point
      { 
        state: unrolled, 
        actionState: actionsState 
      } 
    );
    Circuit.log("reducer final state=", rolledUp);

    // update the Actions final positions
    this.actionsState.set(rolledActionsState);

    // update on-chain state with the finall commitment
    this.batchesCommitment.set(rolledUp.commitments);  
    Circuit.log("new commitment=", this.batchesCommitment);
  }
}
