# The Ingestor & NATS Pipeline (ELI5)

> **TL;DR** — The Ingestor watches the blockchain for computation requests and passes them to a message queue (NATS). Think of it as a mailroom clerk who reads the bulletin board, sorts the mail, and drops it on the conveyor belt for the workshop.

---

## The Mailroom Analogy

Imagine a factory where customers leave orders on a public bulletin board (the blockchain). The factory needs to process these orders, but the workshop (Runner) can't watch the board itself — it's too busy building things.

Enter the **mailroom clerk** (the Ingestor):

1. The clerk checks the bulletin board regularly (polls new blocks).
2. They read the new orders (parse NoxCompute events).
3. They sort orders from the same customer together (group events by transaction).
4. They put each sorted bundle on the **conveyor belt** (publish to NATS).
5. They mark which section of the board they last checked (save block number to disk).

The **conveyor belt** (NATS JetStream) delivers the orders reliably to the workshop. If the workshop is busy, orders queue up. Nothing gets lost.

---

## The Ingestor

### What It Does

The Ingestor is a Rust service running inside Intel TDX that bridges on-chain events to off-chain processing.

```
Blockchain blocks
    │
    ▼
┌────────────────────┐
│     INGESTOR       │
│                    │
│  1. Poll blocks    │
│  2. Parse events   │
│  3. Group by tx    │
│  4. Publish        │
│  5. Save progress  │
└────────┬───────────┘
         │
         ▼
    NATS JetStream
```

### Step by Step

**1. Block Polling**

The Ingestor reads new blocks from the blockchain RPC endpoint in batches, at a configurable interval.

```
Last processed: block 1000
New blocks: 1001, 1002, 1003
→ Fetch all three, process events from each
```

**2. Event Parsing**

It filters for events emitted by the NoxCompute contract — additions, subtractions, transfers, etc. Each event is parsed into a strongly-typed Rust struct using Alloy's `sol!` macro (compile-time type safety).

**3. Transaction Grouping**

Events from the same transaction are bundled into a single `TransactionMessage`, ordered by `log_index`. This preserves the execution order from the original smart contract call.

```
Block 1001, Tx 0xABC:
  Event #0: fromExternal(handle_100, proof)
  Event #1: add(balance, handle_100) → newBalance

→ One TransactionMessage with 2 ordered events
```

**4. Message Publishing**

Each `TransactionMessage` is published to NATS JetStream with a **content-based message ID** (a checksum). This is key for deduplication.

**5. State Persistence**

The last processed block number is saved to disk. If the Ingestor restarts, it resumes from exactly where it left off — no gaps, no double-processing.

---

## NATS JetStream

### What It Is

NATS JetStream is a **message queue** — a reliable delivery system between the Ingestor (producer) and the Runner (consumer).

### Why a Message Queue?

Without NATS, the Ingestor and Runner would need to communicate directly. That creates problems:

| Problem | Without NATS | With NATS |
|---|---|---|
| Runner is busy | Ingestor blocks, falls behind on-chain | Messages queue up, Ingestor keeps polling |
| Runner crashes | Events are lost | Messages persist in queue, re-delivered when Runner restarts |
| Multiple Runners | Complex coordination needed | NATS ensures each message is processed exactly once |
| Spike in events | Runner overwhelmed | Queue absorbs the spike, Runner processes at its own pace |

### Key Properties

**At-least-once delivery**: Every message is guaranteed to be delivered. If the Runner doesn't acknowledge, NATS retries.

**Deduplication**: Messages have content-based IDs. If the Ingestor restarts and re-publishes the same events, NATS detects duplicates and ignores them.

**Ordered delivery**: Messages within a stream are delivered in order, preserving the original blockchain execution sequence.

**Acknowledgment**: The Runner explicitly acknowledges each message after successful processing. Only then does NATS remove it from the queue.

---

## Design Decisions

### Optimistic Processing

The Ingestor processes blocks **immediately** when they appear, without waiting for confirmations:

```
Normal flow:
  Block 1001 appears → process immediately → 100ms latency

Conservative flow (NOT what Nox does):
  Block 1001 appears → wait 12 confirmations → process → ~3min latency
```

**What about block reorgs?** If a block is reorganized (replaced by a different block at the same height), the Ingestor detects this and the corresponding handle is removed. This is rare on Arbitrum and the trade-off (low latency vs. rare reorg handling) is worth it.

### Horizontal Scalability

Multiple Ingestor instances can run simultaneously for redundancy:

```
┌────────────┐
│ Ingestor A │──┐
└────────────┘  │
                ├──> NATS JetStream ──> Runner
┌────────────┐  │    (deduplicates)
│ Ingestor B │──┘
└────────────┘
```

Both might publish the same events, but NATS deduplication ensures each event is processed only once. If Ingestor A goes down, Ingestor B keeps the pipeline running.

---

## The Full Pipeline

```
Blockchain
    │
    │  blocks (polling)
    ▼
Ingestor (TDX)
    │
    │  TransactionMessage (JSON)
    ▼
NATS JetStream
    │
    │  pull (on demand)
    ▼
Runner (TDX)
    │
    │  encrypted results
    ▼
Handle Gateway (TDX)
```

This is a **pull-based** architecture. The Runner pulls messages when it's ready, rather than being pushed messages it might not be able to handle. This naturally prevents overload.

---

## Key Takeaways

1. **The Ingestor bridges on-chain to off-chain.** It watches the blockchain, parses events, and feeds them to NATS.

2. **NATS JetStream is the reliable conveyor belt.** It queues messages, handles retries, prevents duplicates, and ensures ordered delivery.

3. **Optimistic processing** means low latency — blocks are handled immediately, not after waiting for confirmations.

4. **Deduplication** prevents double-processing. Content-based message IDs mean restarting the Ingestor is safe.

5. **The pipeline is horizontally scalable.** Multiple Ingestors can run for redundancy; NATS handles deduplication automatically.

---

*Next in the series: [18 — The Runner](./18-the-runner.md)*
