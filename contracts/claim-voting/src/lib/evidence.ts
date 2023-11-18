import { Poseidon, Field } from "o1js";

/**
 * Hash using Poseidon an arbitrary object, or string.
 */
export function hashData(obj: any): Field {
  // first stringify the data
  const json = typeof(obj) === 'string' ? obj : JSON.stringify(obj);

  // transforn the string into an array of bytes
  const bytes = (new TextEncoder()).encode(json);
  const fields: Field[] = [];
  for (let j=0; j< bytes.length; j++) 
    fields.push(Field(bytes[j])); 

  // now hash it
  return Poseidon.hash(fields);
}
