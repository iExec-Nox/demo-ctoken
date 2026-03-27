# Remote Attestation & Proof of Cloud (ELI5)

> **TL;DR** — Remote attestation is how you verify that a TEE is genuine and running the right code, without trusting anyone's word. Proof of Cloud goes further: it binds the workload to a specific physical machine, so the operator can't secretly move it somewhere unsafe. Together, they turn "trust me" into "verify me."

---

## The Restaurant Health Inspection Analogy

You're about to eat at a new restaurant. How do you know the kitchen is clean?

| Approach | Equivalent |
|---|---|
| **Trust the owner** — "Our kitchen is spotless, I promise!" | Trusting the TEE operator's word. No guarantee. |
| **Read the reviews** — Other people said it was fine | Reputation-based trust. Better, but reviewers could be wrong or paid. |
| **Check the health certificate on the wall** — A government inspector verified it | **Remote attestation.** A trusted third party (Intel) cryptographically certifies what's running. |
| **The certificate also says which building, which address** — Not just "a kitchen", but *this specific kitchen* | **Proof of Cloud.** The attestation is bound to a specific physical machine. |

You don't need to trust the restaurant owner. You verify the certificate and confirm it matches what the inspector checked.

---

## Remote Attestation — How It Works

### The Problem

The Nox Runner, KMS, and Handle Gateway all run inside Intel TDX enclaves. But how do you know:

1. That it's a **real** TEE and not a regular server pretending to be one?
2. That the code inside is the **correct, unmodified** Nox code?
3. That nobody **tampered** with it after deployment?

### The Solution: Hardware-Backed Proof

When a TEE starts up, the CPU itself generates an **attestation report**. Here's the process:

```
Step 1: Measure
  The CPU hashes everything loaded into the TEE:
  - The application code (Runner, KMS, etc.)
  - The configuration
  - The initial state
  This hash is called the "measurement" — a unique fingerprint.

Step 2: Sign
  The CPU signs the measurement with a key that is:
  - Burned into the hardware at the factory by Intel
  - Impossible to extract or forge
  - Verifiable against Intel's public certificate chain

Step 3: Report
  The attestation report contains:
  ┌────────────────────────────────────────┐
  │  • Code measurement (hash)             │
  │  • Hardware identity (CPU model, etc.) │
  │  • TEE type (Intel TDX)                │
  │  • Timestamp                           │
  │  • CPU signature (unforgeable)         │
  └────────────────────────────────────────┘
```

### Verification

Anyone can verify an attestation report:

```
Verifier:
  1. Get the attestation report from the TEE
  2. Check the CPU signature against Intel's public certificate chain
     → Confirms: this is a real Intel TDX enclave
  3. Compare the code measurement to the expected hash
     → Confirms: the correct, unmodified code is running
  4. If both pass → the TEE is genuine and trustworthy ✓
```

**No trust in the operator needed.** The CPU hardware and Intel's certificate chain are the trust anchors.

---

## How Nox Uses Remote Attestation

### On-Chain Registry

Nox publishes the expected code measurements in a **smart contract on-chain**:

```
On-chain Registry:
  Runner code hash:          0xABC123...
  KMS code hash:             0xDEF456...
  Handle Gateway code hash:  0x789ABC...
```

This means anyone can:

1. Ask a Nox component for its attestation report
2. Verify the CPU signature (Intel certificate chain)
3. Compare the measurement hash against the on-chain registry
4. Confirm the component is running the exact expected code

### RA-HTTPS (Attestation-Verified HTTPS)

Nox components use **RA-HTTPS** — HTTPS connections where the TLS certificate is bound to the attestation report. This means:

```
Your browser connects to Handle Gateway via HTTPS
  │
  ├── TLS certificate is issued by the TEE itself
  │   └── The certificate contains the attestation report
  │
  ├── Your browser (via the SDK) verifies:
  │   1. The TLS cert is valid
  │   2. The attestation report is signed by Intel hardware
  │   3. The code hash matches the on-chain registry
  │
  └── Now you know: the connection goes directly into the TEE
      No middleman can intercept or modify the data
```

Regular HTTPS proves "you're talking to this server." RA-HTTPS proves "you're talking to this exact code, running inside a real TEE, on verified hardware."

---

## Proof of Cloud — Pinning to Physical Machines

### The Problem Attestation Alone Doesn't Solve

Remote attestation proves the code is correct and running in a TEE. But what if the operator:

1. Runs the TEE on a compliant machine in Europe
2. Gets the attestation report (looks good!)
3. Secretly moves the workload to a non-compliant machine in a jurisdiction with weaker data laws

The attestation report says "this code is running in a TEE" — but doesn't say *where*.

### The Solution

**Proof of Cloud** binds the workload to a specific physical machine:

| Property | What it proves |
|---|---|
| **Machine identity** | This workload is running on *this specific* CPU, with *this serial number* |
| **Location binding** | The operator declared the machine is in data center X — the attestation confirms the hardware matches |
| **Migration detection** | If the workload moves to a different machine, the hardware identity changes — the attestation report no longer matches |

### Why This Matters

For a DeFi protocol handling encrypted financial data:

- **Regulatory compliance** — Some jurisdictions require data to be processed in specific regions (e.g., EU data stays in EU). Proof of Cloud provides evidence.
- **Operator accountability** — The operator can't secretly move the workload to cheaper (potentially compromised) hardware.
- **No silent substitution** — If the hardware changes, the attestation breaks. Detectable and auditable.

---

## What Each Layer Proves

Think of it as stacking guarantees:

```
Layer 1: TEE (Intel TDX)
  └── "Data is processed in hardware-isolated memory"

Layer 2: Remote Attestation
  └── "The code running in the TEE is the correct, unmodified code"

Layer 3: On-Chain Registry
  └── "The expected code hash is publicly verifiable by anyone"

Layer 4: Proof of Cloud
  └── "The TEE is running on this specific physical machine"

Layer 5: RA-HTTPS
  └── "Your network connection terminates inside the TEE, not at a proxy"
```

Each layer blocks a different attack:

| Attack | Blocked by |
|---|---|
| Operator reads memory | TEE hardware isolation |
| Operator swaps in malicious code | Remote attestation + on-chain registry |
| Operator fakes being a TEE | Intel CPU signature (hardware root of trust) |
| Operator moves workload to weak hardware | Proof of Cloud |
| Man-in-the-middle intercepts data | RA-HTTPS |

---

## A Real-World Analogy: The Sealed Voting Machine

Imagine an election where you want to guarantee votes are counted correctly:

1. **The machine is sealed** (TEE) — Nobody can open it or see the votes while counting.
2. **An inspector certifies the software** (Remote Attestation) — Before the election, the code is verified and a certificate is issued.
3. **The certificate is posted publicly** (On-Chain Registry) — Anyone can check what software the machine should be running.
4. **The machine has a GPS tracker** (Proof of Cloud) — You know it hasn't been moved from the polling station.
5. **Voters insert ballots through a tamper-proof slot** (RA-HTTPS) — Nobody can swap ballots between the voter and the machine.

You don't need to trust the election officials. You verify the machine, the software, and the location.

---

## Key Takeaways

1. **Remote attestation is hardware-backed proof** that a TEE is genuine and running the correct code. The CPU itself signs the report — unforgeable by software.

2. **The on-chain registry** makes verification trustless. Anyone can compare a TEE's measurement against the expected hash stored in a public smart contract.

3. **RA-HTTPS** binds the network connection to the TEE. You know your data goes directly into the enclave, not to a proxy or middleman.

4. **Proof of Cloud** pins the workload to a physical machine. The operator can't silently relocate it to weaker or non-compliant hardware.

5. **Together, these layers eliminate trust in operators.** You trust Intel's hardware, the on-chain registry, and cryptographic verification — not promises.

---

*Next in the series: [23 — EIP-712 Signatures in Nox](./23-eip712-in-nox.md)*
