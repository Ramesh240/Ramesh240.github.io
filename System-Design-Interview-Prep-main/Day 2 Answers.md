# System Design Day 2 — Answers Q1–Q10

These are **interview-ready answers**. For your ~4-year .NET profile, focus on being able to explain the concept first and then connect it to ASP.NET Core/Azure when asked.

---

## Q1. What is horizontal scaling and why is it preferred for many large-scale systems?

### Interview answer

> Horizontal scaling means increasing system capacity by adding more servers or application instances instead of increasing the resources of an existing server.

For example, instead of running one API server:

```text
Users
  ↓
API Server
```

we can run multiple instances:

```text
              Load Balancer
             /      |      \
            ↓       ↓       ↓
          API 1   API 2   API 3
```

It is often preferred for large-scale systems because we can add or remove instances as traffic changes. It also provides better fault tolerance because failure of one instance doesn't necessarily bring down the entire application.

### Example

If one server handles approximately 5,000 requests/sec:

```text
1 server → 5K req/sec
3 servers → ~15K req/sec
10 servers → ~50K req/sec
```

The actual capacity depends on the workload and other bottlenecks.

### Strong follow-up answer

**Interviewer:** "Can a monolithic application be horizontally scaled?"

> Yes. Horizontal scaling doesn't require microservices. An ASP.NET Core monolith can run as multiple stateless instances behind a load balancer.

That's an important point.

---

# Q2. What is the difference between vertical and horizontal scaling?

### Interview answer

> Vertical scaling means increasing the CPU, RAM, storage, or other resources of an existing machine. Horizontal scaling means adding more machines or application instances.

### Vertical

```text
Before:
4 CPU + 8 GB RAM

        ↓

After:
16 CPU + 64 GB RAM
```

### Horizontal

```text
        Load Balancer
        /     |     \
       ↓      ↓      ↓
     API 1  API 2  API 3
```

### Comparison

| | Vertical | Horizontal |
|---|---|---|
| Approach | Bigger machine | More machines |
| Also called | Scale up | Scale out |
| Complexity | Lower initially | Higher |
| Hardware limit | Yes | Much higher |
| Fault tolerance | Limited | Better when designed correctly |
| Elasticity | Limited | Better |
| Typical large-scale architecture | Less preferred | Common |

### Interview conclusion

> "For a small application, vertical scaling may be simpler. For a high-traffic application, I'd generally design for horizontal scaling because it provides greater capacity and allows us to add or remove instances based on demand."

---

# Q3. What is a load balancer and why do we need one?

### Interview answer

> A load balancer distributes incoming requests across multiple backend servers or instances.

For example:

```text
                    Users
                      │
                      ▼
               ┌─────────────┐
               │Load Balancer│
               └──────┬──────┘
                ┌──────┼──────┐
                ↓      ↓      ↓
              API 1  API 2  API 3
```

It provides several benefits:

### 1. Traffic distribution

Prevents one server from receiving all requests.

### 2. Scalability

We can add more instances behind the load balancer.

### 3. Availability

If one instance becomes unhealthy, traffic can be routed to healthy instances.

### 4. Routing

Advanced load balancers can route based on:

- URL
- Host
- Headers
- Ports
- IP
- Other application-level information

### Good interview sentence

> "The load balancer provides a single entry point for clients while distributing traffic across healthy backend instances."

---

# Q4. What is the difference between Layer 4 and Layer 7 load balancing?

This is a common interview question.

### Layer 4 — Transport Layer

Layer 4 primarily operates using network/transport information such as:

- IP address
- TCP
- UDP
- Port

It doesn't need to understand the HTTP request in detail.

Conceptually:

```text
Client
  ↓
TCP
  ↓
L4 Load Balancer
  ↓
Server
```

### Layer 7 — Application Layer

Layer 7 understands application protocols such as HTTP/HTTPS.

It can make routing decisions based on:

```text
URL
HTTP method
Host
Headers
Cookies
```

For example:

```text
/api/products/*
        ↓
Product Service

/api/orders/*
        ↓
Order Service
```

### Comparison

| Layer 4 | Layer 7 |
|---|---|
| TCP/UDP level | HTTP/application level |
| Less application awareness | Application-aware |
| Generally simpler | More routing capabilities |
| IP/port based decisions | URL/header/host etc. |

### Interview answer

> "I'd use Layer 4 when I primarily need transport-level load balancing, while Layer 7 is useful when routing needs to understand HTTP-level information such as hostnames, paths, or headers."

---

# Q5. Explain Round Robin, Weighted Round Robin, Least Connections and IP Hash.

## 1. Round Robin

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

Simple and works well when servers have similar capacity and requests have reasonably similar cost.

---

## 2. Weighted Round Robin

Servers receive different amounts of traffic based on assigned weights.

```text
Server 1 → Weight 5
Server 2 → Weight 3
Server 3 → Weight 2
```

Server 1 receives more traffic.

Useful when:

```text
Server 1 = 16 CPU
Server 2 = 8 CPU
Server 3 = 4 CPU
```

---

## 3. Least Connections

The load balancer sends the next request to the server with the fewest active connections.

```text
Server 1 → 100 connections
Server 2 → 50 connections
Server 3 → 20 connections

New request
     ↓
Server 3
```

This can be useful when requests have varying processing times.

---

## 4. IP Hash

The client's IP is used to determine the backend server.

Conceptually:

```text
Client IP
   ↓
 Hash
   ↓
Server
```

This can provide a degree of client affinity.

However, it shouldn't be treated as a perfect session-management mechanism because clients can share IPs, change networks, or sit behind proxies/NAT.

### Interview summary

> "Round Robin is simple sequential distribution, Weighted Round Robin accounts for different server capacities, Least Connections considers current connection load, and IP Hash maps clients to servers based on their IP."

---

# Q6. What is a health check? Why is it important?

### Interview answer

> A health check is a mechanism used to determine whether an application instance or dependency is healthy and capable of serving traffic.

For example:

```http
GET /health
```

Healthy response:

```http
200 OK
```

If an instance repeatedly returns errors or times out:

```text
API 1 → Healthy
API 2 → Unhealthy
API 3 → Healthy
```

the load balancer can stop routing new traffic to API 2.

```text
             Load Balancer
             /           \
            ↓             ↓
         API 1           API 3
          ✅               ✅

         API 2
          ❌
       removed from
       traffic
```

### ASP.NET Core example

```csharp
builder.Services.AddHealthChecks();

app.MapHealthChecks("/health");
```

You can also add checks for dependencies such as databases.

### Important distinction

**Liveness:**

> Is the application process alive?

**Readiness:**

> Is the application ready to receive traffic?

For example, an application might be running but unable to connect to its required database. It may be alive but not ready to serve certain requests.

### Strong interview answer

> "I'd use health checks together with load balancing so unhealthy instances can be removed from traffic automatically."

---

# Q7. What is the difference between a stateful and stateless service?

### Stateless service

A stateless service doesn't depend on information stored only in the memory of a particular application instance to process the next request.

Example:

```text
Request 1
   ↓
API 1

Request 2
   ↓
API 2
```

Both servers can process the user's requests.

Shared state, when necessary, can be stored externally:

```text
API 1 ──┐
API 2 ──┼──→ Redis / Database
API 3 ──┘
```

### Stateful service

A stateful service maintains important state locally or is otherwise tied to a particular instance.

For example:

```text
User
 ↓
Server 1
 ↓
Session stored in Server 1 memory
```

If the next request goes to Server 2:

```text
User
 ↓
Server 2

❌ Session isn't available locally
```

### Key difference

> A stateless service doesn't require a particular server's local state to process a request, whereas a stateful service depends on stored state associated with the service or instance.

---

# Q8. Why are stateless services easier to scale horizontally?

This is a **very important interview question**.

### Interview answer

> Stateless services are easier to scale horizontally because any instance can handle any request without depending on session data stored in another instance's local memory.

Suppose we have:

```text
             Load Balancer
             /     |     \
            ↓      ↓      ↓
          API 1  API 2  API 3
```

If the APIs are stateless:

```text
Request A → API 1
Request B → API 3
Request C → API 2
Request D → API 1
```

No problem.

If traffic increases:

```text
             Load Balancer
          /    /    |    \    \
         ↓    ↓     ↓     ↓    ↓
       API1 API2  API3  API4  API5
```

we can simply add instances.

### In ASP.NET Core

A common architecture is:

```text
Client
  ↓
Load Balancer
  ↓
Multiple ASP.NET Core instances
  ↓
Redis / Database / Message Queue
```

Authentication using bearer tokens can also support this model because the API instances don't need to keep the user's primary authentication session in local memory.

### Strong sentence

> "Statelessness removes server affinity as a requirement, which makes horizontal scaling and failover much easier."

---

# Q9. What are sticky sessions? What are their advantages and disadvantages?

### Interview answer

Sticky sessions, also called **session affinity**, mean that the load balancer tries to send subsequent requests from the same client to the same backend instance.

Example:

```text
User A
  ↓
Load Balancer
  ↓
API 1
```

Future requests:

```text
User A → API 1
User A → API 1
User A → API 1
```

### Why use them?

They're useful when an application maintains session state locally on the server.

For example:

```text
API 1
 └── User session
```

Without affinity:

```text
Request 1 → API 1
Request 2 → API 2

API 2 doesn't have API 1's local session
```

### Advantages

- Can support legacy stateful applications
- Simple way to preserve local session affinity
- May reduce some external session-storage requirements

### Disadvantages

**1. Uneven load**

One server may receive more users than others.

**2. Reduced scalability**

Scaling becomes less flexible.

**3. Failure impact**

If the server containing a user's session fails, that session may be lost unless replicated elsewhere.

**4. Poorer elasticity**

Dynamic addition/removal of instances becomes more complicated.

### Preferred modern approach

Instead of:

```text
Sticky sessions
      ↓
Local server memory
```

we often prefer:

```text
Stateless APIs
      ↓
Shared external state
      ↓
Redis / Database
```

### Interview conclusion

> "Sticky sessions can be useful for legacy stateful applications, but for a modern horizontally scalable API, I'd generally prefer stateless services with shared external state."

---

# Q10. What is a Single Point of Failure? How would you avoid it?

### Interview answer

> A Single Point of Failure, or SPOF, is a component whose failure can cause the entire system or a critical part of the system to become unavailable.

Example:

```text
Users
  ↓
Single API Server
  ↓
Database
```

If that API server fails:

```text
API Server ❌

Entire application unavailable
```

That's a SPOF.

---

## Remove the API SPOF

Use multiple instances:

```text
              Load Balancer
             /      |      \
            ↓       ↓       ↓
          API 1   API 2   API 3
```

If API 2 fails:

```text
API 1 ✅
API 2 ❌
API 3 ✅
```

The other instances can continue serving requests.

---

## But there's another problem

What if we have:

```text
Users
  ↓
Single Load Balancer
  ↓
Multiple APIs
```

The load balancer itself can become a SPOF.

Therefore production architecture needs redundancy at critical infrastructure layers as appropriate.

Similarly, consider the database:

```text
Multiple APIs
      ↓
Single Database
```

If the database fails, the entire application may still fail.

We might introduce:

```text
Primary
   │
   ├── Replica 1
   └── Replica 2
```

and appropriate failover/recovery mechanisms.

### Important point

You don't simply eliminate SPOFs by adding servers everywhere.

You need to identify:

```text
Application
Load Balancer
Database
Cache
Message Broker
Network
Storage
```

and determine which failures the system must tolerate.

### Strong interview answer

> "I'd identify critical components that can bring down the system, then introduce redundancy, health checks, failover mechanisms, replication and appropriate recovery strategies. I'd also consider whether the added complexity is justified by the availability requirement."

That last sentence demonstrates **trade-off thinking**.

---

# 🔥 Day 2 Scenario — Interview Practice

Suppose the interviewer says:

> **"Your ASP.NET Core API is currently deployed on one Azure VM. Traffic has increased significantly. How would you redesign it?"**

A strong answer would be:

> "First, I'd determine the current bottleneck using metrics such as CPU, memory, request latency, throughput and database utilization. If the application tier is the bottleneck, I'd make the API stateless and deploy multiple instances behind a load balancer or appropriate Azure application-routing service. I'd configure health checks so unhealthy instances are removed from traffic and enable autoscaling based on demand. I'd move any instance-local session state to a shared store such as Redis or the database. I'd also check whether the database or other dependencies become the next bottleneck, because scaling the API layer alone won't solve a database bottleneck."

That's the kind of answer you should aim for.

---

# 🧠 Day 2 Final Revision

Memorize this architecture:

```text
                         INTERNET
                            │
                            ▼
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           API 1         API 2        API 3
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 Redis        Database
```

And these concepts:

| Concept | Remember |
|---|---|
| Vertical scaling | Bigger machine |
| Horizontal scaling | More machines |
| Load balancer | Distributes traffic |
| Round Robin | Sequential distribution |
| Least Connections | Fewest active connections |
| Health Check | Detect unhealthy instances |
| Stateless | Any instance can handle request |
| Sticky Session | Same client → same instance |
| SPOF | One failure can take down critical system |
| Redundancy | Multiple instances/components |

### ⭐ Most important lesson from Day 2

Don't think:

> **"More servers = scalable system."**

Think:

> **"Can I add/remove instances safely, distribute traffic, survive instance failures, and avoid relying on local state?"**

That's the foundation of **horizontal scalability**.
