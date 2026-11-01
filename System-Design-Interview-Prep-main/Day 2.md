# 🚀 System Design Interview Preparation — Day 2

## Topic: Scalability, Load Balancing & Stateless Services

Day 1 taught us **how to approach a system-design problem**.

Today we'll understand one of the most important building blocks of scalable systems:

> **How do we handle increasing traffic without relying on one server?**

This topic comes up constantly in .NET/Azure interviews.

---

# 1. Why Do We Need Scalability?

Imagine you have an ASP.NET Core Web API running on one server:

```text
              Users
                │
                ▼
         ┌─────────────┐
         │ API Server  │
         └──────┬──────┘
                │
                ▼
            Database
```

Initially:

```text
1,000 requests/sec
```

Maybe the server handles it comfortably.

But your application grows:

```text
10,000 requests/sec
```

Now the server becomes overloaded.

Eventually:

```text
CPU → 100%
Memory → High
Response time → Increasing
Requests → Timing out
```

We need to scale.

---

# 2. Vertical Scaling

We covered this briefly on Day 1.

You make the existing machine more powerful.

```text
Before:

4 CPU
8 GB RAM

       ↓

After:

16 CPU
64 GB RAM
```

### Advantages

- Simple
- Minimal architectural changes
- Easy for smaller systems

### Disadvantages

- Hardware limits
- Increasing cost
- Potential single point of failure
- Eventually you cannot keep scaling vertically

---

# 3. Horizontal Scaling

Instead of making one server bigger, add more servers.

```text
                 Users
                   │
                   ▼
             Load Balancer
             /      |      \
            ▼       ▼       ▼
         Server1 Server2 Server3
```

If one server handles:

```text
5,000 requests/sec
```

three servers could potentially handle roughly:

```text
15,000 requests/sec
```

assuming the workload distributes evenly and the rest of the architecture can support it.

### Why is horizontal scaling powerful?

Because you can continue adding instances:

```text
3 servers
   ↓
10 servers
   ↓
50 servers
   ↓
100 servers
```

This is fundamental to distributed systems.

---

# 4. What is a Load Balancer?

A **load balancer** distributes incoming requests across multiple backend servers.

Without load balancing:

```text
Users
  │
  ▼
Server
```

With load balancing:

```text
                 Users
                   │
                   ▼
             Load Balancer
             /      |      \
            ▼       ▼       ▼
         Server1 Server2 Server3
```

The load balancer acts as the entry point for backend servers.

---

# 5. Why Do We Need a Load Balancer?

There are several reasons.

### 1. Distribute traffic

Instead of sending every request to one server:

```text
100% → Server 1
```

we can distribute:

```text
33% → Server 1
33% → Server 2
34% → Server 3
```

---

### 2. Scalability

If traffic increases:

```text
Before:

LB
├── Server 1
└── Server 2
```

We can add:

```text
LB
├── Server 1
├── Server 2
├── Server 3
├── Server 4
└── Server 5
```

---

### 3. Fault tolerance

Suppose:

```text
Server 2 ❌
```

The load balancer can stop sending traffic to that unhealthy server.

```text
                 Load Balancer
                /      |      \
               ▼       X       ▼
           Server 1  Server 2  Server 3
             ✅         ❌        ✅
```

Users can continue using the system.

---

# 6. Types of Load Balancers

At a high level:

### Layer 4 Load Balancer

Works primarily with network-level information such as:

- IP
- TCP
- Port

Example:

```text
Client
  ↓
TCP
  ↓
Load Balancer
  ↓
Server
```

### Layer 7 Load Balancer

Works at the application/HTTP level.

It can inspect things such as:

```text
HTTP method
URL
Headers
Cookies
Host
```

For example:

```text
/api/products
      ↓
Product Service

/api/orders
      ↓
Order Service
```

Layer 7 load balancing is especially useful when routing decisions depend on HTTP-level information.

---

# 7. Load Balancing Algorithms

The interviewer may ask:

> "How does a load balancer decide which server receives a request?"

There are several approaches.

---

## Round Robin

Requests are distributed sequentially.

```text
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1
Request 5 → Server 2
```

Pattern:

```text
S1 → S2 → S3 → S1 → S2 → S3
```

Simple and commonly used.

---

# 8. Weighted Round Robin

Not every server has the same capacity.

Suppose:

```text
Server 1 → powerful
Server 2 → medium
Server 3 → small
```

We could assign:

```text
Server 1 → weight 5
Server 2 → weight 3
Server 3 → weight 2
```

The stronger server receives more traffic.

---

# 9. Least Connections

The load balancer sends a new request to the server with the fewest active connections.

Example:

```text
Server 1 → 100 connections
Server 2 → 50 connections
Server 3 → 20 connections
```

New request:

```text
             ↓
         Server 3
```

This can be useful when requests have different processing times.

---

# 10. IP Hash

The load balancer calculates a hash based on the client's IP.

Conceptually:

```text
Client IP
   ↓
Hash
   ↓
Server
```

This can help maintain affinity for a client, although relying on IP-based affinity has limitations and is not automatically the best solution.

---

# 11. Health Checks

This is an important interview concept.

Suppose we have:

```text
Server 1 ✅
Server 2 ❌
Server 3 ✅
```

How does the load balancer know Server 2 is unhealthy?

Through **health checks**.

For example:

```http
GET /health
```

Server responds:

```http
200 OK
```

The load balancer considers it healthy.

If it repeatedly fails:

```text
500
Timeout
Connection refused
```

the load balancer can temporarily remove the server from rotation.

---

# 12. ASP.NET Core Health Checks

Since you're preparing for .NET interviews, this is particularly relevant.

ASP.NET Core supports health checks.

Conceptually:

```csharp
builder.Services.AddHealthChecks();
```

Then:

```csharp
app.MapHealthChecks("/health");
```

Now an infrastructure component can check:

```text
GET /health
```

You can also add checks for dependencies such as databases.

For example:

```text
Application
    │
    ├── API
    ├── SQL Server
    ├── Redis
    └── External API
```

A production health strategy may distinguish between:

### Liveness

> Is the application process alive?

### Readiness

> Is the application ready to receive traffic?

This distinction becomes very important in containerized environments.

---

# 13. What is a Stateless Service?

This is one of today's **most important concepts**.

A stateless server doesn't rely on local server memory to maintain a user's session between requests.

Imagine:

```text
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
```

The application should still know who the user is.

The server shouldn't depend on:

```text
Server 1's RAM
```

for essential session state.

---

# 14. Stateful vs Stateless

### Stateful

```text
User
 ↓
Server 1

Session stored in Server 1 memory
```

Next request:

```text
User
 ↓
Server 2

❌ Server 2 doesn't know the session
```

This creates problems when horizontally scaling.

---

### Stateless

Instead:

```text
User
 ↓
Load Balancer
 ↓
Any Server
```

State can be stored externally:

```text
             ┌─────────────┐
             │ API Servers │
             └──────┬──────┘
                    │
             ┌──────┴──────┐
             │             │
           Redis        Database
```

Now any server can handle the request.

---

# 15. JWT and Stateless Authentication

This connects directly with what you've been learning in ASP.NET Core.

With JWT authentication:

```text
Login
  ↓
Authentication Service
  ↓
JWT
  ↓
Client
```

The client sends:

```http
Authorization: Bearer <token>
```

with subsequent requests.

Any API instance can validate the token.

```text
             Load Balancer
             /     |     \
            ▼      ▼      ▼
          API1    API2    API3
            \      |      /
             \     |     /
              Database
```

This is one reason token-based authentication can work well with horizontally scaled APIs.

**Important:** "JWT = always stateless" is an oversimplification. If your system maintains server-side session/revocation state, some state still exists. The key interview point is that the API instances don't need to keep the user's primary session in local memory.

---

# 16. Session Stickiness

You may hear:

> **Sticky sessions**

or:

> **Session affinity**

This means the load balancer tries to send the same user's requests to the same server.

```text
User A
  ↓
Load Balancer
  ↓
Server 1

User A's future requests
  ↓
Server 1
```

This can make stateful applications easier to operate.

But it has disadvantages:

- Uneven traffic
- Reduced flexibility
- Server failure can affect sessions
- Scaling becomes more complicated

Therefore, for many modern APIs, we prefer:

> **Stateless application servers + shared external state when state is required.**

---

# 17. Scaling with External State

Suppose you have:

```text
API Server 1
API Server 2
API Server 3
```

and all need access to:

```text
Session
Cache
Shared data
```

Don't put it only in:

```text
API Server 1 memory
```

Instead:

```text
                Load Balancer
              /      |      \
             ▼       ▼       ▼
           API1     API2    API3
              \      |      /
               \     |     /
                ▼    ▼    ▼
                  Redis
                    │
                    ▼
                 Database
```

Redis can provide shared in-memory data, while the database provides durable storage.

We'll study Redis properly later.

---

# 18. Single Point of Failure

Imagine:

```text
             Load Balancer
                   │
                   ▼
                Server
```

If the server fails:

```text
Server ❌
```

Entire application is unavailable.

That's a **single point of failure (SPOF)**.

A common approach is redundancy:

```text
             Load Balancer
             /      |      \
            ▼       ▼       ▼
          API1     API2    API3
```

Now one API server can fail without necessarily bringing down the whole application.

But notice something subtle:

> If you have only **one load balancer**, the load balancer itself could become a single point of failure.

In production systems, infrastructure components are typically designed with redundancy/failover as appropriate.

---

# 19. Complete Example

Suppose we have an ASP.NET Core e-commerce API.

A simplified architecture:

```text
                    Internet
                       │
                       ▼
                ┌─────────────┐
                │Load Balancer│
                └──────┬──────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
         API 1       API 2       API 3
            │          │          │
            └──────────┼──────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
           Redis             SQL Server
```

Request:

```text
GET /api/products/100
```

Flow:

```text
Client
  ↓
Load Balancer
  ↓
API Server
  ↓
Redis
  │
  ├── Cache Hit → Return product
  │
  └── Cache Miss
          ↓
       SQL Server
          ↓
       Store in Redis
          ↓
       Return response
```

This architecture gives us:

- Horizontal scalability
- Load distribution
- Fault tolerance at the API tier
- Shared caching
- Durable database storage

---

# 20. Azure Mapping — Important for Your Interviews

Because you're targeting **.NET + Azure roles**, you should learn to map these concepts to Azure services.

Conceptually:

```text
                 Internet
                    │
                    ▼
          Azure Load Balancer /
          Application Gateway
                    │
                    ▼
             ASP.NET Core APIs
             /       |       \
            ▼        ▼        ▼
         Instance Instance Instance
                    │
             ┌──────┴──────┐
             ▼             ▼
          Azure Cache    Azure SQL
          for Redis
```

The exact Azure service depends on the architecture and whether you need L4 or L7 routing, WAF, global distribution, etc.

We'll cover Azure-specific system design later rather than memorizing service names now.

---

# 🎯 Day 2 Interview Questions

As with DSA and SQL, **try these yourself first**.

### Q1.
What is horizontal scaling and why is it preferred for many large-scale systems?

### Q2.
What is the difference between vertical and horizontal scaling?

### Q3.
What is a load balancer and why do we need one?

### Q4.
What is the difference between Layer 4 and Layer 7 load balancing?

### Q5.
Explain Round Robin, Weighted Round Robin, Least Connections and IP Hash.

### Q6.
What is a health check? Why is it important?

### Q7.
What is the difference between a stateful and stateless service?

### Q8.
Why are stateless services easier to scale horizontally?

### Q9.
What are sticky sessions? What are their advantages and disadvantages?

### Q10.
What is a Single Point of Failure? How would you design a system to avoid it?

---

# 🔥 Bonus Interview Scenario

You have an ASP.NET Core API running on **one Windows/Azure VM**.

Traffic increases from:

```text
1,000 requests/sec
```

to:

```text
20,000 requests/sec
```

The interviewer asks:

> **"How would you scale this application?"**

Your thought process should now be:

```text
Single API server
       ↓
Multiple API instances
       ↓
Load Balancer
       ↓
Stateless APIs
       ↓
Shared Cache / Database
       ↓
Health Checks
       ↓
Auto Scaling
```

Don't immediately jump to microservices.

**A horizontally scaled monolith can be perfectly valid.**

That's an important system-design lesson.

---

## 🧠 Day 2 Key Takeaways

Remember these 7 points:

```text
1. Vertical scaling  → Bigger machine

2. Horizontal scaling → More machines

3. Load balancer      → Distributes traffic

4. Health check       → Detects unhealthy instances

5. Stateless API      → Any instance can handle request

6. Sticky session     → Routes user to same instance

7. SPOF               → Component whose failure can
                         bring down the system
```

and I'll give you the **interview-ready answers + common follow-up questions + .NET/Azure examples**.
