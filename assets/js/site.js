/* ==========================================================================
   Lupus Foundation of Africa - site behaviour
   Vanilla JS, no dependencies. Every enhancement degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- Nav */
  function initNav() {
    var nav = $('.nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Desktop dropdowns: click to open, Escape/outside-click to close.
    $$('.menu > li.has-sub').forEach(function (li) {
      var trigger = $('a', li);
      var sub = $('.submenu', li);
      if (!trigger || !sub) return;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-haspopup', 'true');

      trigger.addEventListener('click', function (e) {
        if (window.innerWidth < 1060) return; // drawer handles small screens
        e.preventDefault();
        var open = li.classList.contains('is-open');
        closeAllMenus();
        if (!open) {
          li.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      li.addEventListener('mouseenter', function () {
        if (window.innerWidth < 1060) return;
        closeAllMenus();
        li.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', function () {
        if (window.innerWidth < 1060) return;
        li.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });

    function closeAllMenus() {
      $$('.menu > li.has-sub').forEach(function (li) {
        li.classList.remove('is-open');
        var t = $('a', li);
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu')) closeAllMenus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAllMenus(); closeDrawer(); }
    });

    // Mobile drawer
    var burger = $('.burger');
    var drawer = $('.drawer');
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) { var f = $('a, button', drawer); if (f) f.focus(); }
      });
      $$('.drawer a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
    }
    function closeDrawer() {
      if (!drawer || !drawer.classList.contains('is-open')) return;
      drawer.classList.remove('is-open');
      if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
      document.body.style.overflow = '';
    }

    // Drawer sub-sections
    $$('.drawer-toggle').forEach(function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.style.maxHeight = open ? null : panel.scrollHeight + 'px';
      });
    });
  }

  /* ------------------------------------------------------------- Reveal */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      fired = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });

    // Safety net: some engines suspend observer callbacks for backgrounded or
    // unpainted documents. Content must never be left permanently invisible,
    // so if no callback has arrived shortly after load, just show everything.
    setTimeout(function () {
      if (fired) return;
      io.disconnect();
      items.forEach(function (el) { el.classList.add('is-in'); });
    }, 2500);
  }

  /* ------------------------------------------------------------ Counters */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
      var start = null, dur = 1500;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------- Accordion */
  function initAccordions() {
    $$('.acc-btn').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        var group = btn.closest('.acc');
        if (group && group.hasAttribute('data-exclusive') && !open) {
          $$('.acc-btn[aria-expanded="true"]', group).forEach(function (other) {
            other.setAttribute('aria-expanded', 'false');
            var p = document.getElementById(other.getAttribute('aria-controls'));
            if (p) p.style.maxHeight = null;
          });
        }
        btn.setAttribute('aria-expanded', String(!open));
        panel.style.maxHeight = open ? null : panel.scrollHeight + 'px';
      });
    });
    // Keep open panels sized correctly when the viewport changes.
    window.addEventListener('resize', function () {
      $$('.acc-btn[aria-expanded="true"]').forEach(function (btn) {
        var p = document.getElementById(btn.getAttribute('aria-controls'));
        if (p) p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
  }

  /* --------------------------------------------------------- Flip cards */
  function initFlips() {
    $$('.flip').forEach(function (card) {
      card.setAttribute('aria-pressed', 'false');
      card.addEventListener('click', function () {
        card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
      });
    });
  }

  /* --------------------------------------------- Symptom reflection tool */
  function initSymptomTool() {
    var tool = $('#symptom-tool');
    if (!tool) return;
    var boxes = $$('input[type="checkbox"]', tool);
    var result = $('#symptom-result', tool);
    var countEl = $('#symptom-count', tool);
    var meter = $('#symptom-meter', tool);
    var msgEl = $('#symptom-message', tool);
    var reset = $('#symptom-reset', tool);

    function update() {
      var picked = boxes.filter(function (b) { return b.checked; });
      var n = picked.length;
      if (!n) { result.classList.remove('is-on'); return; }
      result.classList.add('is-on');
      countEl.textContent = n;
      meter.style.width = Math.min(100, (n / 6) * 100) + '%';

      var msg;
      if (n <= 2) {
        msg = '<p>You have noted <strong>' + n + '</strong> ' + (n === 1 ? 'experience' : 'experiences') +
          ' that people living with lupus often describe. On their own these are common to many conditions and are not a sign of lupus.</p>' +
          '<p class="form-note">If any of these persist, keep a simple diary of what you feel and when, and take it to a healthcare professional.</p>';
      } else if (n <= 5) {
        msg = '<p>You have noted <strong>' + n + '</strong> experiences that people living with lupus often describe. Several symptoms appearing together, ' +
          'especially when they come and go over weeks or months, are worth discussing with a healthcare professional.</p>' +
          '<p class="form-note">Lupus is often missed because its symptoms overlap with other conditions. Asking the question early is reasonable and useful.</p>';
      } else {
        msg = '<p>You have noted <strong>' + n + '</strong> experiences that people living with lupus often describe. That is a pattern worth taking seriously.</p>' +
          '<p class="form-note">Please book an appointment with a healthcare professional and ask whether an autoimmune condition should be considered. ' +
          'Take this list with you. You can also contact LFA for peer support while you seek answers.</p>';
      }
      msgEl.innerHTML = msg;
    }

    boxes.forEach(function (b) { b.addEventListener('change', update); });
    if (reset) reset.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      result.classList.remove('is-on');
      meter.style.width = '0%';
    });
  }

  /* ---------------------------------------------------------- Lightbox */
  function initLightbox() {
    var triggers = $$('.gal-btn');
    if (!triggers.length) return;
    var lb = $('#lightbox');
    if (!lb) return;
    var img = $('img', lb);
    var meta = $('.lb-meta', lb);
    var idx = 0, lastFocus = null;

    function open(i) {
      idx = (i + triggers.length) % triggers.length;
      var src = triggers[idx].getAttribute('data-full') || $('img', triggers[idx]).src;
      var alt = $('img', triggers[idx]).alt || '';
      img.src = src; img.alt = alt;
      if (meta) meta.textContent = (idx + 1) + ' of ' + triggers.length + (alt ? ': ' + alt : '');
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      $('.lb-close', lb).focus();
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      img.src = '';
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener('click', function () { lastFocus = t; open(i); });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { open(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { open(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') open(idx - 1);
      if (e.key === 'ArrowRight') open(idx + 1);
      if (e.key === 'Tab') { e.preventDefault(); } // keep focus inside the overlay
    });
  }

  /* ------------------------------------------------------ Filter + search */
  function initFilters() {
    $$('[data-filter-group]').forEach(function (group) {
      var targetSel = group.getAttribute('data-filter-group');
      var items = $$(targetSel);
      var chips = $$('.chip', group);
      var search = $('input[type="search"]', group.parentNode) ||
                   document.getElementById(group.getAttribute('data-search') || '');
      var empty = document.getElementById(group.getAttribute('data-empty') || '');
      var active = 'all';

      function apply() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var shown = 0;
        items.forEach(function (item) {
          var tags = (item.getAttribute('data-tags') || '').toLowerCase();
          var text = item.textContent.toLowerCase();
          var okTag = active === 'all' || tags.indexOf(active) > -1;
          var okText = !q || text.indexOf(q) > -1 || tags.indexOf(q) > -1;
          var show = okTag && okText;
          item.classList.toggle('is-hidden', !show);
          if (show) shown++;
        });
        if (empty) empty.classList.toggle('is-hidden', shown > 0);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
          chip.setAttribute('aria-pressed', 'true');
          active = chip.getAttribute('data-filter') || 'all';
          apply();
        });
      });
      if (search) search.addEventListener('input', apply);
      apply();
    });
  }

  /* --------------------------------------------------------------- Share */
  function initShare() {
    var url = window.location.href;
    var title = document.title;
    $$('[data-share]').forEach(function (el) {
      var kind = el.getAttribute('data-share');
      var u = encodeURIComponent(url), t = encodeURIComponent(title);
      var map = {
        whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
        x: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t,
        email: 'mailto:?subject=' + t + '&body=' + u
      };
      if (map[kind]) el.setAttribute('href', map[kind]);
    });

    $$('[data-copy-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var done = function () {
          var old = btn.getAttribute('aria-label');
          btn.setAttribute('aria-label', 'Link copied');
          setTimeout(function () { btn.setAttribute('aria-label', old); }, 2000);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function(){});
        else done();
      });
    });
  }

  /* ---------------------------------------------------- Hero background video */
  function initHeroVideo() {
    var vid = $('#hero-video');
    var btn = $('#hero-video-toggle');
    if (!vid) { if (btn) btn.style.display = 'none'; return; }

    // Respect a reduced-motion preference: hold on the poster frame instead.
    if (reduceMotion) {
      vid.removeAttribute('autoplay');
      vid.pause();
      if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play background video'); }
    }

    // Save data and battery: stop the loop whenever the hero is off screen.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (btn && btn.getAttribute('aria-pressed') === 'true') return; // user paused it
          if (e.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
          else vid.pause();
        });
      }, { threshold: 0.05 });
      io.observe(vid);
    }

    if (!btn) return;
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') === 'true';
      if (paused) {
        var p = vid.play(); if (p && p.catch) p.catch(function () {});
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Pause background video');
      } else {
        vid.pause();
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Play background video');
      }
    });
  }

  /* -------------------------------------------------------- Floating CTA */
  function initFloatGive() {
    var fab = $('.float-give');
    if (!fab) return;
    var onScroll = function () { fab.classList.toggle('is-on', window.scrollY > 900); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --------------------------------------------------------------- Forms */
  /* Forms post to FORM_ENDPOINT when configured (e.g. a Formspree or
     Netlify Forms URL). Until then they fall back to opening the visitor's
     email client with the message pre-filled, so nothing is ever lost. */
  var FORM_ENDPOINT = ''; // <-- set this to go live with direct submissions
  var FALLBACK_EMAIL = 'info@lupusfa.org';

  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      var status = $('.form-status', form);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(form)) return;

        var data = new FormData(form);
        if (data.get('_hp')) return; // honeypot: silently drop bots

        if (FORM_ENDPOINT) {
          fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
            .then(function (r) { if (r.ok) succeed(form, status); else fallbackMail(form, data); })
            .catch(function () { fallbackMail(form, data); });
        } else {
          fallbackMail(form, data);
          succeed(form, status);
        }
      });

      $$('input, select, textarea', form).forEach(function (f) {
        f.addEventListener('blur', function () { validateField(f); });
        f.addEventListener('input', function () {
          if (f.getAttribute('aria-invalid') === 'true') validateField(f);
        });
      });
    });
  }

  function validateField(f) {
    if (f.type === 'hidden' || f.name === '_hp') return true;
    var wrap = f.closest('.field');
    var err = wrap ? $('.field-err', wrap) : null;
    var ok = f.checkValidity();
    f.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (err) {
      err.classList.toggle('is-on', !ok);
      if (!ok) err.textContent = f.validationMessage;
    }
    return ok;
  }

  function validate(form) {
    var ok = true, first = null;
    $$('input, select, textarea', form).forEach(function (f) {
      if (!validateField(f)) { ok = false; if (!first) first = f; }
    });
    if (first) first.focus();
    return ok;
  }

  function succeed(form, status) {
    if (status) {
      status.classList.add('is-on', 'form-status--ok');
      status.textContent = status.getAttribute('data-success') ||
        'Thank you. Your message is on its way to the LFA team and we will be in touch.';
      status.setAttribute('role', 'status');
    }
    form.reset();
  }

  function fallbackMail(form, data) {
    var subject = form.getAttribute('data-subject') || 'Website enquiry';
    var lines = [];
    data.forEach(function (v, k) {
      if (k.charAt(0) === '_' || !String(v).trim()) return;
      lines.push(k.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + ': ' + v);
    });
    var to = form.getAttribute('data-to') || FALLBACK_EMAIL;
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* ----------------------------------------------------------- Bootstrap */
  function init() {
    initNav();
    initReveal();
    initCounters();
    initAccordions();
    initFlips();
    initSymptomTool();
    initLightbox();
    initHeroVideo();
    initFilters();
    initShare();
    initFloatGive();
    initForms();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
