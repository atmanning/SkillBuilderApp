#!/usr/bin/env python3
"""
generate_northwind.py

Generates a Northwind-style sample dataset (same schema/spirit used
throughout this course's quiz questions: Categories, Suppliers, Customers,
Employees, Shippers, Products, Orders, "Order Details") and writes it out
in two forms:

  1. public/northwind.sqlite
     A SQLite database bundled into the frontend and loaded client-side via
     sql.js, so the in-browser "Practice (SQLite)" sandbox works with zero
     server setup.

  2. mysql-proxy/northwind_mysql_import.sql
     The equivalent schema + data as a MySQL-dialect SQL script. A teacher
     running the optional "Live Server (MySQL)" sandbox mode imports this
     into their own MySQL server so its schema/data matches what the
     sandbox lessons' reference/auto-check queries expect.

Deterministic (seeded) so re-running produces the same dataset.

Usage:
    python3 scripts/generate_northwind.py
"""

import random
import sqlite3
import os
from datetime import date, timedelta

random.seed(42)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_PATH = os.path.join(ROOT, "public", "northwind.sqlite")
MYSQL_PATH = os.path.join(ROOT, "mysql-proxy", "northwind_mysql_import.sql")

# ---------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------

CATEGORIES = [
    (1, "Beverages", "Soft drinks, coffees, teas, beers, and ales"),
    (2, "Condiments", "Sweet and savory sauces, relishes, spreads, and seasonings"),
    (3, "Confections", "Desserts, candies, and sweet breads"),
    (4, "Dairy Products", "Cheeses"),
    (5, "Grains/Cereals", "Breads, crackers, pasta, and cereal"),
    (6, "Meat/Poultry", "Prepared meats"),
    (7, "Produce", "Dried fruit and bean curd"),
    (8, "Seafood", "Seaweed and fish"),
]

SUPPLIER_NAMES = [
    "Northwind Traders Co.", "Pacific Coast Imports", "Highland Foods",
    "Sunrise Beverage Group", "Golden Valley Farms", "Harborview Seafood",
    "Riverside Confectioners", "Prairie Grain Mills", "Meadowbrook Dairy",
    "Cascade Spice & Trading",
]

CITIES = [
    ("Chicago", "USA"), ("Austin", "USA"), ("Denver", "USA"), ("Seattle", "USA"),
    ("London", "UK"), ("Manchester", "UK"), ("Berlin", "Germany"), ("Munich", "Germany"),
    ("Paris", "France"), ("Lyon", "France"), ("Toronto", "Canada"), ("Vancouver", "Canada"),
    ("Sydney", "Australia"), ("Madrid", "Spain"), ("Rome", "Italy"), ("Tokyo", "Japan"),
]

CUSTOMER_COMPANIES = [
    "Alfreds Futterkiste", "Blondel Pere et Fils", "Chop-suey Chinese", "Drachenblut Delikatessen",
    "Eastern Connection", "Familia Arquibaldo", "Galeria del gastronomo", "Hanari Carnes",
    "Island Trading", "Japura Imports", "Koniglich Essen", "La maison d'Asie",
    "Magazzini Alimentari", "North/South", "Ottilies Kaseladen", "Paris specialites",
    "Queen Cozinha", "Rattlesnake Canyon Grocery", "Simons bistro", "The Big Cheese",
    "Umbrella Kitchens", "Victuailles en stock", "Wartian Herkku", "Wolski Zajazd",
    "Yeoman's Table", "Zenith Foods", "Blue Harbor Bistro", "Copper Kettle Catering",
    "Driftwood Diner", "Echo Valley Market",
]

EMPLOYEES = [
    ("Nancy", "Davolio", "Sales Representative"),
    ("Andrew", "Fuller", "Vice President, Sales"),
    ("Janet", "Leverling", "Sales Representative"),
    ("Margaret", "Peacock", "Sales Representative"),
    ("Steven", "Buchanan", "Sales Manager"),
    ("Michael", "Suyama", "Sales Representative"),
    ("Robert", "King", "Sales Representative"),
    ("Laura", "Callahan", "Inside Sales Coordinator"),
    ("Anne", "Dodsworth", "Sales Representative"),
]

SHIPPERS = [
    (1, "Speedy Express", "555-0100"),
    (2, "United Package", "555-0200"),
    (3, "Federal Shipping", "555-0300"),
]

PRODUCT_NAME_PARTS = {
    1: ["Chai", "Chang", "Sasquatch Ale", "Steeleye Stout", "Cote de Blaye", "Lakkalikoori", "Outback Lager", "Rhonbrau Klosterbier"],
    2: ["Aniseed Syrup", "Chef Anton's Cajun Seasoning", "Grandma's Boysenberry Spread", "Northwoods Cranberry Sauce", "Genen Shouyu", "Vegie-spread", "Sirop d'erable"],
    3: ["Teatime Chocolate Biscuits", "Sir Rodney's Scones", "Gumbar Gummibarchen", "Schoggi Schokolade", "Tarte au sucre", "Chocolade", "Maxilaku", "Valkoinen Suklaa"],
    4: ["Queso Cabrales", "Queso Manchego La Pastora", "Gorgonzola Telino", "Mascarpone Fabioli", "Geitost", "Raclette Courdavault", "Camembert Pierrot"],
    5: ["Gustaf's Knackebrod", "Tunnbrod", "Singaporean Hokkien Fried Mee", "Gnocchi di nonna Alice", "Ravioli Angelo", "Wimmers gute Semmelknodel"],
    6: ["Mishi Kobe Niku", "Alice Mutton", "Perth Pasties", "Tourtiere", "Pate chinois"],
    7: ["Uncle Bob's Organic Dried Pears", "Longlife Tofu", "Rossle Sauerkraut", "Manjimup Dried Apples"],
    8: ["Ikura", "Konbu", "Carnarvon Tigers", "Boston Crab Meat", "Jack's New England Clam Chowder", "Nord-Ost Matjeshering", "Inlagd Sill", "Gravad lax"],
}

def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def customer_code(name: str, used: set) -> str:
    letters = "".join(ch for ch in name.upper() if ch.isalpha())
    base = (letters[:4] + letters[0] if len(letters) >= 4 else letters.ljust(5, "X"))[:5]
    code = base
    n = 1
    while code in used:
        code = (base[:4] + str(n))[:5]
        n += 1
    used.add(code)
    return code


def build_dataset():
    categories = CATEGORIES

    suppliers = []
    for i, name in enumerate(SUPPLIER_NAMES, start=1):
        city, country = random.choice(CITIES)
        suppliers.append((i, name, city, country))

    customers = []
    used_codes = set()
    for i, name in enumerate(CUSTOMER_COMPANIES, start=1):
        city, country = random.choice(CITIES)
        code = customer_code(name, used_codes)
        contact = random.choice(["Maria", "John", "Anna", "Carlos", "Yuki", "Liam", "Fatima", "Wei"]) + " " + \
                  random.choice(["Smith", "Garcia", "Mueller", "Dubois", "Rossi", "Tanaka", "Khan", "Novak"])
        customers.append((code, name, contact, city, country))

    employees = []
    for i, (first, last, title) in enumerate(EMPLOYEES, start=1):
        hire = random_date(date(2015, 1, 1), date(2024, 1, 1))
        city, country = random.choice(CITIES[:4])  # employees based in a few home cities
        employees.append((i, first, last, title, hire.isoformat(), city))

    products = []
    pid = 1
    for cat_id, names in PRODUCT_NAME_PARTS.items():
        for name in names:
            supplier_id = random.randint(1, len(suppliers))
            unit_price = round(random.uniform(8, 95), 2)
            units_in_stock = random.randint(0, 150)
            discontinued = 1 if random.random() < 0.07 else 0
            products.append((pid, name, supplier_id, cat_id, unit_price, units_in_stock, discontinued))
            pid += 1

    orders = []
    order_details = []
    oid = 10248  # classic Northwind's starting OrderID, kept for continuity
    od_id = 1
    for _ in range(150):
        customer_code_ = random.choice(customers)[0]
        employee_id = random.randint(1, len(employees))
        order_date = random_date(date(2023, 1, 1), date(2025, 12, 31))
        ship_country = random.choice(CITIES)[1]
        orders.append((oid, customer_code_, employee_id, order_date.isoformat(), ship_country))

        line_items = random.randint(1, 5)
        chosen_products = random.sample(range(1, len(products) + 1), min(line_items, len(products)))
        for prod_id in chosen_products:
            product = products[prod_id - 1]
            unit_price = product[4]
            qty = random.randint(1, 40)
            discount = random.choice([0, 0, 0, 0.05, 0.1, 0.15, 0.2])
            order_details.append((od_id, oid, prod_id, unit_price, qty, discount))
            od_id += 1
        oid += 1

    return categories, suppliers, customers, employees, products, orders, order_details


# ---------------------------------------------------------------------
# SQLite output
# ---------------------------------------------------------------------

SQLITE_SCHEMA = """
CREATE TABLE Categories (
    CategoryID   INTEGER PRIMARY KEY,
    CategoryName TEXT NOT NULL,
    Description  TEXT
);

CREATE TABLE Suppliers (
    SupplierID   INTEGER PRIMARY KEY,
    CompanyName  TEXT NOT NULL,
    City         TEXT,
    Country      TEXT
);

CREATE TABLE Customers (
    CustomerID   TEXT PRIMARY KEY,
    CompanyName  TEXT NOT NULL,
    ContactName  TEXT,
    City         TEXT,
    Country      TEXT
);

CREATE TABLE Employees (
    EmployeeID INTEGER PRIMARY KEY,
    FirstName  TEXT NOT NULL,
    LastName   TEXT NOT NULL,
    Title      TEXT,
    HireDate   TEXT,
    City       TEXT
);

CREATE TABLE Shippers (
    ShipperID   INTEGER PRIMARY KEY,
    CompanyName TEXT NOT NULL,
    Phone       TEXT
);

CREATE TABLE Products (
    ProductID     INTEGER PRIMARY KEY,
    ProductName   TEXT NOT NULL,
    SupplierID    INTEGER REFERENCES Suppliers(SupplierID),
    CategoryID    INTEGER REFERENCES Categories(CategoryID),
    UnitPrice     REAL NOT NULL,
    UnitsInStock  INTEGER NOT NULL,
    Discontinued  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE Orders (
    OrderID     INTEGER PRIMARY KEY,
    CustomerID  TEXT REFERENCES Customers(CustomerID),
    EmployeeID  INTEGER REFERENCES Employees(EmployeeID),
    OrderDate   TEXT NOT NULL,
    ShipCountry TEXT
);

CREATE TABLE "Order Details" (
    OrderDetailID INTEGER PRIMARY KEY,
    OrderID       INTEGER REFERENCES Orders(OrderID),
    ProductID     INTEGER REFERENCES Products(ProductID),
    UnitPrice     REAL NOT NULL,
    Quantity      INTEGER NOT NULL,
    Discount      REAL NOT NULL DEFAULT 0
);
"""


def write_sqlite(categories, suppliers, customers, employees, products, orders, order_details):
    os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)
    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()
    cur.executescript(SQLITE_SCHEMA)

    cur.executemany("INSERT INTO Categories VALUES (?, ?, ?)", categories)
    cur.executemany("INSERT INTO Suppliers VALUES (?, ?, ?, ?)", suppliers)
    cur.executemany("INSERT INTO Customers VALUES (?, ?, ?, ?, ?)", customers)
    cur.executemany("INSERT INTO Employees VALUES (?, ?, ?, ?, ?, ?)", employees)
    cur.executemany("INSERT INTO Shippers VALUES (?, ?, ?)", SHIPPERS)
    cur.executemany("INSERT INTO Products VALUES (?, ?, ?, ?, ?, ?, ?)", products)
    cur.executemany("INSERT INTO Orders VALUES (?, ?, ?, ?, ?)", orders)
    cur.executemany('INSERT INTO "Order Details" VALUES (?, ?, ?, ?, ?, ?)', order_details)

    conn.commit()
    conn.close()
    size_kb = os.path.getsize(SQLITE_PATH) / 1024
    print(f"Wrote {SQLITE_PATH} ({size_kb:.0f} KB)")


# ---------------------------------------------------------------------
# MySQL output
# ---------------------------------------------------------------------

def sql_str(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def write_mysql(categories, suppliers, customers, employees, products, orders, order_details):
    os.makedirs(os.path.dirname(MYSQL_PATH), exist_ok=True)
    lines = []
    lines.append("-- Northwind sample data for the MySQL \"Live Server\" sandbox mode.")
    lines.append("-- Import with:  mysql -h <host> -P <port> -u <user> -p <database> < northwind_mysql_import.sql")
    lines.append("-- Matches the schema/data in public/northwind.sqlite, generated by")
    lines.append("-- scripts/generate_northwind.py, so sandbox challenge reference queries")
    lines.append("-- return the same results against either backend.\n")

    lines.append("""
DROP TABLE IF EXISTS `Order Details`;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Shippers;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Categories;

CREATE TABLE Categories (
    CategoryID   INT PRIMARY KEY,
    CategoryName VARCHAR(50) NOT NULL,
    Description  VARCHAR(255)
);

CREATE TABLE Suppliers (
    SupplierID   INT PRIMARY KEY,
    CompanyName  VARCHAR(100) NOT NULL,
    City         VARCHAR(50),
    Country      VARCHAR(50)
);

CREATE TABLE Customers (
    CustomerID   VARCHAR(5) PRIMARY KEY,
    CompanyName  VARCHAR(100) NOT NULL,
    ContactName  VARCHAR(50),
    City         VARCHAR(50),
    Country      VARCHAR(50)
);

CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    FirstName  VARCHAR(50) NOT NULL,
    LastName   VARCHAR(50) NOT NULL,
    Title      VARCHAR(50),
    HireDate   DATE,
    City       VARCHAR(50)
);

CREATE TABLE Shippers (
    ShipperID   INT PRIMARY KEY,
    CompanyName VARCHAR(50) NOT NULL,
    Phone       VARCHAR(20)
);

CREATE TABLE Products (
    ProductID     INT PRIMARY KEY,
    ProductName   VARCHAR(100) NOT NULL,
    SupplierID    INT,
    CategoryID    INT,
    UnitPrice     DECIMAL(10,2) NOT NULL,
    UnitsInStock  INT NOT NULL,
    Discontinued  TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Orders (
    OrderID     INT PRIMARY KEY,
    CustomerID  VARCHAR(5),
    EmployeeID  INT,
    OrderDate   DATE NOT NULL,
    ShipCountry VARCHAR(50),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE `Order Details` (
    OrderDetailID INT PRIMARY KEY,
    OrderID       INT,
    ProductID     INT,
    UnitPrice     DECIMAL(10,2) NOT NULL,
    Quantity      INT NOT NULL,
    Discount      DECIMAL(4,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
""")

    def insert_batch(table, columns, rows):
        if not rows:
            return
        lines.append(f"INSERT INTO `{table}` ({', '.join(columns)}) VALUES")
        value_lines = []
        for row in rows:
            formatted = ", ".join(
                str(v) if isinstance(v, (int, float)) else sql_str(v) for v in row
            )
            value_lines.append(f"  ({formatted})")
        lines.append(",\n".join(value_lines) + ";\n")

    insert_batch("Categories", ["CategoryID", "CategoryName", "Description"], categories)
    insert_batch("Suppliers", ["SupplierID", "CompanyName", "City", "Country"], suppliers)
    insert_batch("Customers", ["CustomerID", "CompanyName", "ContactName", "City", "Country"], customers)
    insert_batch("Employees", ["EmployeeID", "FirstName", "LastName", "Title", "HireDate", "City"], employees)
    insert_batch("Shippers", ["ShipperID", "CompanyName", "Phone"], SHIPPERS)
    insert_batch("Products", ["ProductID", "ProductName", "SupplierID", "CategoryID", "UnitPrice", "UnitsInStock", "Discontinued"], products)
    insert_batch("Orders", ["OrderID", "CustomerID", "EmployeeID", "OrderDate", "ShipCountry"], orders)
    insert_batch("Order Details", ["OrderDetailID", "OrderID", "ProductID", "UnitPrice", "Quantity", "Discount"], order_details)

    with open(MYSQL_PATH, "w") as f:
        f.write("\n".join(lines))
    size_kb = os.path.getsize(MYSQL_PATH) / 1024
    print(f"Wrote {MYSQL_PATH} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    data = build_dataset()
    write_sqlite(*data)
    write_mysql(*data)
