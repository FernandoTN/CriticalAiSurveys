"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Question } from '@critical-ai-surveys/schemas';

interface BaselineOpinionStepProps {
  question: Question;
  sessionId: string;
  onComplete: () => void;
}

export function BaselineOpinionStep({ question, sessionId, onComplete }: BaselineOpinionStepProps) {
  const [likertValue, setLikertValue] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = likertValue !== null && justification.length >= 10;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/surveys/${question.surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          sessionId: sessionId,
          value: {
            likert: parseInt(likertValue!, 10),
            justification,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assuming a likert question for now
  if (question.type !== 'likert') {
    return <p>This step only supports Likert scale questions.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{question.title}</h2>
      {question.description && <p className="text-muted-foreground">{question.description}</p>}

      <RadioGroup onValueChange={setLikertValue} className="flex justify-between">
        {question.options.labels.map((label: string, index: number) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <RadioGroupItem value={String(question.options.scale[index])} id={`r${index}`} />
            <Label htmlFor={`r${index}`}>{label}</Label>
          </div>
        ))}
      </RadioGroup>

      <div>
        <Label htmlFor="justification">Please explain your reasoning:</Label>
        <Textarea
          id="justification"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Share your honest initial thoughts..."
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {justification.length} characters (min: 10)
        </p>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Continue'}
      </Button>
    </div>
  );
}