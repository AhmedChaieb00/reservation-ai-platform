import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles } from 'lucide-react'
import { sendChatMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface Message {
  id: number
  content: string
  isBot: boolean
  suggestions?: string[]
}

const SESSION_ID = `session_${Date.now()}`

export default function AiChatbot() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      isBot: true,
      content: "Bonjour ! Je suis votre assistant ITEAM. Comment puis-je vous aider ?",
      suggestions: ['Trouver une salle disponible', 'Mes réservations', 'Comment réserver ?'],
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setMessages(prev => [...prev, { id: Date.now(), content: trimmed, isBot: false }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await sendChatMessage(trimmed, user?.id, SESSION_ID)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        isBot: true,
        content: res.response || "Je n'ai pas pu traiter votre demande.",
        suggestions: res.suggestions || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        isBot: true,
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200
          ${isOpen ? 'bg-gray-800 hover:bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'}`}
        title="Assistant IA"
      >
        {isOpen ? <X size={20} className="text-white" /> : <MessageSquare size={20} className="text-white" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 w-[340px] h-[480px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0f172a] border-b border-white/10">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-medium leading-tight">Assistant ITEAM</div>
              <div className="text-slate-400 text-[10px]">Groq · LLaMA 3.1</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-[10px] text-slate-400">En ligne</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.isBot
                      ? 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                      : 'bg-blue-600 text-white'
                    }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
                {msg.isBot && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Posez votre question..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
