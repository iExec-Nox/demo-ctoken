# Permissionless Architecture (ELI5)

> **TL;DR** — In the future, anyone can run a Nox node (Runner, KMS, Ingestor, Handle Gateway) by proving they're running legitimate code and staking RLC tokens as collateral. Bad behavior gets your stake slashed. No gatekeepers, no permission needed.

---

## The Taxi Medallion Analogy

In some cities, you need a **taxi medallion** (an expensive license) to drive a taxi. Only a few people can afford medallions, so the supply of taxis is limited and controlled by a small group.

Now imagine a different system:

1. **Anyone can drive** — you just need a car that passes inspection (TEE with remote attestation).
2. **You post a deposit** (stake RLC tokens) — this is your guarantee that you'll behave.
3. **If you drive recklessly** (produce wrong results, go offline, try to cheat) — part or all of your deposit is taken (**slashing**).
4. **Passengers rate you** (verification) — the system checks your work against others'.

That's **permissionless infrastructure**. No taxi medallion needed. The system is open to everyone, but economic incentives keep participants honest.

---

## Two Kinds of Permissionless

### 1. Permissionless Operation (Running Nodes)

Anyone can run protocol infrastructure:

```
Want to run a Runner?
  1. Set up Intel TDX hardware
  2. Run the official Runner software
  3. Pass remote attestation (proves you're running real, unmodified code)
  4. Stake RLC tokens
  5. Start processing computation messages from NATS

  → Earn rewards for honest computation
  → Get slashed for bad behavior
```

The same applies to all components:

| Component | What you run | What you stake |
|---|---|---|
| **Runner** | Computation engine in TDX | RLC tokens |
| **KMS Node** | Key share holder in TDX | RLC tokens |
| **Ingestor** | Blockchain event monitor in TDX | RLC tokens |
| **Handle Gateway** | Encrypted data storage in TDX | RLC tokens |

### 2. Permissionless Extension (Creating Primitives)

Developers can create **new computation primitives** — custom operations on encrypted data:

```
Want to create a new primitive?
  1. Write the computation logic
  2. Package it for TEE execution
  3. Deploy it (register the code hash on-chain)
  4. Runners can now execute your primitive

  → Users pay to use your primitive
  → You earn fees
```

A computation primitive is an operation like `add`, `transfer`, or `mint` — but custom. Developers could create:
- Encrypted sorting
- Confidential auctions
- Private voting tallies
- Encrypted order matching

---

## The Trust Chain

How does the system know a Runner is legitimate?

### 1. Code Integrity

```
Developer writes Runner code
    │
    ▼
Code is open-source and auditable
    │
    ▼
Code hash is stored on-chain in a Registry contract
    │
    ▼
When a Runner starts, the TEE generates an attestation report:
  "I am genuine Intel TDX hardware, running code with hash 0xABC..."
    │
    ▼
Anyone can compare the attested hash to the on-chain Registry
  Match? → This Runner is running the correct, unmodified code ✓
```

### 2. Proof of Cloud

Goes one step further — cryptographically verifies **where** the hardware is physically located:

- **TEE attestation** proves the software environment is genuine
- **TPM sealing** proves the hardware is in a certified data center

Together, they prevent someone from running a "TEE" in their garage with tampered hardware.

### 3. Governed Upgrades

When the Runner software needs an update:

1. New code hash is proposed through **on-chain governance**
2. Community votes to approve
3. **Reproducible builds** let anyone verify the binary matches the public source code
4. **Transition period** gives operators time to migrate

No backdoor updates. No silent changes. Everything is verifiable.

---

## Slashing: Keeping Everyone Honest

Staking without consequences is meaningless. Slashing is the enforcement mechanism:

| Bad behavior | Consequence |
|---|---|
| Producing incorrect computation results | Partial or full stake slashed |
| Going offline during committed work | Partial stake slashed |
| Attempting to extract or leak plaintext data | Full stake slashed |
| Running modified (non-attested) code | Cannot participate (attestation fails) |

The economic math is simple: if the cost of cheating (losing your stake) exceeds the profit from cheating, rational operators stay honest.

---

## RLC Token's Role

RLC is the protocol's native token with specific functions in the permissionless architecture:

| Function | How RLC is used |
|---|---|
| **Staking** | Operators lock RLC to participate as node operators |
| **Slashing** | Misbehaving operators lose staked RLC |
| **Fees** | Users pay RLC for computation (operations on encrypted data) |
| **Rewards** | Honest operators earn RLC for processing computations |
| **Governance** | RLC holders vote on protocol upgrades and code hash approvals |

---

## Current vs. Future State

```
Today (MVP/Testnet):
├── iExec operates all infrastructure
├── Single Runner, single KMS, single Ingestor
├── Centralized but secure (TEE-protected)
└── Fast iteration and development

Tomorrow (Mainnet):
├── Anyone can run nodes (permissionless)
├── Multiple Runners, distributed KMS, redundant Ingestors
├── Economic security via staking + slashing
├── Governed upgrades via on-chain voting
└── Open marketplace for computation primitives
```

---

## Why Permissionless Matters

| Centralized | Permissionless |
|---|---|
| One operator = single point of trust | Many operators = distributed trust |
| Operator goes down = system stops | Other operators keep the system running |
| One jurisdiction = regulatory risk | Global operators = censorship resistance |
| Fixed capacity | More operators = more throughput |
| Closed ecosystem | Anyone can contribute and earn |

DeFi was built on the principle that **no single entity should control the system**. A privacy layer for DeFi should follow the same principle. Permissionless architecture ensures that Nox's confidentiality guarantees don't depend on trusting any single operator.

---

## Key Takeaways

1. **Anyone can run a node** by passing remote attestation and staking RLC. No permission needed.

2. **Slashing enforces honesty.** Bad behavior costs real money. The economic incentive is to play by the rules.

3. **Developers can create new primitives.** Custom encrypted operations, deployed permissionlessly, available to all.

4. **The trust chain is verifiable**: open-source code → on-chain code hash → TEE attestation → Proof of Cloud. No "trust me" anywhere.

5. **This is the endgame.** The current MVP is centralized for speed and iteration. The target is a fully permissionless, economically secured network.

---

*This is the final article in the series. Go back to the [index](./README.md) to review all topics.*
