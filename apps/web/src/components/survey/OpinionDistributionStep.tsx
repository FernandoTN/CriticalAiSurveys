"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Question } from '@critical-ai-surveys/schemas';

interface OpinionDistributionStepProps {
  surveyId: string;
  question: Question;
  onComplete: () => void;
}

interface Distribution {
  [key: string]: number;
}

export function OpinionDistributionStep({ surveyId, question, onComplete }: OpinionDistributionStepProps) {
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial distribution data
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/surveys/${surveyId}/distribution/${question.id}`);
        if (!res.ok) throw new Error('Failed to fetch distribution data');
        const data = await res.json();
        setDistribution(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws');

    ws.onopen = () => console.log('WebSocket connected');
    ws.onclose = () => console.log('WebSocket disconnected');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'distribution_update' && data.questionId === question.id) {
        setDistribution(data.distribution);
      }
    };

    // Clean up WebSocket on component unmount
    return () => {
      ws.close();
    };
  }, [surveyId, question.id]);

  const chartData = distribution
    ? Object.entries(distribution).map(([name, value]) => ({ name, count: value }))
    : [];

  const totalResponses = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>How Others Responded</CardTitle>
        <CardDescription>
          Based on {totalResponses} anonymous responses so far. This chart updates in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading distribution...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {distribution && (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-6 text-center">
          <Button onClick={onComplete}>Continue to Next Step</Button>
        </div>
      </CardContent>
    </Card>
  );
}