/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database, User, Clock } from "lucide-react"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  data?: any
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-in`}>
      <div className={`flex items-start space-x-3 max-w-2xl ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
            isUser ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-blue-600 to-purple-600"
          }`}
        >
          {isUser ? <User className="w-4 h-4 text-white" /> : <Database className="w-4 h-4 text-white" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          {/* Message Bubble */}
          <div
            className={`rounded-xl px-5 py-3 shadow-sm border max-w-xl transition-all duration-200 hover:shadow-md ${
              isUser
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : "bg-white text-gray-900 border-gray-200"
            }`}
          >
            <p className={`text-sm leading-relaxed ${isUser ? "text-white" : "text-gray-900"}`}>{message.content}</p>
          </div>

          {/* Timestamp */}
          <div className={`flex items-center mt-2 text-xs text-gray-500 ${isUser ? "flex-row-reverse" : ""}`}>
            <Clock className="w-3 h-3 mr-1" />
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Insights */}
          {message.data?.insights && message.data.insights.length > 0 && (
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 max-w-xl animate-fade-in-up">
              <div className="flex items-center mb-2">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">💡</span>
                </div>
                <p className="text-sm font-semibold text-blue-900">Key Insights</p>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                {message.data.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start group">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0 group-hover:bg-blue-500 transition-colors"></span>
                    <span className="group-hover:text-blue-900 transition-colors">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
