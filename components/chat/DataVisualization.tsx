/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, Copy, Table, TrendingUp, Clock, Database, CheckCircle } from "lucide-react"

interface DataVisualizationProps {
  data: {
    query: string
    results: any[]
    rowCount: number
    executionTime?: string
    responseMessage?: string
    insights?: string[]
    chartType?: "line" | "bar" | "pie" | "table"
  }
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
]

export default function DataVisualization({ data }: DataVisualizationProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">(data.chartType === "table" ? "table" : "chart")
  const [copied, setCopied] = useState(false)

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "object") return JSON.stringify(value)
    if (typeof value === "number" && value > 999) {
      return value.toLocaleString()
    }
    return String(value)
  }

  const convertToCSV = (results: any[]): string => {
    if (!results || results.length === 0) return ""

    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join(","),
      ...results.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  const downloadCSV = (): void => {
    const csvContent = convertToCSV(data.results)
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `query-results-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copySQL = (): void => {
    navigator.clipboard.writeText(data.query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const prepareChartData = () => {
    if (!data.results || data.results.length === 0) return []

    // For pie charts, we need name and value pairs
    if (data.chartType === "pie" && data.results.length > 0) {
      const firstRow = data.results[0]
      const keys = Object.keys(firstRow)

      // Try to find a name field and a numeric field
      const nameField =
        keys.find(
          (key) =>
            key.toLowerCase().includes("name") ||
            key.toLowerCase().includes("category") ||
            key.toLowerCase().includes("product") ||
            key.toLowerCase().includes("customer"),
        ) || keys[0]

      const valueField = keys.find((key) => typeof firstRow[key] === "number" && key !== nameField) || keys[1]

      return data.results.map((item) => ({
        name: String(item[nameField] || "Unknown"),
        value: Number(item[valueField]) || 0,
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
            <Database className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-base font-medium text-gray-600">No data available for visualization</p>
            <p className="text-sm text-gray-500">Try a different query or check your data source</p>
          </div>
        </div>
      )
    }

    const chartProps = {
      width: "100%",
      height: 300, // Reduced height
      data: chartData,
    }

    switch (data.chartType) {
      case "line":
        const lineKeys = Object.keys(chartData[0] || {}).filter((key) => typeof chartData[0][key] === "number")

        return (
          <ResponsiveContainer width="100%" height={chartProps.height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={Object.keys(chartData[0] || {})[0]} stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 5px 10px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {lineKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        const barKeys = Object.keys(chartData[0] || {}).filter((key) => typeof chartData[0][key] === "number")

        return (
          <ResponsiveContainer width="100%" height={chartProps.height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={Object.keys(chartData[0] || {})[0]} stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 5px 10px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {barKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartProps.height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100} // Reduced outerRadius
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
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900 text-base">{data.rowCount.toLocaleString()} rows</span>
            </div>
            {data.executionTime && (
              <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                <Clock className="w-3 h-3" />
                <span>{new Date(data.executionTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode("chart")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                  viewMode === "chart"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                disabled={data.chartType === "table"}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Chart</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Table</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={copySQL}
              className="px-3 py-1.5 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all duration-200 flex items-center space-x-1 border border-gray-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "SQL"}</span>
            </button>
            <button
              onClick={downloadCSV}
              className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === "chart" && data.chartType !== "table" ? (
          <div className="mb-6">{renderChart()}</div>
        ) : (
          <div className="overflow-x-auto">
            {data.results && data.results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(data.results[0]).map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                        >
                          {column.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.results.map((row, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                        {Object.entries(row).map(([key, value], cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2.5 text-sm text-gray-900">
                            <div className="max-w-xs truncate font-medium" title={formatValue(value)}>
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
              <div className="text-center py-10 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold mb-2 text-gray-600">No results found</p>
                <p className="text-sm text-gray-500">The query executed successfully but returned no data.</p>
              </div>
            )}
          </div>
        )}

        {/* SQL Query Display */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-3 flex items-center space-x-2 font-medium">
            <span>View Generated SQL Query</span>
          </summary>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto shadow-md">
            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{data.query}</pre>
          </div>
        </details>
      </div>
    </div>
  )
}
