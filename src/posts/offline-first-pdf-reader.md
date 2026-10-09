---
title: Building an offline-first PDF reader with IndexedDB and a service worker
date: 2026-10-09
description: How Foliant stays usable on a train with no signal: a service worker for the app shell, IndexedDB for the library, and a few habits that keep both honest.
tags: PWA, JavaScript, IndexedDB
---

A reading app that needs a connection is a reading app that fails on a commute. When I started building Foliant, which turns a PDF into an interactive book, offline support was a starting requirement, not a feature to add later. Here is the shape of the approach.

## Two kinds of data, two homes

An offline-first app has two different things to keep on the device, and they need different tools.

- **The app itself** (HTML, JavaScript, CSS, icons). A service worker caches these so the app opens with no network.
- **The user's data** (PDFs, highlights, reading position, flashcards). IndexedDB stores these, because it handles large binary blobs and structured records, and it does not block the page the way `localStorage` can.

Mixing the two up is the most common mistake. Caching a user's 80 MB PDF in the service worker cache makes it hard to query and hard to delete; keeping the app shell in IndexedDB makes startup slow.

## The app shell

A simplified service worker looks like this:

```js
const CACHE = 'shell-v1';
const SHELL = ['/', '/app.js', '/styles.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
```

Two details matter. First, the cache name carries a version, and the `activate` step deletes older caches, so users do not keep stale files forever. Second, only `GET` requests are answered from the cache.

## The library

IndexedDB is verbose, so I keep the schema small and wrap it once:

```js
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('library', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('books', { keyPath: 'id' });
      db.createObjectStore('highlights', { keyPath: 'id' })
        .createIndex('bookId', 'bookId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
```

A book record holds its metadata and the PDF as a `Blob`. Highlights live in their own store with an index on `bookId`, so loading one book's highlights never scans the rest. PDF.js then renders pages straight from the stored data, with no server involved.

## Habits that keep it honest

1. **Test in airplane mode.** Not once, but as part of every release. Offline bugs hide until the network disappears.
2. **Ask the browser to keep your data.** Calling `navigator.storage.persist()` reduces the chance that storage is cleared under pressure.
3. **Plan for schema changes.** Every change to the stores goes through a version bump in `onupgradeneeded`, so existing libraries upgrade instead of breaking.
4. **Tell users where their data lives.** Foliant keeps documents on the device and uploads nothing, which is also why its privacy policy is short.

## What I would do next

Export and import for the whole library, so a user can move their books and highlights to a new phone without a server in the middle. It is the natural next step for an app that deliberately has no accounts.

If you are building something similar, start with the split between app shell and user data. Most of the rest follows from it.
