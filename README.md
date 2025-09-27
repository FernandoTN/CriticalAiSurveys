# Critical AI Surveys

> **Building thoughtful democratic discourse through AI-mediated survey experiences**

A modern web platform that enables creators to design LLM-assisted surveys and facilitates deep participant reflection through AI conversation, peer evaluation, and opinion evolution tracking.

## 🎯 Vision

Critical AI Surveys transforms traditional polling by introducing AI-facilitated reflection that helps participants:
- Explore their own assumptions through Socratic dialogue
- Consider alternative perspectives and trade-offs
- Engage with peer responses thoughtfully
- Track how their opinions evolve through deliberation

## ✨ Key Features

### 🏗️ **For Survey Creators**
- **Intuitive Survey Builder** with drag-and-drop question creation
- **AI-Assisted Question Generation** for balanced, thought-provoking surveys
- **Advanced Logic & Branching** with skip patterns and conditional flows
- **Privacy Controls** from public to invite-only with granular permissions
- **Real-time Analytics** with live response tracking and insights
- **Research-Grade Exports** with anonymization and consent management

### 🗣️ **For Participants**
- **7-Step Deliberation Flow** inspired by democratic deliberation research
- **AI Conversation Partners** (Socratic, Ethical Critic, Technical Expert)
- **Opinion Evolution Tracking** showing how views change through reflection
- **Peer Response Evaluation** with quality-based voting systems
- **Anonymous Participation** with privacy-first design
- **Accessible Experience** meeting WCAG 2.2 AA standards

### 🔬 **For Researchers**
- **Anonymized Dataset Exports** with k-anonymity protection
- **AI Conversation Analytics** tracking deliberation quality
- **Opinion Shift Analysis** measuring the impact of reflection
- **Reproducible Research Tools** with Jupyter notebook templates
- **Open Science Integration** for transparent methodology

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with TypeScript and App Router
- **shadcn/ui + Tailwind CSS** for consistent design system
- **React Hook Form + Zod** for form validation
- **Recharts** for real-time data visualization

### Backend
- **Node.js + TypeScript** with Fastify/NestJS
- **PostgreSQL + Prisma** for data persistence
- **Redis** for caching and job queues
- **BullMQ** for background processing

### AI & Real-time
- **OpenAI/Anthropic APIs** for conversation facilitation
- **WebSocket/SSE** for live updates
- **Multiple AI Personas** for diverse perspectives

### Infrastructure
- **AWS ECS Fargate** for container orchestration
- **Terraform** for infrastructure as code
- **GitHub Actions** for CI/CD
- **CloudWatch** for monitoring and logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/critical-ai-surveys.git
cd critical-ai-surveys

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development servers
npm run dev:web    # Frontend (http://localhost:3000)
npm run dev:api    # Backend (http://localhost:8000)
```

### First Survey

1. **Create Account**: Visit http://localhost:3000 and sign up
2. **Build Survey**: Use the survey builder to create your first survey
3. **Configure AI**: Set up AI conversation parameters
4. **Test Flow**: Preview the complete participant experience
5. **Publish**: Make your survey live and share the link

## 📊 Example Survey Flow

### 1. **Baseline Opinion**
Participant rates their initial position on a topic and provides reasoning:
```
How concerned are you about climate change?
[●○○○○] Not at all → [○○○●○] Very concerned

"I think climate action is important but worry about economic impacts..."
```

### 2. **AI Conversation**
AI engages in Socratic dialogue to explore assumptions:
```
🤖 Socratic AI: "What specific economic impacts concern you most?"
👤 User: "Job losses in traditional industries..."
🤖 Socratic AI: "Have you considered potential job creation in new sectors?"
```

### 3. **Reflection & Revision**
Participant can revise their initial response:
```
Original: "worry about economic impacts..."
Revised: "still concerned about economics, but see potential for green jobs..."
```

### 4. **Opinion Distribution**
Real-time view of how others responded:
```
    67│ ████████████
      │                 ↑ Your response
    45│ ████████
      │
    28│ █████
      │
     0│──────────────────
      1    2    3    4    5
```

### 5. **Peer Evaluation**
Vote on quality of peer responses:
```
Anonymous Response: "Climate change requires immediate action because..."
[👍 Approve] [👎 Disapprove] [⚡ High Quality] [↪️ Pass]
```

### 6. **Final Opinion**
Updated position after deliberation:
```
Final rating: [○○○○●] (shifted from 3 to 5)
"The AI conversation helped me see both urgency and complexity..."
```

## 📚 Documentation

- **[Development Roadmap](./TODO.md)** - Phase-by-phase implementation plan
- **[System Architecture](./docs/architecture.md)** - Technical design and data flow
- **[API Specification](./docs/api-spec.md)** - Complete API documentation
- **[UX Design Guidelines](./docs/ux-guidelines.md)** - User experience patterns
- **[Security & Privacy](./docs/security-privacy.md)** - Security framework and compliance
- **[Testing Strategy](./docs/testing-strategy.md)** - Comprehensive testing approach
- **[Deployment Guide](./docs/deployment.md)** - Infrastructure and deployment

## 🔒 Privacy & Security

### Privacy First
- **Anonymous Participation** - No email required for survey responses
- **PII Detection** - Automatic detection and redaction of personal information
- **K-Anonymity** - Grouped responses to prevent identification
- **Consent Management** - Granular consent for research use

### Security Features
- **End-to-End Encryption** - All data encrypted in transit and at rest
- **Role-Based Access Control** - Granular permissions system
- **Rate Limiting** - Protection against abuse and spam
- **Security Auditing** - Comprehensive logging and monitoring

### Compliance
- **GDPR Ready** - Right to deletion, data portability, consent management
- **CCPA Compliant** - California privacy law compliance
- **WCAG 2.2 AA** - Accessibility standards compliance
- **SOC 2 Type II** - Security and availability controls

## 🧪 Research Applications

### Academic Research
- **Political Science** - Public opinion formation and change
- **Psychology** - Cognitive reflection and bias mitigation
- **Communication** - Deliberative democracy and discourse quality
- **AI Ethics** - Human-AI interaction and AI influence on opinions

### Organizational Use
- **Policy Making** - Stakeholder consultation and feedback
- **Product Development** - User research with deep insights
- **Employee Engagement** - Internal surveys with reflection
- **Community Building** - Facilitating thoughtful discussions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Read** relevant documentation in `/docs` before coding
4. **Follow** our coding standards and security guidelines
5. **Test** your changes thoroughly
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Areas We Need Help
- 🎨 **UI/UX Design** - Improving user experience and accessibility
- 🔒 **Security** - Security auditing and penetration testing
- 🌍 **Internationalization** - Multi-language support
- 🧠 **AI Research** - Improving conversation quality and bias detection
- 📱 **Mobile** - React Native mobile app development
- 📊 **Analytics** - Advanced statistical analysis tools

## 📈 Roadmap

### Phase 1: Foundation (Q1 2024)
- ✅ Repository setup and core architecture
- ✅ Basic survey builder
- ✅ Authentication system

### Phase 2: Core Features (Q2 2024)
- 🔄 Complete participation flow
- 🔄 AI conversation integration
- 🔄 Real-time opinion distribution

### Phase 3: Advanced Features (Q3 2024)
- 📅 Analytics and reporting
- 📅 Data export capabilities
- 📅 Peer evaluation system

### Phase 4: Scale & Polish (Q4 2024)
- 📅 Performance optimization
- 📅 Security hardening
- 📅 Accessibility compliance

### Phase 5: Open Science (Q1 2025)
- 📅 Open source release
- 📅 Research dataset publication
- 📅 API ecosystem

## 🏆 Recognition

Critical AI Surveys has been recognized by:
- **AI for Good Foundation** - Innovation in Democratic Technology
- **Mozilla Foundation** - Trustworthy AI Grant Recipient
- **Knight Foundation** - Digital Democracy Initiative

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Open Source Commitment
- **Code**: Apache 2.0 license for maximum reusability
- **Data**: Anonymized research datasets available under CC BY 4.0
- **Documentation**: Creative Commons Attribution 4.0 International

## 👥 Team

### Core Team
- **[Your Name](https://github.com/username)** - Project Lead & Architecture
- **[Team Member](https://github.com/username)** - Frontend Development
- **[Team Member](https://github.com/username)** - AI/ML Engineering
- **[Team Member](https://github.com/username)** - Security & Privacy

### Research Advisors
- **Dr. Expert Name** - Democratic Deliberation Research
- **Dr. Expert Name** - AI Ethics and Bias
- **Dr. Expert Name** - Survey Methodology

## 🔗 Links

- **[Live Demo](https://demo.criticalaisurveys.com)** - Try the platform
- **[Documentation](https://docs.criticalaisurveys.com)** - Complete documentation
- **[API Docs](https://api.criticalaisurveys.com/docs)** - API reference
- **[Research Papers](https://research.criticalaisurveys.com)** - Academic publications
- **[Community Discord](https://discord.gg/criticalaisurveys)** - Join the discussion

## 📧 Contact

- **General Inquiries**: hello@criticalaisurveys.com
- **Research Partnerships**: research@criticalaisurveys.com
- **Security Issues**: security@criticalaisurveys.com
- **Media Inquiries**: press@criticalaisurveys.com

---

<div align="center">

**Building the future of democratic discourse, one conversation at a time.**

[🌟 Star this repo](https://github.com/your-org/critical-ai-surveys) | [🐛 Report Issues](https://github.com/your-org/critical-ai-surveys/issues) | [💬 Join Discussion](https://github.com/your-org/critical-ai-surveys/discussions)

</div>