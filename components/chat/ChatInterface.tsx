/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: components/chat/ChatInterface.tsx =======
'use client'
import { useState, useEffect, useRef } from 'react'
import { Loader2, Database } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputBox from './InputBox'
import Suggestions from './Suggestions'
import DataVisualization from './DataVisualization'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  data?: {
    query: string
    results: any[]
    rowCount: number
    executionTime?: string
    responseMessage?: string
    insights?: string[]
    chartType?: 'line' | 'bar' | 'pie' | 'table'
  }
}

interface ChatInterfaceProps {
  initialQuestion?: string
  onGoHome?: () => void
}

export default function ChatInterface({ initialQuestion, onGoHome }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [initialQuestionProcessed, setInitialQuestionProcessed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false) // Add ref to prevent double processing

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || loading || processingRef.current) return
    
    processingRef.current = true

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch('/api/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: message }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query')
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.responseMessage || 'Here are your results:',
        timestamp: new Date(),
        data: data
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `I encountered an error: ${error.message}. Please try rephrasing your question.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      processingRef.current = false // Reset processing flag
    }
  }

  // Handle initial question - prevent double execution
  useEffect(() => {
    if (initialQuestion && !initialQuestionProcessed) {
      setInitialQuestionProcessed(true)
      handleSendMessage(initialQuestion)
    }
  }, [initialQuestion]) // Only depend on initialQuestion

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 && !loading && showSuggestions && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  What would you like to know about your data?
                </h2>
                <p className="text-gray-600 mb-6">
                  Ask me anything about your business data and I&apos;ll provide insights with visualizations.
                </p>
                <Suggestions onSuggestionClick={handleSuggestionClick} />
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="mb-6">
              <MessageBubble message={message} />
              {message.data && (
                <div className="mt-4">
                  <DataVisualization data={message.data} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-6">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 max-w-xs">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-gray-600">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <InputBox onSendMessage={handleSendMessage} disabled={loading} />
          
          {/* Quick Suggestions */}
          {messages.length > 0 && !loading && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show me more details",
                  "What's the trend?",
                  "Compare with last month",
                  "Export this data"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}