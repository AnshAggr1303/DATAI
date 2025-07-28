// ======= FILE: components/QueryInput.tsx =======
'use client'
import { useState } from 'react'
import { Send, Loader2, Lightbulb } from 'lucide-react'

interface QueryInputProps {
  onQuery: (question: string) => Promise<void>  // Fixed: should return Promise<void>
  loading: boolean
  selectedTables: string[]
}

export default function QueryInput({ onQuery, loading, selectedTables }: QueryInputProps) {
  const [question, setQuestion] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim() && selectedTables.length > 0) {
      await onQuery(question.trim())  // Fixed: await the promise
    }
  }

  const complexExamples = [
    "Who are the top 5 customers by total spending?",
    "What are the monthly revenue trends?",
    "Show me incomplete orders with customer details",
    "Which products have the highest average order value?",
    "List customers who haven't placed orders recently",
    "What's the total revenue per product category?",
    "Show me the order completion rate by month",
    "Find customers with multiple high-value orders"
  ]

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Step 2: Ask Your Question</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a complex question about your data..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || selectedTables.length === 0}
          />
          <button
            type="submit"
            disabled={loading || !question.trim() || selectedTables.length === 0}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Processing...' : 'Query'}
          </button>
        </div>
      </form>

      {selectedTables.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 font-medium">⚠️ Please select at least one table first</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">Try these complex queries:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {complexExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuestion(example)}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-sm transition-all"
              disabled={loading || selectedTables.length === 0}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}