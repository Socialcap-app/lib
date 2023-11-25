/**
 * An auxiliary class to manage entity state and state transitions
 * 
 * Use:
 * ~~~
 *    const PersonState = new EntityState([
 *      "INITIAL", "REVISION", "APPROVED", "PAYMENT", "ACTIVE", 
 *      "DELETED","CANCELED","PAUSED"
 *    ])
 * 
 *    let state = PersonState.set("INITIAL");
 *    // ...
 *    // latter on ...
 *    state = state.set("REVISION");
 * ~~~
 * 
 * Valid states must be expressed with an array of strings:
 * ~~~
 *    [
 *      "INITIAL", "REVISION","APPROVED","PAYMENT","ACTIVE",
 *      "DELETED","CANCELED","PAUSED"
 *    ]
 * ~~~
 * 
 * State transitions msut be expresed with an dictionary, where each entry is 
 * a valid state, and the value for this entry is an array of the possible 
 * valid states:
 * ~~~
 *    { 
 *      "INITIAL":  ["REVISION", "CANCELED"], 
 *      "REVISION": ["APPROVED", "CANCELED"],
 *      "APPROVED": ["PAYMENT", "CANCELED"],
 *      // ...
 *    }
 * ~~~
 * 
 * 
*/
export { EntityState };

/*
const CommunityState = () => new _State_(COMMUNITY_STATES);

const PersonState = () => new _State_(PERSON_STATES);

const ClaimState = () => new _State_(CLAIM_STATES);


const COMMUNITY_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE", 
  "DELETED","CANCELED","PAUSED"
];

const PERSON_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE", 
  "DELETED","CANCELED","PAUSED"
];

const CLAIM_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE", 
  "DELETED","CANCELED","PAUSED"
];
*/

class EntityState {
  private current: string;
  private valids: string[];
  private transitions: null | any;

  constructor(valids: string[], transitions?: object) {
    this.valids = valids;
    this.transitions = transitions || null;
    this.current = "";
  }

  set(value: string | number) {
    let val = (typeof(value) === 'number') ? this.valids[value] : value;
    if (! this.valids.includes(val)) return this;
    if (! this.isValidTransition(val)) return this;
    this.current = val;
    return this;
  }

  initial(): string {
    return this.valids[0];
  }

  get(): string {
    return this.current;
  }

  index(value: string): number {
    value = value || this.current;
    for (let j=0; j < this.valids.length; j++) {
      if (this.valids[j] === value)
        return j;
    }
    return -1;
  }

  private isValidTransition(value: string): boolean {
    if (! this.transitions) return true;
    return this.transitions[this.current].includes(value);
  }

  // experimental
  changeFrom(from0: string, to1: string): string {
    if (! this.valids.includes(from0)) return this.initial();
    if (! this.valids.includes(to1)) return from0;
    this.set(from0).set(to1);
    return this.get();
  }
}
