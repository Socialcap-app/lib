import { Field, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from "../lib/uid.js";
import { UTCDateTime } from "../lib/datetime.js";
import { CLAIM_STATES } from "./states.js";

export { ProvableClaim, CLAIM_STATES };


class ProvableClaim extends Struct({
  uid: Field, 
  state: Field, 
  accountId: PublicKey, // the account created when this Claim was deployed
  communityUid: Field,
  applicantUid: Field, // a Person UID
  planUid: Field,
  alias: CircuitString, // applicant full name or alias he would like to use
  // activity times
  createdUTC: Field,
  updatedUTC: Field,
  votedUTC: Field,
  issuedUTC: Field,
  dueUTC: Field,
  // voting results
  requiredVotes: Field,
  requiredPositives: Field,
  positiveVotes: Field,
  negativeVotes: Field,
  ignoredVotes: Field,
  // hash of the JSON stringified evidence data
  evidenceDataHash: Field
}) {

  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    planUid: string,
    communityUid: string, 
    applicantUid: string, 
    accountId?: string,
    alias?: string, // applicant full name or alias he would like to use
    state?: number,
    createdUTC?: string,
    updatedUTC?: string,
    votedUTC?: string,
    issuedUTC?: string,
    dueUTC?: string,
    requiredVotes?: number,
    requiredPositives?: number,
    positiveVotes?: number,
    negativeVotes?: number,
    ignoredVotes?: number,
    evidenceDataHash?: any
  }): this {
    // ids and refrences are not optional
    this.uid = UID.toField(json.uid);
    this.planUid = UID.toField(json.planUid);
    this.communityUid = UID.toField(json.communityUid);
    this.applicantUid = UID.toField(json.applicantUid); 
    // alias, accountId and state depend on the Claim state changes
    this.accountId = json.accountId && PublicKey.fromBase58(json.accountId) || this.accountId || PublicKey.empty();
    this.alias = CircuitString.fromString(json.alias || this.alias || "");
    this.state = Field(json.state || this.state || 0);
    // timestamps are optional, if Unknown we assign Field(0) to them 
    this.createdUTC = UTCDateTime.fromString((json.createdUTC || this.createdUTC || 0).toString());
    this.updatedUTC = UTCDateTime.fromString((json.updatedUTC || this.updatedUTC || 0).toString());
    this.votedUTC = UTCDateTime.fromString((json.votedUTC || this.votedUTC || 0).toString());
    this.issuedUTC = UTCDateTime.fromString((json.issuedUTC || this.issuedUTC || 0).toString());
    this.dueUTC = UTCDateTime.fromString((json.dueUTC || this.dueUTC || 0).toString());
    // voting data will depend on Claim voting process, default for all is Field(0)
    this.requiredVotes = Field(json.requiredVotes || this.requiredVotes || 0);
    this.requiredPositives = Field(json.requiredPositives || this.requiredPositives || 0);
    this.positiveVotes = Field(json.positiveVotes || this.positiveVotes || 0);
    this.negativeVotes = Field(json.negativeVotes || this.negativeVotes || 0);
    this.ignoredVotes = Field(json.ignoredVotes || this.ignoredVotes || 0);
    // we  just use the data hash for all evidence data
    this.evidenceDataHash = Field(json.evidenceDataHash || this.evidenceDataHash || 0);
    return this;
  } 

  toJSON() {
    // not really needed for now ...
    return {
      uid: this.uid.toString(),
      planUid: this.planUid.toString(),
      communityUid: this.communityUid.toString(),
      applicantUid: this.applicantUid.toString(),
      accountId: this.accountId.toBase58(),
      alias: this.alias.toString(),
      state: this.state.toBigInt(),
      createdUTC: UTCDateTime.fromField(this.createdUTC)
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.planUid.toFields())
      .concat(this.communityUid.toFields())
      .concat(this.applicantUid.toFields())
      .concat(this.accountId.toFields())
      .concat(this.alias.toFields())
      .concat(this.state.toFields())
      .concat(this.createdUTC.toFields()) 
      .concat(this.updatedUTC.toFields())
      .concat(this.votedUTC.toFields())
      .concat(this.issuedUTC.toFields())
      .concat(this.dueUTC.toFields())
      .concat(this.requiredVotes.toFields())
      .concat(this.requiredPositives.toFields())
      .concat(this.positiveVotes.toFields())
      .concat(this.negativeVotes.toFields())
      .concat(this.ignoredVotes.toFields())
      .concat(this.evidenceDataHash.toFields())
    return Poseidon.hash(fields);
  }

  key(): Field {
    return this.uid;
  }
}
