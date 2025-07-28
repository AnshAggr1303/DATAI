// ======= FILE: components/TableSelector.tsx =======
'use client'
import { Database } from 'lucide-react'

interface TableColumn {
  column_name: string
  data_type: string
  is_nullable?: string
}

interface DatabaseTable {
  name: string
  columns: TableColumn[]
  rowCount: number
}

interface TableSelectorProps {
  tables: DatabaseTable[]
  selectedTables: string[]
  onTableSelect: (tables: string[]) => void
}

export default function TableSelector({ tables, selectedTables, onTableSelect }: TableSelectorProps) {
  const handleTableClick = (tableName: string) => {
    const isSelected = selectedTables.includes(tableName)
    if (isSelected) {
      onTableSelect(selectedTables.filter(t => t !== tableName))
    } else {
      onTableSelect([...selectedTables, tableName])
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Step 1: Select Tables</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => handleTableClick(table.name)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedTables.includes(table.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Database className={`w-8 h-8 mb-2 ${
                selectedTables.includes(table.name) ? 'text-blue-500' : 'text-gray-500'
              }`} />
              <h3 className="font-medium capitalize">{table.name}</h3>
              <p className="text-sm text-gray-500">{table.rowCount} rows</p>
              <p className="text-xs text-gray-400 mt-1">
                {table.columns.length} columns
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}