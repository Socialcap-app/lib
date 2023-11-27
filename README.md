# Socialcap ZK Contracts

These are the different ZK contracts and tools used by Socialcap to settle on-chain voting.

- **batch-voting**: The contract use to settle batches of votes submitted by electors when voting for a set of claims.

- **claim-voting**: The contract used to vote for a given claim and calculate the result.

- **collections**: The contract for settling a given collection MerkleMap commitment.

- **models**: The set of "provable" entity definitions used by the API or UI.

- **lib**: Utility libs used by other contracts, the API or the UI.

The corresponding `npm` packages are:

- @socialcap/batch-voting-contracts
- @socialcap/claim-voting-contracts
- @socialcap/collection-contracts
- @socialcap/contracts-models
- @socialcap/contracts-lib

### To do

- 

### Changelog

2023-11-27 
- ClaimVotingContract now reduces on each vote, tested
- contracts-lib 0.1.5 implements generic nullifier MT, tested

2023-11-25 
- updated to o1js 0.14.2
- refactored socialcap contracts into different folders
