"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Question } from "@critical-ai-surveys/schemas";
import { QuestionEditor } from "@/components/survey/QuestionEditor";
import { QuestionList } from "@/components/survey/QuestionList";

export default function CreateSurveyPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddQuestion = (question: Omit<Question, 'id' | 'orderIndex'>) => {
    const newQuestion: Question = {
      ...question,
      id: `temp-id-${Date.now()}`, // Temporary ID for client-side rendering
      orderIndex: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleSaveSurvey = async () => {
    setIsSaving(true);
    try {
      // Step 1: Create the survey with title and description
      const createResponse = await fetch('http://localhost:8000/api/v1/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create survey');
      }

      const createdSurvey = await createResponse.json();
      const surveyId = createdSurvey.id;

      // Step 2: Update the survey with the questions
      if (questions.length > 0) {
        // Remove temporary client-side IDs before sending to the backend
        const questionsForApi = questions.map(({ id, ...q }) => q);

        const updateResponse = await fetch(`http://localhost:8000/api/v1/surveys/${surveyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: questionsForApi }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to save questions');
        }
      }

      alert('Survey saved successfully!');
      // Here you would typically redirect the user, e.g., router.push(`/surveys/${surveyId}`);
    } catch (error) {
      console.error(error);
      alert('An error occurred while saving the survey.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
            <CardDescription>
              Give your survey a title and a brief description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Survey Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Public Opinion on Climate Change"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your survey's purpose"
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4">
          <QuestionList questions={questions} setQuestions={setQuestions} />
        </div>
      </div>
      <div>
        <QuestionEditor onAddQuestion={handleAddQuestion} />
        <div className="mt-4">
          <Button onClick={handleSaveSurvey} className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Survey'}
          </Button>
        </div>
      </div>
    </div>
  );
}