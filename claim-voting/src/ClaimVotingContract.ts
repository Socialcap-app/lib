/**
 * ClaimVotingContract 
 * 
 * This is a variant of the original IndividualClaimVotingContract as created
 * for zkIgnite Cohort1, now modified to allow batch voting. 
 * 
 * Electors now send votes in batches and so we need to extract each vote
 * from the batch and then send them one by one to each ClaimVoting account.
 * 
 * To verify that the votes have note been tampered, we also receive the root
 * of a MerkleTree generated for the batch, settled in Mina by a transaction
 * to the VotingBatches contract. Each leaf in this tree is a Poseidon hash 
 * of [planUid, electorPubkey, claimUid, voteResult].
 * 
 * To finally send each vote (a leaf) to the ClaimVoting account, we need a 
 * witness to this leaf, the root and also the electorPubkey, clamiUid and 
 * voteResult, so we can verify that this vote is in the batch MerkleTree 
 * before dispatching the VoteAction.
 * 
 * @MAZ 2023-09-12
 */
import { SmartContract, state, State, method, Reducer, PublicKey } from "o1js";
import { Field, Bool, Struct, Circuit } from "o1js";
import { MerkleMapWitness } from "o1js";
import { ASSIGNED } from "@socialcap/contracts-lib";
import { BatchVoteNullifierLeaf, BatchVoteNullifierWitness  } from "@socialcap/batch-voting";
import { ClaimElectorNullifierLeaf } from "./claim-elector-nullifier.js";


export class VoteValue {
  static POSITIVE = Field(1);
  static NEGATIVE = Field(-1); 
  static ABSTAIN = Field(0);
}

class VoteAction extends Struct({
  isValid: Bool,
  positive: Bool,
  negative: Bool,
  ignore: Bool,
}){
}

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

// Final result states  
export const 
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
      Field(ASSIGNED) /* WAS ASSIGNED BUT NOT VOTED YET */
    );
    const key: Field = ClaimElectorNullifierLeaf.key(electorPuk, claimUid);
    Circuit.log("assertHasNotVoted witnessRoot", witnessRoot);
    Circuit.log("assertHasNotVoted witnessKey", witnessKey);
    Circuit.log("assertHasNotVoted nullifierKey", key);

    // check the witness obtained root matchs the Nullifier root
    nullifierRoot.assertEquals(witnessRoot, "Invalid elector root or already voted") ;

    // check the witness obtained key matchs the elector+claim key 
    witnessKey.assertEquals(key, "Invalid elector key or already voted");
  }


  @method assertIsInBatch(
    electorPuk: PublicKey,
    claimUid: Field,
    vote: Field,
    batchRoot: Field,
    batchWitness: BatchVoteNullifierWitness
  ) {
    let leafValue = BatchVoteNullifierLeaf.value(electorPuk, claimUid, vote);
    let recalculatedRoot = batchWitness.calculateRoot(leafValue);
    recalculatedRoot.assertEquals(batchRoot);  
  }


  /**
   * We count votes every time a new vote is received. In this way 
   * we do not need a reducer to evaluate the final result.
   */
  @method sumVotes(action: VoteAction) {
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
    // Circuit.log("rollupVotes votes required,total=", requiredVotes, votes);

    // use this VoteAction to reevaluate the final result
    const notFinished = votes.lessThan(requiredVotes);
    votes = Circuit.if(notFinished, votes.add(1), votes);
    positives = Circuit.if(notFinished.and(action.positive), positives.add(1), positives);
    negatives = Circuit.if(notFinished.and(action.negative), negatives.add(1), negatives);
    ignored = Circuit.if(notFinished.and(action.ignore), ignored.add(1), ignored);
    // Circuit.log("addVote totals=", votes, positives, negatives, ignored);

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
    // Circuit.log("addVote result,isFinished,isApproved=", newResult, isFinished, isApproved);

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
  }

  /**
   * Dispatchs the vote as an action, and evaluates the result to check if
   * all votes have been received and we can close voting for this claim. 
   * 
   * Uses the batch Nullifier (index -> hash(planUid,electorPuk,claimUid,result)) 
   * to prove that this vote really belongs to this batch. 
   * 
   * Uses the plan Nullifier (hash(planUid,claimUid,electorPuk) -> status) to 
   * check if the elector has been asigned to this claim and if the elector 
   * has already voted in this claim. 
   *
   * @param electorPuk: the elector publick key
   * @param vote: the vote value (+1, -1, 0) 
   * @param batchRoot: root of the BatchNullifier 
   * @param batchWitness: this particular vote witness in BatchVoteNullifier
   * @param nullifierRoot: root of the ClaimElectorNullifier
   * @param nullifierWitness:  this particular leaf witness in ClaimElectorNullifier
   */
  @method dispatchVote(
    electorPuk: PublicKey, 
    vote: Field, // +1 positive, -1 negative or 0 ignored
    batchRoot: Field,
    batchWitness: BatchVoteNullifierWitness, 
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
      positive: Circuit.if(vote.equals(VoteValue.POSITIVE), Bool(true), Bool(false)),
      negative: Circuit.if(vote.equals(VoteValue.NEGATIVE), Bool(true), Bool(false)),
      ignore: Circuit.if(vote.equals(VoteValue.ABSTAIN), Bool(true), Bool(false))
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
    this.sumVotes(action);
  }
}
