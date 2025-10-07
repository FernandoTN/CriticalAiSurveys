"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@critical-ai-surveys/schemas';

interface FinalOpinionStepProps {
  question: Question;
  sessionId: string;
  onComplete: () => void;
}

export function FinalOpinionStep({ question, sessionId, onComplete }: FinalOpinionStepProps) {
  const [likertValue, setLikertValue] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!likertValue) return;

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
            likert: parseInt(likertValue, 10),
            comment,
            isFinal: true, // Flag to distinguish this as the final opinion
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit final opinion');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (question.type !== 'likert') {
    return <p>This step only supports Likert scale questions.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Final Opinion</CardTitle>
        <CardDescription>
          After this experience, please provide your final rating and any concluding thoughts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup onValueChange={setLikertValue} className="flex justify-between">
          {question.options.labels.map((label: string, index: number) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <RadioGroupItem value={String(question.options.scale[index])} id={`final-r${index}`} />
              <Label htmlFor={`final-r${index}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>

        <div>
          <Label htmlFor="final-comment">Final thoughts (optional):</Label>
          <Textarea
            id="final-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What influenced your thinking?"
            className="mt-2"
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <Button onClick={handleSubmit} disabled={!likertValue || isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Continue to Final Step'}
        </Button>
      </CardContent>
    </Card>
  );
}