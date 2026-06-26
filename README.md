# Event-Driven, AI-Assisted Claims Platform — Reference Architecture

Reference documents for an **event-driven, AI-assisted claims platform** — a vendor-neutral design built on Kafka event sourcing with an agentic, human-in-the-loop decisioning layer, **demonstrated end-to-end on Life &amp; Disability claims**. It takes a claim from the moment it's filed through review, fraud checks, letters, and payment, with a low-touch "auto-ticket" path for the clean ones. (A life claim is filed by a beneficiary after a death; a disability-income claim by the policyholder — the platform handles both, and that difference shapes much of the design.)

The platform is **agent-assisted and human-in-the-loop by design**: every claim still runs the full deterministic check pipeline, and LLM agent workers — first-class processors alongside decisioning and fraud — read documents, reconcile facts, and draft a recommended decision *with cited detail* for a human to act on. **Today a human is the decision-maker** on every AI-touched claim; as the model proves out, it can graduate to directly deciding the clean ones — a deliberate, governed step. The agents reason on a dedicated `claims.ai.*` stream (derived, the way CQRS read models are derived from the log) while humans keep decision authority — agents reason, humans decide.

🔗 **Live:** https://harshshah85.github.io/insurance-claims-platform/  
🔗 **Portfolio:** https://harshshah85.github.io/about-me/

## Documents

| File | Description |
|------|-------------|
| [Architecture-Diagrams-L1-L2.html](Architecture-Diagrams-L1-L2.html) | L1 System Context + L2 Container diagrams. Includes the policy-admin CDC integration pattern, the 9 bounded contexts, the event-sourced backbone, and a thin-slice-first rollout. |
| [Event-Driven-Decision-Records.html](Event-Driven-Decision-Records.html) | Short decision records — events vs. overwriting rows, services reacting vs. a central coordinator, a durable log vs. a managed streaming service, the message format, and small reversible steps vs. one big transaction for payments. |
| [Event-Streaming-Architecture.html](Event-Streaming-Architecture.html) | The Kafka backbone — 14 core topics, the 36-event domain catalog, Schema Registry + Avro evolution, event sourcing &amp; CQRS, exactly-once semantics, the transactional outbox, dead-letter-queue / retry, and the Kafka Streams / Flink topology. |
| [Claims-Domain-Model.html](Claims-Domain-Model.html) | 9 bounded contexts, 11 aggregates, the 36-event domain catalog, the Life (death) and DI (income) claim lifecycle state machines, party/beneficiary modeling, and CQRS read-model projections. |
| [Claims-Decisioning-and-Fraud.html](Claims-Decisioning-and-Fraud.html) | The STP eligibility score and fraud risk score formulas, the low-touch / auto-ticketing path, decision tiers, rules-then-ML strategy, fraud-unit referral triggers, suppression rules, and sample decision payloads. |
| [AI-Agentic-Decisioning.html](AI-Agentic-Decisioning.html) | The agent-assisted, human-in-the-loop decisioning model — supervisor orchestrator + specialist agents, the skills-vs-tools split, human-in-the-loop gates per tier, escalation/abstention rules, AI governance guardrails, and sample `claims.ai.*` events. Agents reason, humans decide; `claims.ai.*` is a derived advisory stream, so the 9/11/36/14 model holds. |
| [Correspondence-and-Money-Movement.html](Correspondence-and-Money-Movement.html) | Event-driven inbound/outbound correspondence (client, advisor, service reps), the omnichannel preference center, and the money-movement saga — dual control, OFAC, payment holds, tax withholding, idempotent disbursement, treasury reconciliation. |
| [Security-and-Regulatory-Compliance.html](Security-and-Regulatory-Compliance.html) | 7-layer security design plus the Life & Disability regulatory map — UCSPA prompt-pay, contestability, Death Master File / escheatment, ERISA, HIPAA/GLBA, OFAC/AML, SOX over money movement, and the immutable audit model. |
| [Observability-Monitoring.html](Observability-Monitoring.html) | Event-freshness and decisioning SLOs, consumer-lag and dead-letter-queue alerting, money-movement watch metrics, STP-rate / cycle-time business SLOs, P1–P4 alert routing, dashboards per role, and the blameless incident process. |
| [Resilience-and-Disaster-Recovery.html](Resilience-and-Disaster-Recovery.html) | Failure domains and RTO/RPO targets, Kafka multi-zone/region durability, and how an event-sourced platform recovers in-flight work — replay-based read-model rebuilds and a disbursement saga caught mid-flight by a regional failover, kept safe by idempotent commands. |
| [FinOps-Cost-Model.html](FinOps-Cost-Model.html) | Kafka and cloud-infrastructure cost drivers (incl. LLM inference for the assist layer), the cost shape (thin slice vs full platform), where the payback comes from, 8 optimization levers, and cost governance. |
| [Claims-Onboarding-Workflow.html](Claims-Onboarding-Workflow.html) | New product/plan vs. new claim-intake onboarding workflows, automated vs. manual steps, quarantine recovery for unresolved policy numbers, and a later self-service intake vision. |
| [Glossary.html](Glossary.html) | Plain-language definitions of the insurance, event-driven, and AI terms used across these documents — FNOL, STP, DI, SIU, event sourcing, CQRS, saga, outbox, CDC, EOS, HITL, and more. |

## Platform Architecture Overview

**Event-Driven, AI-Assisted Claims Platform** — an event-driven platform that takes a claim from first filing through review, letters, and payment, with a fast automatic path for clean claims and a fraud-investigation path for risky ones. ("First filing" is the insurance term *First Notice of Loss / FNOL*.)

```
Client / Advisor / Service Rep (FNOL) → Intake API → Kafka (event-sourced claim) → STP Decisioning → Decision
Policy Admin System (CDC) ─────────────────────────────────────────────────────────────────────────────↑
                                                              ↓
                          Fraud Scoring → SIU   |   Correspondence Engine → Client/Advisor   |   Payment Saga → Treasury

  agent-assisted (by design):  Kafka (claims.*) → Agent Workers (read · reconcile · draft) → claims.ai.* → human review   [agents reason, humans decide]
```

### Key Design Decisions
- **Store the claim as a list of events**: we keep the ordered list of what happened to a claim instead of a row we overwrite; screens read simple copies built from it. A complete, tamper-evident history comes for free.
- **The policy system stays the source of truth**: we don't own policy data — we read a live feed of changes from the existing policy admin system. A claim that can't be matched to a policy is held for research, not dropped.
- **Auto-ticket the clean claims**: a simple score (the STP score) sorts claims — ≥ 85 fully automatic, 65–84 quick human sign-off, 40–64 full review, &lt; 40 complex / fraud unit. Plain rules first, machine learning later.
- **STP score formula**: `(policy_in_force × 0.25) + (coverage_clear × 0.20) + (doc_completeness × 0.20) + (identity_verified × 0.15) + (fraud_inverse × 0.10) + (amount_in_band × 0.10)`
- **Pay out in small, reversible steps**: paying out spans our platform, treasury, and a bank, so each step is its own tracked stage that can be undone — with two approvers for large payments, sanctions screening, and no chance of paying twice.
- **Agents reason, humans decide**: LLM agent workers — first-class processors — read documents, reconcile facts, and draft a recommended decision with cited rationale and confidence, but a human is the decision-maker on every AI-touched claim today, no denial is ever model-only, and autonomy on clean claims is an earned, governed step. The agents reason on a derived `claims.ai.*` stream; humans keep decision authority.

## Roadmap & Open Questions (// TODO)

This is a reference architecture, not a production system — and the honest gaps are named on purpose. The biggest is **migration**: an enterprise already has a claims system it can't switch off.

- **Migrate the existing book (the big one).** Start from a *strangler* — route every **new** claim to the new platform, leave the old system running its existing book. Deliberately **do not bulk-migrate the back catalog**; closed and historical claims age out and **die in legacy**. The unsolved part is the **work-in-progress claims at cutover**: drain-in-place (let legacy finish what it started) vs. synthetic-replay into the event log. A DI claim can stay open for *years*, so drain-in-place can keep legacy alive far longer than anyone wants.
- **Keep modern and legacy consistent across the seam.** Which system is system-of-record per claim during the dual-run; periodic reconciliation so status and payments never disagree; and the sharp one — **statutory prompt-pay clocks must not pause or reset** because a claim straddles two systems.
- **A read-bridge back to legacy.** "Die in legacy" still needs a door in: a new claim can reference an old one (a disputed prior decision, prior DI history), so un-migrated claims must stay **readable** from the new platform.
- **Govern the AI, not just the architecture.** Formal model-risk review, bias/fairness testing, and compliance sign-off before any claim class graduates from *recommend* to *decide*.
- **Erasure across both systems.** During coexistence a right-to-be-forgotten request must crypto-shred a person in **both** the new platform and legacy.
- **The enterprise tail.** Dual-run cost overlap (funding two systems at once), enterprise SSO + entitlements (adjuster/SIU/treasury, plus scoped service identities for the agent workers), event schema/contract governance, and regulatory + tax reporting that reads as **one book** across both systems for the life of the migration.

---
*Prepared by Harsh Shah — June 2026*
