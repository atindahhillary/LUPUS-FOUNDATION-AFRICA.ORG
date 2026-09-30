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
  var NAV_FULL = 1250; // keep in step with the full-menu breakpoint in style.css

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
        if (window.innerWidth < NAV_FULL) return; // drawer handles small screens
        e.preventDefault();
        var open = li.classList.contains('is-open');
        closeAllMenus();
        if (!open) {
          li.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      li.addEventListener('mouseenter', function () {
        if (window.innerWidth < NAV_FULL) return;
        closeAllMenus();
        li.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', function () {
        if (window.innerWidth < NAV_FULL) return;
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
  /* Home hero: a slideshow of World Lupus Day photos. Photo 1 loads with the
     page; each later photo loads just before it is shown. Pauses when the
     visitor presses pause, when the hero scrolls out of view and when the tab
     is hidden. With reduced motion it holds still and only changes on request. */
  function initHeroSlides() {
    var box = $('#hero-slides');
    var btn = $('#hero-slides-toggle');
    var dotsBox = $('.hs-dots');
    if (!box) { if (btn) btn.style.display = 'none'; return; }
    var slides = $$('.hs-slide', box), dots = $$('.hs-dot'), DUR = 3600;   // time per photo; the crossfade (1.1s) is in style.css
    var idx = 0, timer = null, started = 0, left = DUR, gen = 0;   // gen: a click or pause cancels any advance already on its way
    var userPaused = !!reduceMotion, offscreen = false, hiddenTab = false;
    if (slides.length < 2) { if (btn) btn.style.display = 'none'; if (dotsBox) dotsBox.style.display = 'none'; return; }
    if (dotsBox) dotsBox.style.setProperty('--hs-dur', DUR + 'ms');

    function load(i) {
      var img = $('img', slides[i]);
      if (img && img.getAttribute('data-src')) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
    }
    // wait for a photo that is still downloading (slow networks) rather than fade to an empty frame
    function whenReady(i, cb) {
      load(i);
      var img = $('img', slides[i]);
      if (!img || (img.complete && img.naturalWidth)) return cb();
      var done = false, go = function () { if (!done) { done = true; cb(); } };
      img.addEventListener('load', go, { once: true });
      img.addEventListener('error', go, { once: true });
      setTimeout(go, 2500);
    }
    function running() { return !userPaused && !offscreen && !hiddenTab; }
    function schedule() {
      clearTimeout(timer);
      var my = ++gen;
      box.classList.toggle('is-paused', !running());
      if (dotsBox) dotsBox.classList.toggle('is-paused', !running());
      if (running()) { started = Date.now(); timer = setTimeout(function () { whenReady((idx + 1) % slides.length, function () { if (my === gen && running()) show(idx + 1); }); }, left); }
    }
    function hold() {            // stop the clock, remembering how long this photo has left
      if (timer) { clearTimeout(timer); timer = null; left = Math.max(400, left - (Date.now() - started)); }
      schedule();
    }
    function show(i) {
      var prev = slides[idx];
      prev.classList.remove('is-active'); prev.classList.add('is-leaving');
      setTimeout(function () { prev.classList.remove('is-leaving'); }, 1200);
      if (dots[idx]) { dots[idx].classList.remove('is-active'); dots[idx].removeAttribute('aria-current'); }
      idx = (i + slides.length) % slides.length;
      load(idx); load((idx + 1) % slides.length); load((idx + 2) % slides.length);   // two photos ahead
      var s = slides[idx];
      s.classList.remove('is-leaving');
      var img = $('img', s); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      s.classList.add('is-active');
      if (dots[idx]) {
        var bar = $('i', dots[idx]); dots[idx].classList.remove('is-active'); void bar.offsetWidth;
        dots[idx].classList.add('is-active'); dots[idx].setAttribute('aria-current', 'true');
      }
      left = DUR;
      schedule();
    }

    load(1); load(2);
    dots.forEach(function (d, i) { d.addEventListener('click', function () { if (i !== idx) show(i); }); });
    if (btn) {
      if (userPaused) { btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play the photo slideshow'); }
      btn.addEventListener('click', function () {
        userPaused = !userPaused;
        btn.setAttribute('aria-pressed', String(userPaused));
        btn.setAttribute('aria-label', userPaused ? 'Play the photo slideshow' : 'Pause the photo slideshow');
        if (userPaused) hold(); else schedule();
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
        if (offscreen) hold(); else schedule();
      }, { threshold: 0.05 }).observe(box);
    }
    document.addEventListener('visibilitychange', function () {
      hiddenTab = document.hidden;
      if (hiddenTab) hold(); else schedule();
    });
    schedule();
  }

  /* ------------------------------------------------------ Volunteer form */
  /* "Volunteer with us" opens a short form. It is sent from the volunteer's own
     WhatsApp or email app with everything filled in, so nothing is stored here.
     Without script the button still calls LFA. */
  var VOL_WHATSAPP = '254142851978', VOL_EMAIL = 'info@lupusfa.org';
  function initVolunteer() {
    var dlg = $('#volunteer-dialog'), form = $('#vol-form');
    if (!dlg || !form) return;
    var done = $('#vol-done'), lastFocus = null;
    function open(trigger) {
      lastFocus = trigger || document.activeElement;
      form.hidden = false; done.hidden = true;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      setTimeout(function () { $('#vol-name').focus(); }, 30);
    }
    function close() {
      if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    }
    dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    $$('[data-volunteer-open]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(b); });
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-vol-close]')) close();   // backdrop or close button
    });
    function fieldError(input, msg) {
      var err = $('.field-err', input.closest('.field'));
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg || ''; err.classList.toggle('is-on', !!msg); }
    }
    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') fieldError(f, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var via = (e.submitter && e.submitter.value) || 'whatsapp';
      var name = $('#vol-name').value.trim(), phone = $('#vol-phone').value.trim();
      var email = $('#vol-email').value.trim(), offer = $('#vol-offer').value.trim();
      var bad = null;
      if (!name) { fieldError($('#vol-name'), 'Please tell us your name.'); bad = bad || $('#vol-name'); }
      if (email && !$('#vol-email').checkValidity()) { fieldError($('#vol-email'), 'Please check your email address.'); bad = bad || $('#vol-email'); }
      if (!offer) { fieldError($('#vol-offer'), 'Please tell us what you would like to contribute.'); bad = bad || $('#vol-offer'); }
      if (bad) { bad.focus(); return; }
      var text = ['Volunteer offer from the LFA website', '', 'Name: ' + name]
        .concat(phone ? ['Phone: ' + phone] : [], email ? ['Email: ' + email] : [],
          ['', 'What I would like to contribute (skills, experience, networks or time):', offer]).join('\n');
      var url = via === 'email'
        ? 'mailto:' + VOL_EMAIL + '?subject=' + encodeURIComponent('Volunteer offer from ' + name) + '&body=' + encodeURIComponent(text)
        : 'https://wa.me/' + VOL_WHATSAPP + '?text=' + encodeURIComponent(text);
      if (via === 'email') window.location.href = url;
      else window.open(url, '_blank', 'noopener');
      form.reset();
      form.hidden = true; done.hidden = false;
      var first = name.split(/\s+/)[0];
      done.innerHTML = '<p class="eyebrow">Almost there</p><h2 id="vol-done-title">Thank you, ' + esc(first) + '</h2>' +
        '<p>Your message to LFA is ready in ' + (via === 'email' ? 'your email app' : 'WhatsApp') + '. Press send there and our team will get back to you.</p>' +
        '<div class="btn-row"><a class="btn ' + (via === 'email' ? 'btn--primary' : 'btn--wa') + '" href="' + esc(url) + '"' + (via === 'email' ? '' : ' target="_blank" rel="noopener"') + '>' +
        (via === 'email' ? 'Open the email again' : 'Open WhatsApp again') + '</a>' +
        '<button class="btn btn--ghost" type="button" data-vol-close>Close</button></div>';
      done.focus();
    });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* -------------------------------------------------------- Floating CTA */
  // Donate floats on screen on every page from the first screen, except where
  // it would point at the page you are already on (Donate) or pull a buyer
  // away from finishing an order (Checkout).
  /* --------------------------------------------------- Newsletter reader */
  /* Shows the newsletter as page images in an overlay, so the preview works on
     every device (many phones download a PDF instead of showing it). Opened by
     any [data-nl-open="<page>"] link, or by arriving at news.html#read-newsletter
     (or #read-newsletter-p<page>). Without script those links open the PDF. */
  function initNewsletterReader() {
    var rd = $('#nl-reader');
    if (!rd) return;
    var box = $('.nl-reader-pages', rd);
    var pages = $$('[data-nl-page]', rd);
    var counter = $('[data-nl-current]', rd);
    var current = 1, lastFocus = null;

    function setCurrent(n) { current = n; counter.textContent = n; }
    function go(n, smooth) {
      n = Math.max(1, Math.min(pages.length, n));
      pages[n - 1].loading = 'eager';
      box.scrollTo({ top: pages[n - 1].offsetTop - 16, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
      setCurrent(n);
    }
    function open(n) {
      lastFocus = document.activeElement;
      rd.hidden = false;
      document.body.style.overflow = 'hidden';
      go(n, false);
      $('[data-nl-close]', rd).focus();
    }
    function close() {
      rd.hidden = true;
      document.body.style.overflow = '';
      if (location.hash.indexOf('#read-newsletter') === 0) {
        history.replaceState(null, '', location.pathname + location.search + '#newsletter');
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    box.addEventListener('scroll', function () {
      var line = box.scrollTop + box.clientHeight * 0.35, n = 1;
      pages.forEach(function (p, i) { if (p.offsetTop <= line) n = i + 1; });
      if (n !== current) setCurrent(n);
    }, { passive: true });
    $$('[data-nl-open]').forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open(parseInt(t.getAttribute('data-nl-open'), 10) || 1);
      });
    });
    $('[data-nl-close]', rd).addEventListener('click', close);
    $('[data-nl-prev]', rd).addEventListener('click', function () { go(current - 1, true); });
    $('[data-nl-next]', rd).addEventListener('click', function () { go(current + 1, true); });
    document.addEventListener('keydown', function (e) {
      if (rd.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(current + 1, true); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(current - 1, true); }
      if (e.key === 'Tab') { // keep focus inside the reader
        var f = $$('button, a[href], [tabindex="0"]', rd);
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
    function fromHash() {
      var m = /^#read-newsletter(?:-p(\d+))?$/.exec(location.hash);
      if (m && rd.hidden) open(parseInt(m[1], 10) || 1);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ---------------------------------------------------------------- Videos */
  /* Each video shows a still and a play button. Pressing it swaps in the
     YouTube player (privacy-enhanced mode) so the programme plays right here;
     nothing loads from YouTube until then. Starting one video puts any other
     back to its still. Without script, or with Ctrl/Cmd-click, the link opens
     the programme on YouTube. */
  function initVideos() {
    var playing = [];
    $$('[data-yt]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var id = a.getAttribute('data-yt');
        if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
        e.preventDefault();
        playing.forEach(function (p) { if (p.frame.parentNode) p.frame.parentNode.replaceChild(p.facade, p.frame); });
        playing = [];
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
        f.title = a.getAttribute('data-title') || 'Video';
        f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        f.setAttribute('allowfullscreen', '');
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        a.parentNode.replaceChild(f, a);
        playing.push({ frame: f, facade: a });
        f.focus();
      });
    });
  }

  /* ------------------------------------------------------ Monthly meeting */
  /* The community meets on the last Saturday of every month. Fill in the date
     of the next one; on the day itself it reads "today". Without script the
     panel still says "last Saturday of every month". */
  function initMeeting() {
    var box = $('#monthly-meeting');
    if (!box) return;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    function lastSaturday(y, m) {
      var d = new Date(y, m + 1, 0);               // last day of month m
      d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // step back to Saturday (day 6)
      return d;
    }
    var next = lastSaturday(today.getFullYear(), today.getMonth());
    if (next < today) next = lastSaturday(today.getFullYear(), today.getMonth() + 1);
    var isToday = next.getTime() === today.getTime();
    var fmt = function (o) { return next.toLocaleDateString('en-GB', o); };
    var set = function (k, v) { var el = $('[data-meet="' + k + '"]', box); if (el) el.textContent = v; };
    set('month', fmt({ month: 'short' }));
    set('day', String(next.getDate()));
    set('dow', isToday ? 'Today' : 'Saturday');
    var line = $('[data-meet="next"]', box);
    line.textContent = 'Next meeting: ' + (isToday ? 'today, ' : '') + fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    line.hidden = false;
  }

  function initFloatGive() {
    var fab = $('.float-give'), shop = $('.float-shop');
    if (fab && /(donate|checkout)\.html$/.test(location.pathname)) fab.remove();
    if (shop && /(shop|checkout)\.html$/.test(location.pathname)) shop.remove();
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
    initHeroSlides();
    initVolunteer();
    initFilters();
    initShare();
    initFloatGive();
    initMeeting();
    initVideos();
    initNewsletterReader();
    initForms();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
