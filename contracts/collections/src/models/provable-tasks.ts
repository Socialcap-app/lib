
import { Field, Struct, CircuitString, PublicKey, Poseidon } from 'o1js';
import { UID } from "../lib/uid.js";
import { UTCDateTime } from "../lib/datetime.js";
import { TASK_STATES } from "./states.js";

export { ProvableTask, TASK_STATES };


class ProvableTask extends Struct({
  uid: Field, 
  claimUid: Field,
  assigneeUid: Field,
  state: Field, 
  assignedUTC: Field,
  completedUTC: Field,
  dueUTC: Field,
  rewarded: Field,
  reason: Field
}) {

  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    uid: string,
    claimUid: string, 
    assigneeUid: string,
    state?: number,
    assignedUTC?: string,
    completedUTC?: string,
    dueUTC?: string,
    rewarded?: number,
    reason?: number
  }): this {
    // ids and refrences are not optional
    this.uid = UID.toField(json.uid);
    this.claimUid = UID.toField(json.claimUid); 
    this.assigneeUid = UID.toField(json.assigneeUid); 
    this.state = Field(json.state || this.state || 0);
    this.assignedUTC = UTCDateTime.fromString((json.assignedUTC || this.assignedUTC || 0).toString());
    this.completedUTC = UTCDateTime.fromString((json.completedUTC || this.completedUTC || 0).toString());
    this.dueUTC = UTCDateTime.fromString((json.dueUTC || this.dueUTC || 0).toString());
    this.rewarded = Field(json.rewarded || this.rewarded || 0);
    this.reason = Field(json.reason || this.reason || 0);
    return this;
  } 

  toJSON() {
    // not really needed for now ...
    return {
      uid: this.uid.toString(),
      assigneeUid: this.assigneeUid.toString(),
      claimUid: this.claimUid.toString(),
      state: this.state.toBigInt(),
      assignedUTC: UTCDateTime.fromField(this.assignedUTC)
    };
  }

  hash(): Field {
    let fields: Field[] = [];
    fields = fields
      .concat(this.uid.toFields())
      .concat(this.claimUid.toFields())
      .concat(this.assigneeUid.toFields())
      .concat(this.state.toFields())
      .concat(this.assignedUTC.toFields()) 
      .concat(this.completedUTC.toFields())
      .concat(this.dueUTC.toFields())
      .concat(this.rewarded.toFields())
      .concat(this.reason.toFields())
    return Poseidon.hash(fields);
  }

  key(): Field {
    return this.uid;
  }
}
