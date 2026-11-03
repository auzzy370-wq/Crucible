# ADR 001 — Modular Next.js control plane + dedicated execution worker

## Status

Accepted

## Context

ENGINEERING GAUNTLET needs a production-oriented control plane (RBAC, assessments, review) and a hard isolation boundary for untrusted candidate code, including cybersecurity vuln labs.

## Decision

Use Next.js (TypeScript) + Prisma/Postgres for the control plane and UI. Run untrusted jobs through a dedicated worker with pluggable `EXECUTION_MODE` (`process` for local, `docker` for stronger isolation). Keep LLM access behind a provider interface with mock fallback.

## Consequences

- Faster delivery of end-to-end hiring workflows in one deployable app.
- Clear extension points for microVM executors later without rewriting product logic.
- Must not over-claim Docker isolation for hostile production workloads.
