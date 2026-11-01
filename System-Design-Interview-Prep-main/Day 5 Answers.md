# System Design Interview Preparation — Day 5 Answers

## Topic: Message Queues & Asynchronous Processing

These answers are structured for interviews at the mid-level .NET developer / Azure backend engineer level, with practical examples, architecture diagrams, and C# snippets.

## Q1. What is a message queue, and why is it useful?

A message queue is a communication mechanism that allows one application or service to send messages to another service without requiring the receiver to process them immediately.

It acts as an intermediary between a producer and a consumer.

Producer

Order API publishes an order

Message Broker / Queue

Stores the message until it can be processed

Consumer

Inventory or notification service

### Why do we use message queues?

1. Loose coupling: The producer does not need to know how the consumer works.
2. Asynchronous processing: The API can respond without waiting for lengthy background work.
3. Load leveling: Messages can accumulate in the queue during traffic spikes and be processed at a sustainable rate.
4. Resilience: A temporary consumer outage need not cause the producer to fail, provided the broker durably accepts the message.
5. Independent scaling: We can add consumers to increase processing capacity.
6. Retries: Failed messages can be retried or moved to a dead-letter queue.

### Example: E-commerce order processing

When a customer places an order:

- The Order API validates and saves the order.
- It publishes an `OrderPlaced` message.
- Background consumers process inventory, payment, email, and shipping tasks.

The customer does not have to wait for every downstream task to finish.

Interview answer: “A message queue decouples services and enables asynchronous processing, buffering, retries, and independent scaling. It improves resilience and helps systems handle traffic spikes.”

Important: A queue does not automatically guarantee that messages will never be lost. Reliability depends on durable messaging, publisher confirmation, acknowledgment strategy, retries, and correct application design.

## Q2. What is the difference between synchronous and asynchronous communication?

| Aspect           | Synchronous                                      | Asynchronous                                                    |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Communication    | Caller waits for a response                      | Caller can continue without waiting for the final result        |
| Common example   | HTTP request-response                            | Queue or event-driven processing                                |
| Coupling         | Often tighter at runtime                         | Usually looser                                                  |
| User response    | May be delayed by downstream work                | Can return quickly after accepting the request                  |
| Failure handling | Downstream failure can affect caller immediately | Work can be retried later if reliably stored                    |
| Complexity       | Often simpler                                    | Requires handling retries, duplicates, and eventual consistency |

### Synchronous example

An API calls a payment service and waits for the result.

```
Client → Order API → Payment API
                       ↓
Client ← Order API ← Payment result
```

If the payment service takes 8 seconds, the Order API may remain waiting during that time.

### Asynchronous example

```
Client → Order API → Save order + publish message
Client ← Order accepted

                  Queue → Payment Worker
                        → Notification Worker
```

The API can respond with `202 Accepted` when processing has been accepted for later completion, or return `201 Created` if the order resource has already been created. The correct status depends on the API contract.

### Which should you use?

Use synchronous communication when the caller needs an immediate result—for example, retrieving a product or validating a login.

Use asynchronous communication when work can finish later—for example, sending emails, generating reports, processing images, or running long workflows.

Interview tip: `async` and `await` in C# do not automatically make communication asynchronous in the distributed-systems sense. An `async` HTTP call still waits for the remote response. Queue-based processing lets the request and the actual work have separate lifecycles.

## Q3. What is the difference between a queue and Pub/Sub?

Both are messaging patterns, but they distribute messages differently.

### Queue: typically one competing consumer processes each message

```
                    ┌→ Worker A
Producer → Queue ───┤
                    └→ Worker B
```

If Worker A and Worker B compete for messages, a particular message is normally delivered to one of them for processing. Redelivery may happen if processing fails or acknowledgment is missing.

Use cases: Order fulfillment, background jobs, image processing, report generation.

### Pub/Sub: multiple subscribers can receive the same event

```
                       ┌→ Inventory Service
Producer → Topic/Event ├→ Notification Service
                       └→ Analytics Service
```

Each subscriber or subscription receives its own copy or logical delivery of the event, depending on the broker's model and configuration.

Use cases: An order-created event consumed by inventory, notifications, analytics, and shipping.

| Feature          | Queue                                       | Pub/Sub                                                    |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Primary goal     | Distribute work                             | Broadcast events                                           |
| Message handling | Usually one competing consumer per delivery | Multiple subscriptions can independently receive the event |
| Common pattern   | Work queue                                  | Topic with subscriptions                                   |
| Example          | Process a report once                       | Notify several systems that a report was created           |

Interview answer: “A queue distributes work among consumers, while Pub/Sub allows multiple independent subscribers to react to the same event. The exact delivery behavior depends on the broker and subscription configuration.”

## Q4. Compare RabbitMQ, Kafka, and Azure Service Bus.

All three support messaging, but they are optimized for different needs.

[RabbitMQ Logo & Brand Assets (SVG, PNG and vector) - Brandfetch](https://images.openai.com/static-rsc-4/dH0OOZcUHBXmCg4AeXtBX6KtUfyIG6YOYw4mrEHHnlPfqtdIWa5pQXr-QG2hQHorWkVNTA5zOvmMkbgPp8zVkeqrTYPLv4x4nVU2WQE92jTHMOyjGwrVT4hHW0k0N5MO00pz1TflQokKGGt-oJowVnS2mlQtonwHqBv6dxIGD2g?purpose=inline)

RabbitMQ

- General-purpose message broker.
- Supports queues, routing, exchanges, acknowledgments, and retries through appropriate configuration.
- Good for background jobs and task distribution.
- Often chosen when flexible routing and traditional message-queue patterns are important.

[Running Kafka on Production. Apache Kafka is an open-source… | by Pradyumna Khawas | WorkIndia.in | Medium](https://images.openai.com/static-rsc-4/IdgpctULbez35q_RTbMO09b-y6gGSwj0M361O82eRjmf4iacIuOlU2NJe7tJ5nG3ML_-Ramx8HPhw_f2BkJ4-7fTax9B_pG2F5mYYn7fI3Wkxu6lEMjmv6TQdRCI7p2vkYr-RROSNxhp8BCekHH4j-k8olCh620FHns5GrtDyDM?purpose=inline)

Apache Kafka

- Distributed event-streaming platform.
- Stores ordered records in partitioned, durable logs.
- Consumers can replay retained events by moving their offsets.
- Good for high-throughput event streams, analytics, and data pipelines.

[Microsoft - Azure - Servicebus - Messageidplugin 2 - Azure Service Bus Logo Clipart - Large Size Png Image - PikPng](https://images.openai.com/static-rsc-4/V2k_ClRvS-99LezhhM45Nke7UoIQvROD6rNGQYVqRRf4NgaoBrsxaweoIOO-aCWqeACjUjn8D6qO_KQ8wpOjKxv3udHIoi05ZMIXOViLr3uGGW1Kt4qkwL6roul3o4HBFr6bxmEYfLW0gzXY5JDYxu_1UGK9wYxMTYZt9GblG-8?purpose=inline)

Azure Service Bus

- Managed Azure enterprise messaging service.
- Supports queues, topics/subscriptions, dead-letter queues, duplicate detection, and scheduled delivery.
- Integrates well with Azure-hosted .NET applications.
- Good for reliable business workflows and enterprise integration.

### Quick comparison

| Feature        | RabbitMQ                             | Kafka                            | Azure Service Bus                                      |
| -------------- | ------------------------------------ | -------------------------------- | ------------------------------------------------------ |
| Primary model  | Message broker                       | Event log / streaming            | Managed enterprise messaging                           |
| Message replay | Depends on queue and retention setup | Core capability within retention | Not designed as a general-purpose replayable event log |
| Routing        | Exchanges and bindings               | Topics and partitions            | Queues, topics, subscriptions, rules                   |
| Typical use    | Background tasks                     | High-volume event streams        | Azure business workflows                               |
| Operations     | Self-managed or managed options      | Self-managed or managed options  | Azure-managed service                                  |

### Which would you choose?

- RabbitMQ: A task queue for processing jobs with flexible routing.
- Kafka: A high-volume event stream where consumers need to replay historical events.
- Azure Service Bus: An Azure-based business application needing durable messaging, retries, dead-letter handling, and enterprise integration.

For a .NET application already hosted in Azure, Azure Service Bus is often a practical starting point. But choose based on throughput, ordering, replay requirements, cost, operational needs, and the team's experience—not simply because the application uses Azure.

## Q5. Explain at-most-once, at-least-once, and exactly-once delivery.

These terms describe how a messaging system handles delivery and redelivery.

| Delivery guarantee | Meaning                                                                  | Main risk                                                  |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| At-most-once       | A message is delivered zero or one time                                  | A message can be lost                                      |
| At-least-once      | A message is delivered one or more times                                 | Duplicate processing                                       |
| Exactly-once       | A defined processing effect occurs exactly once within a supported scope | Difficult to guarantee across multiple independent systems |

### 1. At-most-once

A message may be lost if the consumer fails after receiving it but before completing the operation.

```
Receive message → Acknowledge → Process
                               ↓
                         Process fails
```

This approach can be suitable when occasional loss is acceptable.

### 2. At-least-once

The consumer acknowledges the message only after successful processing.

```
Receive → Process → Save result → Acknowledge
```

If the consumer crashes after saving the result but before acknowledging, the broker may redeliver the message. The consumer could therefore process it again.

For important business workflows, at-least-once delivery combined with idempotent processing is a common design.

### 3. Exactly-once

A broker may provide exactly-once guarantees within a particular scope, such as specific stream-processing operations or transactional messaging features. However, that does not automatically guarantee exactly one external effect across a database, payment provider, and email service.

For example, a payment may succeed but the consumer may crash before recording the success. Retrying blindly could charge the customer twice.

Use techniques such as:

- Idempotency keys.
- Unique message IDs.
- Database uniqueness constraints.
- Atomic database transactions.
- Provider-supported idempotency for external operations.

Interview answer: “I usually design consumers for at-least-once delivery and make their business operations idempotent. Exactly-once behavior across distributed systems requires a clearly defined scope and additional coordination; I don't assume the broker alone guarantees it.”

## Q6. What is idempotency, and why is it important for message consumers?

An operation is idempotent if repeating the same operation produces the same final effect as performing it once.

For a message consumer, idempotency prevents a redelivered message from causing duplicate business effects.

### Example

Suppose an `OrderPlaced` message is delivered twice. The consumer should not create two inventory reservations for the same order.

A simple database-backed pattern uses a unique message ID:

```
CREATE TABLE ProcessedMessages
(
    MessageId UNIQUEIDENTIFIER PRIMARY KEY,
    ProcessedAt DATETIME2 NOT NULL
);
```

Conceptually, the consumer does the following:

1. Begin a database transaction.
2. Insert the message ID into `ProcessedMessages`.
3. If the ID already exists, treat the message as already processed.
4. Otherwise, perform the business update.
5. Commit both changes in the same transaction.
6. Acknowledge the message only after the commit succeeds.

The unique constraint handles concurrent attempts to process the same message. The implementation must catch the duplicate-key case and treat it as an already-processed message.

### C#-style pseudocode

```
public async Task HandleAsync(
    OrderPlaced message,
    CancellationToken cancellationToken)
{
    await using var transaction =
        await db.Database.BeginTransactionAsync(
            cancellationToken);

    var alreadyProcessed = await db.ProcessedMessages
        .AnyAsync(x => x.MessageId == message.MessageId,
                  cancellationToken);

    if (alreadyProcessed)
        return;

    db.ProcessedMessages.Add(new ProcessedMessage
    {
        MessageId = message.MessageId,
        ProcessedAt = DateTime.UtcNow
    });

    var order = await db.Orders.FindAsync(
        new object[] { message.OrderId },
        cancellationToken);

    if (order is null)
        throw new InvalidOperationException("Order not found.");

    order.Status = "Processing";

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}
```

This illustrates the pattern, but production code must handle concurrent duplicates and ensure the transaction's behavior matches the database and broker acknowledgment strategy. A unique constraint remains essential even if the code checks for an existing message first.

Important: This protects database changes in the same transaction. It does not automatically make an external payment API or email send idempotent. For external effects, use provider-supported idempotency keys or a separate reliable workflow.

Interview answer: “Idempotency is essential because messages can be redelivered. I use stable message IDs, database constraints, and atomic transactions to ensure duplicate delivery doesn't repeat the business effect.”

## Q7. What are retries, dead-letter queues, and poison messages?

These mechanisms help a messaging system recover from failures without endlessly blocking processing.

### Retries

A retry attempts to process a failed message again.

Typical policy:

- Retry transient network or service failures.
- Use exponential backoff to avoid overwhelming an unhealthy dependency.
- Add jitter to spread out retries.
- Limit the number of attempts.
- Do not retry permanent failures indefinitely.

For example, retry after approximately 1, 2, 4, and 8 seconds, subject to a maximum delay and a configured attempt limit.

### Dead-letter queue (DLQ)

A DLQ stores messages that cannot be processed successfully under the configured delivery and failure policy.

It allows engineers to inspect failures, identify the cause, and replay or correct messages deliberately.

Common reasons include:

- Maximum delivery attempts exceeded.
- Invalid message schema.
- Missing required business data.
- Unsupported message version.
- A permanent business validation failure.

### Poison message

A poison message repeatedly causes processing to fail—for example, a message with invalid JSON that crashes the consumer on every attempt.

Queue

Consumer attempts processing

Transient failure?

Yes

Retry with backoff

No / limit reached

Dead-letter queue

### How should a DLQ be managed?

1. Log the message ID, error, and correlation ID.
2. Monitor DLQ depth and age.
3. Alert when messages accumulate.
4. Identify and fix the underlying issue.
5. Replay messages only after checking whether they have already produced a business effect.

Interview answer: “I use bounded retries with exponential backoff for transient failures, then dead-letter messages that cannot be processed. I monitor the DLQ and investigate before replaying messages to avoid duplicates or repeated failures.”

## Q8. What is the transactional outbox pattern, and what problem does it solve?

The transactional outbox pattern solves a common distributed-systems problem: saving data in a database and publishing a message are two separate operations.

### The dual-write problem

Imagine an Order API:

1. It saves an order to SQL Server.
2. It publishes an `OrderPlaced` message to a broker.

Two failure cases are possible:

- The database commit succeeds, but publishing the message fails. The order exists, but downstream services never learn about it.
- The message is published, but the database transaction fails. Consumers receive an event for an order that does not exist.

A normal SQL transaction does not atomically commit a separate broker publish.

### Solution: transactional outbox

Write the order and an outbox record in the same database transaction.

Single SQL transaction

Insert Order + Insert Outbox message

Outbox Publisher

Reads unsent records and publishes them

Message Broker

Consumers process published events

If the transaction rolls back, neither the order nor its outbox message is committed. If it succeeds, the outbox record remains available for publishing, even if the broker is temporarily unavailable.

### Example schema

```
CREATE TABLE OutboxMessages
(
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    MessageType NVARCHAR(200) NOT NULL,
    Payload NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    PublishedAt DATETIME2 NULL
);
```

### Implementation approach in .NET

Inside one EF Core transaction:

```
await using var transaction =
    await db.Database.BeginTransactionAsync(cancellationToken);

db.Orders.Add(order);

db.OutboxMessages.Add(new OutboxMessage
{
    Id = Guid.NewGuid(),
    MessageType = "OrderPlaced",
    Payload = JsonSerializer.Serialize(orderEvent),
    CreatedAt = DateTime.UtcNow
});

await db.SaveChangesAsync(cancellationToken);
await transaction.CommitAsync(cancellationToken);
```

A separate background publisher then:

1. Reads pending outbox messages.
2. Publishes each message to the broker.
3. Marks messages as published after confirmation.

### Important production details

- Use publisher confirmations or the broker's equivalent.
- Make publishing and marking records safe to retry.
- Use locking or leasing to coordinate multiple publisher instances.
- Expect duplicate publication if a crash occurs after publish but before marking the record.
- Make consumers idempotent.
- Monitor outbox backlog and age.
- Consider cleanup or archival of published records.

Interview answer: “The transactional outbox makes the database change and intent to publish atomic. A background publisher eventually delivers the event, while idempotent consumers handle possible duplicate delivery.”

## Q9. How would you implement a background worker in ASP.NET Core? When would you use a message broker instead?

ASP.NET Core provides `BackgroundService` and `IHostedService` for running background work inside an application host.

### Simple implementation using `BackgroundService`

```
public sealed class OrderWorker : BackgroundService
{
    private readonly ILogger<OrderWorker> _logger;

    public OrderWorker(
        ILogger<OrderWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation(
                    "Checking for pending orders");

                // Fetch and process a small batch
                // of pending orders from the database.

                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex, "Order worker iteration failed");

                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
        }
    }
}
```

Register it in `Program.cs`:

```
builder.Services.AddHostedService<OrderWorker>();
```

This demonstrates the worker lifecycle. The database polling, batch selection, concurrency handling, and processing logic still need to be implemented.

### Important: scoped dependency injection

EF Core's `DbContext` is typically registered as a scoped service. Do not inject a scoped `DbContext` directly into a long-lived singleton worker.

Instead, inject `IServiceScopeFactory` and create a scope for each processing batch:

```
public sealed class OrderWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderWorker> _logger;

    public OrderWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var processor = scope.ServiceProvider
                    .GetRequiredService<IOrderProcessor>();

                await processor.ProcessPendingBatchAsync(
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex, "Background processing failed");

                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
        }
    }
}
```

Register the dependencies:

```
builder.Services.AddScoped<IOrderProcessor, OrderProcessor>();
builder.Services.AddHostedService<OrderWorker>();
```

This assumes `IOrderProcessor` implements the batch-processing method shown in the example.

### When is `BackgroundService` enough, and when do you need a broker?

| Scenario                                            | Suitable choice                                    |
| --------------------------------------------------- | -------------------------------------------------- |
| A periodic cleanup job                              | `BackgroundService`                                |
| Polling a small table of pending records            | Background worker, with safe database coordination |
| Simple in-process work queue                        | `Channel<T>` plus a hosted worker                  |
| Durable work that must survive application restarts | Durable broker or persistent database-backed queue |
| Multiple independently deployed consumers           | Message broker                                     |
| Traffic spikes and buffering                        | Message broker                                     |
| Dead-lettering, broker-managed retries, and routing | Message broker with appropriate configuration      |

Crucial trade-off: An in-memory queue such as `Channel<T>` is not durable. If the process terminates, queued items can be lost. A background worker also runs within the application lifecycle, so deploying several application instances requires care to avoid duplicate processing.

For Azure-based .NET systems, Azure Service Bus with a `BackgroundService` consumer is a common combination: the broker handles durable messaging, while the worker hosts the processing code.

## Q10. Design an asynchronous order-processing system that handles traffic spikes without losing orders.

This is a common system design interview question. I would start by clarifying the requirements, then design the simplest reliable architecture that meets them.

### 1. Requirements

Functional requirements

- Customers can place orders.
- Orders are saved and assigned unique IDs.
- Payment and inventory processing happen asynchronously.
- Customers can check order status.
- Failed work can be retried and investigated.

Non-functional requirements

- Handle sudden increases in order traffic.
- Avoid losing accepted orders.
- Support independent scaling of consumers.
- Prevent duplicate charges and inventory reservations.
- Provide observability and failure recovery.

### 2. High-level architecture

Client / Web Application

Load Balancer / API Gateway

Order API — ASP.NET Core

Validate request, persist order and outbox record

SQL Server

Orders + Outbox, committed in one transaction

Outbox Publisher → Durable Message Broker

For example, Azure Service Bus

Payment Worker

Idempotent payment processing

Inventory Worker

Reserve stock safely

Notification Worker

Send order updates

Monitoring

Logs, metrics, alerts

### 3. Order-processing flow

1. The client submits an order with a client-generated idempotency key.
2. The API validates the request.
3. In one SQL transaction, the API saves the order and an outbox event.
4. The API returns the order ID and initial status after the database commit. It can use `201 Created` when the order resource has been created, even though downstream work is pending.
5. The outbox publisher publishes the event to the durable broker.
6. Payment and inventory consumers process their respective messages.
7. Each consumer records its result safely and acknowledges successful processing.
8. The order's status is updated as the workflow progresses.
9. Notification work is triggered when appropriate.
10. The client polls an order-status endpoint or receives updates through an appropriate push mechanism.

### 4. How do you handle traffic spikes?

Suppose normal traffic is 100 orders per second, but a promotion increases incoming traffic to 1,000 orders per second.

The broker can buffer messages while consumers process them at a sustainable rate.

I would:

- Scale the API horizontally, subject to database capacity.
- Scale consumers independently based on queue depth, message age, and processing latency.
- Apply concurrency limits to protect SQL Server and payment providers.
- Batch work where appropriate.
- Use backpressure and rate limits to prevent downstream overload.
- Monitor queue growth and increase capacity before the backlog becomes critical.

A queue smooths bursts; it does not create unlimited processing capacity. If the incoming rate continuously exceeds the processing rate, the backlog will keep growing.

### 5. How do you prevent order loss?

| Failure                                                    | Protection                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| API crashes after saving order                             | Database transaction preserves committed order                                |
| Message broker temporarily unavailable                     | Outbox record remains available for later publishing                          |
| Publisher crashes after sending                            | Retry publication; consumers tolerate duplicates                              |
| Consumer crashes before completing work                    | Broker redelivery, depending on acknowledgment and lock behavior              |
| Consumer crashes after DB commit but before acknowledgment | Idempotent consumer prevents repeated business effects                        |
| Payment provider times out                                 | Use provider-supported idempotency and reconcile uncertain outcomes           |
| Message repeatedly fails                                   | Bounded retries, dead-letter queue, alerts, and controlled recovery           |
| Database becomes overloaded                                | Rate limiting, bounded concurrency, capacity planning, and query optimization |

### 6. How do you maintain correct order status?

I would model the order lifecycle explicitly, for example:

`Pending → Processing → Confirmed`

Alternative terminal outcomes could include `PaymentFailed` or `Cancelled`.

Because multiple services participate, the order workflow is a distributed process. If payment succeeds but inventory reservation fails, the system needs a defined compensation or recovery strategy—for example, refunding the payment if the business rules require it. A distributed workflow may use a Saga pattern rather than a single transaction spanning all services.

### 7. How do you monitor the system?

Track:

- Orders accepted and completed per second.
- Queue depth and oldest-message age.
- Consumer success and failure rates.
- Retry counts and dead-letter queue depth.
- Payment latency and timeout rates.
- Database CPU, query latency, connection pool pressure, and transaction failures.
- End-to-end order completion time.

Use correlation IDs and structured logs so a single order can be traced across the API, broker, and consumers.

### 8. Azure implementation choices

For a Microsoft Azure stack, one reasonable implementation is:

- ASP.NET Core Web API hosted on Azure App Service or Azure Container Apps.
- Azure SQL Database or SQL Server, depending on deployment requirements.
- Azure Service Bus for durable messaging.
- `BackgroundService` consumers hosted in a suitable worker deployment.
- Azure Monitor and Application Insights for metrics, logs, and distributed tracing.

These are implementation options, not mandatory components. The final choices depend on expected throughput, latency, budget, operational requirements, and the existing environment.

### Strong interview summary

“I would build an ASP.NET Core Order API backed by SQL Server, using the transactional outbox pattern to ensure that a committed order also has a durable record of the event to publish. Azure Service Bus would buffer work during traffic spikes. Independently scalable consumers would process payment, inventory, and notifications with bounded retries, dead-letter handling, and idempotency. I would monitor queue depth, message age, consumer failures, and database health. For workflows involving multiple services, I would define explicit state transitions and compensation logic rather than relying on a distributed database transaction.”

## Day 5 — Final revision sheet

| Concept                       | Remember this                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Message queue                 | Decouples producers from consumers                                                     |
| Synchronous vs asynchronous   | Immediate response vs work that can finish later                                       |
| Queue vs Pub/Sub              | Distribute work vs broadcast events                                                    |
| RabbitMQ                      | Flexible message routing and queues                                                    |
| Kafka                         | Durable, replayable event streams                                                      |
| Azure Service Bus             | Managed enterprise messaging on Azure                                                  |
| At-least-once                 | Redelivery is possible; make consumers idempotent                                      |
| Idempotency                   | Duplicate processing does not duplicate the business effect                            |
| DLQ                           | Isolates messages that cannot be processed normally                                    |
| Transactional outbox          | Atomically saves business data and the intent to publish                               |
| `BackgroundService`           | Hosts background processing, but isn't a durable broker                                |
| Order-processing architecture | Durable persistence, broker buffering, scalable consumers, recovery, and observability |

Recommended practice: Explain Q8 and Q10 aloud without looking at the notes. The transactional outbox and the complete order-processing design are particularly useful interview topics for a .NET/Azure backend role.
