import { Mina, PrivateKey, PublicKey, Field, Poseidon } from 'o1js';
import { NullifierMTH16 } from '../nullifier-treeh16.js';
import { NullifierMM } from '../nullifier-map.js';
import { ASSIGNED } from '../all-states.js';

// set instance
const Local = Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

// get some accounts
function getLocalAccount(j: number): { puk: PublicKey, prk: PrivateKey } {
  let acc = Local.testAccounts[j];
  return {
    puk: acc.publicKey, 
    prk: acc.privateKey
  };
}

// this will be the test Claim Uid
let claimUid = Field(1001);

// the ClaimElectors Nullifier leaf key //
function leafKeyN1(electorPuk: PublicKey, claimUid: Field): Field {
  const hashed = Poseidon.hash(
    electorPuk.toFields()
    .concat(claimUid.toFields())
  );
  return hashed;
} 

// the BatchVote Nullifier leaf value //
function leafValueN2(electorPuk: PublicKey, claimUid: Field, result: Field): Field {
  const hashed = Poseidon.hash(
    electorPuk.toFields()
    .concat(claimUid.toFields())
    .concat(result.toFields())
  );
  return hashed;
} 

//// we need to add some electors with their accountIds ////

let electors: { puk: PublicKey, prk: PrivateKey }[] = [];
electors[0] = getLocalAccount(3);
electors[1] = getLocalAccount(4);
electors[2] = getLocalAccount(5);
electors[3] = getLocalAccount(6);
electors[4] = getLocalAccount(7);

{
  let nullifier = (new NullifierMM())
    .addLeafs([
      { key: leafKeyN1(electors[0].puk, claimUid), value: Field(ASSIGNED) },
      { key: leafKeyN1(electors[1].puk, claimUid), value: Field(ASSIGNED) },
      { key: leafKeyN1(electors[2].puk, claimUid), value: Field(ASSIGNED) },
      { key: leafKeyN1(electors[3].puk, claimUid), value: Field(ASSIGNED) },
    ]);

  let assert1 = nullifier.assertLeaf(nullifier.root(), 
    leafKeyN1(electors[3].puk, claimUid), 
    Field(ASSIGNED)
  );
  let json = nullifier.toJSON(); 

  let nullifier2 = (new NullifierMM()).fromJson(json);
  let assert2 = nullifier2.assertLeaf(nullifier2.root(), 
    leafKeyN1(electors[3].puk, claimUid), 
    Field(ASSIGNED)
  );
}

// Test build and rebuilding from JSON //

{
  const values = [
    { value: leafValueN2(electors[0].puk, Field(1001), Field(+1))},
    { value: leafValueN2(electors[0].puk, Field(1002), Field(-1))},
    { value: leafValueN2(electors[0].puk, Field(1003), Field(0))},
    { value: leafValueN2(electors[0].puk, Field(1004), Field(+1))},
  ];

  let lastIndex = 3; let lastValue = values[3].value;

  let nullifier = (new NullifierMTH16()).addLeafs(values);
  let assert1= nullifier.assertLeaf(nullifier.root(), 
    BigInt(lastIndex), 
    lastValue
  );

  let json = nullifier.toJSON();

  let nullifier2 = (new NullifierMTH16()).fromJson(json);
  let assert2= nullifier2.assertLeaf(nullifier2.root(), 
    BigInt(lastIndex), 
    lastValue
  );
}
