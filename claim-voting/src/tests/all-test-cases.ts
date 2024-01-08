import { Field, PublicKey } from 'o1js';
import { BatchVoteNullifier, BatchVoteNullifierLeaf } from '@socialcap/batch-voting';
import { VoteValue } from '../ClaimVotingContract.js';

/*
  Condition for APPROVAL is required = 3, positives = 2
*/

// All 3 votes are positive
export function caseAllPositives(electors: PublicKey[]): {
  batches: any[],
  nullis: BatchVoteNullifier[]
} {
  const votes0 = [
    { electorPuk: electors[0], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch0 = (new BatchVoteNullifier()).addLeafs(votes0);
  
  const votes1 = [
    { electorPuk: electors[1], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch1 = (new BatchVoteNullifier()).addLeafs(votes1);
  
  const votes2 = [
    { electorPuk: electors[2], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[2], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[2], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch2 = (new BatchVoteNullifier()).addLeafs(votes2);

  return {
    batches: [votes0, votes1, votes2],
    nullis: [votesInBatch0, votesInBatch1, votesInBatch2]
  }
}

// All 3 votes are negative
export function caseAllNegatives(electors: PublicKey[]): {
  batches: any[],
  nullis: BatchVoteNullifier[]
} {
  const votes0 = [
    { electorPuk: electors[0], claimUid:  Field(1001), result: VoteValue.NEGATIVE},
    { electorPuk: electors[0], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch0 = (new BatchVoteNullifier()).addLeafs(votes0);
  
  const votes1 = [
    { electorPuk: electors[1], claimUid:  Field(1001), result: VoteValue.NEGATIVE},
    { electorPuk: electors[1], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch1 = (new BatchVoteNullifier()).addLeafs(votes1);
  
  const votes2 = [
    { electorPuk: electors[2], claimUid:  Field(1001), result: VoteValue.NEGATIVE},
    { electorPuk: electors[2], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[2], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch2 = (new BatchVoteNullifier()).addLeafs(votes2);

  return {
    batches: [votes0, votes1, votes2],
    nullis: [votesInBatch0, votesInBatch1, votesInBatch2]
  }
}

// Only 2 total votes, even all of them are positive can not end 
export function caseNotEnoughVotes(electors: PublicKey[]): {
  batches: any[],
  nullis: BatchVoteNullifier[]
} {
  const votes0 = [
    { electorPuk: electors[0], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch0 = (new BatchVoteNullifier()).addLeafs(votes0);
  
  const votes1 = [
    { electorPuk: electors[1], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch1 = (new BatchVoteNullifier()).addLeafs(votes1);
  
  return {
    batches: [votes0, votes1],
    nullis: [votesInBatch0, votesInBatch1]
  }
}


// Only 1 positive vote, even total votes is 3
export function caseNotEnoughPositives(electors: PublicKey[]): {
  batches: any[],
  nullis: BatchVoteNullifier[]
} {
  const votes0 = [
    { electorPuk: electors[0], claimUid:  Field(1001), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[0], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch0 = (new BatchVoteNullifier()).addLeafs(votes0);
  
  const votes1 = [
    { electorPuk: electors[1], claimUid:  Field(1001), result: VoteValue.ABSTAIN},
    { electorPuk: electors[1], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[1], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch1 = (new BatchVoteNullifier()).addLeafs(votes1);
  
  const votes2 = [
    { electorPuk: electors[2], claimUid:  Field(1001), result: VoteValue.ABSTAIN},
    { electorPuk: electors[2], claimUid:  Field(1002), result: VoteValue.POSITIVE},
    { electorPuk: electors[2], claimUid:  Field(1003), result: VoteValue.POSITIVE}
  ].map((t) => { return {
    value: BatchVoteNullifierLeaf.value(t.electorPuk, t.claimUid, t.result)
  }});
  const votesInBatch2 = (new BatchVoteNullifier()).addLeafs(votes2);

  return {
    batches: [votes0, votes1, votes2],
    nullis: [votesInBatch0, votesInBatch1, votesInBatch2]
  }
}
