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
  }
})();
