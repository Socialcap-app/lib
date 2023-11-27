import { 
  ClaimVotingInstance, 
  deployClaimVotingContract,
  compileClaimVotingContract 
} from "./claims-voting-factory.js";
import { 
  VoteValue,
  VOTING, APPROVED, REJECTED,
  ClaimVotingContract 
} from "./ClaimVotingContract.js";

export { 
  VoteValue,
  VOTING, APPROVED, REJECTED,
  ClaimVotingContract,
  ClaimVotingInstance,
  deployClaimVotingContract,
  compileClaimVotingContract
};
