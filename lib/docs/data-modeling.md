
## Merkle Maps

We use the following MerkleMaps linked to the `RootsContract` states:
~~~
  @state(Field) communitiesRoot = State<Field>();
  @state(Field) personsRoot = State<Field>();
  @state(Field) membersRoot = State<Field>();
  @state(Field) claimsRoot = State<Field>();
  @state(Field) tasksRoot = State<Field>();
  @state(Field) credentialsRoot = State<Field>();
~~~

**Design decisions**: 

1) **No arrays**: to avoid problems and because it is difficult to deal with dynamic arrays in SnarkyJS (at least for now) we DO NOT include arrays in any of the structs we attest with MerkleMaps.

2) **toJSON and fromJSON methods**: these are needed in all entities, because serializing and deserializing using standard JSON is not possible, as we need to include only Provable fields in the structure.

3) **Only relevant attributes**: only some of the attributes of the DB entity may be mapped to this Provable struct. It is a careful balance we must take to include all relevant fields, but no more. There may be additional info in the DB entity that is not crucial, and so may not be here. 

4) **UID instead of accountId**: 

### Community MerkleMap

Binded to the Community DB Entity.

Each leaf in this MerkleMap contains:

- **key**: the entity `uid`
- **hash**: a hash of the following community properties:
    
    ~~~
      uid: Field,
      state: CircuitString, 
      accountId: PublicKey,
      adminUid: Field // for now we just allow one addmin
      name: CircuitString,
      description: CircuitString,
      image: CircuitString,
      createdUTC: Field,
      updatedUTC: Field,
      approvedUTC: Field,
    ~~~

### Person MerkleMap

Binded to the Person DB Entity.

Each leaf in this MerkleMap contains:

- **key**: the Person `uid`
- **hash**: a hash of the following community properties:
    
    ~~~
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
    ~~~

### Member MerkleMap

Binded to the N-M relation _Person is member of Community_, _Person is a validator in Community_ and _Person is an auditor in Community_.

Each leaf in this MerkleMap contains:

- **key**: a hash of `[communityUid,personUid]`
- **hash**: status Field which will be '0' if not a member, '1' if it is a member,  '2' if it is a validator and '3' if it is an auditor (all validators are members, and all auditors are validators).

With this we can verify easily if certain person is a member, and if its also a validator or an auditor in a given community.


### Claims MerkleMap

Binded to the Claim DB Entity.

Each leaf in this MerkleMap contains:

- **key**: the Claim `uid`
- **hash**: a hash of the following community properties:
    
    ~~~
      uid: Field,
      state: CircuitString, 
      accountId: PublicKey, // the address of the deployed VotingContract for this claim
      fullName: CircuitString,
      description: CircuitString,
      image: CircuitString,
      telegram: CircuitString,
      email: CircuitString,
      phone: CircuitString,
      createdUTC: Field,
      updatedUTC: Field,
      approvedUTC: Field,
    ~~~


### Tasks MerkleMap

Binded to the N-M relation _Person has assigned Task_.

Each leaf in this MerkleMap contains:

- **key**: a hash of `[personUid, taskUid]`
- **hash**: status Field which will be '0' if not assigned, '1' if pending,  '2' if ignored/rejected, and '3' if completed.

With this we can verify easily if certain person has been assigned, pending or completed a certain task.
