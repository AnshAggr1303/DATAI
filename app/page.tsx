"use client"

import { useState } from "react"
import { ArrowRight, Sparkles, Database, TrendingUp, Users, Package, FileText } from "lucide-react"
import React from "react"
import ChatInterface from "@/components/chat/ChatInterface"

export default function Home() {
  const [showChat, setShowChat] = useState(false)
  const [initialQuestion, setInitialQuestion] = useState("")

  const handleGetStarted = () => {
    setShowChat(true)
    window.history.pushState({ showChat: true }, "", "/chat")
  }

  const handleQuestionSubmit = (question: string) => {
    setInitialQuestion(question)
    setShowChat(true)
    window.history.pushState({ showChat: true, question }, "", "/chat")
  }

  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.showChat) {
        setShowChat(true)
        if (event.state.question) {
          setInitialQuestion(event.state.question)
        }
      } else {
        setShowChat(false)
        setInitialQuestion("")
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  if (showChat) {
    return (
      <ChatInterface
        initialQuestion={initialQuestion}
        onGoHome={() => {
          setShowChat(false)
          setInitialQuestion("")
          window.history.pushState({}, "", "/")
        }}
      />
    )
  }

  const exampleQueries = [
    {
      icon: TrendingUp,
      query: "What's our monthly revenue trend?",
      description: "Analyze revenue patterns over time",
    },
    {
      icon: Users,
      query: "Who are our top 5 customers?",
      description: "Identify highest value customers",
    },
    {
      icon: Package,
      query: "Which products sell best?",
      description: "Find top performing products",
    },
    {
      icon: FileText,
      query: "Show me recent unpaid orders",
      description: "Review outstanding payments",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl mb-6 shadow-lg animate-bounce-gentle">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Talk with your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Data
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-3 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Query, analyze, and unlock insights with natural language.
            </p>
            <p className="text-lg text-gray-500 max-w-xl mx-auto animate-fade-in-up animation-delay-400">
              AI-powered SQL agent for effortless data exploration.
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-10 hover:shadow-2xl transition-all duration-500 animate-slide-up animation-delay-600">
            <div className="flex items-center justify-center mb-8 animate-fade-in-up animation-delay-800">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-full p-4 mr-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium text-lg">Hey, which data do you want to see?</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const question = formData.get("question") as string
                if (question.trim()) {
                  handleQuestionSubmit(question.trim())
                }
              }}
              className="animate-fade-in-up animation-delay-1000"
            >
              <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                <input
                  name="question"
                  type="text"
                  placeholder="Show me the pricing plans"
                  className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all duration-300 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-base">Ask AI</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Start Button */}
          <button
            onClick={handleGetStarted}
            className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 animate-fade-in-up animation-delay-1200"
          >
            Get Started
          </button>
        </div>

        {/* Example Queries */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up animation-delay-1400">
          <div className="text-center mb-10 animate-fade-in-up animation-delay-1600">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Try these example queries</h3>
            <p className="text-base text-gray-600">Click on any query to get started instantly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {exampleQueries.map((item, index) => {
              const IconComponent = item.icon
              return (
                <button
                  key={index}
                  onClick={() => handleQuestionSubmit(item.query)}
                  className="group text-left p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-400 transform hover:scale-105 hover:shadow-lg animate-fade-in-up"
                  style={{
                    animationDelay: `${1800 + index * 200}ms`,
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-white rounded-xl p-3 shadow-md group-hover:shadow-lg transition-all duration-400 group-hover:bg-blue-100">
                      <IconComponent className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors duration-400 mb-2">
                        {item.query}
                      </h4>
                      <p className="text-base text-gray-500 group-hover:text-blue-600 transition-colors duration-400">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all duration-400" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
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
            transform: translateY(-3px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out both;
        }

        .animate-slide-up {
          animation: slide-up 0.7s ease-out both;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2.5s ease-in-out infinite;
        }

        .animation-delay-200 {
          animation-delay: 150ms;
        }

        .animation-delay-400 {
          animation-delay: 300ms;
        }

        .animation-delay-600 {
          animation-delay: 450ms;
        }

        .animation-delay-800 {
          animation-delay: 600ms;
        }

        .animation-delay-1000 {
          animation-delay: 750ms;
        }

        .animation-delay-1200 {
          animation-delay: 900ms;
        }

        .animation-delay-1400 {
          animation-delay: 1050ms;
        }

        .animation-delay-1600 {
          animation-delay: 1200ms;
        }

        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}
