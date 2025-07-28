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
      ? `\nSample Data: ${JSON.stringify(schema.sample_data.slice(0, 2), null, 2)}`
      : ''
    
    return `
Table: ${schema.table_name}
Columns: ${schema.columns.map((col: any) => 
  `${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`
).join(', ')}${fkInfo}${sampleInfo}
`
  }).join('\n')
  
  const prompt = `
You are an expert PostgreSQL developer and data analyst for an e-commerce database. Analyze the user's question and generate:
1. A PostgreSQL SELECT query
2. The best chart type for visualization
3. A helpful response message
4. Key insights about what the data shows

E-COMMERCE DATABASE SCHEMA:
- users: Customer accounts (id, first_name, last_name, email, created_at, updated_at)
- orders: Order records (id, user_id→users.id, total_amount, status, created_at)
- invoices: Payment tracking (id, order_id→orders.id, amount, paid_at, created_at)  
- products: Product catalog (id, name, price, category, created_at)
- order_items: Order line items (id, order_id→orders.id, product_id→products.id, quantity, price)

RELATIONSHIPS:
- users.id → orders.user_id (customers have multiple orders)
- orders.id → invoices.order_id (orders can have multiple invoices)
- orders.id → order_items.order_id (orders contain multiple items)
- products.id → order_items.product_id (products appear in multiple orders)

RULES FOR SQL:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use proper PostgreSQL syntax and functions
- Use appropriate JOINs when querying multiple tables
- Add meaningful column aliases for calculated fields
- Use LIMIT 20 unless user specifies otherwise or asks for "all"
- Use aggregate functions (COUNT, SUM, AVG, MAX, MIN) when appropriate
- For "top" or "highest" queries, use ORDER BY with LIMIT
- For date ranges, use proper timestamp comparisons with DATE_TRUNC for grouping
- Do NOT include semicolons at the end of the query
- Format numbers and dates appropriately
- Use COALESCE for handling null values in calculations
- Use table aliases for cleaner queries (u for users, o for orders, oi for order_items, p for products, i for invoices)

COMMON E-COMMERCE QUERY PATTERNS:
- Customer analysis: JOIN users u with orders o ON u.id = o.user_id
- Sales by product: JOIN order_items oi with products p ON oi.product_id = p.id
- Revenue analysis: Use invoices i with paid_at for actual payments
- Order details: JOIN orders o with order_items oi and products p for complete order info
- Top customers: GROUP BY customer with SUM(order amounts) ORDER BY total DESC

CHART TYPE SELECTION:
- 'line': For time series, trends over time, temporal data (keywords: trend, over time, monthly, daily, growth, change)
- 'bar': For comparisons, rankings, categories (keywords: top, best, compare, most, highest, lowest, by category)
- 'pie': For distributions, percentages, parts of whole (keywords: distribution, breakdown, percentage, share, proportion)
- 'table': For detailed data, lists, when specific values are requested (keywords: list, show me, details, all)

RESPONSE MESSAGE GUIDELINES:
- Be conversational and helpful
- Explain what the data shows in business terms
- Mention key findings or patterns
- Keep it concise but informative

DATABASE SCHEMA DETAILS:
${schemaContext}

Available Tables: ${detailedSchemas.map(s => s.table_name).join(', ')}

EXAMPLE E-COMMERCE QUERIES:

For "Show me monthly revenue trends":
SQL: SELECT DATE_TRUNC('month', i.paid_at) as month, SUM(i.amount) as revenue FROM invoices i WHERE i.paid_at IS NOT NULL AND i.paid_at >= CURRENT_DATE - INTERVAL '12 months' GROUP BY month ORDER BY month
CHART: line
MESSAGE: Here's your monthly revenue trend based on paid invoices over the past year. You can see seasonal patterns and growth trajectory.
INSIGHTS: ["12 months of revenue data analyzed", "Based on actual paid invoices", "Shows seasonal payment patterns"]

For "Who are my top 5 customers by spending":
SQL: SELECT u.first_name || ' ' || u.last_name as customer_name, u.email, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.first_name, u.last_name, u.email ORDER BY total_spent DESC LIMIT 5
CHART: bar
MESSAGE: Here are your top 5 customers by total order value. These are your most valuable customers for retention focus.
INSIGHTS: ["Top 5 customers by order value", "Includes order count per customer", "VIP customer segment for retention"]

For "Product category performance":
SQL: SELECT p.category, COUNT(DISTINCT p.id) as unique_products, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as category_revenue FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id GROUP BY p.category ORDER BY category_revenue DESC
CHART: pie  
MESSAGE: This shows how your product categories are performing by sales volume and revenue contribution.
INSIGHTS: ["Category performance breakdown", "Revenue and quantity metrics", "Product portfolio analysis"]

For "Recent unpaid invoices":
SQL: SELECT u.first_name || ' ' || u.last_name as customer_name, o.id as order_id, i.amount, i.created_at FROM invoices i JOIN orders o ON i.order_id = o.id JOIN users u ON o.user_id = u.id WHERE i.paid_at IS NULL ORDER BY i.created_at DESC LIMIT 20
CHART: table
MESSAGE: Here are your recent unpaid invoices that need attention for payment collection.
INSIGHTS: ["Unpaid invoices identified", "Sorted by invoice date", "Customer contact info included"]

For "Best selling products":
SQL: SELECT p.name, p.category, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as total_revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name, p.category ORDER BY total_sold DESC LIMIT 10
CHART: bar
MESSAGE: Here are your best-selling products by quantity sold, along with their revenue contribution.
INSIGHTS: ["Top 10 products by sales volume", "Revenue per product calculated", "Product performance ranking"]

User Question: "${question}"

Return your response in this exact JSON format:
{
  "sqlQuery": "your_sql_query_here",
  "chartType": "line|bar|pie|table",
  "responseMessage": "your_helpful_message_here",
  "insights": ["insight1", "insight2", "insight3"]
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
        responseMessage: `I've generated a query based on your question: "${question}"`,
        insights: [`Query generated for: ${question}`]
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
      responseMessage: parsedResponse.responseMessage || `Here's the analysis for: ${question}`,
      insights: Array.isArray(parsedResponse.insights) 
        ? parsedResponse.insights.slice(0, 3) 
        : [`Analysis completed for: ${question}`]
    }
    
  } catch (error) {
    console.error('Gemini API error:', error)
    
    // Fallback response
    return {
      sqlQuery: generateFallbackQuery(question, detailedSchemas),
      chartType: detectChartTypeFromQuestion(question),
      responseMessage: `I've generated a basic query for your question. The results will help answer "${question}"`,
      insights: [`Fallback query generated`, `Question: ${question}`]
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
  
  // Validation
  if (!sqlQuery.toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed')
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
  
  // Default to table for detailed queries
  return 'table'
}

function generateFallbackQuery(question: string, schemas: any[]): string {
  const lowerQuestion = question.toLowerCase()
  
  // E-commerce specific fallback queries
  const tableNames = schemas.map(s => s.table_name)
  
  if (lowerQuestion.includes('revenue') || lowerQuestion.includes('sales') || lowerQuestion.includes('money')) {
    if (tableNames.includes('invoices')) {
      return `SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount) as revenue FROM invoices WHERE paid_at IS NOT NULL AND paid_at >= CURRENT_DATE - INTERVAL '6 months' GROUP BY month ORDER BY month`
    }
    if (tableNames.includes('orders')) {
      return `SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as revenue FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' GROUP BY month ORDER BY month`
    }
  }
  
  if (lowerQuestion.includes('customer') && tableNames.includes('users') && tableNames.includes('orders')) {
    return `SELECT u.first_name || ' ' || u.last_name as customer_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.first_name, u.last_name ORDER BY total_spent DESC LIMIT 10`
  }
  
  if (lowerQuestion.includes('product') && tableNames.includes('products')) {
    if (tableNames.includes('order_items')) {
      return `SELECT p.name, p.category, p.price, COUNT(oi.id) as times_ordered, SUM(oi.quantity) as total_sold FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name, p.category, p.price ORDER BY total_sold DESC LIMIT 10`
    }
    return `SELECT name, category, price FROM products ORDER BY price DESC LIMIT 10`
  }
  
  if (lowerQuestion.includes('order') && tableNames.includes('orders')) {
    if (tableNames.includes('users')) {
      return `SELECT o.id, u.first_name || ' ' || u.last_name as customer_name, o.total_amount, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10`
    }
    return `SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10`
  }
  
  if (lowerQuestion.includes('invoice') && tableNames.includes('invoices')) {
    return `SELECT i.id, i.order_id, i.amount, i.paid_at, i.created_at FROM invoices i ORDER BY i.created_at DESC LIMIT 10`
  }
  
  if (lowerQuestion.includes('unpaid') && tableNames.includes('invoices')) {
    return `SELECT i.id, i.order_id, i.amount, i.created_at FROM invoices i WHERE i.paid_at IS NULL ORDER BY i.created_at DESC LIMIT 10`
  }
  
  if (tableNames.includes('users')) {
    return `SELECT first_name, last_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`
  }
  
  if (tableNames.includes('orders')) {
    return `SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10`
  }
  
  if (tableNames.includes('products')) {
    return `SELECT name, category, price FROM products ORDER BY price DESC LIMIT 10`
  }
  
  // Ultimate fallback
  const firstTable = tableNames[0]
  if (firstTable) {
    return `SELECT * FROM ${firstTable} LIMIT 10`
  }
  
  throw new Error('No suitable fallback query could be generated')
}

// Legacy function for backward compatibility
export async function generateSQL(question: string, detailedSchemas: any[]) {
  const result = await generateSmartSQL(question, detailedSchemas)
  return result.sqlQuery
}