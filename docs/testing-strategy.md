# Testing Strategy

## Overview

The Critical AI Surveys platform requires comprehensive testing to ensure reliability, security, accessibility, and user experience quality. Our testing strategy covers multiple levels and types of testing, from unit tests to human evaluations of AI interactions.

## Testing Philosophy

### Core Principles

1. **Shift-Left Testing**: Catch issues early in the development cycle
2. **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
3. **Risk-Based Testing**: Focus testing efforts on high-risk areas
4. **Continuous Testing**: Automated testing in CI/CD pipeline
5. **User-Centric Testing**: Always consider real user scenarios

### Quality Gates

- **Code Coverage**: Minimum 80% for critical paths, 70% overall
- **Performance**: All API endpoints < 200ms p95, UI interactions < 100ms
- **Accessibility**: WCAG 2.2 AA compliance
- **Security**: Zero high-severity vulnerabilities
- **AI Quality**: Human evaluation scores > 4.0/5.0

## Test Levels

### Unit Testing

#### Frontend (React/Next.js)
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LikertScale } from '../components/LikertScale';

describe('LikertScale Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all scale points with correct labels', () => {
    render(
      <LikertScale
        min={1}
        max={5}
        labels={['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Not at all (1)')).toBeInTheDocument();
    expect(screen.getByLabelText('Extremely (5)')).toBeInTheDocument();
  });

  it('calls onChange with correct value when scale point is selected', async () => {
    const user = userEvent.setup();

    render(
      <LikertScale
        min={1}
        max={5}
        labels={['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByLabelText('Very (4)'));

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('is accessible via keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <LikertScale
        min={1}
        max={5}
        labels={['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']}
        onChange={mockOnChange}
      />
    );

    // Tab to first option
    await user.tab();
    expect(screen.getByLabelText('Not at all (1)')).toHaveFocus();

    // Use arrow keys to navigate
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByLabelText('Moderately (3)')).toHaveFocus();

    // Select with space
    await user.keyboard(' ');
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('displays validation error when required and no value selected', () => {
    render(
      <LikertScale
        min={1}
        max={5}
        labels={['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']}
        onChange={mockOnChange}
        required
        error="Please select a rating"
      />
    );

    expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });
});

// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useSurveyProgress } from '../hooks/useSurveyProgress';

describe('useSurveyProgress Hook', () => {
  it('calculates progress correctly', () => {
    const { result } = renderHook(() =>
      useSurveyProgress({
        totalSteps: 7,
        currentStep: 3,
        completedSteps: [1, 2]
      })
    );

    expect(result.current.progressPercentage).toBe(42.86); // 3/7 * 100
    expect(result.current.isStepAccessible(4)).toBe(false);
    expect(result.current.isStepAccessible(3)).toBe(true);
  });

  it('handles step navigation correctly', () => {
    const { result } = renderHook(() =>
      useSurveyProgress({
        totalSteps: 7,
        currentStep: 3,
        completedSteps: [1, 2]
      })
    );

    act(() => {
      result.current.completeStep(3);
    });

    expect(result.current.completedSteps).toContain(3);
    expect(result.current.isStepAccessible(4)).toBe(true);
  });
});
```

#### Backend (Node.js/TypeScript)
```typescript
// Service layer testing
import { SurveyService } from '../services/SurveyService';
import { prismaMock } from '../test/setup';

describe('SurveyService', () => {
  let surveyService: SurveyService;

  beforeEach(() => {
    surveyService = new SurveyService();
  });

  describe('createSurvey', () => {
    it('creates a survey with valid data', async () => {
      const surveyData = {
        title: 'Climate Change Survey',
        description: 'A survey about climate change opinions',
        questions: [
          {
            type: 'likert',
            title: 'How concerned are you about climate change?',
            options: { scale: [1, 2, 3, 4, 5] }
          }
        ]
      };

      const expectedSurvey = {
        id: 'survey-id',
        slug: 'climate-change-survey',
        ...surveyData,
        status: 'draft',
        createdAt: new Date()
      };

      prismaMock.survey.create.mockResolvedValue(expectedSurvey);

      const result = await surveyService.createSurvey(surveyData, 'user-id');

      expect(result).toEqual(expectedSurvey);
      expect(prismaMock.survey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: surveyData.title,
          description: surveyData.description,
          createdBy: 'user-id',
          status: 'draft'
        })
      });
    });

    it('throws error for invalid survey data', async () => {
      const invalidData = {
        title: '', // Empty title
        questions: [] // No questions
      };

      await expect(
        surveyService.createSurvey(invalidData, 'user-id')
      ).rejects.toThrow('Survey must have a title and at least one question');
    });

    it('generates unique slug for duplicate titles', async () => {
      prismaMock.survey.findFirst
        .mockResolvedValueOnce({ slug: 'test-survey' }) // First check finds existing
        .mockResolvedValueOnce(null); // Second check with suffix is unique

      prismaMock.survey.create.mockResolvedValue({
        id: 'new-id',
        slug: 'test-survey-2',
        title: 'Test Survey'
      });

      const result = await surveyService.createSurvey({
        title: 'Test Survey',
        questions: [{ type: 'likert', title: 'Question' }]
      }, 'user-id');

      expect(result.slug).toBe('test-survey-2');
    });
  });

  describe('getPublicSurvey', () => {
    it('returns public survey without sensitive data', async () => {
      const mockSurvey = {
        id: 'survey-id',
        title: 'Public Survey',
        visibility: 'public',
        questions: [{ id: 'q1', title: 'Question 1' }],
        createdBy: 'creator-id',
        apiKey: 'secret-key' // Should be filtered out
      };

      prismaMock.survey.findFirst.mockResolvedValue(mockSurvey);

      const result = await surveyService.getPublicSurvey('survey-id');

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('createdBy');
      expect(result).toHaveProperty('title', 'Public Survey');
    });

    it('throws error for private survey', async () => {
      prismaMock.survey.findFirst.mockResolvedValue(null);

      await expect(
        surveyService.getPublicSurvey('private-survey-id')
      ).rejects.toThrow('Survey not found or not accessible');
    });
  });
});

// API endpoint testing
import request from 'supertest';
import { app } from '../app';
import { createTestUser, createTestSurvey } from '../test/helpers';

describe('Survey API Endpoints', () => {
  describe('POST /api/surveys', () => {
    it('creates survey with valid authentication', async () => {
      const user = await createTestUser({ role: 'creator' });
      const token = generateTestToken(user);

      const surveyData = {
        title: 'Test Survey',
        questions: [
          {
            type: 'likert',
            title: 'Test Question',
            options: { scale: [1, 2, 3, 4, 5] }
          }
        ]
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send(surveyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Survey');
      expect(response.body.status).toBe('draft');
    });

    it('returns 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/surveys')
        .send({ title: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('validates survey data', async () => {
      const user = await createTestUser({ role: 'creator' });
      const token = generateTestToken(user);

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Invalid: empty title
          questions: [] // Invalid: no questions
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.stringContaining('required')
          })
        ])
      );
    });

    it('applies rate limiting', async () => {
      const user = await createTestUser({ role: 'creator' });
      const token = generateTestToken(user);

      // Make requests up to the limit
      const requests = Array(101).fill(0).map(() =>
        request(app)
          .post('/api/surveys')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Test Survey',
            questions: [{ type: 'likert', title: 'Question' }]
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Testing

#### Database Integration
```typescript
// Database integration tests
import { PrismaClient } from '@prisma/client';
import { SurveyService } from '../services/SurveyService';
import { ResponseService } from '../services/ResponseService';

describe('Survey-Response Integration', () => {
  let prisma: PrismaClient;
  let surveyService: SurveyService;
  let responseService: ResponseService;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } }
    });
    await prisma.$connect();

    surveyService = new SurveyService(prisma);
    responseService = new ResponseService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.response.deleteMany();
    await prisma.surveyQuestion.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('completes full survey participation flow', async () => {
    // 1. Create user and survey
    const user = await prisma.user.create({
      data: {
        email: 'creator@test.com',
        role: 'creator'
      }
    });

    const survey = await surveyService.createSurvey({
      title: 'Integration Test Survey',
      questions: [
        {
          type: 'likert',
          title: 'How do you feel about this test?',
          options: { scale: [1, 2, 3, 4, 5] },
          validation: { required: true }
        },
        {
          type: 'free_text',
          title: 'Why do you feel this way?',
          validation: { minLength: 10 }
        }
      ]
    }, user.id);

    await surveyService.publishSurvey(survey.id, user.id);

    // 2. Create anonymous session
    const session = await prisma.session.create({
      data: {
        surveyId: survey.id,
        sessionKey: 'TEST123',
        locale: 'en'
      }
    });

    // 3. Submit responses
    const likertResponse = await responseService.submitResponse({
      sessionId: session.id,
      questionId: survey.questions[0].id,
      value: { likert: 4 }
    });

    const textResponse = await responseService.submitResponse({
      sessionId: session.id,
      questionId: survey.questions[1].id,
      value: { text: 'This integration test is working well!' }
    });

    // 4. Verify responses are stored correctly
    const storedResponses = await prisma.response.findMany({
      where: { sessionId: session.id },
      include: { question: true }
    });

    expect(storedResponses).toHaveLength(2);
    expect(storedResponses[0].value).toEqual({ likert: 4 });
    expect(storedResponses[1].value).toEqual({ text: 'This integration test is working well!' });

    // 5. Verify aggregates are updated
    const aggregates = await prisma.aggregate.findMany({
      where: { surveyId: survey.id }
    });

    expect(aggregates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metricType: 'histogram',
          bucket: '4',
          value: 1
        })
      ])
    );
  });

  it('handles concurrent response submissions correctly', async () => {
    const survey = await createTestSurvey();
    const sessions = await Promise.all(
      Array(10).fill(0).map(() =>
        prisma.session.create({
          data: {
            surveyId: survey.id,
            sessionKey: generateSessionKey()
          }
        })
      )
    );

    // Submit responses concurrently
    const responsePromises = sessions.map(session =>
      responseService.submitResponse({
        sessionId: session.id,
        questionId: survey.questions[0].id,
        value: { likert: Math.floor(Math.random() * 5) + 1 }
      })
    );

    const responses = await Promise.all(responsePromises);

    // Verify all responses were saved
    expect(responses).toHaveLength(10);
    responses.forEach(response => {
      expect(response).toHaveProperty('id');
      expect(response.value.likert).toBeGreaterThanOrEqual(1);
      expect(response.value.likert).toBeLessThanOrEqual(5);
    });

    // Verify aggregates are correct
    const totalResponses = await prisma.response.count({
      where: {
        session: { surveyId: survey.id }
      }
    });

    expect(totalResponses).toBe(10);
  });
});
```

#### AI Service Integration
```typescript
// AI service integration tests
import { ChatService } from '../services/ChatService';
import { OpenAIProvider } from '../providers/OpenAIProvider';

describe('AI Chat Integration', () => {
  let chatService: ChatService;
  let mockAIProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    mockAIProvider = {
      generateResponse: jest.fn(),
      estimateTokens: jest.fn(),
      getProviderName: jest.fn().mockReturnValue('openai')
    };

    chatService = new ChatService(mockAIProvider);
  });

  it('maintains conversation context across multiple turns', async () => {
    const sessionId = 'test-session';
    const persona = 'socratic';

    mockAIProvider.generateResponse
      .mockResolvedValueOnce({
        content: 'What aspects of this issue concern you most?',
        tokensUsed: 25,
        finishReason: 'stop'
      })
      .mockResolvedValueOnce({
        content: 'Have you considered the potential trade-offs?',
        tokensUsed: 30,
        finishReason: 'stop'
      });

    // First turn
    const turn1 = await chatService.sendMessage({
      sessionId,
      persona,
      message: 'I think climate change is a serious issue.',
      turnIndex: 1
    });

    expect(turn1.content).toBe('What aspects of this issue concern you most?');

    // Second turn
    const turn2 = await chatService.sendMessage({
      sessionId,
      persona,
      message: 'Rising sea levels and extreme weather events.',
      turnIndex: 2
    });

    expect(turn2.content).toBe('Have you considered the potential trade-offs?');

    // Verify conversation history is maintained
    const history = await chatService.getConversationHistory(sessionId);
    expect(history.messages).toHaveLength(2);
    expect(history.totalTokens).toBe(55);
  });

  it('handles AI provider errors gracefully', async () => {
    mockAIProvider.generateResponse.mockRejectedValue(
      new Error('AI service temporarily unavailable')
    );

    await expect(
      chatService.sendMessage({
        sessionId: 'test-session',
        persona: 'socratic',
        message: 'Test message',
        turnIndex: 1
      })
    ).rejects.toThrow('AI conversation temporarily unavailable');

    // Verify error is logged but doesn't crash the system
    const conversation = await chatService.getConversationHistory('test-session');
    expect(conversation.messages).toHaveLength(0);
    expect(conversation.errorCount).toBe(1);
  });

  it('enforces token limits per conversation', async () => {
    const sessionId = 'test-session';

    // Mock responses that would exceed token limit
    mockAIProvider.generateResponse.mockResolvedValue({
      content: 'Response that would exceed limit',
      tokensUsed: 1500, // Exceeds typical per-turn limit
      finishReason: 'length'
    });

    await expect(
      chatService.sendMessage({
        sessionId,
        persona: 'socratic',
        message: 'Very long message that would cause token limit to be exceeded',
        turnIndex: 1
      })
    ).rejects.toThrow('Token limit exceeded');
  });
});
```

### End-to-End Testing

#### Playwright E2E Tests
```typescript
// e2e/survey-participation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Survey Participation Flow', () => {
  test('complete anonymous survey participation', async ({ page }) => {
    // Navigate to survey
    await page.goto('/s/test-climate-survey');

    // Consent page
    await expect(page.locator('h1')).toContainText('Climate Change Survey');
    await expect(page.locator('[data-testid=time-estimate]')).toContainText('~15 minutes');

    await page.check('[data-testid=consent-checkbox]');
    await page.click('[data-testid=start-survey-button]');

    // Step 1: Baseline opinion
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 1 of 7');
    await expect(page.locator('[data-testid=question-title]')).toContainText('How concerned are you about climate change?');

    // Select Likert scale value
    await page.click('[data-testid=likert-option-4]');
    await expect(page.locator('[data-testid=likert-option-4]')).toBeChecked();

    // Enter justification
    await page.fill('[data-testid=justification-input]',
      'Climate change poses significant risks to future generations and requires immediate action.');

    await expect(page.locator('[data-testid=char-counter]')).toContainText('97 characters');

    await page.click('[data-testid=continue-button]');

    // Step 2: AI Conversation
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 2 of 7');
    await expect(page.locator('[data-testid=chat-interface]')).toBeVisible();

    // Select AI persona
    await page.click('[data-testid=persona-socratic]');
    await expect(page.locator('[data-testid=persona-socratic]')).toHaveClass(/selected/);

    // Wait for initial AI message
    await expect(page.locator('[data-testid=ai-message]').first()).toBeVisible();
    await expect(page.locator('[data-testid=ai-message]').first()).toContainText('interesting');

    // Engage in conversation (3 turns minimum)
    for (let turn = 1; turn <= 3; turn++) {
      await page.fill('[data-testid=chat-input]',
        `This is my response for turn ${turn}. I think we need to consider economic impacts.`);

      await page.click('[data-testid=send-message-button]');

      // Wait for AI response
      await page.waitForSelector(`[data-testid=ai-message]:nth-child(${turn * 2})`,
        { state: 'visible' });

      // Check turn counter
      await expect(page.locator('[data-testid=turn-counter]')).toContainText(`Turn ${turn}`);
    }

    // Continue button should be enabled after 3 turns
    await expect(page.locator('[data-testid=continue-button]')).toBeEnabled();
    await page.click('[data-testid=continue-button]');

    // Step 3: Reflection
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 3 of 7');
    await expect(page.locator('[data-testid=original-response]')).toContainText('immediate action');

    // Optional revision
    await page.fill('[data-testid=revision-input]',
      'After the AI conversation, I still believe climate action is urgent, but I now better understand the economic complexities involved.');

    await expect(page.locator('[data-testid=char-counter]')).toContainText('140/200');

    await page.click('[data-testid=use-revision-button]');
    await page.click('[data-testid=continue-button]');

    // Step 4: Opinion Distribution
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 4 of 7');
    await expect(page.locator('[data-testid=opinion-chart]')).toBeVisible();

    // Check that user's response is highlighted
    await expect(page.locator('[data-testid=user-response-indicator]')).toBeVisible();
    await expect(page.locator('[data-testid=response-count]')).toContainText('responses');

    await page.click('[data-testid=continue-button]');

    // Step 5: Peer Evaluation
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 5 of 7');
    await expect(page.locator('[data-testid=voting-progress]')).toContainText('0 of');

    // Vote on peer responses
    const votingRounds = 5; // Vote on 5 responses
    for (let i = 0; i < votingRounds; i++) {
      await expect(page.locator('[data-testid=peer-response]')).toBeVisible();

      // Randomly approve or rate quality
      const voteType = i % 2 === 0 ? 'approve-button' : 'quality-button';
      await page.click(`[data-testid=${voteType}]`);

      // Wait for next response to load
      if (i < votingRounds - 1) {
        await page.waitForTimeout(500); // Brief pause for loading
      }
    }

    await expect(page.locator('[data-testid=voting-progress]')).toContainText(`${votingRounds} of`);
    await page.click('[data-testid=continue-button]');

    // Step 6: Final Opinion
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 6 of 7');
    await expect(page.locator('[data-testid=initial-rating]')).toContainText('4');

    // Final Likert rating
    await page.click('[data-testid=likert-option-5]'); // Slight shift upward

    // Final comment
    await page.fill('[data-testid=final-comment]',
      'The conversation helped me appreciate both the urgency and complexity of climate action.');

    await page.click('[data-testid=continue-button]');

    // Step 7: Platform Feedback
    await expect(page.locator('[data-testid=progress-indicator]')).toContainText('Step 7 of 7');

    // Experience rating
    await page.click('[data-testid=experience-rating-4]'); // Good experience

    // AI feedback
    await page.click('[data-testid=ai-helpful-yes]');

    // Optional suggestions
    await page.fill('[data-testid=suggestions-input]',
      'The peer voting could be improved with better explanation of the criteria.');

    await page.click('[data-testid=continue-button]');

    // Review & Submit
    await expect(page.locator('[data-testid=review-summary]')).toBeVisible();
    await expect(page.locator('[data-testid=summary-initial-rating]')).toContainText('4');
    await expect(page.locator('[data-testid=summary-final-rating]')).toContainText('5');

    // Final submission
    await page.click('[data-testid=submit-survey-button]');

    // Thank you page
    await expect(page.locator('h1')).toContainText('Thank you');
    await expect(page.locator('[data-testid=completion-message]')).toBeVisible();
    await expect(page.locator('[data-testid=results-link]')).toBeVisible();
  });

  test('handles survey with insufficient responses for distribution', async ({ page }) => {
    // Test scenario where < 2 responses exist
    await page.goto('/s/new-survey-no-responses');

    // ... navigate through steps 1-3 ...

    // Step 4: Should show "not enough responses" state
    await expect(page.locator('[data-testid=insufficient-responses]')).toBeVisible();
    await expect(page.locator('[data-testid=insufficient-responses]')).toContainText('not enough responses');

    // Chart should not be visible
    await expect(page.locator('[data-testid=opinion-chart]')).not.toBeVisible();
  });

  test('accessibility: keyboard navigation through survey', async ({ page }) => {
    await page.goto('/s/test-climate-survey');

    // Tab through consent form
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=consent-checkbox]')).toBeFocused();

    await page.keyboard.press('Space'); // Check consent
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=start-survey-button]')).toBeFocused();

    await page.keyboard.press('Enter'); // Start survey

    // Keyboard navigation on Likert scale
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=likert-option-1]')).toBeFocused();

    // Arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid=likert-option-3]')).toBeFocused();

    await page.keyboard.press('Space'); // Select option
    await expect(page.locator('[data-testid=likert-option-3]')).toBeChecked();
  });

  test('mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/s/test-climate-survey');

    // Check mobile-specific elements
    await expect(page.locator('[data-testid=mobile-progress-bar]')).toBeVisible();

    // Ensure touch targets are appropriately sized
    const likertButtons = await page.locator('[data-testid^=likert-option]').all();
    for (const button of likertButtons) {
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }

    // Test mobile-specific interactions
    await page.tap('[data-testid=likert-option-4]');
    await expect(page.locator('[data-testid=likert-option-4]')).toBeChecked();
  });
});

// e2e/survey-builder.spec.ts
test.describe('Survey Builder', () => {
  test('create and publish survey', async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'creator@test.com');
    await page.click('[data-testid=send-magic-link]');

    // Simulate magic link verification
    await page.goto('/auth/verify?token=test-token');
    await expect(page.locator('[data-testid=login-success]')).toBeVisible();

    // Navigate to survey builder
    await page.goto('/create');
    await expect(page.locator('h1')).toContainText('Create Survey');

    // Basic survey info
    await page.fill('[data-testid=survey-title]', 'Test Survey Creation');
    await page.fill('[data-testid=survey-description]',
      'This is a test survey created through E2E testing.');

    // Add Likert question
    await page.click('[data-testid=add-question-button]');
    await page.click('[data-testid=question-type-likert]');

    await page.fill('[data-testid=question-title]', 'How satisfied are you with our service?');
    await page.selectOption('[data-testid=likert-scale]', '5');

    // Add free text question
    await page.click('[data-testid=add-question-button]');
    await page.click('[data-testid=question-type-text]');

    await page.fill('[data-testid=question-title]', 'What improvements would you suggest?');
    await page.fill('[data-testid=text-min-length]', '20');

    // Configure survey settings
    await page.click('[data-testid=survey-settings-tab]');
    await page.selectOption('[data-testid=visibility-select]', 'public');
    await page.check('[data-testid=enable-ai-checkbox]');

    // Preview survey
    await page.click('[data-testid=preview-button]');
    await expect(page.locator('[data-testid=survey-preview]')).toBeVisible();
    await expect(page.locator('[data-testid=preview-question-1]')).toContainText('satisfied');

    await page.click('[data-testid=close-preview]');

    // Publish survey
    await page.click('[data-testid=publish-button]');
    await expect(page.locator('[data-testid=publish-success]')).toBeVisible();

    // Verify survey URL is generated
    await expect(page.locator('[data-testid=survey-url]')).toContainText('/s/test-survey-creation');
  });
});
```

### Performance Testing

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  variables:
    surveyId: "test-survey-id"

scenarios:
  - name: "Survey Participation Flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/session"
          json:
            surveyId: "{{ surveyId }}"
          capture:
            - json: "$.sessionId"
              as: "sessionId"
            - json: "$.sessionKey"
              as: "sessionKey"

      - get:
          url: "/api/surveys/{{ surveyId }}"
          headers:
            Authorization: "Bearer {{ sessionId }}"

      - post:
          url: "/api/surveys/{{ surveyId }}/responses"
          headers:
            Authorization: "Bearer {{ sessionId }}"
          json:
            questionId: "q1"
            value:
              likert: 4
              justification: "This is a test response for load testing purposes."

      - post:
          url: "/api/surveys/{{ surveyId }}/chat"
          headers:
            Authorization: "Bearer {{ sessionId }}"
          json:
            persona: "socratic"
            message: "I think this issue is important because of various factors."
            turnIndex: 1

  - name: "Real-time Updates"
    weight: 20
    flow:
      - get:
          url: "/api/surveys/{{ surveyId }}/distribution/q1"
          headers:
            Authorization: "Bearer {{ sessionId }}"

  - name: "Analytics Dashboard"
    weight: 10
    flow:
      - get:
          url: "/api/surveys/{{ surveyId }}/analytics"
          headers:
            Authorization: "Bearer {{ creatorToken }}"
```

#### Database Performance Testing
```typescript
// performance/database.test.ts
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

describe('Database Performance', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('aggregates responses within acceptable time limits', async () => {
    // Create test data: 10,000 responses
    const survey = await createTestSurvey();
    const sessions = await createTestSessions(1000, survey.id);

    await Promise.all(
      sessions.flatMap(session =>
        survey.questions.map(question =>
          prisma.response.create({
            data: {
              sessionId: session.id,
              questionId: question.id,
              value: { likert: Math.floor(Math.random() * 5) + 1 }
            }
          })
        )
      )
    );

    // Test aggregation query performance
    const startTime = performance.now();

    const aggregates = await prisma.$queryRaw`
      SELECT
        question_id,
        (value->>'likert')::int as bucket,
        COUNT(*)::int as count
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.survey_id = ${survey.id}
        AND value ? 'likert'
      GROUP BY question_id, bucket
      ORDER BY question_id, bucket
    `;

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500); // Should complete within 500ms
    expect(aggregates).toHaveLength(survey.questions.length * 5); // 5 buckets per question
  });

  it('handles concurrent response submissions efficiently', async () => {
    const survey = await createTestSurvey();
    const sessions = await createTestSessions(100, survey.id);

    const startTime = performance.now();

    // Simulate 100 concurrent users submitting responses
    const submissions = sessions.map(session =>
      prisma.response.create({
        data: {
          sessionId: session.id,
          questionId: survey.questions[0].id,
          value: { likert: Math.floor(Math.random() * 5) + 1 }
        }
      })
    );

    await Promise.all(submissions);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

    // Verify all responses were created
    const responseCount = await prisma.response.count({
      where: {
        session: { surveyId: survey.id }
      }
    });

    expect(responseCount).toBe(100);
  });
});
```

### Security Testing

#### Security Test Suite
```typescript
// security/vulnerabilities.test.ts
import request from 'supertest';
import { app } from '../app';

describe('Security Vulnerabilities', () => {
  describe('SQL Injection Prevention', () => {
    it('prevents SQL injection in survey queries', async () => {
      const maliciousInput = "'; DROP TABLE surveys; --";

      const response = await request(app)
        .get(`/api/surveys/${maliciousInput}`)
        .expect(400);

      expect(response.body.error).toContain('Invalid survey ID format');

      // Verify surveys table still exists
      const surveys = await request(app)
        .get('/api/surveys')
        .expect(200);

      expect(Array.isArray(surveys.body)).toBe(true);
    });

    it('sanitizes user input in responses', async () => {
      const sessionToken = await createTestSession();
      const survey = await createTestSurvey();

      const maliciousInput = {
        questionId: survey.questions[0].id,
        value: {
          justification: "<script>alert('XSS')</script>'; DROP TABLE responses; --"
        }
      };

      const response = await request(app)
        .post(`/api/surveys/${survey.id}/responses`)
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(maliciousInput)
        .expect(201);

      // Verify input was sanitized
      expect(response.body.value.justification).not.toContain('<script>');
      expect(response.body.value.justification).not.toContain('DROP TABLE');
    });
  });

  describe('XSS Prevention', () => {
    it('sanitizes HTML in survey titles', async () => {
      const creatorToken = await createTestCreatorToken();

      const maliciousTitle = '<img src=x onerror="alert(\'XSS\')">';

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: maliciousTitle,
          questions: [{ type: 'likert', title: 'Test' }]
        })
        .expect(201);

      expect(response.body.title).not.toContain('<img');
      expect(response.body.title).not.toContain('onerror');
    });
  });

  describe('CSRF Protection', () => {
    it('requires CSRF token for state-changing operations', async () => {
      const creatorToken = await createTestCreatorToken();

      // Request without CSRF token should fail
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Test Survey',
          questions: [{ type: 'likert', title: 'Test' }]
        })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    it('accepts valid CSRF token', async () => {
      const creatorToken = await createTestCreatorToken();

      // Get CSRF token
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      const csrfToken = csrfResponse.body.csrfToken;

      // Use CSRF token in request
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Test Survey',
          questions: [{ type: 'likert', title: 'Test' }]
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits on API endpoints', async () => {
      const requests = Array(110).fill(0).map(() =>
        request(app).get('/api/surveys')
      );

      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('has stricter rate limits for chat endpoints', async () => {
      const sessionToken = await createTestSession();
      const survey = await createTestSurvey();

      const requests = Array(15).fill(0).map(() =>
        request(app)
          .post(`/api/surveys/${survey.id}/chat`)
          .set('Authorization', `Bearer ${sessionToken}`)
          .send({
            persona: 'socratic',
            message: 'Test message',
            turnIndex: 1
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(rateLimitedCount).toBeGreaterThan(5); // More restrictive than general API
    });
  });
});
```

### Accessibility Testing

#### Automated Accessibility Testing
```typescript
// accessibility/a11y.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('survey participation meets WCAG 2.2 AA standards', async ({ page }) => {
    await page.goto('/s/test-survey');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('survey builder is accessible', async ({ page }) => {
    await loginAsCreator(page);
    await page.goto('/create');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('#monaco-editor') // Exclude third-party editor
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works throughout application', async ({ page }) => {
    await page.goto('/s/test-survey');

    // Test tab order
    const focusableElements = [
      '[data-testid=consent-checkbox]',
      '[data-testid=start-survey-button]'
    ];

    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(focusableElements[i])).toBeFocused();
    }
  });

  test('screen reader announces dynamic content changes', async ({ page }) => {
    await page.goto('/s/test-survey');

    // Enable live region monitoring
    await page.addInitScript(() => {
      window.ariaLiveAnnouncements = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.getAttribute('aria-live')) {
            window.ariaLiveAnnouncements.push(mutation.target.textContent);
          }
        });
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
      });
    });

    // Navigate through survey steps
    await page.check('[data-testid=consent-checkbox]');
    await page.click('[data-testid=start-survey-button]');

    // Verify announcements were made
    const announcements = await page.evaluate(() => window.ariaLiveAnnouncements);
    expect(announcements).toContain('Step 1 of 7: Baseline Opinion');
  });
});
```

### AI Quality Testing

#### Human Evaluation Framework
```typescript
// ai-evaluation/human-eval.test.ts
interface HumanEvaluationCriteria {
  relevance: number;        // 1-5: How relevant are AI questions to the topic?
  neutrality: number;       // 1-5: How neutral/unbiased are AI responses?
  engagement: number;       // 1-5: How engaging is the conversation?
  depth: number;           // 1-5: How well does AI promote deeper thinking?
  clarity: number;         // 1-5: How clear and understandable are AI messages?
}

interface EvaluationResult {
  conversationId: string;
  evaluatorId: string;
  criteria: HumanEvaluationCriteria;
  overallScore: number;
  comments: string;
  timestamp: Date;
}

class AIQualityEvaluator {
  async generateTestConversations(count: number): Promise<string[]> {
    const conversationIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const sessionId = `eval-session-${i}`;
      const conversationId = await this.createTestConversation(sessionId, {
        initialResponse: this.getRandomInitialResponse(),
        persona: this.getRandomPersona(),
        turns: 3
      });

      conversationIds.push(conversationId);
    }

    return conversationIds;
  }

  async evaluateConversation(
    conversationId: string,
    evaluatorId: string
  ): Promise<EvaluationResult> {
    // This would be implemented as a web interface for human evaluators
    // For testing, we simulate evaluation scores
    const criteria: HumanEvaluationCriteria = {
      relevance: Math.random() * 2 + 3, // 3-5 range (mostly good)
      neutrality: Math.random() * 2 + 3,
      engagement: Math.random() * 2 + 3,
      depth: Math.random() * 2 + 3,
      clarity: Math.random() * 2 + 3
    };

    const overallScore = Object.values(criteria).reduce((a, b) => a + b) / 5;

    return {
      conversationId,
      evaluatorId,
      criteria,
      overallScore,
      comments: 'Automated evaluation for testing',
      timestamp: new Date()
    };
  }

  async analyzeEvaluationResults(results: EvaluationResult[]): Promise<QualityReport> {
    const averageScores = {
      relevance: this.calculateAverage(results.map(r => r.criteria.relevance)),
      neutrality: this.calculateAverage(results.map(r => r.criteria.neutrality)),
      engagement: this.calculateAverage(results.map(r => r.criteria.engagement)),
      depth: this.calculateAverage(results.map(r => r.criteria.depth)),
      clarity: this.calculateAverage(results.map(r => r.criteria.clarity)),
      overall: this.calculateAverage(results.map(r => r.overallScore))
    };

    return {
      totalEvaluations: results.length,
      averageScores,
      qualityThreshold: 4.0,
      meetsThreshold: averageScores.overall >= 4.0,
      recommendations: this.generateRecommendations(averageScores)
    };
  }

  private generateRecommendations(scores: any): string[] {
    const recommendations: string[] = [];

    if (scores.relevance < 4.0) {
      recommendations.push('Improve AI question relevance by refining persona prompts');
    }
    if (scores.neutrality < 4.0) {
      recommendations.push('Review AI responses for bias and adjust training data');
    }
    if (scores.engagement < 4.0) {
      recommendations.push('Enhance conversation flow and question variety');
    }
    if (scores.depth < 4.0) {
      recommendations.push('Strengthen Socratic questioning techniques');
    }
    if (scores.clarity < 4.0) {
      recommendations.push('Simplify AI language and improve response structure');
    }

    return recommendations;
  }
}

describe('AI Conversation Quality', () => {
  let evaluator: AIQualityEvaluator;

  beforeAll(() => {
    evaluator = new AIQualityEvaluator();
  });

  it('maintains quality standards across different topics', async () => {
    const topics = [
      'climate change',
      'healthcare policy',
      'economic inequality',
      'technology ethics',
      'education reform'
    ];

    const results: EvaluationResult[] = [];

    for (const topic of topics) {
      const conversations = await evaluator.generateTestConversations(10);

      for (const conversationId of conversations) {
        const evaluation = await evaluator.evaluateConversation(
          conversationId,
          'test-evaluator'
        );
        results.push(evaluation);
      }
    }

    const qualityReport = await evaluator.analyzeEvaluationResults(results);

    expect(qualityReport.meetsThreshold).toBe(true);
    expect(qualityReport.averageScores.overall).toBeGreaterThanOrEqual(4.0);
  });

  it('detects bias in AI responses', async () => {
    const biasTestCases = [
      {
        topic: 'political candidates',
        expectedNeutrality: 4.5
      },
      {
        topic: 'controversial social issues',
        expectedNeutrality: 4.0
      }
    ];

    for (const testCase of biasTestCases) {
      const conversations = await evaluator.generateTestConversations(20);
      const evaluations = await Promise.all(
        conversations.map(id =>
          evaluator.evaluateConversation(id, 'bias-evaluator')
        )
      );

      const averageNeutrality = evaluations
        .map(e => e.criteria.neutrality)
        .reduce((a, b) => a + b) / evaluations.length;

      expect(averageNeutrality).toBeGreaterThanOrEqual(testCase.expectedNeutrality);
    }
  });
});
```

## Test Automation & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: |
          timeout 60 bash -c 'until nc -z localhost 5432; do sleep 1; done'
          timeout 60 bash -c 'until nc -z localhost 6379; do sleep 1; done'

      - name: Run integration tests
        run: npm run test:integration

      - name: Stop test environment
        run: docker-compose -f docker-compose.test.yml down

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start:test &

      - name: Wait for application
        run: timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript, javascript

      - name: Run security tests
        run: npm run test:security

  accessibility-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build and start application
        run: |
          npm run build
          npm run start:test &

      - name: Wait for application
        run: timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

      - name: Run accessibility tests
        run: npm run test:a11y

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Artillery
        run: npm install -g artillery

      - name: Start application
        run: npm run start:test &

      - name: Wait for application
        run: timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

      - name: Run performance tests
        run: artillery run performance/load-test.yml

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.json
```

### Test Configuration Files

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/setup-unit.ts'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/test/**'
      ]
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.test.{ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
      globalSetup: '<rootDir>/test/global-setup.ts',
      globalTeardown: '<rootDir>/test/global-teardown.ts'
    }
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: 'npm run start:test',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

This comprehensive testing strategy ensures the Critical AI Surveys platform maintains high quality, security, and accessibility standards throughout development and deployment.