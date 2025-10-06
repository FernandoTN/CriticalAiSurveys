# Critical AI Surveys - Development Roadmap

## Project Overview

**Objective:** Build a modern web platform where users can create, publish, and participate in LLM-assisted surveys that facilitate reflection and deliberation.

**Core Vision:** Enable deeper democratic discourse through AI-mediated survey experiences that promote thoughtful opinion formation and quality peer interaction.

> **⚠️ IMPORTANT: DOCUMENTATION-FIRST APPROACH**
>
> **Before starting ANY phase, teams MUST read the referenced documentation.** Each phase includes specific links to critical documentation sections that contain essential implementation details, security requirements, and design patterns. Skipping documentation review will result in rework and potential security vulnerabilities.
>
> **Phase 2 (Participation Flow) and Phase 4 (Security & Compliance) are particularly critical** and require thorough understanding of the referenced documentation before implementation begins.

---

## Quick Links to Documentation

- [System Architecture](./docs/architecture.md)
- [API Specification](./docs/api-spec.md)
- [UX Design Guidelines](./docs/ux-guidelines.md)
- [Security & Privacy Requirements](./docs/security-privacy.md)
- [Testing Strategy](./docs/testing-strategy.md)
- [Deployment Guide](./docs/deployment.md)

---

## Development Phases & Milestones

### 🟢 Phase 0: Foundation Setup (M0)
**Duration:** 2-3 weeks
**Status:** 🟢 Done

> **📖 Required Reading Before Starting:**
> - [System Architecture](./docs/architecture.md) - Understanding overall system design
> - [Security & Privacy Requirements](./docs/security-privacy.md#authentication--authorization) - Auth setup
> - [Deployment Guide](./docs/deployment.md#infrastructure-as-code-terraform) - Infrastructure setup

#### Repository & Infrastructure
- [x] Set up monorepo structure (`/apps/web`, `/apps/api`, `/packages/ui`, `/packages/schemas`, `/infra`)
- [x] Initialize package.json with workspace configuration
- [x] Set up development environment (Docker Compose for local development)
- [x] Configure environment management (.env files, validation)

#### Technology Stack Setup
- [x] **Frontend:** Next.js 14 with TypeScript, App Router
- [x] **UI Library:** shadcn/ui + Tailwind CSS for consistent design system
- [x] **Forms:** react-hook-form + Zod for validation
- [x] **Charts:** Recharts for real-time data visualization
- [x] **Backend:** Node.js + Fastify/NestJS with TypeScript
- [x] **Database:** PostgreSQL with Prisma ORM
- [x] **Cache/Queue:** Redis for session storage and job queues
- [x] **File Storage:** S3-compatible storage (MinIO for dev)

#### Core Infrastructure
- [ ] Authentication system (passwordless email + OAuth providers) → **See [Security Framework](./docs/security-privacy.md#authentication--authorization)**
- [ ] Anonymous session management with alphanumeric IDs → **See [Architecture](./docs/architecture.md#database-schema)**
- [x] Database schema initialization → **See [Database Schema](./docs/architecture.md#database-schema)**
- [ ] Rate limiting and CSRF protection → **See [API Security](./docs/security-privacy.md#api-security)**
- [ ] Structured logging with OpenTelemetry → **See [Monitoring Setup](./docs/deployment.md#monitoring--observability)**
- [ ] Error tracking and monitoring setup

#### CI/CD Pipeline
- [x] GitHub Actions for automated testing
- [x] TypeScript compilation and linting
- [ ] Database migration testing
- [ ] Preview deployments for pull requests
- [ ] Security scanning (CodeQL, dependency checks)

**Definition of Done:** Development environment running locally with auth, database, and basic API endpoints.

---

### 🟢 Phase 1: Survey Builder (M1)
**Duration:** 3-4 weeks
**Status:** 🟢 Done

> **📖 Required Reading Before Starting:**
> - [UX Design Guidelines](./docs/ux-guidelines.md#survey-builder-interface) - Survey builder UX patterns
> - [API Specification](./docs/api-spec.md#survey-management) - Survey CRUD operations
> - [Security Requirements](./docs/security-privacy.md#input-validation--sanitization) - Input validation

#### Question Types & Logic
- [x] Implement Likert scale questions (1-5 rating)
- [ ] Single/multiple choice questions
- [x] Free-text input with character limits
- [ ] NPS (Net Promoter Score) questions
- [ ] Matrix/grid questions
- [x] Question ordering and dependencies
- [ ] Skip logic and branching rules
- [x] Required/optional field validation

#### AI-Assisted Question Generation
- [ ] Integrate LLM provider (OpenAI/Anthropic/Azure) → **See [Architecture - LLM Integration](./docs/architecture.md#llm-integration)**
- [ ] Prompt templates for question generation → **See [Security - AI Safety](./docs/security-privacy.md#content-security-policy)**
- [ ] Question refinement suggestions
- [ ] Bias detection and mitigation prompts
- [ ] Cost tracking and usage limits → **See [Deployment - Cost Controls](./docs/deployment.md#scaling--auto-scaling)**

#### Survey Configuration
- [ ] **Privacy Modes:**
  - [ ] Public (indexed, shareable link)
  - [ ] Unlisted (link-only access)
  - [ ] Private invite (email-based)
  - [ ] Domain-restricted access
  - [ ] Passcode protection
  - [ ] Per-respondent tokens
- [ ] Scheduling system (open/close dates, time zones)
- [ ] Response quotas and caps
- [ ] Survey versioning (immutable published versions)

#### Creator Experience
- [x] Drag-and-drop question builder
- [ ] Real-time preview mode
- [ ] Survey testing with mock data
- [x] Publication workflow
- [ ] Share link generation
- [ ] Basic analytics dashboard

**Definition of Done:** Creator can build, preview, and publish a multi-question survey with privacy settings and generate shareable links.

---

### 🔴 Phase 2: Participation Flow (M2)
**Duration:** 4-5 weeks
**Status:** 🔴 Planned

> **📖 CRITICAL - Required Reading Before Starting:**
> - [UX Design Guidelines](./docs/ux-guidelines.md#participation-flow-design) - **Complete 7-step flow design**
> - [API Specification](./docs/api-spec.md#survey-participation) - **Participation API endpoints**
> - [API Specification](./docs/api-spec.md#ai-conversation) - **AI chat integration**
> - [API Specification](./docs/api-spec.md#real-time-data) - **WebSocket real-time features**
> - [Security Requirements](./docs/security-privacy.md#data-protection) - **PII protection & anonymization**
> - [Testing Strategy](./docs/testing-strategy.md#ai-quality-testing) - **AI conversation quality requirements**

#### Session Management
- [ ] Anonymous session initialization
- [ ] Session ID display in header
- [ ] Progress persistence via cookies
- [ ] Resume capability for incomplete surveys
- [ ] Session timeout handling

#### Multi-Step Participation Flow
- [ ] **Step 1: Baseline Opinion**
  - [ ] Likert scale with clear labels ("Not at all" ↔ "Definitely")
  - [ ] Free-text justification (min 10 chars)
  - [ ] Character counter and validation
- [ ] **Step 2: AI Conversation** → **CRITICAL: Follow [UX Guidelines - AI Conversation](./docs/ux-guidelines.md#step-2-ai-conversation)**
  - [ ] Streaming chat interface (minimum 3 turns required) → **See [API - AI Chat](./docs/api-spec.md#ai-conversation)**
  - [ ] Multiple AI personas (Socratic, Ethical Critic, Technical Expert) → **See [Architecture - LLM Integration](./docs/architecture.md#llm-integration)**
  - [ ] Token usage display and cost controls → **See [Security - Cost Controls](./docs/security-privacy.md#api-security)**
  - [ ] Conversation quality indicators → **See [Testing - AI Quality](./docs/testing-strategy.md#ai-quality-testing)**
  - [ ] Opt-out mechanism → **See [Security - AI Safety](./docs/security-privacy.md#data-protection)**
- [ ] **Step 3: Reflection & Edit**
  - [ ] Display original justification
  - [ ] 200-character revision input
  - [ ] Change tracking and history
- [ ] **Step 4: Opinion Distribution** → **CRITICAL: Follow [UX Guidelines - Distribution](./docs/ux-guidelines.md#step-4-opinion-distribution)**
  - [ ] Real-time histogram visualization → **See [API - Real-time Data](./docs/api-spec.md#real-time-data)**
  - [ ] User's response highlighted (magenta line) → **See [UX Guidelines - Charts](./docs/ux-guidelines.md#step-4-opinion-distribution)**
  - [ ] Anonymous aggregation (k-anonymity) → **See [Security - K-Anonymity](./docs/security-privacy.md#k-anonymity--differential-privacy)**
  - [ ] "Insufficient responses" state handling → **See [UX Guidelines - Empty States](./docs/ux-guidelines.md#step-4-opinion-distribution)**
- [ ] **Step 5: Peer Evaluation**
  - [ ] Comment display with pagination
  - [ ] Voting actions: Approve/Disapprove/Pass/Quality
  - [ ] Minimum vote requirement (3 votes)
  - [ ] Rate limiting and spam prevention
- [ ] **Step 6: Final Opinion**
  - [ ] Final comment (200 chars)
  - [ ] Second Likert rating (measure opinion shift)
- [ ] **Step 7: Platform Feedback**
  - [ ] Experience rating
  - [ ] Improvement suggestions
- [ ] **Review & Submit**
  - [ ] Summary of all responses
  - [ ] Optional chat transcript
  - [ ] Edit previous steps capability
  - [ ] Final submission confirmation

#### Real-Time Features → **CRITICAL: See [API - WebSocket Events](./docs/api-spec.md#websocket-real-time-updates)**
- [ ] WebSocket/SSE for live updates → **See [Architecture - Real-time & Scale](./docs/architecture.md#real-time--scale)**
- [ ] Histogram updates (≤2s latency) → **See [Testing - Performance](./docs/testing-strategy.md#performance-testing)**
- [ ] Concurrent user indicators
- [ ] Graceful degradation to polling → **See [Architecture - Scalability](./docs/architecture.md#scalability-considerations)**

**Definition of Done:** Complete end-to-end participation flow with real-time updates working on desktop and mobile.

---

### 🔴 Phase 3: Analytics & Exports (M3)
**Duration:** 3-4 weeks
**Status:** 🔴 Planned

> **📖 Required Reading Before Starting:**
> - [API Specification](./docs/api-spec.md#analytics--reporting) - Analytics API endpoints
> - [Security Requirements](./docs/security-privacy.md#k-anonymity--differential-privacy) - Data anonymization
> - [Architecture](./docs/architecture.md#data-flow) - Data processing patterns

#### Dashboards & Visualization
- [ ] Response distribution charts
- [ ] Time-series participation data
- [ ] Vote quality metrics
- [ ] Drop-off analysis by step
- [ ] Top comments by approval rating
- [ ] Opinion shift tracking (before/after AI)

#### AI-Generated Insights
- [ ] Automated argument summarization
- [ ] Theme extraction from responses
- [ ] Counter-argument identification
- [ ] Reasoning quality assessment
- [ ] Bias detection in responses

#### Data Export & Research Tools
- [ ] CSV/JSON export with data dictionary
- [ ] Anonymization pipeline (PII removal, k-anonymity)
- [ ] Consent-aware dataset generation
- [ ] Reproducible analysis templates (Jupyter notebooks)
- [ ] API access for researchers
- [ ] Data segmentation (cohort, language, completion state)

#### Advanced Analytics
- [ ] A/B testing framework (question order, AI personas)
- [ ] Participant journey analysis
- [ ] Engagement pattern identification
- [ ] Quality vs. quantity trade-off metrics

**Definition of Done:** Researchers can access live dashboards and export anonymized datasets without PII exposure.

---

### 🔴 Phase 4: Trust, Safety & Compliance (M4)
**Duration:** 4-5 weeks
**Status:** 🔴 Planned

> **📖 CRITICAL - Required Reading Before Starting:**
> - [Security & Privacy Requirements](./docs/security-privacy.md) - **Complete security framework**
> - [Testing Strategy](./docs/testing-strategy.md#security-testing) - **Security testing requirements**
> - [Testing Strategy](./docs/testing-strategy.md#accessibility-testing) - **Accessibility compliance**

#### Content Moderation → **See [Security - Content Moderation](./docs/security-privacy.md#content-security-policy)**
- [ ] **Automated Pipeline:**
  - [ ] PII detection and redaction → **See [Security - PII Detection](./docs/security-privacy.md#pii-detection--redaction)**
  - [ ] Toxicity and harassment detection
  - [ ] Spam and bot identification
  - [ ] Language-aware content analysis
- [ ] **Human Moderation:** → **See [API - Content Moderation](./docs/api-spec.md#content-moderation)**
  - [ ] Moderation queue interface
  - [ ] Severity classification system
  - [ ] Escalation workflows → **See [Security - Incident Response](./docs/security-privacy.md#incident-response)**
  - [ ] Moderator training materials

#### Privacy & Data Protection → **CRITICAL: See [Security - Privacy Compliance](./docs/security-privacy.md#privacy-compliance)**
- [ ] **GDPR/CCPA Compliance:** → **See [Security - GDPR/CCPA](./docs/security-privacy.md#gdpr-compliance)**
  - [ ] Consent management system
  - [ ] Data retention policies
  - [ ] Right to deletion
  - [ ] Data portability
  - [ ] Privacy notices and transparency
- [ ] **Data Security:** → **See [Security - Data Protection](./docs/security-privacy.md#data-protection)**
  - [ ] Encryption at rest and in transit → **See [Security - Encryption](./docs/security-privacy.md#encryption)**
  - [ ] Secure session management
  - [ ] Audit logging
  - [ ] Access controls (RBAC) → **See [Security - Authorization](./docs/security-privacy.md#authentication--authorization)**

#### Platform Safety
- [ ] User reporting system
- [ ] Content warnings and flags
- [ ] Session suspension capabilities
- [ ] IP blocking and rate limiting
- [ ] Incident response procedures

#### Accessibility Compliance → **CRITICAL: See [Testing - Accessibility](./docs/testing-strategy.md#accessibility-testing)**
- [ ] WCAG 2.2 AA compliance audit → **See [UX Guidelines - Accessibility](./docs/ux-guidelines.md#accessibility-standards)**
- [ ] Screen reader compatibility
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Color contrast compliance
- [ ] Reduced motion support

**Definition of Done:** Platform passes external security and accessibility audits with documented escalation procedures.

---

### 🔴 Phase 5: Scale & Performance (M5)
**Duration:** 3-4 weeks
**Status:** 🔴 Planned

> **📖 Required Reading Before Starting:**
> - [Deployment Guide](./docs/deployment.md#scaling--auto-scaling) - Auto-scaling configuration
> - [Testing Strategy](./docs/testing-strategy.md#performance-testing) - Performance testing requirements
> - [Architecture](./docs/architecture.md#scalability-considerations) - Scalability patterns

#### Performance Optimization
- [ ] Database query optimization and indexing
- [ ] Pre-computed aggregations (materialized views)
- [ ] CDN setup for static assets
- [ ] Image optimization and lazy loading
- [ ] Bundle size optimization

#### Scalability Infrastructure
- [ ] Horizontal scaling for API services
- [ ] WebSocket connection management
- [ ] Load balancer configuration
- [ ] Database connection pooling
- [ ] Redis cluster setup

#### Cost Controls
- [ ] LLM usage monitoring and caps
- [ ] Token budget management per survey
- [ ] Conversation history truncation
- [ ] Response caching strategies
- [ ] Alert system for cost spikes

#### Reliability & Monitoring
- [ ] Service level objectives (SLOs)
- [ ] Health checks and readiness probes
- [ ] Graceful degradation modes
- [ ] Dead letter queues for failed jobs
- [ ] Comprehensive monitoring dashboards

**Definition of Done:** Platform handles 10k concurrent users with defined SLOs and cost controls.

---

### 🔴 Phase 6: Open Science & Extensibility (M6)
**Duration:** 2-3 weeks
**Status:** 🔴 Planned

> **📖 Required Reading Before Starting:**
> - [Security Requirements](./docs/security-privacy.md#open-science--transparency) - Data sharing guidelines
> - [API Specification](./docs/api-spec.md#webhook-events) - Webhook implementation
> - [Architecture](./docs/architecture.md#external-services-integration) - Integration patterns

#### Open Source Preparation
- [ ] Code cleanup and documentation
- [ ] License selection (Apache 2.0/AGPL 3.0)
- [ ] Contribution guidelines
- [ ] Security disclosure policy
- [ ] Community governance model

#### Transparency & Reproducibility
- [ ] Model cards for AI components
- [ ] Algorithmic transparency reports
- [ ] Prompt template documentation
- [ ] Bias testing and mitigation reports
- [ ] Public changelog and versioning

#### Research Integration
- [ ] Anonymized dataset releases
- [ ] Academic collaboration tools
- [ ] Citation and attribution system
- [ ] Research methodology documentation
- [ ] IRB compliance guidelines

#### Extensibility Features
- [ ] Webhook system for external integrations
- [ ] Plugin architecture
- [ ] Alternative LLM provider support
- [ ] Custom analysis modules
- [ ] API for third-party tools

**Definition of Done:** Platform ready for open-source release with comprehensive documentation and research datasets.

---

## Progress Tracking

### Current Sprint Focus
- [ ] Phase 0 foundation setup
- [ ] Development environment configuration
- [ ] Initial database schema design

### Key Metrics to Track
- [ ] Setup-to-publish time (target: <15 minutes)
- [ ] Completion rate by step (target: >80% overall)
- [ ] AI conversation engagement (target: >3 turns average)
- [ ] Real-time update latency (target: <2 seconds)
- [ ] Accessibility audit score (target: WCAG 2.2 AA compliance)

### Risk Management
- [ ] LLM cost monitoring and alerts
- [ ] Performance benchmarking under load
- [ ] Security vulnerability scanning
- [ ] Privacy compliance verification
- [ ] User feedback integration

---

## Getting Started

1. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd CriticalAiSurveys
   npm install
   cp .env.example .env.local
   ```

2. **Development Environment:**
   ```bash
   docker-compose up -d  # Start PostgreSQL, Redis
   npm run db:migrate    # Run database migrations
   npm run dev          # Start development servers
   ```

3. **Read Documentation:**
   - Start with [Architecture Overview](./docs/architecture.md)
   - Review [API Specification](./docs/api-spec.md)
   - Check [UX Design Guidelines](./docs/ux-guidelines.md)
   - Understand [Security Requirements](./docs/security-privacy.md)

---

## Team & Ownership

- **Technical Lead:** TBD
- **Frontend Lead:** TBD
- **Backend Lead:** TBD
- **UX/UI Designer:** TBD
- **Product Owner:** TBD

---

## Legend

- 🔴 **Planned** - Not started
- 🟡 **In Progress** - Currently working
- 🟢 **Done** - Completed
- ⚠️ **Blocked** - Needs attention

Each phase should be treated as a milestone with go/no-go review before proceeding to the next phase.