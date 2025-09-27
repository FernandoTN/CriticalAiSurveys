# UX Design Guidelines

## Overview

The Critical AI Surveys platform prioritizes user-centered design that promotes thoughtful engagement, accessibility, and transparency. Our UX approach balances simplicity with sophistication, ensuring that complex deliberative processes feel natural and intuitive.

## Design Principles

### 1. Progressive Disclosure
- **Start Simple**: Begin with essential information and gradually reveal complexity
- **Contextual Help**: Provide guidance exactly when and where users need it
- **Scannable Content**: Use hierarchy, spacing, and typography to aid quick comprehension

### 2. Transparent AI Interaction
- **AI Clarity**: Always indicate when users are interacting with AI
- **Process Visibility**: Show how AI generates questions and responses
- **User Control**: Provide clear opt-out mechanisms and explanation of AI's role

### 3. Inclusive Design
- **Accessibility First**: Design for screen readers, keyboard navigation, and various abilities
- **Cultural Sensitivity**: Support multiple languages and cultural contexts
- **Low-Bandwidth Considerations**: Ensure functionality on slower connections

### 4. Trust and Safety
- **Privacy Indicators**: Clear communication about data collection and usage
- **Moderation Transparency**: Explain content policies and moderation processes
- **Safe Spaces**: Design interactions that encourage respectful dialogue

## User Personas & Journeys

### Primary Personas

#### Creator (Survey Designer)
**Background**: Academic researcher, policy maker, or organization leader
**Goals**:
- Create engaging surveys that generate high-quality responses
- Gather meaningful insights from participants
- Export data for analysis and reporting

**Pain Points**:
- Complex survey logic is hard to configure
- Difficulty ensuring participant engagement
- Need for sophisticated analytics

**Journey Map**:
1. **Discovery**: Learn about platform capabilities
2. **Onboarding**: Create account and first survey
3. **Design**: Build survey with questions and logic
4. **Test**: Preview and refine survey experience
5. **Launch**: Publish and share survey
6. **Monitor**: Track responses and engagement
7. **Analyze**: Review results and export data

#### Participant (Survey Taker)
**Background**: Diverse demographics, varying tech comfort levels
**Goals**:
- Share opinions in meaningful way
- Learn from AI conversation
- Contribute to research or decision-making

**Pain Points**:
- Survey fatigue from poor experiences
- Unclear purpose or value of participation
- Concerns about privacy and data use

**Journey Map**:
1. **Invitation**: Receive survey link or invitation
2. **Landing**: Understand survey purpose and commitment
3. **Consent**: Review privacy and provide consent
4. **Baseline**: Share initial opinion and reasoning
5. **Reflection**: Engage with AI to explore viewpoints
6. **Revision**: Optionally update initial response
7. **Community**: See others' opinions and vote on quality
8. **Synthesis**: Provide final opinion and feedback
9. **Results**: View aggregated findings (if permitted)

#### Researcher (Data Analyst)
**Background**: Academic, policy analyst, or data scientist
**Goals**:
- Access high-quality, analyzable datasets
- Understand AI's influence on responses
- Conduct reproducible research

**Pain Points**:
- Need for clean, well-documented data
- Ensuring ethical use of participant data
- Understanding AI bias and influence

## Participation Flow Design

### Step-by-Step Experience

#### Step 0: Landing & Consent
**Purpose**: Set expectations and obtain informed consent

**Design Elements**:
- Clear survey title and description
- Time estimate with breakdown by step
- Privacy notice with plain language
- Consent checkboxes with explanations
- Optional demographic questions

**UX Considerations**:
- Progress indicator showing "Step 0 of 7"
- Estimated time: "~15 minutes"
- Clear exit option: "You can leave at any time"

```
┌─────────────────────────────────────┐
│ [●○○○○○○] Climate Change Survey     │
│                                     │
│ Help us understand public opinion   │
│ on climate change through AI-       │
│ assisted reflection.                │
│                                     │
│ ⏱️ About 15 minutes                 │
│ 🤖 Includes AI conversation        │
│ 🔒 Your responses are anonymous     │
│                                     │
│ □ I consent to participate          │
│ □ I allow my data for research      │
│                                     │
│ [Start Survey] [Learn More]         │
└─────────────────────────────────────┘
```

#### Step 1: Baseline Opinion
**Purpose**: Capture initial thoughts before AI influence

**Design Elements**:
- Large, clear Likert scale with descriptive labels
- Character counter for text input (minimum 10 chars)
- Contextual help: "Share your honest initial thoughts"
- No option to proceed without completing required fields

**Accessibility**:
- ARIA labels for scale values
- Screen reader description: "Rate from 1 (Not at all concerned) to 5 (Extremely concerned)"
- High contrast colors and large touch targets

```
┌─────────────────────────────────────┐
│ [●●○○○○○] Step 1 of 7               │
│                                     │
│ How concerned are you about         │
│ climate change?                     │
│                                     │
│ ○────○────●────○────○               │
│ Not at    Moderately    Extremely  │
│ all                                 │
│                                     │
│ Please explain your reasoning:      │
│ ┌─────────────────────────────────┐ │
│ │ I think climate change is a     │ │
│ │ serious issue because...        │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 47 characters (min: 10)             │
│                                     │
│ [Continue] ────────────────── [Exit] │
└─────────────────────────────────────┘
```

#### Step 2: AI Conversation
**Purpose**: Facilitate deeper reflection through Socratic dialogue

**Design Elements**:
- Chat interface with clear AI/user distinction
- Persona selector: "Choose your AI conversation partner"
- Token/cost counter (transparent about AI usage)
- Progress indicator: "Turn 2 of 3 minimum"
- Streaming responses with typing indicators

**AI Personas**:
- **Socratic Questioner**: Asks probing questions about assumptions
- **Ethical Critic**: Explores moral implications and tradeoffs
- **Technical Expert**: Discusses feasibility and practical constraints
- **Devil's Advocate**: Presents counterarguments respectfully

**Trust Indicators**:
- "This AI is designed to help you think deeper, not change your mind"
- "You can opt out of this conversation at any time"
- "Your responses to AI are private unless you choose to share"

```
┌─────────────────────────────────────┐
│ [●●●○○○○] Step 2 of 7               │
│                                     │
│ 🤖 Conversation with Socratic AI    │
│ Turn 2 of 3 (minimum)               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ You: I think we need immediate  │ │
│ │ action on climate policies...   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖: That's interesting. What    │ │
│ │ specific trade-offs would you   │ │
│ │ be willing to accept to...      │ │
│ │ ▋                               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Type your response...               │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Send] [Skip AI] ────────── [Help] │
└─────────────────────────────────────┘
```

#### Step 3: Reflection & Edit
**Purpose**: Allow opinion revision based on AI conversation

**Design Elements**:
- Side-by-side comparison of original and revised responses
- Clear indication that editing is optional
- Character limit with visual feedback
- "What changed your mind?" prompt for significant changes

```
┌─────────────────────────────────────┐
│ [●●●●○○○] Step 3 of 7               │
│                                     │
│ Reflect & Revise (Optional)         │
│                                     │
│ Your original response:             │
│ ┌─────────────────────────────────┐ │
│ │ I think climate change is a     │ │
│ │ serious issue because...        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Revised response (200 char max):    │
│ ┌─────────────────────────────────┐ │
│ │ After considering the economic  │ │
│ │ tradeoffs, I still believe...   │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 156/200 characters                  │
│                                     │
│ ✓ Keep original  📝 Use revision    │
│                                     │
│ [Continue] ────────────────── [Back] │
└─────────────────────────────────────┘
```

#### Step 4: Opinion Distribution
**Purpose**: Show aggregate responses for context

**Design Elements**:
- Real-time histogram with smooth animations
- User's response highlighted with distinct color
- Anonymous aggregation with privacy protection
- "Not enough responses yet" state for small samples

**Privacy Features**:
- Minimum threshold before showing distribution
- k-anonymity protection (no buckets with <3 responses)
- Clear labeling: "Based on X anonymous responses"

```
┌─────────────────────────────────────┐
│ [●●●●●○○] Step 4 of 7               │
│                                     │
│ How Others Responded                │
│ Based on 247 anonymous responses    │
│                                     │
│    67│ ████████████                │
│      │                             │
│    45│ ████████                    │
│      │                             │
│    28│ █████                       │
│      │                             │
│    12│ ██                          │
│      │                             │
│     0│──────────────────────────── │
│      1    2    3    4    5          │
│                 ↑                   │
│              Your response          │
│                                     │
│ Most people share your level of     │
│ concern about climate change.       │
│                                     │
│ [Continue] ────────────────── [Back] │
└─────────────────────────────────────┘
```

#### Step 5: Peer Evaluation
**Purpose**: Evaluate quality of others' reasoning

**Design Elements**:
- Paginated comments with clear attribution (anonymous)
- Multiple voting options: Approve, Disapprove, Pass, Quality
- Progress tracking: "3 of 10 votes required"
- Rate limiting to prevent spam
- Quality rubric accessible via help

**Voting Interface**:
- Large, accessible buttons
- Clear consequences: "This helps surface high-quality responses"
- Option to explain vote (optional)

```
┌─────────────────────────────────────┐
│ [●●●●●●○] Step 5 of 7               │
│                                     │
│ Evaluate Peer Responses             │
│ Progress: 3 of 10 votes needed      │
│                                     │
│ Anonymous Response #47:             │
│ ┌─────────────────────────────────┐ │
│ │ "Climate change is urgent but   │ │
│ │ we must balance environmental   │ │
│ │ protection with economic needs  │ │
│ │ of working families..."         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ How would you rate this response?   │
│                                     │
│ [👍 Approve] [👎 Disapprove]       │
│ [⚡ High Quality] [↪️ Pass]          │
│                                     │
│ ─────────────────────────────────── │
│ 4 more responses to review...       │
│                                     │
│ [Skip Voting] ──────────── [Help] │
└─────────────────────────────────────┘
```

#### Step 6: Final Opinion
**Purpose**: Capture refined opinion after full experience

**Design Elements**:
- Second Likert scale to measure opinion shift
- Final comment field with character limit
- Comparison with initial response (optional)
- "What influenced your thinking?" prompt

```
┌─────────────────────────────────────┐
│ [●●●●●●●] Step 6 of 7               │
│                                     │
│ Your Final Opinion                  │
│                                     │
│ After this experience, how          │
│ concerned are you about climate     │
│ change?                             │
│                                     │
│ ○────○────○────●────○               │
│ Not at    Moderately    Extremely  │
│ all                                 │
│                                     │
│ Your initial rating: 3              │
│ ↗️ Your opinion shifted slightly higher │
│                                     │
│ Final thoughts (200 char max):      │
│ ┌─────────────────────────────────┐ │
│ │ The AI conversation helped me   │ │
│ │ consider economic tradeoffs...  │ │
│ └─────────────────────────────────┘ │
│ 134/200 characters                  │
│                                     │
│ [Continue] ────────────────── [Back] │
└─────────────────────────────────────┘
```

#### Step 7: Platform Feedback
**Purpose**: Gather insights for platform improvement

**Design Elements**:
- Experience rating with emoji scale
- Open feedback field
- Specific questions about AI interaction
- Optional contact for follow-up research

```
┌─────────────────────────────────────┐
│ [●●●●●●●] Step 7 of 7               │
│                                     │
│ How was your experience?            │
│                                     │
│ 😫 😕 😐 😊 🤩                      │
│         ↑                           │
│                                     │
│ The AI conversation was:            │
│ ○ Very helpful  ○ Somewhat helpful  │
│ ○ Not helpful   ○ Distracting       │
│                                     │
│ Any suggestions for improvement?    │
│ ┌─────────────────────────────────┐ │
│ │ The peer voting section could   │ │
│ │ be clearer about...             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ □ Contact me about participating    │
│   in future research                │
│                                     │
│ [Submit Survey] ─────────── [Back] │
└─────────────────────────────────────┘
```

## Survey Builder Interface

### Design Philosophy
- **Visual First**: Drag-and-drop interface with live preview
- **Progressive Complexity**: Start with basic questions, add logic as needed
- **Template Library**: Pre-built survey templates for common use cases
- **Collaboration**: Real-time collaboration for team survey building

### Key Components

#### Question Builder
```
┌─────────────────────────────────────┐
│ Question Types                      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │📊   │ │☑️   │ │📝   │ │⭐   │     │
│ │Likert│ │Multi│ │Text │ │NPS  │     │
│ └─────┘ └─────┘ └─────┘ └─────┘     │
│                                     │
│ Question Text:                      │
│ ┌─────────────────────────────────┐ │
│ │ How concerned are you about...  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🤖 AI Suggestions:                  │
│ • "What specific aspects concern..." │
│ • "How would you rank the urgency..." │
│                                     │
│ [⚙️ Advanced Options] [👁️ Preview]    │
└─────────────────────────────────────┘
```

#### Logic Builder
Visual flow chart for skip logic and branching:

```
┌─────────────────────────────────────┐
│ Survey Flow                         │
│                                     │
│ [Q1: Concern Level] ────────────────┐│
│         │                          ││
│         ├─ If 1-2 → [Q2: Barriers] ││
│         ├─ If 3-4 → [Q3: Solutions]││
│         └─ If 5   → [Q4: Urgency]  ││
│                                     │
│ [+ Add Logic] [🔗 Connect Questions] │
└─────────────────────────────────────┘
```

## Accessibility Standards

### WCAG 2.2 AA Compliance

#### Visual Design
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Clear, high-contrast focus rings on all interactive elements
- **Text Sizing**: Responsive text that scales up to 200% without horizontal scrolling
- **Color Independence**: Never rely solely on color to convey information

#### Keyboard Navigation
- **Tab Order**: Logical sequence through all interactive elements
- **Escape Routes**: Clear way to exit or go back from any state
- **Shortcuts**: Skip links and keyboard shortcuts for efficiency
- **No Keyboard Traps**: Users can always navigate away from any element

#### Screen Reader Support
- **Semantic HTML**: Proper headings, landmarks, and ARIA roles
- **Alt Text**: Descriptive alternative text for all images and charts
- **Live Regions**: Announce dynamic content changes
- **Form Labels**: Clear, descriptive labels for all inputs

### Internationalization (i18n)

#### Language Support
- **Primary Languages**: English, Spanish, French, German, Japanese, Chinese
- **RTL Support**: Proper layout for Arabic, Hebrew, and other RTL languages
- **Cultural Adaptation**: Culturally appropriate examples and metaphors

#### Technical Implementation
- **ICU MessageFormat**: For complex pluralization and formatting
- **Unicode Support**: Full UTF-8 character set support
- **Locale Detection**: Automatic language detection with manual override
- **Fallback Strategy**: Graceful degradation to English when translations unavailable

## Responsive Design

### Breakpoint Strategy
```css
/* Mobile First Approach */
.container {
  /* Base styles for mobile (320px+) */
}

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (min-width: 1440px) {
  /* Large desktop styles */
}
```

### Mobile-Specific Considerations
- **Touch Targets**: Minimum 44px × 44px for all interactive elements
- **Thumb-Friendly**: Important actions within thumb reach on large phones
- **Offline Support**: Service worker for basic functionality without internet
- **Performance**: Optimized for 3G connections and limited data plans

## Animation & Micro-interactions

### Animation Principles
- **Purposeful**: Every animation should have a clear functional purpose
- **Respectful**: Honor `prefers-reduced-motion` setting
- **Fast**: Keep animations under 300ms for responsiveness
- **Natural**: Use easing that feels physically plausible

### Key Animations
```css
/* Real-time chart updates */
.chart-bar {
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Chat message appearance */
.message-enter {
  animation: slideUp 0.3s ease-out;
}

/* Progress indicator */
.progress-fill {
  transition: width 0.4s ease-in-out;
}

/* Respectful motion reduction */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Error States & Feedback

### Error Message Hierarchy
1. **Inline Validation**: Immediate feedback on form inputs
2. **Field-Level Errors**: Specific issues with individual fields
3. **Form-Level Errors**: Issues with entire form submission
4. **Page-Level Errors**: Major system or connectivity issues

### Error Message Guidelines
- **Be Specific**: "Email address is required" not "Invalid input"
- **Be Helpful**: Suggest solutions when possible
- **Be Human**: Use conversational tone, avoid technical jargon
- **Be Accessible**: Properly announce errors to screen readers

```
┌─────────────────────────────────────┐
│ ⚠️ Unable to Save Response           │
│                                     │
│ It looks like your internet         │
│ connection was interrupted.         │
│                                     │
│ Your progress has been saved        │
│ locally. Try again or continue      │
│ when reconnected.                   │
│                                     │
│ [Try Again] [Continue Offline]      │
└─────────────────────────────────────┘
```

## Performance Guidelines

### Loading States
- **Skeleton Screens**: Show content structure while loading
- **Progressive Loading**: Load critical content first
- **Optimistic Updates**: Show expected results immediately
- **Meaningful Placeholders**: Context-appropriate loading messages

### Performance Targets
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Design System Components

### Color Palette
```scss
// Primary Colors
$primary-blue: #2563eb;
$primary-blue-light: #3b82f6;
$primary-blue-dark: #1d4ed8;

// Semantic Colors
$success-green: #10b981;
$warning-amber: #f59e0b;
$error-red: #ef4444;
$info-cyan: #06b6d4;

// Neutral Colors
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-500: #6b7280;
$gray-900: #111827;

// AI Conversation Colors
$ai-message: #8b5cf6;
$user-message: #2563eb;
$highlight: #fbbf24;
```

### Typography Scale
```scss
// Font Stack
$font-family-sans: 'Inter', system-ui, sans-serif;
$font-family-mono: 'JetBrains Mono', monospace;

// Type Scale
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
$text-4xl: 2.25rem;   // 36px
```

### Component Library Structure
```
components/
├── ui/                     # Base components
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Toast/
├── survey/                 # Survey-specific
│   ├── QuestionCard/
│   ├── LikertScale/
│   ├── ProgressBar/
│   └── SubmissionReview/
├── chat/                   # AI conversation
│   ├── ChatInterface/
│   ├── MessageBubble/
│   ├── PersonaSelector/
│   └── TokenCounter/
└── charts/                 # Data visualization
    ├── OpinionHistogram/
    ├── EngagementMetrics/
    └── ResponseTimeline/
```

This comprehensive UX guide ensures consistent, accessible, and user-centered design across the entire Critical AI Surveys platform, supporting both the complexity of deliberative processes and the simplicity needed for broad participation.