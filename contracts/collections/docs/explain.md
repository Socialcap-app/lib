
We have one Root contract, which contains the roots of all data sets:
```
  @state(Field) communitiesRoot = State<Field>();
  @state(Field) personsRoot = State<Field>();
  @state(Field) membersRoot = State<Field>();
  @state(Field) claimsRoot = State<Field>();
  @state(Field) tasksRoot = State<Field>();
  @state(Field) credentialsRoot = State<Field>();
  @state(Field) votingsRoot = State<Field>(); 

  @method updateCommunity(
    org: ProvableCommunity,
    map: MerkleMapProxy,
    witness: MerkleMapWitness,
    updated: MerkleMapUpdate
  ) {
  // and similar methods for each data set ...  
```

No problems with this part.

---

And we have a VotingContract related to the voting process: 
```
class Votes extends Struct({
  total: Field,
  positive: Field,
  negative: Field,
  ignored: Field
}){}

class EndConditions extends Struct({
  votes: Field, // if we have at least the votes election is finished
  positives: Field // if we have this positive votes claim is approved
}) {}

class VoteAction extends Struct({
  isValid: Bool,
  positive: Bool,
  negative: Bool,
  ignore: Bool,
}) {}

class NullifierProxy extends Struct({
  root: Field,
  witness: MerkleMapWitness
}) {
  static key(electorUid: Field, claimUid: Field): Field {
    return Poseidon.hash([electorUid, claimUid])
  } 
}

// Voting states for an Elector on this Claim
const 
  NOT_ASSIGNED = Field(0),
  PENDING = Field(1),
  VOTED = Field(2);


export class VotingContract extends SmartContract {
  // events to update Nullifier
  events = {
    'nullify-voter': Field,
    'updated-voting-status': Field
  };

  // the "reducer" field describes a type of action that we can dispatch, and reduce later
  reducer = Reducer({ actionType: VoteAction });

  // Account states
  @state(Field) claimUid = State<Field>(); 
  
  @state(Field) votes = State<Field>(); 
  // THIS FIELD IS NOT REALLY NEEDED AS CAN BE COMPUTED AS SUM FROM OTHER VOTES
  // SHOULD BE REPLACED WITH 'applicantUid' 

  // Votes 
  @state(Field) positive = State<Field>(); 
  @state(Field) negative = State<Field>(); 
  @state(Field) ignored = State<Field>(); 
  // WOULD BE GOOD IF WE CAN PACK THIS INTO JUST ONE FIELD
  // SO WE COULD ALSO HAVE THE REQUIRED VOTING END CONDITIONS
  // required votes 
  // required positives

  // Final result 0: Not finished, 1: Approved, 2: Rejected
  @state(Field) result = State<Field>(); 

  // A nullifier with used to avoid double voting and disable voting from not assigned electors
  // key=hash([electorUid,claimUid]) and value= 0 | 1 | 2 (the voting state)
  // NOT SURE IF THIS NEEDS TO BE HERE OR WE CAN HAVE IT IN THE ROOT CONTRACT
  @state(Field) nullifierRoot = State<Field>(); 

  // helper field to store the point in the action history that our on-chain state is at
  @state(Field) actionsState = State<Field>(); 
  
  //@state(EndConditions) required = State<EndConditions>(); // 2

  init() {
    super.init();
    this.claimUid.set(Field(0));
    this.votes.set(Field(0));
    this.positive.set(Field(0));
    this.negative.set(Field(0)); 
    this.ignored.set(Field(0))
    // this.required.set({
    //   votes: new UInt32(0), 
    //   positives: new UInt32(0), 
    // });
    this.result.set(Field(0));
  }

  @method assertHasNotVoted(
    electorUid: Field,
    claimUid: Field,
    nullifier: NullifierProxy
  ) {
    // compute the new root for the existent key and hash using the given Witness 
    const [ newRoot, newKey ] = nullifier.witness.computeRootAndKey(
      PENDING /* WAS ASSIGNED BUT NOT VOTED YET */
    );

    // check the newRoot matchs the Nullifier root
    nullifier.root.assertEquals(newRoot) ; 

    // check the newKey matchs the given key
    const key: Field = NullifierProxy.key(electorUid, claimUid);
    newKey.assertEquals(key);
  }


  @method sendVote(
    electorUid: Field,
    vote: Field, // +1 positive, -1 negative or 0 ignored
    nullifier: NullifierProxy,
    required: EndConditions
  ) {
    const claimUid = this.claimUid.get();
    this.claimUid.assertEquals(claimUid);

    // check that the elector has not voted on this claim before
    this.assertHasNotVoted(electorUid, claimUid, nullifier);

    // get current votes state
    let votes = this.votes.get();
    this.votes.assertEquals(votes);

    // get current end conditions
    //let required = this.required.get();
    //this.required.assertEquals(required);
    
    // check that we have not already finished 
    // and that we can receive additional votes
    votes.lessThanOrEqual(required.votes);

    // send event to change this elector state in Nullifier
    let key: Field = NullifierProxy.key(electorUid, claimUid);
    this.emitEvent("nullify-voter", key);

    // dispatch action
    this.reducer.dispatch({ 
      isValid: Bool(true),
      positive: Circuit.if(vote.equals(1), Bool(true), Bool(false)),
      negative: Circuit.if(vote.equals(-1), Bool(true), Bool(false)),
      ignore: Circuit.if(vote.equals(0), Bool(true), Bool(false))
    });  
  }


  @method rollupVotes(
    required: EndConditions
  ) {
    const claimUid = this.claimUid.get();
    this.claimUid.assertEquals(claimUid);

    // get current votes state
    let votes = this.votes.get();
    this.votes.assertEquals(votes);

    // get current end conditions
    //let required = this.required.get();
    //this.required.assertEquals(required);
    
    // check that we have not already finished 
    // and that we can receive additional votes
    votes.lessThanOrEqual(required.votes);
    Circuit.log("rollupVotes required,total=", required.votes, votes);
    
    // get the point in history where we left the last rollup
    let actionsState = this.actionsState.get();
    this.actionsState.assertEquals(actionsState);
    Circuit.log("rollupVotes actionsState=", actionsState);
    
    // get all votes not counted since last rollup
    let pendingVotes = this.reducer.getActions({
      fromActionState: actionsState,
    });
    Circuit.log("rollupVotes pendingVotes.length=", pendingVotes.length);

    // build Voting state for Reducer
    let positives = this.positive.getAndAssertEquals();
    let negatives = this.negative.getAndAssertEquals();
    let ignored = this.ignored.getAndAssertEquals();
    let votingState: Votes = {
      total: votes,
      positive: positives,
      negative: negatives,
      ignored: ignored,
    };

    let { 
      state: newVotes, 
      actionState: newActionsState 
    } = this.reducer.reduce(
      pendingVotes, // pending votes to reduce
      Votes,        // the state type
      function (    // function that says how to apply the action
        state: Votes, 
        action: VoteAction
      ) {
        // if is a valid vote then sum votes ... 
        state.total = Circuit.if(action.isValid, state.total.add(1), state.total);
        state.positive = Circuit.if(action.isValid && action.positive, state.positive.add(1), state.positive);
        state.negative = Circuit.if(action.isValid && action.negative, state.negative.add(1), state.negative);
        state.ignored = Circuit.if(action.isValid && action.ignore, state.ignored.add(1), state.ignored);
        return state;
      },
      { state: votingState, actionState: actionsState } // initial state and actions point
    );

    // update on-chain state
    this.votes.set(newVotes.total);
    this.actionsState.set(newActionsState);

    // check if we have met end voting conditions
    let isFinished = newVotes.total.greaterThan(required.votes);
    let isApproved = newVotes.positive.greaterThanOrEqual(required.positives);
         
    // asert result before changing state
    let result = this.result.get();
    this.result.assertEquals(result);

    // now evaluate final result
    result = Circuit.if(isFinished, 
        Circuit.if(isApproved, Field(1)/*APPROVED*/, Field(2)/*REJECTED*/),
        result);

    // update final on-chain result state
    this.result.set(result);

    // and send event with actual result, even if it is not yet finished
    this.emitEvent("updated-voting-status", result);
  }
}
```

The VotingContract compiles and deploys but has not been tested yet.

---

Questions:

1) Every time an Applicant makes a new Claim, we will create a new account for that Claim, so each claim will have its own public state on-chain (voting results and final state). Also the accountId will be also an inmutable record for that claim. 
From what I understand we need:

- to redeploy and initialize the VotingContract but with another set of keys
- and this will become the new account.

I think this is correct, but would like your confirmation

2) As can be seen in the code the 'sendVote()' does not change the state, it just dispatchs an action which will be processed by a reducer. We will have a central server which will be calling the 'rollupVotes' reducer whenever new votes arrive until a claim is finished.

This has the problem that we will need to have many open zkApps (one per each open claim) running in this server when dealing with many claims at the same time. And will need to have a queue of open zkApps so we can call rollup on each one, or open each aone as needed. Something like:

```
  PSEUDOCODE HERE :-)
  for each claim in queue
    let instance = new VotingContract(claim.address);
    const txn = await Mina.transaction(() => {
        instance.rollupVote(claim.endConditions);
      }
    );
    await txn.prove();
    await txn.sign().send();
```

The fee payer will be our main account and not any users account.  

Question: what problems do you see here, is it feasible (not performant, but just feasible) ?










