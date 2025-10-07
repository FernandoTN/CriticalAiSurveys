"use client";

import { Survey, Question } from "@critical-ai-surveys/schemas";
import { useEffect, useState } from "react";
import { BaselineOpinionStep } from "./BaselineOpinionStep";
import { ChatInterface } from "./ChatInterface";
import { ReflectionStep } from "./ReflectionStep";

interface SurveyParticipationFlowProps {
  survey: Survey & { questions: Question[] };
}

interface Session {
  id: string;
  sessionKey: string;
}

interface Response {
  id: string;
  value: {
    likert: number;
    justification: string;
  };
}

export function SurveyParticipationFlow({ survey }: SurveyParticipationFlowProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [baselineResponse, setBaselineResponse] = useState<Response | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surveyId: survey.id }),
        });

        if (!res.ok) {
          throw new Error('Failed to create session');
        }

        const sessionData = await res.json();
        setSession(sessionData);
        setCurrentStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, [survey.id]);

  const handleStepComplete = async (data?: any) => {
    if (currentStep === 1) {
      setBaselineResponse(data);
      // Now, start the chat session
      try {
        const res = await fetch('http://localhost:8000/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session?.id,
            initialContext: data.value.justification,
          }),
        });
        if (!res.ok) throw new Error('Failed to start chat session');
        const chatData = await res.json();
        setChatId(chatData.id);
        setCurrentStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start chat.');
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading survey...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!session) {
    return <div className="text-center p-8">Could not initialize survey session. Please try again.</div>
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        const baselineQuestion = survey.questions[0];
        if (!baselineQuestion) return <p>Error: No questions found.</p>;
        return (
          <BaselineOpinionStep
            question={baselineQuestion}
            sessionId={session.id}
            onComplete={handleStepComplete}
          />
        );
      case 2:
        if (!chatId) return <p>Starting chat...</p>;
        return (
          <ChatInterface
            chatId={chatId}
            onComplete={handleStepComplete}
          />
        );
      case 3:
        if (!baselineResponse) return <p>Error: No baseline response found.</p>;
        return (
          <ReflectionStep
            originalResponse={baselineResponse}
            onComplete={handleStepComplete}
          />
        );
      default:
        return (
          <div>
            <p>Current Step: {currentStep}</p>
            <p>Thank you for your participation!</p>
          </div>
        );
    }
  };

  return <div>{renderCurrentStep()}</div>;
}