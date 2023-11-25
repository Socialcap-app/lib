import { SmartContract, state, State, method } from "o1js";
import { Field, UInt64, AccountUpdate, DeployArgs, Permissions, PublicKey, Provable } from "o1js";
import { aMember } from "./tests/mockups";

/**
 * This manages the Socialcapp account used to receive deposits 
 * and transfer shares to communities and rewards to validators,
 * and also mantain the FeePayer account funded for transactions 
 * started by the API server.
 */
export class SocialcapContract extends SmartContract {
  // total received from deposits
  @state(UInt64) totalDeposits = State<UInt64>();

  // total payed to communities
  @state(UInt64) totalSharesPayed = State<UInt64>();

  // total paid to validators
  @state(UInt64) totalRewardsPayed = State<UInt64>();

  // total fees payed due to transactions managed 
  @state(UInt64) totalFeesPayed = State<UInt64>();

  // this is the Account owner, only the owner can make payments
  @state(PublicKey) owner = State<PublicKey>();

  init() {
    // ensure that init() cannot be called again after the zkApp is set up
    // during the initial deployment.
    this.account.provedState.assertEquals(this.account.provedState.get());
    this.account.provedState.get().assertFalse();
    // now we do init
    super.init();
    this.totalDeposits.set(UInt64.from(0));
    this.totalSharesPayed.set(UInt64.from(0));
    this.totalRewardsPayed.set(UInt64.from(0));
    this.totalFeesPayed.set(UInt64.from(0));
    // set the owner, using the account who deployed 
    this.owner.set(this.sender);
  }

  /**
   * Configure this zkApp to be modifiable only by using proofs. It will not 
   * be upgradable after it is deployed. After its first deployment, it requires 
   * proof authorization and consequently can only be updated by transactions 
   * that fulfill the zkApp's smart contract logic. 
   * Ref: https://docs.minaprotocol.com/zkapps/tutorials/account-updates#smart-contracts
   */
  deploy(args: DeployArgs) {
    super.deploy(args);
    this.account.permissions.set({
      ...Permissions.default(),
      receive: Permissions.proofOrSignature(),
      send: Permissions.proof(),
      setDelegate: Permissions.proof(),
      setPermissions: Permissions.proof(),
      setVerificationKey: Permissions.proof(),
      setZkappUri: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVotingFor: Permissions.proof(),
      setTiming: Permissions.proof(),
    });
  }
  
  /**
   * Check that only the owner of the account (the one who originally deployed
   * it) can make transfers from the Socialcap funds to other accounts.
   */
  @method onlyOwner(sender: PublicKey) {
    let owner = this.owner.getAndAssertEquals();
    owner.assertEquals(sender);
  }  

  /**
   * In some exceptional cases it may be needed to transfer ownership
   * to a different account than the one that deployed the contract.
   * This will be used in very few cases.
   */
  @method changeOwnership(newOwner: PublicKey) {
    // only the owner can transfer ownership of this account
    this.onlyOwner(this.sender);

    // assert and change to newOwner
    let currentOwner = this.owner.get();
    this.owner.assertEquals(currentOwner);
    this.owner.set(newOwner);
  }  

  /**
   * Receive the deposit that community admins, validators and credential 
   * applicants must made in each case when creating a new community,
   * proposing as validator or claiming a credential.
   */
  @method deposit(amount: UInt64) {
    // anyone can deposit ...
    let senderUpdate = AccountUpdate.create(this.sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: this, amount });
    // 
   let total = this.totalDeposits.getAndAssertEquals();
   total = total.add(amount);
   this.totalDeposits.set(total);
  }

  /** 
   * Transfer the corresponding share of the received fees to each
   * of the communities who participate in Socialcap.
   */
  @method transferShares(receiver: PublicKey, amount: UInt64) {
    // only owner can transfer !!!
    this.onlyOwner(this.sender);

    let senderUpdate = AccountUpdate.create(this.sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: receiver, amount });

    let total = this.totalSharesPayed.getAndAssertEquals();
    total = total.add(amount);
    this.totalSharesPayed.set(total);
  }

  /** 
   * Transfer rewards to validators involved in the voting process
   * when we can confirm that they did their job and the voting process
   * has been completed.
   */
  @method transferRewards(receiver: PublicKey, amount: UInt64) {
    // only owner can transfer !!!
    this.onlyOwner(this.sender);

    let senderUpdate = AccountUpdate.create(this.sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: receiver, amount });
     
    let total = this.totalRewardsPayed.getAndAssertEquals();
    total = total.add(amount);
    this.totalRewardsPayed.set(total);
  }

  /**
   * Transfer fees to the FeePayer account to be used in the API
   * server for bookeping and rolling up transactions.
   */
  @method transferFees(receiver: PublicKey, amount: UInt64) {
    // only owner can transfer !!!
    this.onlyOwner(this.sender);

    let senderUpdate = AccountUpdate.create(this.sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: receiver, amount });
     
    let total = this.totalFeesPayed.getAndAssertEquals();
    total = total.add(amount);
    this.totalFeesPayed.set(total);
  }
}
