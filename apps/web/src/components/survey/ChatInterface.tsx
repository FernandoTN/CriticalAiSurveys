"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  chatId: string;
  onComplete: () => void;
}

export function ChatInterface({ chatId, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const eventSource = new EventSource(`http://localhost:8000/api/v1/chat/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });

    let aiResponse = '';
    setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.delta) {
        aiResponse += data.delta;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { sender: 'ai', text: aiResponse };
          return newMessages;
        });
      }
    };

    eventSource.addEventListener('message_complete', () => {
      eventSource.close();
      setIsStreaming(false);
    });

    eventSource.onerror = () => {
      // Handle error
      eventSource.close();
      setIsStreaming(false);
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation with Socratic AI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 overflow-y-auto p-4 border rounded-md mb-4 space-y-4" ref={messagesEndRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.sender === 'ai' && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-secondary">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSendMessage()}
            placeholder="Type your response..."
            disabled={isStreaming}
          />
          <Button onClick={handleSendMessage} disabled={isStreaming}>
            {isStreaming ? 'Thinking...' : 'Send'}
          </Button>
        </div>
        <div className="mt-4 text-center">
          <Button onClick={onComplete} variant="link" disabled={messages.length < 2}>
            Continue to next step
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}