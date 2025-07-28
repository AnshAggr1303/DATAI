/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: app/api/tables/route.ts =======
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Define types
interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string | null;
}

interface DatabaseTable {
  name: string;
  columns: TableColumn[];
  rowCount: number;
}

interface TableRow {
  table_name: string;
}

export async function GET() {
  try {
    // Try the custom function first
    const { data: tables, error: functionError } = await supabase
      .rpc('get_tables_info')

    if (!functionError && tables && Array.isArray(tables)) {
      return NextResponse.json({ tables: tables })
    }

    console.log('Custom function not available, using fallback method')
    
    // Fallback: Try to get tables using execute_sql function
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('execute_sql', {
        sql_query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
          ORDER BY table_name
        `
      })

    let tableNames: TableRow[] = []
    
    if (!sqlError && sqlResult) {
      console.log('SQL Result:', sqlResult)
      
      // Handle different possible return formats
      if (Array.isArray(sqlResult)) {
        tableNames = sqlResult as TableRow[]
      } else if (typeof sqlResult === 'string') {
        try {
          const parsed = JSON.parse(sqlResult)
          tableNames = Array.isArray(parsed) ? parsed as TableRow[] : []
        } catch (e) {
          console.error('Error parsing SQL result:', e)
          tableNames = []
        }
      } else if (sqlResult && typeof sqlResult === 'object') {
        // If it's an object, it might be an error
        if ('error' in sqlResult) {
          throw new Error(sqlResult.error as string)
        }
        tableNames = []
      }
    } else {
      console.error('SQL Error:', sqlError)
      // If execute_sql doesn't work, try a manual approach
      return await getTablesManually()
    }

    console.log('Table names found:', tableNames)

    if (!Array.isArray(tableNames) || tableNames.length === 0) {
      // Last resort: return manual table list or empty array
      return NextResponse.json({ 
        tables: [],
        message: 'No tables found or insufficient permissions'
      })
    }

    // Get detailed info for each table
    const tablesWithInfo = await Promise.all(
      tableNames.map(async (tableRow: TableRow): Promise<DatabaseTable | null> => {
        const tableName = tableRow.table_name
        
        if (!tableName) {
          console.warn('Invalid table name:', tableRow)
          return null
        }

        try {
          // Get columns using execute_sql
          const { data: columnsData, error: colError } = await supabase
            .rpc('execute_sql', {
              sql_query: `
                SELECT 
                  column_name, 
                  data_type, 
                  is_nullable, 
                  column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = '${tableName}'
                ORDER BY ordinal_position
              `
            })

          let columns: TableColumn[] = []
          if (!colError && columnsData) {
            if (Array.isArray(columnsData)) {
              columns = columnsData as TableColumn[]
            } else if (typeof columnsData === 'string') {
              try {
                const parsed = JSON.parse(columnsData)
                columns = Array.isArray(parsed) ? parsed as TableColumn[] : []
              } catch (e) {
                console.error(`Error parsing columns for ${tableName}:`, e)
                columns = []
              }
            }
          }

          // Try to get row count
          let rowCount = 0
          try {
            const { count, error: countError } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })
            
            if (!countError) {
              rowCount = count || 0
            }
          } catch (countError) {
            console.warn(`Could not get row count for ${tableName}:`, countError)
          }

          return {
            name: tableName,
            columns: columns,
            rowCount: rowCount
          }
        } catch (error) {
          console.error(`Error processing table ${tableName}:`, error)
          return {
            name: tableName,
            columns: [],
            rowCount: 0
          }
        }
      })
    )

    // Filter out null results
    const validTables = tablesWithInfo.filter((table): table is DatabaseTable => table !== null)

    return NextResponse.json({ tables: validTables })

  } catch (error: any) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch tables',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Manual fallback method
async function getTablesManually(): Promise<NextResponse> {
  console.log('Trying manual table detection...')
  
  // You can hardcode known table names here as a last resort
  const possibleTables = [
    'users', 'posts', 'comments', 'orders', 'products', 'customers',
    'invoices', 'payments', 'categories', 'items', 'transactions'
  ]
  
  const existingTables: DatabaseTable[] = []
  
  for (const tableName of possibleTables) {
    try {
      // Try to query the table to see if it exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error) {
        // Table exists, get more info
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        // Infer columns from first row if available
        let columns: TableColumn[] = []
        if (data && data.length > 0) {
          columns = Object.keys(data[0]).map(key => ({
            column_name: key,
            data_type: typeof data[0][key],
            is_nullable: 'YES'
          }))
        }
        
        existingTables.push({
          name: tableName,
          columns: columns,
          rowCount: count || 0
        })
      }
    } catch (e) {
      // Table doesn't exist or no access, skip
      continue
    }
  }
  
  return NextResponse.json({ 
    tables: existingTables,
    message: 'Using manual table detection'
  })
}