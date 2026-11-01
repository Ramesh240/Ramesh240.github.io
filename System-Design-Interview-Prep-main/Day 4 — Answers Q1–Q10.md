# System Design Day 4 — Answers Q1–Q10

Today's focus is Caching and Redis, including caching patterns, TTL, cache invalidation, common caching problems, and ASP.NET Core implementation.

For interviews, focus on explaining why a solution works, what trade-offs it introduces, and when you'd use it.

## Q1. What is caching, and how does it improve system performance?

### Interview-ready answer

Caching is a technique that temporarily stores frequently accessed or expensive-to-compute data in a faster storage layer so that subsequent requests can retrieve it without repeating the original work.

For example, suppose an ASP.NET Core API retrieves product details from SQL Server. If thousands of users request the same product, querying SQL Server for every request creates unnecessary database load.

We can cache the product in Redis.

Client

ASP.NET Core API

Redis Cache

Hit: return cached data

Miss: query SQL Server

### Benefits

- Lower response latency.
- Reduced database CPU and query load.
- Higher throughput for repeated reads.
- Reduced repeated computation and external API calls.

### Example

Assume, illustratively, a database lookup takes 50 ms and a cache lookup takes 2 ms.

For repeated requests, a cache hit may avoid most of that database lookup time. Actual end-to-end latency depends on networking, serialization, application processing, and other factors.

Important: Caching doesn't automatically make every request faster. Cache misses, serialization, network calls, and invalidation overhead must also be considered.

Follow-up: Can caching replace a database?

No. In a typical application, the database remains the authoritative source of durable business data, while the cache stores temporary copies that can be rebuilt.

## Q2. What is Redis, and why is it commonly used as a cache?

### Interview-ready answer

Redis is an in-memory data store that supports low-latency access to data structures and is commonly used for caching, session storage, counters, and rate limiting.

For example, a product could be cached with the key:

```
Key:   product:100
Value: {"id":100,"name":"Keyboard","price":1500}
TTL:   300 seconds
```

The key identifies the cached value, and the TTL specifies its expiration time.

### Why Redis?

1. Fast access to frequently used data.
2. Shared access from multiple application instances.
3. Built-in expiration support.
4. Useful data structures such as strings, hashes, sets and sorted sets.
5. Supports additional patterns such as counters and distributed coordination, when configured appropriately.

### Redis vs SQL Server

| Redis                                      | SQL Server                              |
| ------------------------------------------ | --------------------------------------- |
| Commonly used for low-latency cache access | Relational database                     |
| Key-based access and data structures       | Rich SQL queries and joins              |
| TTL-based expiration is common             | Durable business records                |
| Persistence is configurable                | Designed for durable relational storage |

### Follow-up: Is Redis always faster?

Redis is optimized for low-latency data access, but real performance depends on network latency, data size, workload, configuration and database query efficiency.

Interview takeaway: Redis complements SQL Server; it doesn't automatically replace it.

## Q3. What is the difference between `IMemoryCache` and `IDistributedCache` in ASP.NET Core?

### Interview-ready answer

`IMemoryCache` stores cached objects in the memory of the application process. `IDistributedCache` provides an abstraction for caching through an external or distributed cache provider, such as Redis.

### IMemoryCache

```
builder.Services.AddMemoryCache();
```

Example:

```
_cache.Set(
    "product:100",
    product,
    TimeSpan.FromMinutes(5));
```

The data is local to that application instance.

### IDistributedCache

Register a distributed cache provider, then use methods such as:

```
await cache.SetStringAsync(
    "product:100",
    json,
    new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow =
            TimeSpan.FromMinutes(5)
    });
```

### Comparison

| Feature                | `IMemoryCache`                 | `IDistributedCache`                      |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| Storage                | Local process memory           | External/shared cache provider           |
| Multiple API instances | Separate caches                | Can share cached data                    |
| Access overhead        | Very low                       | Usually includes network overhead        |
| Data type              | Can store objects directly     | Interface exposes byte/string operations |
| Typical use            | Local, instance-specific cache | Shared cache across instances            |

### Scenario

Suppose your application runs on three servers.

With `IMemoryCache`:

```
API 1 → Cache A
API 2 → Cache B
API 3 → Cache C
```

These caches can contain different values.

With Redis-backed `IDistributedCache`:

```
API 1 ──┐
API 2 ──┼── Redis
API 3 ──┘
```

All three instances can access the same cached entries.

Important: `IDistributedCache` is only an abstraction. Registering `AddDistributedMemoryCache()` does not create a shared Redis cache; it uses in-process memory.

## Q4. Explain the cache-aside pattern with a real example.

### Interview-ready answer

Cache-aside, also called lazy loading, is a pattern where the application checks the cache first. If the requested value isn't present, it loads the data from the database, stores it in the cache, and returns it.

### Flow

1\. Request product 100

2\. Check Redis

Hit

Return cached value

Miss

Query SQL Server

3\. Cache database result with TTL

4\. Return product

### C# example

```
public async Task<Product?> GetProductAsync(int id)
{
    string key = $"product:{id}";

    var cached = await _cache.GetStringAsync(key);

    if (cached is not null)
    {
        return JsonSerializer.Deserialize<Product>(cached);
    }

    var product = await _dbContext.Products
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == id);

    if (product is not null)
    {
        await _cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(product),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow =
                    TimeSpan.FromMinutes(5)
            });
    }

    return product;
}
```

Here, `_cache` is an `IDistributedCache`, and `_dbContext` is an EF Core `DbContext`. The required namespaces and dependency registrations must be configured.

### Advantages

- Simple to implement.
- Only requested data gets cached.
- Works well for read-heavy APIs.

### Disadvantages

- The first request after a miss is slower.
- Cached values may become stale.
- Concurrent misses can cause multiple database queries.

Follow-up: What happens if Redis is unavailable?

The application needs an explicit failure strategy. For noncritical cache reads, it may fall back to SQL Server, subject to database capacity and timeout limits. For cache writes, it may log the error and continue if the database update has already succeeded. Don't allow a cache outage to trigger unlimited database traffic.

## Q5. What is the difference between cache-aside, write-through and write-behind caching?

### Interview-ready answer

These patterns describe how cache data and authoritative storage are updated.

### 1. Cache-aside

The application loads data into the cache when a read misses.

```
Read → Cache miss → Database → Cache
```

Best for: Read-heavy workloads with frequently reused data.

Trade-off: Cache misses add latency, and writes require a separate invalidation/update strategy.

### 2. Write-through

The write path updates the authoritative database and cache as part of the chosen write strategy.

```
Write → Database + Cache update
```

Best for: Workloads where keeping the cache fresh after successful writes is valuable.

Trade-off: More coordination and error handling are required. SQL Server and Redis do not automatically share one atomic transaction.

### 3. Write-behind

The cache accepts changes first, and the database is updated asynchronously later.

```
Write → Cache → Async persistence → Database
```

Best for: Carefully designed workloads such as aggregations and buffered events.

Trade-off: Changes may be lost before persistence unless the system has appropriate durability, retry and recovery mechanisms.

### Which would you choose for a typical .NET product API?

I'd usually start with cache-aside and invalidate the product cache after a successful database update.

It is straightforward and separates authoritative writes from cache population.

For payments, balances or inventory correctness, I would not rely on a cache write as proof that the business transaction has been durably committed.

## Q6. What is TTL, and how would you decide its value?

### Interview-ready answer

TTL, or Time To Live, specifies how long a cache entry remains valid before expiration.

For example:

```
Key: product:100
Value: Keyboard
TTL: 300 seconds
```

The entry expires after five minutes, unless its expiration is changed.

### How do you choose a TTL?

Consider:

1. How frequently the underlying data changes.
2. How stale the application can tolerate the data becoming.
3. How expensive a cache miss is.
4. Memory capacity and eviction policy.
5. Traffic patterns and cache-miss bursts.

| Data                             | Example strategy                             |
| -------------------------------- | -------------------------------------------- |
| Product catalogue                | Moderate TTL                                 |
| Inventory                        | Short TTL or explicit invalidation           |
| Static reference data            | Longer TTL                                   |
| Frequently changing user profile | TTL plus invalidation                        |
| Critical payment state           | Authoritative reads and correctness controls |

These are starting points, not fixed rules.

### Follow-up: What is the difference between absolute and sliding expiration?

- Absolute expiration: The entry expires at a fixed deadline.
- Sliding expiration: The expiry is extended when the entry is accessed, subject to the configured interval.

For example, with a 10-minute sliding expiration, a frequently accessed entry may remain cached as long as it continues to be accessed within each 10-minute window. It can still expire according to other configured limits.

Interview takeaway: TTL balances freshness, memory usage, and cache-hit rate.

## Q7. What is cache invalidation, and how would you keep Redis synchronized with SQL Server?

### Interview-ready answer

Cache invalidation is the process of removing or refreshing cached data when the cached value is no longer valid.

Suppose Redis stores:

```
product:100 → price = ₹1,500
```

The product price changes in SQL Server to ₹1,700. If Redis isn't updated or invalidated, the application may continue returning the old price.

### A common cache-aside approach

```
1. Update product in SQL Server
2. Commit the database transaction
3. Delete product:100 from Redis
4. Next read loads the updated value
```

Example:

```
await _dbContext.SaveChangesAsync();

await _cache.RemoveAsync($"product:{product.Id}");
```

This snippet assumes the database update has succeeded. It also assumes cache invalidation is best-effort; production code should handle failures and consider retry or reconciliation mechanisms.

### What if Redis deletion fails?

SQL Server may contain the new value while Redis still holds the old one.

Possible mitigations include:

- Shorter TTLs where appropriate.
- Retrying invalidation.
- Recording cache-invalidation events in a durable outbox.
- Processing those events asynchronously.
- Versioning or coordinated refresh mechanisms for stricter requirements.

An outbox can help prevent the invalidation event from being lost when the database transaction commits, but consumers still need retries and idempotent processing.

### Strong interview answer

> "I'd treat SQL Server as the source of truth. After a successful database update, I'd invalidate the corresponding Redis key. For stronger reliability, I'd consider a transactional outbox and background processing so cache invalidation can be retried if Redis is unavailable."

## Q8. What are cache stampede, cache penetration and cache avalanche?

### Interview-ready answer

These are three different problems that can cause cache effectiveness to degrade or database load to spike.

### Cache stampede

Many requests try to load the same missing or expired cache entry simultaneously.

Example: A popular product expires from Redis, and thousands of requests query SQL Server for that product at once.

Solutions: Request coalescing, single-flight loading, suitable locking and TTL jitter.

### Cache penetration

Requests repeatedly ask for records that don't exist, so they keep missing the cache and reaching the database.

Example: Thousands of requests for a nonexistent product ID.

Solutions: Validate requests, rate-limit abusive traffic and use short-lived negative caching when appropriate.

### Cache avalanche

Many cache entries expire or become unavailable around the same time, causing a surge of requests to the database.

Solutions: TTL jitter, staggered expiration, controlled cache warming and database capacity planning.

### Remember the difference

- Stampede: many requests compete to load the same key.
- Penetration: requests repeatedly target nonexistent data.
- Avalanche: many entries become unavailable together.

## Q9. How would you implement Redis caching in a horizontally scaled ASP.NET Core API?

### Interview-ready answer

I'd use a Redis-backed distributed cache so multiple ASP.NET Core instances can access the same cache.

The architecture would look like this:

Load Balancer

API 1

API 2

API 3

Redis — shared cache

SQL Server — source of truth

### Implementation approach

1. Register a Redis-backed `IDistributedCache` provider.
2. Use predictable, namespaced cache keys such as `product:100`.
3. Serialize values consistently.
4. Apply suitable expiration.
5. Use cache-aside for reads.
6. Invalidate affected entries after successful database updates.
7. Monitor cache hits, misses, latency, errors and evictions.
8. Define timeouts and a fallback strategy for cache outages.

### Example registration

For a Redis-backed provider such as `Microsoft.Extensions.Caching.StackExchangeRedis`, configuration can be registered using the package's supported extension methods and your deployment's Redis connection settings.

Conceptually:

```
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration =
        builder.Configuration.GetConnectionString("Redis");

    options.InstanceName = "MyApp:";
});
```

This requires the appropriate provider package and a valid Redis connection string. Keep credentials in secure configuration, not in source control.

### Follow-up: Why not use `IMemoryCache`?

With multiple instances, each local cache can contain different values. Redis gives the instances a shared cache, although invalidation and consistency still need to be designed correctly.

## Q10. Suppose your SQL Server is overloaded even though Redis is available. How would you investigate and fix the problem?

### Interview-ready answer

I'd first investigate why database requests remain high despite the cache.

Potential causes include:

- A low cache-hit ratio.
- Frequently expiring keys.
- Incorrect cache keys.
- Large numbers of unique requests.
- Cache stampedes.
- Cache bypasses in certain API paths.
- Expensive queries unrelated to cached data.
- Cache failures or timeouts causing fallback traffic.
- Heavy writes that caching cannot eliminate.

### Step 1: Measure

I'd examine:

```
Redis:
- Hit/miss ratio
- Latency
- Evictions
- Errors

SQL Server:
- CPU and I/O
- Expensive queries
- Wait statistics
- Connection usage
- Query execution plans

Application:
- Request volume
- Endpoint latency
- Cache errors
- Database calls per request
```

### Step 2: Identify the actual cause

If a frequently requested product is repeatedly missing from Redis, I would inspect key generation, TTLs and invalidation behavior.

If SQL Server is overloaded by writes, read caching may not solve the main problem.

### Step 3: Apply the appropriate fix

| Cause               | Potential solution                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Low cache-hit rate  | Review key design, TTL and caching eligibility                                                        |
| Expensive reads     | Optimize queries and indexes                                                                          |
| Cache stampede      | Request coalescing, single-flight and TTL jitter                                                      |
| Heavy read traffic  | Cache suitable data or add read replicas                                                              |
| Heavy write traffic | Optimize write paths and transactions; consider partitioning or other scaling strategies if justified |
| Redis outages       | Improve monitoring, timeouts and controlled fallback behavior                                         |

### Strong interview response

> "I'd measure Redis hit rates and latency alongside SQL Server query performance. If caching isn't working as expected, I'd investigate key design, TTLs, invalidation and stampedes. I'd optimize expensive queries and cache suitable read-heavy data. If writes are the bottleneck, I'd optimize the write path rather than assuming Redis will solve it. I'd also design controlled fallback behavior so a Redis outage doesn't overwhelm SQL Server."

# Day 4 — Final Revision

| Concept             | One-line answer                                                      |
| ------------------- | -------------------------------------------------------------------- |
| Caching             | Stores reusable data for faster access                               |
| Redis               | In-memory data store commonly used as a shared cache                 |
| `IMemoryCache`      | Local, per-process cache                                             |
| `IDistributedCache` | Abstraction for shared/distributed cache providers                   |
| Cache-aside         | Read cache first; load from database on miss                         |
| Write-through       | Update authoritative storage and cache as part of the write strategy |
| Write-behind        | Persist cached changes asynchronously                                |
| TTL                 | Expiration time for cached data                                      |
| Cache invalidation  | Remove or refresh stale cached entries                               |
| Stampede            | Many requests load the same missing key                              |
| Penetration         | Repeated requests for nonexistent keys                               |
| Avalanche           | Many entries expire or disappear together                            |

## What you should be able to explain without notes

- Why Redis helps a read-heavy .NET API.
- Why cache-aside is a good starting strategy.
- Why cache invalidation is difficult.
- How TTL affects freshness and database load.
- How to handle Redis outages safely.
- Why caching isn't a substitute for database optimization.

Next: Day 5 — Message Queues and Asynchronous Processing. We'll cover RabbitMQ, Azure Service Bus, Kafka, producer/consumer architecture, decoupling, retries, dead-letter queues, idempotency and how to use background processing in .NET.
