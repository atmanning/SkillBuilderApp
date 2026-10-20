// Sample seed content for the first demonstrated course: "SQL Query Skill
// Builder". This is static placeholder content so the app is demoable
// immediately. In the real system, a teacher's custom questions (added via
// the Test Bank page) are layered on top of content like this, and the
// `embedUrl` fields are where an external SQL tutorial/reference page would
// be embedded (e.g. an iframe to a W3Schools-style lesson or your own
// hosted material).

export const course = {
  id: 'sql-fundamentals',
  title: 'SQL Query Skill Builder',
  description:
    'A self-paced course that builds SQL SELECT-query skills from basic filtering through multi-table joins and aggregation.',
}

// The assessment test places a student into the right starting difficulty
// tier rather than making everyone start at lesson 1. Each question is
// tagged with the difficulty tier it's evidence for.
export const assessmentQuestions = [
  {
    id: 'a1',
    difficulty: 'basic',
    prompt: 'Which statement retrieves every column for every row in the Customers table?',
    choices: [
      'SELECT * FROM Customers;',
      'SELECT ALL FROM Customers;',
      'GET * FROM Customers;',
      'SELECT Customers.*;',
    ],
    correctIndex: 0,
  },
  {
    id: 'a2',
    difficulty: 'intermediate',
    prompt: 'Which statement returns only the categories that contain more than 5 products?',
    choices: [
      'SELECT CategoryID, COUNT(*) FROM Products WHERE COUNT(*) > 5 GROUP BY CategoryID;',
      'SELECT CategoryID, COUNT(*) FROM Products GROUP BY CategoryID HAVING COUNT(*) > 5;',
      'SELECT CategoryID, COUNT(*) FROM Products GROUP BY CategoryID WHERE COUNT(*) > 5;',
      'SELECT CategoryID FROM Products HAVING COUNT(*) > 5;',
    ],
    correctIndex: 1,
  },
  {
    id: 'a3',
    difficulty: 'advanced',
    prompt:
      'Which statement returns each CustomerID along with their single most recent OrderDate using a correlated subquery?',
    choices: [
      'SELECT CustomerID, MAX(OrderDate) FROM Orders GROUP BY CustomerID;',
      'SELECT o1.CustomerID, o1.OrderDate FROM Orders o1 WHERE o1.OrderDate = (SELECT MAX(o2.OrderDate) FROM Orders o2 WHERE o2.CustomerID = o1.CustomerID);',
      'SELECT CustomerID, OrderDate FROM Orders ORDER BY OrderDate DESC LIMIT 1;',
      'SELECT o1.CustomerID, o1.OrderDate FROM Orders o1 WHERE o1.OrderDate = (SELECT MAX(OrderDate) FROM Orders);',
    ],
    correctIndex: 1,
  },
]

// Lessons are grouped into tiers. Each lesson has a short embedded
// reference (placeholder URL -- swap for a real tutorial page) plus a
// short interactive quiz that the dataService records progress against.
export const lessons = [
  {
    id: 'lesson-basic-1',
    tier: 'basic',
    title: 'Basic SELECT and WHERE',
    embedUrl: 'https://www.w3schools.com/sql/sql_select.asp',
    questions: [
      {
        id: 'q-b1-1',
        prompt: 'Which statement returns all Products with a UnitPrice greater than 50?',
        choices: [
          'SELECT * FROM Products WHERE UnitPrice > 50;',
          'SELECT * FROM Products WHERE UnitPrice = 50;',
          'SELECT * FROM Products HAVING UnitPrice > 50;',
          'SELECT * FROM Products WHERE UnitPrice >< 50;',
        ],
        correctIndex: 0,
      },
      {
        id: 'q-b1-2',
        prompt: 'Which statement returns each unique Country in the Customers table?',
        choices: [
          'SELECT UNIQUE Country FROM Customers;',
          'SELECT DISTINCT Country FROM Customers;',
          'SELECT Country FROM Customers GROUP;',
          'SELECT DIFFERENT Country FROM Customers;',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'lesson-intermediate-1',
    tier: 'intermediate',
    title: 'JOINs and GROUP BY',
    embedUrl: 'https://www.w3schools.com/sql/sql_join.asp',
    questions: [
      {
        id: 'q-i1-1',
        prompt:
          'Which statement returns the OrderID along with the CompanyName of the customer who placed each order?',
        choices: [
          'SELECT Orders.OrderID, Customers.CompanyName FROM Orders, Customers;',
          'SELECT Orders.OrderID, Customers.CompanyName FROM Orders INNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID;',
          'SELECT Orders.OrderID, Customers.CompanyName FROM Orders INNER JOIN Customers ON Orders.OrderID = Customers.CustomerID;',
          'SELECT Orders.OrderID, Customers.CompanyName FROM Orders JOIN Customers WHERE CustomerID;',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'lesson-advanced-1',
    tier: 'advanced',
    title: 'Subqueries and Correlated Queries',
    embedUrl: 'https://www.w3schools.com/sql/sql_subqueries.asp',
    questions: [
      {
        id: 'q-a1-1',
        prompt:
          'Which statement returns Customers who have never placed an order, using a subquery against the Orders table?',
        choices: [
          'SELECT * FROM Customers WHERE CustomerID IN (SELECT CustomerID FROM Orders);',
          'SELECT * FROM Customers WHERE CustomerID NOT IN (SELECT CustomerID FROM Orders);',
          'SELECT * FROM Customers WHERE CustomerID != ALL (SELECT CustomerID FROM Orders);',
          'SELECT * FROM Customers, Orders WHERE Customers.CustomerID NOT IN Orders.CustomerID;',
        ],
        correctIndex: 1,
      },
    ],
  },
]

export function recommendTier(assessmentResults) {
  // assessmentResults: [{ difficulty, correct: boolean }]
  const correctByTier = { basic: 0, intermediate: 0, advanced: 0 }
  assessmentResults.forEach(({ difficulty, correct }) => {
    if (correct) correctByTier[difficulty] += 1
  })
  if (correctByTier.advanced > 0) return 'advanced'
  if (correctByTier.intermediate > 0) return 'intermediate'
  return 'basic'
}
