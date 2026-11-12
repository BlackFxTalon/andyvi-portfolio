# Design

## Context

The Astro project has existing uncommitted changes. Requirements are in docs/portfolio-development-plan.md.

## Goals / Non-Goals

**Goals:** Implement the plan in priority order, preserve existing work, and verify each change.

**Non-Goals:** Deploy, publish private materials, or invent roles and results.

## Decisions

- Reuse existing components and the server-side contact form.
- Use responsive flow instead of clipping content.
- Publish detailed cases only with permitted material and confirmed contributions.

## Risks / Trade-offs

- Unknown recipient configuration: verify delivery in an agreed test environment.
- NDA and unconfirmed contributions: defer details until confirmed.
- Existing work in progress: preserve it when modifying affected files.

## Migration Plan

Implement independent blocks; deployment and rollback are separate.

