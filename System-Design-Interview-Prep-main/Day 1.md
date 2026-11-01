# 🚀 System Design Interview Preparation — Day 1

Today we build the **foundation**. Don't worry about Redis, Kafka, microservices, sharding, etc. yet. First, you need to understand **how to think like a system designer**.

---

# Day 1 — System Design Fundamentals

## 1. What is System Design?

**System design is the process of defining the architecture, components, data flow, APIs, databases, and infrastructure required to build a software system that satisfies functional and non-functional requirements.**

For example, suppose an interviewer asks:

> **"Design a URL Shortener like Bitly."**

You shouldn't immediately start drawing:

```text
Client → API → Database
```

First ask:

- How many users?
- How many URLs?
- How many requests per second?
- How quickly should redirects happen?
- Should the system be available 99.9% of the time?
- How long should URLs be stored?
- Do we need analytics?

System design is primarily about **making engineering decisions based on requirements and constraints**.

---

# 2. HLD vs LLD

This is very important for interviews.

### HLD — High-Level Design

Focuses on **components and how they communicate**.

Example:

```text
              ┌──────────────┐
              │    Client    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Load Balancer│
              └──────┬───────┘
                     │
            ┌────────┴────────┐
            ▼                 ▼
      ┌──────────┐      ┌──────────┐
      │ API      │      │ API      │
      │ Server 1 │      │ Server 2 │
      └────┬─────┘      └────┬─────┘
           │                 │
           └────────┬────────┘
                    ▼
              ┌──────────┐
              │ Database │
              └──────────┘
```

HLD discusses:

- Services
- Databases
- Caches
- Load balancers
- Queues
- APIs
- Communication
- Scaling
- Availability

### LLD — Low-Level Design

Focuses on **classes, interfaces, objects and their interactions**.

Example:

```csharp
public interface IUrlService
{
    Task<string> CreateShortUrl(string longUrl);
    Task<string> GetLongUrl(string shortCode);
}
```

Then:

```text
UrlController
      ↓
IUrlService
      ↓
UrlRepository
      ↓
Database
```

### Interview distinction

| HLD | LLD |
|---|---|
| Architecture | Classes |
| Services | Interfaces |
| Databases | Objects |
| Scaling | Design patterns |
| Load balancing | SOLID |
| Caching | Dependency Injection |
| Message queues | Class relationships |

For your preparation, we'll cover **both**, but we'll start with HLD.

---

# 3. Functional Requirements

Functional requirements describe **what the system should do**.

Example: You are designing an online shopping system.

Functional requirements:

- User can register.
- User can login.
- User can search products.
- User can add products to cart.
- User can place orders.
- User can make payments.
- User can track orders.

These are the **features**.

### Interview tip

Don't try to design every possible feature.

Ask:

> "What are the core functional requirements we should focus on?"

Then define the scope.

---

# 4. Non-Functional Requirements

Non-functional requirements describe **how well the system should operate**.

Examples:

- Scalability
- Availability
- Reliability
- Performance
- Security
- Maintainability
- Consistency

For example:

> The system should support 10 million users and maintain 99.9% availability.

That's not a feature.

That's a **non-functional requirement**.

---

# 5. Scalability

Scalability means:

> **The ability of a system to handle increasing load by adding resources.**

Suppose your application currently handles:

```text
1,000 requests/sec
```

Later it needs to handle:

```text
100,000 requests/sec
```

Your system needs to scale.

There are two major approaches.

---

## Vertical Scaling

Increase the power of a machine.

```text
Before:

4 CPU
8 GB RAM

        ↓

After:

16 CPU
64 GB RAM
```

Advantages:

- Simple
- Easy to implement

Disadvantages:

- Hardware limit
- Can become expensive
- Single-machine failure remains a concern

---

## Horizontal Scaling

Add more machines.

```text
              Load Balancer
               /    |    \
              /     |     \
             ▼      ▼      ▼
          Server1 Server2 Server3
```

Instead of making one server extremely powerful, add more servers.

This is extremely important for modern distributed systems.

---

# 6. Availability

Availability means:

> **How often the system is operational and accessible when users need it.**

For example:

```text
99%
99.9%
99.99%
99.999%
```

These numbers are often called **availability percentages**.

Approximate annual downtime:

| Availability | Downtime/year |
|---|---:|
| 99% | 3.65 days |
| 99.9% | 8.76 hours |
| 99.99% | 52.6 minutes |
| 99.999% | 5.26 minutes |

So:

**99.9% availability** means the system can theoretically be unavailable for around **8 hours 45 minutes per year**.

---

# 7. Reliability

Availability and reliability are related but different.

### Availability

> Is the system available right now?

### Reliability

> Does the system consistently perform correctly over time?

Example:

A payment service might be available:

```text
99.99%
```

but if it occasionally charges customers twice, it's not sufficiently **reliable**.

For financial systems, reliability and correctness are critical.

---

# 8. Performance

Performance describes how efficiently the system responds to requests.

Two important metrics:

### Latency

How long does one request take?

Example:

```text
Request
   ↓
API
   ↓
Database
   ↓
Response

Latency = 100 ms
```

### Throughput

How many requests can the system process over a period of time?

Example:

```text
10,000 requests/sec
```

---

# 9. Latency vs Throughput

This is a common interview question.

### Latency

**Time taken for a request.**

Example:

```text
API request → response

50 ms
```

### Throughput

**Number of requests processed per unit of time.**

Example:

```text
50,000 requests/second
```

Think:

> **Latency = How fast?**

> **Throughput = How much?**

---

# 10. The System Design Interview Framework

This is probably the most important thing from Day 1.

Whenever the interviewer gives you:

> "Design X"

Don't immediately draw architecture.

Follow this sequence:

```text
1. Requirements
       ↓
2. Scale Estimation
       ↓
3. APIs
       ↓
4. Data Model
       ↓
5. High-Level Architecture
       ↓
6. Detailed Design
       ↓
7. Bottlenecks
       ↓
8. Scaling
       ↓
9. Failure Handling
       ↓
10. Trade-offs
```

Let's understand each.

---

## Step 1 — Requirements

Ask:

> What does the system need to do?

Example:

**URL Shortener**

```text
Create short URL
Redirect short URL
View basic analytics
```

---

## Step 2 — Scale Estimation

Ask:

> How much traffic are we expecting?

Example:

```text
100 million users
10 million URLs/day
100K requests/sec
```

You don't need perfect mathematics.

The goal is to understand the **order of magnitude**.

---

## Step 3 — APIs

Define major APIs.

Example:

```http
POST /urls
GET /{shortCode}
```

---

## Step 4 — Data Model

Example:

```text
URL
----------------
id
shortCode
longUrl
createdAt
expiresAt
```

---

## Step 5 — High-Level Architecture

Now draw:

```text
Client
  ↓
Load Balancer
  ↓
API Servers
  ↓
Cache
  ↓
Database
```

---

## Step 6 — Deep Dive

Now ask:

> What happens when traffic increases?

Maybe:

```text
Cache
Database Replication
Read Replicas
Horizontal Scaling
```

---

## Step 7 — Bottlenecks

Identify potential problems.

Example:

```text
Database becomes overloaded
        ↓
Read replicas
        +
Caching
```

---

## Step 8 — Failure Handling

Ask:

> What happens if the database goes down?

Possible solutions:

- Replication
- Failover
- Backup
- Retry
- Circuit breaker

We'll study these in later days.

---

## Step 9 — Trade-offs

This is where strong candidates differentiate themselves.

For example:

> "We could use SQL because we need strong consistency, but at very large scale a distributed NoSQL database may provide better horizontal scalability. The choice depends on the access pattern and consistency requirements."

Don't simply say:

> "We'll use MongoDB because it's scalable."

Explain **why**.

---

# 🎯 Day 1 Interview Questions

Don't look for answers yet. Try answering them yourself.

### Q1.
**What is system design? Why is it important?**

### Q2.
**What is the difference between HLD and LLD?**

### Q3.
**What are functional and non-functional requirements? Give examples.**

### Q4.
**What is scalability?**

### Q5.
**What is the difference between vertical and horizontal scaling?**

### Q6.
**What is availability? How is it different from reliability?**

### Q7.
**What is latency? What is throughput?**

### Q8.
**What is the difference between latency and throughput?**

### Q9.
**What questions should you ask before designing a system?**

### Q10.
**Explain the step-by-step approach you would follow when asked: "Design a URL Shortener."**

---

# 🧠 Day 1 Interview Cheat Sheet

Remember these:

```text
System Design
     ↓
Requirements
     ↓
Scale
     ↓
APIs
     ↓
Data
     ↓
Architecture
     ↓
Bottlenecks
     ↓
Scaling
     ↓
Failure Handling
     ↓
Trade-offs
```

And:

```text
Functional       → What the system does
Non-functional   → How well it does it

Latency          → Time per request
Throughput       → Requests per second

Vertical scaling → Bigger machine
Horizontal       → More machines

Availability     → System is accessible
Reliability      → System works correctly/consistently

HLD              → Architecture
LLD              → Classes/design
```

### Your Day 1 task

Try answering **Q1–Q10 in your own words** first.
