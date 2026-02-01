import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Brain,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { useChatStore, useAuthStore } from '../store'
import { chatAPI } from '../api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const quickPrompts = [
  "Stress Relief",
  "Career Help",
  "Scholarships",
  "Study Tips",
]

// Markdown components for styling
const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-purple-300">{children}</em>,
  code: ({ inline, children }) => 
    inline ? (
      <code className="bg-dark-700/80 px-1.5 py-0.5 rounded text-pink-400 text-sm font-mono">{children}</code>
    ) : (
      <code className="block bg-dark-800 p-3 rounded-lg my-2 text-sm font-mono overflow-x-auto">{children}</code>
    ),
  pre: ({ children }) => <pre className="bg-dark-800 p-3 rounded-lg my-2 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-500 pl-3 my-2 text-dark-300 italic">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border border-dark-600 rounded-lg">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="bg-dark-700 px-3 py-2 text-left font-semibold border-b border-dark-600">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 border-b border-dark-700">{children}</td>,
}

export default function Chat() {
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const { user, token } = useAuthStore()
  const {
    messages,
    isLoading,
    showReasoning,
    addMessage,
    setLoading,
    toggleReasoning,
    clearChat,
    setMessages,
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation history on mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!token) {
        setHistoryLoading(false)
        return
      }

      try {
        // Try to get existing conversations
        const { data } = await chatAPI.getConversations()
        
        if (data.conversations && data.conversations.length > 0) {
          // Get the most recent conversation
          const latestConv = data.conversations[0]
          setConversationId(latestConv._id)
          
          // Fetch full conversation with messages
          const { data: convData } = await chatAPI.getConversation(latestConv._id)
          
          if (convData.conversation && convData.conversation.messages) {
            // Convert backend messages to frontend format
            const formattedMessages = convData.conversation.messages.map((msg, idx) => ({
              id: idx + 1,
              role: msg.role,
              content: msg.content,
              reasoning: msg.reasoning,
              actions: msg.actions,
              category: msg.metadata?.category,
              timestamp: msg.timestamp || new Date().toISOString(),
            }))
            
            if (formattedMessages.length > 0) {
              setMessages(formattedMessages)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadConversationHistory()
  }, [token])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      const { data } = await chatAPI.sendMessage(input.trim(), conversationId)
      
      // Save conversation ID for future messages
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message.content,
        reasoning: data.message.reasoning,
        actions: data.message.actions,
        category: data.message.metadata?.category,
        timestamp: new Date().toISOString(),
      }
      
      addMessage(aiMessage)
    } catch (error) {
      toast.error('Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickPrompt = (prompt) => {
    const prompts = {
      "Stress Relief": "I'm feeling stressed and need some help managing it",
      "Career Help": "Help me explore career opportunities and internships",
      "Scholarships": "What scholarships am I eligible for?",
      "Study Tips": "Give me effective study strategies for my exams",
    }
    setInput(prompts[prompt] || prompt)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Chat</h1>
            <p className="text-slate-500 text-sm">Your AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleReasoning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              showReasoning 
                ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {showReasoning ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="text-sm">Reasoning</span>
          </button>
          <button
            onClick={() => {
              clearChat()
              setConversationId(null)
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-300 transition-all duration-300"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {historyLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-500">Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                <Sparkles size={48} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-50 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              How can I help you today?
            </h2>
            <p className="text-slate-500 mb-8 max-w-md">
              I'm your agentic AI companion for mental health, career, finances, social connections, and academics.
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.role === 'assistant' && showReasoning && msg.reasoning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm p-4 rounded-xl mb-2 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                          <Brain size={16} />
                          <span className="font-medium">Reasoning Trace</span>
                        </div>
                        <p className="text-slate-600">{msg.reasoning}</p>
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.actions.map((action, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-purple-100 border border-purple-200 rounded-full text-purple-600">
                                {action}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-white border border-slate-200 shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    {msg.category && msg.role === 'assistant' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full capitalize">
                          {msg.category}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="mt-4">
        {/* Input Container with gradient border */}
        <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-slate-300 via-slate-200 to-slate-200 overflow-hidden shadow-sm">
          {/* Glow effect */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-radial from-white/30 via-white/10 to-transparent blur-sm -translate-x-2 -translate-y-2" />
          
          <div className="relative bg-white rounded-[14px] overflow-hidden">
            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Imagine Something...✦˚"
                rows={1}
                className="w-full bg-transparent text-slate-900 text-sm font-normal px-4 py-3 resize-none focus:outline-none placeholder:text-slate-400 scrollbar-thin"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            
            {/* Options Bar */}
            <div className="flex justify-end items-end px-3 pb-3">
              {/* Submit Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="group relative p-[2px] rounded-xl bg-gradient-to-b from-slate-200 to-slate-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-[10px]">
                  <Send 
                    size={16} 
                    className="text-slate-400 transition-all duration-300 group-hover:text-purple-500 group-hover:drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" 
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tags */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 select-none"
            >
              {prompt}
            </button>
          ))}
        </div>

        <p className="text-center text-dark-500 text-xs mt-3">
          Ascendra may make mistakes. Always verify important information.
        </p>
      </div>
    </div>
  )
}
