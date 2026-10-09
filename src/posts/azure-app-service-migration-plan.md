---
title: How I would plan an Azure App Service migration for a legacy .NET app
date: 2026-10-06
description: A practical checklist for moving an older .NET application to Azure App Service: inventory first, then configuration, identity, data, cutover and rollback.
tags: Azure, .NET, Cloud migration
---

I have worked on server migrations for an enterprise platform and written a feasibility study for moving legacy applications to Azure App Service. The technology is the easy part. Most surprises come from things nobody wrote down. This is the order I would work in.

## 1. Inventory before anything else

List every moving part of the application, not only the web project:

- Runtime and framework version (.NET Framework or modern .NET)
- Databases, queues, file shares and scheduled jobs
- Outbound calls to other systems, and who calls the app
- Certificates, DNS names and firewall rules
- Anything stored on the local disk of the old server

The last item catches the most migrations. App Service instances can be replaced at any time, so local files must move to storage that outlives the instance.

## 2. Check compatibility early

Microsoft provides an App Service migration assistant that scans a web app and reports blockers. Run it on day one, not week six. Typical findings are Windows features that App Service does not support, hard-coded machine paths, and libraries tied to a specific framework version.

## 3. Move configuration and secrets out of the code

Connection strings and keys belong in App Service application settings, and secrets belong in Azure Key Vault with a managed identity to read them. Do this before the migration so that environment differences become settings changes, not code changes.

## 4. Handle identity deliberately

If the app uses single sign-on, such as SAML through an identity provider, the callback URLs change when the host name changes. Register the new URLs ahead of cutover and test sign-in on a staging slot. A working application with a broken login is still an outage.

## 5. Decide what happens to the database

There are two honest options: move the database to Azure as well, or leave it where it is and connect across a secured network path. Moving both reduces latency but is a larger change. Leaving it is safer for a first step but adds network distance to every query, so measure response times before deciding.

## 6. Use deployment slots for the cutover

A staging slot lets you deploy and warm up the new version, run smoke tests against it, and then swap it into production. If something is wrong, you swap back. Pair that with a lowered DNS time-to-live a day before cutover so that traffic moves quickly.

## 7. Add monitoring before users arrive

Turn on Application Insights, set alerts for failures and slow responses, and agree on what a healthy day looks like. After a migration the first question is always whether it is behaving normally.

## 8. Count the cost honestly

Pick the App Service plan tier from measured load, not from a guess, and account for the database, storage, monitoring and outbound data. A feasibility study should show the monthly cost next to the old server's cost, including the maintenance time that the old server consumed.

## 9. Write the runbook while you learn

Document each step, each setting, and the rollback plan as you go. On past migrations, a clear runbook cut onboarding effort for the next person by about 40%, and it is the document everyone is glad to have at 2 a.m.

None of this is exotic. A migration goes well when the inventory is complete, the cutover is rehearsed, and rolling back is as easy as moving forward.
