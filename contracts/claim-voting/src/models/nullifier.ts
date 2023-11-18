import { PublicKey, Field, Struct, Poseidon } from "o1js";
import { UID } from "../lib/uid.js";

export class ProvableElector extends Struct({
  claimUid: Field,
  electorId: PublicKey,
  state: Field
}) {

  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    claimUid: string,
    electorId: string,
    state: number
  }): this {
    this.claimUid = UID.toField(json.claimUid);
    this.electorId = PublicKey.fromBase58(json.electorId);
    this.state = Field(json.state);
    return this;
  }

  key(): Field {
    return Poseidon.hash(
      this.claimUid.toFields()
      .concat(this.electorId.toFields())
    );
  }
  
  hash(): Field {
    return this.state;
  } 
}
