import { Field } from "o1js";

let crytptoLib: any; 
if (typeof window === "undefined") {
  // on node
  setTimeout(async () => {
    crytptoLib = await import("crypto");
  }, 50)
} else {
  // on browser
  crytptoLib = window.crypto;
}

export { UID };

const UID = {

  uuid4: function(): string {
    return crytptoLib.randomUUID().replace(/-/g,'');
  },

  fromField: function(f: Field): string {
    return f.toBigInt().toString(16); // convert it to a Hex string!
  },

  toField: function(uid: string): Field {
    let s = `0x${uid}`;
    return Field(s);
  },

  toFields: function(uid: string): Field[] {
    return UID.toField(uid).toFields();
  }
}
