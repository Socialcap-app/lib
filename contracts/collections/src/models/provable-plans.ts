import { Field, Bool, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from "../lib/uid.js";
import { UTCDateTime } from "../lib/datetime.js";
import { PLAN_STATES } from "./states.js";

export { ProvablePlan, PLAN_STATES };


class ProvablePlan extends Struct({
  // id and refrences 
  uid: Field, 
  communityUid: Field, // the community that will issue this Credential
  state: Field, // state of this plan: DRAFT, ACTIVE, PAUSED, INACTIVE
  // how the claim or credential will be presented
  name: CircuitString,
  description: CircuitString, 
  // some images for styling the Claim/Credential cards
  image: CircuitString, // a dataURI with the logo for use 
  // content
  evidenceHash: Field, // required evidence data the claimer needs to supply
  metadataHash: Field, // metadata to be included in NFT metadata when issuing/minting
  instructionsHash: Field, // validator instructions
  legalHash: Field, // legal warnings
  // fees and shares
  fee: Field, // the fee in MINA required for this credential
  rewardsShare: Field,// percentaje of the fee that will go to validator rewards
  communityShare: Field, // percentaje of fee that will go to the community
  protocolShare: Field, // percentaje of fee that will go to the Protocol (Socialcap)
  // claim parameters
  strategyHash: Field, // the Strategy object
  expiration: Field, // days since issued when an issued credential wil expire (or 0 for no expiration)
  revocable: Bool, // if this credential can be revoked, by Who??? 
  total: Field, // max Field of this credentials which can be claimed
  available: Field, // remaining (not issued) number which can be still be claimed
  startsUTC: Field, // when claiming of this credential can start
  endsUTC: Field,  // when claiming of this credential ends
  // standard activity times
  createdUTC: Field,
  updatedUTC: Field,
  approvedUTC: Field
}) {
  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    communityUid: string, 
    state?: number,
    name?: string,
    description?: string,
    image?: string,
    //
    evidenceHash?: Field,
    metadataHash?: Field,
    instructionsHash?: Field,
    legalHash?: Field,
    //
    fee?: number,
    rewardsShare?: number,
    communityShare?: number,
    protocolShare?: number,
    //
    strategyHash?: string,
    expiration: number,
    revocable: boolean,
    total: number,
    available: number,
    startsUTC?: string,
    endsUTC?: string,
    //
    createdUTC?: string,
    updatedUTC?: string,
    approvedUTC?: string,
  }): this {
    // ids and refrences are not optional
    this.uid = UID.toField(json.uid);
    this.communityUid = UID.toField(json.communityUid);
    this.state = Field(json.state || this.state || 0);
    //
    this.name = CircuitString.fromString(json.name || this.name || "");
    this.description = CircuitString.fromString(json.description || this.description || "");
    this.image = ""; // IGNORE This for now CircuitString.fromString(json.image || this.image || "");
    //
    this.evidenceHash = Field(json.evidenceHash || this.evidenceHash || 0);
    this.metadataHash = Field(json.metadataHash || this.metadataHash || 0);
    this.instructionsHash = Field(json.instructionsHash || this.instructionsHash || 0);
    this.legalHash = Field(json.legalHash || this.legalHash || 0);
    //
    this.fee = Field(json.fee || this.fee || 0);
    this.rewardsShare = Field(json.rewardsShare || this.rewardsShare || 0);
    this.communityShare = Field(json.communityShare || this.communityShare || 0);
    this.protocolShare = Field(json.protocolShare || this.protocolShare || 0);
    //    
    this.strategyHash = Field(json.strategyHash || this.strategyHash || 0);
    this.expiration = Field(json.expiration || this.expiration || 0);
    this.revocable = Bool(json.revocable || this.revocable || false);
    this.total = Field(json.total || this.total || 0);
    this.available = Field(json.available || this.available || 0);
    this.startsUTC = UTCDateTime.fromString((json.startsUTC || this.startsUTC || 0).toString());
    this.endsUTC = UTCDateTime.fromString((json.endsUTC || this.endsUTC || 0).toString());
    // timestamps are optional, if Unknown we assign Field(0) to them 
    this.createdUTC = UTCDateTime.fromString((json.createdUTC || this.createdUTC || 0).toString());
    this.updatedUTC = UTCDateTime.fromString((json.updatedUTC || this.updatedUTC || 0).toString());
    this.approvedUTC = UTCDateTime.fromString((json.approvedUTC || this.approvedUTC || 0).toString());
    return this;
  } 

  toJSON() {
    // not really needed for now ...
    return {
      uid: this.uid.toString(),
      communityUid: this.communityUid.toString(),
      state: this.state.toBigInt()
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.communityUid.toFields())
      .concat(this.state.toFields())
      .concat(this.name.toFields())
      .concat(this.description.toFields())
      //.concat(this.image.toFields())
      .concat(this.evidenceHash.toFields())
      .concat(this.metadataHash.toFields())
      .concat(this.instructionsHash.toFields())
      .concat(this.legalHash.toFields())
      .concat(this.fee.toFields())
      .concat(this.rewardsShare.toFields())
      .concat(this.communityShare.toFields())
      .concat(this.protocolShare.toFields())
      .concat(this.strategyHash.toFields())
      .concat(this.expiration.toFields())
      .concat(this.revocable.toFields())
      .concat(this.total.toFields())
      .concat(this.available.toFields())
      .concat(this.startsUTC.toFields())
      .concat(this.endsUTC.toFields())
      .concat(this.createdUTC.toFields()) 
      .concat(this.updatedUTC.toFields())
      .concat(this.approvedUTC.toFields())
    return Poseidon.hash(fields);
  }

  key(): Field {
    return this.uid;
  }
}
