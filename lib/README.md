# Mina zkApp: @socialcap/contracts

This template uses TypeScript.

### How to build

```sh
npm run build
```

### How to run tests

```sh
node build/src/tests/main-root-tests.js
node build/src/tests/main-claim-tests.js
```

### Publish to NPM
~~~
npm publish --access public
~~~

### Use it

Install in client
~~~
npm i @socialcap/contracts
~~~

Import it
~~~
import { 
  RootsContract, 
  VotingContract,
  VotingInstance,
  ClaimsVotingFactory,
  ProvableCommunity, 
  CommunityState,
  ProvablePerson,
  PersonState,
  ProvableMember,
  MemberRole,
  UID,
  UTCDateTime,
  MerkleMapProxy,
  MerkleMapUpdate,
  LeafInstance,
  NullifierProxy,
} from "@socialcap/contracts";
~~~

## License

[Apache-2.0](LICENSE)
