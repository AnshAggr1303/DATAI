/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: components/ResultsDisplay.tsx =======
'use client'
import { Download, Copy, Eye } from 'lucide-react'
import { useState } from 'react'

interface QueryResult {
  query: string
  results: any[]
  rowCount: number
  executionTime?: string
}

interface ResultsDisplayProps {
  results: QueryResult | null
  query?: string
  error: string | null
  loading: boolean
}

export default function ResultsDisplay({ results, query, error, loading }: ResultsDisplayProps) {
  const [showFullQuery, setShowFullQuery] = useState(false)
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const exportToCSV = () => {
    if (!results?.results || results.results.length === 0) return
    
    const headers = Object.keys(results.results[0])
    const csvContent = [
      headers.join(','),
      ...results.results.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'query-results.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'number') {
      // Format large numbers with commas
      if (value > 999) {
        return value.toLocaleString()
      }
    }
    return String(value)
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Executing Query...</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-4"></div>
            <p className="text-blue-700">Processing your question...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Query Failed</p>
          <p className="text-red-600 mt-2">{error}</p>
          {query && (
            <details className="mt-4">
              <summary className="text-red-800 cursor-pointer hover:text-red-900">
                Show Generated Query
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-sm text-red-800 overflow-x-auto">
                {query}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  if (!results || !results.query) return null

  const hasResults = results.results && results.results.length > 0

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Query Results</h2>
        {hasResults && (
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(results.query)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <Copy className="w-4 h-4" />
              Copy SQL
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>
      
      {/* Query Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Generated SQL Query</h3>
          <button
            onClick={() => setShowFullQuery(!showFullQuery)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Eye className="w-4 h-4" />
            {showFullQuery ? 'Hide' : 'Show'} Full Query
          </button>
        </div>
        
        {showFullQuery ? (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{results.query}</pre>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-3 overflow-x-auto">
            <code className="text-sm text-gray-800">
              {results.query.length > 100 ? `${results.query.substring(0, 100)}...` : results.query}
            </code>
          </div>
        )}
      </div>

      {/* Results Display */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{results.rowCount}</span> rows returned
            </p>
            {results.executionTime && (
              <p className="text-sm text-gray-500">
                Executed at {new Date(results.executionTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        {hasResults ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  {Object.keys(results.results[0]).map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {column.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.results.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={formatValue(value)}>
                          {formatValue(value)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No results found</p>
            <p className="text-sm">The query executed successfully but returned no data.</p>
          </div>
        )}
      </div>

      {/* Query Insights */}
      {hasResults && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Query Insights</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Columns:</span>
              <span className="ml-2 font-medium">{Object.keys(results.results[0]).length}</span>
            </div>
            <div>
              <span className="text-blue-600">Rows:</span>
              <span className="ml-2 font-medium">{results.rowCount}</span>
            </div>
            <div>
              <span className="text-blue-600">Tables:</span>
              <span className="ml-2 font-medium">
                {(results.query.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi) || []).length}
              </span>
            </div>
            <div>
              <span className="text-blue-600">Query Type:</span>
              <span className="ml-2 font-medium">
                {results.query.includes('JOIN') ? 'Multi-table' : 'Single-table'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}