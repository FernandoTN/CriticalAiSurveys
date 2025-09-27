# System Architecture

## Overview

The Critical AI Surveys platform follows a modern microservices architecture with clear separation between frontend, backend, and data layers. The system is designed for scalability, maintainability, and extensibility.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (Node.js)     │    │   Services      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Survey      │ │    │ │ API         │ │    │ │ LLM         │ │
│ │ Builder     │ │    │ │ Gateway     │ │    │ │ Providers   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Participant │ │    │ │ Auth        │ │    │ │ Email       │ │
│ │ Interface   │ │    │ │ Service     │ │    │ │ Service     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Analytics   │ │    │ │ Survey      │ │    │ │ File        │ │
│ │ Dashboard   │ │    │ │ Service     │ │    │ │ Storage     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ PostgreSQL  │ │
                    │ │ (Primary)   │ │
                    │ └─────────────┘ │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ Redis       │ │
                    │ │ (Cache)     │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

## Frontend Architecture (Next.js/React)

### Directory Structure
```
apps/web/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── create/            # Survey builder
│   │   ├── s/[slug]/          # Survey participation
│   │   ├── r/[slug]/          # Results dashboard
│   │   └── admin/             # Admin interface
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   ├── survey/            # Survey-specific components
│   │   ├── chat/              # AI chat interface
│   │   └── charts/            # Data visualization
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── store/                 # State management (Zustand)
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
└── docs/                      # Component documentation
```

### Key Components

#### Survey Builder
- **QuestionBuilder**: Drag-and-drop interface for creating questions
- **LogicEditor**: Visual editor for skip logic and branching
- **PreviewMode**: Real-time survey preview
- **PublishWizard**: Step-by-step publication flow

#### Participation Flow
- **StepperNavigation**: Progress indicator and navigation
- **LikertScale**: Interactive rating component
- **ChatInterface**: Streaming AI conversation UI
- **OpinionChart**: Real-time histogram visualization
- **PeerVoting**: Comment evaluation interface

#### State Management
- **Survey Store**: Survey configuration and responses
- **Session Store**: Anonymous session management
- **Chat Store**: AI conversation state
- **Analytics Store**: Real-time data updates

### Real-Time Communication
- **WebSocket Client**: For live updates (opinion distribution, voting)
- **Server-Sent Events**: For streaming AI responses
- **Optimistic Updates**: Immediate UI feedback with rollback capability

## Backend Architecture (Node.js/TypeScript)

### Directory Structure
```
apps/api/
├── src/
│   ├── modules/               # Feature modules
│   │   ├── auth/             # Authentication & authorization
│   │   ├── surveys/          # Survey management
│   │   ├── responses/        # Response handling
│   │   ├── chat/             # AI chat integration
│   │   ├── analytics/        # Data aggregation
│   │   ├── moderation/       # Content moderation
│   │   └── exports/          # Data export
│   ├── shared/               # Shared utilities
│   │   ├── database/         # Database connection & models
│   │   ├── queues/           # Job queue management
│   │   ├── cache/            # Redis cache layer
│   │   ├── validation/       # Request validation
│   │   └── middleware/       # Express/Fastify middleware
│   ├── config/               # Configuration management
│   └── types/                # TypeScript definitions
├── migrations/               # Database migrations
└── seeds/                    # Test data seeds
```

### Service Architecture

#### Core Services

**Auth Service**
- Passwordless authentication (magic links)
- OAuth integration (Google, GitHub, etc.)
- Anonymous session management
- JWT token handling
- Role-based access control (RBAC)

**Survey Service**
- Survey CRUD operations
- Question type handlers
- Logic engine for skip/branching
- Version management
- Privacy controls

**Response Service**
- Response collection and validation
- Real-time aggregation
- Opinion tracking
- Peer voting management

**Chat Service**
- LLM provider abstraction
- Conversation management
- Token usage tracking
- Cost control and rate limiting
- Persona management

**Analytics Service**
- Real-time data aggregation
- Statistical computations
- Export generation
- A/B testing framework

**Moderation Service**
- Automated content scanning
- PII detection and redaction
- Human moderation queue
- Escalation workflows

### API Design

#### RESTful Endpoints
```
GET    /api/v1/surveys                    # List surveys
POST   /api/v1/surveys                    # Create survey
GET    /api/v1/surveys/:id                # Get survey
PATCH  /api/v1/surveys/:id                # Update survey
DELETE /api/v1/surveys/:id                # Delete survey
POST   /api/v1/surveys/:id/publish        # Publish survey

GET    /api/v1/surveys/:id/responses      # Get responses
POST   /api/v1/surveys/:id/responses      # Submit response
GET    /api/v1/surveys/:id/analytics      # Get analytics

POST   /api/v1/chat                       # AI chat endpoint
GET    /api/v1/chat/:sessionId/history    # Chat history

POST   /api/v1/votes                      # Submit vote
GET    /api/v1/votes/:responseId          # Get vote counts

POST   /api/v1/auth/login                 # Login/register
POST   /api/v1/auth/logout                # Logout
GET    /api/v1/auth/me                    # Current user

POST   /api/v1/exports                    # Create export
GET    /api/v1/exports/:id                # Download export
```

#### WebSocket Events
```
# Client -> Server
join-survey-room: { surveyId, sessionId }
submit-response: { questionId, value }
cast-vote: { responseId, vote }

# Server -> Client
response-added: { questionId, aggregate }
vote-updated: { responseId, counts }
participant-joined: { count }
```

## Database Schema

### Core Tables

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    role user_role DEFAULT 'creator',
    locale VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations (for multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Surveys
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    version INTEGER DEFAULT 1,
    status survey_status DEFAULT 'draft',
    visibility visibility_type DEFAULT 'public',
    settings JSONB DEFAULT '{}', -- privacy, scheduling, quotas
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Survey Questions
CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    options JSONB, -- for multiple choice, likert scales
    validation JSONB, -- min/max length, required, etc.
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Survey Logic (skip/branching)
CREATE TABLE survey_logic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    source_question_id UUID REFERENCES survey_questions(id),
    target_question_id UUID REFERENCES survey_questions(id),
    condition JSONB NOT NULL, -- condition logic
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anonymous Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    user_id UUID REFERENCES users(id), -- nullable for anonymous
    session_key VARCHAR(20) UNIQUE NOT NULL, -- alphanumeric display ID
    locale VARCHAR(10) DEFAULT 'en',
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Survey Responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    question_id UUID REFERENCES survey_questions(id),
    value JSONB NOT NULL, -- response data
    edited_from_id UUID REFERENCES responses(id), -- for edit history
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat Conversations
CREATE TABLE ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    persona VARCHAR(50) NOT NULL,
    turn_index INTEGER NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tokens_used INTEGER,
    cost_cents INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Peer Voting
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    target_response_id UUID REFERENCES responses(id),
    vote_type vote_type NOT NULL, -- approve, disapprove, pass, quality
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(session_id, target_response_id, vote_type)
);

-- Real-time Aggregates (materialized views)
CREATE TABLE aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    question_id UUID REFERENCES survey_questions(id),
    metric_type VARCHAR(50) NOT NULL, -- histogram, average, count
    bucket VARCHAR(50), -- for histograms
    value NUMERIC NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(survey_id, question_id, metric_type, bucket)
);

-- Content Moderation
CREATE TABLE moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(50) NOT NULL, -- response, chat_message
    target_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    severity severity_level NOT NULL,
    status moderation_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Data Exports
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    created_by UUID REFERENCES users(id),
    format export_format DEFAULT 'csv',
    filters JSONB DEFAULT '{}',
    status export_status DEFAULT 'pending',
    file_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID, -- user or system
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Consent Management
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    policy_version VARCHAR(20) NOT NULL,
    consent_type VARCHAR(50) NOT NULL, -- data_processing, research_use
    granted BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Enums and Custom Types

```sql
CREATE TYPE user_role AS ENUM ('admin', 'creator', 'moderator', 'analyst');
CREATE TYPE survey_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE visibility_type AS ENUM ('public', 'unlisted', 'private', 'domain_restricted');
CREATE TYPE question_type AS ENUM ('likert', 'multiple_choice', 'single_choice', 'free_text', 'nps', 'matrix');
CREATE TYPE vote_type AS ENUM ('approve', 'disapprove', 'pass', 'quality');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'escalated');
CREATE TYPE export_format AS ENUM ('csv', 'json', 'xlsx');
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed');
```

### Indexes for Performance

```sql
-- Survey access patterns
CREATE INDEX idx_surveys_slug ON surveys(slug);
CREATE INDEX idx_surveys_org_status ON surveys(org_id, status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);

-- Response aggregation
CREATE INDEX idx_responses_survey_question ON responses(session_id, question_id);
CREATE INDEX idx_responses_created_at ON responses(created_at);

-- Real-time updates
CREATE INDEX idx_aggregates_survey_question ON aggregates(survey_id, question_id);
CREATE INDEX idx_votes_target_response ON votes(target_response_id);

-- Session management
CREATE INDEX idx_sessions_survey_id ON sessions(survey_id);
CREATE INDEX idx_sessions_key ON sessions(session_key);

-- Analytics queries
CREATE INDEX idx_ai_chats_session ON ai_chats(session_id);
CREATE INDEX idx_moderation_status ON moderation_flags(status, created_at);
```

## External Services Integration

### LLM Providers
- **OpenAI**: GPT-3.5-turbo, GPT-4 for conversation
- **Anthropic**: Claude for alternative perspective
- **Azure OpenAI**: Enterprise deployment option
- **Provider Abstraction**: Unified interface for switching providers

### Authentication Providers
- **Magic.link**: Passwordless authentication
- **Google OAuth**: Social login
- **GitHub OAuth**: Developer-friendly option
- **Enterprise SSO**: SAML/OIDC for organizations

### Infrastructure Services
- **Vercel/Netlify**: Frontend deployment
- **Railway/Fly.io**: Backend deployment
- **Supabase/PlanetScale**: Managed PostgreSQL
- **Upstash**: Managed Redis
- **Cloudflare**: CDN and DDoS protection

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens with refresh tokens
- **Anonymous Sessions**: Cryptographically secure session IDs
- **RBAC**: Role-based permissions (admin, creator, moderator, analyst)
- **Row-Level Security**: Database-level access control

### Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Redaction**: Automated detection and anonymization
- **Data Minimization**: Collect only necessary information

### Security Headers
```javascript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
}
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: All services designed to be stateless
- **Load Balancing**: Round-robin with health checks
- **Database Sharding**: Partition by organization for multi-tenancy
- **CDN**: Global distribution of static assets

### Caching Strategy
- **Application Cache**: Redis for session data and aggregates
- **Database Cache**: Query result caching with TTL
- **Browser Cache**: Aggressive caching for static assets
- **API Gateway Cache**: Response caching for read-heavy endpoints

### Performance Optimization
- **Database Optimization**: Proper indexing and query optimization
- **Connection Pooling**: Efficient database connection management
- **Lazy Loading**: Load components and data on demand
- **Code Splitting**: Reduce bundle size with dynamic imports

## Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Response times, error rates, throughput
- **Business Metrics**: Survey completion rates, AI usage, user engagement
- **Infrastructure Metrics**: CPU, memory, database performance
- **Cost Metrics**: LLM usage, infrastructure costs

### Logging
- **Structured Logging**: JSON format with consistent fields
- **Log Aggregation**: Centralized logging with search capabilities
- **Audit Trail**: All user actions and system events
- **Error Tracking**: Real-time error notification and grouping

### Health Checks
```javascript
// Health check endpoints
GET /health - Basic health check
GET /health/ready - Readiness probe (dependencies available)
GET /health/live - Liveness probe (service responsive)
```

## Deployment Architecture

### Development Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: critical_ai_surveys
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"

  api:
    build: ./apps/api
    depends_on: [postgres, redis]

  web:
    build: ./apps/web
    depends_on: [api]
```

### Production Environment
- **Container Orchestration**: Kubernetes or Docker Swarm
- **Service Mesh**: Istio for service-to-service communication
- **Auto-scaling**: Based on CPU/memory usage and request volume
- **Blue-Green Deployment**: Zero-downtime deployments
- **Backup Strategy**: Automated database backups with point-in-time recovery

## Data Flow

### Survey Creation Flow
1. Creator designs survey in builder interface
2. Frontend validates and sends to API
3. Survey service stores configuration
4. AI service generates question suggestions
5. Version created and made available for publishing

### Participation Flow
1. Anonymous session created with unique ID
2. Questions served based on logic rules
3. Responses stored and validated
4. AI conversation managed through chat service
5. Real-time aggregates updated
6. Peer voting processed and stored
7. Final submission triggers completion workflow

### Analytics Flow
1. Raw responses collected in real-time
2. Aggregation service computes statistics
3. AI service generates insights and summaries
4. Dashboard displays live updates via WebSocket
5. Export service generates downloadable datasets
6. Research tools access via API

This architecture provides a solid foundation for building a scalable, secure, and maintainable LLM-powered survey platform while ensuring good separation of concerns and flexibility for future enhancements.