/* ============================================================
   VETRIVAAGAI CHIT FUNDS — shared interactions
   assets/js/main.js
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Sticky header ---------- */
  var header = document.querySelector('.header');
  var toTop = document.querySelector('.to-top');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 520);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Mobile drawer ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.querySelector('.drawer');
  var scrim = document.querySelector('.scrim');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('open', open);
    if (burger) {
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    document.body.classList.toggle('locked', open);
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('open'));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  /* ---------- Nav dropdown ---------- */
  /* Hover opens instantly; a short delay on leaving means a slightly
     off-target mouse path never snaps the menu shut. Tap opens it on
     touch devices, keyboard focus opens it, Escape / outside click closes. */
  var CLOSE_DELAY = 260;

  function coarsePointer() {
    return window.matchMedia('(hover:none)').matches;
  }

  document.querySelectorAll('.nav-item').forEach(function (item) {
    var trig = item.querySelector('.nav-trig');
    var panel = item.querySelector('.nav-panel');
    if (!trig || !panel) return;

    var timer = null;
    var wasOpen = false;

    trig.setAttribute('aria-haspopup', 'true');
    trig.setAttribute('aria-expanded', 'false');

    function open() {
      clearTimeout(timer);
      item.classList.add('open');
      trig.setAttribute('aria-expanded', 'true');
    }
    function close() {
      clearTimeout(timer);
      item.classList.remove('open');
      trig.setAttribute('aria-expanded', 'false');
    }
    function closeSoon() {
      clearTimeout(timer);
      timer = setTimeout(close, CLOSE_DELAY);
    }

    /* Mouse / pen */
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      open();
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      closeSoon();
    });

    /* Keyboard */
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!item.contains(document.activeElement)) close();
      }, 0);
    });

    /* Touch: first tap opens the menu, second tap follows the link.
       pointerdown runs before focus, so it sees the real prior state. */
    trig.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      wasOpen = item.classList.contains('open');
    });
    trig.addEventListener('click', function (e) {
      if (!coarsePointer()) return;
      if (!wasOpen) {
        e.preventDefault();
        open();
      }
    });

    document.addEventListener('click', function (e) {
      if (!item.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !item.classList.contains('open')) return;
      close();
      if (item.contains(document.activeElement)) trig.focus();
    });
  });

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var dur = 1500;
    var start = null;

    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animateCount(en.target);
          co.unobserve(en.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '');
    });
  }

  /* ---------- Enquiry form (front-end only) ---------- */
  var form = document.querySelector('#enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var msg = document.querySelector('#formMsg');
      if (msg) {
        msg.classList.add('show');
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
      setTimeout(function () { if (msg) msg.classList.remove('show'); }, 8000);
    });
  }

  /* ---------- Founder portrait fallback ---------- */
  /* Until assets/img/founder.jpg is added, show the monogram placeholder
     instead of a broken-image icon. */
  document.querySelectorAll('.founder-frame img').forEach(function (img) {
    function fail() { img.closest('.founder-frame').classList.add('no-photo'); }
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------- Career application form ---------- */
  var applyForm = document.querySelector('#applyForm');
  if (applyForm) {
    var WA_NUMBER = '919600713333';

    var ROLES = {
      Employee: [
        'Accountant',
        'Legal Officer',
        'Document & Verification Officer',
        'Recovery & Collection Officer',
        'Branch Operations Assistant',
        'Office Administration',
        'Other / Not sure yet'
      ],
      Sales: [
        'Marketing & Sales Executive',
        'Field Sales Officer',
        'Senior Sales Officer',
        'Sales Team Leader',
        'Business Development Executive',
        'Commission Agent / Referral Partner',
        'Other / Not sure yet'
      ]
    };

    var roleSelect = applyForm.querySelector('#afRole');
    var tracks = applyForm.querySelectorAll('input[name="track"]');
    var doneBox = document.querySelector('#applyDone');
    var retryLink = document.querySelector('#applyRetry');
    var againBtn = document.querySelector('#applyAgain');

    function currentTrack() {
      var checked = applyForm.querySelector('input[name="track"]:checked');
      return checked ? checked.value : 'Employee';
    }

    function fillRoles(keep) {
      var list = ROLES[currentTrack()] || [];
      roleSelect.innerHTML = '';
      var blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Select a position';
      roleSelect.appendChild(blank);
      list.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r;
        o.textContent = r;
        roleSelect.appendChild(o);
      });
      if (keep && list.indexOf(keep) > -1) roleSelect.value = keep;
    }

    tracks.forEach(function (t) {
      t.addEventListener('change', function () { fillRoles(roleSelect.value); });
    });
    fillRoles();

    /* "Apply Now" on a role card preselects that track and position */
    document.querySelectorAll('[data-apply-track]').forEach(function (link) {
      link.addEventListener('click', function () {
        var track = link.dataset.applyTrack;
        var role = link.dataset.applyRole;
        var radio = applyForm.querySelector('input[name="track"][value="' + track + '"]');
        if (radio) { radio.checked = true; }
        fillRoles(role);
        if (doneBox) doneBox.classList.remove('show');
        applyForm.style.display = '';
        setTimeout(function () {
          var first = applyForm.querySelector('#afName');
          if (first) first.focus({ preventScroll: true });
        }, 420);
      });
    });

    /* Validation — one clear message per field, shown under the field */
    function fieldOf(el) { return el.closest('.field') || el.closest('.apply-consent'); }

    function setInvalid(el, bad) {
      var wrap = fieldOf(el);
      if (wrap && wrap.classList) wrap.classList.toggle('invalid', !!bad);
    }

    function validate() {
      var ok = true;
      var firstBad = null;

      var name = applyForm.querySelector('#afName');
      var badName = name.value.trim().length < 2;
      setInvalid(name, badName);
      if (badName) { ok = false; firstBad = firstBad || name; }

      var phone = applyForm.querySelector('#afPhone');
      var digits = phone.value.replace(/\D/g, '');
      var badPhone = !/^[6-9]\d{9}$/.test(digits.slice(-10)) || digits.length < 10;
      setInvalid(phone, badPhone);
      if (badPhone) { ok = false; firstBad = firstBad || phone; }

      var email = applyForm.querySelector('#afEmail');
      var badEmail = email.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      setInvalid(email, badEmail);
      if (badEmail) { ok = false; firstBad = firstBad || email; }

      var badRole = roleSelect.value === '';
      setInvalid(roleSelect, badRole);
      if (badRole) { ok = false; firstBad = firstBad || roleSelect; }

      var branch = applyForm.querySelector('#afBranch');
      var badBranch = branch.value === '';
      setInvalid(branch, badBranch);
      if (badBranch) { ok = false; firstBad = firstBad || branch; }

      var consent = applyForm.querySelector('#afConsent');
      if (!consent.checked) {
        ok = false;
        firstBad = firstBad || consent;
        consent.focus({ preventScroll: true });
      }

      if (!ok && firstBad) {
        firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstBad.focus({ preventScroll: true });
      }
      return ok;
    }

    /* Clear the error as soon as the person starts fixing it */
    applyForm.querySelectorAll('input,select,textarea').forEach(function (el) {
      el.addEventListener('input', function () { setInvalid(el, false); });
      el.addEventListener('change', function () { setInvalid(el, false); });
    });

    function buildMessage() {
      var v = function (sel) {
        var el = applyForm.querySelector(sel);
        return el ? el.value.trim() : '';
      };
      var lines = [
        '*New Career Application — Vetrivaagai Chit Funds*',
        '',
        'Track: ' + currentTrack(),
        'Position: ' + roleSelect.value,
        'Name: ' + v('#afName'),
        'Mobile: ' + v('#afPhone')
      ];
      if (v('#afEmail')) lines.push('Email: ' + v('#afEmail'));
      lines.push('Preferred branch: ' + v('#afBranch'));
      lines.push('Experience: ' + v('#afExp'));
      if (v('#afQual')) lines.push('Qualification: ' + v('#afQual'));
      if (v('#afCity')) lines.push('Location: ' + v('#afCity'));
      if (v('#afAbout')) lines.push('', 'About: ' + v('#afAbout'));
      lines.push('', 'Sent from vetrivaagai.com / career page');
      return lines.join('\n');
    }

    applyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage());
      if (retryLink) retryLink.href = url;
      window.open(url, '_blank', 'noopener');

      applyForm.style.display = 'none';
      if (doneBox) {
        doneBox.classList.add('show');
        doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    if (againBtn) {
      againBtn.addEventListener('click', function () {
        applyForm.reset();
        fillRoles();
        applyForm.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
        if (doneBox) doneBox.classList.remove('show');
        applyForm.style.display = '';
        applyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Plan filter (plans page) ---------- */
  /* Each purpose card on the home / Why Chit Fund pages links here as
     plans.html?for=<purpose>#plans. The purpose maps to a plan tier, that
     tier's filter is applied on arrival, and a line explains the narrowing. */
  var PURPOSES = {
    'savings':    { tier: 'starter', label: 'Savings' },
    'education':  { tier: 'growth',  label: 'Education' },
    'marriage':   { tier: 'growth',  label: 'Marriage' },
    'business':   { tier: 'premium', label: 'Business' },
    'medical':    { tier: 'starter', label: 'Medical' },
    'vehicle':    { tier: 'growth',  label: 'Vehicle' },
    'dream-home': { tier: 'premium', label: 'a Dream Home' },
    'travel':     { tier: 'starter', label: 'Travel' }
  };
  var TIER_NAMES = { starter: 'Starter', growth: 'Growth', premium: 'Premium' };

  var chips = document.querySelectorAll('[data-filter]');
  if (chips.length) {
    var note = document.getElementById('purposeNote');

    function applyFilter(tier) {
      chips.forEach(function (c) {
        var on = c.dataset.filter === tier;
        c.classList.toggle('btn-gold', on);
        c.classList.toggle('btn-ghost', !on);
      });
      document.querySelectorAll('[data-tier]').forEach(function (card) {
        card.style.display = (tier === 'all' || card.dataset.tier === tier) ? '' : 'none';
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        applyFilter(chip.dataset.filter);
        if (note) note.hidden = true;
      });
    });

    /* Arriving from a purpose card */
    var param = (new URLSearchParams(window.location.search)).get('for');
    var purpose = param && PURPOSES[param.toLowerCase()];
    if (purpose) {
      applyFilter(purpose.tier);
      if (note) {
        note.innerHTML = 'Showing our <b>' + TIER_NAMES[purpose.tier] +
          '</b> groups \u2014 the usual fit for <b>' + purpose.label + '</b>.' +
          '<a href="plans.html#plans">View all plans</a>';
        note.hidden = false;
      }
    }
  }
})();
