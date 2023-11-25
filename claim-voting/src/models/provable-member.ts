import { Field, Struct, Poseidon } from "o1js";
import { UID } from "../lib/uid.js";
import { EntityState } from "./entity-state.js";

export { ProvableMember, MemberRole };


const MemberRole = new EntityState([
  // valid roles
  // 0-Not a member, 1-Plain member, 2-Validator, 3-Auditor 
  "NONE", "PLAIN", "VALIDATOR", "AUDITOR"
], {
  // transitions
  "NONE": ["PLAIN"],
  "PLAIN": ["VALIDATOR", "AUDITOR"],
  "VALIDATOR": ["PLAIN", "AUDITOR"],
  "AUDITOR": ["PLAIN", "VALIDATOR"],
});


class ProvableMember extends Struct({
  personUid: Field,
  communityUid: Field,
  role: Field  /* 0-Not a member, 1-Plain member, 2-Validator, 3-Auditor */
}) {

  constructor(json?: any) {
    super(json);
    this.fromJSON(json);
  }

  fromJSON(json: {
    personUid: string,
    communityUid: string,
    role: string,
  }) {
    this.personUid = UID.toField(json.personUid);
    this.communityUid = UID.toField(json.communityUid);
    this.role = Field(json.role);
  } 

  toJSON() {
    return {
      personUid: this.personUid.toString(),
      communityUid: this.communityUid.toString(),
      role: this.role.toString()
    };
  }

  hash(): Field {
    return this.role;
  }

  key(): Field {
    return Poseidon.hash([this.communityUid, this.personUid]);
  }
}
