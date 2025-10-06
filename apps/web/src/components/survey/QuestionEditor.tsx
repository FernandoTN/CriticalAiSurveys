"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "@critical-ai-surveys/schemas";

interface QuestionEditorProps {
  onAddQuestion: (question: Omit<Question, 'id' | 'orderIndex'>) => void;
}

export function QuestionEditor({ onAddQuestion }: QuestionEditorProps) {
  const [title, setTitle] = useState("");
  const [questionType, setQuestionType] = useState<"likert" | "free_text">("likert");

  const handleAddQuestion = () => {
    if (!title) return;

    let questionData: Omit<Question, 'id' | 'orderIndex'>;

    if (questionType === 'likert') {
      questionData = {
        title,
        type: 'likert',
        options: {
          scale: [1, 2, 3, 4, 5],
          labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        },
        validation: { required: true },
      };
    } else {
      questionData = {
        title,
        type: 'free_text',
        validation: { required: true },
      };
    }

    onAddQuestion(questionData);
    setTitle("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="question-title">Question Title</Label>
          <Input
            id="question-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How do you feel about...?"
          />
        </div>
        <div>
          <Label htmlFor="question-type">Question Type</Label>
          <Select onValueChange={(value: "likert" | "free_text") => setQuestionType(value)} defaultValue={questionType}>
            <SelectTrigger id="question-type">
              <SelectValue placeholder="Select a question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likert">Likert Scale</SelectItem>
              <SelectItem value="free_text">Free Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddQuestion} className="w-full">Add Question</Button>
      </CardContent>
    </Card>
  );
}