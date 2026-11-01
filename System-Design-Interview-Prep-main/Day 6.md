# System Design Interview Preparation — Day 6

## API Design, REST, Pagination, Rate Limiting & API Versioning

Today’s goal is to learn how to design APIs that are consistent, scalable, secure, and easy for clients to consume. We’ll use ASP.NET Core and C# examples relevant to .NET backend interviews.

## Today's learning plan

1\. REST API fundamentals

Resources, HTTP methods, status codes, statelessness

2\. Pagination and filtering

Offset vs cursor pagination, sorting, efficient queries

3\. Rate limiting

Token bucket, throttling, quotas, HTTP 429

4\. API versioning

Backward compatibility and version migration

## 1. REST API fundamentals

REST (Representational State Transfer) is an architectural style for designing networked APIs around resources.

For example, in an e-commerce application, the main resources might be:

- `products`
- `orders`
- `customers`
- `payments`

### Resource-oriented URL design

| Operation                | HTTP method | Endpoint            | Typical response             |
| ------------------------ | ----------- | ------------------- | ---------------------------- |
| List products            | GET         | `/api/products`     | `200 OK`                     |
| Get one product          | GET         | `/api/products/101` | `200 OK`                     |
| Create product           | POST        | `/api/products`     | `201 Created`                |
| Replace product          | PUT         | `/api/products/101` | `200 OK` or `204 No Content` |
| Partially update product | PATCH       | `/api/products/101` | `200 OK` or `204 No Content` |
| Delete product           | DELETE      | `/api/products/101` | `204 No Content`             |

Prefer resource names such as `/api/products` over action-oriented URLs such as `/api/getAllProducts`. Use HTTP methods to communicate the intended operation.

### Important HTTP method differences

GET: Retrieves a resource and should not change business state.

POST: Creates a resource or submits an operation that is not necessarily idempotent.

PUT: Replaces a resource representation. A well-designed PUT operation is idempotent.

PATCH: Partially modifies a resource. Idempotency depends on the specific patch operation.

DELETE: Deletes a resource. Repeating a successful delete request should generally leave the resource deleted, even if the subsequent response differs.

### What is idempotency?

An operation is idempotent if repeating it has the same intended effect as performing it once.

For example:

```
PUT /api/products/101
Content-Type: application/json

{
  "name": "Keyboard",
  "price": 1500
}
```

Sending the same replacement request multiple times should leave the product with the same values.

By contrast, sending the following request repeatedly may create multiple orders:

```
POST /api/orders
```

For operations such as payments or order creation, an idempotency key can help prevent duplicate effects when clients retry after timeouts.

### Statelessness

A REST-style API should not depend on server-side session state to understand an individual request. Each request carries the information needed to process it, such as authentication credentials and request parameters.

For example, a JWT can carry identity and claims, allowing requests to be authenticated across multiple API instances.

Statelessness makes horizontal scaling easier because requests can be handled by different instances. It does not mean that the application has no database or that all state must live inside the JWT.

## 2. HTTP status codes you must know

| Status                      | Meaning                                            | Example                               |
| --------------------------- | -------------------------------------------------- | ------------------------------------- |
| `200 OK`                    | Request succeeded                                  | Fetch product                         |
| `201 Created`               | Resource created                                   | Create order                          |
| `202 Accepted`              | Accepted for processing, not necessarily completed | Async report generation               |
| `204 No Content`            | Success without response body                      | Delete product                        |
| `400 Bad Request`           | Invalid request                                    | Malformed or invalid input            |
| `401 Unauthorized`          | Authentication missing or invalid                  | Expired or invalid token              |
| `403 Forbidden`             | Authenticated caller lacks permission              | Access another user's restricted data |
| `404 Not Found`             | Resource not found                                 | Product ID doesn't exist              |
| `409 Conflict`              | Conflict with current resource state               | Duplicate unique business key         |
| `429 Too Many Requests`     | Rate limit exceeded                                | Too many requests per minute          |
| `500 Internal Server Error` | Unexpected server failure                          | Unhandled exception                   |
| `503 Service Unavailable`   | Temporarily unable to serve requests               | Service overloaded or unavailable     |

Interview distinction: `401` is about authentication; `403` is about authorization. `429` is the usual status code for rate limiting.

In ASP.NET Core, use consistent error responses, such as `ProblemDetails`, and avoid returning internal stack traces to clients.

## 3. Pagination: offset vs cursor

Imagine your products table contains 1 million rows. Returning every row in one API response wastes bandwidth, memory, and database resources.

Pagination returns a manageable subset.

### Offset pagination

Example:

```
GET /api/products?page=3&pageSize=20
```

If pages are one-based, the database offset is:

\\[ \text{offset} = (\text{page} - 1) \times \text{pageSize} \\]

For page 3 with a page size of 20, the offset is 40.

An EF Core example:

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

Always apply a deterministic ordering before `Skip` and `Take`. For very large offsets, performance may degrade because the database still needs to traverse skipped rows.

### Cursor pagination

Example:

```
GET /api/products?afterId=500&pageSize=20
```

If IDs are sequential and increasing:

```
var products = await db.Products
    .AsNoTracking()
    .Where(p => p.Id > afterId)
    .OrderBy(p => p.Id)
    .Take(pageSize)
    .ToListAsync(cancellationToken);
```

This example uses `afterId` as a simplified cursor. Production APIs should validate the cursor and consider whether it needs to be opaque or signed.

| Feature                        | Offset                              | Cursor                                       |
| ------------------------------ | ----------------------------------- | -------------------------------------------- |
| Jump to a page                 | Easy                                | Usually not supported directly               |
| Large datasets                 | Can become expensive                | Often more efficient                         |
| Data changing between requests | Can cause skipped or repeated items | Generally more stable with a suitable cursor |
| Implementation                 | Simpler                             | Requires cursor and ordering design          |
| Typical use                    | Admin grids and small datasets      | Feeds, timelines, large collections          |

For cursor pagination, use a stable ordering key. If sorting by creation time, include a unique tie-breaker, such as `(CreatedAt, Id)`, and encode both values in the cursor.

### Filtering and sorting

A well-designed endpoint might be:

```
GET /api/products?category=electronics&minPrice=500&sortBy=price&sortDirection=asc&pageSize=20
```

Validate query parameters and whitelist allowed sort fields. Do not directly concatenate user-provided sort expressions into SQL.

For large datasets, design database indexes to support common filters and sort orders.

## 4. Rate limiting

Rate limiting controls how many requests a client can make within a given period or how much capacity it can consume.

It protects APIs against accidental request storms, abusive clients, and resource exhaustion.

### Common algorithms

Fixed window

Limits requests in fixed time windows, such as 100 requests per minute. Simple, but bursts near a window boundary can allow more than 100 requests in a short interval.

Sliding window

Tracks or estimates requests over a rolling period, reducing boundary bursts.

Token bucket

Tokens replenish at a defined rate, and each request consumes tokens. A bounded bucket permits controlled bursts while limiting the long-term rate.

Concurrency limiter

Limits how many requests can be executing simultaneously, useful for protecting expensive operations.

### Example: ASP.NET Core built-in rate limiter

In `Program.cs`:

```
using System.Threading.RateLimiting;

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("api", limiter =>
    {
        limiter.PermitLimit = 100;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
});

var app = builder.Build();

app.UseRouting();
app.UseRateLimiter();

app.MapControllers()
   .RequireRateLimiting("api");

app.Run();
```

This example configures a fixed-window policy of 100 permits per minute for endpoints mapped through `MapControllers()`. It is a per-process limiter, not a global quota shared automatically across multiple API instances.

### Important production considerations

- Choose whether limits apply per user, API key, tenant, IP address, or endpoint.
- Do not trust arbitrary client-supplied identity headers unless a trusted proxy or gateway validates them.
- Multiple instances may need gateway-level or distributed enforcement for a truly shared quota.
- Return `429 Too Many Requests` when a limit is exceeded; where appropriate, include a `Retry-After` header.
- Set stricter limits for expensive endpoints, such as report generation or login attempts.
- Authentication, authorization, and rate limiting solve different problems and may all be necessary.

## 5. API versioning

APIs evolve. You might need to rename a field, change a response structure, or introduce a new required property.

If existing clients depend on the old contract, changing it without a compatibility strategy can break them.

### Common versioning strategies

| Strategy     | Example                                   | Consideration                   |
| ------------ | ----------------------------------------- | ------------------------------- |
| URL path     | `/api/v1/products`                        | Explicit and easy to understand |
| Query string | `/api/products?api-version=1.0`           | Version is a query parameter    |
| Header       | `X-API-Version: 1`                        | Keeps the URL unchanged         |
| Media type   | `Accept: application/vnd.example.v1+json` | Flexible but less discoverable  |

For many public and internal APIs, path versioning is straightforward.

Example:

```
GET /api/v1/products/101
GET /api/v2/products/101
```

Version 1 might return:

```
{
  "id": 101,
  "name": "Keyboard"
}
```

Version 2 might return:

```
{
  "id": 101,
  "name": "Keyboard",
  "price": 1500,
  "currency": "INR"
}
```

A version change is most useful when the API contract has a breaking change. Adding an optional response field is often backward-compatible, but client behavior and contract requirements still matter.

### Versioning best practices

1. Avoid breaking existing clients without notice.
2. Keep version-specific request and response contracts clear.
3. Maintain a deprecation policy and communicate retirement dates.
4. Track usage of old versions.
5. Avoid creating a new version for every small change.
6. Use automated contract and integration tests.

In ASP.NET Core, versioning can be implemented with routing conventions or a versioning library. The exact configuration depends on the chosen versioning strategy and package.

## 6. Interview practice questions — Day 6

Try answering these without looking at the lesson. We can review each answer afterward.

## Day 6 — Q1–Q10

10 questions

Mark each question as you practise it. Answers are intentionally hidden until you ask for them.

Q1. What are the key principles of REST, and what does statelessness mean?

REST fundamentals

Q2. Explain GET, POST, PUT, PATCH, and DELETE. Which are idempotent?

HTTP methods

Q3. When should an API return 200, 201, 202, 204, 400, 401, 403, 409, and 429?

Status codes

Q4. What is the difference between offset pagination and cursor pagination?

Pagination

Q5. How would you design filtering, sorting, and pagination for a product API with millions of rows?

API scalability

Q6. Compare fixed-window, sliding-window, token-bucket, and concurrency rate limiters.

Rate limiting

Q7. How would you implement per-user rate limiting in a horizontally scaled ASP.NET Core API?

Distributed APIs

Q8. What is API versioning? Compare URL, query-string, and header-based versioning.

Versioning

Q9. How do you evolve an API without breaking existing consumers?

Backward compatibility

Q10. Design a scalable product listing API with filtering, sorting, pagination, rate limiting, and versioning.

System design
