# API Specification

## Overview

The Critical AI Surveys API provides RESTful endpoints for managing surveys, handling responses, facilitating AI conversations, and generating analytics. The API follows OpenAPI 3.0 specifications and includes real-time capabilities through WebSocket connections.

## Base Configuration

**Base URL:** `https://api.criticalaisurveys.com/v1`
**Authentication:** Bearer JWT tokens
**Content-Type:** `application/json`
**Rate Limiting:** 100 requests per minute per IP

## Authentication

### Session Management

#### Create Anonymous Session
```http
POST /auth/session
Content-Type: application/json

{
  "surveyId": "uuid",
  "locale": "en"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "sessionKey": "ABC123XYZ", // 8-character display ID
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

#### Create Authenticated Session
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "redirectUrl": "https://app.example.com/callback"
}
```

**Response:**
```json
{
  "message": "Magic link sent to email",
  "sessionId": "uuid"
}
```

#### Verify Magic Link
```http
GET /auth/verify?token=jwt_token&sessionId=uuid
```

**Response:**
```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "creator"
  }
}
```

### OAuth Integration

#### Initiate OAuth Flow
```http
GET /auth/oauth/{provider}?redirectUrl=https://app.example.com/callback
```

**Supported Providers:** `google`, `github`, `microsoft`

## Survey Management

### Create Survey
```http
POST /surveys
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Climate Change Opinions",
  "description": "A survey about climate change perspectives",
  "settings": {
    "visibility": "public",
    "allowAnonymous": true,
    "requireMinAge": 18,
    "enableAI": true,
    "locale": "en"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "slug": "climate-change-opinions-2024",
  "title": "Climate Change Opinions",
  "status": "draft",
  "createdAt": "2024-01-01T12:00:00Z",
  "createdBy": "uuid"
}
```

### Get Survey
```http
GET /surveys/{id}
Authorization: Bearer {token} // Optional for public surveys
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Climate Change Opinions",
  "description": "A survey about climate change perspectives",
  "status": "published",
  "visibility": "public",
  "questions": [
    {
      "id": "uuid",
      "type": "likert",
      "title": "How concerned are you about climate change?",
      "options": {
        "scale": [1, 2, 3, 4, 5],
        "labels": ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
      },
      "validation": {
        "required": true
      },
      "order": 1
    }
  ],
  "settings": {
    "enableAI": true,
    "personas": ["socratic", "ethical_critic"],
    "minAITurns": 3
  }
}
```

### Update Survey
```http
PATCH /surveys/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Survey Title",
  "questions": [
    {
      "id": "existing-uuid", // Update existing
      "title": "Updated question text"
    },
    {
      "type": "free_text", // Add new
      "title": "What are your thoughts?",
      "order": 2
    }
  ]
}
```

### Publish Survey
```http
POST /surveys/{id}/publish
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "version": 2,
  "publishedAt": "2024-01-01T12:00:00Z",
  "shareUrl": "https://surveys.example.com/s/climate-change-opinions-2024"
}
```

## Survey Participation

### Start Survey Session
```http
POST /surveys/{id}/sessions
Content-Type: application/json

{
  "sessionKey": "ABC123XYZ", // From anonymous session
  "locale": "en"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "currentStep": 1,
  "totalSteps": 7,
  "questions": [
    {
      "id": "uuid",
      "type": "likert",
      "title": "How concerned are you about climate change?",
      "options": {
        "scale": [1, 2, 3, 4, 5],
        "labels": ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
      }
    }
  ]
}
```

### Submit Response
```http
POST /surveys/{id}/responses
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "questionId": "uuid",
  "value": {
    "likert": 4,
    "justification": "Climate change is a serious threat that requires immediate action..."
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "value": {
    "likert": 4,
    "justification": "Climate change is a serious threat..."
  },
  "submittedAt": "2024-01-01T12:00:00Z",
  "nextStep": 2
}
```

### Update Response (Edit Flow)
```http
PATCH /surveys/{id}/responses/{responseId}
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "value": {
    "likert": 5,
    "justification": "After reflection, I believe climate change is an even more urgent issue..."
  },
  "editReason": "post_ai_conversation"
}
```

## AI Conversation

### Start AI Chat
```http
POST /surveys/{id}/chat
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "persona": "socratic",
  "initialContext": {
    "questionId": "uuid",
    "userResponse": "Climate change is a serious threat..."
  }
}
```

**Response:**
```json
{
  "chatId": "uuid",
  "persona": "socratic",
  "initialMessage": "That's an interesting perspective. Can you help me understand what specific aspects of climate change concern you most?",
  "tokenBudget": {
    "used": 45,
    "remaining": 955,
    "limit": 1000
  }
}
```

### Send Chat Message
```http
POST /surveys/{id}/chat/{chatId}/messages
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "message": "I'm most concerned about rising sea levels affecting coastal cities.",
  "turnIndex": 1
}
```

**Response (Server-Sent Events):**
```
event: message_start
data: {"messageId": "uuid", "estimatedTokens": 50}

event: content_delta
data: {"delta": "That's a valid concern. Rising"}

event: content_delta
data: {"delta": " sea levels could indeed affect millions"}

event: message_complete
data: {
  "messageId": "uuid",
  "content": "That's a valid concern. Rising sea levels could indeed affect millions of people. Have you considered what trade-offs might be necessary to address this issue effectively?",
  "tokensUsed": 47,
  "turnIndex": 2,
  "conversationComplete": false
}
```

### Get Chat History
```http
GET /surveys/{id}/chat/{chatId}/history
Authorization: Bearer {sessionToken}
```

**Response:**
```json
{
  "chatId": "uuid",
  "persona": "socratic",
  "messages": [
    {
      "turnIndex": 1,
      "userMessage": "I'm most concerned about rising sea levels...",
      "aiResponse": "That's a valid concern. Rising sea levels could indeed...",
      "timestamp": "2024-01-01T12:00:00Z",
      "tokensUsed": 47
    }
  ],
  "totalTokens": 234,
  "conversationComplete": true
}
```

## Real-Time Data

### Get Opinion Distribution
```http
GET /surveys/{id}/distribution/{questionId}
Authorization: Bearer {sessionToken}
```

**Response:**
```json
{
  "questionId": "uuid",
  "type": "likert",
  "distribution": {
    "1": 12,
    "2": 28,
    "3": 45,
    "4": 67,
    "5": 89
  },
  "userResponse": 4,
  "totalResponses": 241,
  "lastUpdated": "2024-01-01T12:00:00Z"
}
```

### WebSocket Real-Time Updates
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.criticalaisurveys.com/ws');

// Join survey room
ws.send(JSON.stringify({
  type: 'join_survey',
  payload: {
    surveyId: 'uuid',
    sessionId: 'uuid'
  }
}));

// Listen for updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'distribution_update':
      // { questionId, bucket, newCount, totalResponses }
      break;
    case 'new_comment':
      // { responseId, preview, voteCounts }
      break;
    case 'participant_count':
      // { activeParticipants, totalParticipants }
      break;
  }
};
```

## Peer Voting

### Submit Vote
```http
POST /surveys/{id}/votes
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "responseId": "uuid",
  "voteType": "approve", // approve, disapprove, pass, quality
  "reason": "Well-reasoned argument with good evidence"
}
```

**Response:**
```json
{
  "voteId": "uuid",
  "responseId": "uuid",
  "voteType": "approve",
  "voteCounts": {
    "approve": 15,
    "disapprove": 3,
    "pass": 2,
    "quality": 12
  },
  "userVotesRemaining": 2,
  "submittedAt": "2024-01-01T12:00:00Z"
}
```

### Get Voting Queue
```http
GET /surveys/{id}/voting-queue
Authorization: Bearer {sessionToken}
Query Parameters:
  - page: 1
  - limit: 10
  - sort: random|newest|most_voted
```

**Response:**
```json
{
  "responses": [
    {
      "id": "uuid",
      "questionId": "uuid",
      "preview": "Climate change requires immediate action because...",
      "voteCounts": {
        "approve": 8,
        "disapprove": 2,
        "pass": 1,
        "quality": 6
      },
      "userHasVoted": false,
      "submittedAt": "2024-01-01T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "hasNext": true
  },
  "userVotingProgress": {
    "votesSubmitted": 8,
    "minimumRequired": 10,
    "remainingToUnlock": 2
  }
}
```

## Analytics & Reporting

### Get Survey Analytics
```http
GET /surveys/{id}/analytics
Authorization: Bearer {token}
Query Parameters:
  - timeRange: 1d|7d|30d|all
  - segments: age_group,completion_status
```

**Response:**
```json
{
  "overview": {
    "totalResponses": 1250,
    "completionRate": 0.73,
    "averageTimeToComplete": 1200, // seconds
    "dropOffByStep": {
      "1": 0.05,
      "2": 0.12,
      "3": 0.08,
      "4": 0.15,
      "5": 0.07,
      "6": 0.03,
      "7": 0.02
    }
  },
  "responses": {
    "byQuestion": [
      {
        "questionId": "uuid",
        "type": "likert",
        "distribution": {
          "1": 89,
          "2": 156,
          "3": 298,
          "4": 445,
          "5": 262
        },
        "average": 3.67,
        "stdDev": 1.12
      }
    ]
  },
  "aiEngagement": {
    "averageTurns": 4.2,
    "completionRate": 0.89,
    "topPersonas": [
      {"persona": "socratic", "usage": 0.45},
      {"persona": "ethical_critic", "usage": 0.35}
    ],
    "averageCostPerConversation": 0.12
  },
  "peerVoting": {
    "participationRate": 0.67,
    "averageVotesPerUser": 8.3,
    "qualityDistribution": {
      "high": 0.34,
      "medium": 0.51,
      "low": 0.15
    }
  }
}
```

### Generate AI Summary
```http
POST /surveys/{id}/ai-summary
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "thematic_analysis", // thematic_analysis, argument_mapping, consensus_areas
  "filters": {
    "questionIds": ["uuid1", "uuid2"],
    "minVoteQuality": 3
  }
}
```

**Response:**
```json
{
  "summaryId": "uuid",
  "type": "thematic_analysis",
  "status": "processing", // processing, completed, failed
  "estimatedCompletion": "2024-01-01T12:05:00Z"
}
```

### Get AI Summary Result
```http
GET /surveys/{id}/ai-summary/{summaryId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "summaryId": "uuid",
  "type": "thematic_analysis",
  "status": "completed",
  "result": {
    "themes": [
      {
        "title": "Economic Concerns",
        "description": "Participants frequently mentioned economic impacts of climate policies",
        "prevalence": 0.42,
        "keyQuotes": [
          "The cost of transition might hurt working families...",
          "We need green jobs to replace fossil fuel employment..."
        ],
        "sentiment": "mixed"
      }
    ],
    "polarization": {
      "level": "moderate",
      "keyDivisions": [
        "Individual vs. systemic responsibility",
        "Economic costs vs. environmental benefits"
      ]
    },
    "consensusAreas": [
      "Need for cleaner energy sources",
      "Importance of international cooperation"
    ],
    "generatedAt": "2024-01-01T12:05:30Z",
    "confidence": 0.87
  }
}
```

## Data Export

### Create Export
```http
POST /surveys/{id}/exports
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "csv", // csv, json, xlsx
  "includeFields": [
    "responses",
    "chat_transcripts",
    "vote_data",
    "demographics"
  ],
  "filters": {
    "completedOnly": true,
    "anonymize": true,
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  },
  "researchPurpose": "Academic study on deliberative democracy"
}
```

**Response:**
```json
{
  "exportId": "uuid",
  "status": "queued", // queued, processing, completed, failed
  "estimatedSize": "15.6 MB",
  "estimatedCompletion": "2024-01-01T12:10:00Z"
}
```

### Get Export Status
```http
GET /surveys/{id}/exports/{exportId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "exportId": "uuid",
  "status": "completed",
  "fileSize": "14.2 MB",
  "downloadUrl": "https://exports.criticalaisurveys.com/download/uuid?token=signed_token",
  "expiresAt": "2024-01-08T12:05:30Z",
  "metadata": {
    "totalRecords": 1250,
    "anonymizedFields": ["ip_address", "user_agent"],
    "datasetVersion": "1.0",
    "schemaVersion": "2024-01"
  }
}
```

## Content Moderation

### Submit Content for Review
```http
POST /moderation/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetType": "response", // response, chat_message
  "targetId": "uuid",
  "content": "This is potentially problematic content...",
  "reason": "user_report", // auto_scan, user_report, quality_check
  "reportedBy": "uuid" // optional, for user reports
}
```

**Response:**
```json
{
  "flagId": "uuid",
  "status": "pending", // pending, approved, rejected, escalated
  "severity": "medium", // low, medium, high, critical
  "automatedCheck": {
    "toxicityScore": 0.23,
    "piiDetected": false,
    "languageRisk": "low"
  },
  "queuePosition": 15
}
```

### Get Moderation Queue (Moderators)
```http
GET /moderation/queue
Authorization: Bearer {moderator_token}
Query Parameters:
  - status: pending|escalated
  - severity: low|medium|high|critical
  - limit: 20
```

**Response:**
```json
{
  "items": [
    {
      "flagId": "uuid",
      "targetType": "response",
      "content": "[REDACTED CONTENT]",
      "reason": "user_report",
      "severity": "medium",
      "automatedCheck": {
        "toxicityScore": 0.67,
        "concerns": ["potential_harassment", "personal_attack"]
      },
      "context": {
        "surveyTitle": "Climate Change Opinions",
        "questionText": "What are your thoughts on...",
        "reportCount": 3
      },
      "submittedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "hasNext": true
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ],
    "requestId": "uuid",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Valid authentication token required |
| `AUTHORIZATION_DENIED` | 403 | Insufficient permissions for this action |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SURVEY_NOT_ACCESSIBLE` | 403 | Survey privacy settings prevent access |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `CHAT_LIMIT_EXCEEDED` | 429 | AI conversation limits reached |
| `MODERATION_REQUIRED` | 423 | Content pending moderation review |
| `EXPORT_IN_PROGRESS` | 409 | Export already in progress |
| `INSUFFICIENT_RESPONSES` | 422 | Not enough data for requested operation |

## Rate Limiting

### Default Limits
- **General API**: 100 requests per minute
- **Chat API**: 10 messages per minute
- **Export API**: 5 requests per hour
- **Analytics API**: 30 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
X-RateLimit-RetryAfter: 60
```

## Webhook Events

### Survey Events
```json
{
  "event": "survey.published",
  "data": {
    "surveyId": "uuid",
    "title": "Climate Change Opinions",
    "publishedAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0"
}
```

### Response Events
```json
{
  "event": "response.submitted",
  "data": {
    "surveyId": "uuid",
    "sessionId": "uuid",
    "questionId": "uuid",
    "responseId": "uuid",
    "step": "final_submission"
  },
  "timestamp": "2024-01-01T12:05:00Z",
  "version": "1.0"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { CriticalAISurveysClient } from '@critical-ai-surveys/sdk';

const client = new CriticalAISurveysClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.criticalaisurveys.com/v1'
});

// Create survey
const survey = await client.surveys.create({
  title: 'My Survey',
  questions: [
    {
      type: 'likert',
      title: 'How do you feel about this?',
      options: { scale: [1, 2, 3, 4, 5] }
    }
  ]
});

// Start AI conversation
const chat = await client.chat.start({
  surveyId: survey.id,
  persona: 'socratic',
  sessionToken: sessionToken
});

// Stream responses
for await (const chunk of chat.sendMessage('I think this is important because...')) {
  console.log(chunk.delta);
}
```

### Python
```python
from critical_ai_surveys import Client

client = Client(
    api_key="your-api-key",
    base_url="https://api.criticalaisurveys.com/v1"
)

# Get survey analytics
analytics = client.surveys.get_analytics(
    survey_id="uuid",
    time_range="30d",
    segments=["completion_status"]
)

# Export data
export = client.exports.create(
    survey_id="uuid",
    format="csv",
    include_fields=["responses", "chat_transcripts"]
)

# Wait for completion and download
export.wait_for_completion()
export.download("survey_data.csv")
```

This API specification provides a comprehensive foundation for building integrations with the Critical AI Surveys platform, supporting all major use cases from survey creation to data analysis and export.