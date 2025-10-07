"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlatformFeedbackStepProps {
  sessionId: string;
  onComplete: () => void;
}

type AiRating = 'very_helpful' | 'somewhat_helpful' | 'not_helpful' | 'distracting';

export function PlatformFeedbackStep({ sessionId, onComplete }: PlatformFeedbackStepProps) {
  const [experienceRating, setExperienceRating] = useState<number | null>(null);
  const [aiRating, setAiRating] = useState<AiRating | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!experienceRating) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          experienceRating,
          aiConversationRating: aiRating,
          suggestions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
        <CardDescription>
          Your feedback is valuable and helps us improve the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Overall Experience</Label>
          <div className="flex justify-around mt-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <Button
                key={rating}
                variant={experienceRating === rating ? 'default' : 'outline'}
                onClick={() => setExperienceRating(rating)}
                className="text-2xl p-4"
              >
                {['😫', '😕', '😐', '😊', '🤩'][rating - 1]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label>The AI conversation was:</Label>
          <RadioGroup onValueChange={(value: AiRating) => setAiRating(value)} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="very_helpful" id="ai-very-helpful" />
              <Label htmlFor="ai-very-helpful">Very helpful</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somewhat_helpful" id="ai-somewhat-helpful" />
              <Label htmlFor="ai-somewhat-helpful">Somewhat helpful</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_helpful" id="ai-not-helpful" />
              <Label htmlFor="ai-not-helpful">Not helpful</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="distracting" id="ai-distracting" />
              <Label htmlFor="ai-distracting">Distracting</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="suggestions">Any suggestions for improvement? (optional)</Label>
          <Textarea
            id="suggestions"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="What could we do better?"
            className="mt-2"
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <Button onClick={handleSubmit} disabled={!experienceRating || isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}