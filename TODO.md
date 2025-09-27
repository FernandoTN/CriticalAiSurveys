# Critical AI Surveys - Project Overview

## Main Objective
Build a modern web platform where people can create, publish (public or private), and participate in LLM-assisted surveys and deliberations.

**Inspired by Deliberation.io journey:**
Baseline opinion → AI conversation → reflection/edit → opinion distribution → peer evaluation → final opinion → platform feedback

---

# Project Roadmap & Execution Guide

## Purpose
This document is the **single source of truth** for "what's next." It translates the architecture and component playbooks into a phased, cross-functional plan with clear sub-phases, owners, dependencies, acceptance criteria, and links to the relevant deep-dive docs for context.

## How to Use This File
> - Before starting any task, **read the referenced playbook(s)** to understand context and interfaces
> - Track progress with the checkboxes below; open a GitHub Issue for each task and link back here
> - Keep statuses up to date (🔴 planned, 🟡 in progress, 🟢 done, ⚠️ blocked)
> - Treat each **Sub-Phase** as a milestone with a go/no-go review

---

## Product Scope & Success Criteria

### Primary Users
- **Creators:** Configure surveys (questions, logic, privacy, schedules)
- **Participants:** Complete surveys (optionally with AI reflection)
- **Researchers/Analysts:** Analyze aggregated results, export data
- **Moderators/Admins:** Enforce policies, manage violations and data retention

### Core User Journeys

**Creator Journey:**
Create survey → preview → publish → share link/access control → collect responses → analyze dashboards → export data

**Participant Journey:**
Participate in survey → baseline opinion (Likert + free text) → AI conversation (≥3 turns) → short reflection/edit (200 chars) → live opinion distribution → peer evaluation (approve/disapprove/pass, with required count) → final opinion → platform feedback → submission → thank-you/results

### Success Outcomes
- High completion rate, low drop-off between steps
- Reliable, real-time aggregates with privacy protections
- Transparent AI behaviors and opt-outs
- Accessibility (WCAG 2.2 AA) and multilingual support
- Research-grade data exports (with consent and anonymization)

### Key Metrics (define baselines post-pilot)
- Setup-to-publish time (median)
- Completion rate and step-wise drop-off
- Avg. AI turns per participant; % who revise after AI
- Time-to-first-result (TFR) on charts
- Moderation actions per 1k responses; false-positive/negative rate
- Accessibility audits pass rate

---

## Phased Roadmap (Milestones & Checklists)

### M0 — Foundations

**Repository Structure:**
- Mono-repo: `/apps/web`, `/apps/api`, `/packages/ui`, `/packages/schemas`, `/infra`

**Tech Stack:**
- **Frontend:** Next.js (React), MUI or shadcn/ui, react-hook-form + Zod
- **Charts:** Chart.js or Recharts
- **Real-time:** WebSockets (Socket.IO) or Server-Sent Events
- **Backend:** Node.js (TypeScript) + Fastify/NestJS; REST + SSE; background jobs with BullMQ
- **Database:** PostgreSQL (plus Prisma); Redis for cache/queues; S3-compatible storage
- **Auth:** Passwordless email + OAuth; optional SSO; anonymous session IDs for participants
- **CI/CD:** Lint, type-check, unit tests, preview deploys
- **Secrets & configs:** .env management; vault; environment promotion policy
- **Observability:** OpenTelemetry, structured logs, error tracking, audit trail

### M1 — Survey Builder (Creator UX)

**Features:**
- **Question types:** Likert (1-5), single/multi-select, free-text, NPS, matrix, scale
- **Logic:** Skip/branching, required/optional, min/max length, validation rules
- **AI-assist:** Prompt to draft questions, rephrase for clarity, generate balanced counter-questions
- **Privacy:** Public (link), private (invite-only), domain-limited, passcode, per-respondent tokens
- **Scheduling & quotas:** Open/close times, response caps
- **Branding & localization:** Title/description, theme, languages, RTL support
- **Preview & test mode:** Run complete flow with mock data
- **Versioning:** Immutable published versions; draft edits create v+1

**Definition of Done (M1):**
Creator can publish v1 survey with at least 1 Likert + 1 free-text question, privacy set, and shareable link.

### M2 — Participation Flow (Deliberation-style)

**Flow Steps:**
- **Session init:** Show alphanumeric session ID in header; resume via cookie
- **Page 1:** Baseline Likert + justification (≥10 chars) with character counter
- **Page 2:** AI conversation (min 3 rounds), streaming responses; guardrail & cost controls
- **Page 3:** Reflection & edit (limit 200 chars) stored as preview comment
- **Page 4:** Real-time opinion distribution chart; "not enough responses" state (<2)
- **Page 5:** Peer evaluation—approve/disapprove/pass, min 3 votes required, pagination, rate limiting
- **Page 6:** Final opinion (200 chars) + Likert re-rate
- **Page 7:** Platform feedback form
- **Review & Submit:** Summary of ratings, comments, chat transcript (optional), votes; confirm & submit; thank-you + link to results (if public)

**Definition of Done (M2):**
E2E flow completes on desktop & mobile; step progress visible; real-time chart updates.

### M3 — Results, Analytics, & Exports

**Features:**
- **Dashboards:** Distributions, time series, vote tallies, top comments by quality
- **LLM summaries:** Anonymized synthesis of arguments; surface themes & counterpoints
- **Filters & segments:** By cohort, language, completion state
- **Exports:** CSV/JSON + codebook; downloadable consent-aware datasets
- **Researcher notebook:** Reproducible report templates (eg. Jupyter/Rmd guidance)

**Definition of Done (M3):**
Creators/Researchers can export clean datasets and see live dashboards without PII leakage.

### M4 — Trust, Safety, & Compliance

**Features:**
- **Moderation:** Automated + human-in-the-loop; queue, thresholds, escalation
- **PII detection:** Redact before storage; safe-list terms; replay audit
- **Content policy:** Transparency pages; participant code of conduct; warnings
- **Privacy & data:** Consent capture, retention schedules, deletion, DPAs, GDPR/CCPA requests
- **Security:** Row-level access control, RBAC, CSRF, rate limiting, WAF, encryption at rest/in transit, secrets rotation
- **Accessibility:** WCAG 2.2 AA audit & fixes (focus, contrast, screen reader labels, captions)

**Definition of Done (M4):**
External accessibility and security checks pass; escalation playbooks documented.

### M5 — Scale, Performance, & Cost Controls

**Features:**
- **Load targets:** Define SLOs; autoscale API and websockets; CDN for static
- **Query optimization:** Indexes, CQRS for heavy analytics, pre-aggregations
- **LLM spend controls:** Token budgets, truncation, caching, offline summarization jobs
- **Resilience:** Retries, idempotent writes, dead-letter queues, partial outage modes

### M6 — Open Science & Extensibility

**Features:**
- **Public docs:** Data dictionaries, methodology, AI transparency
- **Open-source plan:** License (e.g., Apache-2.0/AGPL-3.0), contribution guide, sample datasets (consent-based, anonymized)
- **Plugins:** Webhooks, import/export adapters, alternative LLM providers

---

## Recommendations Table (from analysis)

| Area | Suggested Improvement | Rationale |
|------|----------------------|-----------|
| AI questioning strategy | Provide customizable/adaptive prompts that challenge assumptions (counter-arguments, long-term consequences) | Promotes deeper reflection beyond elaboration on initial views |
| Transparency of AI | Explain how AI generates questions/responses; allow users to view underlying model/guidelines | Builds trust; clarifies facilitation vs steering |
| Conversation diversity | Offer multiple AI personas (ethical critic, technical expert) and/or AI-moderated group chat | Broadens perspectives; reduces anchoring |
| Feedback on reasoning quality | After chat, show AI-generated summary and dimensions not considered; highlight strong reasoning in peers' comments | Supports metacognition; improves argument quality |
| Support for editing earlier responses | Allow revisions to earlier answers after reflection and peer exposure | Encourages learning; reduces lock-in to early opinions |
| Enhanced peer voting | Add quality metrics/categories beyond approval; incentivize evidence/citations/compromise | Surfaces reasoned arguments; mitigates bandwagon effects |
| Accessibility and inclusion | Multilingual, screen-reader friendly, low-bandwidth options | Ensures diverse voices can participate |
| Ethical safeguards | Moderation, misuse/misinformation/harassment prevention, clear data-use notices | Upholds rights, equality, and safety |
| Open-source & open-science | Publish code and anonymized datasets (with consent) | Enables scrutiny and reproducible research |

---

## Traceability Matrix — From Recommendations to Tasks

- **R1 AI questioning strategy** → M1 AI-assist (prompt library), M2 AI chat (adaptive follow-ups), M3 LLM summaries (gaps raised)
- **R2 Transparency of AI** → M0 Transparency pages, model cards, prompt snippets; per-step "Why these questions?" link
- **R3 Conversation diversity** → M2 Persona selector; later: AI-moderated group rooms (feature flag)
- **R4 Feedback on reasoning quality** → M3 Post-chat AI summaries; M3 peer reasoning highlights; rubric tooltips
- **R5 Edit earlier responses** → M2 allow edits to baseline after distribution/peer reading; maintain edit history
- **R6 Enhanced peer voting** → M2 add "Reasoning quality" vote with categories; M3 dashboards by quality theme
- **R7 Accessibility & inclusion** → M0 i18n, RTL, semantic HTML; M4 WCAG audit; M5 low-bandwidth rendering
- **R8 Ethical safeguards** → M4 moderation pipeline, PII redaction, data-use notices & consent; M4 transparency reports
- **R9 Open-source & open-science** → M6 licensing, docs, sample datasets, reproducibility recipes

---

## System Architecture (Blueprint)

### Frontend (Next.js/React)

**Pages/Routes:**
- `/` - Marketing
- `/create` - Survey builder
- `/s/:slug` - Participate
- `/r/:slug` - Results
- `/admin` - Admin panel

**State & Forms:**
- react-hook-form + Zod
- Optimistic UI
- URL-safe stepper (?step=2)

**LLM UI:**
- Streaming chat (≥3 rounds required)
- Persona selector
- Token counter
- Opt-out

**Charts:**
- Opinion distribution (bar)
- Real-time highlight "Your response" (magenta line)

**Accessibility:**
- Labeled controls
- Focus management
- ARIA live regions
- Keyboard nav
- Reduced-motion

### Backend (Node/TypeScript)

**Services:**
Auth, surveys, responses, chat, votes, analytics, moderation, exports

**Transport:**
REST + SSE/WebSocket channels for real-time charts and chat status

**Jobs:**
BullMQ for async tasks (summaries, exports, moderation scans)

### Data

**PostgreSQL (Prisma) - Core Tables:**

- `users(id, email, role, locale, org_id, created_at)`
- `surveys(id, org_id, slug, title, description, version, status, visibility, passcode_hash, opens_at, closes_at, locale, created_by, created_at)`
- `survey_questions(id, survey_id, type, prompt, options_json, constraints_json, order)`
- `survey_logic(id, survey_id, rule_json)`
- `sessions(id, survey_id, anon_key, user_id, locale, started_at, last_active_at)`
- `responses(id, session_id, question_id, value_json, created_at, edited_at, edited_from_response_id)`
- `ai_chats(id, session_id, persona, turn_index, user_msg, ai_msg, tokens_in, tokens_out, cost_cents, created_at)`
- `votes(id, session_id, target_response_id, signal ENUM('approve','disapprove','pass','quality'), reason_json, created_at)`
- `aggregates(id, survey_id, metric, bucket, value, updated_at)`
- `moderation_flags(id, target_type, target_id, reason, severity, status, created_at, reviewed_by)`
- `consents(id, session_id, policy_version, granted_at)`
- `exports(id, survey_id, status, file_url, created_at)`
- `audit_log(id, actor_id, action, target_type, target_id, meta_json, created_at)`

### LLM Integration

**Providers:**
Configurable (OpenAI / Azure OpenAI / Anthropic / others) with fallbacks

**Prompt Library:**
- **Socratic persona:** Probe benefits/risks/alternatives/counterfactuals
- **Ethical critic:** Fairness, privacy, long-term effects
- **Technical expert:** Feasibility, constraints, costs

**Token & Cost Controls:**
Truncate history, summarize context, cache frequent prompts

**Safety:**
Moderation before display; PII/harassment filters; opt-out from AI chat

### Security & Privacy

**RBAC:**
Roles = owner, collaborator, viewer, moderator, participant(anon)

**Visibility:**
Public, unlisted, private-invite, domain-restricted, passcode, per-token

**PII:**
Avoid storing by default; hash pseudonymous IDs; scoped access tokens; delete on request

**Compliance:**
Consent versions, privacy notices, DPA hooks, data retention windows

### Real-time & Scale

**WebSockets/SSE:**
Channels for distribution updates and voting counters

**Pre-aggregations:**
Materialized views for histograms

**Queues:**
Rate limit votes per user/IP; flood control; CAPTCHA on anomalies

---

## API (Sketch)

```
POST   /auth/session                         -> anon or user session
POST   /surveys                              -> create (draft)
GET    /surveys/:id|:slug                    -> read (respect visibility)
PATCH  /surveys/:id                          -> update (draft only)
POST   /surveys/:id/publish                  -> publish version
GET    /surveys/:id/questions                -> list questions
POST   /surveys/:id/responses                -> create response (per question)
POST   /surveys/:id/ai/chat                  -> proxy LLM; stream via SSE
POST   /surveys/:id/reflection               -> save 200-char preview comment
GET    /surveys/:id/distribution/likert      -> real-time histogram (SSE)
POST   /surveys/:id/votes                    -> approve/disapprove/pass/quality
POST   /surveys/:id/final                    -> save final opinion + Likert
POST   /surveys/:id/feedback                 -> platform feedback
GET    /surveys/:id/results                  -> dashboards (role-aware)
POST   /moderation/scan                      -> queue content for review
POST   /exports                              -> create export; poll status
GET    /exports/:id                          -> signed download URL
```

**SSE Example:**
`/surveys/:id/distribution/likert?question=Q1` → `{bucket:1..5, count}` deltas

---

## UX Details (Deliberation-Inspired)

- **Multi-step stepper:** "Page 1 of 7"
- **Baseline Likert:** Labeled endpoints ("Not at all" ↔ "Definitely"); free-text min 10 chars + live counter
- **Chat:** Required 3 rounds; blue user balloons, purple AI; "requirement met" banner after third exchange
- **Reflection:** Show original comment; enforce 200-char revision (preview comment)
- **Distribution:** Live bar chart; highlight participant's value with magenta vertical line "Your response"; empty state until ≥2 responses
- **Peer evaluation:** Show comments from others; 3 actions; progress bar "3 of N required"; pagination
- **Final:** 200-char final statement + Likert re-rate (to measure opinion shift)
- **Feedback:** Enjoyment rating + suggestions
- **Review:** All answers + (optional) chat transcript; "edit previous" links; final submit
- **Thank-you:** Confirm saved; link to current results (if allowed)

---

## Acceptance Criteria (Representative)

- **AC-AI-1:** Chat component prevents proceed until 3 user→AI turns; shows accessible status for streaming
- **AC-DIST-1:** Distribution chart updates ≤ 2s from new response; anonymizes counts for buckets with <k entries (k configurable)
- **AC-VOTE-1:** Voting endpoint idempotent per session/comment; rate limited; server returns updated tally & remaining required votes
- **AC-PRIV-1:** Private survey requires valid invite/passcode/token; unauthorized request returns 404 (not 401) to avoid leakage
- **AC-A11Y-1:** All form controls labeled; stepper navigable via keyboard; color contrast ≥ WCAG AA
- **AC-EXP-1:** Export excludes PII fields and applies k-anonymity thresholds; includes README/codebook

---

## Data & Analytics

**Event Schema (client):**
page_view, field_change, ai_turn, vote_cast, submit_success, drop_off

**Server Metrics:**
Queue latency, LLM tokens/cost per user/survey, moderation flags/hour

**A/B Tests:**
Question order; AI personas; visibility of distribution timing (before vs after reflection)

---

## Moderation & Safety

**Pipelines:**
Pre-store PII scan; post-store async content checks; language-aware toxicity; false-positive review UI

**Actions:**
Mask content, warn user, suspend session, block IP range, notify admins

**User Education:**
"How AI is used", "Data usage", "Research consent" with short, plain-language summaries

---

## Accessibility & Inclusion

**Multilingual:**
i18n with ICU MessageFormat; server-side language negotiation; translated prompts/personas

**Low-bandwidth:**
Progressive enhancement; text-only mode; avoid large bundles; late-load chat

**Screen Readers:**
aria-live regions for streaming; describe charts numerically below the visualization

---

## Cost, Performance, and Reliability

- LLM caching (prompt + persona + topic); summarization to compress chat history
- Quotas per survey (max chat turns/participant) and global daily caps
- Pre-aggregate histograms; background compaction to aggregates table
- Backpressure on WebSocket broadcasts; fall back to polling if needed
- Disaster recovery: automated backups, PITR, restore runbook

---

## Open Science & Transparency

- Publish model cards and prompt excerpts; record persona + prompt version on each AI turn
- Release anonymized datasets (opt-in consent), with documentation of transformations
- Public changelog; governance: advisory board for fairness & inclusion questions

---

## Example Schemas & Snippets

### Zod (client validation)
```typescript
const BaselineSchema = z.object({
  likert: z.number().int().min(1).max(5),
  justification: z.string().min(10).max(2000)
});

const ReflectionSchema = z.object({
  preview: z.string().min(1).max(200)
});
```

### SQL (histogram materialized view)
```sql
CREATE MATERIALIZED VIEW likert_histogram AS
SELECT survey_id, question_id, value_json->>'likert' AS bucket, count(*)::int AS count
FROM responses
WHERE (value_json ? 'likert')
GROUP BY 1,2,3;
```

### Persona prompt (snippet)
```
System: You are an ETHICAL CRITIC persona. Your job is to
(1) ask about fairness and downstream effects,
(2) surface counter-arguments,
(3) suggest at least one compromise.
Ask concise questions, 1 at a time.
```

---

## Directory Skeleton

```
/apps
  /web        # Next.js app
  /api        # Fastify/NestJS service
/packages
  /ui         # shared components (Stepper, Chat, Charts)
  /schemas    # Zod/Prisma schemas
/infra
  docker, k8s manifests, terraform
```

---

## Testing Plan

- **Unit:** Form validators, reducers, LLM proxy adapter, vote idempotency
- **Integration:** Submit flow; edit history; access control permutations
- **Load:** 10k concurrent participants updating histogram; latency SLOs
- **Security:** OWASP ZAP scan; CSRF/XXE/XSS tests; authz matrix tests
- **A11y:** axe + manual screen-reader passes
- **Human eval:** Rubric-scored samples for AI questioning quality & bias checks

---

## Risks & Mitigations

- **LLM drift/cost spikes** → provider abstraction, caching, budgets, nightly evals
- **Popularity bias in votes** → quality-focused voting (R6), delayed exposure of counts
- **Privacy leaks through free-text** → PII detectors + redaction before storage, k-anonymity exports
- **Real-time fanout pressure** → SSE/WebSockets with topic sharding, pre-agg buffers

---

## Launch Checklist

- [ ] Security & privacy review completed; policies published
- [ ] A11y audit passed; language coverage verified
- [ ] Creator onboarding guide & templates available
- [ ] Incident response on-call and dashboards live
- [ ] Pilot survey executed; metrics reviewed; remediation done
- [ ] Public launch toggle flipped per org

---

## Appendix A — Roles & Permissions (RBAC)

| Role | Create | Publish | View Results | Moderate | Export | Configure Org |
|------|--------|---------|--------------|----------|--------|---------------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Collaborator | ✓ | ✓ | ✓ | (by policy) | ✓ | |
| Viewer | | | ✓ (scope) | | | |
| Moderator | | | ✓ | ✓ | | |
| Participant (anon) | | | Public only | | | |

## Appendix B — Visibility Modes

- **Public** (indexed)
- **Unlisted** (link only)
- **Private-invite** (email or token)
- **Domain-restricted**
- **Passcode**
- **Per-respondent tokens**

---

## Legend & Conventions

- **Status:** 🔴 planned · 🟡 in progress · 🟢 done · ⚠️ blocked
- **Owner:** `@github-handle` (assign one DRI per sub-phase)
- **Links:** Always consult the listed **Playbooks** before coding

---