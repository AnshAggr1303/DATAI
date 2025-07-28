/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ======= FILE: lib/gemini.ts =======
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface SmartSQLResponse {
  sqlQuery: string
  chartType: 'line' | 'bar' | 'pie' | 'table'
  responseMessage: string
  insights: string[]
}

export async function generateSmartSQL(question: string, detailedSchemas: any[]): Promise<SmartSQLResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  
  const schemaContext = detailedSchemas.map(schema => {
    const fkInfo = schema.foreign_keys?.length > 0 
      ? `\nForeign Keys: ${schema.foreign_keys.map((fk: any) => 
          `${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`
        ).join(', ')}`
      : ''
    
    const sampleInfo = schema.sample_data?.length > 0
      ? `\nSample Data (${schema.row_count} total rows): ${JSON.stringify(schema.sample_data.slice(0, 2), null, 2)}`
      : `\nTotal Rows: ${schema.row_count || 0}`
    
    return `
Table: ${schema.table_name}
Columns: ${schema.columns.map((col: any) => 
  `${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`
).join(', ')}${fkInfo}${sampleInfo}
`
  }).join('\n')
  
  const availableTables = detailedSchemas.map(s => s.table_name).join(', ')
  
  const prompt = `
You are an expert PostgreSQL developer and data analyst. The database contains business/e-commerce data. Your task is to:
1. Understand the user's business question
2. Automatically determine which tables are needed
3. Generate the appropriate PostgreSQL query
4. Suggest the best visualization type
5. Provide helpful insights

AVAILABLE DATABASE SCHEMA:
${schemaContext}

AVAILABLE TABLES: ${availableTables}

IMPORTANT DATABASE RULES:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use proper PostgreSQL syntax and functions
- Use appropriate JOINs when querying multiple tables
- Add meaningful column aliases for calculated fields
- Use LIMIT 50 unless user asks for "all" or specifies a number
- Use aggregate functions (COUNT, SUM, AVG, MAX, MIN) when appropriate
- For "top" or "highest" queries, use ORDER BY with LIMIT
- For date/time analysis, use DATE_TRUNC for grouping by periods
- Do NOT include semicolons at the end of the query
- Format numbers and dates appropriately
- Use COALESCE for handling null values in calculations
- Use table aliases (u for users, o for orders, oi for order_items, p for products, i for invoices)
- Always include relevant context columns for better understanding

CRITICAL JOIN RULES:
- orders.id = invoices.order_id (CORRECT: o.id = i.order_id)
- users.id = orders.user_id (CORRECT: u.id = o.user_id)
- products.id = order_items.product_id (CORRECT: p.id = oi.product_id)
- orders.id = order_items.order_id (CORRECT: o.id = oi.order_id)

NEVER USE: o.order_id (this column does not exist!)
ALWAYS USE: o.id = i.order_id (to join orders with invoices)

BUSINESS CONTEXT UNDERSTANDING:
- Revenue queries: Use paid invoices (invoices with paid_at NOT NULL) for actual revenue
- Customer analysis: Join users with their orders/purchases
- Product performance: Use order_items to see what's actually selling
- Sales trends: Group by time periods using DATE_TRUNC
- Top performers: Use ORDER BY with LIMIT
- Recent activity: Use date filters like created_at >= CURRENT_DATE - INTERVAL 'X days'

CHART TYPE SELECTION RULES:
- 'line': Time series data, trends over time, temporal analysis (monthly sales, growth trends)
- 'bar': Comparisons, rankings, categories (top customers, product performance, category breakdown)
- 'pie': Distributions, percentages, parts of whole (market share, category splits)
- 'table': Detailed listings, specific records, when users want to see individual items

RESPONSE MESSAGE GUIDELINES:
- Be conversational and business-focused
- Explain what the data shows in simple terms
- Mention key business insights
- Use natural language, avoid technical jargon
- Address the user directly ("Here's your..." or "Your data shows...")

BUSINESS QUERY EXAMPLES:

Question: "What's our monthly revenue trend?"
SQL: SELECT DATE_TRUNC('month', i.paid_at) as month, SUM(i.amount) as revenue, COUNT(DISTINCT i.order_id) as orders_paid FROM invoices i WHERE i.paid_at IS NOT NULL AND i.paid_at >= CURRENT_DATE - INTERVAL '12 months' GROUP BY month ORDER BY month
CHART: line
MESSAGE: Here's your monthly revenue trend based on actually paid invoices over the past year. This shows your real cash flow and business growth patterns.
INSIGHTS: ["12 months of actual revenue data", "Based on paid invoices only", "Shows seasonal business patterns", "Includes order volume metrics"]

Question: "Who are my best customers?"
SQL: SELECT u.first_name || ' ' || u.last_name as customer_name, u.email, COUNT(o.id) as total_orders, SUM(COALESCE(i.amount, 0)) as total_paid, MAX(o.created_at) as last_order_date FROM users u LEFT JOIN orders o ON u.id = o.user_id LEFT JOIN invoices i ON o.id = i.order_id AND i.paid_at IS NOT NULL GROUP BY u.id, u.first_name, u.last_name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_paid DESC LIMIT 20
CHART: bar
MESSAGE: Here are your top customers ranked by total payments received. These are your most valuable customers who actually pay their invoices.
INSIGHTS: ["Top 20 paying customers", "Includes contact information", "Shows purchase frequency", "Based on actual payments received"]

REMEMBER: NEVER write o.order_id - orders table has 'id', invoices table has 'order_id'

Question: "Which products sell best?"
SQL: SELECT p.name as product_name, p.category, COUNT(oi.id) as times_ordered, SUM(oi.quantity) as total_quantity_sold, SUM(oi.quantity * oi.price) as total_revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name, p.category ORDER BY total_quantity_sold DESC LIMIT 20
CHART: bar
MESSAGE: Here are your best-selling products by quantity sold, along with their revenue contribution and order frequency.
INSIGHTS: ["Top 20 products by sales volume", "Includes revenue per product", "Shows category distribution", "Order frequency included"]

Question: "Show me recent unpaid orders"
SQL: SELECT u.first_name || ' ' || u.last_name as customer_name, u.email, o.id as order_id, o.total_amount, o.status, o.created_at, CASE WHEN i.id IS NULL THEN 'No Invoice' ELSE 'Invoice Created' END as invoice_status FROM orders o JOIN users u ON o.user_id = u.id LEFT JOIN invoices i ON o.id = i.order_id WHERE (i.paid_at IS NULL OR i.id IS NULL) AND o.created_at >= CURRENT_DATE - INTERVAL '30 days' ORDER BY o.created_at DESC LIMIT 30
CHART: table
MESSAGE: Here are your recent orders from the last 30 days that haven't been paid yet. This helps you track which customers need payment follow-up.
INSIGHTS: ["Last 30 days of unpaid orders", "Customer contact info included", "Invoice status tracking", "Sorted by order date"]

Question: "How many new customers this month?"
SQL: SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as new_customers FROM users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY month
CHART: bar
MESSAGE: Here's your new customer acquisition for the current month compared to previous months.
INSIGHTS: ["Current month customer growth", "Monthly comparison available", "New user registrations tracked"]

Now analyze the user's question: "${question}"

IMPORTANT: Always choose the most relevant tables automatically based on the question. Don't ask the user to select tables.

Return your response in this exact JSON format:
{
  "sqlQuery": "your_postgresql_query_here",
  "chartType": "line|bar|pie|table",
  "responseMessage": "your_helpful_business_message_here",
  "insights": ["insight1", "insight2", "insight3", "insight4"]
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let textResponse = response.text().trim()
    
    // Clean up response - remove markdown formatting
    textResponse = textResponse.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
    
    // Try to parse JSON response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(textResponse)
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', textResponse)
      // Fallback: try to extract SQL from text
      const sqlMatch = textResponse.match(/SELECT[\s\S]*?(?=\n\n|$)/i)
      const sqlQuery = sqlMatch ? sqlMatch[0].trim() : ''
      
      return {
        sqlQuery: sqlQuery || generateFallbackQuery(question, detailedSchemas),
        chartType: detectChartTypeFromQuestion(question),
        responseMessage: `I've analyzed your question "${question}" and generated a query based on your available data.`,
        insights: [`Analysis completed for: ${question}`, `Using available tables: ${availableTables}`]
      }
    }
    
    // Validate and clean the SQL query
    let sqlQuery = parsedResponse.sqlQuery || ''
    sqlQuery = cleanSQLQuery(sqlQuery)
    
    // Validate chart type
    const validChartTypes = ['line', 'bar', 'pie', 'table']
    const chartType = validChartTypes.includes(parsedResponse.chartType) 
      ? parsedResponse.chartType 
      : detectChartTypeFromQuestion(question)
    
    return {
      sqlQuery,
      chartType,
      responseMessage: parsedResponse.responseMessage || `Here's the analysis for your question: "${question}"`,
      insights: Array.isArray(parsedResponse.insights) 
        ? parsedResponse.insights.slice(0, 4) 
        : [`Analysis completed for: ${question}`, `Tables analyzed: ${availableTables}`]
    }
    
  } catch (error) {
    console.error('Gemini API error:', error)
    
    // Fallback response
    return {
      sqlQuery: generateFallbackQuery(question, detailedSchemas),
      chartType: detectChartTypeFromQuestion(question),
      responseMessage: `I've generated an analysis for your question: "${question}". The results should help provide the insights you're looking for.`,
      insights: [`Fallback query generated`, `Question analyzed: ${question}`, `Available data sources used`]
    }
  }
}

function cleanSQLQuery(sqlQuery: string): string {
  if (!sqlQuery) return ''
  
  // Remove markdown formatting
  sqlQuery = sqlQuery.replace(/```sql\n?/gi, '').replace(/```\n?/gi, '').trim()
  
  // Remove any extra explanations
  const lines = sqlQuery.split('\n')
  const sqlLines = []
  let inQuery = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.toLowerCase().startsWith('select')) {
      inQuery = true
    }
    if (inQuery) {
      sqlLines.push(line)
    }
  }
  
  sqlQuery = sqlLines.join('\n').trim()
  
  // Remove trailing semicolon
  if (sqlQuery.endsWith(';')) {
    sqlQuery = sqlQuery.slice(0, -1).trim()
  }
  
  // Fix common JOIN mistakes
  sqlQuery = sqlQuery.replace(/o\.order_id\s*=\s*o\.id/gi, 'o.id = i.order_id')
  sqlQuery = sqlQuery.replace(/orders\.order_id\s*=\s*orders\.id/gi, 'orders.id = invoices.order_id')
  
  // Validation
  if (!sqlQuery.toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed')
  }
  
  // Check for invalid column references
  if (sqlQuery.toLowerCase().includes('o.order_id')) {
    throw new Error('Invalid column reference: o.order_id does not exist. Use o.id = i.order_id instead')
  }
  
  // Check for dangerous keywords
  const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'truncate']
  const lowerQuery = sqlQuery.toLowerCase()
  
  for (const keyword of dangerousKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(lowerQuery)) {
      throw new Error(`Dangerous operation "${keyword}" not allowed`)
    }
  }
  
  // Special check for CREATE
  if (/\bcreate\s+(table|database|index|view|function|procedure|trigger)/i.test(lowerQuery)) {
    throw new Error('Dangerous operation "create" not allowed')
  }
  
  return sqlQuery
}

function detectChartTypeFromQuestion(question: string): 'line' | 'bar' | 'pie' | 'table' {
  const lowerQuestion = question.toLowerCase()
  
  // Time-based patterns for line charts
  if (lowerQuestion.match(/\b(trend|over time|monthly|daily|weekly|yearly|growth|change|timeline|history|progression)\b/)) {
    return 'line'
  }
  
  // Distribution patterns for pie charts
  if (lowerQuestion.match(/\b(distribution|breakdown|percentage|share|proportion|split|composition|category.*breakdown)\b/)) {
    return 'pie'
  }
  
  // Comparison patterns for bar charts
  if (lowerQuestion.match(/\b(top|best|worst|highest|lowest|most|least|compare|comparison|rank|ranking|vs)\b/)) {
    return 'bar'
  }
  
  // List/detail patterns for table
  if (lowerQuestion.match(/\b(show me|list|details|recent|latest|all|who are|what are)\b/)) {
    return 'table'
  }
  
  // Default to table for detailed queries
  return 'table'
}

function generateFallbackQuery(question: string, schemas: any[]): string {
  const lowerQuestion = question.toLowerCase()
  const tableNames = schemas.map(s => s.table_name)
  
  // Revenue/Sales related queries
  if (lowerQuestion.match(/\b(revenue|sales|money|income|earnings|profit)\b/)) {
    if (tableNames.includes('invoices')) {
      return `SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount) as revenue, COUNT(*) as paid_invoices FROM invoices WHERE paid_at IS NOT NULL AND paid_at >= CURRENT_DATE - INTERVAL '6 months' GROUP BY month ORDER BY month`
    }
    if (tableNames.includes('orders')) {
      return `SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as revenue, COUNT(*) as orders FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' GROUP BY month ORDER BY month`
    }
  }
  
  // Customer related queries - FIXED JOIN CONDITION
  if (lowerQuestion.match(/\b(customer|client|user|buyer)\b/)) {
    if (tableNames.includes('users') && tableNames.includes('orders')) {
      return `SELECT u.first_name || ' ' || u.last_name as customer_name, u.email, COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount), 0) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.first_name, u.last_name, u.email ORDER BY total_spent DESC LIMIT 20`
    }
    if (tableNames.includes('users')) {
      return `SELECT first_name, last_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 20`
    }
  }
  
  // Product related queries
  if (lowerQuestion.match(/\b(product|item|inventory|catalog)\b/)) {
    if (tableNames.includes('products') && tableNames.includes('order_items')) {
      return `SELECT p.name, p.category, p.price, COUNT(oi.id) as times_ordered, SUM(oi.quantity) as total_sold FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name, p.category, p.price ORDER BY total_sold DESC NULLS LAST LIMIT 20`
    }
    if (tableNames.includes('products')) {
      return `SELECT name, category, price, created_at FROM products ORDER BY created_at DESC LIMIT 20`
    }
  }
  
  // Order related queries - FIXED JOIN CONDITION
  if (lowerQuestion.match(/\b(order|purchase|transaction)\b/)) {
    if (tableNames.includes('orders') && tableNames.includes('users')) {
      return `SELECT o.id, u.first_name || ' ' || u.last_name as customer_name, o.total_amount, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 20`
    }
    if (tableNames.includes('orders')) {
      return `SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20`
    }
  }
  
  // Time-based/recent queries
  if (lowerQuestion.match(/\b(recent|latest|new|today|this month|this week)\b/)) {
    if (tableNames.includes('orders')) {
      return `SELECT id, user_id, total_amount, status, created_at FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 20`
    }
    if (tableNames.includes('users')) {
      return `SELECT first_name, last_name, email, created_at FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 20`
    }
  }
  
  // Top/best queries
  if (lowerQuestion.match(/\b(top|best|highest|most)\b/)) {
    if (tableNames.includes('products') && tableNames.includes('order_items')) {
      return `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 10`
    }
    if (tableNames.includes('users') && tableNames.includes('orders')) {
      return `SELECT u.first_name || ' ' || u.last_name as customer_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.first_name, u.last_name ORDER BY total_spent DESC LIMIT 10`
    }
  }
  
  // Default fallbacks based on available tables
  if (tableNames.includes('orders')) {
    return `SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20`
  }
  
  if (tableNames.includes('users')) {
    return `SELECT first_name, last_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 20`
  }
  
  if (tableNames.includes('products')) {
    return `SELECT name, category, price, created_at FROM products ORDER BY created_at DESC LIMIT 20`
  }
  
  // Ultimate fallback
  const firstTable = tableNames[0]
  if (firstTable) {
    return `SELECT * FROM ${firstTable} ORDER BY id DESC LIMIT 10`
  }
  
  throw new Error('No suitable fallback query could be generated')
}

// Legacy function for backward compatibility
export async function generateSQL(question: string, detailedSchemas: any[]) {
  const result = await generateSmartSQL(question, detailedSchemas)
  return result.sqlQuery
}