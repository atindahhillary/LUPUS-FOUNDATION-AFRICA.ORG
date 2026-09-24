/* ==========================================================================
   LFA Shop: catalogue, cart, checkout and order hand-off
   --------------------------------------------------------------------------
   Built for static hosting. The cart lives in the visitor's own browser.

   How an order reaches LFA
     - orderEndpoint set: the order is POSTed as JSON (Formspree, a Worker)
     - otherwise: the customer sends it to LFA on WhatsApp or by email from
       the confirmation page, with every detail already filled in

   How the customer pays
     - M-Pesa: Paybill or Till details are shown as soon as one is set below;
       until then LFA confirms the order and sends payment details from its
       official number
     - Card: instant through Paystack once a public key is set; until then
       LFA sends a secure payment link after confirming the order
     - Pay when you collect: offered only for orders collected in Nairobi

   Nothing secret belongs in this file. It is public. A Paystack PUBLIC key
   (pk_live_...) is designed to be public; a secret key never is.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------- Settings */
  var SHOP = {
    whatsapp: '254142851978',
    phoneDisplay: '+254 142 851 978',
    email: 'info@lupusfa.org',
    orderEndpoint: '',                   // e.g. 'https://formspree.io/f/xxxxxxxx'
    mpesa: { paybill: '', till: '' },    // set ONE to show pay-now instructions
    paystackPublicKey: ''                // 'pk_live_...' switches on instant card payment
  };

  var TEE_PRICE = 1500; // per T-shirt, both designs
  var SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  var MAX_QTY = 20;

  var PRODUCTS = [
    {
      id: 'warrior-hoodie', name: 'Lupus Warrior Hoodie', cat: 'apparel', price: 2500, sizes: SIZES,
      img: 'assets/img/shop/warrior-hoodie.jpg',
      alt: 'Grey hoodie with the purple Lupus Warrior, Stronger Every Day seal on the chest',
      blurb: 'Grey pullover hoodie with the Lupus Warrior seal on the chest.',
      about: 'For the cold mornings, the long clinic queues and the days you want to be seen. The Lupus Warrior seal says what many of our members feel: stronger every day.',
      details: ['Lupus Warrior, Stronger Every Day seal in LFA purple', 'Drawstring hood and front pocket', 'Unisex sizing, S to XXL'],
      gallery: [{ src: 'assets/img/shop/warrior-hoodie.jpg', alt: 'Lupus Warrior hoodie, front' }]
    },
    {
      id: 'warrior-tee', name: 'Lupus Warrior T-shirt', cat: 'apparel', price: TEE_PRICE, sizes: SIZES,
      img: 'assets/img/shop/warrior-tee.jpg',
      alt: 'Grey T-shirt with the purple Lupus Warrior, Stronger Every Day seal on the front',
      blurb: 'Grey crew-neck T-shirt with the Lupus Warrior seal on the front.',
      about: 'An everyday T-shirt that starts conversations. Wear it to a support group, a clinic visit or a walk, and let it say what is hard to put into words.',
      details: ['Lupus Warrior, Stronger Every Day seal on the front', 'Grey crew neck', 'Unisex sizing, S to XXL'],
      gallery: [{ src: 'assets/img/shop/warrior-tee.jpg', alt: 'Lupus Warrior T-shirt, front' }]
    },
    {
      id: 'steps-tee', name: 'Steps for Change T-shirt', cat: 'apparel', price: TEE_PRICE, sizes: SIZES,
      tag: 'World Lupus Day 2026',
      img: 'assets/img/shop/steps-tee-front.jpg',
      alt: 'Grey T-shirt printed with footprints and the words Steps for change 2026',
      blurb: 'The official World Lupus Day 2026 walk T-shirt, with the Lupus Warrior seal on the back.',
      about: 'The T-shirt hundreds of warriors, caregivers and supporters wore as they walked through Nairobi on 9 May 2026 to make lupus visible.',
      details: ['Steps for change 2026 footprints on the front, LFA mark on the chest', 'Lupus Warrior seal on the back', 'Grey crew neck, unisex sizing S to XXL'],
      gallery: [
        { src: 'assets/img/shop/steps-tee-front.jpg', alt: 'Steps for Change T-shirt, front' },
        { src: 'assets/img/shop/steps-tee-back.jpg', alt: 'Steps for Change T-shirt, back with the Lupus Warrior seal' },
        { src: 'assets/img/shop/steps-tee-worn.jpg', alt: 'The Steps for Change T-shirt, worn' }
      ]
    },
    {
      id: 'warrior-notebook', name: 'Lupus Warrior Notebook', cat: 'stationery', price: 1500, sizes: null,
      img: 'assets/img/shop/notebook.jpg',
      alt: 'Purple notebook with the Lupus Warrior seal and the words Lupus Foundation of Africa',
      blurb: 'Purple notebook with elastic closure, ribbon bookmark and lined pages.',
      about: 'For symptom diaries, appointment questions, medication notes and everything in between. Many of our members say a written record changed their conversations with their doctors.',
      details: ['Purple cover with the Lupus Warrior seal', 'Elastic band closure and ribbon bookmark', 'Lined pages headed Stronger Every Day', 'Back cover reads Awareness, Support, Advocacy'],
      gallery: [
        { src: 'assets/img/shop/notebook.jpg', alt: 'Lupus Warrior notebook, front cover' },
        { src: 'assets/img/shop/notebook-pages.jpg', alt: 'Notebook open, lined pages headed Stronger Every Day' },
        { src: 'assets/img/shop/notebook-cover.jpg', alt: 'Close-up of the Lupus Warrior seal on the cover' },
        { src: 'assets/img/shop/notebook-band.jpg', alt: 'Elastic band closure' },
        { src: 'assets/img/shop/notebook-ribbon.jpg', alt: 'Ribbon bookmark' },
        { src: 'assets/img/shop/notebook-back.jpg', alt: 'Back cover with LFA branding' }
      ]
    }
  ];

  // fee: 0 = free, null = LFA confirms it with the customer. Set numbers here
  // once LFA has agreed rider and courier rates and totals will include them.
  var DELIVERY = [
    { id: 'pickup', label: 'Collect in Nairobi', note: 'We confirm the collection point and a time that suits you.', fee: 0 },
    { id: 'nairobi', label: 'Delivery within Nairobi', note: 'By rider. We confirm the fee when we call you.', fee: null },
    { id: 'country', label: 'Delivery outside Nairobi', note: 'By courier to your town. We confirm the fee when we call you.', fee: null }
  ];

  /* -------------------------------------------------------------- Helpers */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function byDelivery(id) { for (var i = 0; i < DELIVERY.length; i++) if (DELIVERY[i].id === id) return DELIVERY[i]; return DELIVERY[0]; }
  function money(n) { return 'KES ' + Math.round(n).toLocaleString('en-KE'); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function keyOf(id, size) { return id + '|' + (size || ''); }
  function read(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ----------------------------------------------------------------- Cart */
  var CART_KEY = 'lfa-cart-v1', ORDERS_KEY = 'lfa-orders-v1';
  var cart = sanitise(read(CART_KEY, []));

  function sanitise(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (l) {
      var p = l && byId(l.id);
      if (!p) return false;
      if (p.sizes && p.sizes.indexOf(l.size) === -1) return false;
      if (!p.sizes) l.size = '';
      l.qty = Math.max(1, Math.min(MAX_QTY, parseInt(l.qty, 10) || 1));
      return true;
    });
  }
  function find(k) { for (var i = 0; i < cart.length; i++) if (keyOf(cart[i].id, cart[i].size) === k) return cart[i]; return null; }
  function count() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function subtotal() { return cart.reduce(function (n, l) { return n + byId(l.id).price * l.qty; }, 0); }
  function commit() { write(CART_KEY, cart); render(); }

  function add(id, size, qty) {
    var p = byId(id);
    if (!p || (p.sizes && !size)) return;
    var line = find(keyOf(id, size));
    if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
    else cart.push({ id: id, size: size || '', qty: Math.min(MAX_QTY, qty) });
    commit();
    toast(p.name + (size ? ', size ' + size : '') + ' added to your cart');
    $$('.cart-btn').forEach(function (b) { b.classList.remove('is-bumped'); void b.offsetWidth; b.classList.add('is-bumped'); });
  }
  function setQty(k, q) {
    var l = find(k); if (!l) return;
    if (q < 1) return remove(k);
    l.qty = Math.min(MAX_QTY, q); commit();
  }
  function remove(k) { cart = cart.filter(function (l) { return keyOf(l.id, l.size) !== k; }); commit(); }

  // Keep every open tab in step with the same cart
  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) { cart = sanitise(read(CART_KEY, [])); render(); }
  });

  /* ------------------------------------------------------------- Rendering */
  function render() {
    var n = count();
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    $$('.cart-btn').forEach(function (b) {
      b.setAttribute('aria-label', n ? 'Open cart, ' + n + (n === 1 ? ' item' : ' items') : 'Open cart, empty');
    });
    renderDrawer();
    if ($('#co-main') && !$('#co-main').hidden) renderSummary();
  }

  function qtyHtml(k, q, label) {
    return '<div class="qty qty--sm" role="group" aria-label="Quantity for ' + esc(label) + '">' +
      '<button type="button" data-qty="' + k + '" data-step="-1" aria-label="Decrease quantity">&minus;</button>' +
      '<span>' + q + '</span>' +
      '<button type="button" data-qty="' + k + '" data-step="1" aria-label="Increase quantity">+</button></div>';
  }

  function renderDrawer() {
    var body = $('#cart-lines'), foot = $('#cart-foot');
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty"><p><strong>Your cart is empty.</strong></p>' +
        '<p>Hoodies, T-shirts and notebooks that carry the message.</p>' +
        '<a class="btn btn--primary btn--sm" href="shop.html">Browse the shop</a></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = cart.map(function (l) {
      var p = byId(l.id), k = keyOf(l.id, l.size);
      return '<div class="cart-line">' +
        '<img src="' + p.img + '" alt="" width="72" height="90">' +
        '<div><div class="cart-line-name">' + p.name + '</div>' +
        '<div class="cart-line-meta">' + (l.size ? 'Size ' + l.size + ' &middot; ' : '') + money(p.price) + ' each</div>' +
        qtyHtml(k, l.qty, p.name + (l.size ? ' size ' + l.size : '')) +
        '<button type="button" class="cart-remove" data-remove="' + k + '">Remove</button></div>' +
        '<div class="cart-line-price">' + money(p.price * l.qty) + '</div></div>';
    }).join('');
    $('#cart-subtotal').textContent = money(subtotal());
  }

  /* ------------------------------------------------------ Drawer + modals */
  var lastFocus = null;

  function openDrawer() {
    var d = $('#cart-drawer'); if (!d) return;
    closeQuickView(true);
    lastFocus = document.activeElement;
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false');
    $('#cart-overlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var c = $('.cart-close', d); if (c) c.focus(); }, 60);
  }
  function closeDrawer() {
    var d = $('#cart-drawer'); if (!d || !d.classList.contains('is-open')) return;
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true');
    $('#cart-overlay').classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trapFocus(e, root) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea', root)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#shop-toast'); if (!t) return;
    $('#shop-toast-msg').textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 4500);
  }

  /* ------------------------------------------------------------ Shop page */
  function renderShop() {
    var grid = $('#shop-grid'); if (!grid) return;
    grid.innerHTML = PRODUCTS.map(function (p) {
      var action = p.sizes
        ? '<button type="button" class="btn btn--primary btn--sm" data-view="' + p.id + '">Choose size</button>'
        : '<button type="button" class="btn btn--primary btn--sm" data-add="' + p.id + '">Add to cart</button>';
      return '<article class="product" data-cat="' + p.cat + '">' +
        '<button type="button" class="product-media" data-view="' + p.id + '" aria-label="View details: ' + esc(p.name) + '">' +
          '<img src="' + p.img + '" alt="' + esc(p.alt) + '" loading="lazy" width="800" height="1000">' +
          (p.tag ? '<span class="product-tag">' + p.tag + '</span>' : '') +
        '</button>' +
        '<div class="product-body">' +
          '<p class="product-cat">' + (p.cat === 'apparel' ? 'Apparel' : 'Stationery') + '</p>' +
          '<h3 class="product-name"><button type="button" class="product-link" data-view="' + p.id + '">' + p.name + '</button></h3>' +
          '<p class="product-desc">' + p.blurb + '</p>' +
          '<div class="product-foot"><span class="price">' + money(p.price) + '</span>' + action + '</div>' +
        '</div></article>';
    }).join('');

    var id = location.hash.slice(1);
    if (byId(id)) quickView(id);
    // Same-page links and back/forward only change the hash, with no reload
    window.addEventListener('hashchange', function () {
      var h = location.hash.slice(1);
      if (byId(h)) quickView(h);
    });
  }

  function filterShop(cat) {
    $$('[data-shop-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-shop-filter') === cat)); });
    $$('#shop-grid .product').forEach(function (a) { a.hidden = !(cat === 'all' || a.getAttribute('data-cat') === cat); });
  }

  var qvState = null;

  function quickView(id) {
    var p = byId(id), qv = $('#qv'); if (!p || !qv) return;
    if (!qv.classList.contains('is-open')) lastFocus = document.activeElement;
    qvState = { id: id, size: '', qty: 1 };
    var sizes = p.sizes ? '<fieldset class="sizes"><legend>Size</legend><div class="sizes-row">' + p.sizes.map(function (s) {
      return '<label class="size"><input type="radio" name="qv-size" value="' + s + '"><span>' + s + '</span></label>';
    }).join('') + '</div><p class="field-err" id="qv-size-err" role="alert"></p>' +
      '<p class="qv-note">Unsure of your size? <a href="https://wa.me/' + SHOP.whatsapp + '" target="_blank" rel="noopener">Ask us on WhatsApp</a>.</p></fieldset>' : '';
    var thumbs = p.gallery.length > 1 ? '<div class="qv-thumbs" role="group" aria-label="Product photos">' + p.gallery.map(function (g, i) {
      return '<button type="button" class="qv-thumb" data-thumb="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="Photo ' + (i + 1) + ': ' + esc(g.alt) + '"><img src="' + g.src + '" alt=""></button>';
    }).join('') + '</div>' : '';

    $('#qv-content').innerHTML =
      '<div class="qv-gallery"><div class="qv-main"><img id="qv-img" src="' + p.gallery[0].src + '" alt="' + esc(p.gallery[0].alt) + '"></div>' + thumbs + '</div>' +
      '<div class="qv-info">' +
        '<p class="product-cat">' + (p.tag || (p.cat === 'apparel' ? 'Apparel' : 'Stationery')) + '</p>' +
        '<h2 class="qv-title" id="qv-title">' + p.name + '</h2>' +
        '<p class="price price--lg">' + money(p.price) + '</p>' +
        '<p>' + p.about + '</p>' +
        '<ul class="tick-list">' + p.details.map(function (d) {
          return '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>' + d + '</li>';
        }).join('') + '</ul>' +
        sizes +
        '<div class="qv-buy"><div class="qty" role="group" aria-label="Quantity">' +
          '<button type="button" data-qv-step="-1" aria-label="Decrease quantity">&minus;</button>' +
          '<span id="qv-qty">1</span>' +
          '<button type="button" data-qv-step="1" aria-label="Increase quantity">+</button></div>' +
          '<button type="button" class="btn btn--gold" id="qv-add">Add to cart &middot; ' + money(p.price) + '</button></div>' +
        '<p class="qv-note">Every purchase supports the Lupus Foundation of Africa.</p>' +
      '</div>';

    $$('input[name="qv-size"]', qv).forEach(function (r) {
      r.addEventListener('change', function () {
        qvState.size = r.value;
        var err = $('#qv-size-err'); if (err) { err.textContent = ''; err.classList.remove('is-on'); }
      });
    });

    qv.classList.add('is-open');
    qv.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    setTimeout(function () { var c = $('.qv-close', qv); if (c) c.focus(); }, 60);
  }

  function closeQuickView(silent) {
    var qv = $('#qv'); if (!qv || !qv.classList.contains('is-open')) return;
    qv.classList.remove('is-open'); qv.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function qvAdd() {
    var p = byId(qvState.id);
    if (p.sizes && !qvState.size) {
      var err = $('#qv-size-err');
      err.textContent = 'Please choose a size.'; err.classList.add('is-on');
      var first = $('input[name="qv-size"]'); if (first) first.focus();
      return;
    }
    add(p.id, qvState.size, qvState.qty);
    closeQuickView();
  }

  /* ------------------------------------------------------------- Checkout */
  var busy = false;

  function setSteps(n) {
    $$('#co-steps li').forEach(function (li, i) {
      li.classList.toggle('is-done', i + 1 < n);
      li.classList.toggle('is-current', i + 1 === n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }
  function show(sel, on) { var el = $(sel); if (el) el.hidden = !on; }

  function feeLabel(d) { return d.fee === 0 ? 'Free' : d.fee == null ? 'Confirmed when we call' : money(d.fee); }
  function totalLabel(sub, d) { return d.fee == null ? money(sub) + ' + delivery' : money(sub + d.fee); }
  function payLabel(id) { return { mpesa: 'M-Pesa', card: 'Card (Visa or Mastercard)', collect: 'Pay when you collect' }[id] || id; }

  function paymentOptions(deliveryId) {
    var mp = SHOP.mpesa.paybill ? 'Pay straight away to our Paybill, using your order number as the account.'
      : SHOP.mpesa.till ? 'Pay straight away to our Buy Goods Till.'
      : 'We confirm your order first, then send M-Pesa payment details from ' + SHOP.phoneDisplay + '.';
    var cd = SHOP.paystackPublicKey ? 'Pay securely now. You will need to give an email address.'
      : 'We send you a secure card payment link after confirming your order.';
    return [
      { id: 'mpesa', label: 'M-Pesa', note: mp },
      { id: 'card', label: 'Card (Visa or Mastercard)', note: cd },
      { id: 'collect', label: 'Pay when you collect', note: deliveryId === 'pickup' ? 'Pay by M-Pesa or cash when you pick up your order.' : 'Only for orders collected in Nairobi.', disabled: deliveryId !== 'pickup' }
    ];
  }

  function optionHtml(name, o, checked, aside) {
    return '<label class="opt"><input type="radio" name="' + name + '" value="' + o.id + '"' + (checked ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '>' +
      '<span class="opt-text"><span class="opt-t">' + o.label + '</span><span class="opt-d">' + o.note + '</span></span>' +
      (aside ? '<span class="opt-fee">' + aside + '</span>' : '') + '</label>';
  }

  function currentDelivery() { var r = $('input[name="delivery"]:checked'); return byDelivery(r ? r.value : 'pickup'); }

  function renderPayments() {
    var box = $('#payment-options'); if (!box) return;
    var d = currentDelivery().id;
    var prev = ($('input[name="payment"]:checked') || {}).value || 'mpesa';
    var opts = paymentOptions(d);
    if (prev === 'collect' && d !== 'pickup') prev = 'mpesa';
    box.innerHTML = opts.map(function (o) { return optionHtml('payment', o, o.id === prev); }).join('');
    syncEmailRequirement();
  }

  function syncEmailRequirement() {
    var email = $('#co-email'); if (!email) return;
    var pay = ($('input[name="payment"]:checked') || {}).value;
    var need = pay === 'card' && !!SHOP.paystackPublicKey;
    email.required = need;
    $('#co-email-req').hidden = !need;
  }

  function syncAddress() {
    var needs = currentDelivery().id !== 'pickup';
    show('#co-address', needs);
    ['#co-town', '#co-street'].forEach(function (s) { var f = $(s); if (f) f.required = needs; });
  }

  function renderSummary() {
    var lines = $('#sum-lines'), rows = $('#sum-rows'); if (!lines) return;
    if (!cart.length) return showEmpty();
    lines.innerHTML = cart.map(function (l) {
      var p = byId(l.id);
      return '<div class="sum-line"><img src="' + p.img + '" alt="" width="56" height="70">' +
        '<div><div class="cart-line-name">' + p.name + '</div>' +
        '<div class="cart-line-meta">' + (l.size ? 'Size ' + l.size + ' &middot; ' : '') + 'Qty ' + l.qty + '</div></div>' +
        '<span class="cart-line-price">' + money(p.price * l.qty) + '</span></div>';
    }).join('');
    var d = currentDelivery(), sub = subtotal();
    rows.innerHTML =
      '<div class="sum-row"><span>Subtotal</span><span>' + money(sub) + '</span></div>' +
      '<div class="sum-row"><span>Delivery</span><span>' + feeLabel(d) + '</span></div>' +
      '<div class="sum-row sum-total"><span>Total</span><span>' + totalLabel(sub, d) + '</span></div>';
    var btn = $('#place-order');
    if (btn && !busy) btn.textContent = 'Place order · ' + totalLabel(sub, d);
  }

  function showEmpty() {
    show('#co-main', false); show('#co-done', false); show('#co-empty', true);
    setSteps(1);
  }

  function validate(form) {
    var ok = true, first = null;
    $$('input, select, textarea', form).forEach(function (f) {
      if (f.name === '_hp' || f.type === 'radio' || f.closest('[hidden]')) return;
      var wrap = f.closest('.field'), err = wrap && $('.field-err', wrap);
      var valid = f.checkValidity();
      f.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (err) {
        err.textContent = valid ? '' : f.validity.valueMissing ? 'Please fill this in.'
          : f.type === 'email' ? 'Please enter a valid email address.'
          : f.type === 'tel' ? 'Please enter a number we can reach you on, for example 0712 345 678.'
          : f.validationMessage;
        err.classList.toggle('is-on', !valid);
      }
      if (!valid) { ok = false; if (!first) first = f; }
    });
    if (first) first.focus();
    return ok;
  }

  function clean(v) { return String(v || '').trim().slice(0, 400); }

  function orderId() {
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '', bytes;
    if (window.crypto && crypto.getRandomValues) bytes = crypto.getRandomValues(new Uint8Array(4));
    else bytes = [0, 0, 0, 0].map(function () { return Math.floor(Math.random() * 256); });
    for (var i = 0; i < 4; i++) r += chars[bytes[i] % chars.length];
    return 'LFA-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + r;
  }

  function buildOrder(form) {
    var fd = new FormData(form), d = byDelivery(fd.get('delivery')), sub = subtotal();
    return {
      id: orderId(),
      placedAt: new Date().toISOString(),
      items: cart.map(function (l) {
        var p = byId(l.id);
        return { id: p.id, name: p.name, size: l.size, qty: l.qty, price: p.price, total: p.price * l.qty, img: p.img };
      }),
      subtotal: sub,
      delivery: { id: d.id, label: d.label, fee: d.fee },
      total: sub + (d.fee || 0),
      totalPending: d.fee == null,
      payment: fd.get('payment') || 'mpesa',
      customer: {
        name: clean(fd.get('name')), phone: clean(fd.get('phone')), email: clean(fd.get('email')),
        town: d.id === 'pickup' ? '' : clean(fd.get('town')),
        street: d.id === 'pickup' ? '' : clean(fd.get('street')),
        notes: clean(fd.get('notes'))
      },
      paid: false, paymentRef: '', sent: false
    };
  }

  function orderText(o) {
    var when = new Date(o.placedAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    var L = ['New order from the LFA website', 'Order: ' + o.id, 'Placed: ' + when, '', 'Items:'];
    o.items.forEach(function (i) { L.push('- ' + i.qty + ' x ' + i.name + (i.size ? ' (size ' + i.size + ')' : '') + ': ' + money(i.total)); });
    L.push('', 'Subtotal: ' + money(o.subtotal));
    L.push('Delivery: ' + o.delivery.label + ' (' + feeLabel(o.delivery) + ')');
    L.push('Total: ' + (o.totalPending ? money(o.total) + ' + delivery' : money(o.total)));
    L.push('Payment: ' + payLabel(o.payment) + (o.paid ? ' (PAID, reference ' + o.paymentRef + ')' : ''));
    L.push('', 'Name: ' + o.customer.name, 'Phone: ' + o.customer.phone);
    if (o.customer.email) L.push('Email: ' + o.customer.email);
    if (o.delivery.id !== 'pickup') L.push('Deliver to: ' + [o.customer.street, o.customer.town].filter(Boolean).join(', '));
    if (o.customer.notes) L.push('Notes: ' + o.customer.notes);
    return L.join('\n');
  }

  function saveOrder(o) {
    var list = read(ORDERS_KEY, []);
    list = (Array.isArray(list) ? list : []).filter(function (x) { return x && x.id !== o.id; });
    list.unshift(o);
    write(ORDERS_KEY, list.slice(0, 10));
  }
  // Orders come back out of browser storage before they are rendered as HTML,
  // so anything not shaped exactly like an order this script wrote is ignored.
  var ORDER_ID = /^LFA-\d{6}-[A-Z2-9]{4}$/;
  var SHOP_IMG = /^assets\/img\/shop\/[a-z0-9-]+\.jpg$/;
  function validOrder(o) {
    return !!(o && ORDER_ID.test(o.id) && Array.isArray(o.items) && o.items.length &&
      o.items.every(function (i) { return i && SHOP_IMG.test(i.img) && byId(i.id) && (parseInt(i.qty, 10) > 0); }) &&
      o.customer && o.delivery && byDelivery(o.delivery.id).id === o.delivery.id &&
      ['mpesa', 'card', 'collect'].indexOf(o.payment) > -1);
  }
  function findOrder(id) {
    if (!ORDER_ID.test(id || '')) return null;
    var list = read(ORDERS_KEY, []);
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return validOrder(list[i]) ? list[i] : null;
    return null;
  }

  function deliver(o) {
    if (!SHOP.orderEndpoint || !window.fetch) return Promise.resolve(false);
    return fetch(SHOP.orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: 'New LFA shop order ' + o.id, order_id: o.id, summary: orderText(o), order: o })
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  function loadScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) return cb(true);
    var s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  // Paystack inline checkout. Confirm every payment in the Paystack
  // dashboard before dispatching: a browser callback alone is not proof.
  function payWithPaystack(o, done) {
    loadScript('https://js.paystack.co/v1/inline.js', function (ok) {
      if (!ok || !window.PaystackPop) return done(false);
      var handler = window.PaystackPop.setup({
        key: SHOP.paystackPublicKey,
        email: o.customer.email,
        amount: Math.round(o.total * 100),
        currency: 'KES',
        ref: o.id,
        metadata: { custom_fields: [
          { display_name: 'Order', variable_name: 'order_id', value: o.id },
          { display_name: 'Phone', variable_name: 'phone', value: o.customer.phone }
        ] },
        callback: function (res) { done(true, res && res.reference); },
        onClose: function () { done(false); }
      });
      handler.openIframe();
    });
  }

  function finish(o) {
    deliver(o).then(function (sent) {
      o.sent = sent;
      saveOrder(o);
      cart = []; commit();
      if (history.replaceState) history.replaceState(null, '', 'checkout.html?order=' + encodeURIComponent(o.id));
      busy = false;
      showConfirmation(o);
    });
  }

  function payInstructions(o) {
    var amt = o.totalPending ? money(o.total) + ' plus the delivery fee we confirm with you' : money(o.total);
    if (o.paid) {
      return '<p><strong>Paid.</strong> We received your card payment, reference <strong>' + esc(o.paymentRef) + '</strong>.' +
        (o.totalPending ? ' We will confirm the delivery fee with you separately.' : '') + '</p>';
    }
    if (o.payment === 'mpesa') {
      if (SHOP.mpesa.paybill) {
        return '<p>Pay <strong>' + amt + '</strong> by M-Pesa:</p><dl class="pay-dl"><dt>Paybill</dt><dd>' + esc(SHOP.mpesa.paybill) +
          '</dd><dt>Account number</dt><dd>' + o.id + '</dd></dl>' +
          (o.totalPending ? '<p>You can pay for your items now and the delivery fee once we confirm it.</p>' : '');
      }
      if (SHOP.mpesa.till) {
        return '<p>Pay <strong>' + amt + '</strong> by M-Pesa to Buy Goods Till <strong>' + esc(SHOP.mpesa.till) + '</strong>, then send us the M-Pesa message with your order number.</p>';
      }
      return '<p>We will call or WhatsApp you from <strong>' + SHOP.phoneDisplay + '</strong> to confirm your order and share M-Pesa payment details for <strong>' + amt + '</strong>.</p>';
    }
    if (o.payment === 'card') {
      return '<p>We will send a secure card payment link for <strong>' + amt + '</strong> to ' +
        (o.customer.email ? '<strong>' + esc(o.customer.email) + '</strong>' : 'your phone') + ' once we have confirmed your order.</p>';
    }
    return '<p>Pay <strong>' + money(o.total) + '</strong> by M-Pesa or cash when you collect. We will confirm the collection point and time with you.</p>';
  }

  function showConfirmation(o) {
    show('#co-main', false); show('#co-empty', false);
    setSteps(3);
    var box = $('#co-done'); box.hidden = false;
    var text = orderText(o);
    var wa = 'https://wa.me/' + SHOP.whatsapp + '?text=' + encodeURIComponent(text);
    var mail = 'mailto:' + SHOP.email + '?subject=' + encodeURIComponent('Shop order ' + o.id) + '&body=' + encodeURIComponent(text);
    var when = new Date(o.placedAt).toLocaleString('en-KE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    var head = o.sent
      ? '<p class="eyebrow">Order received</p><h2 tabindex="-1" id="co-done-title">Thank you, your order is in</h2>' +
        '<p class="lead">We have received order <strong>' + o.id + '</strong> and will contact you on <strong>' + esc(o.customer.phone) + '</strong> within one working day.</p>'
      : '<p class="eyebrow">Almost done</p><h2 tabindex="-1" id="co-done-title">One last step: send us your order</h2>' +
        '<p class="lead">Your order <strong>' + o.id + '</strong> is ready. Send it to our team and we will confirm it with you personally before you pay.</p>' +
        '<div class="btn-row"><a class="btn btn--wa" href="' + wa + '" target="_blank" rel="noopener" data-mark-sent>' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2m0 1.8a8.2 8.2 0 1 1-4.2 15.24l-.3-.18-3 .79.8-2.93-.2-.31A8.2 8.2 0 0 1 12 3.8"/></svg>' +
          'Send order on WhatsApp</a>' +
          '<a class="btn btn--ghost" href="' + mail + '" data-mark-sent>Send by email instead</a></div>' +
        '<p class="form-note" id="co-sent-note" hidden>Thank you. As soon as your message reaches us we will confirm your order.</p>';

    var items = o.items.map(function (i) {
      return '<div class="sum-line"><img src="' + i.img + '" alt="" width="56" height="70">' +
        '<div><div class="cart-line-name">' + esc(i.name) + '</div><div class="cart-line-meta">' + (i.size ? 'Size ' + esc(i.size) + ' &middot; ' : '') + 'Qty ' + i.qty + '</div></div>' +
        '<span class="cart-line-price">' + money(i.total) + '</span></div>';
    }).join('');

    box.innerHTML =
      '<div class="confirm">' + head +
      '<div class="confirm-grid">' +
        '<div>' +
          '<h3>How to pay</h3><div class="pay-box">' + payInstructions(o) + '</div>' +
          '<h3>What happens next</h3><ol class="next-steps">' +
            '<li>We confirm your order, sizes and ' + (o.delivery.id === 'pickup' ? 'a collection time' : 'the delivery fee') + ' with you.</li>' +
            '<li>' + (o.paid ? 'Your payment is already in.' : 'You pay using the details above.') + '</li>' +
            '<li>' + (o.delivery.id === 'pickup' ? 'You collect your order in Nairobi.' : 'We send your order to ' + esc(o.customer.town || 'you') + '.') + '</li>' +
          '</ol>' +
          '<div class="disclaimer"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
            '<p>LFA will only contact you about this order from <strong>' + SHOP.phoneDisplay + '</strong> or <strong>' + SHOP.email + '</strong>. Please never send money to any other number.</p></div>' +
        '</div>' +
        '<aside class="summary"><h3>Order ' + o.id + '</h3><p class="cart-line-meta">Placed ' + when + '</p>' + items +
          '<div class="sum-row"><span>Subtotal</span><span>' + money(o.subtotal) + '</span></div>' +
          '<div class="sum-row"><span>' + esc(o.delivery.label) + '</span><span>' + feeLabel(o.delivery) + '</span></div>' +
          '<div class="sum-row sum-total"><span>Total</span><span>' + (o.totalPending ? money(o.total) + ' + delivery' : money(o.total)) + '</span></div>' +
          '<div class="sum-row"><span>Payment</span><span>' + payLabel(o.payment) + '</span></div>' +
          '<div class="sum-cust"><strong>' + esc(o.customer.name) + '</strong><br>' + esc(o.customer.phone) +
            (o.customer.email ? '<br>' + esc(o.customer.email) : '') +
            (o.delivery.id !== 'pickup' ? '<br>' + esc([o.customer.street, o.customer.town].filter(Boolean).join(', ')) : '') + '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="btn-row confirm-actions"><a class="btn btn--primary" href="shop.html">Continue shopping</a>' +
        '<button type="button" class="btn btn--ghost" data-print>Print or save receipt</button></div>' +
      '</div>';

    var title = $('#co-done-title');
    window.scrollTo(0, Math.max(0, box.getBoundingClientRect().top + window.scrollY - 120));
    if (title) title.focus({ preventScroll: true });
  }

  function initCheckout() {
    if (!$('#co-app')) return;
    var oid = new URLSearchParams(location.search).get('order');
    var existing = oid && findOrder(oid);
    if (existing) return showConfirmation(existing);
    if (!cart.length) return showEmpty();

    show('#co-main', true);
    setSteps(2);
    $('#delivery-options').innerHTML = DELIVERY.map(function (d, i) { return optionHtml('delivery', d, i === 0, feeLabel(d)); }).join('');
    renderPayments(); syncAddress(); renderSummary();

    var form = $('#co-form');
    form.addEventListener('change', function (e) {
      if (e.target.name === 'delivery') { renderPayments(); syncAddress(); renderSummary(); }
      if (e.target.name === 'payment') syncEmailRequirement();
    });
    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () {
        if (f.getAttribute('aria-invalid') === 'true' && f.checkValidity()) {
          f.setAttribute('aria-invalid', 'false');
          var err = f.closest('.field') && $('.field-err', f.closest('.field'));
          if (err) { err.textContent = ''; err.classList.remove('is-on'); }
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (!cart.length) return showEmpty();
      if (!validate(form)) return;
      if (new FormData(form).get('_hp')) return;
      var o = buildOrder(form);
      busy = true;
      var btn = $('#place-order'); btn.disabled = true; btn.textContent = 'Placing your order…';
      if (o.payment === 'card' && SHOP.paystackPublicKey) {
        payWithPaystack(o, function (paid, ref) {
          if (paid) { o.paid = true; o.paymentRef = ref || o.id; }
          finish(o);
        });
      } else {
        finish(o);
      }
    });
  }

  /* --------------------------------------------------------------- Events */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cart-open],[data-cart-close],[data-add],[data-view],[data-qty],[data-remove],[data-thumb],[data-qv-step],[data-shop-filter],[data-qv-close],[data-mark-sent],[data-print],#qv-add');
    if (!t) {
      if (e.target.id === 'qv') closeQuickView();
      return;
    }
    if (t.hasAttribute('data-cart-open')) { e.preventDefault(); openDrawer(); }
    else if (t.hasAttribute('data-cart-close')) { e.preventDefault(); closeDrawer(); }
    else if (t.hasAttribute('data-add')) add(t.getAttribute('data-add'), '', 1);
    else if (t.hasAttribute('data-view')) quickView(t.getAttribute('data-view'));
    else if (t.hasAttribute('data-qty')) {
      var l = find(t.getAttribute('data-qty'));
      if (l) setQty(t.getAttribute('data-qty'), l.qty + parseInt(t.getAttribute('data-step'), 10));
    }
    else if (t.hasAttribute('data-remove')) remove(t.getAttribute('data-remove'));
    else if (t.hasAttribute('data-thumb')) {
      var p = byId(qvState.id), i = parseInt(t.getAttribute('data-thumb'), 10), img = $('#qv-img');
      img.src = p.gallery[i].src; img.alt = p.gallery[i].alt;
      $$('.qv-thumb').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
    }
    else if (t.hasAttribute('data-qv-step')) {
      qvState.qty = Math.max(1, Math.min(MAX_QTY, qvState.qty + parseInt(t.getAttribute('data-qv-step'), 10)));
      $('#qv-qty').textContent = qvState.qty;
    }
    else if (t.id === 'qv-add') qvAdd();
    else if (t.hasAttribute('data-qv-close')) closeQuickView();
    else if (t.hasAttribute('data-shop-filter')) filterShop(t.getAttribute('data-shop-filter'));
    else if (t.hasAttribute('data-mark-sent')) { var n = $('#co-sent-note'); if (n) n.hidden = false; }
    else if (t.hasAttribute('data-print')) window.print();
  });

  document.addEventListener('keydown', function (e) {
    var qv = $('#qv'), d = $('#cart-drawer');
    if (qv && qv.classList.contains('is-open')) {
      if (e.key === 'Escape') closeQuickView(); else trapFocus(e, qv);
    } else if (d && d.classList.contains('is-open')) {
      if (e.key === 'Escape') closeDrawer(); else trapFocus(e, d);
    }
  });

  function init() {
    render();
    renderShop();
    initCheckout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
