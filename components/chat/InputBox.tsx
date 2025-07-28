/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: components/chat/InputBox.tsx =======
'use client'
import { useState, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface InputBoxProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function InputBox({ onSendMessage, disabled }: InputBoxProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end space-x-3 bg-white rounded-2xl border border-gray-300 p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your data..."
          className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 min-h-12 max-h-32"
          rows={1}
          disabled={disabled}
          style={{
            resize: 'none',
            lineHeight: '1.5',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 128) + 'px'
          }}
        />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Press Enter to send, Shift + Enter for new line
      </p>
    </form>
  )
}