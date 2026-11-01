// rameshm.com — Client Interaction Engine
// Theme switcher, 3D flip cards, mobile drawer, copy-to-clipboard toast, skills filter, and back-to-top

(function () {
  'use strict';

  /* ---------- Theme Switcher ---------- */
  function initTheme() {
    var themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    function getSystemScheme() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getCurrentScheme() {
      var stored = localStorage.getItem('color-scheme');
      return stored ? stored : getSystemScheme();
    }

    function applyScheme(scheme) {
      document.documentElement.setAttribute('data-theme', scheme);
      var meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = scheme;
    }

    themeToggle.addEventListener('click', function () {
      var current = getCurrentScheme();
      var next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('color-scheme', next);
      applyScheme(next);
      themeToggle.setAttribute('aria-label', 'Switch to ' + (next === 'dark' ? 'light' : 'dark') + ' theme');
    });

    // Cross-tab sync
    window.addEventListener('storage', function (e) {
      if (e.key === 'color-scheme') {
        var newScheme = e.newValue || getSystemScheme();
        applyScheme(newScheme);
      }
    });
  }

  /* ---------- Mobile Drawer Navigation ---------- */
  function initMobileDrawer() {
    var toggleBtn = document.getElementById('mobile-nav-toggle');
    var drawer = document.getElementById('mobile-drawer');
    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = drawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.tagName === 'A') {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
        toggleBtn.focus();
      }
    });
  }

  /* ---------- 3D Flip Flashcards ---------- */
  function initFlipCards() {
    var cards = document.querySelectorAll('.flip');
    Array.prototype.forEach.call(cards, function (card) {
      var front = card.querySelector('.face.front');
      var back = card.querySelector('.face.back');
      if (!front || !back) return;

      function setFlipped(flipped) {
        card.setAttribute('data-flipped', flipped ? 'true' : 'false');
        front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
        back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
      }

      // Click or tap anywhere on card to toggle flip state
      card.addEventListener('click', function (e) {
        // If clicking a link, allow navigation without flipping
        if (e.target.closest('a')) return;

        var isFlipped = card.getAttribute('data-flipped') === 'true';
        setFlipped(!isFlipped);
      });

      // Keyboard support: Enter or Space flips the card
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('a')) return;
          e.preventDefault();
          var isFlipped = card.getAttribute('data-flipped') === 'true';
          setFlipped(!isFlipped);
        }
      });
    });
  }

  /* ---------- Copy to Clipboard & Toast Alert ---------- */
  function initCopyToast() {
    var toast = document.getElementById('toast-alert');
    var toastTimer = null;

    function showToast(message) {
      if (!toast) return;
      toast.querySelector('.toast-text').textContent = message || 'Copied to clipboard!';
      toast.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove('show');
      }, 2500);
    }

    document.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-copy]');
      if (!copyBtn) return;
      e.preventDefault();
      var textToCopy = copyBtn.getAttribute('data-copy');
      if (!textToCopy) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(function () {
          showToast('Copied ' + textToCopy + ' to clipboard!');
        }).catch(function () {
          fallbackCopy(textToCopy);
        });
      } else {
        fallbackCopy(textToCopy);
      }
    });

    function fallbackCopy(text) {
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      } catch (err) {
        prompt('Copy this address:', text);
      }
      document.body.removeChild(temp);
    }
  }

  /* ---------- Skills Category Filtering ---------- */
  function initSkillsFilter() {
    var filterTabs = document.querySelectorAll('[data-skill-filter]');
    var skillGroups = document.querySelectorAll('.skill-group');
    if (!filterTabs.length || !skillGroups.length) return;

    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-skill-filter');

        filterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        skillGroups.forEach(function (group) {
          var category = group.getAttribute('data-category');
          if (target === 'all' || category === target) {
            group.classList.remove('hidden');
          } else {
            group.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ---------- Back to Top Floating Button ---------- */
  function initBackToTop() {
    var topBtn = document.getElementById('back-to-top');
    if (!topBtn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 350) {
        topBtn.classList.add('show');
      } else {
        topBtn.classList.remove('show');
      }
    }, { passive: true });

    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================================
     System Design Portal Client Logic
     ========================================================================== */

  var SD_STORAGE_KEY = 'sd_mastered_qs_v1';

  function getSdMasteredSet() {
    try {
      var raw = localStorage.getItem(SD_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveSdMasteredSet(set) {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  function toggleSdMastered(id) {
    var set = getSdMasteredSet();
    var isNowMastered = false;
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
      isNowMastered = true;
    }
    saveSdMasteredSet(set);
    updateSdProgressUI();
    return isNowMastered;
  }

  function updateSdProgressUI() {
    var set = getSdMasteredSet();
    var totalQuestions = 60;
    var masteredCount = set.size;
    var pct = Math.min(100, Math.round((masteredCount / totalQuestions) * 100));

    // Update global tracker
    var fillEl = document.getElementById('sd-progress-fill');
    var valEl = document.getElementById('sd-stat-mastered');
    var pctEl = document.getElementById('sd-stat-pct');
    if (fillEl) fillEl.style.width = pct + '%';
    if (valEl) valEl.textContent = masteredCount;
    if (pctEl) pctEl.textContent = pct + '%';

    // Update day-level counts
    var daysCompleted = 0;
    for (var day = 1; day <= 6; day++) {
      var dayPrefix = 'day-' + day + '-';
      var dayMastered = 0;
      set.forEach(function (id) {
        if (id.indexOf(dayPrefix) === 0) dayMastered++;
      });
      if (dayMastered >= 10) daysCompleted++;

      // Update indicators
      var dayPills = document.querySelectorAll('[data-day-txt="' + day + '"]');
      Array.prototype.forEach.call(dayPills, function (el) {
        el.textContent = dayMastered + ' / 10 Mastered';
      });

      var dayInds = document.querySelectorAll('.sd-day-progress-indicator[data-day-progress="' + day + '"]');
      Array.prototype.forEach.call(dayInds, function (el) {
        if (dayMastered >= 10) el.classList.add('completed');
        else el.classList.remove('completed');
      });
    }

    var completedDaysEl = document.getElementById('sd-days-completed-txt');
    if (completedDaysEl) {
      completedDaysEl.textContent = daysCompleted + ' of 6 Days Fully Mastered';
    }

    // Update unmastered count in flashcard deck
    var unmasteredCountEl = document.getElementById('sd-fc-unmastered-count');
    if (unmasteredCountEl) {
      unmasteredCountEl.textContent = Math.max(0, 60 - masteredCount);
    }

    // Update all accordion checkboxes
    var checkBoxes = document.querySelectorAll('.sd-q-master-chk');
    Array.prototype.forEach.call(checkBoxes, function (btn) {
      var qId = btn.getAttribute('data-master-id');
      var itemEl = btn.closest('.sd-q-item');
      if (set.has(qId)) {
        btn.classList.add('mastered');
        if (itemEl) itemEl.classList.add('is-mastered');
      } else {
        btn.classList.remove('mastered');
        if (itemEl) itemEl.classList.remove('is-mastered');
      }
    });
  }

  // Hub Tabs Switching
  function initSdHubTabs() {
    var tabs = document.querySelectorAll('.sd-hub-tab');
    var panels = document.querySelectorAll('.sd-tab-panel');
    if (!tabs.length) return;

    function activateTab(tabId) {
      Array.prototype.forEach.call(tabs, function (t) {
        var isActive = t.getAttribute('data-tab-id') === tabId;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      Array.prototype.forEach.call(panels, function (p) {
        var isMatch = p.id === 'panel-' + tabId;
        p.classList.toggle('active', isMatch);
      });
    }

    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-tab-id');
        activateTab(id);
        if (history.replaceState) {
          history.replaceState(null, null, '#' + id);
        }
      });
    });

    var triggers = document.querySelectorAll('.sd-hub-tab-trigger');
    Array.prototype.forEach.call(triggers, function (btn) {
      btn.addEventListener('click', function (e) {
        var target = btn.getAttribute('data-target-tab');
        if (target) {
          e.preventDefault();
          activateTab(target);
          var panel = document.getElementById('panel-' + target);
          if (panel) panel.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    if (window.location.hash) {
      var hash = window.location.hash.replace('#', '');
      if (document.getElementById('panel-' + hash)) {
        activateTab(hash);
      }
    }
  }

  // Day Subtabs Switching
  function initSdDayTabs() {
    var tabs = document.querySelectorAll('.sd-day-tab');
    var panels = document.querySelectorAll('.sd-day-panel');
    if (!tabs.length) return;

    function activateDayTab(tabKey) {
      Array.prototype.forEach.call(tabs, function (t) {
        var isActive = t.getAttribute('data-day-tab') === tabKey;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      Array.prototype.forEach.call(panels, function (p) {
        var isMatch = p.id === 'day-panel-' + tabKey;
        p.classList.toggle('active', isMatch);
      });
    }

    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-day-tab');
        activateDayTab(key);
      });
    });

    if (window.location.hash === '#questions') activateDayTab('questions');
    if (window.location.hash === '#flashcards') activateDayTab('flashcards');
  }

  // Interactive 3D Flashcard Engine (Hub + Day Pages)
  function initSdFlashcards() {
    var hubCard = document.getElementById('sd-fc-card');
    var dayCard = document.getElementById('sd-day-fc-card');
    if (!hubCard && !dayCard) return;

    if (hubCard && window.__SD_QUESTIONS__) {
      setupFlashcardInstance({
        stage: hubCard,
        flipBtn: document.getElementById('sd-fc-flip-btn'),
        flipBackBtn: document.getElementById('sd-fc-flip-back'),
        prevBtn: document.getElementById('sd-fc-prev-btn'),
        nextBtn: document.getElementById('sd-fc-next-btn'),
        masterBtn: document.getElementById('sd-fc-master-btn'),
        masterTxt: document.getElementById('sd-fc-master-txt'),
        statusBadge: document.getElementById('sd-fc-status-badge'),
        shuffleBtn: document.getElementById('sd-fc-shuffle-btn'),
        daySelect: document.getElementById('sd-fc-day-select'),
        unmasteredChk: document.getElementById('sd-fc-unmastered-only'),
        counterBadge: document.getElementById('sd-fc-counter-badge'),
        dayPill: document.getElementById('sd-fc-day-pill'),
        backDayPill: document.getElementById('sd-fc-back-day-pill'),
        qnumPill: document.getElementById('sd-fc-qnum-pill'),
        backQnumPill: document.getElementById('sd-fc-back-qnum-pill'),
        catPill: document.getElementById('sd-fc-cat-pill'),
        questionTxt: document.getElementById('sd-fc-question-txt'),
        hintTxt: document.getElementById('sd-fc-hint-txt'),
        verbalTxt: document.getElementById('sd-fc-verbal-txt'),
        deepdiveTxt: document.getElementById('sd-fc-deepdive-txt'),
        allData: window.__SD_QUESTIONS__
      });
    }

    if (dayCard && window.__SD_DAY_QUESTIONS__) {
      setupFlashcardInstance({
        stage: dayCard,
        flipBtn: document.getElementById('sd-day-fc-flip'),
        flipBackBtn: document.getElementById('sd-day-fc-flipback'),
        prevBtn: document.getElementById('sd-day-fc-prev'),
        nextBtn: document.getElementById('sd-day-fc-next'),
        masterBtn: document.getElementById('sd-day-fc-master'),
        statusBadge: document.getElementById('sd-day-fc-status'),
        counterBadge: document.getElementById('sd-day-fc-counter'),
        qnumPill: document.getElementById('sd-day-fc-qnum'),
        questionTxt: document.getElementById('sd-day-fc-qtxt'),
        verbalTxt: document.getElementById('sd-day-fc-atxt'),
        deepdiveTxt: document.getElementById('sd-day-fc-deepdive'),
        allData: window.__SD_DAY_QUESTIONS__
      });
    }

    function setupFlashcardInstance(cfg) {
      var deck = cfg.allData.slice();
      var currentIndex = 0;

      function getFilterState() {
        var dayVal = cfg.daySelect ? cfg.daySelect.value : 'all';
        var onlyUnmastered = cfg.unmasteredChk ? cfg.unmasteredChk.checked : false;
        var masteredSet = getSdMasteredSet();

        return cfg.allData.filter(function (q) {
          if (dayVal !== 'all' && String(q.day) !== String(dayVal)) return false;
          if (onlyUnmastered && masteredSet.has(q.id)) return false;
          return true;
        });
      }

      function refreshDeck() {
        deck = getFilterState();
        if (currentIndex >= deck.length) currentIndex = 0;
        setFlipped(false);
        render();
      }

      function setFlipped(isFlipped) {
        cfg.stage.setAttribute('data-flipped', isFlipped ? 'true' : 'false');
      }

      function toggleFlip() {
        var curr = cfg.stage.getAttribute('data-flipped') === 'true';
        setFlipped(!curr);
      }

      function render() {
        if (!deck.length) {
          if (cfg.questionTxt) cfg.questionTxt.textContent = '🎉 All selected cards have been mastered!';
          if (cfg.hintTxt) cfg.hintTxt.textContent = 'Uncheck "Only Unmastered" or select another deck to continue reviewing.';
          if (cfg.verbalTxt) cfg.verbalTxt.textContent = 'Great job! You have cleared this deck.';
          if (cfg.deepdiveTxt) cfg.deepdiveTxt.innerHTML = '';
          if (cfg.counterBadge) cfg.counterBadge.textContent = '0 of 0';
          return;
        }

        var q = deck[currentIndex];
        var isMastered = getSdMasteredSet().has(q.id);

        if (cfg.dayPill) cfg.dayPill.textContent = 'Day ' + q.day;
        if (cfg.backDayPill) cfg.backDayPill.textContent = 'Day ' + q.day;
        if (cfg.qnumPill) cfg.qnumPill.textContent = q.qNum;
        if (cfg.backQnumPill) cfg.backQnumPill.textContent = q.qNum;
        if (cfg.catPill) cfg.catPill.textContent = q.category;
        if (cfg.questionTxt) cfg.questionTxt.textContent = q.title;
        if (cfg.hintTxt) cfg.hintTxt.textContent = q.category + ' (' + q.dayTitle + ')';
        if (cfg.verbalTxt) cfg.verbalTxt.textContent = q.takeaway || q.verbalScript;
        if (cfg.deepdiveTxt) cfg.deepdiveTxt.innerHTML = q.htmlAnswer || '';

        if (cfg.counterBadge) {
          cfg.counterBadge.textContent = 'Card ' + (currentIndex + 1) + ' of ' + deck.length;
        }

        if (cfg.statusBadge) {
          cfg.statusBadge.textContent = isMastered ? '✓ MASTERED' : 'UNMASTERED';
          cfg.statusBadge.classList.toggle('mastered', isMastered);
        }

        if (cfg.masterBtn) {
          cfg.masterBtn.classList.toggle('mastered', isMastered);
          if (cfg.masterTxt) {
            cfg.masterTxt.textContent = isMastered ? 'Mastered ⭐' : 'Mark Mastered (M)';
          }
        }
      }

      function nextCard() {
        if (!deck.length) return;
        currentIndex = (currentIndex + 1) % deck.length;
        setFlipped(false);
        render();
      }

      function prevCard() {
        if (!deck.length) return;
        currentIndex = (currentIndex - 1 + deck.length) % deck.length;
        setFlipped(false);
        render();
      }

      function shuffle() {
        for (var i = deck.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = deck[i];
          deck[i] = deck[j];
          deck[j] = temp;
        }
        currentIndex = 0;
        setFlipped(false);
        render();
      }

      // Event Listeners
      cfg.stage.addEventListener('click', function (e) {
        if (e.target.closest('#sd-fc-flip-back, #sd-day-fc-flipback')) return;
        toggleFlip();
      });

      if (cfg.flipBtn) cfg.flipBtn.addEventListener('click', toggleFlip);
      if (cfg.flipBackBtn) {
        cfg.flipBackBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setFlipped(false);
        });
      }

      if (cfg.nextBtn) cfg.nextBtn.addEventListener('click', nextCard);
      if (cfg.prevBtn) cfg.prevBtn.addEventListener('click', prevCard);
      if (cfg.shuffleBtn) cfg.shuffleBtn.addEventListener('click', shuffle);

      if (cfg.masterBtn) {
        cfg.masterBtn.addEventListener('click', function () {
          if (!deck.length) return;
          var q = deck[currentIndex];
          toggleSdMastered(q.id);
          render();
        });
      }

      if (cfg.daySelect) cfg.daySelect.addEventListener('change', refreshDeck);
      if (cfg.unmasteredChk) cfg.unmasteredChk.addEventListener('change', refreshDeck);

      // Keyboard Controls
      document.addEventListener('keydown', function (e) {
        var activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

        var panel = cfg.stage.closest('.sd-tab-panel, .sd-day-panel');
        if (panel && !panel.classList.contains('active')) return;

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextCard();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevCard();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleFlip();
        } else if (e.key === 'm' || e.key === 'M') {
          if (deck.length) {
            e.preventDefault();
            toggleSdMastered(deck[currentIndex].id);
            render();
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          shuffle();
        }
      });

      render();
    }
  }

  // Question Bank Search & Filtering
  function initSdSearchMatrix() {
    var searchInput = document.getElementById('sd-search-input');
    var clearBtn = document.getElementById('sd-search-clear');
    var catPills = document.querySelectorAll('.sd-cat-pill');
    var items = document.querySelectorAll('.sd-q-item');
    var countTxt = document.getElementById('sd-search-count-txt');
    var expandAllBtn = document.getElementById('sd-toggle-all-expand');
    if (!items.length) return;

    var currentCategory = 'All Topics';
    var currentQuery = '';

    function filterItems() {
      var query = currentQuery.trim().toLowerCase();
      var visibleCount = 0;

      Array.prototype.forEach.call(items, function (item) {
        var category = item.getAttribute('data-category') || '';
        var title = item.querySelector('.sd-q-title') ? item.querySelector('.sd-q-title').textContent.toLowerCase() : '';
        var takeaway = item.querySelector('.sd-q-takeaway-p') ? item.querySelector('.sd-q-takeaway-p').textContent.toLowerCase() : '';
        var content = item.querySelector('.sd-q-content') ? item.querySelector('.sd-q-content').textContent.toLowerCase() : '';

        var matchesCat = (currentCategory === 'All Topics' || currentCategory === 'All' || category.toLowerCase() === currentCategory.toLowerCase());
        var matchesQuery = !query || title.indexOf(query) !== -1 || takeaway.indexOf(query) !== -1 || content.indexOf(query) !== -1;

        if (matchesCat && matchesQuery) {
          item.style.display = '';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });

      if (countTxt) {
        countTxt.textContent = 'Showing ' + visibleCount + ' of ' + items.length + ' questions';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentQuery = searchInput.value;
        if (clearBtn) clearBtn.hidden = !currentQuery;
        filterItems();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        currentQuery = '';
        clearBtn.hidden = true;
        searchInput.focus();
        filterItems();
      });
    }

    Array.prototype.forEach.call(catPills, function (pill) {
      pill.addEventListener('click', function () {
        Array.prototype.forEach.call(catPills, function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        currentCategory = pill.getAttribute('data-cat');
        filterItems();
      });
    });

    // Accordion Expansion
    var toggleBtns = document.querySelectorAll('.sd-q-toggle-btn');
    Array.prototype.forEach.call(toggleBtns, function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.sd-q-item');
        var body = item.querySelector('.sd-q-body');
        var isOpen = item.classList.contains('open');

        if (isOpen) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          if (body) body.hidden = true;
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          if (body) body.hidden = false;
        }
      });
    });

    // Toggle All Expand/Collapse
    if (expandAllBtn) {
      var allExpanded = false;
      expandAllBtn.addEventListener('click', function () {
        allExpanded = !allExpanded;
        expandAllBtn.textContent = allExpanded ? 'Collapse all answers' : 'Expand all answers';
        Array.prototype.forEach.call(items, function (item) {
          if (item.style.display === 'none') return;
          var btn = item.querySelector('.sd-q-toggle-btn');
          var body = item.querySelector('.sd-q-body');
          if (allExpanded) {
            item.classList.add('open');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            if (body) body.hidden = false;
          } else {
            item.classList.remove('open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (body) body.hidden = true;
          }
        });
      });
    }

    // Master Checkbox click handler
    var masterBtns = document.querySelectorAll('.sd-q-master-chk');
    Array.prototype.forEach.call(masterBtns, function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-master-id');
        toggleSdMastered(id);
      });
    });

    // Copy Answer button
    var copyBtns = document.querySelectorAll('.sd-q-copy-btn');
    Array.prototype.forEach.call(copyBtns, function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.sd-q-item');
        var title = item.querySelector('.sd-q-title') ? item.querySelector('.sd-q-title').textContent : '';
        var takeaway = item.querySelector('.sd-q-takeaway-p') ? item.querySelector('.sd-q-takeaway-p').textContent : '';
        var content = item.querySelector('.sd-q-content') ? item.querySelector('.sd-q-content').innerText : '';

        var fullText = title + '\n\n' + 'Takeaway: ' + takeaway + '\n\n' + content;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullText).then(function () {
            var toast = document.getElementById('toast-alert');
            if (toast) {
              var txt = toast.querySelector('.toast-text');
              if (txt) txt.textContent = 'Question and answer copied!';
              toast.classList.add('show');
              setTimeout(function () { toast.classList.remove('show'); }, 3000);
            }
          });
        }
      });
    });

    // Reset Progress button
    var resetBtn = document.getElementById('sd-reset-progress-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (window.confirm('Are you sure you want to reset your System Design mastery progress? This will uncheck all completed cards.')) {
          localStorage.removeItem(SD_STORAGE_KEY);
          updateSdProgressUI();
        }
      });
    }
  }

  /* Initialize on DOM Ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAll);
  } else {
    runAll();
  }

  function runAll() {
    initTheme();
    initMobileDrawer();
    initFlipCards();
    initCopyToast();
    initSkillsFilter();
    initBackToTop();
    initSdHubTabs();
    initSdDayTabs();
    initSdFlashcards();
    initSdSearchMatrix();
    updateSdProgressUI();
  }
})();
