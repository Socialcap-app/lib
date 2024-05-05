import { SocialcapDeposits } from './Deposits';
import { Mina, Types, PrivateKey, PublicKey, AccountUpdate, UInt64 } from 'o1js';
import Client from 'mina-signer';
import fs from "fs/promises";

let proofsEnabled = false;

const TXNFEE = 150_000_000;
let deployer: Mina.TestPublicKey;
let payer: Mina.TestPublicKey;
let zkAppAddress: PublicKey, zkAppPrivateKey: PrivateKey, zkApp: SocialcapDeposits;
let client: Client | undefined;

beforeAll(async () => {
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  [deployer, payer] = Local.testAccounts;
  client = new Client({ network: Local.getNetworkId() }); 

  if (proofsEnabled) 
    await SocialcapDeposits.compile();

  zkAppPrivateKey = PrivateKey.random();
  zkAppAddress = zkAppPrivateKey.toPublicKey();
  zkApp = new SocialcapDeposits(zkAppAddress);
});

describe('SocialcapDeposits', () => {
  it('generates and deploys the `SocialcapDeposits` smart contract', async () => {
    if (!deployer || !payer) return;

    const txn = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy();
    });
    await txn.prove();

    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployer.key, zkAppPrivateKey]).send();

    const owner = zkApp.owner.get();
    expect(owner.toBase58()).toEqual(deployer.toBase58())

    const balance = Number(zkApp.account.balance.get());
    expect(balance).toEqual(0);

    const received = zkApp.totalReceived.get();
    expect(received).toEqual(UInt64.from(0));    
  });

  it('correctly deposits PAYMENT amount on the `SocialcapDeposits` contract', async () => {
    if (!deployer || !payer) return;
    const PAYMENT = 10;

    const txn = await Mina.transaction(payer, async () => {
      await zkApp.deposit(UInt64.from(PAYMENT));
    });
    await txn.sign([payer.key]);
    await txn.prove();
    await txn.send();
    
    const balance = Number(zkApp.account.balance.get());
    expect(balance).toEqual(PAYMENT);

    const received = zkApp.totalReceived.get();
    expect(received).toEqual(UInt64.from(PAYMENT));    

    const sent = zkApp.totalSent.get();
    expect(sent).toEqual(UInt64.from(0));    
  });

  it('creates and exports proved but unsigned transaction', async () => {
    if (!deployer || !payer) return;
    const PAYMENT = 10;

    const txn = await Mina.transaction(
      { sender: payer, fee: TXNFEE }, 
      async () => { 
        await zkApp.deposit(UInt64.from(PAYMENT)); 
      }
    );
    let txn2 = await txn.prove();

    await fs.writeFile('./tmp/txn-unsigned.json', txn2.toJSON());
  });

  it('imports, signs and exports signed transaction, ', async () => {
    if (!payer) return;

    const unsignedTxn = JSON.parse(
      await fs.readFile("./tmp/txn-unsigned.json", "utf8")
    )

    let signBody = {
      zkappCommand: unsignedTxn,
      feePayer: {
          feePayer: unsignedTxn.feePayer.body.publicKey,
          fee: unsignedTxn.feePayer.body.fee,
          nonce: unsignedTxn.feePayer.body.nonce,
          memo: unsignedTxn.memo.substring(0, 32)||""
      },
    }

    // Sign with mina signer after importing unsigned tx. 
    // NOTE: There is a char length issue with memo.
    const signedTxn = client?.signTransaction(signBody, payer.key.toBase58());

    await fs.writeFile('./tmp/txn-signed.json', JSON.stringify(signedTxn?.data.zkappCommand));
  });

  it('imports and sends signed transaction, ', async () => {
    // @ ts-ignore
    const signedTxn = Mina.Transaction.fromJSON(
      JSON.parse(await fs.readFile("./tmp/txn-signed.json", "utf8"))
    ) as Mina.Transaction<false, true>;

    const txn = await signedTxn.send();
    expect(txn.status).toBe('pending');
  });
});
