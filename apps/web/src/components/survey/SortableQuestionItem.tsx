"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question } from '@critical-ai-surveys/schemas';
import { GripVertical } from 'lucide-react';

interface SortableQuestionItemProps {
  question: Question;
}

export function SortableQuestionItem({ question }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex justify-between items-center p-2 border rounded bg-background"
    >
      <div className="flex items-center">
        <button {...listeners} className="cursor-grab p-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <span>{question.orderIndex}. {question.title}</span>
      </div>
      <span className="text-sm text-muted-foreground">{question.type}</span>
    </li>
  );
}