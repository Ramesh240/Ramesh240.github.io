import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(ROOT, '..');
const SOURCE_DIR = join(PROJECT_ROOT, 'System-Design-Interview-Prep-main');
const DATA_DIR = join(PROJECT_ROOT, 'src', 'data');
const ASSETS_DIR = join(PROJECT_ROOT, 'src', 'assets');

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(ASSETS_DIR, { recursive: true });

const DAYS_META = [
  {
    day: 1,
    slug: 'day-1',
    title: 'System Design Fundamentals & Framework',
    shortTitle: 'Fundamentals & Framework',
    conceptFile: 'Day 1.md',
    answersFile: 'Day 1 answers.md',
    phase: 'Phase 1 · Foundations',
    subtitle: 'How to think like an architect, HLD vs LLD, functional vs non-functional constraints, latency vs throughput, and the 9-step interview framework.',
    topics: ['Fundamentals', 'HLD vs LLD', 'CAP Theorem', 'Latency & Throughput', 'Availability', 'Scalability Framework'],
    readTime: '12 min read',
    icon: '🏗️',
    gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)'
  },
  {
    day: 2,
    slug: 'day-2',
    title: 'Scalability, Load Balancing & Stateless Services',
    shortTitle: 'Scalability & Load Balancing',
    conceptFile: 'Day 2.md',
    answersFile: 'Day 2 Answers.md',
    phase: 'Phase 1 · Scalability',
    subtitle: 'Horizontal vs vertical scaling, Layer 4 vs Layer 7 load balancers, health checks, stateless architecture, sticky sessions, and eliminating single points of failure (SPOF).',
    topics: ['Scalability', 'Load Balancing', 'Layer 4 vs Layer 7', 'Stateless Services', 'Sticky Sessions', 'SPOF Mitigation'],
    readTime: '15 min read',
    icon: '⚖️',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
  },
  {
    day: 3,
    slug: 'day-3',
    title: 'Databases, SQL vs NoSQL, Replication & Sharding',
    shortTitle: 'Databases & Sharding',
    conceptFile: 'Day 3.md',
    answersFile: 'Day 3 — Answers Q1–Q10.md',
    phase: 'Phase 2 · Storage & Data',
    subtitle: 'Database scaling bottlenecks, ACID vs BASE, read replicas, replication lag, horizontal sharding strategies, and consistent hashing.',
    topics: ['Databases', 'SQL vs NoSQL', 'Read Replicas', 'Sharding', 'Partitioning', 'Consistent Hashing'],
    readTime: '16 min read',
    icon: '🗄️',
    gradient: 'linear-gradient(135deg, #06b6d4, #10b981)'
  },
  {
    day: 4,
    slug: 'day-4',
    title: 'Caching Strategies & Redis Architecture',
    shortTitle: 'Caching & Redis',
    conceptFile: 'Day 4.md',
    answersFile: 'Day 4 — Answers Q1–Q10.md',
    phase: 'Phase 2 · Performance',
    subtitle: 'Cache-aside, write-through, write-back, TTL expiration, cache invalidation, LRU/LFU eviction, and preventing cache stampede, penetration, and avalanche.',
    topics: ['Caching', 'Redis', 'Cache-Aside', 'Cache Invalidation', 'Cache Stampede', 'Eviction Policies'],
    readTime: '18 min read',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)'
  },
  {
    day: 5,
    slug: 'day-5',
    title: 'Message Queues & Asynchronous Processing',
    shortTitle: 'Queues & Async Processing',
    conceptFile: 'Day 5.md',
    answersFile: 'Day 5 Answers.md',
    phase: 'Phase 2 · Async Messaging',
    subtitle: 'Decoupling distributed systems, Kafka vs RabbitMQ vs Azure Service Bus, at-least-once delivery, idempotency, dead-letter queues, and the Transactional Outbox pattern.',
    topics: ['Message Queues', 'Kafka', 'RabbitMQ', 'Event-Driven', 'Idempotency', 'Transactional Outbox'],
    readTime: '18 min read',
    icon: '📨',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
  },
  {
    day: 6,
    slug: 'day-6',
    title: 'API Design, REST, Rate Limiting & Pagination',
    shortTitle: 'API Design & Rate Limiting',
    conceptFile: 'Day 6.md',
    answersFile: 'Day 6_ Answers to Q1–Q10.md',
    phase: 'Phase 2 · APIs & Gateways',
    subtitle: 'REST architectural constraints, HTTP status codes, offset vs keyset/cursor pagination, token bucket rate limiting, idempotency keys, and zero-downtime API versioning.',
    topics: ['API Design', 'REST Principles', 'Pagination', 'Rate Limiting', 'Token Bucket', 'API Versioning'],
    readTime: '15 min read',
    icon: '🌐',
    gradient: 'linear-gradient(135deg, #10b981, #6366f1)'
  }
];

function extractQuestions(answersContent, dayMeta) {
  const lines = answersContent.replace(/\r/g, '').split('\n');
  const questions = [];
  let current = null;

  lines.forEach(line => {
    const m = line.match(/^#+\s*(Q\d+)[\.:]?\s*(.*)/i);
    if (m) {
      if (current) questions.push(current);
      current = {
        qNum: m[1].toUpperCase(),
        title: m[2].trim(),
        lines: []
      };
    } else if (current) {
      current.lines.push(line);
    }
  });
  if (current) questions.push(current);

  return questions.map((q, idx) => {
    const body = q.lines.join('\n').trim();
    const id = `day-${dayMeta.day}-${q.qNum.toLowerCase()}`;

    // Extract takeaway if explicit blockquote or key sentence
    let takeaway = '';
    const tMatch = body.match(/>\s*(.*)/);
    if (tMatch) {
      takeaway = tMatch[1].replace(/^\*\*Key.*?\*\*\s*/i, '').trim();
    }

    // Extract interview-ready verbal takeaway
    const paragraphs = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    let verbalScript = '';
    for (const p of paragraphs) {
      if (/^#+\s*interview|^[*_]+interview/i.test(p)) continue;
      if (p.startsWith('```') || p.startsWith('|') || p.startsWith('>')) continue;
      verbalScript = p.replace(/\n/g, ' ').replace(/\*\*/g, '').replace(/`/g, '');
      break;
    }

    if (!takeaway && verbalScript) {
      // Pick first sentence of verbalScript
      const firstSentence = verbalScript.match(/^(.*?[.!?])(\s|$)/);
      takeaway = firstSentence ? firstSentence[1] : verbalScript.slice(0, 140) + '...';
    }

    // Determine category based on keywords
    let category = dayMeta.topics[0] || 'General';
    const lowerTitle = q.title.toLowerCase();
    if (lowerTitle.includes('sql') || lowerTitle.includes('database') || lowerTitle.includes('shard') || lowerTitle.includes('replica')) category = 'Databases';
    else if (lowerTitle.includes('cache') || lowerTitle.includes('redis') || lowerTitle.includes('ttl') || lowerTitle.includes('stampede')) category = 'Caching';
    else if (lowerTitle.includes('queue') || lowerTitle.includes('kafka') || lowerTitle.includes('rabbitmq') || lowerTitle.includes('outbox') || lowerTitle.includes('idempotenc')) category = 'Message Queues';
    else if (lowerTitle.includes('rest') || lowerTitle.includes('api') || lowerTitle.includes('pagination') || lowerTitle.includes('rate limit')) category = 'API Design';
    else if (lowerTitle.includes('scale') || lowerTitle.includes('scaling') || lowerTitle.includes('load balanc') || lowerTitle.includes('stateless') || lowerTitle.includes('spof')) category = 'Scalability';
    else if (lowerTitle.includes('hld') || lowerTitle.includes('lld') || lowerTitle.includes('url shortener') || lowerTitle.includes('cap theorem')) category = 'Architecture Framework';

    return {
      id,
      day: dayMeta.day,
      dayTitle: dayMeta.title,
      daySlug: dayMeta.slug,
      qNum: q.qNum,
      index: (dayMeta.day - 1) * 10 + idx + 1,
      title: q.title,
      category,
      takeaway: takeaway || verbalScript.slice(0, 140),
      verbalScript: verbalScript || takeaway,
      rawBody: body
    };
  });
}

function parseRoadmap() {
  const roadmapPath = join(SOURCE_DIR, 'System Design Interview Roadmap.md');
  if (!existsSync(roadmapPath)) return null;
  const raw = readFileSync(roadmapPath, 'utf8').replace(/\r/g, '');

  const phases = [
    {
      phase: 1,
      title: 'Foundations',
      desc: 'Fundamental mental models, non-functional requirements, scaling dimensions, and system boundaries.',
      items: [
        'What is System Design?',
        'Functional vs Non-functional requirements',
        'Scalability dimensions',
        'Availability & Reliability (Nines of availability)',
        'Latency vs Throughput',
        'CAP Theorem & PACELC',
        'Horizontal vs Vertical scaling',
        'Load balancing strategies',
        'Stateless vs Stateful services',
        'Monolith vs Microservices architecture'
      ]
    },
    {
      phase: 2,
      title: 'Core Building Blocks',
      desc: 'The essential infrastructure components that power modern distributed web platforms.',
      items: [
        'REST, RPC & GraphQL APIs',
        'Databases — SQL vs NoSQL tradeoffs',
        'Database indexing (B-Trees vs LSM-Trees)',
        'Replication (Single-leader, Multi-leader)',
        'Sharding & Partitioning strategies',
        'Caching patterns & Redis architecture',
        'Message queues (Kafka, RabbitMQ, Azure Service Bus)',
        'Content Delivery Networks (CDNs)',
        'Object Storage (S3, Azure Blob)',
        'API Gateway & Service Discovery'
      ]
    },
    {
      phase: 3,
      title: 'Distributed Systems',
      desc: 'Tackling the hard realities of distributed coordination, network partitions, and data consistency.',
      items: [
        'Consistency models (Strong vs Eventual)',
        'Distributed transactions & 2PC',
        'Idempotency & Deduplication keys',
        'Retry policies with Exponential Backoff & Jitter',
        'Circuit Breaker pattern (Polly / Resilience4j)',
        'Rate limiting algorithms (Token bucket, Leaky bucket)',
        'Fault tolerance & graceful degradation',
        'Leader election (Raft / Paxos)',
        'Distributed locking (Redlock / ZooKeeper)',
        'Data replication conflict resolution'
      ]
    },
    {
      phase: 4,
      title: 'Practical Systems Design',
      desc: '14 classic high-level system design interview scenarios with step-by-step architectural blueprints.',
      items: [
        'URL Shortener (Bitly)',
        'Distributed Rate Limiter',
        'Notification System (Multi-channel push/email/SMS)',
        'Distributed File Storage (Google Drive / Dropbox)',
        'E-Commerce High-Volume Checkout',
        'Food Delivery Platform (Uber Eats / DoorDash)',
        'Ride Booking System (Uber / Lyft with Geo-matching)',
        'Real-Time Chat & Messaging (WhatsApp / Discord)',
        'Social Media Feed (Twitter / Instagram Fanout-on-write)',
        'Video Streaming Platform (YouTube / Netflix CDN)',
        'Payment Gateway & Ledger Processing (Stripe)',
        'High-Concurrency Ticket Booking System',
        'Distributed Job Scheduler',
        'Centralized Logging & Monitoring Pipeline (ELK / Prometheus)'
      ]
    },
    {
      phase: 5,
      title: 'Low-Level Design (LLD) in C# & .NET',
      desc: 'Object-oriented principles, design patterns, and clean architecture implementations in modern C#.',
      items: [
        'SOLID Principles applied to enterprise C#',
        'Creational Patterns (Factory, Builder, Singleton)',
        'Structural Patterns (Adapter, Decorator, Facade)',
        'Behavioral Patterns (Strategy, Observer, State, Chain of Responsibility)',
        'Dependency Injection & Service Lifetimes (Transient, Scoped, Singleton)',
        'Repository and Unit of Work Patterns with EF Core',
        'Clean Architecture / Onion Architecture folder structures',
        'Class diagrams, Interfaces and Domain Modeling in C#'
      ]
    }
  ];

  const interviewFramework = [
    { step: 1, name: 'Requirements Clarification', desc: 'Separate functional requirements (what it does) from non-functional requirements (scale, latency, availability, durability).' },
    { step: 2, name: 'Scale & Capacity Estimation', desc: 'Estimate Daily Active Users (DAU), Read vs Write ratio, Requests Per Second (RPS), throughput, storage requirements over 5 years.' },
    { step: 3, name: 'API Contract Design', desc: 'Define clean REST or gRPC endpoint contracts with request payloads, query parameters, idempotency headers, and HTTP status codes.' },
    { step: 4, name: 'Data Model & Storage Selection', desc: 'Design schemas, choose relational vs document vs key-value vs time-series, identify primary keys and indexing strategies.' },
    { step: 5, name: 'High-Level Architecture', desc: 'Draw end-to-end components: Clients → DNS/CDN → Load Balancer → API Gateway → Application Services → Cache → Database → Message Queue.' },
    { step: 6, name: 'Deep Dive into Critical Components', desc: 'Zoom into the highest-risk modules: unique ID generation, consistent hashing ring, caching policy, or queue consumer processing.' },
    { step: 7, name: 'Bottlenecks & Single Points of Failure', desc: 'Identify database write limits, memory bounds, hot partitions, network saturation, and SPOF components.' },
    { step: 8, name: 'Trade-offs & Justifications', desc: 'Explain CAP choices (AP vs CP), why Cache-Aside over Write-Through, SQL vs NoSQL, and latency vs consistency trade-offs.' },
    { step: 9, name: 'Resilience, Monitoring & Failure Modes', desc: 'Plan for network partitions, node crashes, circuit breakers, dead-letter queues, telemetry, and health check probes.' }
  ];

  return { phases, interviewFramework, rawMarkdown: raw };
}

console.log('Reading System Design Prep files from:', SOURCE_DIR);

const allQuestions = [];
const daysData = DAYS_META.map(meta => {
  const conceptRaw = readFileSync(join(SOURCE_DIR, meta.conceptFile), 'utf8');
  const answersRaw = readFileSync(join(SOURCE_DIR, meta.answersFile), 'utf8');
  const questions = extractQuestions(answersRaw, meta);
  allQuestions.push(...questions);

  return {
    ...meta,
    questionsCount: questions.length,
    conceptRaw,
    answersRaw,
    questions
  };
});

const roadmap = parseRoadmap();

const systemDesignData = {
  version: '1.0.0',
  title: 'System Design Interview Preparation Mastery',
  tagline: 'From Fundamentals to Distributed Architecture',
  description: 'A comprehensive, 6-day hands-on system design interview prep guide with 60 high-yield questions, architecture blueprints, C#/.NET enterprise examples, and 3D interactive flashcards.',
  totalDays: daysData.length,
  totalQuestions: allQuestions.length,
  categories: [
    'All Topics',
    'Fundamentals',
    'Scalability',
    'Databases',
    'Caching',
    'Message Queues',
    'API Design',
    'Architecture Framework'
  ],
  days: daysData,
  roadmap,
  allQuestions
};

// Write to src/data/system-design.json
writeFileSync(join(DATA_DIR, 'system-design.json'), JSON.stringify(systemDesignData, null, 2));

// Write lightweight client-side version to src/assets/system-design-data.json
const clientQuestions = allQuestions.map(q => ({
  id: q.id,
  day: q.day,
  dayTitle: q.dayTitle,
  daySlug: q.daySlug,
  qNum: q.qNum,
  index: q.index,
  title: q.title,
  category: q.category,
  takeaway: q.takeaway,
  verbalScript: q.verbalScript,
  rawBody: q.rawBody
}));

writeFileSync(join(ASSETS_DIR, 'system-design-data.json'), JSON.stringify({
  totalQuestions: allQuestions.length,
  totalDays: daysData.length,
  days: daysData.map(d => ({
    day: d.day,
    slug: d.slug,
    title: d.title,
    shortTitle: d.shortTitle,
    subtitle: d.subtitle,
    phase: d.phase,
    topics: d.topics,
    icon: d.icon,
    questionsCount: d.questionsCount
  })),
  questions: clientQuestions
}, null, 2));

console.log(`Successfully parsed ${daysData.length} days and ${allQuestions.length} questions!`);
console.log(`Saved src/data/system-design.json and src/assets/system-design-data.json`);
