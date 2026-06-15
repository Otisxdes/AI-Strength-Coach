'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  { q: 'What should I lift next session?', icon: '🎯' },
  { q: 'Which exercises am I improving on?', icon: '📈' },
  { q: 'What is stagnating?', icon: '📊' },
  { q: 'Should I increase weight on lat pulldown?', icon: '💪' },
]

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
      <div className="px-4 pt-6 pb-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
          🤖
        </div>
        <div>
          <h1 className="font-bold leading-tight">AI Coach</h1>
          <p className="text-muted-foreground text-xs">Powered by your training data</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="space-y-5">
            {/* Welcome */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm shrink-0 mt-0.5">
                🤖
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%]">
                Hey! Ask me anything about your lifts — progression, plateaus, what to target next session.
              </div>
            </div>

            {/* Starter chips */}
            <div className="space-y-2 pl-10">
              {STARTER_QUESTIONS.map(({ q, icon }) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left flex items-center gap-3 bg-muted/40 hover:bg-muted/70 border border-border rounded-xl px-4 py-3 text-sm transition-colors active:scale-[0.98]"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-foreground/80">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm shrink-0 mb-0.5">
                🤖
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border text-foreground rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <p className="font-bold text-sm mb-1.5 mt-0.5">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2 rounded-lg border border-border">
                        <table className="text-xs border-collapse w-full">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="border-b border-border px-3 py-1.5 text-left font-semibold bg-muted/50">{children}</th>,
                    td: ({ children }) => <td className="border-b border-border/50 px-3 py-1.5 last:border-0">{children}</td>,
                    hr: () => <div className="border-t border-border my-2" />,
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-none space-y-1 mb-1.5">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex gap-2">
                        <span className="text-muted-foreground mt-0.5 shrink-0">·</span>
                        <span>{children}</span>
                      </li>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-end">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm shrink-0">
              🤖
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your training…"
            className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 px-4"
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            size="icon"
            className="rounded-full shrink-0 w-9 h-9"
          >
            ↑
          </Button>
        </div>
      </div>
    </div>
  )
}
