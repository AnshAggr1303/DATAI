// ======= FILE: app/page.tsx =======
'use client'
import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

export default function Home() {
  const [showChat, setShowChat] = useState(false)
  const [initialQuestion, setInitialQuestion] = useState('')

  const handleGetStarted = () => {
    setShowChat(true)
    // Update the URL without page refresh
    window.history.pushState({ showChat: true }, '', '/chat')
  }

  const handleQuestionSubmit = (question: string) => {
    setInitialQuestion(question)
    setShowChat(true)
    // Update the URL without page refresh
    window.history.pushState({ showChat: true, question }, '', '/chat')
  }

  // Handle browser back button
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.showChat) {
        setShowChat(true)
        if (event.state.question) {
          setInitialQuestion(event.state.question)
        }
      } else {
        setShowChat(false)
        setInitialQuestion('')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (showChat) {
    return <ChatInterface initialQuestion={initialQuestion} onGoHome={() => {
      setShowChat(false)
      setInitialQuestion('')
      window.history.pushState({}, '', '/')
    }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Talk with your{' '}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-orange-500 bg-clip-text text-transparent">
                Data
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Query, analyse, and unlock insights with natural language.
            </p>
            <p className="text-lg text-gray-500">
              AI-powered SQL agent for effortless data exploration.
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-3 mr-4">
                <Sparkles className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-gray-600 font-medium">Hey, which data do you want to see?</span>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const question = formData.get('question') as string
              if (question.trim()) {
                handleQuestionSubmit(question.trim())
              }
            }}>
              <div className="flex items-center space-x-4">
                <input
                  name="question"
                  type="text"
                  placeholder="Show me the pricing plans"
                  className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 font-medium"
                >
                  <span>Ask AI</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Start Button */}
          <button
            onClick={handleGetStarted}
            className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Get Started
          </button>
        </div>

        {/* Example Queries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Try these example queries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "What's our monthly revenue trend?",
              "Who are our top 5 customers?",
              "Which products sell best?",
              "Show me recent unpaid orders"
            ].map((query, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSubmit(query)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <span className="text-gray-700 group-hover:text-blue-700">
                  {query}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}