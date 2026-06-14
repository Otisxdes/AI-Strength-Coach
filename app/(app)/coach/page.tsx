'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  'What should I lift next time for bench press?',
  'Which exercises am I improving on?',
  'What is stagnating?',
  'Should I increase weight on lat pulldown?',
]

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question?: string) {
    const q = question || input.trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.error || 'No response' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen pb-20">
      {/* Header */}
      <div className="p-4 pt-6 border-b border-border">
        <h1 className="text-xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground text-sm">Backed by your real lift data</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Ask anything about your lifts, progression, or plateaus.</p>
            <div className="space-y-2">
              {STARTER_QUESTIONS.map(q => (
                <Card
                  key={q}
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
                  onClick={() => send(q)}
                >
                  <CardContent className="py-3 px-4 text-sm">{q}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              Analyzing your data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your training…"
            className="flex-1"
          />
          <Button onClick={() => send()} disabled={!input.trim() || loading}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
