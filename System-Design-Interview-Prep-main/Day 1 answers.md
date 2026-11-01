# System Design Day 1 — Interview Answers Q1–Q10

These answers are phrased so you can **actually say them in an interview**, rather than sounding like textbook definitions.

## Q1. What is System Design? Why is it important?

**Interview answer:**

System design is the process of defining the architecture, components, data storage, APIs, communication patterns, and infrastructure of a software system based on its requirements.

The goal is not only to make the application function correctly, but also to ensure it can handle requirements such as scalability, availability, reliability, performance, security, and maintainability.

For example, if we're designing an e-commerce application, we need to decide how clients communicate with backend services, where product and order data is stored, how frequently accessed data is cached, how requests are distributed across servers, and how the system behaves when a component fails.

**Key sentence to remember:**

> System design is about deciding how different components work together to build a scalable, reliable, and maintainable system.

---

# Q2. What is the difference between HLD and LLD?

**Interview answer:**

HLD, or High-Level Design, describes the overall architecture of the system and the major components and their interactions.

For example:

```text
Client
   ↓
API Gateway
   ↓
Backend Services
   ↓
Cache / Database / Message Queue
```

In HLD, we discuss things such as:

- Services
- Databases
- Caching
- Load balancing
- Message queues
- API communication
- Scalability
- Fault tolerance

LLD, or Low-Level Design, focuses on the internal implementation of individual components.

For example, in a .NET application:

```text
ProductController
       ↓
IProductService
       ↓
ProductService
       ↓
IProductRepository
       ↓
Database
```

LLD includes:

```csharp
public interface IProductService
{
    Task<Product?> GetProductAsync(int id);
}
```

It covers classes, interfaces, relationships, SOLID principles and design patterns.

**Key difference:**

> HLD explains **how the overall system is structured**, while LLD explains **how individual components are implemented**.

---

# Q3. What are Functional and Non-Functional Requirements?

**Interview answer:**

Functional requirements describe **what the system should do**.

For an e-commerce application, functional requirements could be:

```text
Search products
Add product to cart
Place order
Make payment
Track order
```

Non-functional requirements describe **how well the system should perform those functions**.

Examples include:

```text
Scalability
Availability
Reliability
Latency
Security
Consistency
Durability
Maintainability
```

For example:

> "The user should be able to place an order."

is a functional requirement.

Whereas:

> "The order API should respond within 300 milliseconds for 99% of requests."

is a non-functional requirement.

**Remember:**

```text
Functional     → WHAT the system does

Non-functional → HOW WELL the system does it
```

---

# Q4. What is Scalability?

**Interview answer:**

Scalability is the ability of a system to handle increasing workload by adding resources without significantly degrading performance.

For example, suppose our API initially handles:

```text
1,000 requests/sec
```

but after the application grows, it needs to handle:

```text
100,000 requests/sec
```

The architecture should allow us to increase capacity.

There are two main approaches:

```text
Vertical Scaling
Horizontal Scaling
```

Vertical scaling means increasing the resources of an existing server.

Horizontal scaling means adding additional servers.

For distributed web applications, horizontal scaling is commonly preferred because it can provide both greater capacity and better fault tolerance.

---

# Q5. What is the difference between Vertical and Horizontal Scaling?

**Interview answer:**

Vertical scaling means increasing the resources of an existing machine.

For example:

```text
Before
4 CPU
8 GB RAM

     ↓

After
16 CPU
64 GB RAM
```

This is also called **scaling up**.

Horizontal scaling means adding more machines.

```text
              Load Balancer
             /      |      \
            ↓       ↓       ↓
        Server 1 Server 2 Server 3
```

This is called **scaling out**.

### Comparison

| Vertical Scaling | Horizontal Scaling |
|---|---|
| Bigger machine | More machines |
| Scaling up | Scaling out |
| Easier initially | More architectural complexity |
| Hardware has limits | Can scale much further |
| May retain single point of failure | Better fault tolerance when designed properly |
| Often requires larger-machine upgrades | Capacity can be added incrementally |

### Interview follow-up: Which would you choose?

I'd say:

> "For a small application, vertical scaling may be sufficient and simpler. For a high-traffic distributed application, I'd generally design for horizontal scaling because we can add application instances as traffic increases and avoid depending on a single server."

---

# Q6. What is Availability? How is it different from Reliability?

**Interview answer:**

Availability refers to whether a system is accessible and able to serve requests when users need it.

For example:

```text
99.9% availability
```

means the system is expected to be available for 99.9% of the measured period.

Reliability refers to whether the system continues to perform its intended function correctly and consistently over time.

Consider a payment system.

Suppose the API is reachable almost all the time:

```text
Availability = High
```

but occasionally the application processes the same payment twice.

The system may be highly available, but it isn't sufficiently reliable or correct.

### Easy way to remember

```text
Availability
      ↓
Can I access the system?

Reliability
      ↓
Can I trust the system to work correctly?
```

In real system design, these concepts overlap, but they're not identical.

---

# Q7. What is Latency? What is Throughput?

**Interview answer:**

Latency is the amount of time required to process a request or operation.

For example:

```text
Client → API → Database → API → Client

Total = 120 ms
```

The request latency is approximately:

```text
120 ms
```

Throughput represents how much work the system processes within a given amount of time.

For an API, we might measure:

```text
10,000 requests/second
```

For a messaging system:

```text
500,000 messages/second
```

For storage:

```text
MB/s or GB/s
```

So:

> Latency measures how long an operation takes, while throughput measures how many operations can be processed over time.

---

# Q8. What is the difference between Latency and Throughput?

This question often follows Q7.

**Interview answer:**

Latency measures the time required for an individual operation, whereas throughput measures the amount of work completed within a given period.

For example:

```text
Average API response = 100 ms
```

That's latency.

```text
API handles 20,000 requests/sec
```

That's throughput.

A system can theoretically have:

```text
Low latency + Low throughput
High latency + High throughput
Low latency + High throughput ← usually desirable
```

### Important interview point

Don't assume improving throughput automatically improves latency.

For example, **batch processing** may increase throughput because many records are processed together, while increasing the latency experienced by an individual item waiting for a batch.

---

# Q9. What questions should you ask before designing a system?

This is **extremely important**.

If an interviewer says:

> "Design an e-commerce system."

Don't immediately say:

> "I'll use microservices, Kafka, Redis, Kubernetes..."

That's a common mistake.

Start with **requirements clarification**.

### Functional requirements

Ask:

> "What are the core features we need to support?"

For example:

```text
Product search?
Cart?
Orders?
Payments?
Inventory?
Recommendations?
```

Then clarify scale.

```text
How many users?

How many daily active users?

What's the expected read/write traffic?

Are there traffic spikes?
```

Then ask about non-functional requirements.

```text
What availability do we require?

What latency is acceptable?

Do we need strong consistency?

Are there durability requirements?
```

Then clarify data characteristics.

```text
How much data?

How quickly does it grow?

What's the read/write ratio?

How long should we retain it?
```

### Strong interview response

I'd say:

> "Before choosing technologies, I'd first clarify the functional requirements, expected scale, traffic patterns, data volume, consistency requirements, latency expectations and availability requirements. Those constraints will drive the architecture."

That's a very good sentence to remember.

---

# Q10. Explain how you would approach "Design a URL Shortener."

This is the most important question today because it tests whether you can apply the framework.

Suppose the interviewer says:

> **Design a URL Shortener like Bitly.**

Don't immediately start designing.

## Step 1 — Clarify Requirements

I'd start by asking:

> "Before getting into the architecture, I'd like to clarify the requirements and expected scale."

### Functional requirements

We need:

```text
1. Create short URL

Long URL
     ↓
https://example.com/something/very/long

     ↓

Short URL

short.ly/Ab12Cd
```

Second:

```text
2. Redirect short URL

short.ly/Ab12Cd

       ↓

Original URL
```

Potential additional requirements:

```text
Custom aliases
Expiration
Analytics
```

But if the interviewer says they're out of scope, don't design them.

---

## Step 2 — Estimate Scale

Suppose the interviewer gives:

```text
10 million new URLs/day
100 million redirects/day
```

Calculate approximate average QPS.

For writes:

```text
10,000,000 / 86,400

≈ 116 writes/sec
```

For redirects:

```text
100,000,000 / 86,400

≈ 1,157 reads/sec
```

But average traffic isn't enough.

We should design for peak traffic, potentially several times higher.

Notice something else:

```text
Reads >> Writes
```

So this is a **read-heavy system**.

That immediately suggests caching may be useful.

---

# Step 3 — Define APIs

We could expose:

```http
POST /api/urls
```

Request:

```json
{
  "longUrl": "https://example.com/products/12345"
}
```

Response:

```json
{
  "shortUrl": "https://short.ly/aB3x91"
}
```

Redirect:

```http
GET /aB3x91
```

Response:

```text
HTTP 301/302 Redirect
Location: https://example.com/products/12345
```

We'd discuss **301 vs 302** later because it has caching and analytics implications.

---

# Step 4 — Data Model

A simple model might be:

```text
UrlMapping

shortCode
longUrl
createdAt
expiresAt
```

Example:

```text
aB3x91
    ↓
https://example.com/products/12345
```

The most important lookup is:

```text
shortCode → longUrl
```

Therefore `shortCode` should support efficient lookup, typically through an appropriate key/index.

---

# Step 5 — High-Level Architecture

Now we can finally draw the architecture.

```text
                     ┌───────────┐
                     │  Clients  │
                     └─────┬─────┘
                           │
                           ▼
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
             ┌─────────┐       ┌─────────┐
             │API      │       │API      │
             │Server 1 │       │Server 2 │
             └────┬────┘       └────┬────┘
                  │                 │
                  └────────┬────────┘
                           │
                     ┌─────▼─────┐
                     │   Cache   │
                     └─────┬─────┘
                           │
                     Cache Miss
                           │
                           ▼
                     ┌──────────┐
                     │ Database │
                     └──────────┘
```

---

# Step 6 — Redirect Flow

User enters:

```text
short.ly/aB3x91
```

Request goes:

```text
Client
  ↓
Load Balancer
  ↓
API Server
  ↓
Cache
```

If cache contains:

```text
aB3x91
   ↓
https://example.com/products/12345
```

return the redirect immediately.

This gives us:

```text
Client
 ↓
API
 ↓
Cache
 ↓
Redirect
```

Very fast.

---

# Step 7 — Cache Miss

If the mapping isn't cached:

```text
API
 ↓
Cache
 ↓
MISS
 ↓
Database
 ↓
Get URL
 ↓
Store in Cache
 ↓
Redirect
```

Subsequent requests can hit the cache.

Because URL shorteners are typically **read-heavy**, popular mappings are good caching candidates.

---

# Step 8 — Scaling

If traffic grows:

```text
                 Load Balancer
                /      |      \
               ↓       ↓       ↓
             API1    API2    API3
```

Application servers should ideally remain **stateless** so instances can be added or removed easily.

We'll study stateless architecture later.

---

# Step 9 — Identify Bottlenecks

Potential bottlenecks include:

```text
Database traffic

Hot URLs

Cache overload

Short-code generation

Storage growth

Server failures
```

For example, if a celebrity posts:

```text
short.ly/xyz123
```

millions of people might access the exact same URL.

That's a **hot key** scenario.

Caching can reduce database pressure, though at very large scale we'd need to think more carefully about cache distribution and hot-key handling.

---

# Step 10 — Discuss Trade-offs

For example:

### SQL vs NoSQL

Don't say:

> "NoSQL is better because it's faster."

Instead say:

> "The dominant access pattern is a key-based lookup from shortCode to longUrl. Depending on the expected scale and consistency requirements, a distributed key-value store could be a good fit. At smaller scale, a relational database with an indexed shortCode can also work well. I'd choose based on the actual scale and operational requirements."

That's **system-design thinking**.

---

# ⭐ Q10 — Compact Interview Answer

If the interviewer asks you to summarize your approach, say:

> "I'd first clarify the functional and non-functional requirements. Then I'd estimate traffic and storage to understand the expected scale. Next I'd define the APIs and data model. After that I'd create the high-level architecture and walk through the major read and write flows. Finally, I'd identify bottlenecks and discuss scaling, caching, availability, failure handling and the trade-offs behind the design choices."

That's one of the most useful answers to remember.

---

# 🧠 Day 1 Cheat Sheet

```text
System Design Interview

        ↓

1. Requirements
        ↓
2. Scale Estimation
        ↓
3. APIs
        ↓
4. Data Model
        ↓
5. High-Level Design
        ↓
6. Request/Data Flow
        ↓
7. Bottlenecks
        ↓
8. Scaling
        ↓
9. Failure Handling
        ↓
10. Trade-offs
```

And remember these five pairs:

```text
Functional       = WHAT
Non-functional   = HOW WELL

Vertical scaling = BIGGER machine
Horizontal       = MORE machines

Latency          = TIME per operation
Throughput       = WORK per unit time

Availability     = Can users access it?
Reliability      = Does it keep working correctly?

HLD              = Architecture
LLD              = Classes / objects / implementation
```
