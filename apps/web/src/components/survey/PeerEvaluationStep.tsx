"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PeerResponse {
  id: string;
  value: {
    justification: string;
  };
}

interface PeerEvaluationStepProps {
  surveyId: string;
  sessionId: string;
  onComplete: () => void;
}

export function PeerEvaluationStep({ surveyId, sessionId, onComplete }: PeerEvaluationStepProps) {
  const [queue, setQueue] = useState<PeerResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votesSubmitted, setVotesSubmitted] = useState(0);

  const MINIMUM_VOTES = 3;

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/surveys/${surveyId}/voting-queue?sessionId=${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch voting queue');
        const data = await res.json();
        setQueue(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [surveyId, sessionId]);

  const handleVote = async (voteType: 'approve' | 'disapprove' | 'pass' | 'quality') => {
    const currentResponse = queue[currentIndex];
    if (!currentResponse) return;

    try {
      await fetch(`http://localhost:8000/api/v1/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: currentResponse.id,
          sessionId,
          voteType,
        }),
      });
      setVotesSubmitted(prev => prev + 1);
      // Move to the next response in the queue
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reached the end of the queue
        onComplete();
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    }
  };

  const currentResponse = queue[currentIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluate Peer Responses</CardTitle>
        <CardDescription>
          Review anonymous responses from other participants. Your feedback helps surface high-quality arguments.
        </CardDescription>
        <p className="text-sm font-medium">Progress: {votesSubmitted} of {Math.min(MINIMUM_VOTES, queue.length)} votes needed</p>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading responses...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && currentResponse && (
          <div>
            <p className="p-4 bg-secondary rounded-md text-sm mb-4">
              "{currentResponse.value.justification}"
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleVote('approve')}>👍 Approve</Button>
              <Button variant="outline" onClick={() => handleVote('disapprove')}>👎 Disapprove</Button>
              <Button variant="outline" onClick={() => handleVote('quality')}>⚡ High Quality</Button>
              <Button variant="outline" onClick={() => handleVote('pass')}>↪️ Pass</Button>
            </div>
          </div>
        )}
         {!isLoading && !error && !currentResponse && (
           <p>No more responses to evaluate.</p>
         )}
        <div className="mt-6 text-center">
          <Button onClick={onComplete} variant="link" disabled={votesSubmitted < MINIMUM_VOTES}>
            {votesSubmitted < MINIMUM_VOTES ? `Submit ${MINIMUM_VOTES - votesSubmitted} more votes to continue` : 'Continue to Next Step'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}