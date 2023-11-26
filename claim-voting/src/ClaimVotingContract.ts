/**
 * ClaimVotingContract 
 * This is a varianr of the original IndividualClaimVotingContract, modified
 * to allow batch voting. 
 * 
 * Electors now send votes in batches and so we need to extract each vote
 * from the batch and then send them one by one to each ClaimVoting account.
 * 
 * To verify that the votes have note been tampered, we also receive the root
 * of a MerkleTree generated for the batch, settled in Mina by a transaction
 * to the VotingBatches contract. Each leaf in this tree is a Poseidon hash 
 * of [electorPubkey, claimUid, voteResult].
 * 
 * To finally send each vote (a leaf) to the ClaimVoting account, we need a 
 * witness to this leaf, the root and also the electorPubkey, clamiUid and 
 * voteResult, so we can verify that this vote is in the batch MerkleTree 
 * before dispatching the VoteAction.
 */

import { SmartContract, state, State, method, Reducer, PublicKey, Nullifier } from "o1js";
import { Field, Bool, Struct, Circuit, Poseidon } from "o1js";
import { MerkleWitness, MerkleMapWitness } from "o1js";

class Votes extends Struct({
  total: Field,
  positive: Field,
  negative: Field,
  ignored: Field
}){}

class VoteAction extends Struct({
  isValid: Bool,
  positive: Bool,
  negative: Bool,
  ignore: Bool,
}){}

export class VoteLeaf extends Struct({}) {
  static hash(
    electorPuk: PublicKey, 
    claimUid: Field,
    result: Field 
  ): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
      .concat(result.toFields())
    );
    return hashed;
  } 
}

export class NullifierLeaf extends Struct({}) {
  static key(
    electorPuk: PublicKey, 
    claimUid: Field
  ): Field {
    const hashed = Poseidon.hash(
      electorPuk.toFields()
      .concat(claimUid.toFields())
    );
    return hashed;
  } 
}

const MERKLE_HEIGHT = 10;
class VotingBatchWitness extends MerkleWitness(MERKLE_HEIGHT) {}

class VotedEvent extends Struct({
  electorPuk: PublicKey,
  claimUid: Field,
  hasVoted: Bool,
}) {}

class VotingStatusEvent extends Struct({
  claimUid: Field,
  isFinished: Bool,
  hasChanged: Bool,
  result: Field,
  total: Field,
  positive: Field,
  negative: Field,
  ignored: Field
}) {}

// Voting states for an Elector on this Claim
const 
  UNASSIGNED = Field(0), // Claim not assigned to this elector
  ASSIGNED = Field(1),   // Claim assigned to elector but has not voted yet
  VOTED = Field(2);      // Claim assigned to elector and has already voted

// Final result states  
const 
  VOTING = Field(0),   // Claim is still in the voting process
  APPROVED = Field(1),
  REJECTED = Field(2),
  CANCELED = Field(3); // TODO: not sure how can we change this state ?


export class ClaimVotingContract extends SmartContract {
  // events to update Nullifier
  events = {
    'elector-has-voted': VotedEvent,
    'voting-changed': VotingStatusEvent
  };

  // the "reducer" field describes a type of action that we can dispatch, and reduce later
  reducer = Reducer({ actionType: VoteAction });

  // associated claim (referenced in Root contract on claimsRoots dataset)
  @state(Field) claimUid = State<Field>(); 

  // current voting status
  // total votes is the sum of this three
  @state(Field) positive = State<Field>(); 
  @state(Field) negative = State<Field>(); 
  @state(Field) ignored = State<Field>(); 

  // end conditions
  // if we have at least 'requiredVotes' the election is finished
  // if we have at least 'requiredPositive' votes the claim is approved
  @state(Field) requiredVotes = State<Field>(); 
  @state(Field) requiredPositives = State<Field>(); 

  // final result 0: Voting, 1: Approved, 2: Rejected
  @state(Field) result = State<Field>(); 

  // helper field to store the actual point in the actions history
  @state(Field) actionsState = State<Field>(); 

  init() {
    super.init();
    this.claimUid.set(Field(0));
    this.positive.set(Field(0));
    this.negative.set(Field(0)); 
    this.ignored.set(Field(0));
    this.requiredVotes.set(Field(0));
    this.requiredPositives.set(Field(0));
    this.result.set(Field(0));
    this.actionsState.set(Reducer.initialActionState); // TODO: is this the right way to initialize this ???
  }

  @method setup(
    claimUid: Field,
    requiredVotes: Field,
    requiredPositives: Field
  ) { 
    // we need to initialize a new claim with the correct params
    // but first need to be sure that it has never been setup before
    let uid = this.claimUid.getAndAssertEquals();
    let votes = this.requiredVotes.getAndAssertEquals();
    let positives = this.requiredPositives.getAndAssertEquals();
    // unless all three are 0 then they can not be changed
    // TODO: need to check if we need to manage additional permissions here!
    uid.assertEquals(Field(0));
    votes.assertEquals(Field(0));
    positives.assertEquals(Field(0));
    // assert that received values are ok
    // all Uids are allways > 0
    claimUid.assertGreaterThan(Field(0), "Invalid claimUid"); 
    // positives and votes must be at least >= 1
    requiredVotes.assertGreaterThanOrEqual(Field(1), "Required votes must be >= 1")
    requiredPositives.assertGreaterThanOrEqual(Field(1), "Required positives must be >= 1")
    // votes > positives or votes == positives are valid
    // NOTE that votes == positives means unanimity voting
    requiredVotes.assertGreaterThanOrEqual(requiredPositives, "Required votes must be >= required positives"); 
    // now we can do it !
    this.claimUid.set(claimUid);
    this.requiredVotes.set(requiredVotes);
    this.requiredPositives.set(requiredPositives);
  }


  @method assertHasNotVoted(
    electorPuk: PublicKey,
    claimUid: Field,
    nullifierRoot: Field,
    nullifierWitness: MerkleMapWitness
  ) {
    // compute a root and key from the given Witness using the only valid 
    // value ASSIGNED, other values indicate that the elector was 
    // never assigned to this claim or that he has already voted on it
    const [witnessRoot, witnessKey] = nullifierWitness.computeRootAndKey(
      ASSIGNED /* WAS ASSIGNED BUT NOT VOTED YET */
    );
    Circuit.log("assertHasNotVoted witnessRoot", witnessRoot);
    Circuit.log("assertHasNotVoted witnessKey", witnessKey);

    // check the witness obtained root matchs the Nullifier root
    nullifierRoot.assertEquals(witnessRoot, "Invalid elector root or already voted") ;

    // check the witness obtained key matchs the elector+claim key 
    const key: Field = NullifierLeaf.key(electorPuk, claimUid);
    Circuit.log("assertHasNotVoted recalculated Key", key);

    witnessKey.assertEquals(key, "Invalid elector key or already voted");
  }


  @method assertIsInBatch(
    electorPuk: PublicKey,
    claimUid: Field,
    vote: Field,
    batchRoot: Field,
    batchWitness: VotingBatchWitness
  ) {
    let leafValue = VoteLeaf.hash(electorPuk, claimUid, vote);
    let recalculatedRoot = batchWitness.calculateRoot(leafValue);
    recalculatedRoot.assertEquals(batchRoot);  
  }


  /**
   * We count votes any time a new vote is received. In this way 
   * we do not need a reducer to evaluate the final result.
   */
  @method addVote(action: VoteAction) {
    // we need this latter ...
    const claimUid = this.claimUid.get();
    this.claimUid.assertEquals(claimUid);

    // check that this claim is still open (in the voting process)
    const currentResult = this.result.get();
    this.result.assertEquals(currentResult);
    currentResult.assertEquals(VOTING, /*ELSE*/"Voting has already finished !");

    // get current votes state
    let positives = this.positive.getAndAssertEquals();
    let negatives = this.negative.getAndAssertEquals();
    let ignored = this.ignored.getAndAssertEquals();
    let votes = Field(0).add(positives).add(negatives).add(ignored);

    // get current ending conditions
    let requiredVotes = this.requiredVotes.getAndAssertEquals();
    let requiredPositives = this.requiredPositives.getAndAssertEquals();
    
    // check that we have not already finished 
    // and that we can receive additional votes
    votes.assertLessThan(requiredVotes, "Too late, voting has already finished !");
    Circuit.log("rollupVotes votes required,total=", requiredVotes, votes);

    // use this VoteAction to reevaluate the final result
    const notFinished = votes.lessThan(requiredVotes);
    votes = Circuit.if(notFinished, votes.add(1), votes);
    positives = Circuit.if(notFinished.and(action.positive), positives.add(1), positives);
    negatives = Circuit.if(notFinished.and(action.negative), negatives.add(1), negatives);
    ignored = Circuit.if(notFinished.and(action.ignore), ignored.add(1), ignored);
    Circuit.log("addVote totals=", votes, positives, negatives, ignored);

    // update on-chain votes and actions state
    this.positive.set(positives);
    this.negative.set(negatives);
    this.ignored.set(ignored);

    // check if we have met end voting conditions
    let isFinished = votes.greaterThanOrEqual(requiredVotes);
    let isApproved = positives.greaterThanOrEqual(requiredPositives);
         
    // assert result before changing its value
    let result = this.result.get();
    this.result.assertEquals(result);

    // now evaluate final result
    let newResult = Circuit.if(isFinished, 
      Circuit.if(isApproved, APPROVED, REJECTED),
      result
    );

    // update final on-chain result state
    this.result.set(newResult);

    // check if it has changed so we can report it with the event
    let resultHasChanged = newResult.greaterThan(result);

    // and send event with actual result, even if it is not yet finished
    // TODO: can we use an if condition here? I think it cant be done
    this.emitEvent("voting-changed", {
      claimUid: claimUid,
      isFinished: isFinished,
      hasChanged: resultHasChanged,
      result: result,
      total: votes,
      positive: positives,
      negative: negatives,
      ignored: ignored
    });

    Circuit.log("addVote result=", newResult);
    Circuit.log("addVote isFinished=", isFinished);
    Circuit.log("addVote isApproved=", isApproved);
  }


  @method dispatchVote(
    electorPuk: PublicKey, 
    vote: Field, // +1 positive, -1 negative or 0 ignored
    batchRoot: Field,
    batchWitness: VotingBatchWitness, 
    nullifierRoot: Field,
    nullifierWitness: MerkleMapWitness
  ) {
    const claimUid = this.claimUid.get();
    this.claimUid.assertEquals(claimUid);
    Circuit.log("dispatchVote for claimUid=", claimUid);
    
    // check if this elector has already voted in the claimUid
    this.assertHasNotVoted(
      electorPuk, claimUid, 
      nullifierRoot, nullifierWitness
    );

    // check it is part of the batch merkle tree
    this.assertIsInBatch(
      electorPuk, claimUid, vote,
      batchRoot, batchWitness
    );

    // dispatch action
    const action: VoteAction = { 
      isValid: Bool(true),
      positive: Circuit.if(vote.greaterThan(0), Bool(true), Bool(false)),
      negative: Circuit.if(vote.lessThan(0), Bool(true), Bool(false)),
      ignore: Circuit.if(vote.equals(0), Bool(true), Bool(false))
    };
    this.reducer.dispatch(action);  
    Circuit.log("dispatched action", action);

    // send event to change this elector state in Nullifier
    this.emitEvent("elector-has-voted", {
      electorPuk: electorPuk,
      claimUid: claimUid,
      hasVoted: Bool(true)
    });

    // finally we add this vote to the count ! 
    // we can check final result using 
    // zkApp.result.get() === VOTING still voting
    // zkApp.result.get() === APPROVED
    // zkApp.result.get() === REJECTED
    this.addVote(action);
  }


//   @method rollupVotes() {
//     const claimUid = this.claimUid.get();
//     this.claimUid.assertEquals(claimUid);
// 
//     // check that this claim is still open (in the voting process)
//     const currentResult = this.result.get();
//     this.result.assertEquals(currentResult);
//     currentResult.assertEquals(VOTING, /*ELSE*/"Voting has already finished !");
// 
//     // get current votes state
//     let positives = this.positive.getAndAssertEquals();
//     let negatives = this.negative.getAndAssertEquals();
//     let ignored = this.ignored.getAndAssertEquals();
//     let votes = Field(0).add(positives).add(negatives).add(ignored);
// 
//     // get current ending conditions
//     let requiredVotes = this.requiredVotes.getAndAssertEquals();
//     let requiredPositives = this.requiredPositives.getAndAssertEquals();
//     
//     // check that we have not already finished 
//     // and that we can receive additional votes
//     votes.assertLessThan(requiredVotes, "Too late, voting has already finished !");
//     Circuit.log("rollupVotes votes required,total=", requiredVotes, votes);
// 
//     // get the point in history where we left the last rollup
//     let actionsState = this.actionsState.get();
//     this.actionsState.assertEquals(actionsState);
//     Circuit.log("rollupVotes actionsState=", actionsState);
//     
//     // get all votes not counted since last rollup
//     let pendingVotes = this.reducer.getActions({
//       fromActionState: actionsState,
//     });
//     Circuit.log("rollupVotes pendingVotes.length=", pendingVotes.length);
// 
//     // build Voting initial state for Reducer
//     let votingState: Votes = {
//       total: votes,
//       positive: positives,
//       negative: negatives,
//       ignored: ignored,
//     };
// 
//     let { 
//       state: newVotes, 
//       actionState: newActionsState 
//     } = this.reducer.reduce(
//       pendingVotes, // pending votes to reduce
//       Votes,        // the state type
//       function (    // function that says how to apply the action
//         state: Votes, 
//         action: VoteAction
//       ) {
//         // we can use a reducer here because it is not important if votes arrive 
//         // in different order than the one they were emited. we just need more
//         // than the total required votes to be done
//         Circuit.log("---");
//         Circuit.log("reducer action=", action);
//         Circuit.log("reducer before state=", state);
//         const notFinished = state.total.lessThan(requiredVotes);
//         const mustCount = notFinished.and(action.isValid);
//         Circuit.log("reducer notFinished=", notFinished, "isValid=", action.isValid, " mustCount=", mustCount);
//         state.total = Circuit.if(mustCount, state.total.add(1), state.total);
//         state.positive = Circuit.if(mustCount.and(action.positive), state.positive.add(1), state.positive);
//         state.negative = Circuit.if(mustCount.and(action.negative), state.negative.add(1), state.negative);
//         state.ignored = Circuit.if(mustCount.and(action.ignore), state.ignored.add(1), state.ignored);
//         Circuit.log("reducer after state=", state);
//         return state;
//       },
//       { state: votingState, actionState: actionsState } // initial state and actions point
//     );
//     Circuit.log("reducer final state=", newVotes);
// 
//     // update on-chain voting and actions state
//     this.actionsState.set(newActionsState);
//     this.positive.set(newVotes.positive);
//     this.negative.set(newVotes.negative);
//     this.ignored.set(newVotes.ignored);
// 
//     // check if we have met end voting conditions
//     let isFinished = newVotes.total.greaterThanOrEqual(requiredVotes);
//     let isApproved = newVotes.positive.greaterThanOrEqual(requiredPositives);
//          
//     // assert result before changing its value
//     let result = this.result.get();
//     this.result.assertEquals(result);
// 
//     // now evaluate final result
//     let newResult = Circuit.if(isFinished, 
//       Circuit.if(isApproved, APPROVED, REJECTED),
//       result
//     );
// 
//     // update final on-chain result state
//     this.result.set(newResult);
// 
//     // check if it has changed so we can report it with the event
//     let resultHasChanged = newResult.greaterThan(result);
// 
//     // and send event with actual result, even if it is not yet finished
//     // TODO: can we use an if condition here? I think it cant be done
//     this.emitEvent("voting-changed", {
//       claimUid: claimUid,
//       isFinished: isFinished,
//       hasChanged: resultHasChanged,
//       result: result,
//       total: newVotes.total,
//       positive: newVotes.positive,
//       negative: newVotes.negative,
//       ignored: newVotes.ignored
//     });
// 
//     Circuit.log("rollupClaims result=", newResult);
//     Circuit.log("rollupClaims isFinished=", isFinished);
//     Circuit.log("rollupClaims isApproved=", isApproved);
//   }
}
