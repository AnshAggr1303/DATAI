/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: app/api/query/route.ts =======
import { supabase } from '@/lib/supabase'
import { generateSQL } from '@/lib/gemini'
import { NextResponse } from 'next/server'

// Define types for better TypeScript support
interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface ForeignKey {
  column_name: string;
  referenced_table_name: string;
  referenced_column_name: string;
}

interface TableSchema {
  table_name: string;
  columns: TableColumn[];
  foreign_keys: ForeignKey[];
  sample_data: any[];
  row_count: number;
}

export async function POST(request: Request) {
  try {
    const { question, selectedTables } = await request.json()

    if (!question || !selectedTables || selectedTables.length === 0) {
      return NextResponse.json(
        { error: 'Question and selected tables are required' },
        { status: 400 }
      )
    }

    // Get detailed table schemas including relationships
    const detailedSchemas = await getDetailedTableSchemas(selectedTables)
    
    if (detailedSchemas.length === 0) {
      throw new Error('No valid tables found or insufficient permissions')
    }

    // Generate SQL using Gemini with enhanced context
    const sqlQuery = await generateSQL(question, detailedSchemas)
    
    console.log('Generated SQL:', sqlQuery)

    // Execute the complex SQL query using our Supabase function
    const { data: results, error: queryError } = await supabase.rpc('execute_sql', {
      sql_query: sqlQuery
    })

    if (queryError) {
      console.error('SQL execution error:', queryError)
      throw new Error(`Query execution failed: ${queryError.message}`)
    }

    // Check if results contain an error (from our SQL function)
    if (results && typeof results === 'object' && 'error' in results) {
      throw new Error(results.error as string)
    }

    // Parse results if they're a string
    let parsedResults: any = results
    if (typeof results === 'string') {
      try {
        parsedResults = JSON.parse(results)
      } catch (e) {
        parsedResults = results
      }
    }

    return NextResponse.json({
      query: sqlQuery,
      results: parsedResults || [],
      rowCount: Array.isArray(parsedResults) ? parsedResults.length : 0,
      executionTime: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Query error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to execute query',
        query: null,
        results: [],
        rowCount: 0
      },
      { status: 500 }
    )
  }
}

async function getDetailedTableSchemas(selectedTables: string[]): Promise<TableSchema[]> {
  const schemas: TableSchema[] = []
  
  for (const tableName of selectedTables) {
    try {
      // Get columns using execute_sql function
      const { data: columnsData, error: colError } = await supabase
        .rpc('execute_sql', {
          sql_query: `
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = '${tableName}'
            ORDER BY ordinal_position
          `
        })

      let columns: TableColumn[] = []
      if (!colError && columnsData) {
        try {
          if (Array.isArray(columnsData)) {
            columns = columnsData as TableColumn[]
          } else if (typeof columnsData === 'string') {
            const parsed = JSON.parse(columnsData)
            columns = Array.isArray(parsed) ? parsed as TableColumn[] : []
          } else if (columnsData && typeof columnsData === 'object' && !('error' in columnsData)) {
            columns = [columnsData] as TableColumn[]
          }
        } catch (parseError) {
          console.error(`Error parsing columns for ${tableName}:`, parseError)
          columns = []
        }
      } else {
        console.error(`Error fetching columns for ${tableName}:`, colError)
      }

      // Get foreign key relationships using execute_sql
      const { data: foreignKeysData, error: fkError } = await supabase
        .rpc('execute_sql', {
          sql_query: `
            SELECT 
              kcu.column_name,
              kcu.referenced_table_name,
              kcu.referenced_column_name
            FROM information_schema.key_column_usage kcu
            WHERE kcu.table_schema = 'public'
            AND kcu.table_name = '${tableName}'
            AND kcu.referenced_table_name IS NOT NULL
          `
        })

      let foreignKeys: ForeignKey[] = []
      if (!fkError && foreignKeysData) {
        try {
          if (Array.isArray(foreignKeysData)) {
            foreignKeys = foreignKeysData as ForeignKey[]
          } else if (typeof foreignKeysData === 'string') {
            const parsed = JSON.parse(foreignKeysData)
            foreignKeys = Array.isArray(parsed) ? parsed as ForeignKey[] : []
          }
        } catch (parseError) {
          console.error(`Error parsing foreign keys for ${tableName}:`, parseError)
          foreignKeys = []
        }
      } else if (fkError) {
        console.error(`Error fetching foreign keys for ${tableName}:`, fkError)
      }

      // Get sample data for better AI context
      let sampleData: any[] = []
      try {
        const { data, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)

        if (!sampleError && data) {
          sampleData = data
        } else if (sampleError) {
          console.warn(`Could not fetch sample data for ${tableName}:`, sampleError.message)
        }
      } catch (sampleError) {
        console.warn(`Could not fetch sample data for ${tableName}:`, sampleError)
      }

      if (columns.length > 0) {
        schemas.push({
          table_name: tableName,
          columns: columns,
          foreign_keys: foreignKeys,
          sample_data: sampleData,
          row_count: sampleData.length
        })
      }
    } catch (error) {
      console.error(`Error processing table ${tableName}:`, error)
    }
  }
  
  return schemas
}