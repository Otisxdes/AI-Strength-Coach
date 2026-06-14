'use client'
import { useState, useRef, useEffect } from 'react'

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
      <div className="p-4 pt-6 border-b border-zinc-900">
        <h1 className="text-xl font-bold">AI Coach</h1>
        <p className="text-zinc-400 text-sm">Ask about your training data</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">Ask anything about your lifts, progression, or plateaus.</p>
            <div className="space-y-2">
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left bg-zinc-900 rounded-xl px-4 py-3 text-sm text-zinc-300 active:bg-zinc-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 rounded-2xl px-4 py-3 text-sm text-zinc-400">
              Analyzing your data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto p-4 bg-zinc-950 border-t border-zinc-900">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your training…"
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 text-sm focus:outline-none"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-white text-black px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
