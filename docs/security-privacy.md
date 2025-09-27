# Security & Privacy Requirements

## Overview

The Critical AI Surveys platform handles sensitive personal opinions and potentially identifying information, requiring robust security measures and privacy protections. This document outlines comprehensive security requirements, privacy safeguards, and compliance measures to protect participants and maintain platform integrity.

## Security Framework

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for all system components
3. **Zero Trust**: Verify every request regardless of source
4. **Privacy by Design**: Privacy considerations built into every feature
5. **Transparency**: Clear communication about security measures

### Threat Model

#### Assets to Protect
- **Survey Responses**: Participant opinions and reasoning
- **AI Conversations**: Detailed deliberative exchanges
- **Aggregated Data**: Statistical insights and trends
- **User Accounts**: Creator and moderator credentials
- **System Infrastructure**: Servers, databases, APIs

#### Threat Actors
- **Malicious Users**: Attempting to manipulate survey results
- **Data Brokers**: Seeking to harvest personal information
- **State Actors**: Governments seeking to identify dissidents
- **Competitors**: Attempting to steal platform IP or data
- **Internal Threats**: Rogue employees or contractors

#### Attack Vectors
- **Data Exfiltration**: Unauthorized access to participant responses
- **Survey Manipulation**: Fake responses or vote brigading
- **AI Prompt Injection**: Malicious manipulation of AI conversations
- **Infrastructure Attacks**: DDoS, server compromise, database injection
- **Social Engineering**: Phishing, credential theft, insider threats

## Authentication & Authorization

### User Authentication

#### Anonymous Participants
```javascript
// Anonymous session creation with cryptographically secure IDs
const sessionId = crypto.randomUUID();
const sessionKey = generateSessionKey(8); // Human-readable: ABC123XY

// Session token (JWT) with limited scope
const sessionToken = jwt.sign({
  sessionId,
  surveyId,
  role: 'participant',
  scope: ['submit_response', 'chat', 'vote'],
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
}, process.env.SESSION_SECRET);
```

**Security Features**:
- No email or personal information required
- Cryptographically secure session IDs
- Limited token scope and expiration
- Session invalidation on completion
- IP rate limiting to prevent abuse

#### Authenticated Users (Creators/Moderators)
```javascript
// Multi-factor authentication flow
const authFlow = {
  step1: 'email_verification',    // Magic link or password
  step2: 'mfa_challenge',         // TOTP or SMS (optional)
  step3: 'device_trust',          // Remember trusted devices
  step4: 'session_creation'       // Full access token
};

// Role-based JWT tokens
const userToken = jwt.sign({
  userId,
  role: 'creator', // creator, moderator, admin, analyst
  orgId,
  permissions: ['create_survey', 'view_analytics', 'export_data'],
  exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
}, process.env.ACCESS_SECRET);
```

**Authentication Methods**:
- **Magic Links**: Passwordless authentication via email
- **OAuth Providers**: Google, GitHub, Microsoft integration
- **MFA Support**: TOTP apps, SMS backup
- **Device Trust**: Remember trusted devices for 30 days
- **Session Management**: Automatic logout, concurrent session limits

### Authorization (RBAC)

#### Role Definitions
```typescript
enum Role {
  ADMIN = 'admin',           // Platform administration
  CREATOR = 'creator',       // Survey creation and management
  MODERATOR = 'moderator',   // Content moderation
  ANALYST = 'analyst',       // Data analysis and export
  PARTICIPANT = 'participant' // Survey participation only
}

interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    { resource: '*', action: '*' }
  ],
  [Role.CREATOR]: [
    { resource: 'survey', action: 'create' },
    { resource: 'survey', action: 'update', conditions: { ownedBy: 'self' } },
    { resource: 'survey', action: 'delete', conditions: { ownedBy: 'self' } },
    { resource: 'analytics', action: 'view', conditions: { surveyOwner: 'self' } }
  ],
  [Role.MODERATOR]: [
    { resource: 'content', action: 'moderate' },
    { resource: 'user', action: 'suspend' },
    { resource: 'survey', action: 'view' }
  ],
  [Role.ANALYST]: [
    { resource: 'analytics', action: 'view' },
    { resource: 'export', action: 'create' },
    { resource: 'survey', action: 'view', conditions: { public: true } }
  ],
  [Role.PARTICIPANT]: [
    { resource: 'survey', action: 'participate' },
    { resource: 'response', action: 'submit' },
    { resource: 'chat', action: 'engage' },
    { resource: 'vote', action: 'cast' }
  ]
};
```

#### Row-Level Security
```sql
-- Database-level access control
CREATE POLICY survey_access ON surveys FOR ALL
USING (
  CASE
    WHEN visibility = 'public' THEN true
    WHEN visibility = 'private' AND created_by = current_user_id() THEN true
    WHEN visibility = 'org_restricted' AND org_id = current_user_org() THEN true
    ELSE false
  END
);

CREATE POLICY response_privacy ON responses FOR SELECT
USING (
  -- Users can only see their own responses
  session_id = current_session_id()
  OR
  -- Creators can see aggregated data only
  (current_user_role() = 'creator' AND survey_owner_check())
  OR
  -- Moderators can see for moderation purposes
  (current_user_role() = 'moderator')
);
```

## Data Protection

### Encryption

#### Encryption at Rest
```javascript
// Database encryption (transparent data encryption)
const dbConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT
  },
  // Column-level encryption for sensitive fields
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.DB_ENCRYPTION_KEY
  }
};

// File storage encryption
const s3Config = {
  serverSideEncryption: 'AES256',
  sseKmsKeyId: process.env.KMS_KEY_ID,
  bucketEncryption: {
    Rules: [{
      ApplyServerSideEncryptionByDefault: {
        SSEAlgorithm: 'aws:kms',
        KMSMasterKeyID: process.env.KMS_KEY_ID
      }
    }]
  }
};
```

#### Encryption in Transit
```javascript
// HTTPS/TLS configuration
const tlsConfig = {
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ],
  honorCipherOrder: true,
  secureProtocol: 'TLSv1_3_method'
};

// Certificate pinning for API clients
const pinnedCertificates = {
  'api.criticalaisurveys.com': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=' // Backup
  ]
};
```

### PII Detection & Redaction

#### Automated PII Scanning
```typescript
interface PIIDetector {
  patterns: {
    email: RegExp;
    phone: RegExp;
    ssn: RegExp;
    creditCard: RegExp;
    ipAddress: RegExp;
    name: RegExp; // NER model-based
  };

  scan(text: string): PIIDetection[];
  redact(text: string, replacements?: Record<string, string>): string;
}

class PIIScanner implements PIIDetector {
  patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
  };

  async scan(text: string): Promise<PIIDetection[]> {
    const detections: PIIDetection[] = [];

    // Pattern-based detection
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        detections.push({
          type,
          value: match[0],
          start: match.index!,
          end: match.index! + match[0].length,
          confidence: 0.9
        });
      }
    }

    // ML-based named entity recognition
    const nerResults = await this.nerModel.predict(text);
    detections.push(...nerResults.filter(r => r.confidence > 0.8));

    return detections;
  }

  redact(text: string, options: RedactionOptions = {}): string {
    const detections = this.scan(text);
    let redactedText = text;

    // Sort by position (reverse order to maintain indices)
    detections.sort((a, b) => b.start - a.start);

    for (const detection of detections) {
      const replacement = options.preserveFormat
        ? '*'.repeat(detection.value.length)
        : `[${detection.type.toUpperCase()}_REDACTED]`;

      redactedText = redactedText.substring(0, detection.start) +
                    replacement +
                    redactedText.substring(detection.end);
    }

    return redactedText;
  }
}

// Pre-storage PII protection
app.post('/api/responses', async (req, res) => {
  const scanner = new PIIScanner();

  // Scan and redact PII before storage
  const originalText = req.body.value.justification;
  const piiDetections = await scanner.scan(originalText);

  if (piiDetections.length > 0) {
    // Log for audit but don't store original
    auditLogger.warn('PII detected in response', {
      sessionId: req.body.sessionId,
      detectionCount: piiDetections.length,
      types: piiDetections.map(d => d.type)
    });

    // Store redacted version
    req.body.value.justification = scanner.redact(originalText);
    req.body.piiRedacted = true;
  }

  // Continue with storage...
});
```

### K-Anonymity & Differential Privacy

#### K-Anonymity Implementation
```typescript
interface AnonymizationConfig {
  k: number; // Minimum group size
  sensitiveAttributes: string[];
  quasiIdentifiers: string[];
}

class KAnonymizer {
  constructor(private config: AnonymizationConfig) {}

  async anonymize(dataset: any[]): Promise<any[]> {
    // Group records by quasi-identifiers
    const groups = this.groupByQuasiIdentifiers(dataset);

    // Ensure each group has at least k members
    const anonymizedGroups = await this.ensureKAnonymity(groups);

    // Generalize quasi-identifiers within each group
    return anonymizedGroups.flatMap(group =>
      this.generalizeGroup(group)
    );
  }

  private groupByQuasiIdentifiers(records: any[]): Map<string, any[]> {
    const groups = new Map();

    for (const record of records) {
      const key = this.config.quasiIdentifiers
        .map(attr => record[attr])
        .join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(record);
    }

    return groups;
  }

  private async ensureKAnonymity(groups: Map<string, any[]>): Promise<any[][]> {
    const result: any[][] = [];
    const smallGroups: any[] = [];

    for (const group of groups.values()) {
      if (group.length >= this.config.k) {
        result.push(group);
      } else {
        smallGroups.push(...group);
      }
    }

    // Merge small groups or suppress if too few
    if (smallGroups.length >= this.config.k) {
      result.push(smallGroups);
    }
    // If fewer than k records remain, they are suppressed

    return result;
  }
}

// Export endpoint with k-anonymity
app.get('/api/surveys/:id/export', async (req, res) => {
  const anonymizer = new KAnonymizer({
    k: 5, // Minimum 5 responses per group
    sensitiveAttributes: ['political_affiliation', 'income_bracket'],
    quasiIdentifiers: ['age_group', 'education_level', 'geographic_region']
  });

  const rawData = await db.getResponses(req.params.id);
  const anonymizedData = await anonymizer.anonymize(rawData);

  res.json({
    data: anonymizedData,
    metadata: {
      originalCount: rawData.length,
      anonymizedCount: anonymizedData.length,
      suppressedCount: rawData.length - anonymizedData.length,
      kValue: 5
    }
  });
});
```

## API Security

### Input Validation & Sanitization

#### Request Validation
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Comprehensive input schemas
const surveyResponseSchema = z.object({
  questionId: z.string().uuid(),
  value: z.object({
    likert: z.number().int().min(1).max(5).optional(),
    justification: z.string()
      .min(10, 'Minimum 10 characters required')
      .max(2000, 'Maximum 2000 characters allowed')
      .transform(text => DOMPurify.sanitize(text))
  }),
  sessionId: z.string().uuid()
}).strict(); // Reject unknown fields

const chatMessageSchema = z.object({
  message: z.string()
    .min(1)
    .max(1000)
    .transform(text => {
      // Sanitize HTML but preserve basic formatting
      return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
        ALLOWED_ATTR: []
      });
    }),
  turnIndex: z.number().int().positive(),
  persona: z.enum(['socratic', 'ethical_critic', 'technical_expert'])
});

// Middleware for validation
const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// Usage
app.post('/api/responses',
  validate(surveyResponseSchema),
  async (req, res) => {
    // req.body is now validated and sanitized
  }
);
```

### Rate Limiting & DDoS Protection

#### Multi-Layer Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Rate limiting configuration
const rateLimiters = {
  // General API access
  api: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:api:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }),

  // AI chat interactions (more restrictive)
  chat: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:chat:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 chat messages per minute
    keyGenerator: (req) => {
      // Rate limit by session for anonymous users
      return req.sessionId || req.ip;
    }
  }),

  // Survey submission
  responses: rateLimit({
    windowMs: 60 * 1000,
    max: 20, // 20 responses per minute
    skip: (req) => {
      // Skip for legitimate rapid responses in same survey
      return req.sessionContinuation === true;
    }
  }),

  // Authentication attempts
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      // Rate limit by IP and email
      return `${req.ip}:${req.body.email || 'anonymous'}`;
    }
  })
};

// Adaptive rate limiting based on suspicion score
class AdaptiveRateLimiter {
  getSuspicionScore(req: Request): number {
    let score = 0;

    // Check various suspicious indicators
    if (this.isVPN(req.ip)) score += 0.3;
    if (this.hasUnusualUserAgent(req.headers['user-agent'])) score += 0.2;
    if (this.hasRapidRequests(req.ip)) score += 0.4;
    if (this.hasFailedAuth(req.ip)) score += 0.5;

    return Math.min(score, 1.0);
  }

  getLimit(baseLimitreq: Request): number {
    const suspicion = this.getSuspicionScore(req);

    // Reduce limits for suspicious traffic
    return Math.floor(baseLimit * (1 - suspicion));
  }
}
```

### SQL Injection Prevention

#### Parameterized Queries with Prisma
```typescript
// Safe database operations using Prisma ORM
class SurveyService {
  async getResponses(surveyId: string, filters: ResponseFilters) {
    // Prisma automatically parameterizes queries
    return await prisma.response.findMany({
      where: {
        session: {
          surveyId: surveyId // Automatically parameterized
        },
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        // Complex filtering with safety
        ...(filters.hasText && {
          value: {
            path: ['justification'],
            string_contains: filters.textSearch // Safe text search
          }
        })
      },
      select: {
        id: true,
        value: true,
        createdAt: true,
        // Never select sensitive fields directly
        session: {
          select: {
            sessionKey: true // Public identifier only
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.min(filters.limit || 50, 1000) // Limit result size
    });
  }

  // Raw queries when necessary (rarely)
  async getAggregatedStats(surveyId: string) {
    // Use Prisma.$queryRaw with proper parameterization
    return await prisma.$queryRaw`
      SELECT
        question_id,
        AVG((value->>'likert')::int) as avg_rating,
        COUNT(*) as response_count
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.survey_id = ${surveyId}
        AND value ? 'likert'
      GROUP BY question_id
    `;
  }
}
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  // Custom token validation for API endpoints
  value: (req) => {
    return req.headers['x-csrf-token'] ||
           req.body._csrf ||
           req.query._csrf;
  }
});

// Apply to state-changing operations
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Provide CSRF token to frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Content Security Policy

### CSP Headers
```typescript
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Needed for Next.js in development
    'https://apis.google.com', // OAuth
    'https://www.googletagmanager.com' // Analytics
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Needed for styled-components
    'https://fonts.googleapis.com'
  ],
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  imgSrc: [
    "'self'",
    'data:', // Base64 images
    'https://cdn.criticalaisurveys.com',
    'https://www.google-analytics.com'
  ],
  connectSrc: [
    "'self'",
    'https://api.criticalaisurveys.com',
    'wss://api.criticalaisurveys.com', // WebSocket
    'https://www.google-analytics.com'
  ],
  frameSrc: ["'none'"], // Prevent embedding
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"] // Prevent clickjacking
};

// Helmet middleware for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## Privacy Compliance

### GDPR Compliance

#### Data Processing Legal Basis
```typescript
enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

interface DataProcessingRecord {
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  retentionPeriod: string;
  dataSubjects: string[];
  recipients: string[];
  transfers: string[];
}

const processingActivities: DataProcessingRecord[] = [
  {
    purpose: 'Survey participation and response collection',
    legalBasis: LegalBasis.CONSENT,
    dataCategories: ['opinions', 'reasoning', 'demographic_data'],
    retentionPeriod: '2 years or until withdrawal of consent',
    dataSubjects: ['survey_participants'],
    recipients: ['survey_creators', 'researchers'],
    transfers: ['none']
  },
  {
    purpose: 'AI conversation facilitation',
    legalBasis: LegalBasis.CONSENT,
    dataCategories: ['conversation_transcripts', 'ai_interactions'],
    retentionPeriod: '1 year for quality improvement',
    dataSubjects: ['survey_participants'],
    recipients: ['ai_service_providers'],
    transfers: ['us_cloud_providers']
  }
];
```

#### Consent Management
```typescript
interface ConsentRecord {
  id: string;
  sessionId: string;
  consentVersion: string;
  purposes: string[];
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  withdrawnAt?: Date;
}

class ConsentManager {
  async recordConsent(sessionId: string, consent: ConsentData): Promise<void> {
    await prisma.consent.create({
      data: {
        sessionId,
        version: this.getCurrentConsentVersion(),
        purposes: consent.purposes,
        granted: consent.granted,
        metadata: {
          ipAddress: this.hashIP(consent.ipAddress),
          userAgent: consent.userAgent,
          timestamp: new Date()
        }
      }
    });
  }

  async withdrawConsent(sessionId: string, purpose?: string): Promise<void> {
    if (purpose) {
      // Withdraw specific purpose
      await prisma.consent.updateMany({
        where: { sessionId, purposes: { has: purpose } },
        data: {
          withdrawnAt: new Date(),
          granted: false
        }
      });
    } else {
      // Withdraw all consent
      await prisma.consent.updateMany({
        where: { sessionId },
        data: {
          withdrawnAt: new Date(),
          granted: false
        }
      });
    }

    // Trigger data deletion if required
    await this.handleConsentWithdrawal(sessionId, purpose);
  }

  async hasValidConsent(sessionId: string, purpose: string): Promise<boolean> {
    const consent = await prisma.consent.findFirst({
      where: {
        sessionId,
        purposes: { has: purpose },
        granted: true,
        withdrawnAt: null
      }
    });

    return consent !== null;
  }
}
```

#### Right to Deletion (Right to be Forgotten)
```typescript
class DataDeletionService {
  async deleteUserData(identifier: string, type: 'sessionId' | 'email'): Promise<DeletionReport> {
    const report: DeletionReport = {
      identifier,
      startTime: new Date(),
      deletedRecords: [],
      errors: []
    };

    try {
      // Find all related data
      const sessions = await this.findUserSessions(identifier, type);

      for (const session of sessions) {
        // Delete in dependency order
        await this.deleteResponses(session.id, report);
        await this.deleteChatHistory(session.id, report);
        await this.deleteVotes(session.id, report);
        await this.deleteConsents(session.id, report);
        await this.deleteSession(session.id, report);
      }

      // Remove from aggregated data where possible
      await this.removeFromAggregates(sessions.map(s => s.id), report);

      // Update analytics (decrement counts)
      await this.updateAnalyticsAfterDeletion(sessions, report);

    } catch (error) {
      report.errors.push({
        operation: 'data_deletion',
        error: error.message,
        timestamp: new Date()
      });
    }

    report.endTime = new Date();
    report.duration = report.endTime.getTime() - report.startTime.getTime();

    // Log deletion for audit
    await this.logDeletion(report);

    return report;
  }

  private async deleteResponses(sessionId: string, report: DeletionReport): Promise<void> {
    const deleted = await prisma.response.deleteMany({
      where: { sessionId }
    });

    report.deletedRecords.push({
      table: 'responses',
      count: deleted.count,
      timestamp: new Date()
    });
  }

  // Similar methods for other data types...
}
```

### CCPA Compliance

#### Consumer Rights Implementation
```typescript
class CCPAService {
  async handleConsumerRequest(request: ConsumerRequest): Promise<ConsumerResponse> {
    switch (request.type) {
      case 'RIGHT_TO_KNOW':
        return await this.provideDataReport(request.identifier);

      case 'RIGHT_TO_DELETE':
        return await this.deleteConsumerData(request.identifier);

      case 'RIGHT_TO_OPT_OUT':
        return await this.optOutOfSale(request.identifier);

      case 'RIGHT_TO_NON_DISCRIMINATION':
        return await this.ensureNonDiscrimination(request.identifier);

      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  async provideDataReport(identifier: string): Promise<DataReport> {
    const sessions = await this.findConsumerSessions(identifier);
    const report: DataReport = {
      categories: [],
      sources: [],
      businessPurposes: [],
      thirdParties: [],
      timeframe: 'Past 12 months'
    };

    // Collect personal information categories
    if (sessions.some(s => s.responses.length > 0)) {
      report.categories.push({
        category: 'Opinions and beliefs',
        examples: ['Survey responses', 'Reasoning explanations'],
        collected: true,
        sold: false,
        disclosed: false
      });
    }

    if (sessions.some(s => s.chatHistory.length > 0)) {
      report.categories.push({
        category: 'AI conversation data',
        examples: ['Chat messages', 'AI responses'],
        collected: true,
        sold: false,
        disclosed: true, // Shared with AI providers
        disclosedTo: ['AI service providers for processing only']
      });
    }

    return report;
  }
}
```

## Incident Response

### Security Incident Classification

```typescript
enum IncidentSeverity {
  LOW = 'low',           // Minor security events
  MEDIUM = 'medium',     // Potential security issues
  HIGH = 'high',         // Confirmed security breaches
  CRITICAL = 'critical'  // Severe data breaches
}

enum IncidentType {
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DDOS_ATTACK = 'ddos_attack',
  MALWARE = 'malware',
  INSIDER_THREAT = 'insider_threat',
  PRIVACY_VIOLATION = 'privacy_violation'
}

interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  detectedAt: Date;
  reportedBy: string;
  affectedSystems: string[];
  affectedUsers?: number;
  dataTypes?: string[];
  containmentActions: string[];
  status: 'open' | 'investigating' | 'contained' | 'resolved';
}
```

### Incident Response Playbook

#### Data Breach Response
```typescript
class IncidentResponseService {
  async handleDataBreach(incident: SecurityIncident): Promise<void> {
    // Immediate containment (0-1 hours)
    await this.immediateContainment(incident);

    // Assessment (1-4 hours)
    const assessment = await this.assessBreach(incident);

    // Notification (4-24 hours for severe breaches)
    if (assessment.severity >= IncidentSeverity.HIGH) {
      await this.notifyAuthorities(incident, assessment);
      await this.notifyAffectedUsers(incident, assessment);
    }

    // Remediation (ongoing)
    await this.remediateVulnerabilities(incident, assessment);

    // Recovery (ongoing)
    await this.recoverSystems(incident);

    // Lessons learned (post-incident)
    await this.conductPostMortem(incident);
  }

  private async immediateContainment(incident: SecurityIncident): Promise<void> {
    // Isolate affected systems
    if (incident.affectedSystems.includes('database')) {
      await this.rotateDBCredentials();
      await this.enableEmergencyReadOnlyMode();
    }

    if (incident.affectedSystems.includes('api')) {
      await this.enableRateLimitingEmergencyMode();
      await this.blockSuspiciousIPs();
    }

    // Revoke potentially compromised credentials
    await this.revokeActiveTokens();

    // Enable enhanced monitoring
    await this.enableEmergencyMonitoring();
  }

  private async notifyAuthorities(incident: SecurityIncident, assessment: BreachAssessment): Promise<void> {
    // GDPR: Notify supervisory authority within 72 hours
    if (assessment.affectsEUResidents) {
      await this.notifyGDPRAuthority(incident, assessment);
    }

    // CCPA: Notify California AG if required
    if (assessment.affectsCAResidents && assessment.severity === IncidentSeverity.CRITICAL) {
      await this.notifyCCPAAuthority(incident, assessment);
    }

    // Other applicable laws...
  }

  private async notifyAffectedUsers(incident: SecurityIncident, assessment: BreachAssessment): Promise<void> {
    const affectedSessions = await this.identifyAffectedSessions(incident);

    for (const session of affectedSessions) {
      if (session.email) {
        // Registered users
        await this.sendBreachNotificationEmail(session.email, incident, assessment);
      } else {
        // Anonymous users - display banner on next visit
        await this.scheduleAnonymousNotification(session.sessionKey, incident);
      }
    }
  }
}
```

### Breach Notification Templates

#### GDPR Breach Notification (Data Protection Authority)
```
Subject: Personal Data Breach Notification - Critical AI Surveys Platform

Dear Data Protection Officer,

We are writing to notify you of a personal data breach that occurred on our platform in accordance with Article 33 of the GDPR.

INCIDENT DETAILS:
- Date/Time of Breach: [timestamp]
- Date/Time Discovered: [timestamp]
- Nature of Breach: [description]
- Categories of Data Affected: [survey responses, AI conversations, etc.]
- Approximate Number of Data Subjects: [number]
- Approximate Number of Records: [number]

LIKELY CONSEQUENCES:
[Assessment of risks to individual rights and freedoms]

MEASURES TAKEN:
[Immediate containment actions, security improvements, user notifications]

CONTACT INFORMATION:
Data Protection Officer: [contact details]
Point of Contact: [contact details]

We will provide updates as our investigation continues and remain available for any questions or additional information required.

Sincerely,
Critical AI Surveys Security Team
```

#### User Breach Notification
```
Subject: Important Security Notice - Your Critical AI Surveys Data

Dear Participant,

We are writing to inform you of a security incident that may have affected your survey responses on our platform.

WHAT HAPPENED:
On [date], we discovered that [brief description of incident]. We immediately took action to secure our systems and launched an investigation.

WHAT INFORMATION WAS INVOLVED:
The incident may have affected [specific data types]. Your personal contact information was NOT involved in this incident.

WHAT WE'RE DOING:
- Secured the affected systems immediately
- Launched a comprehensive investigation
- Implemented additional security measures
- Notified law enforcement and regulatory authorities

WHAT YOU CAN DO:
- Your survey responses remain anonymous
- No action is required on your part
- If you have concerns, please contact us at security@criticalaisurveys.com

We sincerely apologize for this incident and any concern it may cause. Protecting your privacy and data is our highest priority.

For more information, visit: https://criticalaisurveys.com/security-notice

Critical AI Surveys Security Team
```

## Security Monitoring & Alerting

### Real-Time Monitoring
```typescript
class SecurityMonitor {
  private alerting: AlertingService;

  async detectAnomalies(): Promise<void> {
    // Check for unusual patterns
    await Promise.all([
      this.detectUnusualLoginPatterns(),
      this.detectSurveyManipulation(),
      this.detectDataExfiltration(),
      this.detectAIAbusePatterns(),
      this.detectInfrastructureAttacks()
    ]);
  }

  private async detectSurveyManipulation(): Promise<void> {
    // Check for coordinated response patterns
    const suspiciousPatterns = await prisma.$queryRaw`
      SELECT
        survey_id,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_responses,
        string_agg(DISTINCT value->>'justification', ' | ') as responses
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE r.created_at > NOW() - INTERVAL '1 hour'
      GROUP BY survey_id, value->>'likert'
      HAVING COUNT(*) > 50
        AND COUNT(DISTINCT session_id) < COUNT(*) * 0.8
        AND similarity(string_agg(value->>'justification', ' '), 'similar text') > 0.8
    `;

    for (const pattern of suspiciousPatterns) {
      await this.alerting.sendAlert({
        type: 'SURVEY_MANIPULATION',
        severity: IncidentSeverity.HIGH,
        description: `Potential coordinated response pattern detected in survey ${pattern.survey_id}`,
        metadata: pattern
      });
    }
  }

  private async detectDataExfiltration(): Promise<void> {
    // Monitor for unusual export patterns
    const exports = await prisma.export.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      include: {
        createdBy: true
      }
    });

    // Check for suspicious export behavior
    const userExportCounts = exports.reduce((acc, exp) => {
      acc[exp.createdBy.id] = (acc[exp.createdBy.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [userId, count] of Object.entries(userExportCounts)) {
      if (count > 10) { // More than 10 exports per hour
        await this.alerting.sendAlert({
          type: 'DATA_EXFILTRATION',
          severity: IncidentSeverity.MEDIUM,
          description: `User ${userId} created ${count} exports in the last hour`,
          metadata: { userId, exportCount: count }
        });
      }
    }
  }
}
```

This comprehensive security and privacy framework provides robust protection for the Critical AI Surveys platform while maintaining transparency and user trust. The multi-layered approach ensures defense in depth while complying with major privacy regulations and industry best practices.