"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReflectionStepProps {
  originalResponse: {
    id: string;
    value: {
      justification: string;
    };
  };
  onComplete: () => void;
}

export function ReflectionStep({ originalResponse, onComplete }: ReflectionStepProps) {
  const [revisedJustification, setRevisedJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/responses/${originalResponse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            ...originalResponse.value,
            justification: revisedJustification,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit revised response');
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
        <CardTitle>Reflect & Revise (Optional)</CardTitle>
        <CardDescription>
          After the AI conversation, you have the opportunity to revise your reasoning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Your original response:</Label>
          <p className="p-3 bg-secondary rounded-md text-sm">
            {originalResponse.value.justification}
          </p>
        </div>
        <div>
          <Label htmlFor="revised-justification">Your revised response:</Label>
          <Textarea
            id="revised-justification"
            value={revisedJustification}
            onChange={(e) => setRevisedJustification(e.target.value)}
            placeholder="If your perspective has changed, explain why here..."
            className="mt-2"
          />
           <p className="text-sm text-muted-foreground mt-1">
            {revisedJustification.length} / 200 characters
          </p>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onComplete} disabled={isSubmitting}>
            Keep Original
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !revisedJustification}>
            {isSubmitting ? 'Saving...' : 'Use Revision'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}