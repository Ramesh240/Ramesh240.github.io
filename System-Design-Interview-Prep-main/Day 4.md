# System Design Interview Preparation — Day 4

# Caching & Redis

Day 4 · HLD · .NET / Azure · Interview practice

Today we'll learn one of the most useful techniques for improving system performance: caching.

In Day 3, we learned that databases can become bottlenecks even when the application layer is horizontally scaled. Caching helps reduce repeated database work and improve response times.

By the end of this lesson, you should be able to explain caching strategies in an interview and implement basic Redis caching in ASP.NET Core.

## 1. What is caching?

Caching is the process of temporarily storing frequently accessed data in a location where it can be retrieved faster than from its original source.

Imagine an e-commerce API:

```
GET /api/products/100
```

Without caching:

Client

ASP.NET Core API

SQL Server

Every request that needs the product queries the database.

With caching:

Client

ASP.NET Core API

Redis Cache

Hit? Return cached data

Only on cache miss

SQL Server

If the product is already cached, the API can return it without querying SQL Server.

### Why do we use caching?

- Reduce database load.
- Reduce response latency.
- Improve throughput.
- Handle repeated reads efficiently.
- Reduce the cost of expensive computations or external API calls.

Interview definition:

> Caching is a technique that stores frequently accessed or expensive-to-compute data in a faster storage layer, reducing repeated work on the original data source.

## 2. What is Redis?

Redis is an in-memory data store commonly used for caching, session storage, counters, rate limiting, and other low-latency data access patterns.

Example:

```
Key: product:100
Value: {"id":100,"name":"Keyboard","price":1500}
TTL: 300 seconds
```

Here, TTL means time to live. The entry expires after five minutes unless its expiration is changed.

### Why is Redis fast?

Redis keeps frequently accessed data in memory, avoiding many of the disk operations and query-processing costs associated with retrieving the same data from a traditional database.

However, Redis isn't a replacement for every database. SQL Server may remain the authoritative source for durable product and order data.

### Redis vs SQL Server

| Redis                             | SQL Server                                 |
| --------------------------------- | ------------------------------------------ |
| Primarily in-memory access        | Database with durable storage              |
| Very low-latency key-based access | Rich relational queries                    |
| Commonly used as a cache          | Commonly used as the source of truth       |
| Supports expiration policies      | Data retention usually managed differently |
| Data persistence is configurable  | Designed for durable relational data       |

Redis can be configured for persistence and replication, but for our typical caching design, SQL Server remains the source of truth.

## 3. Types of caching

There are several locations where caching can happen.

[DDR5 vs DDR4 in 2025: Is It Time To Upgrade Your RAM? | Tom's Hardware](https://images.openai.com/static-rsc-4/HCUvR5t1j8Pzmmi0Tsv-UdLkMgtoxjabIxpFU_xhPYkjz-Q0CDkyUpVdgYcyhomeDFU7JH6F1ri0QzW9qpat8d3qBG3MNy09TRxNUMfEDgPCP-Rg5n15np87bGejno9v2ZATQlU4hqzbAAKoGc5DANc4YlUpAcQnzS5G5R77zN0?purpose=inline)

1\. In-memory application cache

Data is stored in the memory of an individual application instance.

Example: ASP.NET Core `IMemoryCache`.

Best for local, frequently accessed data. Each instance has its own cache, so entries aren't automatically shared.

[A Look Inside the Rackspace Open Compute Cloud | Data Center Frontier](https://images.openai.com/static-rsc-4/JWD0eSO3t9mrKfl5qvVfE7pJ1lph50eBbHWEbZia0dViUTkQAPq2cRwU5yNbJ1ocKfOkgA-PLsgOebrZIdy68LDDC2W3BrxcFRSTjKgA0ZDbLb2QCM7pzdPm0PVNDdHXCSglBLRXiGNv44YSCDjWEkFeD_9zL1ueqUhkQlC3eyI?purpose=inline)

2\. Distributed cache

Data is stored outside individual application instances and can be shared across them.

Example: Redis.

Useful when an application runs across multiple servers or containers.

[Dhanian 🗯️ (@e_opore) on X](https://images.openai.com/static-rsc-4/miIg3toSc0LxqUojYbjIRL36XUWSfVTUxzThQEZ159CbZJKPZOGUiyuTgTiviDkobE5LYQvE0NGWGfjqUfE95piBAw9vPycUpj710dTVaKDjehXP4xi70LKn3DMfFzF6Asb80ZBWKyO1ltVLDrWM6Sfk4ufRlFdXe9rF4PM97Zs?purpose=inline)

3\. Browser or CDN cache

Static assets and eligible HTTP responses can be cached closer to users.

Examples: images, JavaScript bundles, CSS files.

Useful for reducing origin-server requests and improving delivery speed.

### Interview question: IMemoryCache vs Redis?

IMemoryCache is local to an application process. It's simple and has very low access overhead, but different instances can hold different values.

Redis provides a shared cache that multiple application instances can access. It introduces network and operational overhead but helps coordinate cached data across instances.

## 4. Cache-aside pattern

This is the most important caching pattern for today's lesson.

Cache-aside is also called lazy loading.

The application checks the cache first. If the value is missing, it fetches the data from the database and stores it in the cache.

### Read flow

1\. Client requests product

2\. API checks Redis

Cache hit

Return cached product

Cache miss

Query SQL Server

3\. Store result in Redis with a TTL

4\. Return response

### Example

First request:

```
GET product:100
    ↓
Redis: MISS
    ↓
SQL Server: Fetch product
    ↓
Redis: Store product
    ↓
Return product
```

Second request:

```
GET product:100
    ↓
Redis: HIT
    ↓
Return product
```

The second request avoids the SQL query.

### Why is cache-aside popular?

- Simple to implement.
- Data is cached only when requested.
- Works well with existing database-backed applications.
- The application controls cache population and invalidation.

Trade-off: The first request after a cache miss is slower, and cached data can become stale if updates aren't handled correctly.

## 5. Write-through caching

In a write-through design, the application updates the authoritative data store and the cache as part of its write strategy.

Conceptually:

```
Client
  ↓
Application
  ├── Update database
  └── Update cache
```

The objective is to keep the cache up to date when data is written.

### Example

A product price changes from ₹1,500 to ₹1,700.

```
Update Product
      ↓
SQL Server: ₹1,700
      ↓
Cache: ₹1,700
```

The exact ordering and failure-handling semantics depend on the implementation.

### Advantage

Cached data can be available immediately after successful writes.

### Disadvantage

The write path becomes more complicated. SQL Server and Redis don't automatically participate in one atomic transaction, so a failure between the two updates can leave them inconsistent.

For many web APIs, cache-aside with deliberate invalidation is a simpler starting point.

## 6. Write-behind caching

Write-behind, also called write-back caching, initially updates the cache and defers writing changes to the authoritative database.

```
Client
  ↓
Application
  ↓
Cache
  ↓
Asynchronous persistence
  ↓
Database
```

### Example

Suppose an application collects high-volume activity counters.

Instead of immediately writing every increment to SQL Server, it aggregates updates and periodically persists them.

### Advantages

- Can reduce database write volume.
- Can improve write throughput for suitable workloads.
- Useful for aggregations and buffered events when designed carefully.

### Disadvantages

- Data can be lost if the cache fails before persistence.
- Recovery and retry logic are required.
- Durability and ordering become more complicated.

Interview warning: Avoid casually using write-behind for payments, bank balances, or other critical transactions unless you have a robust durability and recovery design.

### Pattern comparison

| Pattern       | Main idea                           | Typical trade-off                                |
| ------------- | ----------------------------------- | ------------------------------------------------ |
| Cache-aside   | Load on cache miss                  | Simple, but misses add latency                   |
| Write-through | Update database and cache on writes | Better freshness, more coordination              |
| Write-behind  | Persist cache updates later         | Higher write throughput, greater durability risk |

## 7. Cache expiration and TTL

TTL stands for Time To Live.

It determines how long a cache entry remains valid before it expires.

For example:

```
Key: product:100
TTL: 5 minutes
```

After five minutes, the entry expires according to the cache's expiration behavior.

### How should we choose TTL?

It depends on the data.

| Data                          | Possible starting point                                |
| ----------------------------- | ------------------------------------------------------ |
| Product catalogue             | Minutes                                                |
| Frequently changing inventory | Short TTL or explicit invalidation                     |
| User profile                  | Minutes, with invalidation on updates                  |
| Static reference data         | Longer TTL                                             |
| Financial transaction status  | Stronger correctness strategy; don't rely on TTL alone |

These are examples, not universal settings.

### Why not use a very long TTL for everything?

Because stale values may remain visible after the authoritative data changes.

### Why not use a very short TTL?

Because entries expire too frequently, leading to more cache misses and increased database load.

Interview takeaway: TTL is a trade-off between freshness and cache efficiency.

## 8. Cache invalidation

Cache invalidation means removing or refreshing cached data when it is no longer valid.

Suppose:

```
SQL Server:
Product price = ₹1,500

Redis:
Product price = ₹1,500
```

A user updates the price:

```
SQL Server:
Product price = ₹1,700
```

But Redis still contains ₹1,500.

The API could return stale data.

### Strategy 1: Delete the cache entry after a successful database update

```
1. Update SQL Server
2. Commit database transaction
3. Delete product:100 from Redis
4. Next read repopulates the cache
```

This is a common cache-aside strategy.

### Strategy 2: Update the cache

After a successful database write, replace the cached value with the new value.

This can work, but the application must handle failures between the database and cache updates.

### Strategy 3: TTL-based expiration

Let the entry expire after a limited time.

This limits how long stale data may remain, but doesn't guarantee immediate freshness.

### Important race condition

Even deleting the cache after a write isn't enough to prevent every stale-write race.

For example:

1. Request A reads the old database value after a cache miss.
2. Request B updates the database and invalidates the cache.
3. Request A writes its previously read value into Redis.

The old value may reappear in the cache.

For systems with stricter freshness requirements, consider versioning, coordinated invalidation, or other concurrency-control techniques.

## 9. Cache stampede, penetration and avalanche

These are common system-design interview follow-ups.

### A. Cache stampede

A popular cache entry expires, and many concurrent requests all query the database for the same data.

10,000 simultaneous requests

Cache miss

Many database queries

Solutions: request coalescing, single-flight loading, short-lived locks where appropriate, and TTL jitter.

### B. Cache penetration

Requests repeatedly query keys that don't exist in the database, so every request misses the cache.

Example:

```
GET product:999999
```

Solutions: validate inputs, rate-limit abusive traffic, and consider short-lived negative caching for confirmed missing records.

### C. Cache avalanche

Many cache entries expire at roughly the same time, producing a sudden surge of database requests.

Solutions: add randomized TTL jitter, spread expiration times, and ensure the database can tolerate cache-miss traffic.

### Quick memory trick

- Stampede: Many requests load the same missing or expired key.
- Penetration: Many requests use keys that don't exist.
- Avalanche: Many entries expire together.

## 10. Implement caching in ASP.NET Core

Let's connect today's concepts to your current .NET learning.

ASP.NET Core provides `IMemoryCache` for local caching and `IDistributedCache` as an abstraction for distributed caching providers.

### Option A: In-memory cache

Register the cache:

```
builder.Services.AddMemoryCache();
```

Use it in a service:

```
using Microsoft.Extensions.Caching.Memory;

public class ProductService
{
    private readonly IMemoryCache _cache;

    public ProductService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public async Task<Product?> GetProductAsync(int id)
    {
        string key = $"product:{id}";

        if (_cache.TryGetValue(key, out Product? cached))
        {
            return cached;
        }

        Product? product = await LoadProductFromDatabaseAsync(id);

        if (product is not null)
        {
            _cache.Set(
                key,
                product,
                TimeSpan.FromMinutes(5));
        }

        return product;
    }

    private Task<Product?> LoadProductFromDatabaseAsync(int id)
    {
        // Replace this with your EF Core query.
        throw new NotImplementedException();
    }
}
```

This demonstrates the cache-aside flow. The database method is intentionally left for you to implement.

Limitation: Each API instance has its own memory cache. If you deploy three instances, their cached values can differ.

### Option B: Distributed cache

With Redis, multiple application instances can share cached values.

Conceptually:

```
API Instance 1 ──┐
API Instance 2 ──┼── Redis
API Instance 3 ──┘
```

Register an appropriate Redis-backed `IDistributedCache` provider using your deployment's connection configuration. Then use `GetStringAsync`, `SetStringAsync`, and related methods.

Example using `IDistributedCache`:

```
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

public class ProductCacheService
{
    private readonly IDistributedCache _cache;

    public ProductCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<Product?> GetCachedProductAsync(int id)
    {
        string key = $"product:{id}";

        string? json = await _cache.GetStringAsync(key);

        if (json is null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<Product>(json);
    }

    public async Task CacheProductAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        string key = $"product:{product.Id}";

        string json = JsonSerializer.Serialize(product);

        await _cache.SetStringAsync(
            key,
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow =
                    TimeSpan.FromMinutes(5)
            },
            cancellationToken);
    }
}
```

This example focuses on cache access. In a production cache-aside implementation, the service would also fetch from SQL Server on a cache miss, handle serialization and cache failures, and invalidate the key after relevant database updates.

Important: `IDistributedCache` is an abstraction. To use Redis, you must register a Redis-backed implementation; registering `AddDistributedMemoryCache()` alone does not create a shared Redis cache.

# Day 4 — Interview Questions Q1–Q10

Try answering these yourself first, just as we do in DSA and SQL.

1. What is caching, and how does it improve system performance?
2. What is Redis, and why is it commonly used as a cache?
3. What is the difference between `IMemoryCache` and `IDistributedCache` in ASP.NET Core?
4. Explain the cache-aside pattern with a real example.
5. What is the difference between cache-aside, write-through, and write-behind caching?
6. What is TTL, and how would you decide its value?
7. What is cache invalidation, and how would you keep Redis synchronized with SQL Server?
8. What are cache stampede, cache penetration, and cache avalanche?
9. How would you implement Redis caching in a horizontally scaled ASP.NET Core API?
10. Suppose your SQL Server is overloaded even though Redis is available. How would you investigate and fix the problem?

## Day 4 revision checklist

### Practice tracker

0 of 6

Explain cache-aside without notes

Compare IMemoryCache and Redis

Explain the three caching patterns

Explain TTL and invalidation

Differentiate stampede, penetration and avalanche

Describe cache-aside implementation in ASP.NET Core
