"use client"

import { DollarSign, Package, Users, BarChart3 } from "lucide-react"

interface SuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

export default function Suggestions({ onSuggestionClick }: SuggestionsProps) {
  const suggestionCategories = [
    {
      icon: DollarSign,
      category: "Revenue & Sales",
      color: "text-green-600 bg-green-50",
      borderColor: "border-green-200 hover:border-green-300",
      suggestions: [
        "What's our monthly revenue trend?",
        "Who are our top 5 customers by spending?",
        "Show me daily sales for the last 30 days",
        "What's our total revenue this year?",
      ],
    },
    {
      icon: Package,
      category: "Products",
      color: "text-orange-600 bg-orange-50",
      borderColor: "border-orange-200 hover:border-orange-300",
      suggestions: [
        "Which products sell best?",
        "Show me low-stock items",
        "What's our product category performance?",
        "Which products have highest profit margins?",
      ],
    },
    {
      icon: Users,
      category: "Customers",
      color: "text-blue-600 bg-blue-50",
      borderColor: "border-blue-200 hover:border-blue-300",
      suggestions: [
        "How many new customers this month?",
        "Who are our most loyal customers?",
        "Which customers haven't ordered recently?",
        "Show me customer demographics",
      ],
    },
    {
      icon: BarChart3,
      category: "Analytics",
      color: "text-purple-600 bg-purple-50",
      borderColor: "border-purple-200 hover:border-purple-300",
      suggestions: [
        "What's our average order value?",
        "Show me order completion rates",
        "How many orders are pending payment?",
        "Show me seasonal sales patterns",
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {suggestionCategories.map((category, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-2xl p-6 border ${category.borderColor} shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up`}
          style={{ animationDelay: `${idx * 150}ms` }}
        >
          <div className="flex items-center mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${category.color} shadow-sm`}>
              <category.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">{category.category}</h3>
          </div>

          <div className="space-y-2">
            {category.suggestions.slice(0, 4).map((suggestion, sIdx) => (
              <button
                key={sIdx}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-sm transition-all duration-200 group transform hover:scale-102 hover:shadow-sm"
                style={{ animationDelay: `${(idx * 4 + sIdx) * 100}ms` }}
              >
                <span className="group-hover:font-semibold transition-all duration-200">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
