/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: app/page.tsx =======
'use client'
import { useState, useEffect } from 'react'
import TableSelector from '@/components/TableSelector'
import QueryInput from '@/components/QueryInput'
import ResultsDisplay from '@/components/ResultsDisplay'

interface DatabaseTable {
  name: string
  columns: any[]
  rowCount: number
}

interface QueryResult {
  query: string
  results: any[]
  rowCount: number
  executionTime?: string
}

export default function HomePage() {
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tablesLoading, setTablesLoading] = useState(true)

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setTablesLoading(true)
      const response = await fetch('/api/tables')
      const data = await response.json()
      
      if (response.ok) {
        setTables(data.tables)
      } else {
        setError(data.error || 'Failed to fetch tables')
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
      setError('Failed to connect to database')
    } finally {
      setTablesLoading(false)
    }
  }

  const handleQuery = async (question: string) => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          selectedTables,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || 'Failed to execute query')
      }
    } catch (error) {
      console.error('Query error:', error)
      setError('Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  if (tablesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading database tables...</p>
        </div>
      </div>
    )
  }

  if (error && !tables.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchTables}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to DATAI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ask complex questions about your data in plain English. 
          Select the tables you want to query, then type your question.
        </p>
      </div>

      {/* Main Interface */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <TableSelector
          tables={tables}
          selectedTables={selectedTables}
          onTableSelect={setSelectedTables}
        />

        <QueryInput
          onQuery={handleQuery}
          loading={loading}
          selectedTables={selectedTables}
        />

        <ResultsDisplay
          results={results}
          query={results?.query}
          error={error}
          loading={loading}
        />
      </div>

      {/* Info Section */}
      <div className="text-center text-sm text-gray-500">
        <p>
          DATAI uses AI to convert your natural language questions into SQL queries.
          <br />
          All queries are read-only for your data safety.
        </p>
      </div>
    </div>
  )
}