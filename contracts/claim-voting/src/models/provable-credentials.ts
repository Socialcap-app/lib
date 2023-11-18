import { Field, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from "../lib/uid.js";
import { UTCDateTime } from "../lib/datetime.js";

export { ProvableCredential };


class ProvableCredential extends Struct({
  uid: Field, // UID of the original Claim
  communityUid: Field,
  claimId: PublicKey, // the claim account id
  applicantId: PublicKey, // the applicant account id
  // content
  type: CircuitString,
  description: CircuitString, 
  alias: CircuitString, 
  image: CircuitString, 
  stars: Field,
  metadataHash: Field, 
  issuedUTC: Field,
  expiresUTC: Field,
}) {
  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    communityUid: string, 
    claimId: string,
    applicantId: string,
    type?: string,
    description?: string,
    image?: string,
    alias?: string,
    stars?: number,
    metadataHash?: Field, 
    issuedUTC?: string,
    expiresUTC?: string,
  }): this {
    // ids and refrences are not optional
    this.uid = UID.toField(json.uid);
    this.communityUid = UID.toField(json.communityUid);
    this.claimId = json.claimId && PublicKey.fromBase58(json.claimId) || this.claimId || PublicKey.empty();
    this.applicantId = json.applicantId && PublicKey.fromBase58(json.applicantId) || this.applicantId || PublicKey.empty();
    //
    this.type = CircuitString.fromString(json.type || this.type || "");
    this.description = CircuitString.fromString(json.description || this.description || "");
    this.image = CircuitString.fromString(json.image || this.image || "");
    this.alias = CircuitString.fromString(json.alias || this.alias || "");
    this.stars = Field(json.stars || this.stars || 0);
    this.metadataHash = Field(json.metadataHash || this.metadataHash || 0);
    //
    this.issuedUTC = UTCDateTime.fromString((json.issuedUTC || this.issuedUTC || 0).toString());
    this.expiresUTC = UTCDateTime.fromString((json.expiresUTC || this.expiresUTC || 0).toString());
    return this;
  } 

  toJSON() {
    // not really needed for now ...
    return {
      uid: this.uid.toString(),
      communityUid: this.communityUid.toString(),
      claimId: this.claimId.toBase58(),
      applicantId: this.applicantId.toBase58()
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.communityUid.toFields())
      .concat(this.claimId.toFields())
      .concat(this.applicantId.toFields())
      .concat(this.type.toFields())
      .concat(this.description.toFields())
      .concat(this.alias.toFields())
      .concat(this.stars.toFields())
      .concat(this.image.toFields())
      .concat(this.metadataHash.toFields())
      .concat(this.issuedUTC.toFields())
      .concat(this.expiresUTC.toFields())
    return Poseidon.hash(fields);
  }

  key(): Field {
    return this.uid;
  }
}