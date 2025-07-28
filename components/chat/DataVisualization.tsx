/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: components/chat/DataVisualization.tsx =======
'use client'
import { useState } from 'react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Download, Copy, Table, TrendingUp, Clock, Database } from 'lucide-react'

interface DataVisualizationProps {
  data: {
    query: string
    results: any[]
    rowCount: number
    executionTime?: string
    responseMessage?: string
    insights?: string[]
    chartType?: 'line' | 'bar' | 'pie' | 'table'
  }
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
]

export default function DataVisualization({ data }: DataVisualizationProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>(data.chartType === 'table' ? 'table' : 'chart')

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'number' && value > 999) {
      return value.toLocaleString()
    }
    return String(value)
  }

  const convertToCSV = (results: any[]): string => {
    if (!results || results.length === 0) return ''
    
    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    return csvContent
  }

  const downloadCSV = (): void => {
    const csvContent = convertToCSV(data.results)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-results-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copySQL = (): void => {
    navigator.clipboard.writeText(data.query)
  }

  const prepareChartData = () => {
    if (!data.results || data.results.length === 0) return []
    
    // For pie charts, we need name and value pairs
    if (data.chartType === 'pie' && data.results.length > 0) {
      const firstRow = data.results[0]
      const keys = Object.keys(firstRow)
      
      // Try to find a name field and a numeric field
      const nameField = keys.find(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('category') || 
        key.toLowerCase().includes('product') ||
        key.toLowerCase().includes('customer')
      ) || keys[0]
      
      const valueField = keys.find(key => 
        typeof firstRow[key] === 'number' && 
        key !== nameField
      ) || keys[1]
      
      return data.results.map(item => ({
        name: String(item[nameField] || 'Unknown'),
        value: Number(item[valueField]) || 0
      }))
    }
    
    return data.results
  }

  const renderChart = () => {
    const chartData = prepareChartData()
    
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No data available for visualization</p>
          </div>
        </div>
      )
    }

    const chartProps = {
      width: '100%',
      height: 400,
      data: chartData
    }

    switch (data.chartType) {
      case 'line':
        const lineKeys = Object.keys(chartData[0] || {}).filter(key => 
          typeof chartData[0][key] === 'number'
        )
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey={Object.keys(chartData[0] || {})[0]} 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {lineKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        const barKeys = Object.keys(chartData[0] || {}).filter(key => 
          typeof chartData[0][key] === 'number'
        )
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey={Object.keys(chartData[0] || {})[0]}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {barKeys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                {data.rowCount} rows
              </span>
            </div>
            {data.executionTime && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date(data.executionTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'chart' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={data.chartType === 'table'}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table className="w-4 h-4 inline mr-1" />
                Table
              </button>
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={copySQL}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>SQL</span>
            </button>
            <button
              onClick={downloadCSV}
              className="px-3 py-1 text-sm bg-green-200 hover:bg-green-300 text-green-800 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'chart' && data.chartType !== 'table' ? (
          <div className="mb-6">
            {renderChart()}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {data.results && data.results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(data.results[0]).map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200"
                        >
                          {column.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.results.map((row, index) => (
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
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No results found</p>
                <p className="text-sm">The query executed successfully but returned no data.</p>
              </div>
            )}
          </div>
        )}

        {/* SQL Query Display */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2 flex items-center space-x-2">
            <span>View Generated SQL Query</span>
          </summary>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">{data.query}</pre>
          </div>
        </details>
      </div>
    </div>
  )
}