"use client"

import { CheckCircle, Loader2, Clock, ChevronRight, AlertCircle, Database, Code } from "lucide-react"
import { useState } from "react"

interface StatusCardProps {
  title: string
  description: string
  status: "complete" | "running" | "pending" | "error"
  delay?: number
  onShowDetails?: () => void
  errorMessage?: string
  sqlQuery?: string
  details?: string
}

export default function StatusCard({
  title,
  description,
  status,
  delay = 0,
  onShowDetails,
  errorMessage,
  sqlQuery,
  details,
}: StatusCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusIcon = () => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "complete":
        return "border-green-200 bg-green-50 hover:bg-green-100"
      case "running":
        return "border-blue-200 bg-blue-50 hover:bg-blue-100"
      case "pending":
        return "border-gray-200 bg-gray-50 hover:bg-gray-100"
      case "error":
        return "border-red-200 bg-red-50 hover:bg-red-100"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "complete":
        return "✓"
      case "running":
        return "..."
      case "pending":
        return "⏳"
      case "error":
        return "⚠️"
    }
  }

  return (
    <div
      className={`animate-slide-in-card ${getStatusColor()} border rounded-3xl p-4 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer max-w-xl mx-auto`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">{getStatusIcon()}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base flex items-center">
              {title}
              <span className="ml-2 text-sm">{getStatusText()}</span>
            </h3>
            <p className={`mt-0.5 text-sm ${status === "error" ? "text-red-600" : "text-gray-600"}`}>
              {status === "error" && errorMessage ? errorMessage : description}
            </p>
          </div>
        </div>

        <button
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
        >
          <span className="text-xs font-medium">Details</span>
          <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showDetails ? "rotate-90" : ""}`} />
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in space-y-3">
          <div className="text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="font-medium text-gray-700 text-xs">Status</p>
                <p className="capitalize text-sm">{status}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 text-xs">Timestamp</p>
                <p className="text-sm">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {status === "complete" && (
              <div className="bg-green-100 border border-green-200 rounded-md p-2 mb-3">
                <p className="text-green-800 font-medium flex items-center text-sm">
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  Completed successfully
                </p>
              </div>
            )}

            {status === "running" && (
              <div className="bg-blue-100 border border-blue-200 rounded-md p-2 mb-3">
                <p className="text-blue-800 font-medium flex items-center text-sm">
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Processing...
                </p>
              </div>
            )}

            {status === "error" && errorMessage && (
              <div className="bg-red-100 border border-red-200 rounded-md p-3 mb-3">
                <p className="text-red-800 font-medium flex items-center mb-1.5 text-sm">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  Error Details
                </p>
                <p className="text-red-700 text-xs">{errorMessage}</p>
              </div>
            )}

            {sqlQuery && (
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3">
                <p className="text-gray-700 font-medium flex items-center mb-1.5 text-sm">
                  <Code className="w-3 h-3 mr-1.5" />
                  Generated SQL Query
                </p>
                <pre className="text-xs text-gray-600 bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                  {sqlQuery}
                </pre>
              </div>
            )}

            {details && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 font-medium flex items-center mb-1.5 text-sm">
                  <Database className="w-3 h-3 mr-1.5" />
                  Additional Information
                </p>
                <p className="text-blue-700 text-xs">{details}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-card {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 300px; /* Adjusted for smaller content */
          }
        }

        .animate-slide-in-card {
          animation: slide-in-card 0.3s ease-out both;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
