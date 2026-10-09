---
title: What building an interview Anki deck taught me about learning
date: 2026-10-02
description: Lessons from writing 390+ flashcards for full-stack .NET, React and Azure interviews: one idea per card, answers in your own words, and why a deck is not the same as understanding.
tags: Learning, Interviews, Anki
---

I built a deck of more than 390 flashcards for full-stack .NET, React and Azure interviews. I expected it to teach me the material. It taught me more about how to learn.

## One idea per card

My first cards were long. "Explain dependency injection in ASP.NET Core" was a paragraph on the front and a paragraph on the back, and I rated myself "good" if I remembered half of it. That is not a test; it is a hope.

Splitting it worked better:

- What problem does dependency injection solve?
- What is the difference between transient, scoped and singleton lifetimes?
- Which lifetime would you give a `DbContext`, and why?

Each of those has an answer short enough to check honestly.

## Write the answer in your own words

Copying a definition from the documentation makes a card that looks good and teaches nothing. When I rewrote answers in my own words, I found the places where I did not actually understand the topic. The card was a diagnosis before it was a revision aid.

## Cards should be quick to review on a phone

Most reviews happen in short gaps: a queue, a commute, a break. So the cards had to be readable on a small screen, with short questions, clear formatting and no wall of text. Mobile-friendly design is a learning feature, because a card you can review in 20 seconds gets reviewed.

## Turn mistakes into cards

Whenever I got a mock-interview answer wrong or hit a bug I did not expect, I wrote a card about it the same day. Those cards were the most valuable ones, because they covered exactly what I did not know yet, in the context where it mattered.

## A deck is not understanding

Spaced repetition is excellent at keeping facts available. It does not teach you how to design an API, debug a slow query or decide between two architectures. For that, you have to build things and read other people's code. I use cards for the vocabulary and the "why", and projects for the judgment.

## Make the habit smaller than your motivation

A daily review of a modest number of cards beats a heroic weekend session. The goal is to make the habit so small that it still happens on a bad day.

If you want the deck, it is free on GitHub, and the card-writing rules above are the real takeaway: short questions, your own words, and a card for every mistake.
