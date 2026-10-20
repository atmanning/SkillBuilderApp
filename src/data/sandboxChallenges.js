// Sandbox challenges: "write the actual query" activities, as opposed to
// the multiple-choice quizzes in sampleCourse.js. A challenge is checked
// by running the student's query AND a hidden reference query against the
// same database, then comparing the result sets (not the query text) --
// this is what lets "SELECT CustomerID FROM Orders" and
// "SELECT o.CustomerID FROM Orders o" both be accepted as correct, while
// catching a genuinely wrong result.
//
// These challenges run against whichever backend the student has active
// (bundled SQLite by default, or a teacher-configured live MySQL server).
// Both backends are seeded from the same generator
// (scripts/generate_northwind.py) so a challenge's referenceQuery returns
// the same rows either way.
//
// SQLite and MySQL quote identifiers containing spaces differently
// ("Order Details" vs `Order Details`), so any challenge touching that
// table writes it as the {OD} token and getReferenceQuery()/getStarterQuery()
// below substitute the correct quoting for whichever engine is active.
// Everything else about the query is identical across both engines.

const QUOTE_BY_ENGINE = {
  sqlite: '"Order Details"',
  mysql: '`Order Details`',
}

export function getReferenceQuery(challenge, engine) {
  return challenge.referenceQuery.replaceAll('{OD}', QUOTE_BY_ENGINE[engine])
}

export function getStarterQuery(challenge, engine) {
  return challenge.starterQuery.replaceAll('{OD}', QUOTE_BY_ENGINE[engine])
}

export const sandboxChallenges = [
  {
    id: 'sb-1',
    tier: 'basic',
    title: 'Filter products by price',
    prompt: 'Write a query that returns the ProductName and UnitPrice of every product with a UnitPrice greater than 50.',
    starterQuery: 'SELECT ProductName, UnitPrice\nFROM Products\nWHERE ',
    referenceQuery: 'SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > 50 ORDER BY ProductName',
    // orderMatters: false means the checker sorts both result sets before
    // comparing, so the student doesn't need to guess the exact ORDER BY
    // the reference query happens to use.
    orderMatters: false,
    hint: 'Use a WHERE clause with the > comparison operator.',
  },
  {
    id: 'sb-2',
    tier: 'basic',
    title: 'Unique countries',
    prompt: 'Write a query that returns each distinct Country that appears in the Customers table.',
    starterQuery: 'SELECT \nFROM Customers',
    referenceQuery: 'SELECT DISTINCT Country FROM Customers ORDER BY Country',
    orderMatters: false,
    hint: 'DISTINCT removes duplicate values from the result.',
  },
  {
    id: 'sb-3',
    tier: 'intermediate',
    title: 'Products per category',
    prompt: 'Write a query that returns each CategoryID along with the number of products in that category.',
    starterQuery: 'SELECT CategoryID, \nFROM Products\nGROUP BY ',
    referenceQuery: 'SELECT CategoryID, COUNT(*) AS ProductCount FROM Products GROUP BY CategoryID ORDER BY CategoryID',
    orderMatters: false,
    hint: 'COUNT(*) combined with GROUP BY gives you a count per group.',
  },
  {
    id: 'sb-4',
    tier: 'intermediate',
    title: 'Orders with customer names',
    prompt: 'Write a query that returns the OrderID and the CompanyName of the customer who placed each order, for the first 10 orders by OrderID.',
    starterQuery: 'SELECT o.OrderID, c.CompanyName\nFROM Orders o\nJOIN Customers c ON ',
    referenceQuery: 'SELECT o.OrderID, c.CompanyName FROM Orders o JOIN Customers c ON o.CustomerID = c.CustomerID ORDER BY o.OrderID LIMIT 10',
    orderMatters: true,
    hint: 'Join Orders and Customers on the CustomerID column, then use ORDER BY and LIMIT.',
  },
  {
    id: 'sb-5',
    tier: 'advanced',
    title: 'Top 5 highest-revenue products',
    prompt:
      'Write a query that returns the ProductName and total revenue (UnitPrice * Quantity, ignoring discount) for the 5 products with the highest total revenue, using "Order Details".',
    starterQuery:
      'SELECT p.ProductName, SUM(od.UnitPrice * od.Quantity) AS Revenue\nFROM Products p\nJOIN {OD} od ON p.ProductID = od.ProductID\nGROUP BY p.ProductName\nORDER BY ',
    referenceQuery:
      'SELECT p.ProductName, SUM(od.UnitPrice * od.Quantity) AS Revenue FROM Products p JOIN {OD} od ON p.ProductID = od.ProductID GROUP BY p.ProductName ORDER BY Revenue DESC LIMIT 5',
    orderMatters: true,
    hint: 'ORDER BY the aggregated total, descending, then LIMIT to 5 rows.',
  },
  {
    id: 'sb-6',
    tier: 'advanced',
    title: 'Customers with no orders',
    prompt: 'Write a query that returns the CompanyName of every customer who has never placed an order.',
    starterQuery:
      'SELECT CompanyName\nFROM Customers\nWHERE CustomerID NOT IN (\n  SELECT CustomerID FROM Orders\n)',
    referenceQuery:
      'SELECT CompanyName FROM Customers WHERE CustomerID NOT IN (SELECT CustomerID FROM Orders) ORDER BY CompanyName',
    orderMatters: false,
    hint: 'A NOT IN subquery against Orders.CustomerID finds customers absent from that list.',
  },
]
