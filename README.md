# Life &amp; DI Claims Platform — Event-Driven Reference Architecture

Architecture and domain-modeling reference documents for a **Kafka event-driven Life &amp; Disability Income (DI) claims platform**. Vendor-neutral reference design — event sourcing + CQRS, straight-through low-touch adjudication, fraud scoring, omnichannel correspondence, and controlled money movement.

🔗 **Live:** https://harshshah85.github.io/insurance-claims-platform/

## Documents

| File | Description |
|------|-------------|
| [Architecture-Diagrams-L1-L2.html](Architecture-Diagrams-L1-L2.html) | L1 System Context + L2 Container diagrams. Includes the policy-admin CDC integration pattern, the 9 bounded contexts, the event-sourced backbone, and the 3-year roadmap. |
| [Event-Streaming-Architecture.html](Event-Streaming-Architecture.html) | The Kafka backbone — 14 core topics, the 36-event domain catalog, Schema Registry + Avro evolution, event sourcing &amp; CQRS, exactly-once semantics, the transactional outbox, DLQ/retry, and the Kafka Streams / Flink topology. |
| [Claims-Domain-Model.html](Claims-Domain-Model.html) | 9 bounded contexts, 11 aggregates, the 36-event domain catalog, the Life (death) and DI (income) claim lifecycle state machines, party/beneficiary modeling, and CQRS read-model projections. |
| [Claims-Decisioning-and-Fraud.html](Claims-Decisioning-and-Fraud.html) | The STP eligibility score and fraud risk score formulas, the low-touch / auto-ticketing path, decision tiers, rules-then-ML strategy, SIU referral triggers, suppression rules, and sample decision payloads. |
| [Correspondence-and-Money-Movement.html](Correspondence-and-Money-Movement.html) | Event-driven inbound/outbound correspondence (client, advisor, service reps), the omnichannel preference center, and the money-movement saga — dual control, OFAC, payment holds, tax withholding, idempotent disbursement, treasury reconciliation. |
| [Security-and-Regulatory-Compliance.html](Security-and-Regulatory-Compliance.html) | 7-layer security design plus the Life/DI regulatory map — UCSPA prompt-pay, contestability, DMF/escheatment, ERISA, HIPAA/GLBA, OFAC/AML, SOX over money movement, and the immutable audit model. |
| [Observability-Monitoring.html](Observability-Monitoring.html) | Event-freshness and decisioning SLOs, consumer-lag and DLQ alerting, money-movement watch metrics, STP-rate / cycle-time business SLOs, P1–P4 alert routing, dashboards per role, and the blameless incident process. |
| [FinOps-Cost-Model.html](FinOps-Cost-Model.html) | Confluent / MSK and AWS cost components, phase cost estimates (Year 1–3), the ROI framework driven by STP automation and cycle-time reduction, 7 optimization levers, and cost governance. |
| [Claims-Onboarding-Workflow.html](Claims-Onboarding-Workflow.html) | New product/plan vs. new claim-intake onboarding workflows, automated vs. manual steps, quarantine recovery for unresolved policy numbers, and the Year 3 self-service FNOL vision. |
| [Event-Driven-Decision-Records.html](Event-Driven-Decision-Records.html) | Architecture Decision Records — event sourcing vs. CRUD, choreography vs. orchestration, Kafka vs. Kinesis vs. EventBridge, Avro vs. Protobuf, saga vs. 2PC for money movement, with a decision matrix per ADR. |

## Platform Architecture Overview

**Life &amp; DI Claims Platform** — an event-driven platform that takes a claim from First Notice of Loss (FNOL) through adjudication, correspondence, and disbursement, with a low-touch straight-through path for clean claims and an SIU path for high-risk ones.

```
Client / Advisor / Service Rep (FNOL) → Intake API → Kafka (event-sourced claim) → STP Decisioning → Decision
Policy Admin System (CDC) ─────────────────────────────────────────────────────────────────────────────↑
                                                              ↓
                          Fraud Scoring → SIU   |   Correspondence Engine → Client/Advisor   |   Payment Saga → Treasury
```

### Key Design Decisions
- **Event sourcing as system of record**: the ordered event log is the source of truth; read models are CQRS projections rebuilt from it — a natural regulatory audit trail.
- **Policy Admin stays the golden record**: in-force status, coverage and contestability dates flow in via Kafka Connect CDC (`policy.snapshot.v1`); FNOL with unresolved policy numbers is quarantined.
- **Low-touch path via STP score**: STP ≥ 85 auto-adjudicates and auto-tickets; 65–84 assisted; 40–64 standard; &lt; 40 complex / SIU. Rules first, ML in Year 3.
- **STP eligibility formula**: `(policy_in_force × 0.25) + (coverage_clear × 0.20) + (doc_completeness × 0.20) + (identity_verified × 0.15) + (fraud_inverse × 0.10) + (amount_in_band × 0.10)`
- **Money movement as a saga, never 2PC**: choreographed disbursement with compensation, dual-control approval, OFAC screening, idempotent payment commands, treasury reconciliation.

---
*Prepared by Harsh Shah — June 2026*
