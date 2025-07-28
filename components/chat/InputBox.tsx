/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, type KeyboardEvent } from "react"
import type React from "react"

import { Send, Loader2 } from "lucide-react"

interface InputBoxProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function InputBox({ onSendMessage, disabled }: InputBoxProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end space-x-3 bg-white rounded-2xl border border-gray-200 p-2 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100 transition-all duration-200 shadow-md hover:shadow-lg">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your data..."
          className="flex-1 resize-none border-0 bg-transparent px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 min-h-10 max-h-28 text-sm"
          rows={1}
          disabled={disabled}
          style={{
            resize: "none",
            lineHeight: "1.5",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "auto"
            target.style.height = Math.min(target.scrollHeight, 112) + "px"
          }}
        />

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center font-medium">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to send,{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift + Enter</kbd> for new line
      </p>
    </form>
  )
}
