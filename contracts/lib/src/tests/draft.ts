import { Field, Bool, MerkleMapWitness } from "o1js"

let l: Bool[] = [Bool(true), Bool(false)];
let s: Field[] = [];
for (let j=0; j < 255; j++)
  s.push(Field(j));

let mw = new MerkleMapWitness(l, s);
console.log(mw.toJSON());
