# System Design Interview Preparation — Day 5

# Message Queues & Asynchronous Processing

HLD · Distributed Systems · C#/.NET · Azure

Today we'll learn how to build systems that can handle heavy workloads without making users wait for every operation to finish.

On Day 4, we used Redis to reduce database load. Today, we'll solve a different problem:

What if an API needs to perform several time-consuming operations, and we don't want the user to wait for all of them?

For your .NET and Azure interviews, this topic is especially important for order processing, notifications, background jobs, and event-driven architectures.

## 1. Why do we need message queues?

Imagine an e-commerce application. A customer places an order.

The application needs to:

1. Save the order.
2. Process payment.
3. Update inventory.
4. Send an email.
5. Notify a shipping service.

A naive synchronous implementation might look like this:

Client

Order API

Save Order

Process Payment

Update Inventory

Send Email

Return Response

If payment takes 500 ms, inventory takes 200 ms, and email delivery takes 800 ms, the user may wait for all those operations, plus database and network overhead.

There are also reliability problems:

- What happens if the email provider is down?
- What if inventory processing takes 10 seconds?
- What happens when 10,000 orders arrive simultaneously?
- Should an email failure cause the order API to fail?

A message queue can help separate the immediate API response from work that can be performed asynchronously.

## 2. What is a message queue?

A message queue is a communication mechanism that allows one component to send a message for another component to process, often asynchronously.

Instead of calling every downstream service directly, the producer publishes a message to a broker.

Producer

Order API

Message Broker / Queue

Stores or buffers messages

Consumer

Notification Worker

The producer and consumer don't need to execute at the same time. The broker buffers messages until consumers can process them, subject to the broker's durability and retention configuration.

### Key terminology

- Producer: Creates and sends messages.
- Broker: Accepts, routes, and stores messages.
- Queue: Holds messages for consumers.
- Consumer: Receives and processes messages.
- Acknowledgment: Signals that a message was handled according to the broker's delivery protocol.

Interview definition:

> A message queue decouples producers from consumers, enabling asynchronous processing, buffering, and more flexible scaling of workloads.

## 3. Synchronous vs asynchronous communication

### Synchronous

The caller waits for the downstream operation to finish.

```
Order API
    │
    ├── Call Payment Service ── wait
    ├── Call Inventory Service ── wait
    └── Call Email Service ── wait
```

Advantages:

- Straightforward request/response flow.
- Immediate result from the called service.

Disadvantages:

- User latency increases.
- Downstream failures can affect the caller.
- Traffic spikes can overwhelm dependencies.

### Asynchronous

The caller publishes work and continues when its immediate responsibility is complete.

```
                 Order API
                    │
                    ▼
               Message Queue
                 /       \
                ▼         ▼
          Email Worker  Inventory Worker
```

Advantages:

- Producers and consumers can scale independently.
- Work can be buffered during traffic spikes.
- Temporary consumer failures can be handled through retries.
- The API doesn't need to wait for every background task.

Disadvantages:

- Processing may be delayed.
- Monitoring and debugging are more complex.
- Duplicate delivery and ordering must be considered.
- Users may not see downstream changes immediately.

Important: Asynchronous doesn't automatically mean faster or more reliable. It changes when work is performed and how failures are handled.

## 4. What happens when a user places an order?

Let's design an order-processing flow.

1\. Client sends POST /orders

2\. Order API validates request

3\. Persist order as Pending

4\. Publish order-processing message

5\. Return HTTP 202 Accepted, if processing is still pending

6\. Worker processes the order

The API can return an order ID and a pending status. The client can then query the order status or receive a notification when processing finishes.

Example response:

```
{
  "orderId": "ORD-1001",
  "status": "Pending"
}
```

HTTP `202 Accepted` is appropriate when the request has been accepted for processing but the requested work hasn't finished. It should not be interpreted as proof that payment or order fulfillment has succeeded.

### Critical design detail

What if the database commits the order, but publishing the message fails?

This is a classic reliability problem. We'll cover the transactional outbox pattern later in this lesson.

## 5. Queue vs publish-subscribe

These two patterns are related, but they're not identical.

### Queue / competing consumers

Multiple workers consume messages from the same logical queue. Each message is typically handled by one competing consumer, although retries and redelivery may cause it to be processed more than once.

```
               Queue
             /   |   \
            ▼    ▼    ▼
          Worker1 Worker2 Worker3
```

Useful for:

- Generating reports.
- Sending email.
- Processing orders.
- Background jobs.

Adding workers can increase throughput, provided the downstream systems can handle the additional load.

### Publish-subscribe (Pub/Sub)

A producer publishes an event, and multiple independent subscribers can receive it.

```
            OrderPlaced Event
                    │
                 Broker
             ┌──────┼──────┐
             ▼      ▼      ▼
          Shipping Email Analytics
          Subscriber Subscriber Subscriber
```

For example, when an order is placed:

- Shipping creates a shipment.
- Notification sends a confirmation.
- Analytics records the event.

Each subscriber can have its own subscription or queue, depending on the broker.

Interview takeaway: A work queue distributes work among competing consumers; Pub/Sub enables multiple subscribers to react independently to the same event.

## 6. RabbitMQ vs Kafka vs Azure Service Bus

These are common interview questions. Don't treat them as interchangeable products.

[RabbitMQ Logo & Brand Assets (SVG, PNG and vector) - Brandfetch](https://images.openai.com/static-rsc-4/dH0OOZcUHBXmCg4AeXtBX6KtUfyIG6YOYw4mrEHHnlPfqtdIWa5pQXr-QG2hQHorWkVNTA5zOvmMkbgPp8zVkeqrTYPLv4x4nVU2WQE92jTHMOyjGwrVT4hHW0k0N5MO00pz1TflQokKGGt-oJowVnS2mlQtonwHqBv6dxIGD2g?purpose=inline)

RabbitMQ

A message broker commonly used for queues, routing, acknowledgments, and competing consumers.

Typical fit: Background tasks, job processing, and service-to-service messaging.

[Running Kafka on Production. Apache Kafka is an open-source… | by Pradyumna Khawas | WorkIndia.in | Medium](https://images.openai.com/static-rsc-4/IdgpctULbez35q_RTbMO09b-y6gGSwj0M361O82eRjmf4iacIuOlU2NJe7tJ5nG3ML_-Ramx8HPhw_f2BkJ4-7fTax9B_pG2F5mYYn7fI3Wkxu6lEMjmv6TQdRCI7p2vkYr-RROSNxhp8BCekHH4j-k8olCh620FHns5GrtDyDM?purpose=inline)

Apache Kafka

A distributed event-streaming platform that stores events in partitioned, ordered logs with configurable retention.

Typical fit: High-volume event streams, analytics pipelines, and replayable event processing.

[Microsoft - Azure - Servicebus - Messageidplugin 2 - Azure Service Bus Logo Clipart - Large Size Png Image - PikPng](https://images.openai.com/static-rsc-4/V2k_ClRvS-99LezhhM45Nke7UoIQvROD6rNGQYVqRRf4NgaoBrsxaweoIOO-aCWqeACjUjn8D6qO_KQ8wpOjKxv3udHIoi05ZMIXOViLr3uGGW1Kt4qkwL6roul3o4HBFr6bxmEYfLW0gzXY5JDYxu_1UGK9wYxMTYZt9GblG-8?purpose=inline)

Azure Service Bus

A managed Azure messaging service with queues, topics/subscriptions, dead-lettering, and broker features such as duplicate detection and sessions.

Typical fit: Reliable messaging between .NET services running in Azure.

### Comparison table

| Feature                | RabbitMQ                                                         | Kafka                            | Azure Service Bus                        |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------- | ---------------------------------------- |
| Core model             | Message broker                                                   | Distributed event log            | Managed message broker                   |
| Main use               | Queues and routing                                               | Event streaming                  | Enterprise application messaging         |
| Replay retained events | Possible with suitable configuration; not its main default model | Core capability within retention | Not a general-purpose retained event log |
| Ordering               | Depends on queue and consumer setup                              | Within a partition               | Sessions can support ordered processing  |
| Managed service        | Depends on deployment/provider                                   | Depends on deployment/provider   | Azure-managed                            |

### How would you choose?

For a .NET application already deployed in Azure, I'd consider Azure Service Bus for durable business messaging and queue/topic patterns. I'd consider Kafka when the requirements emphasize high-volume event streaming, retention, replay, and partitioned consumption.

The decision depends on delivery semantics, throughput, ordering, retention, operational constraints, and cost.

## 7. Message delivery semantics: At-most-once, at-least-once, exactly-once

This is one of the most important interview topics.

### At-most-once

A message is delivered zero or one time.

```
Message → Consumer
```

A message can be lost, but it isn't redelivered under the intended delivery semantics.

### At-least-once

A message is delivered one or more times until processing is acknowledged according to the broker's rules.

```
Message → Consumer
            │
            ├── Processed
            └── Ack lost
                    ↓
                 Redelivery
```

The consumer may process the same message more than once.

This is common in reliable messaging systems.

### Exactly-once

The term can mean different things depending on the broker and processing boundary. Some platforms provide exactly-once guarantees within specific scopes, but that doesn't automatically guarantee exactly-once effects across a database, external payment provider, and notification service.

### What should application developers do?

Design consumers to be idempotent whenever duplicate processing is possible.

For example, if a consumer receives `OrderPlaced` twice, it should not create two shipments or charge the customer twice.

Interview sentence:

> "I'd assume messages can be redelivered and make the consumer idempotent. Broker-level delivery guarantees alone don't guarantee exactly-once business effects across external systems."

## 8. Retries, dead-letter queues and poison messages

### Retry

If a temporary error occurs, such as a network timeout, the consumer can retry processing.

Use bounded retries and backoff to avoid repeatedly hammering an unavailable dependency.

Example:

```
Attempt 1 → Failed
Wait 1 second
Attempt 2 → Failed
Wait 2 seconds
Attempt 3 → Failed
```

Randomized jitter can help prevent many consumers from retrying simultaneously.

### Dead-letter queue (DLQ)

If a message repeatedly fails, it can be moved to a dead-letter queue rather than blocking normal processing indefinitely.

```
Main Queue
    │
    ▼
Consumer
    │
    ├── Success → Complete
    │
    └── Repeated failure
              │
              ▼
        Dead-letter Queue
```

A poison message is a message that repeatedly causes processing to fail.

Examples include:

- Invalid payload.
- Missing required data.
- Unsupported message version.
- A deterministic application bug.

### Interview follow-up: Should you retry every error?

No.

- Temporary network errors may justify retries.
- Rate limits may require waiting.
- Invalid messages usually need correction or dead-lettering.
- Permanent business-rule failures should not be retried indefinitely.

DLQs also need monitoring and a safe process for investigating and replaying messages.

## 9. How do you prevent losing a message after saving an order?

This is a classic distributed-systems problem.

Consider the following code flow:

```
1. Save order to SQL Server
2. Publish OrderPlaced message
```

What if the application crashes between these steps?

The order exists in SQL Server, but the message was never published. Downstream services may never process the order.

Reversing the order doesn't fully solve the problem: the message might be published even though the database transaction fails.

### Solution: Transactional outbox

The transactional outbox pattern stores the business change and an event record in the same database transaction.

```
             SQL Server Transaction
             ┌─────────────────────┐
             │ Insert Order        │
             │ Insert Outbox Event │
             └──────────┬──────────┘
                        │ Commit
                        ▼
                  Outbox Publisher
                        │
                        ▼
                    Message Broker
                        │
                        ▼
                     Consumer
```

The publisher reads pending outbox records and publishes them. It marks records as processed only after the relevant publishing step succeeds, with recovery behavior designed for failures.

### Why is this useful?

If the application crashes after the transaction commits, the outbox event remains in SQL Server and can be published later.

Important: The publisher can still publish a message more than once if it crashes at the wrong moment. Consumers should remain idempotent.

### Interview-ready answer

> "I'd use a transactional outbox so the order and its outgoing event are committed atomically in SQL Server. A background publisher then sends the event to the broker with retries. Since publishing may be repeated, I'd also make consumers idempotent."

## 10. Implement asynchronous processing in .NET

Let's connect this to your ASP.NET Core experience.

ASP.NET Core supports background processing through `BackgroundService` and `IHostedService`. These are useful for work within an application process, but they are not themselves durable message brokers.

### Simple background worker

```
public sealed class NotificationWorker : BackgroundService
{
    private readonly ILogger<NotificationWorker> _logger;

    public NotificationWorker(
        ILogger<NotificationWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Processing background work");

            await Task.Delay(
                TimeSpan.FromSeconds(5),
                stoppingToken);
        }
    }
}
```

Register it:

```
builder.Services.AddHostedService<NotificationWorker>();
```

This demonstrates the worker lifecycle, not a production queue implementation. The sample doesn't have durable messages, acknowledgments, or retry handling.

### When should you use a real broker?

Use RabbitMQ, Kafka, or Azure Service Bus when you need capabilities such as:

- Durable message storage.
- Communication across separate services or processes.
- Backpressure and buffering.
- Delivery/acknowledgment semantics.
- Retries and dead-letter handling.
- Independent consumer scaling.

For an Azure-based .NET application, a typical flow might be:

```
ASP.NET Core Order API
          │
          ▼
    SQL Server
    Order + Outbox
          │
          ▼
 Background Publisher
          │
          ▼
  Azure Service Bus
          │
     ┌────┴─────┐
     ▼          ▼
Notification  Inventory
 Worker        Worker
```

The order API can respond before the asynchronous notification work finishes, while the background services handle their responsibilities independently.

# Day 5 — Interview Questions Q1–Q10

Try these yourself before looking at the answers, just as we've done with DSA and SQL.

1. What is a message queue, and why is it useful in distributed systems?
2. What is the difference between synchronous and asynchronous communication?
3. What is the difference between a queue and publish-subscribe messaging?
4. Compare RabbitMQ, Kafka, and Azure Service Bus.
5. What are at-most-once, at-least-once, and exactly-once delivery semantics?
6. What is idempotency, and why is it important for message consumers?
7. What are retries, dead-letter queues, and poison messages?
8. What is the transactional outbox pattern, and what problem does it solve?
9. How would you implement a background worker in ASP.NET Core, and when would you use a message broker instead?
10. Design an asynchronous order-processing system that can handle traffic spikes without losing orders.

## Day 5 revision checklist

### Practice tracker

0 of 8

Explain producer, broker, queue and consumer

Compare synchronous and asynchronous processing

Explain queue versus Pub/Sub

Compare RabbitMQ, Kafka and Azure Service Bus

Explain delivery semantics and idempotency

Explain retries and dead-letter queues

Describe the transactional outbox pattern

Explain when to use BackgroundService versus a broker
