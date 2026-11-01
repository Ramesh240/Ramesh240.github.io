# 🚀 System Design Interview Preparation — Day 3

## Topic: Databases, SQL vs NoSQL, Replication & Sharding

Day 2 was about **scaling the application layer**.

Today we move to one of the most important system-design topics:

> **What happens when the database becomes the bottleneck?**

This is extremely important for .NET interviews because you'll often be asked to explain why you chose **SQL Server vs NoSQL**, how to handle millions of reads/writes, and how to scale a database.

---

# 1. Why is Database Design Important?

Consider our architecture from Day 2:

```text
                    Load Balancer
                   /      |      \
                  ▼       ▼       ▼
                API1     API2    API3
                  \       |      /
                   \      |     /
                    ▼     ▼    ▼
                     Database
```

We can easily add API servers:

```text
API1
API2
API3
API4
API5
...
```

But eventually all of them are hitting:

```text
                ┌────────────┐
                │  Database  │
                └────────────┘
```

The database can become the bottleneck.

For example:

```text
Application traffic:
100,000 requests/sec

Database:
Can handle only 20,000 operations/sec
```

Adding more API servers won't solve the problem.

This is a critical system-design principle:

> **Scaling one layer doesn't help if another layer has become the bottleneck.**

---

# 2. SQL vs NoSQL

One of the most common interview questions:

> **"When would you choose SQL vs NoSQL?"**

---

## SQL Databases

Examples:

- SQL Server
- PostgreSQL
- MySQL
- Oracle

They typically provide:

- Structured schemas
- Relationships
- SQL queries
- Transactions
- Strong consistency options
- Constraints

Example:

```text
Customer
----------------
CustomerId
Name
Email

Order
----------------
OrderId
CustomerId
OrderDate
Amount
```

Relationship:

```text
Customer 1 ──────── * Orders
```

This is a natural fit for systems where relationships and transactional correctness are important.

Examples:

```text
Banking
Payments
Orders
Inventory
Healthcare records
```

---

# 3. NoSQL Databases

NoSQL is a broad category of non-relational databases.

Examples include:

- Document databases
- Key-value databases
- Wide-column databases
- Graph databases

Examples of technologies:

```text
MongoDB      → Document
Redis        → Key-value
Cassandra    → Wide-column
Neo4j        → Graph
```

They can be useful when you need:

- Very large scale
- Flexible schemas
- High write/read throughput
- Distributed storage
- Specific access patterns

---

# 4. SQL vs NoSQL — Interview Comparison

| SQL | NoSQL |
|---|---|
| Structured schema | Often flexible schema |
| Relationships | Often denormalized |
| SQL | Database-specific APIs/query languages |
| Strong transactional support | Depends on technology |
| Joins commonly supported | Often avoided |
| Vertical scaling historically common | Horizontal scaling often emphasized |
| Excellent for relational data | Excellent for specific distributed access patterns |

### Important interview point

Don't say:

> "NoSQL is faster than SQL."

That's too simplistic.

Instead say:

> "The choice depends on the access patterns, consistency requirements, data relationships, scale, and operational requirements."

That's a much better system-design answer.

---

# 5. When Would You Choose SQL?

Suppose we're designing a banking system.

We have:

```text
Account
Transaction
Customer
Payment
```

There are strong relationships between these entities.

We may need operations like:

```sql
BEGIN TRANSACTION;

UPDATE Accounts
SET Balance = Balance - 1000
WHERE AccountId = 1;

UPDATE Accounts
SET Balance = Balance + 1000
WHERE AccountId = 2;

COMMIT;
```

We need transactional correctness.

A relational database is a strong candidate.

---

# 6. When Would You Choose NoSQL?

Suppose we're building a massive event-tracking system:

```text
User clicks
Page views
Device events
Application events
```

Potentially:

```text
Billions of events
```

If the primary access pattern is something like:

```text
userId → events
```

a distributed NoSQL store may be a better fit depending on the required queries, consistency, retention and scale.

The important thing is:

> **Start with access patterns and requirements, not with the database technology.**

---

# 7. Database Indexing

This is a concept you already know from SQL interview preparation, but it's also critical in system design.

Suppose we have:

```sql
SELECT *
FROM Users
WHERE Email = 'ramesh@example.com';
```

If there is no index on `Email`, the database may need to examine a large portion of the table.

With an appropriate index:

```text
Email
  ↓
Index
  ↓
Matching row
```

The database can find the record much more efficiently.

---

# 8. But Indexes Aren't Free

This is an important interview point.

Indexes improve reads but have costs.

Suppose:

```text
Table
100 million rows
```

and we create:

```text
Index 1
Index 2
Index 3
Index 4
Index 5
```

Now writes can become more expensive because indexes need to be maintained.

Indexes also consume storage.

Therefore:

> **Don't blindly index every column.**

Design indexes based on actual query patterns.

---

# 9. Database Replication

Suppose we have one database:

```text
          API Servers
               │
               ▼
          ┌──────────┐
          │ Primary  │
          └──────────┘
```

If the database fails:

```text
Database ❌
```

the application can become unavailable.

Replication creates additional copies.

```text
             ┌──────────┐
             │ Primary  │
             └────┬─────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
     Replica 1        Replica 2
```

Now we have redundancy.

---

# 10. Primary and Read Replicas

A common architecture is:

```text
                 API
                  │
          ┌───────┴────────┐
          │                │
        Writes            Reads
          │                │
          ▼                ▼
       Primary         Read Replica
```

For example:

```text
POST /orders
       ↓
Primary DB
```

while:

```text
GET /products
       ↓
Read Replica
```

This is useful when the application is **read-heavy**.

---

# 11. Read Replicas

Suppose:

```text
10,000 reads/sec
1,000 writes/sec
```

We could use:

```text
                 Application
                /           \
             Writes         Reads
               ↓             ↓
            Primary     ┌──────────┐
                        │ Replica 1│
                        └──────────┘
                             
                        ┌──────────┐
                        │ Replica 2│
                        └──────────┘
```

Reads can be distributed across replicas.

This reduces the read workload on the primary database.

---

# 12. Replication Lag

Here's an important problem.

Suppose:

```text
Client
  ↓
Primary
  ↓
Write completed
```

But the replica hasn't received the update yet.

Then:

```text
Read Replica
     ↓
Old data
```

This is called **replication lag**.

Example:

```text
T1:
User updates profile

Primary:
Name = "Ramesh"

T2:
Immediately reads from replica

Replica:
Name = old value
```

This creates a consistency issue.

---

# 13. Strong vs Eventual Consistency

### Strong consistency

After a successful write, subsequent reads return the latest committed value according to the system's consistency guarantees.

Example:

```text
Write:
Balance = ₹10,000

Immediately read:
₹10,000
```

This is useful for things like:

- Payments
- Account balances
- Critical inventory operations

---

### Eventual consistency

Updates may take some time to propagate, but eventually replicas converge.

Example:

```text
Primary:
New profile picture

Replica:
Old picture

     ↓
Propagation

Replica:
New picture
```

This may be acceptable for:

- Social media feeds
- Analytics
- View counters
- Recommendations

depending on the product requirements.

---

# 14. Database Partitioning

Partitioning means dividing data into smaller logical pieces.

For example:

```text
Orders
```

could be partitioned by:

```text
Year
```

```text
Orders
├── 2024
├── 2025
├── 2026
└── 2027
```

Or by another suitable partition key.

Partitioning can improve:

- Query performance
- Data management
- Maintenance
- Storage management

---

# 15. Sharding

Sharding is a form of horizontal data distribution.

Instead of putting all data on one database:

```text
              Database
        ┌───────────────┐
        │ All Customers │
        └───────────────┘
```

we distribute it:

```text
             Customer Data
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Shard 1   Shard 2   Shard 3
```

For example, by customer ID:

```text
CustomerId 1–1M
      ↓
Shard 1

CustomerId 1M–2M
      ↓
Shard 2

CustomerId 2M–3M
      ↓
Shard 3
```

Each shard stores only part of the data.

---

# 16. Why Do We Need Sharding?

Imagine:

```text
10 billion users
```

Trying to store and serve all data from one database may become impractical.

Sharding allows:

```text
10 billion users

       ↓

Shard 1 → 2B
Shard 2 → 2B
Shard 3 → 2B
Shard 4 → 2B
Shard 5 → 2B
```

The system can distribute storage and workload.

---

# 17. Choosing a Shard Key

This is a very common interview follow-up.

Suppose we're sharding users.

Possible shard keys:

```text
userId
country
email
organizationId
```

A good shard key should ideally:

- Distribute data reasonably evenly
- Distribute traffic
- Support common queries
- Avoid hotspots
- Be stable

### Bad example

Suppose 80% of users are from one country:

```text
India → 80%
US    → 10%
UK    → 5%
Others → 5%
```

Sharding purely by country could create:

```text
India shard → overloaded
Other shards → underutilized
```

This is a **hotspot** / skew problem.

---

# 18. Sharding vs Replication

Very important.

### Replication

Creates **copies of the same data**.

```text
             Same Data
          /      |      \
         ▼       ▼       ▼
      Primary Replica Replica
```

Purpose:

- Availability
- Read scaling
- Disaster recovery

### Sharding

Splits **different data** across machines.

```text
          All Data
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     Shard1 Shard2 Shard3
```

Purpose:

- Scale storage
- Scale writes
- Scale workload

### Easy memory trick

> **Replication = Copies**

> **Sharding = Splitting**

---

# 19. Database Bottleneck Example

Imagine:

```text
100,000 requests/sec
```

Your architecture:

```text
                 Load Balancer
               /      |      \
              ▼       ▼       ▼
            API1     API2     API3
               \      |      /
                \     |     /
                 ▼    ▼    ▼
                  SQL Server
```

You add:

```text
API4
API5
API6
API7
```

But all of them hit the same database.

Database utilization becomes:

```text
CPU = 100%
I/O = 100%
Connections = exhausted
```

Adding more API servers doesn't fix it.

Possible solutions depend on the bottleneck:

```text
Database Bottleneck
        │
        ├── Optimize queries
        ├── Add indexes
        ├── Caching
        ├── Read replicas
        ├── Partitioning
        ├── Sharding
        └── Change storage model
```

You should always identify the actual bottleneck before choosing a solution.

---

# 20. Caching as a Database Scaling Strategy

Suppose we have:

```text
GET /products/100
```

and Product 100 is requested 1 million times.

Without cache:

```text
1 million requests
        ↓
Database
```

With cache:

```text
1 million requests
        ↓
      Redis
        │
        ├── 999,000 cache hits
        │
        └── 1,000 database requests
```

The exact numbers are illustrative, but the principle is important.

Caching can dramatically reduce database load.

We'll dedicate a full day to **Redis and caching strategies** later.

---

# 21. SQL Server Example for Your .NET Background

Suppose your ASP.NET Core application uses:

```text
ASP.NET Core
      ↓
Entity Framework Core
      ↓
SQL Server
```

At small scale:

```text
API
 ↓
SQL Server
```

At larger scale, we might introduce:

```text
                Load Balancer
                /     |     \
               ▼      ▼      ▼
             API1    API2    API3
                \     |     /
                  Redis
                    │
                    ▼
                 SQL Server
```

Then as read traffic grows:

```text
                    SQL
                 ┌───┴───┐
                 ▼       ▼
              Primary  Replica
                ↑        ↑
              Writes    Reads
```

And at very large scale, depending on requirements:

```text
                    Data
                     │
             ┌───────┼───────┐
             ▼       ▼       ▼
           Shard 1 Shard 2 Shard 3
```

Notice how we don't jump directly to sharding.

We progressively address bottlenecks.

---

# 🎯 Day 3 Interview Questions

Try these yourself before looking at the answers.

### Q1.
Why can the database become a bottleneck even if the application layer is horizontally scaled?

### Q2.
What are the main differences between SQL and NoSQL databases?

### Q3.
When would you choose SQL Server over a NoSQL database?

### Q4.
What is database indexing? Why does it improve query performance?

### Q5.
What are the disadvantages or costs of adding too many indexes?

### Q6.
What is database replication? Why is it useful?

### Q7.
What is a read replica? When would you use one?

### Q8.
What is replication lag and how can it affect an application?

### Q9.
What is the difference between replication and sharding?

### Q10.
What is a shard key? What characteristics make a good shard key?

---

# 🔥 Bonus Scenario

Imagine you're designing a **large e-commerce application**.

You have:

```text
100 million users
10 million orders/day
100,000 requests/sec
```

Current architecture:

```text
                 Load Balancer
                /      |      \
               ▼       ▼       ▼
             API1     API2    API3
                \      |      /
                 \     |     /
                  SQL Server
```

The interviewer says:

> **"The SQL Server is now at 95–100% CPU. What would you do?"**

Don't immediately answer:

> "Shard the database."

Think in stages:

```text
Database CPU High
       ↓
Check query performance
       ↓
Check indexes
       ↓
Check connection/query patterns
       ↓
Cache frequently accessed data
       ↓
Separate read traffic
       ↓
Read replicas
       ↓
Partitioning if appropriate
       ↓
Sharding if scale genuinely requires it
```

This **progressive approach** is exactly what interviewers want to see.

---

# 🧠 Day 3 Cheat Sheet

```text
SQL
 ↓
Structured + relational + transactions

NoSQL
 ↓
Distributed/flexible/specialized access patterns

Index
 ↓
Faster reads
 ↓
But additional storage + write/maintenance cost

Replication
 ↓
Copies of data

Read Replica
 ↓
Scale reads

Replication Lag
 ↓
Replica may temporarily have older data

Sharding
 ↓
Split data across machines

Shard Key
 ↓
Determines where data goes
```

### ⭐ Most important distinction

```text
Replication = "Give me another copy."

Sharding    = "Split the data between machines."
```

And one interview rule to remember:

> **Don't introduce sharding, microservices, Kafka, or other complex technologies just because the system is "large." First identify the actual bottleneck and choose the simplest architecture that satisfies the requirements.**
