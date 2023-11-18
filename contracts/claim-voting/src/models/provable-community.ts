import { Field, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from '../lib/uid.js';
import { UTCDateTime } from '../lib/datetime.js';
import { EntityState } from './entity-state.js';

export { ProvableCommunity, CommunityState };

const COMMUNITY_STATES = [
  "REVISION", "APPROVED", "PAYMENT", "ACTIVE", 
  "DELETED","CANCELED","PAUSED"
];

const CommunityState = new EntityState(COMMUNITY_STATES);


class ProvableCommunity extends Struct({
  uid: Field,
  state: CircuitString, 
  accountId: PublicKey,
  name: CircuitString,
  description: CircuitString,
  //image: CircuitString,
  createdUTC: Field,
  updatedUTC: Field,
  approvedUTC: Field,
  adminUid: Field
}) {

  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    name?: string,
    description?: string,
    image?: string,
    accountId?: string,
    state?: string,
    createdUTC?: string,
    approvedUTC?: string,
    updatedUTC?: string,
    adminUid?: string
  }): this {
    this.uid = UID.toField(json.uid);
    this.accountId = json.accountId && PublicKey.fromBase58(json.accountId) || this.accountId || PublicKey.empty();
    this.name = CircuitString.fromString(json.name || this.name || "");
    //this.image = CircuitString.fromString(json.image || this.image || "");
    this.description = CircuitString.fromString(json.description || this.description || "");
    this.state = CircuitString.fromString(json.state || this.state || "");
    this.adminUid = UID.toField(json.adminUid || this.adminUid.toString()); 
    this.createdUTC = UTCDateTime.fromString((json.createdUTC || this.createdUTC).toString());
    this.updatedUTC = UTCDateTime.fromString((json.updatedUTC || this.updatedUTC).toString());
    this.approvedUTC = UTCDateTime.fromString((json.approvedUTC || this.approvedUTC || 0).toString());
    return this;
  } 

  toJSON() {
    return {
      uid: this.uid.toString(),
      adminUid: this.adminUid.toString(),
      accountId: (this.accountId || PublicKey.empty()).toBase58(),
      name: this.name.toString(),
      description: this.description.toString(),
      //image: this.image.toString(),
      state: this.state.toString(),
      approvedUTC: this.approvedUTC.toString(),
      createdUTC: this.createdUTC.toString(),
      updatedUTC: this.updatedUTC.toString(),
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.accountId.toFields())
      .concat(this.name.toFields())
      .concat(this.description.toFields())
      .concat(this.state.toFields())
      //.concat(this.image.toFields()) 
      .concat(this.approvedUTC.toFields())
      .concat(this.createdUTC.toFields()) 
      .concat(this.updatedUTC.toFields())
      .concat(this.adminUid.toFields())
    return Poseidon.hash(fields);
  }

  key(): Field {
    return this.uid;
  }
}
