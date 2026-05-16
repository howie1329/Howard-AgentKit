# Security Checklist

## Purpose

Use this checklist before and during changes that touch authentication, authorization, secrets, user data, dependencies, network boundaries, logging, or data persistence.

Security-sensitive changes should be explicit, reviewed carefully, and verified with relevant tests or manual checks.

## Ask Before Changing

Ask for approval before:

- changing authentication or authorization behavior
- adding permissions, roles, scopes, or bypasses
- changing data retention, deletion, export, or privacy behavior
- adding a new dependency for security-sensitive code
- modifying secrets management or environment variable handling
- weakening validation, rate limits, CSP, CORS, CSRF, or other protections
- running migrations that could expose, destroy, or transform sensitive data

## Secrets

- Never commit secrets, tokens, private keys, certificates, or real `.env` values.
- Do not paste secrets into prompts, logs, fixtures, test snapshots, or documentation.
- Keep required variables documented with placeholder values only.
- Redact secrets from error messages and debug output.

## Authentication And Authorization

- Treat authentication and authorization as separate concerns.
- Verify the caller is allowed to access or mutate the specific resource.
- Enforce authorization on the server side, not only in UI state.
- Include unauthorized and forbidden cases in tests when behavior changes.
- Preserve existing tenant, workspace, organization, or ownership boundaries.

## Input And Output Boundaries

- Validate external input at route, action, API, webhook, CLI, and file-upload boundaries.
- Prefer allowlists and typed schemas where practical.
- Escape or sanitize output in contexts that can execute or render markup.
- Avoid leaking internal errors, stack traces, tokens, or PII to users.

## Data Handling And Privacy

- Collect and store only data required for the feature.
- Avoid logging PII, credentials, session tokens, or authorization headers.
- Be explicit about data migrations and backfills.
- Preserve auditability for sensitive operations when the project supports it.

## Dependencies

Before adding or upgrading a dependency, consider:

- maintenance and release history
- known vulnerabilities
- transitive dependency risk
- bundle/runtime impact
- whether existing platform APIs or project utilities are sufficient

## Network And Integration Boundaries

- Use HTTPS for external services.
- Keep timeouts and failure behavior explicit.
- Validate webhook signatures when applicable.
- Avoid sending sensitive data to third-party services unless required and approved.

## Agent-Specific Pitfalls

Avoid these common AI-generated security problems:

- placeholder auth checks that look real
- client-only permission enforcement
- broad `admin` or `owner` bypasses without policy confirmation
- logging complete request objects
- swallowing security-relevant errors
- adding permissive CORS or CSP rules to fix local issues
- assuming user IDs, workspace IDs, or tenant IDs from untrusted input

## Handoff Requirements

For security-sensitive work, explicitly report:

- security-sensitive files or behavior changed
- tests or checks run
- authorization and validation paths reviewed
- known risks or unverified assumptions
- follow-up recommendations
