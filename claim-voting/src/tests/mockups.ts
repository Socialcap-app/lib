import { hashData } from "../lib/evidence.js";

export const aCommunity = {
  uid: "2c93bc430cb3482bb16cda66ad3bd49a",
  accountId: "",
  name: "The MINA Cohort 1",
  description: "A community of devs building zkApps in MINA",
  state: "REVISION",
  image: "https://fleek.ipfs.io/ipfs/bafybeib2e3m6pa7ja2rmmocsbwv2nhpsyjnats27sqqc3bgn3f6ai6uqt4",
  approvedUTC: "2023-05-1 10:00:00.000Z",
  createdUTC: "2023-05-2 11:00:00.000Z",
  updatedUTC: "2023-05-3 12:00:00.000Z",  
  adminUid: "364ced06e2894771bf8bdaaa4f41118c"
};

export const aPerson = {
  uid: "011ff965ec7b478fa2d7b611e65f3e63",
  accountId: "",
  fullName: "Marcelo Mirando la Luna",
  description: "A starting zk Dev",
  state: "REVISION",
  image: "https://fleek.ipfs.io/ipfs/bafybeib2e3m6pa7ja2rmmocsbwv2nhpsyjnats27sqqc3bgn3f6ai6uqt4",
  approvedUTC: "2023-05-1 10:00:00.000Z",
  createdUTC: "2023-05-2 11:00:00.000Z",
  updatedUTC: "2023-05-3 12:00:00.000Z",  
  email: "mail011ff965ec7b478fa2d7b611e65f3e63@gmail.com",
  phone: "",
  telegram: ""
};

export const aMember = {
  communityUid: "2c93bc430cb3482bb16cda66ad3bd49a",
  personUid: "011ff965ec7b478fa2d7b611e65f3e63",
  role: 1, // as Member
}

export const aClaim = {
  uid: "c0527cad0d304dd4828564a9bf0578be",
  communityUid: "2c93bc430cb3482bb16cda66ad3bd49a",
  planUid: "ae3d1c41b8604e1b8aaeeb50b6b5b166",
  applicantUid: "011ff965ec7b478fa2d7b611e65f3e63",
  accountId: "",
  state: 1, // DRAFT
  alias: "marz0x",
  // activity times
  createdUTC: "2023-05-01 12:01:01.000Z",
  updatedUTC: "2023-05-07 12:01:01.000Z",
  votedUTC: null,
  issuedUTC: null,
  dueUTC: null,
  // voting results
  requiredVotes: 4, // copied from MasterPlan
  requiredPositives: 3, // copied from MasterPlan
  currentVotes: 0,
  positiveVotes: 0,
  negativeVotes: 0,
  ignoredVotes: 0,
  evidenceDataHash: hashData([{
      sid: 'tgid',
      label: "Your telegram account",
      type: "text",
      value: "@marz0xPenguin"
    }, { 
      sid: 'more',  
      label: "Additional evidence for your claim",
      type: "note",
      value: "longnote + longnote + longnote",
    }, {
      sid: 'docfile',
      label: "Attach this file please ...",
      type: "file",
      value: "/files/0234...feA00.svg"
    }
  ])
}

export const aPlan = {
  uid: "ae3d1c41b8604e1b8aaeeb50b6b5b166", 
  communityUid: "2c93bc430cb3482bb16cda66ad3bd49a", // the community that will issue this Credential
  state: 1, // DRAFT
  name: "zkIgnite Cohort1 Dev",
  description: "A MINA protocol zkIgnite granted dev", 
  image: "https://nftstorage.link/ipfs/bafybeignqpmsfdpvtko7zbojxns5ifjaki7vm7x5geb4jsq5xstnjy7uai/image", 
  // required evidence data the claimer needs to supply
  evidenceHash: hashData([{ 
      sid: 'tgid',
      required: true, // a required field
      label: "Your telegram account",
      description: "We need this in order to communicate with you.",
      type: "text",
      extras: { 
        max: 300, //max number of chars in this field 
      }
    }, { 
      sid: 'more',  
      required: true, // a required field
      label: "Additional evidence for your claim",
      description: "Please provide additional evidence to sustain your claim.",
      type: "note",
      extras: { 
        max: 1300, //max number of chars in this field 
      }
    }, {
      sid: 'docfile',
      required: false, // optional field
      label: "Attach this file please ...",
      description: "Please attach this file so we can verify it.",
      type: "file",
      extras: { 
        allowed: "svg,png", // allowed field types
      }
    }
  ]),
  metadataHash: null,
  instructionsHash: null,
  legalHash: null,
  // fees and shares
  fee: 5, // the fee in MINA required for this credential
  rewardsShare: 60, // percentaje of the fee that will go to validator rewards
  communityShare: 30, // percentaje of fee that will go to the community
  protocolShare: 10, // percentaje of fee that will go to the Protocol (Socialcap)
  // claim options
  total: 10,
  expiration: 365, // days since issued when an issued credential wil expire (or 0 for no expiration)
  revocable: true, // if this credential can be revoked 
  startsUTC: "2023-05-02 12:01:01", // when claiming can start and when it ends
  endsUTC: "2023-08-02 12:01:00",
  strategyHash: hashData({
    title: "",
    variant: "RandomAnonyomusValidators",
    selection: "Validators", // Auditors | FullCommunity | AllCapValidators | AllCapAuditors
    minValidators: 3,
    minVotes: 3,
    minPositives: 2,
    minAuditors: 1,
    auditFrequency: 10 // 1 every 10 claims 
  }),
  // standard activity times
  createdUTC: "2021-01-01",
  updatedUTC: "2023-05-06",
  approvedUTC: "2021-02-06",
}

export const aCredential = {
  uid: "c0527cad0d304dd4828564a9bf0578be",
  communityUid: "2c93bc430cb3482bb16cda66ad3bd49a",
  claimId: "B62qnMSjxCLj6ntrDrKKzgVozMKFJ9yGAn6U9TruKQ6dJ6GnGSBg47m",
  applicantId: "B62qnMSjxCLj6ntrDrKKzgVozMKFJ9yGAn6U9TruKQ6dJ6GnGSBg47m",
  // to be used in presentation
  type: "Core Team Member", // derived form MasterPlan name for this credential
  description: "Rewarding outstanding developers in our community",
  alias: "Juan del Verde Prado",
  stars: 5, 
  image: "https://nftstorage.link/ipfs/bafybeignqpmsfdpvtko7zbojxns5ifjaki7vm7x5geb4jsq5xstnjy7uai/image", 
  metadataHash: null,
  issuedUTC: "2023-08-03 17:00:00",
  expiresUTC: "2024-08-03 17:00:00",
}

export const aTask = {
   // the basic DB Task Entity
   uid: "06928bd2aa3b42dcbf22223aad60d666",
   claimUid: "c0527cad0d304dd4828564a9bf0578be",
   assigneeUid: "011ff965ec7b478fa2d7b611e65f3e63",
   state: 7, // ASSIGNED
   assignedUTC: "2023-05-01 15:00:00",
   completedUTC: "",
   dueUTC: "2023-08-03 17:00:00",
   rewarded: 0,
   reason: 0,
}

export const aElector = {
  claimUid: "c0527cad0d304dd4828564a9bf0578be",
  electorId: "B62qnMSjxCLj6ntrDrKKzgVozMKFJ9yGAn6U9TruKQ6dJ6GnGSBg47m",
  state: 1, // ASSIGNED
}

/*
],
validators: [
  "011ff965ec7b478fa2d7b611e65f3e63",
  "06928bd2aa3b42dcbf22223aad60d666",
  "f39c697a58f049fd95ca9103da2e5b08"
],
auditors: [
  "011ff965ec7b478fa2d7b611e65f3e63",
  "06928bd2aa3b42dcbf22223aad60d666",
  "f39c697a58f049fd95ca9103da2e5b08"
],
plans: [
  "ae3d1c41b8604e1b8aaeeb50b6b5b166",
  "c0527cad0d304dd4828564a9bf0578be"
]
*/