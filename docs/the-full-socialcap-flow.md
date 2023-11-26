# Socialcap flow

### Setup a new Credential claiming process

When the admin of a community creates a new Credential, it will setup a MasterPlan (aka a Plan) asociated to this credential that defines a set of params for it, such as:

- (TODO) params description here

### Claiming by applicants


### Closing the claiming period


### Starting the voting process

### Starting the voting process

The voting process is started by the Community Admin, and is reported with an API RPC call.

The Socialcap API will then execute certain actions on this event:

1. Select a set of validators and judges for each claim, accoding to the Plan strategy.

2. Assign each validator and judge his/her tasks, and so each one will have a list of tasks that will appear in the "My tasks" tab.

3. Notify by email to the validators and judges of their assigned tasks.

4. Sends the Sequencer a request to create a new zkApp account, based on the "VotingBatchesContract", and setting the state fields `planUid` and `communityUid` values.

When the admin of a community creates a new Credential, it will setup a MasterPlan (aka a Plan) asociated to this credential that defines a set of params for it, such as:

- (TODO) params description here

### Voting by validators and judges


### Closing the voting


### Evaluate results for each claim


### Issuing approved credentials to applicants

