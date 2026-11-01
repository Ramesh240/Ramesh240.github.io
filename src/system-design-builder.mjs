// src/system-design-builder.mjs
// Builder for System Design Interview Preparation pages

export function buildSystemDesignPages({
  page,
  layout,
  markdown,
  esc,
  slugify,
  systemDesign,
  SITE,
  BUILD_DATE
}) {
  const { days, roadmap, allQuestions, totalQuestions, categories } = systemDesign;

  /* ---------- Helpers ---------- */
  const tagList = (items) => `<ul class="tags">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

  function renderHero() {
    return `
<section class="sd-hero">
  <div class="wrap">
    <div class="sd-reading-col sd-hero-inner">
      <div class="status-pill" style="border-color: rgba(99, 102, 241, 0.4); background: rgba(99, 102, 241, 0.12); color: var(--primary-light);">
        <span class="pulse-dot" style="background: var(--primary-light);"></span>
        <span>6-Day Intensive Track &middot; 60 High-Yield Questions &middot; C# &amp; Azure Focus</span>
      </div>
      <h1>System Design <span class="gradient-text">Interview Mastery</span></h1>
      <p class="lede">
        A battle-tested, 6-day interview curriculum covering core mental models, horizontal scalability, database sharding, Redis caching, Kafka messaging, and REST API design — complete with verbal interview scripts, ASCII architecture blueprints, and an interactive 3D flashcard study engine.
      </p>

      <div class="actions" style="margin-top: 1.75rem; justify-content: center;">
        <a class="btn" href="/system-design/day-1/">
          <span>Start Day 1: Fundamentals</span>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
        <a class="btn-ghost sd-hub-tab-trigger" data-target-tab="flashcards" href="#flashcards">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <span>Interactive Flashcards (60)</span>
        </a>
        <a class="btn-ghost" href="/system-design/roadmap/">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          <span>5-Phase Roadmap</span>
        </a>
        <a class="btn-ghost sd-hub-tab-trigger" data-target-tab="questions" href="#questions">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span>Search Questions</span>
        </a>
      </div>

      <!-- Live Mastery Tracker Card -->
      <div class="sd-progress-card" id="sd-global-tracker" style="margin-top: 2.5rem; text-align: left;">
        <div class="sd-progress-header">
          <div>
            <span class="sd-tracker-pill">INTERVIEW READINESS TRACKER</span>
            <h2 style="font-size: 1.25rem; margin: 0.35rem 0 0.15rem 0;">Your Preparation Progress</h2>
            <p class="muted" style="font-size: 0.92rem; margin: 0;">Progress is automatically preserved in your browser.</p>
          </div>
          <div class="sd-progress-stats">
            <div class="sd-stat-box">
              <span class="sd-stat-val" id="sd-stat-mastered">0</span>
              <span class="sd-stat-lbl">/ 60 Mastered</span>
            </div>
            <div class="sd-stat-box">
              <span class="sd-stat-val" id="sd-stat-pct">0%</span>
              <span class="sd-stat-lbl">Readiness</span>
            </div>
          </div>
        </div>
        <div class="sd-progress-bar-wrap">
          <div class="sd-progress-bar">
            <div class="sd-progress-fill" id="sd-progress-fill" style="width: 0%;"></div>
          </div>
        </div>
        <div class="sd-progress-footer">
          <span class="muted" style="font-size: 0.85rem;" id="sd-days-completed-txt">0 of 6 Days Fully Mastered</span>
          <button type="button" class="sd-reset-btn" id="sd-reset-progress-btn" title="Reset your saved progress">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <span>Reset Progress</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  function renderHubTabs() {
    return `
<section style="padding-top: 1rem; padding-bottom: 0;">
  <div class="wrap">
    <div class="sd-hub-tab-bar" role="tablist" aria-label="System Design Study Modes">
      <button type="button" class="sd-hub-tab active" data-tab-id="curriculum" role="tab" aria-selected="true" aria-controls="panel-curriculum">
        <span class="sd-tab-icon">📚</span>
        <span>6-Day Curriculum</span>
      </button>
      <button type="button" class="sd-hub-tab" data-tab-id="flashcards" role="tab" aria-selected="false" aria-controls="panel-flashcards">
        <span class="sd-tab-icon">⚡</span>
        <span>3D Flashcards (60)</span>
      </button>
      <button type="button" class="sd-hub-tab" data-tab-id="questions" role="tab" aria-selected="false" aria-controls="panel-questions">
        <span class="sd-tab-icon">🔍</span>
        <span>Question Bank &amp; Search</span>
      </button>
      <button type="button" class="sd-hub-tab" data-tab-id="roadmap" role="tab" aria-selected="false" aria-controls="panel-roadmap">
        <span class="sd-tab-icon">🗺️</span>
        <span>Roadmap &amp; Framework</span>
      </button>
    </div>
  </div>
</section>`;
  }

  function renderDayCurriculumCards() {
    const cards = days.map((d) => `
      <article class="sd-day-card card">
        <div class="sd-day-card-header">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%;">
            <span class="sd-day-num-badge">DAY ${d.day}</span>
            <span class="sd-phase-pill">${esc(d.phase)}</span>
          </div>
          <h2 style="font-size: 1.35rem; margin: 0.75rem 0 0.35rem 0;">
            <a href="/system-design/${d.slug}/" style="color: inherit; text-decoration: none;">${esc(d.title)}</a>
          </h2>
          <p class="muted" style="font-size: 0.95rem; margin: 0; line-height: 1.55;">${esc(d.subtitle)}</p>
        </div>

        <div class="sd-day-card-topics">
          ${tagList(d.topics)}
        </div>

        <div class="sd-day-card-footer">
          <div class="sd-day-progress-indicator" data-day-progress="${d.day}">
            <span class="sd-mini-dot"></span>
            <span class="sd-day-progress-text" data-day-txt="${d.day}">0 / ${d.questionsCount} Mastered</span>
          </div>
          <div class="sd-day-card-actions">
            <a class="btn" href="/system-design/${d.slug}/" style="padding: 0.55rem 1.15rem; font-size: 0.9rem;">
              <span>Study Day ${d.day}</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </a>
            <a class="btn-ghost" href="/system-design/${d.slug}/#questions" style="padding: 0.55rem 0.95rem; font-size: 0.9rem;">
              <span>10 Q&amp;As</span>
            </a>
          </div>
        </div>
      </article>
    `).join('\n');

    return `
<div class="sd-tab-panel active" id="panel-curriculum" role="tabpanel">
  <section>
    <div class="wrap">
      <div class="section-head sd-centered-head">
        <h2>Day-by-Day Engineering Curriculum</h2>
        <p>Work through the track in order, or jump directly into any architecture topic.</p>
      </div>
      <div class="sd-curriculum-container">
        <div class="grid grid-2" style="gap: 1.5rem;">
          ${cards}
        </div>
      </div>
    </div>
  </section>
</div>`;
  }

  function renderFlashcardWidget() {
    const dayOptions = days.map((d) => `<option value="${d.day}">Day ${d.day}: ${esc(d.shortTitle)} (10)</option>`).join('');

    return `
<div class="sd-tab-panel" id="panel-flashcards" role="tabpanel">
  <section>
    <div class="wrap">
      <div class="section-head" style="text-align: center; max-width: 48rem; margin: 0 auto 2rem auto;">
        <h2>Interactive 3D Flashcard Engine</h2>
        <p>Test your verbal recall and architecture intuition. Flip each card to inspect the concise interview delivery script.</p>
      </div>

      <!-- Flashcard Deck Controls -->
      <div class="sd-deck-toolbar">
        <div class="sd-deck-filter-group">
          <label for="sd-fc-day-select" class="sd-toolbar-label">Select Deck:</label>
          <select id="sd-fc-day-select" class="sd-select-input">
            <option value="all">Complete Bank: All 60 Cards</option>
            ${dayOptions}
          </select>
        </div>

        <div class="sd-deck-filter-group">
          <label class="sd-checkbox-label">
            <input type="checkbox" id="sd-fc-unmastered-only">
            <span>Only Unmastered Cards (<span id="sd-fc-unmastered-count">60</span> remaining)</span>
          </label>
        </div>

        <div class="sd-deck-actions-group">
          <button type="button" class="btn-ghost" id="sd-fc-shuffle-btn" title="Shuffle Cards">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4h4l4 6-4 6H4m16 0h-4l-4-6 4-6h4M4 4l16 16M4 20L20 4"/></svg>
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      <!-- 3D Flashcard Stage -->
      <div class="sd-fc-stage-container">
        <div class="sd-fc-stage" id="sd-fc-card" tabindex="0" role="region" aria-label="System design interview flashcard" data-flipped="false">
          <div class="sd-fc-inner">
            
            <!-- Front Face -->
            <div class="sd-fc-face sd-fc-front">
              <div class="sd-fc-face-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="sd-fc-day-pill" id="sd-fc-day-pill">Day 1</span>
                  <span class="sd-fc-qnum-pill" id="sd-fc-qnum-pill">Q1</span>
                  <span class="sd-fc-category-pill" id="sd-fc-cat-pill">Fundamentals</span>
                </div>
                <div class="sd-fc-status-indicator" id="sd-fc-status-badge">
                  <span>UNMASTERED</span>
                </div>
              </div>

              <div class="sd-fc-question-body">
                <h3 class="sd-fc-question-text" id="sd-fc-question-txt">Loading question...</h3>
                <div class="sd-fc-hint-box" id="sd-fc-hint-wrap">
                  <span class="sd-fc-hint-label">Topic Focus:</span>
                  <span class="sd-fc-hint-content" id="sd-fc-hint-txt">...</span>
                </div>
              </div>

              <div class="sd-fc-face-footer">
                <div class="sd-fc-flip-prompt">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  <span>Click card or press <strong>Space</strong> to reveal interview answer</span>
                </div>
              </div>
            </div>

            <!-- Back Face -->
            <div class="sd-fc-face sd-fc-back">
              <div class="sd-fc-face-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="sd-fc-day-pill" id="sd-fc-back-day-pill">Day 1</span>
                  <span class="sd-fc-qnum-pill" id="sd-fc-back-qnum-pill">Q1</span>
                </div>
                <span class="sd-fc-back-badge">INTERVIEW ANSWER</span>
              </div>

              <div class="sd-fc-answer-body">
                <!-- Verbal Script Callout -->
                <div class="sd-fc-verbal-callout">
                  <div class="sd-fc-verbal-badge">Say this out loud:</div>
                  <p class="sd-fc-verbal-text" id="sd-fc-verbal-txt">...</p>
                </div>

                <div class="sd-fc-deepdive-wrap" id="sd-fc-deepdive-txt">
                  <!-- Injected formatted explanation -->
                </div>
              </div>

              <div class="sd-fc-face-footer">
                <button type="button" class="sd-fc-flip-back-btn" id="sd-fc-flip-back">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  <span>Flip back to question</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Navigation & Mastery Action Bar -->
      <div class="sd-fc-action-bar">
        <button type="button" class="btn-ghost" id="sd-fc-prev-btn" aria-label="Previous card">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          <span>Previous</span>
        </button>

        <button type="button" class="btn" id="sd-fc-flip-btn">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span>Flip (Space)</span>
        </button>

        <button type="button" class="btn-ghost sd-fc-master-btn" id="sd-fc-master-btn">
          <svg class="sd-star-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          <span id="sd-fc-master-txt">Mark Mastered (M)</span>
        </button>

        <button type="button" class="btn-ghost" id="sd-fc-next-btn" aria-label="Next card">
          <span>Next</span>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div class="sd-fc-counter-wrap">
        <span class="sd-fc-counter-badge" id="sd-fc-counter-badge">Card 1 of 60</span>
        <span class="sd-fc-keyboard-hints">Keyboard shortcuts: <strong>&larr; / &rarr;</strong> Navigate &middot; <strong>Space</strong> Flip &middot; <strong>M</strong> Toggle Mastered</span>
      </div>

    </div>
  </section>
</div>`;
  }

  function renderSearchBank() {
    const categoryButtons = categories.map((cat, i) => `
      <button type="button" class="sd-cat-pill${i === 0 ? ' active' : ''}" data-cat="${esc(cat)}">
        ${esc(cat)}
      </button>
    `).join('');

    const questionItems = allQuestions.map((q) => `
      <div class="sd-q-item" data-id="${q.id}" data-day="${q.day}" data-category="${esc(q.category)}">
        <div class="sd-q-header">
          <button type="button" class="sd-q-toggle-btn" aria-expanded="false" aria-controls="ans-${q.id}">
            <div class="sd-q-meta">
              <span class="sd-q-num">DAY ${q.day} &middot; ${q.qNum}</span>
              <span class="sd-q-cat">${esc(q.category)}</span>
            </div>
            <h3 class="sd-q-title">${esc(q.title)}</h3>
            <svg class="sd-q-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <button type="button" class="sd-q-master-chk" data-master-id="${q.id}" title="Toggle mastered status" aria-label="Toggle mastered status for ${esc(q.qNum)}">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
        <div class="sd-q-body" id="ans-${q.id}" hidden>
          <div class="sd-q-takeaway-box">
            <span class="sd-q-takeaway-lbl">Quick Interview Script:</span>
            <p class="sd-q-takeaway-p">${esc(q.takeaway)}</p>
          </div>
          <div class="sd-q-content prose">
            ${markdown(q.rawBody)}
          </div>
          <div class="sd-q-actions">
            <button type="button" class="btn-ghost sd-q-copy-btn" data-copy-id="${q.id}">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
              <span>Copy Answer</span>
            </button>
            <a class="btn-link" href="/system-design/${q.daySlug}/#ans-${q.id}">View in Day ${q.day} context &rarr;</a>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
<div class="sd-tab-panel" id="panel-questions" role="tabpanel">
  <section>
    <div class="wrap">
      <div class="section-head sd-centered-head">
        <h2>Complete Question Bank &amp; Search Matrix</h2>
        <p>Instant full-text search across all 60 interview questions, architectural answers, and C# examples.</p>
      </div>

      <div class="sd-reading-col">
        <!-- Search Input & Filters -->
        <div class="sd-search-container">
          <div class="sd-search-box">
            <svg class="sd-search-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="search" id="sd-search-input" class="sd-search-field" placeholder="Search keywords (e.g. CAP theorem, sharding, redis, token bucket, kafka)..." autocomplete="off">
            <button type="button" id="sd-search-clear" class="sd-search-clear-btn" aria-label="Clear search" hidden>&times;</button>
          </div>

          <div class="sd-cat-pills-bar">
            ${categoryButtons}
          </div>

          <div class="sd-search-stats-bar">
            <span id="sd-search-count-txt">Showing all 60 questions</span>
            <button type="button" class="btn-link" id="sd-toggle-all-expand">Expand all answers</button>
          </div>
        </div>

        <!-- Question Accordion List -->
        <div class="sd-q-list" id="sd-q-container">
          ${questionItems}
        </div>
      </div>

    </div>
  </section>
</div>`;
  }

  function renderRoadmapOverview() {
    const phaseCards = roadmap.phases.map((p) => `
      <div class="card sd-phase-card">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span class="sd-phase-pill">PHASE ${p.phase}</span>
          <span class="muted" style="font-size: 0.8rem; font-family: var(--font-mono);">${p.items.length} Modules</span>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.4rem;">${esc(p.title)}</h3>
        <p class="muted" style="font-size: 0.92rem; line-height: 1.55; margin-bottom: 1rem;">${esc(p.desc)}</p>
        <ul class="sd-phase-item-list">
          ${p.items.slice(0, 5).map((item) => `<li><span class="sd-check-icon">&check;</span><span>${esc(item)}</span></li>`).join('')}
        </ul>
        ${p.items.length > 5 ? `<p class="muted" style="font-size: 0.85rem; margin: 0.75rem 0 0 0;">+ ${p.items.length - 5} more topics</p>` : ''}
      </div>
    `).join('\n');

    const frameworkSteps = roadmap.interviewFramework.map((s) => `
      <div class="sd-framework-step">
        <div class="sd-framework-step-num">${s.step}</div>
        <div class="sd-framework-step-content">
          <h4>${esc(s.name)}</h4>
          <p class="muted" style="font-size: 0.9rem; margin: 0;">${esc(s.desc)}</p>
        </div>
      </div>
    `).join('\n');

    return `
<div class="sd-tab-panel" id="panel-roadmap" role="tabpanel">
  <section>
    <div class="wrap">
      <div class="section-head sd-centered-head">
        <h2>5-Phase System Design Roadmap</h2>
        <p>A systematic progression from engineering foundations to distributed systems and C# Low-Level Design.</p>
      </div>
      <div class="sd-curriculum-container">
        <div class="grid grid-3" style="gap: 1.5rem;">
          ${phaseCards}
        </div>
        <div class="actions" style="margin-top: 1.75rem; justify-content: center;">
          <a class="btn" href="/system-design/roadmap/">Explore Full 5-Phase Roadmap &amp; Systems &rarr;</a>
        </div>
      </div>
    </div>
  </section>

  <section style="padding-top: 1rem;">
    <div class="wrap">
      <div class="sd-reading-col">
        <div class="card" style="border-top: 4px solid var(--accent-amber); padding: 2rem;">
          <div class="section-head sd-centered-head" style="margin-bottom: 1.5rem;">
            <span class="status-pill" style="margin-bottom: 0.5rem; background: var(--accent-amber-subtle); color: var(--accent-amber); border-color: rgba(245, 158, 11, 0.3);">
              REPEATED INTERVIEW TEMPLATE
            </span>
            <h3 style="font-size: 1.45rem;">The 9-Step Interview Framework</h3>
            <p class="muted">Never memorize diagrams. Approach any unfamiliar system design question using this structured sequence.</p>
          </div>
          <div class="sd-framework-grid">
            ${frameworkSteps}
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`;
  }

  /* ==========================================================================
     PAGE 1: /system-design/ (Main Portal Hub)
     ========================================================================== */
  const hubBody = `
${renderHero()}
${renderHubTabs()}
${renderDayCurriculumCards()}
${renderFlashcardWidget()}
${renderSearchBank()}
${renderRoadmapOverview()}
<script>
  window.__SD_QUESTIONS__ = ${JSON.stringify(allQuestions.map(q => ({
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
    htmlAnswer: markdown(q.rawBody)
  })))};
</script>
`;

  page('/system-design/', {
    title: 'System Design Interview Mastery: 6 Days · 60 Questions · Flashcards',
    description: 'A comprehensive 6-day system design interview prep guide with 60 high-yield questions, verbal scripts, architecture blueprints, C#/.NET enterprise context, and 3D interactive flashcards.',
    body: hubBody,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'System Design Interview Mastery',
      description: 'Structured 6-day system design interview preparation curriculum covering scalability, database sharding, caching, message queues, and API design.',
      provider: {
        '@type': 'Person',
        name: 'Ramesh Mangalagiri',
        url: SITE
      }
    }
  }, BUILD_DATE);

  /* ==========================================================================
     PAGES 2-7: /system-design/day-1/ through /system-design/day-6/
     ========================================================================== */
  days.forEach((d, idx) => {
    const prevDay = idx > 0 ? days[idx - 1] : null;
    const nextDay = idx < days.length - 1 ? days[idx + 1] : null;

    // Render questions for this day
    const dayQuestionsHtml = d.questions.map((q) => `
      <div class="sd-q-item" data-id="${q.id}" id="ans-${q.id}">
        <div class="sd-q-header">
          <button type="button" class="sd-q-toggle-btn" aria-expanded="false" aria-controls="content-${q.id}">
            <div class="sd-q-meta">
              <span class="sd-q-num">${q.qNum}</span>
              <span class="sd-q-cat">${esc(q.category)}</span>
            </div>
            <h3 class="sd-q-title">${esc(q.title)}</h3>
            <svg class="sd-q-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <button type="button" class="sd-q-master-chk" data-master-id="${q.id}" title="Toggle mastered status" aria-label="Toggle mastered status for ${esc(q.qNum)}">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
        <div class="sd-q-body" id="content-${q.id}" hidden>
          <div class="sd-q-takeaway-box">
            <span class="sd-q-takeaway-lbl">Interview-Ready Answer Script:</span>
            <p class="sd-q-takeaway-p">${esc(q.takeaway)}</p>
          </div>
          <div class="sd-q-content prose">
            ${markdown(q.rawBody)}
          </div>
          <div class="sd-q-actions">
            <button type="button" class="btn-ghost sd-q-copy-btn" data-copy-id="${q.id}">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
              <span>Copy Answer</span>
            </button>
          </div>
        </div>
      </div>
    `).join('\n');

    const dayBody = `
<section class="page-head sd-day-hero">
  <div class="wrap">
    <div class="sd-reading-col sd-day-hero-inner">
      <p class="crumbs">
        <a href="/system-design/">System Design</a> / 
        <a href="/system-design/">Curriculum</a> / 
        Day ${d.day}
      </p>
      <div class="sd-day-badge-row">
        <span class="sd-day-num-badge">DAY ${d.day}</span>
        <span class="sd-phase-pill">${esc(d.phase)}</span>
        <span class="sd-time-pill">${esc(d.readTime)}</span>
        <span class="sd-day-progress-pill" data-day-txt="${d.day}">0 / ${d.questionsCount} Mastered</span>
      </div>
      <h1 class="sd-day-title">${esc(d.title)}</h1>
      <p class="lede sd-day-subtitle">${esc(d.subtitle)}</p>

      <div class="sd-day-subtabs-bar" role="tablist">
        <button type="button" class="sd-day-tab active" data-day-tab="concept" role="tab" aria-selected="true" aria-controls="day-panel-concept">
          <span>📖 Core Concepts &amp; Architecture</span>
        </button>
        <button type="button" class="sd-day-tab" data-day-tab="questions" role="tab" aria-selected="false" aria-controls="day-panel-questions">
          <span>🎯 10 Interview Questions</span>
        </button>
        <button type="button" class="sd-day-tab" data-day-tab="flashcards" role="tab" aria-selected="false" aria-controls="day-panel-flashcards">
          <span>⚡ 10-Card Flashcard Drill</span>
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Panel 1: Concept & Architecture Guide -->
<div class="sd-day-panel active" id="day-panel-concept" role="tabpanel">
  <section style="padding-top: 1.5rem;">
    <div class="wrap">
      <div class="sd-reading-col">
        <article class="prose sd-concept-prose">
          ${markdown(d.conceptRaw)}
        </article>
      </div>
    </div>
  </section>
</div>

<!-- Panel 2: 10 Interview Questions & Answers -->
<div class="sd-day-panel" id="day-panel-questions" role="tabpanel">
  <section style="padding-top: 1.5rem;">
    <div class="wrap">
      <div class="section-head sd-centered-head">
        <h2>Day ${d.day} Interview Questions &amp; Answers</h2>
        <p>Real-world verbal answers designed to articulate clearly in high-stakes technical interviews.</p>
      </div>
      <div class="sd-reading-col">
        <div class="sd-q-list">
          ${dayQuestionsHtml}
        </div>
      </div>
    </div>
  </section>
</div>

<!-- Panel 3: 10-Card Flashcard Drill for this Day -->
<div class="sd-day-panel" id="day-panel-flashcards" role="tabpanel">
  <section style="padding-top: 1.5rem;">
    <div class="wrap">
      <div class="section-head sd-centered-head" style="margin-bottom: 2rem;">
        <h2>Day ${d.day} Flashcard Drill</h2>
        <p>Practice these 10 questions using 3D interactive flashcards. Click or press Space to flip.</p>
      </div>
      
      <!-- Mini Flashcard Stage for this day -->
      <div class="sd-reading-col">
        <div class="sd-day-fc-wrapper" data-day-filter="${d.day}">
          <div class="sd-fc-stage-container">
            <div class="sd-fc-stage" id="sd-day-fc-card" tabindex="0" data-flipped="false">
              <div class="sd-fc-inner">
                <div class="sd-fc-face sd-fc-front">
                  <div class="sd-fc-face-header">
                    <span class="sd-fc-day-pill">Day ${d.day}</span>
                    <span class="sd-fc-qnum-pill" id="sd-day-fc-qnum">Q1</span>
                    <span class="sd-fc-status-indicator" id="sd-day-fc-status">UNMASTERED</span>
                  </div>
                  <div class="sd-fc-question-body">
                    <h3 class="sd-fc-question-text" id="sd-day-fc-qtxt">Loading question...</h3>
                  </div>
                  <div class="sd-fc-face-footer">
                    <div class="sd-fc-flip-prompt">Click or press Space to reveal answer &rarr;</div>
                  </div>
                </div>
                <div class="sd-fc-face sd-fc-back">
                  <div class="sd-fc-face-header">
                    <span class="sd-fc-day-pill">Day ${d.day}</span>
                    <span class="sd-fc-back-badge">VERBAL ANSWER</span>
                  </div>
                  <div class="sd-fc-answer-body">
                    <div class="sd-fc-verbal-callout">
                      <p class="sd-fc-verbal-text" id="sd-day-fc-atxt">...</p>
                    </div>
                    <div class="sd-fc-deepdive-wrap" id="sd-day-fc-deepdive"></div>
                  </div>
                  <div class="sd-fc-face-footer">
                    <button type="button" class="sd-fc-flip-back-btn" id="sd-day-fc-flipback">&larr; Flip back to question</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="sd-fc-action-bar">
            <button type="button" class="btn-ghost" id="sd-day-fc-prev">&larr; Previous</button>
            <button type="button" class="btn" id="sd-day-fc-flip">Flip (Space)</button>
            <button type="button" class="btn-ghost sd-fc-master-btn" id="sd-day-fc-master">⭐ Mark Mastered (M)</button>
            <button type="button" class="btn-ghost" id="sd-day-fc-next">Next &rarr;</button>
          </div>

          <div class="sd-fc-counter-wrap">
            <span class="sd-fc-counter-badge" id="sd-day-fc-counter">Card 1 of 10</span>
          </div>
        </div>
      </div>

    </div>
  </section>
</div>

<!-- Bottom Navigation Bar -->
<section style="padding-top: 2rem; border-top: 1px solid var(--border-subtle); margin-top: 3rem;">
  <div class="wrap">
    <div class="sd-reading-col">
      <div class="sd-bottom-nav">
        ${prevDay ? `
          <a class="btn-ghost" href="/system-design/${prevDay.slug}/">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            <span>Day ${prevDay.day}: ${esc(prevDay.shortTitle)}</span>
          </a>
        ` : `
          <a class="btn-ghost" href="/system-design/">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>All Days</span>
          </a>
        `}

        <a class="btn" href="/system-design/">System Design Portal</a>

        ${nextDay ? `
          <a class="btn" href="/system-design/${nextDay.slug}/">
            <span>Day ${nextDay.day}: ${esc(nextDay.shortTitle)}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
        ` : `
          <a class="btn" href="/system-design/roadmap/">
            <span>5-Phase Roadmap</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
        `}
      </div>
    </div>
  </div>
</section>
<script>
  window.__SD_DAY_QUESTIONS__ = ${JSON.stringify(d.questions.map(q => ({
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
    htmlAnswer: markdown(q.rawBody)
  })))};
</script>
`;

    page(`/system-design/${d.slug}/`, {
      title: `Day ${d.day}: ${d.title} | System Design Interview Prep`,
      description: d.subtitle,
      body: dayBody,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: `Day ${d.day}: ${d.title}`,
        description: d.subtitle,
        author: { '@type': 'Person', name: 'Ramesh Mangalagiri', url: SITE }
      }
    }, BUILD_DATE);
  });

  /* ==========================================================================
     PAGE 8: /system-design/roadmap/ (Full 5-Phase Roadmap)
     ========================================================================== */
  const fullPhasesHtml = roadmap.phases.map((p) => `
    <div class="card sd-roadmap-phase-box" style="margin-bottom: 2rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem;">
        <span class="status-pill" style="margin: 0; background: var(--primary-subtle); color: var(--primary-light); border-color: rgba(99, 102, 241, 0.3);">
          PHASE ${p.phase}
        </span>
        <span class="muted" style="font-family: var(--font-mono); font-size: 0.85rem;">${p.items.length} Modules</span>
      </div>
      <h2 style="font-size: 1.6rem; margin: 0 0 0.5rem 0;">${esc(p.title)}</h2>
      <p class="muted" style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.25rem;">${esc(p.desc)}</p>
      
      <div class="grid grid-2" style="gap: 0.75rem;">
        ${p.items.map((item, idx) => `
          <div class="sd-roadmap-item-row">
            <span class="sd-check-icon">&check;</span>
            <span style="font-weight: 500;">${esc(item)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('\n');

  const fullFrameworkHtml = roadmap.interviewFramework.map((s) => `
    <div class="sd-framework-step" style="padding: 1.25rem 1.5rem;">
      <div class="sd-framework-step-num" style="width: 38px; height: 38px; font-size: 1.1rem;">${s.step}</div>
      <div class="sd-framework-step-content">
        <h3 style="font-size: 1.15rem; margin-bottom: 0.25rem;">${esc(s.name)}</h3>
        <p class="muted" style="font-size: 0.92rem; margin: 0; line-height: 1.5;">${esc(s.desc)}</p>
      </div>
    </div>
  `).join('\n');

  const roadmapBody = `
<section class="page-head sd-roadmap-hero">
  <div class="wrap">
    <div class="sd-reading-col sd-day-hero-inner">
      <p class="crumbs"><a href="/system-design/">System Design</a> / Roadmap</p>
      <h1 class="sd-roadmap-title">System Design Interview Roadmap (Phases 1–5)</h1>
      <p class="lede sd-roadmap-subtitle">A battle-tested engineering blueprint covering fundamental mental models, distributed building blocks, 14 classic system designs, and Low-Level Design (LLD) in C# / .NET.</p>
      
      <div class="actions" style="margin-top: 1.75rem; justify-content: center;">
        <a class="btn" href="/system-design/">Explore Day-by-Day Curriculum</a>
        <a class="btn-ghost" href="/system-design/day-1/">Start Day 1</a>
      </div>
    </div>
  </div>
</section>

<!-- The 9-Step Framework Highlight -->
<section style="padding-top: 0;">
  <div class="wrap">
    <div class="sd-reading-col">
      <div class="card" style="border: 2px solid var(--accent-amber); background: linear-gradient(135deg, var(--bg-surface-elevated), var(--accent-amber-subtle)); padding: 2rem; box-shadow: var(--shadow-lg);">
        <div class="section-head sd-centered-head" style="margin-bottom: 1.5rem;">
          <span class="status-pill" style="margin-bottom: 0.5rem; background: var(--accent-amber); color: #000000; font-weight: 800;">
            THE INTERVIEW ENGINE
          </span>
          <h2 style="font-size: 1.45rem;">The Universal 9-Step Interview Sequence</h2>
          <p class="muted" style="font-size: 0.98rem;">
            Avoid jumping straight to diagrams. Follow this repeatable framework to address ambiguity, calculate constraints, and defend engineering trade-offs systematically.
          </p>
        </div>
        <div class="sd-framework-grid">
          ${fullFrameworkHtml}
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 5-Phase Detailed Curriculum -->
<section>
  <div class="wrap">
    <div class="section-head sd-centered-head">
      <h2>Complete 5-Phase Curriculum Breakdown</h2>
      <p>Master each tier to build confidence across both High-Level Design (HLD) and Low-Level Design (LLD).</p>
    </div>
    <div class="sd-reading-col">
      ${fullPhasesHtml}
    </div>
  </div>
</section>

<!-- 14 Practical Systems Callout -->
<section style="padding-top: 1rem;">
  <div class="wrap">
    <div class="sd-reading-col">
      <div class="card" style="border-top: 4px solid var(--primary-light); padding: 2rem;">
        <h2 style="font-size: 1.45rem; margin-bottom: 0.5rem; text-align: center;">How We Study Each Day</h2>
        <p class="muted" style="line-height: 1.6; font-size: 1rem; text-align: center;">
          For each system design scenario, every day delivers:
        </p>
        <div class="grid grid-3" style="gap: 1.25rem; margin-top: 1.25rem;">
          <div class="card" style="padding: 1.25rem;"><strong style="color: var(--primary-light);">📚 Concepts:</strong> Deep mental models and failure modes.</div>
          <div class="card" style="padding: 1.25rem;"><strong style="color: var(--accent-amber);">🏗️ Blueprints:</strong> Scalable ASCII component flow diagrams.</div>
          <div class="card" style="padding: 1.25rem;"><strong style="color: var(--accent-emerald);">💻 C# / Azure:</strong> Real enterprise code patterns and cloud SDKs.</div>
          <div class="card" style="padding: 1.25rem;"><strong style="color: #8b5cf6;">❓ 10 Q&amp;As:</strong> Concise verbal takeaways you can say out loud.</div>
          <div class="card" style="padding: 1.25rem;"><strong style="color: #ec4899;">🎯 Design Exercise:</strong> Hands-on capacity estimation and API contracts.</div>
          <div class="card" style="padding: 1.25rem;"><strong style="color: #06b6d4;">🔥 Follow-ups:</strong> Trade-offs, SPOFs, and edge-case mitigations.</div>
        </div>
        <div class="actions" style="margin-top: 2rem; justify-content: center;">
          <a class="btn" href="/system-design/day-1/">Start Day 1: System Design Fundamentals &rarr;</a>
          <a class="btn-ghost" href="/system-design/">Back to Portal</a>
        </div>
      </div>
    </div>
  </div>
</section>
`;

  page('/system-design/roadmap/', {
    title: 'System Design Interview Roadmap (Phases 1–5) | 14 Systems & LLD in C#',
    description: 'A 5-phase interview preparation roadmap with 14 practical systems, the 9-step interview framework, and C# / .NET Low-Level Design (LLD) patterns.',
    body: roadmapBody,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'System Design Interview Roadmap (Phases 1–5)',
      description: 'A 5-phase roadmap with 14 practical systems, the 9-step framework, and C# Low-Level Design.',
      author: { '@type': 'Person', name: 'Ramesh Mangalagiri', url: SITE }
    }
  }, BUILD_DATE);
}
