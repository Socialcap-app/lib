/**
 * This manages the Socialcap account used to receive payments 
 * and deposits from communities and from credential applicants. 
 * 
 * This deposits will be latter transfered to other Socialcap 
 * accounts used to transfer shares to communities, pay rewards to 
 * validators/electors and auditors, and fund the FeePayer accounts 
 * used to pay transactions started by the API server.
 * 
 * This account will be deployed manually by one of the Socialcap admin
 * admin accounts, that will become the Owner of it.
 * 
 * It will be the only account used for receiving payments for any 
 * Socialcap services. Its public address is: ``
 */
import { SmartContract, state, State, method } from "o1js";
import { UInt64, AccountUpdate, PublicKey } from "o1js";

export class SocialcapDeposits extends SmartContract {
  // cumulative total received from deposits
  @state(UInt64) totalReceived = State<UInt64>();

  // cumulative total sent to other accounts 
  @state(UInt64) totalSent = State<UInt64>();

  // this is the Account owner, only the owner can make payments
  @state(PublicKey) owner = State<PublicKey>();

  init() {
    // ensure that init() cannot be called again after zkApp is set up
    // during the initial deployment.
    //this.account.provedState.getAndRequireEquals();
    //this.account.provedState.get().assertFalse();

    // now we do init
    super.init();
    this.totalReceived.set(UInt64.from(0));
    this.totalSent.set(UInt64.from(0));

    // set the owner, using the account who deployed 
    this.owner.set(this.sender.getAndRequireSignature());

    // Configure this zkApp to be modifiable only by using proofs. It will not 
    // be upgradable after it is deployed. After its first deployment, it requires 
    // proof authorization and consequently can only be updated by transactions 
    // that fulfill the zkApp's smart contract logic. 
    // Ref: https://docs.minaprotocol.com/zkapps/tutorials/account-updates#smart-contracts
    // this.account.permissions.set({
    //   ...Permissions.default(),
    //   editState:  Permissions.proofOrSignature(),
    //   receive: Permissions.proofOrSignature(),
    //   send: Permissions.proofOrSignature(),
    //   setDelegate: Permissions.proofOrSignature(),
    //   setPermissions: Permissions.proofOrSignature(),
    //   setZkappUri: Permissions.proofOrSignature(),
    //   setTokenSymbol: Permissions.proofOrSignature(),
    //   incrementNonce: Permissions.proofOrSignature(),
    //   setVotingFor: Permissions.proofOrSignature(),
    //   setTiming: Permissions.proofOrSignature(),
    // });
  }

  /**
   * Check that only the owner of the account (the one who originally 
   * deployed it) can make transfers from the Socialcap funds to 
   * other accounts.
   */
  onlyOwner(sender: PublicKey) {
    let owner = this.owner.getAndRequireEquals();
    owner.assertEquals(sender);
  }  

  /**
   * In some exceptional cases it may be needed to transfer ownership
   * to a different account than the one that deployed the contract.
   * This will be used in very few cases.
   */
  @method async changeOwnership(newOwner: PublicKey) {
    // only the owner can transfer ownership of this account
    this.onlyOwner(this.sender.getAndRequireSignature());

    // assert and change to newOwner
    let currentOwner = this.owner.getAndRequireEquals();
    this.owner.set(newOwner);
  }  

  /**
   * Receive the deposit that community admins, validators and credential 
   * applicants must made in each case when creating a new community,
   * proposing as validator or claiming a credential.
   */
  @method async deposit(amount: UInt64) {
    // anyone can deposit ...
    let senderUpdate = AccountUpdate.create(this.sender.getAndRequireSignature());
    senderUpdate.requireSignature();
    senderUpdate.send({ to: this, amount });
     
    let total = this.totalReceived.getAndRequireEquals();
    total = total.add(amount);
    this.totalReceived.set(total);
  }

  /** 
   * Transfer the given ammount to the givena ccount for any 
   * desired latter use.
   */
  @method async transferTo(receiver: PublicKey, amount: UInt64) {
    // only owner can transfer !!!
    const sender = this.sender.getAndRequireSignature();
    this.onlyOwner(sender);

    let senderUpdate = AccountUpdate.create(sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: receiver, amount });

    let total = this.totalSent.getAndRequireEquals();
    total = total.add(amount);
    this.totalSent.set(total);
  }
}
