# The voting flow

### Frequently used terms

- `Voting Plan` or `Plan`: we are referring here to the MasterPlan associated to a given Credential type, as defined by the Community Admin. In the IndexerDb is represented by the `plans` table. It also is settled in MINA as the `plans` collection. Is referenced by its `uid` (unique UUID).

### Starting the voting process

**UI**: The voting process is started by the Community Admin:

- Using the Tab "Voting" in the community admin page and the "Start voting" button

- This will dispatch an API RPC call `start_voting_plan(planUid)`, indicating that the voting plan must start.

**API**: The Socialcap API will then execute certain actions on this event:

1. Select a set of validators and judges for each claim, according to the Plan strategy.

2. Assign each validator and judge his/her tasks, and so each one will have a list of tasks that will appear in the "My tasks" tab.

3. Notify by email to the validators and judges of their assigned tasks.

4. Create a `PlanElectorsNullifier` (MerkleMap) to be used by the `assertIsValidElector` method of the `VotingBatchesContract` to avoid double voting and assert the elector was assigned to this Plan.

5. Add the selected validators and electors to this Nullifier. Each leaf in the Nullifier has:  
    - **key** = `hash([electorPubkey,claimUid,NONCE])` 
    - **value** = `ASSIGNED`.

6. Send the Sequencer a request to create a new zkApp account, based on the `VotingBatchesContract`, and setting the state fields `planUid` and `communityUid` values. The account creation and transaction fees will be payed by the Socialcap Deployer account.

7. Register the `publickKey` of the created zkApp account and bind it to the Plan, because we will need to call methods on this zkApp. 

8. The voting Plan will be marked with state `VOTING`.


### Voting by validators and judges


### Closing the voting


### Evaluate results for each claim


### Issuing approved credentials to applicants

