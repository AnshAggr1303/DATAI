/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: components/chat/MessageBubble.tsx =======
import { Database, User, Clock } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  data?: any
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Database className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`rounded-2xl px-6 py-4 shadow-sm border max-w-2xl ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-white text-gray-900 border-gray-200'
          }`}>
            <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-900'}`}>
              {message.content}
            </p>
          </div>

          {/* Timestamp */}
          <div className={`flex items-center mt-2 text-xs text-gray-500 ${isUser ? 'flex-row-reverse' : ''}`}>
            <Clock className="w-3 h-3 mr-1" />
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Insights */}
          {message.data?.insights && message.data.insights.length > 0 && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Key Insights:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                {message.data.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {insight}
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