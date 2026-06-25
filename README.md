# Event-Driven, AI-Assisted Claims Platform — Reference Architecture

Reference documents for an **event-driven, AI-assisted claims platform** — a vendor-neutral design built on Kafka event sourcing with an agentic, human-in-the-loop decisioning layer, **demonstrated end-to-end on Life &amp; Disability claims**. It takes a claim from the moment it's filed through review, fraud checks, letters, and payment, with a low-touch "auto-ticket" path for the clean ones. (A life claim is filed by a beneficiary after a death; a disability-income claim by the policyholder — the platform handles both, and that difference shapes much of the design.)

The platform is **agent-assisted and human-in-the-loop by design**: every claim still runs the full deterministic check pipeline, and LLM agent workers — first-class processors alongside decisioning and fraud — read documents, reconcile facts, and draft a recommended decision *with cited detail* for a human to act on. **Today a human is the decision-maker** on every AI-touched claim; as the model proves out, it can graduate to directly deciding the clean ones — a deliberate, governed step. The agents reason on a dedicated `claims.ai.*` stream (derived, the way CQRS read models are derived from the log) while humans keep decision authority — agents reason, humans decide.

🔗 **Live:** https://harshshah85.github.io/insurance-claims-platform/  
🔗 **Portfolio:** https://harshshah85.github.io/about-me/

## Documents

| File | Description |
|------|-------------|
| [Architecture-Diagrams-L1-L2.html](Architecture-Diagrams-L1-L2.html) | L1 System Context + L2 Container diagrams. Includes the policy-admin CDC integration pattern, the 9 bounded contexts, the event-sourced backbone, and a thin-slice-first rollout. |
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
| [Event-Driven-Decision-Records.html](Event-Driven-Decision-Records.html) | Short decision records — events vs. overwriting rows, services reacting vs. a central coordinator, a durable log vs. a managed streaming service, the message format, and small reversible steps vs. one big transaction for payments. |
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

---
*Prepared by Harsh Shah — June 2026*
