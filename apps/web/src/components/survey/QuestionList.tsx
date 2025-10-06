"use client";

import { Question } from "@critical-ai-surveys/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableQuestionItem } from "./SortableQuestionItem";

interface QuestionListProps {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}

export function QuestionList({ questions, setQuestions }: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      const reorderedQuestions = newQuestions.map((q, index) => ({ ...q, orderIndex: index + 1 }));
      setQuestions(reorderedQuestions);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions</CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-muted-foreground">No questions added yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id!)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {questions.map((question) => (
                  <SortableQuestionItem key={question.id} question={question} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}