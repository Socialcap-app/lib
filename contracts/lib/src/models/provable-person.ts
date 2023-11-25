import { Field, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from '../lib/uid.js';
import { UTCDateTime } from '../lib/datetime.js';
import { EntityState } from "./entity-state.js";

export { ProvablePerson, PersonState };


const PersonState = new EntityState([
  // valid states
  "INITIAL", "ACTIVE", "CANCELED", "PAUSED"
], {
  // transitions
  "INITIAL": ["ACTIVE", "CANCELED", "PAUSED"],
  "ACTIVE": ["CANCELED", "PAUSED"],
  "PAUSED": ["ACTIVE", "CANCELED"],
  "CANCELED": [],
});


class ProvablePerson extends Struct({
  uid: Field,
  state: CircuitString, 
  accountId: PublicKey,
  fullName: CircuitString,
  description: CircuitString,
  image: CircuitString,
  telegram: CircuitString,
  email: CircuitString,
  phone: CircuitString,
  createdUTC: Field,
  updatedUTC: Field,
  approvedUTC: Field,
}) {
  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    fullName?: string,
    description?: string,
    image?: string,
    accountId?: string,
    state?: string,
    createdUTC?: Date,
    approvedUTC?: Date,
    updatedUTC?: Date,
    telegram?: string,
    email?: string,
    phone?: string
  }) {
    this.uid = UID.toField(json.uid);
    this.accountId = json.accountId && PublicKey.fromBase58(json.accountId) || this.accountId || PublicKey.empty();
    this.fullName = CircuitString.fromString(json.fullName || this.fullName || "");
    this.image = CircuitString.fromString(json.image || this.image || "");
    this.description = CircuitString.fromString(json.description || this.description || "");
    this.state = CircuitString.fromString(json.state || this.state || "");
    this.telegram = CircuitString.fromString(json.telegram || this.telegram || "");
    this.email = CircuitString.fromString(json.email || this.email || "");
    this.phone = CircuitString.fromString(json.phone || this.phone || "");
    this.createdUTC = UTCDateTime.fromString((json.createdUTC || this.createdUTC).toString());
    this.updatedUTC = UTCDateTime.fromString((json.updatedUTC || this.updatedUTC).toString());
    this.approvedUTC = UTCDateTime.fromString((json.approvedUTC || this.approvedUTC || 0).toString());
  } 

  toJSON() {
    return {
      uid: this.uid.toString(),
      accountId: (this.accountId || PublicKey.empty()).toBase58(),
      fullName: this.fullName.toString(),
      description: this.description.toString(),
      image: this.image.toString(),
      state: this.state.toString(),
      approvedUTC: this.approvedUTC.toString(),
      createdUTC: this.createdUTC.toString(),
      updatedUTC: this.updatedUTC.toString(),
      email: this.email.toString(),
      phone: this.phone.toString(),
      telegram: this.telegram.toString()
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.accountId.toFields())
      .concat(this.fullName.toFields())
      .concat(this.description.toFields())
      .concat(this.state.toFields())
      .concat(this.image.toFields()) 
      .concat(this.approvedUTC.toFields())
      .concat(this.createdUTC.toFields()) 
      .concat(this.updatedUTC.toFields())
      .concat(this.email.toFields())
      .concat(this.phone.toFields())
      .concat(this.telegram.toFields());
    return Poseidon.hash(fields);
    /*
        let f1 = this.uid.toFields();
        let f2 = this.accountId.toFields();
        let f3 = this.fullName.toFields();
        let f4 = this.description.toFields();
        let f5 = this.state.toFields();
        let f6 = this.image.toFields();
        let f7 = [];// this.approvedUTC.toFields();
        let f8 = [];//this.createdUTC.toFields();
        let f9 = [];//this.updatedUTC.toFields();
        let f10 = this.email.toFields();
        let f11 = this.phone.toFields();
        let f12 = this.telegram.toFields();
        let fields = f1.concat(f2).concat(f3).concat(f4).concat(f5).concat(f6).concat(f7).concat(f8).concat(f9).concat(f10).concat(f11).concat(f12);
    */
  }

  key(): Field {
    return this.uid;
  }
}
