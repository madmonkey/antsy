# Antsy Tek Constitution

## Core Principles

### I. Small, Purposeful Changes
Every change MUST have a defined user or operational purpose and modify only the files necessary
to achieve it. New abstractions, dependencies, and configuration MUST be justified by the current
requirement; speculative work is prohibited. This keeps the codebase understandable and limits
regression risk.

### II. Correctness Is Verified
Changes that alter executable behavior MUST include or update automated tests at the appropriate
level. A change MUST pass the smallest relevant test, lint, type-check, or build command before
it is considered complete. Defects MUST be reproduced by a test where practical so that the fix
remains protected.

### III. Explicit Contracts and Failures
Public interfaces, persisted data, and external integrations MUST define valid inputs, outputs,
and failure behavior. Invalid input and unexpected failures MUST be surfaced through the
project's established error-handling mechanism; silent fallbacks and success-shaped failures are
prohibited. This preserves debuggability and prevents consumers from acting on false results.

### IV. Secure Defaults and Data Protection
Code MUST validate untrusted input at trust boundaries, use least-privilege access, and avoid
logging secrets or sensitive data. Dependencies and integrations MUST use supported, secure
configuration by default. Security-impacting exceptions require documented rationale and review
before release.

### V. Maintainable, Observable Delivery
Production-relevant behavior MUST provide actionable diagnostics through the project's logging,
metrics, or tracing conventions without exposing sensitive data. Code MUST favor clear,
well-named, conventional structures over cleverness. Operational changes MUST document any
required configuration, migration, or rollback procedure.

### VI. Ponytail: The Smallest Complete Change (Required Skill)
All agents MUST load and follow the `ponytail` skill (`.github/skills/ponytail/SKILL.md`,
source: https://github.com/DietrichGebert/ponytail) before any coding task (writing, fixing,
refactoring, reviewing, choosing dependencies), at the default `full` level unless the user
sets another. Companion skills `ponytail-review` (diff review), `ponytail-audit` (repo audit),
`ponytail-debt`, `ponytail-gain`, and `ponytail-help` live beside it; agents SHOULD use
`ponytail-review` when reviewing changes for Development Workflow compliance. It is a required skill and MUST NOT be skipped, including when running speckit
skills such as plan, tasks, and implement. The skill's rules, summarized:
Before writing code, read the code the change touches and list every place it must reach
(callers, tests, fixtures, config, exports). Then take the first option that fully works:
1. Skip it if it need not exist; name skipped extras in one line.
2. Reuse what is already in this codebase, the way surrounding code does.
3. Use the standard library or a platform feature, unless the project has its own.
4. Use an installed dependency; never add one for a few lines.
5. Use one line a reader gets at a glance.
6. Otherwise, write the minimum code that works.

Agents MUST NOT add abstractions, wrappers, options, config, or "for later" code nobody asked
for. Bug fixes MUST grep every caller and fix the root cause once in shared code. Moved or merged
code MUST keep its error handling and validation. New non-trivial logic (branch, loop, parser,
money, security) MUST ship with one small test. A deliberate shortcut MUST carry a comment
`shortcut: <the limit>, <when to upgrade>`. Every agent reply MUST end with one or two lines on
what was skipped or not checked and any risk. Ponytail never overrides Principles II-IV:
validation at trust boundaries, data-loss error handling, security, and accessibility are never cut.

## Engineering Constraints

The project MUST use pinned or otherwise reproducible dependency resolution appropriate to its
ecosystem. New dependencies require a demonstrated need, supported maintenance status, and
license compatibility. Backward-incompatible changes to public contracts require a migration
path and release-note entry before they are merged.

## Development Workflow

Work MUST begin with a documented requirement or issue sufficient to define intended behavior.
Implementations MUST be reviewed for principle compliance, testing, error handling, security
impact, and operational impact. Reviewers MUST reject changes that lack required validation or
expand scope without an approved requirement. Documentation affected by a change MUST be updated
in the same change set.

## Governance

This constitution supersedes conflicting project practices. Amendments MUST identify the affected
principles, explain the rationale, update the version according to the policy below, and receive
the same review as code changes. Compliance MUST be evaluated during planning, implementation,
and code review; exceptions require a written, time-bounded justification.

Versioning follows semantic intent: MAJOR for removals or incompatible redefinitions of
governance; MINOR for new principles, sections, or materially expanded requirements; and PATCH
for clarifications, wording, and other non-semantic refinements. The ratification date records
the first approved adoption and remains unchanged by later amendments. This document's temporary
Sync Impact Report MUST be removed before committing an amendment.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown |
**Last Amended**: 2026-10-11
