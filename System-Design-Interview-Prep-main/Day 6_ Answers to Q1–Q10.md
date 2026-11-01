# System Design — Day 6: Answers to Q1–Q10

These are detailed, interview-ready answers focused on REST API design, pagination, rate limiting, versioning, and ASP.NET Core implementation.

## Q1. What are the key principles of REST, and what does statelessness mean?

REST (Representational State Transfer) is an architectural style for designing APIs around resources and standard HTTP semantics.

### Key principles

1. Client-server separation: The client handles the user interface; the server handles data and business logic.
2. Stateless communication: Each request contains the information needed to process it. The server does not rely on session state from a previous request.
3. Cacheability: Responses indicate whether they can be cached and under what conditions.
4. Uniform interface: Resources are identified by URLs and manipulated using consistent representations and HTTP methods.
5. Layered system: Clients may communicate through gateways, proxies, or load balancers without needing to know the complete architecture.
6. Code on demand: An optional constraint that allows servers to send executable code to clients.

### Example

```
GET /api/products/101
Authorization: Bearer <token>
```

The API receives the product ID and authentication credentials in the request. It does not need to remember which server instance handled the user's previous request.

### Why is statelessness useful?

Suppose an application runs three API instances behind a load balancer:

```
             Load Balancer
             /     |     \
          API 1  API 2  API 3
```

A user's first request might reach API 1 and the next request API 3. If requests are independently authenticated and the application doesn't rely on in-memory session state, any healthy instance can process them.

This improves horizontal scalability and simplifies failover.

Important distinction: Statelessness does not mean that the application has no state. Orders and user information can still be stored in SQL Server or another database. It means that each request does not depend on conversational state retained by a particular server instance.

Interview answer: “REST is a resource-oriented architectural style using standard HTTP semantics. Statelessness means every request contains the information required for processing, making it easier to scale APIs horizontally behind a load balancer.”

## Q2. Explain GET, POST, PUT, PATCH, and DELETE. Which are idempotent?

These are HTTP methods that express the intended operation on a resource.

| Method | Purpose                                                           | Idempotent?              |
| ------ | ----------------------------------------------------------------- | ------------------------ |
| GET    | Retrieve a resource                                               | Yes                      |
| POST   | Create a resource or submit an operation                          | Not guaranteed           |
| PUT    | Create or replace a resource at a known URI, depending on the API | Yes                      |
| PATCH  | Partially modify a resource                                       | Depends on the operation |
| DELETE | Delete a resource                                                 | Yes, by intended effect  |

### GET

```
GET /api/products/101
```

Returns a product without changing its business state.

### POST

```
POST /api/products
Content-Type: application/json

{
  "name": "Keyboard",
  "price": 1500
}
```

Creates a product. Repeating the request may create duplicates unless the API implements deduplication or an idempotency mechanism.

### PUT

```
PUT /api/products/101
Content-Type: application/json

{
  "name": "Mechanical Keyboard",
  "price": 2500
}
```

Replaces the resource representation. Repeating the same request should leave the resource in the same state.

### PATCH

```
PATCH /api/products/101
Content-Type: application/merge-patch+json

{
  "price": 2700
}
```

Updates part of a resource. Setting a price to `2700` repeatedly is idempotent in its intended effect. An operation such as “increment price by 100” is not idempotent if repeated.

### DELETE

```
DELETE /api/products/101
```

The intended effect is to delete the product. A subsequent request might return `404 Not Found` rather than the original success status, but the resource remains deleted.

### Why does idempotency matter in distributed systems?

Network failures create uncertainty. A client might send a request, the server might complete it, and the response might get lost. The client then retries.

For order creation or payments, use an idempotency key or equivalent deduplication mechanism so retries do not create duplicate business effects.

Interview answer: “GET, PUT, and DELETE are defined as idempotent methods. POST is not guaranteed to be idempotent, and PATCH depends on the patch operation. Idempotency is especially important when clients retry requests after timeouts.”

## Q3. When should an API return 200, 201, 202, 204, 400, 401, 403, 409, and 429?

| Status                  | Meaning                                                                     | Example                                                |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `200 OK`                | Request succeeded with a response                                           | Product retrieved                                      |
| `201 Created`           | A resource was created                                                      | New product saved                                      |
| `202 Accepted`          | Request accepted for processing, but processing is not necessarily complete | Report generation queued                               |
| `204 No Content`        | Request succeeded with no response body                                     | Product deleted                                        |
| `400 Bad Request`       | Request is invalid                                                          | Invalid query parameters                               |
| `401 Unauthorized`      | Authentication is missing or invalid                                        | Invalid access token                                   |
| `403 Forbidden`         | Caller is authenticated but lacks permission                                | User attempts an unauthorized administrative operation |
| `409 Conflict`          | Request conflicts with current resource state                               | Duplicate unique order reference                       |
| `429 Too Many Requests` | Rate limit exceeded                                                         | Client exceeds its request quota                       |

### ASP.NET Core example

```
[HttpPost]
public async Task<IActionResult> Create(
    CreateProductDto request,
    CancellationToken cancellationToken)
{
    if (!ModelState.IsValid)
        return ValidationProblem(ModelState);

    var product = await _productService.CreateAsync(
        request, cancellationToken);

    return CreatedAtAction(
        nameof(GetById),
        new { id = product.Id },
        product);
}
```

This returns `201 Created` and a `Location` header pointing to the newly created resource, assuming the `GetById` action is correctly configured.

For validation, ASP.NET Core controllers using `[ApiController]` can automatically return a `400 Bad Request` when model validation fails.

### Two important distinctions

- 401 vs. 403: `401` means valid authentication has not been established; `403` means the authenticated caller is not allowed to perform the operation.
- 201 vs. 202: `201` means the resource has been created. `202` means the request has been accepted for processing, which may still be underway.

For a queued order-processing API, returning `201` after persisting the order can be appropriate even if fulfillment is pending. Returning `202` can be appropriate when the API accepts a job for later execution and exposes a way to check its status.

Interview answer: “I choose status codes based on the API contract and the actual processing state. I use consistent validation and error responses, and I never expose internal exception details in production responses.”

## Q4. What is the difference between offset pagination and cursor pagination?

Pagination prevents an API from returning an excessively large result set in one request.

### Offset pagination

Example:

```
GET /api/products?page=4&pageSize=20
```

For one-based page numbers:

\\[ \text{offset}=(\text{page}-1)\times\text{pageSize} \\]

Page 4 with a page size of 20 means skipping 60 rows and returning the next 20.

ASP.NET Core with EF Core:

```
var page = Math.Max(1, requestedPage);
var pageSize = Math.Clamp(requestedPageSize, 1, 100);

var products = await db.Products
    .AsNoTracking()
    .OrderBy(p => p.Id)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync(cancellationToken);
```

Advantages:

- Easy to implement.
- Supports jumping to a particular page.
- Suitable for admin tables and smaller datasets.

Disadvantages:

- Large offsets can be expensive.
- Inserts or deletes between requests can cause records to be repeated or skipped.

### Cursor pagination

Example:

```
GET /api/products?afterId=500&pageSize=20
```

```
var pageSize = Math.Clamp(requestedPageSize, 1, 100);

var products = await db.Products
    .AsNoTracking()
    .Where(p => p.Id > afterId)
    .OrderBy(p => p.Id)
    .Take(pageSize)
    .ToListAsync(cancellationToken);
```

This example assumes IDs are unique and increasing. Production cursor pagination often returns an opaque cursor based on the last item's sort values.

Advantages:

- Efficient for large datasets when supported by an appropriate index.
- Works well for feeds and continuously changing collections.
- Avoids scanning a large number of skipped rows.

Disadvantages:

- Directly jumping to page 100 is difficult.
- Cursor construction and validation require more care.

### Comparison

| Factor         | Offset                       | Cursor                             |
| -------------- | ---------------------------- | ---------------------------------- |
| Simplicity     | Easier                       | More complex                       |
| Large datasets | Can be slow at large offsets | Often more efficient               |
| Jump to page   | Supported                    | Usually not                        |
| Changing data  | More susceptible to shifts   | More stable with a suitable cursor |
| Best use       | Admin grids                  | Feeds, activity logs, large APIs   |

Interview answer: “I use offset pagination when users need numbered pages and the dataset is manageable. For large datasets or feeds, I prefer cursor pagination using indexed, deterministic sort keys.”

## Q5. How would you design filtering, sorting, and pagination for a product API with millions of rows?

I would design the endpoint so clients can retrieve only the records they need, while the database performs filtering, sorting, and pagination.

### Example API request

```
GET /api/v1/products?category=electronics&minPrice=500&maxPrice=5000&sortBy=price&sortDirection=asc&pageSize=20
```

### Step 1: Define a query DTO

```
public sealed class ProductQuery
{
    public string? Category { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string SortBy { get; init; } = "id";
    public string SortDirection { get; init; } = "asc";
    public int PageSize { get; init; } = 20;
}
```

Validate inputs, including price ranges and allowed sort fields. Clamp or reject excessive page sizes according to the API contract.

### Step 2: Build the database query

```
IQueryable<Product> query = db.Products.AsNoTracking();

if (!string.IsNullOrWhiteSpace(request.Category))
{
    query = query.Where(p => p.Category == request.Category);
}

if (request.MinPrice.HasValue)
{
    query = query.Where(
        p => p.Price >= request.MinPrice.Value);
}

if (request.MaxPrice.HasValue)
{
    query = query.Where(
        p => p.Price <= request.MaxPrice.Value);
}

query = request.SortBy.ToLowerInvariant() switch
{
    "price" => request.SortDirection == "desc"
        ? query.OrderByDescending(p => p.Price)
                .ThenByDescending(p => p.Id)
        : query.OrderBy(p => p.Price)
                .ThenBy(p => p.Id),

    _ => query.OrderBy(p => p.Id)
};

var pageSize = Math.Clamp(request.PageSize, 1, 100);

var products = await query
    .Take(pageSize)
    .Select(p => new ProductDto(
        p.Id, p.Name, p.Price))
    .ToListAsync(cancellationToken);
```

This illustrates server-side filtering, sorting, projection, and a bounded result size. A real endpoint would also implement the chosen pagination contract—offset or cursor—and validate `SortDirection` explicitly rather than silently treating all unknown values as ascending.

### Step 3: Optimize the database

For millions of rows:

- Add indexes aligned with common filtering and ordering patterns.
- Use `AsNoTracking()` for read-only EF Core queries.
- Project only the required columns.
- Avoid loading all records into memory before filtering.
- Use cursor pagination for deep traversal where appropriate.
- Check actual query plans and database metrics before adding indexes.
- Consider caching frequently requested, relatively stable results.

### Step 4: Return a consistent response

For offset pagination, a response might look like:

```
{
  "items": [
    {
      "id": 101,
      "name": "Keyboard",
      "price": 1500
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1250
}
```

`totalCount` can be expensive for very large or complex filtered queries. Include it when the product requirement justifies the cost; cursor-based APIs often omit it.

Interview answer: “I would validate the query parameters, apply filters and ordering in SQL, use a bounded page size, project only required fields, and create indexes based on real query patterns. For deep pagination, I would consider cursor-based pagination and avoid expensive counts unless required.”

## Q6. Compare fixed-window, sliding-window, token-bucket, and concurrency rate limiters.

Rate limiting protects an API from excessive traffic and helps preserve capacity for legitimate requests.

### 1. Fixed-window limiter

Allows a fixed number of requests during each time window.

Example: 100 requests per minute.

If a client sends 100 requests just before a minute ends and another 100 just after the next window starts, it can send 200 requests within a short period.

Best for: Simple quotas and straightforward policies.

### 2. Sliding-window limiter

Tracks requests across a rolling time interval or estimates usage using adjacent windows.

It reduces the fixed-window boundary problem.

Best for: More consistent request-rate limits.

### 3. Token-bucket limiter

Tokens replenish at a configured rate up to a maximum capacity. Each request consumes a token.

For example, a bucket may hold 20 tokens and replenish at 5 tokens per second. A client can make a burst of up to 20 requests when the bucket is full, while sustained traffic is constrained by the refill rate.

Best for: APIs that need to permit controlled bursts.

### 4. Concurrency limiter

Limits the number of requests executing simultaneously, regardless of the number of requests received over a particular time window.

For example, an API might allow at most 50 concurrent report-generation requests.

Best for: Protecting expensive database queries, CPU-heavy operations, or constrained downstream services.

| Algorithm      | Limits                           | Allows bursts?             | Main benefit                 |
| -------------- | -------------------------------- | -------------------------- | ---------------------------- |
| Fixed window   | Requests per fixed interval      | Yes, near boundaries       | Simplicity                   |
| Sliding window | Requests over a rolling interval | More controlled            | Smoother rate enforcement    |
| Token bucket   | Average rate plus burst capacity | Yes, bounded               | Flexible traffic shaping     |
| Concurrency    | Simultaneous operations          | Depends on available slots | Protects processing capacity |

### Which would I choose?

For a general public API, I might use a token bucket or sliding-window policy. For expensive operations, I would also consider a concurrency limiter. The right choice depends on whether the goal is to limit request frequency, bursts, or simultaneous work.

Interview answer: “A request-rate limiter controls how frequently a client calls an API, while a concurrency limiter controls how many requests execute simultaneously. I choose the algorithm based on the traffic pattern and the resource being protected.”

## Q7. How would you implement per-user rate limiting in a horizontally scaled ASP.NET Core API?

First, I would identify the caller reliably, then apply a rate-limit policy based on that identity.

### Step 1: Define the policy

For example:

- Authenticated users: 100 requests per minute each.
- Expensive report endpoints: a stricter policy.
- Unauthenticated endpoints: a separate policy, possibly keyed by client IP.

The exact limits should come from capacity testing and business requirements.

### Step 2: Configure a partitioned rate limiter

ASP.NET Core supports partitioned rate limiting through `AddPolicy` and `RateLimitPartition`.

```
using System.Security.Claims;
using System.Threading.RateLimiting;

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddPolicy("PerUser", httpContext =>
    {
        var userId = httpContext.User
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var partitionKey = userId ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});
```

Register the middleware after routing and before mapping endpoints:

```
app.UseRouting();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers()
   .RequireRateLimiting("PerUser");
```

This is a simplified example. In a production application, anonymous users should not all share one partition if that would cause them to interfere with each other. Use a suitable fallback identity, and validate authentication and identity extraction.

### The horizontal-scaling problem

Suppose there are three API instances:

```
              Load Balancer
              /     |     \
           API 1  API 2  API 3
```

If each instance independently allows 100 requests per minute for a user, the user might effectively receive up to 300 requests per minute across all three instances.

The built-in in-process limiter does not automatically share counters between instances.

### Production solutions

1. Gateway-level rate limiting: Enforce shared policies at an API gateway when its features meet the requirements.
2. Distributed rate limiter: Use a shared store or a purpose-built distributed limiting service when accurate cross-instance quotas are needed.
3. Per-instance limits: Use them when approximate aggregate enforcement is acceptable and the policy accounts for instance count.
4. Separate policies by endpoint: Apply stricter quotas to expensive or abuse-prone operations.

Also, do not trust a caller-supplied user ID or arbitrary `X-Forwarded-For` header as the identity. Authenticate users and configure trusted proxies correctly.

Interview answer: “I would partition requests by authenticated user or tenant and apply a suitable policy. For horizontally scaled deployments, I would enforce shared quotas at a gateway or use distributed coordination if a strict global limit is required.”

## Q8. What is API versioning? Compare URL, query-string, and header-based versioning.

API versioning lets an API evolve while supporting existing clients that depend on older contracts.

### URL path versioning

```
GET /api/v1/products
GET /api/v2/products
```

Advantages: Explicit, easy to discover, and straightforward to route.

Trade-off: The version appears in the URL.

### Query-string versioning

```
GET /api/products?api-version=1.0
```

Advantages: The resource path stays unchanged.

Trade-off: The version is less visible in the route and must be handled consistently in routing and documentation.

### Header-based versioning

```
GET /api/products
X-API-Version: 2
```

Advantages: Keeps the URL clean.

Trade-off: The version is less visible when inspecting a URL alone. Caching and diagnostics must account for the header when responses differ by version.

A related approach is media-type versioning, using a versioned `Accept` header.

### How do I choose?

For a straightforward REST API, URL versioning is often easiest for clients and operations teams to understand. Query-string or header-based versioning can be suitable when it better fits the organization's API conventions.

### Implementing versioning in ASP.NET Core

One approach is explicit route templates:

```
[ApiController]
[Route("api/v1/products")]
public sealed class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new[]
        {
            new { Id = 101, Name = "Keyboard" }
        });
    }
}
```

A separate controller or endpoint can expose `/api/v2/products` with the newer contract.

For larger APIs, a versioning library can help with version selection, API Explorer integration, and OpenAPI documentation. The configuration depends on the library and versioning method.

Interview answer: “API versioning lets clients migrate without breaking existing integrations. I choose a clear versioning convention, keep each contract stable, document deprecation, and measure old-version usage before retirement.”

## Q9. How do you evolve an API without breaking existing consumers?

The key principle is backward compatibility: existing clients should continue to work when a new API release is deployed, unless a deliberate breaking change is being introduced through a migration plan.

### Example

Version 1 response:

```
{
  "id": 101,
  "name": "Keyboard"
}
```

A backward-compatible addition might be:

```
{
  "id": 101,
  "name": "Keyboard",
  "category": "Electronics"
}
```

Many clients will tolerate the additional field, but compatibility depends on the client and schema contract. Some strict deserializers or schema validators may reject unknown fields.

A breaking change would be renaming `name` to `productName` or changing the type of an existing field without maintaining compatibility.

### Best practices

1. Prefer additive changes: Add optional fields instead of removing or renaming existing fields.
2. Avoid changing field meanings: Keep existing semantics stable.
3. Use explicit versions for breaking changes: Support old and new contracts during migration.
4. Publish deprecation timelines: Give clients enough time to upgrade.
5. Measure actual usage: Identify which clients still use the old version.
6. Use automated contract tests: Verify expected request and response shapes.
7. Use observability: Track errors, latency, and version usage.
8. Plan a rollback: Ensure deployment and migration strategies allow recovery if a release causes issues.

### Database changes matter too

An API can be backward-compatible at the HTTP layer but still fail if the database schema changes abruptly.

A common deployment strategy is expand and contract:

1. Add the new database field or structure without removing the old one.
2. Deploy application code that supports both representations.
3. Migrate data and clients.
4. Confirm old usage has stopped.
5. Remove the old field in a later release.

Interview answer: “I prefer additive API changes, maintain stable contracts, test compatibility, and use an expand-and-contract database migration strategy. For unavoidable breaking changes, I introduce a new version and deprecate the old one with clear timelines and usage monitoring.”

## Q10. Design a scalable product listing API with filtering, sorting, pagination, rate limiting, and versioning.

I would design a read-oriented API that supports efficient database queries, predictable response sizes, controlled traffic, and backward-compatible evolution.

### 1. Requirements

Functional requirements

- List products.
- Filter by category and price range.
- Sort by supported fields.
- Paginate results.
- Expose versioned API contracts.

Non-functional requirements

- Low latency.
- Support a large product catalog.
- Protect the database from excessive requests.
- Scale horizontally.
- Maintain backward compatibility.

### 2. High-level architecture

Client

Web app or mobile app

API Gateway

Authentication, quotas, request routing

ASP.NET Core API

Versioning, validation, filtering, pagination

Cache — optional

Redis for suitable repeated queries

SQL Server

Indexes, filtering, sorting, bounded queries

The cache is optional; I would introduce it when repeated reads justify the additional complexity and cache invalidation strategy.

### 3. Define the API contract

Example request:

```
GET /api/v1/products?category=electronics&minPrice=500&maxPrice=5000&sortBy=price&sortDirection=asc&pageSize=20&afterId=500
```

Example response:

```
{
  "items": [
    {
      "id": 501,
      "name": "Keyboard",
      "price": 1500
    },
    {
      "id": 502,
      "name": "Mouse",
      "price": 2000
    }
  ],
  "nextCursor": "opaque-cursor-value",
  "hasMore": true
}
```

The cursor is illustrative. In a real implementation, it would encode the last item's sort values, with validation and possibly signing. The example's `afterId` parameter is appropriate only for ID-based ordering; price ordering requires a cursor containing the relevant sort key and a unique tie-breaker.

### 4. Optimize the database

I would:

- Filter in SQL instead of retrieving everything into application memory.
- Use deterministic ordering.
- Use cursor pagination for deep traversal of large datasets.
- Add indexes based on the most common filter and sort combinations.
- Use EF Core `AsNoTracking()` for read-only queries.
- Select only the fields needed by the response.
- Check query plans and performance metrics before making index changes.

### 5. Protect the API

I would apply rate limits at the gateway or API layer, with separate policies for users or tenants and stricter limits for expensive queries.

When a client exceeds its quota, the API returns `429 Too Many Requests`. For horizontally scaled deployments, shared limits may require gateway enforcement or distributed coordination.

### 6. Support API evolution

I would use `/api/v1/products` for the current contract and introduce `/api/v2/products` when a breaking change is required.

I would document both versions, monitor old-version usage, communicate deprecation dates, and remove the old version only after the migration plan allows it.

### 7. Monitor performance

Key metrics include:

- Request rate and p95/p99 latency.
- HTTP 4xx and 5xx rates.
- Rate-limit rejections.
- Database query latency and connection pool pressure.
- Cache hit rate, if caching is enabled.
- Pagination query performance.

### Strong interview summary

“I would design a versioned ASP.NET Core product API behind an API gateway. The API would validate filter and sort parameters, enforce a maximum page size, and use indexed SQL queries with cursor pagination for large datasets. I would implement rate limiting to protect backend capacity, add Redis only where repeated reads justify it, and use metrics to identify bottlenecks. For breaking contract changes, I would introduce a new API version and manage the migration explicitly.”

## Day 6 — Quick revision checklist

Explain REST statelessness and horizontal scaling.

Know HTTP methods and idempotency.

Choose appropriate HTTP status codes.

Compare offset and cursor pagination.

Design indexed, bounded queries for large datasets.

Explain four rate-limiting algorithms.

Understand per-user limits across multiple API instances.

Compare URL, query-string, and header-based versioning.

Explain backward-compatible changes and expand-and-contract migrations.

Walk through the complete product API architecture.

0 of 10 revised

Reset

Next: Day 7 — Database Scaling, Replication, Sharding, and Consistency Patterns. This builds on the database fundamentals from Day 3 and applies them to larger system designs.
