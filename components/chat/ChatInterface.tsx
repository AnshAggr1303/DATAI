"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Database } from "lucide-react"
import MessageBubble from "./MessageBubble"
import InputBox from "./InputBox"
import Suggestions from "./Suggestions"
import DataVisualization from "./DataVisualization"
import StatusCard from "./StatusCard"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  data?: {
    query: string
    results: any[]
    rowCount: number
    executionTime?: string
    responseMessage?: string
    insights?: string[]
    chartType?: "line" | "bar" | "pie" | "table"
  }
}

interface ProcessingStep {
  id: string
  title: string
  description: string
  status: "complete" | "running" | "pending" | "error"
  errorMessage?: string
  sqlQuery?: string
  details?: string
}

interface ChatInterfaceProps {
  initialQuestion?: string
  onGoHome?: () => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialQuestion, onGoHome }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [initialQuestionProcessed, setInitialQuestionProcessed] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, processingSteps])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || loading || processingRef.current) return

    processingRef.current = true

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setShowSuggestions(false)

    // Initialize processing steps
    setProcessingSteps([
      {
        id: "1",
        title: "Query Analysis",
        description: "Analyzing your natural language query...",
        status: "running",
        details: "Breaking down your question into database operations",
      },
      {
        id: "2",
        title: "Database Schema Check",
        description: "Validating database structure...",
        status: "pending",
        details: "Checking table relationships and column names",
      },
      {
        id: "3",
        title: "SQL Generation",
        description: "Generating optimized SQL query...",
        status: "pending",
        details: "Creating SQL query based on your request",
      },
      {
        id: "4",
        title: "Query Execution",
        description: "Executing query and retrieving results...",
        status: "pending",
        details: "Running the query against your database",
      },
    ])

    // Simulate step progression
    setTimeout(() => {
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === "1"
            ? { ...step, status: "complete", description: "Successfully analyzed your query" }
            : step.id === "2"
              ? { ...step, status: "running" }
              : step,
        ),
      )
    }, 1000)

    setTimeout(() => {
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === "2"
            ? { ...step, status: "complete", description: "Database schema validated successfully" }
            : step.id === "3"
              ? { ...step, status: "running" }
              : step,
        ),
      )
    }, 2000)

    try {
      const response = await fetch("/api/smart-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: message }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle SQL generation error
        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === "3"
              ? {
                  ...step,
                  status: "error",
                  description: "SQL generation failed",
                  errorMessage: data.error || "Failed to generate SQL query",
                  sqlQuery: data.generatedSQL || "No SQL generated",
                }
              : step.id === "4"
                ? { ...step, status: "pending", description: "Skipped due to previous error" }
                : step,
          ),
        )

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `I encountered an error while processing your query: ${data.error || "Unknown error"}. Please try rephrasing your question or check if the requested data exists in your database.`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } else {
        // Success path
        setTimeout(() => {
          setProcessingSteps((prev) =>
            prev.map((step) =>
              step.id === "3"
                ? {
                    ...step,
                    status: "complete",
                    description: "SQL query generated successfully",
                    sqlQuery: data.query,
                  }
                : step.id === "4"
                  ? { ...step, status: "running" }
                  : step,
            ),
          )
        }, 3000)

        setTimeout(() => {
          setProcessingSteps((prev) =>
            prev.map((step) =>
              step.id === "4"
                ? {
                    ...step,
                    status: "complete",
                    description: `Successfully retrieved ${data.rowCount || 0} rows`,
                    details: `Query executed in ${data.executionTime || "unknown"} time`,
                  }
                : step,
            ),
          )

          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: data.responseMessage || "Here are your results:",
            timestamp: new Date(),
            data: data,
          }

          setMessages((prev) => [...prev, botMessage])

          // Clear processing steps after showing results
          setTimeout(() => {
            setProcessingSteps([])
          }, 2000)
        }, 4000)
      }
    } catch (error: any) {
      // Handle network or other errors
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === "4"
            ? {
                ...step,
                status: "error",
                description: "Query execution failed",
                errorMessage: error.message || "Network error occurred",
              }
            : step,
        ),
      )

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `I encountered a network error: ${error.message}. Please check your connection and try again.`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      processingRef.current = false
    }
  }

  useEffect(() => {
    if (initialQuestion && !initialQuestionProcessed) {
      setInitialQuestionProcessed(true)
      handleSendMessage(initialQuestion)
    }
  }, [initialQuestion])

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 && !loading && showSuggestions && (
            <div className="text-center py-12 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl mb-6 animate-bounce-gentle">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What would you like to know about your data?</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Ask me anything about your business data and I'll provide insights with visualizations.
                </p>
                <Suggestions onSuggestionClick={handleSuggestionClick} />
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id} className="mb-6 animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
              <MessageBubble message={message} />
              {message.data && (
                <div className="mt-4 animate-fade-in-up">
                  <DataVisualization data={message.data} />
                </div>
              )}
            </div>
          ))}

          {/* Processing Steps */}
          {processingSteps.length > 0 && (
            <div className="mb-6 space-y-3">
              {processingSteps.map((step, index) => (
                <StatusCard
                  key={step.id}
                  title={step.title}
                  description={step.description}
                  status={step.status}
                  delay={index * 150}
                  errorMessage={step.errorMessage}
                  sqlQuery={step.sqlQuery}
                  details={step.details}
                />
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area - Now horizontally larger and rounded */}
      <div className="bg-white border border-gray-200 px-6 py-3 shadow-lg max-w-3xl mx-auto rounded-3xl mb-4">
        <div>
          <InputBox onSendMessage={handleSendMessage} disabled={loading} />
          {/* Quick Suggestions */}
          {messages.length > 0 && !loading && (
            <div className="mt-4 animate-fade-in">
              <p className="text-sm font-semibold text-gray-700 mb-3">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show me database schema",
                  "List all tables",
                  "What columns are available?",
                  "Try a simpler query",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-700 px-3 py-1.5 rounded-full transition-all duration-200 border border-gray-200 font-medium transform hover:scale-105"
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

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out 0.1s both;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default ChatInterface
