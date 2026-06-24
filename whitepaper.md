# Event-Driven, AI-Assisted Claims Platform
### A reference architecture for Life & Disability claims — and how to add AI without losing the audit trail

> **How to use this file**
> - **Hero image:** upload `hero-image.png` (1200×627) as the LinkedIn article cover.
> - **Article body:** paste everything below the line "ARTICLE" into LinkedIn's article editor.
> - **Teaser post:** use the short "LINKEDIN POST" block to share the article.
> - Live reference architecture: **https://harshshah85.github.io/insurance-claims-platform/**

---

## LINKEDIN POST (the share that links the article)

Most "AI in claims" stories bolt a model onto a system that overwrites its own history — then can't explain a denial six months later.

I built a vendor-neutral **reference architecture** for a Life & Disability claims platform that does it the other way around: the **event log is the system of record**, and AI is a **first-class but advisory** layer. Agents reason; people decide.

It's fully documented and live — 12 reference docs covering the event backbone, the agentic decisioning layer, security & regulation, money movement, resilience, and the cost model. The white paper below is the 10-minute version.

🔗 Live architecture + docs: https://harshshah85.github.io/insurance-claims-platform/

#EventDriven #Kafka #SoftwareArchitecture #InsurTech #AI #EventSourcing

---

# ARTICLE

![Event-Driven, AI-Assisted Claims Platform](hero-image.png)

## The problem nobody wants to own

A claims platform has a hard job and an unforgiving audience. It moves money to people on the worst day of their lives, using their most sensitive data, under rules that vary by state and carry interest penalties for being late. And it has to do two genuinely different jobs at once:

- A **life (death) claim** is filed by a *beneficiary* — often a grieving stranger to your systems who may not even know the policy number. It pays once, and the hard part is the front door: proving who they are, who's entitled, that the death happened, and which policy it maps to.
- A **disability-income claim** is filed by the *policyholder* — an existing, authenticated customer. It pays a recurring benefit, and the hard part is the long tail: recertification, return-to-work, income offsets, month after month.

Most modernization efforts take a familiar shape: a CRUD system that overwrites rows, a bolted-on audit table that drifts from the truth, and — lately — an AI model wired on top that can produce an answer but not a defensible *reason*. That works in a demo and fails in a market-conduct exam.

This is a reference architecture for doing it the other way around.

## The core idea: the event is the record

Store each claim as the **ordered list of events that happened to it** — notified, policy resolved, requirement satisfied, scored, decided, paid — and make that log the system of record. Everything else (screens, dashboards, search) is a **projection** built by replaying the log. This is event sourcing with CQRS, on Apache Kafka.

Two payoffs fall out immediately:

1. **A complete, tamper-evident history for free.** When an examiner asks "show me every action on this claim, in order, and who took it," the answer *is* the log — with approver identities and causation links, not a reconstruction from scattered tables.
2. **Disposable read models.** A projection bug is fixed by redeploying the projector and replaying — never by patching production rows. A view can be dropped and rebuilt from offset zero.

On top of the backbone sit the things that make it a *claims* platform: a **straight-through-processing (STP) score** that auto-tickets clean, low-risk claims with no human; a separate **fraud score** that acts as a hard gate (a suspicious claim never auto-pays, however clean it looks); and a **saga** for money movement — small, individually reversible steps with compensation, because a disbursement spans your platform, a treasury system, and a bank, and no single transaction can or should span all three.

## Adding AI without giving away the store

Here's where most designs get the governance backwards. The temptation is to let the model decide. The discipline is to let it **reason** and keep people **deciding**.

In this architecture, the AI is a **third decision layer** on top of the existing two (deterministic guardrails, then rules-and-ML scoring). A supervisor orchestrator fans out to specialist LLM agents — intake & triage, document intelligence, policy & coverage, decisioning, a fraud copilot, correspondence — each scoped to a bounded context it already serves. They read documents, reconcile facts across them, and draft a **decision packet**: a recommendation with cited evidence, per-factor reasoning, and a confidence score.

Crucially, the agents are **advisory by design**:

- Every claim still runs the **full deterministic check pipeline**. AI skips nothing.
- AI produces **proposed findings, not authority**. A person reviews and approves on the assisted path; the clean auto-ticket lane stays rule-decided.
- **No denial is ever model-only** — it cites a coded reason mapped to a policy provision and is signed by a human.
- Every AI output is itself an event on a derived `claims.ai.*` stream, carrying the model version, the inputs it saw, and its confidence — so "what did the AI suggest, and did a human decide?" is answerable for any claim, forever.

And because the agents reason off the *committed* log without mutating it, a slow or failed model degrades adjudicator assist — it can never corrupt or block a claim's authoritative history.

**Does it get smarter? Yes — through a flywheel, not a leap.** Every human decision is also a label. Confirmations and corrections land next to the agent's recommendation, becoming the training set for the next model and the evaluation set for the next agent version — gated by an offline "golden set" and rolled out shadow → canary → full. But more labels make the *recommendations* sharper; they do not quietly grant the model *authority*. Moving a claim class from "recommend" to "decide" is a deliberate, governed, one-directional step — earned against human reviewers, never an automatic consequence of a good score.

## The three problems that separate a real design from a slide

Anyone can draw boxes and arrows. The credibility is in the parts most reference architectures quietly skip.

**1. Don't compact your system of record.** Kafka's log compaction keeps only the latest value per key — perfect for a *latest-state* topic like a policy snapshot, and quietly fatal for an *event log*, because it discards exactly the history event sourcing depends on. The fix is a discipline: the event-sourced log and the fact/audit streams use long retention on tiered storage and are **never compacted**; compaction is reserved for latest-state topics. (Easy to get wrong — I caught this exact contradiction in my own first draft.)

**2. The right to be forgotten, on an immutable log.** Privacy law says a person can ask to be erased. Event sourcing says the log is append-only and never deleted. These look irreconcilable — until you stop trying to erase the *log*. With **crypto-shredding**, each subject's personal data is encrypted under a per-subject key; to honor an erasure request you **destroy the key**. The events stay exactly where they are — same offsets, same hash chain, same audit guarantees — but the personal data inside them becomes unrecoverable ciphertext. You satisfy erasure *and* keep a tamper-evident record, because erasure acts on the key, never on the log.

**3. Recovering an in-flight payment.** A region fails over while a disbursement is half-done. Because the saga's state is itself a stream of events, recovery is deterministic: the orchestrator rehydrates each in-flight payment by replaying its events and resumes exactly where it stopped. Idempotency keys make a retried step a no-op at the bank rail — so a payment can never go out twice. The same three properties that make the platform auditable (state in the log, recovery by replay, idempotent effects) are what make it recoverable. That's not luck; it's the architecture paying a second dividend.

## Why it pays for itself

The business case is not exotic. It compounds:

- **Auto-ticket deflection** — clean claims handled with little or no manual adjudication; the biggest lever, and it widens as the low-touch path matures.
- **Faster cycle time** — visible immediately, even before any automation, and it directly reduces statutory prompt-pay interest.
- **Less leakage** — more fraud caught via scoring and investigations routing; offsets and return-to-work applied on DI before you overpay.
- **Defensibility** — every decision, human or automated, is explainable and auditable. That is worth more than it looks the first time a regulator asks.

The honest headline from the cost model: at realistic volumes, **infrastructure isn't the expensive part — the build is.** The Kafka run-rate is modest next to the engineering effort, which means cost control is mostly scope discipline: ship a thin, end-to-end slice (one claim type, front door to payment), prove cycle time on real claims, and let the case for going further make itself.

## What this is

It's a **vendor-neutral reference architecture** — open patterns only (event sourcing, CQRS, saga, outbox, change-data-capture, Avro with a schema registry), no product logos, with Life & Disability as the worked example because the domain's specifics (contestability, beneficiary identity, recertification, regulated money movement) are what make the design concrete rather than abstract.

It's fully written up and live: L1/L2 diagrams, the event-streaming backbone, the domain model, decisioning & fraud, the AI-assisted layer, security & regulatory compliance, correspondence & money movement, observability, resilience & disaster recovery, the FinOps cost model, the architecture decision records, and a glossary.

**Read the whole thing:** https://harshshah85.github.io/insurance-claims-platform/

---

*I'm Harsh Shah. I design event-driven and AI-assisted platforms for regulated domains. This reference architecture is a personal, self-directed build — I'd genuinely welcome critique from people who've shipped claims, payments, or event-sourced systems at scale. What would you challenge?*
