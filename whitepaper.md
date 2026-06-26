# AI Should Reason. Humans Should Decide.
### A reference architecture for insurance claims — where the event log is the source of truth, and the AI never gets the keys

> **How to use this file**
> - **Hero image:** upload `hero-image.png` (1200×627) as the LinkedIn article cover.
> - **Title:** *AI Should Reason. Humans Should Decide.*
> - **Article body:** paste everything below the "ARTICLE" line into LinkedIn's article editor.
> - **Teaser post:** use the short "LINKEDIN POST" block to share it.
> - Live reference architecture: **https://harshshah85.github.io/insurance-claims-platform/**
> - More of my work: **https://harshshah85.github.io/about-me/**

---

## LINKEDIN POST (the share that links the article)

A lot of "AI in claims" projects bolt a model onto a system that overwrites its own history. Then, six months later, nobody can explain a denial.

So I built the opposite. It's a vendor-neutral reference architecture for a Life & Disability claims platform where the event log is the system of record, and the AI is an advisory layer sitting on top. The agents do the reading and reasoning. Humans make the call.

It's fully written up and live — 13 docs covering the event backbone, the agentic decisioning layer, security and regulation, money movement, resilience, and the cost model. The white paper below is the short version.

🔗 https://harshshah85.github.io/insurance-claims-platform/

#EventDriven #Kafka #SoftwareArchitecture #InsurTech #AI #EventSourcing

---

# ARTICLE

![AI Should Reason. Humans Should Decide.](hero-image.png)

Claims is the hardest kind of software, because it isn't really software. It's money — moving to people on the worst day of their lives. It's also where your reputation is built, or quietly lost.

And it's two jobs wearing one name. A death claim comes from a grieving beneficiary who may not even know the policy number; you pay once, and the hard part is the front door. A disability claim comes from a known customer; you pay every month, for years — and the hard part never ends.

Most "modernization" bolts an AI onto a system that overwrites its own history. It demos beautifully. Then, six months later, a regulator asks why a claim was denied — and nobody can answer.

So I built the opposite.

## Make the event the record

One decision changes everything: store each claim as the ordered list of things that happened to it — notified, resolved, decided, paid — and treat that list as the truth. Every screen is just a replay of it. Event sourcing, on Kafka.

Two payoffs follow immediately. You get a complete, tamper-evident history — when a regulator asks who did what, in order, the log is the answer, not a forensic project. And your screens become disposable: a bug in a view isn't a data-fix emergency, it's a redeploy and a replay.

## Add AI without handing over the keys

Everyone's instinct is to let the model decide. The discipline is to let it reason, and keep humans deciding.

So the AI is an advisor, never a judge. Agents read the documents, reconcile the facts, and hand a person a decision packet — recommendation, evidence, confidence. What they can't do is the whole point: they can't skip a check, can't move money, and can't deny a claim on their own. Every suggestion is itself a logged event. So in an audit you can always answer the only question that matters — what did the AI say, and who actually decided?

It gets sharper over time, because every human decision is a label. But more data makes it smarter, never more powerful. Handing a model real authority stays a deliberate, governed choice — never something that happens because a metric looked good.

## The parts most diagrams skip

The credibility lives in the unglamorous corners. Never compact your event log — compaction quietly throws away the very history you built it to keep (I got this wrong in my own first draft, and caught it on review). Honor "delete me" on a log you never delete from by crypto-shredding: destroy the person's key, not the events. Recover a half-finished payment by replaying the saga, with idempotency keys so no one is ever paid twice. The trick that makes it auditable is the same one that makes it recoverable.

And it pays for itself the boring way: auto-ticket the clean claims, cut the cycle time (and the late-payment interest with it), catch more fraud, and stay explainable — worth nothing until the first regulator asks, and everything after that.

## The part I haven't solved

Greenfield is easy. Real life is: you already have a claims system full of real claims, and you can't switch it off. I'd strangle it — new claims to the new platform, and let the old closed ones quietly die in legacy. But the honest //TODO is the claims caught mid-flight: a disability claim can stay open for years, so "let the old system finish" can mean keeping it alive long after you wanted it gone. And while both run, which one is the truth — and how do you stop a statutory clock from resetting just because a claim straddles two systems? I don't have a clean answer yet. Naming it is the point.

It's a vendor-neutral reference architecture — open patterns, no logos — fully written up and live. I'd genuinely love to hear where people who've shipped claims or payments at scale would push back. What would you change?

The whole thing is here: https://harshshah85.github.io/insurance-claims-platform/

---

*I'm [Harsh Shah](https://harshshah85.github.io/about-me/). I design event-driven and AI-assisted platforms for regulated domains. This one is a personal build, done on my own time.*

#EventDriven #EventSourcing #Kafka #SoftwareArchitecture #SolutionsArchitecture #InsurTech #AgenticAI #AI #CQRS #RegTech
