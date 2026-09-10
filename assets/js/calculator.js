/* ============================================================
   VETRIVAAGAI CHIT FUNDS
   assets/js/calculator.js

   UI layer only. Every number on screen comes from ChitEngine
   (assets/js/chit-engine.js); every plan comes from CHIT_PLANS
   (assets/js/chit-plans.js). This file reads inputs, calls the
   engine, and paints the result. It contains no formulas.
   ============================================================ */
(function () {
  'use strict';

  var E = window.ChitEngine;
  var PLANS = window.CHIT_PLANS || [];
  var CFG = window.CHIT_DEFAULTS || {};
  if (!E || !document.getElementById('calcApp')) return;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var fmt = E.formatINR;
  var fmtShort = E.formatINRShort;

  /* ==========================================================
     Small DOM helpers
     ========================================================== */

  /** Write a value into an element, with a brief fade so changes are noticed. */
  function paint(el, text) {
    if (!el || el.textContent === text) return;
    el.classList.add('flash');
    el.textContent = text;
    setTimeout(function () { el.classList.remove('flash'); }, 160);
  }

  function num(id) {
    var el = document.getElementById(id);
    return el ? E.toNumber(el.value) : 0;
  }

  /** Show or clear a validation error under a field. */
  function setError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var box = input && input.closest('.calc-input');
    var err = document.querySelector('[data-err-for="' + fieldId + '"]');
    if (box) box.classList.toggle('err', !!message);
    if (err) {
      err.classList.toggle('show', !!message);
      var span = err.querySelector('span');
      if (span && message) span.textContent = message;
    }
  }

  function clearErrors(fieldIds) {
    fieldIds.forEach(function (id) { setError(id, ''); });
  }

  /** Keep a range slider and its number input in sync. */
  function linkRange(inputId, rangeId, onChange) {
    var input = document.getElementById(inputId);
    var range = document.getElementById(rangeId);
    if (!input || !range) return;
    input.addEventListener('input', function () {
      if (E.toNumber(input.value) >= E.toNumber(range.min) &&
          E.toNumber(input.value) <= E.toNumber(range.max)) {
        range.value = E.toNumber(input.value);
      }
      onChange();
    });
    range.addEventListener('input', function () {
      input.value = range.value;
      onChange();
    });
  }

  /** Wire quick-pick chips that set a field's value. */
  function linkChips(groupSelector, inputId, onChange) {
    var chips = $$(groupSelector + ' .chip');
    var input = document.getElementById(inputId);
    if (!input) return;

    function sync() {
      var v = E.toNumber(input.value);
      chips.forEach(function (c) { c.classList.toggle('on', E.toNumber(c.dataset.value) === v); });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        input.value = c.dataset.value;
        var range = document.getElementById(input.id + 'Range');
        if (range) range.value = c.dataset.value;
        onChange();
      });
    });
    input.addEventListener('input', sync);
    sync();
    return sync;
  }

  /* ==========================================================
     Plan card rendering — shared by all three calculators
     ========================================================== */

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /**
   * Render a list of matched plans into a container.
   * opts.bestCode  — plan code to badge as the recommendation
   * opts.badgeText — text for that badge
   */
  function renderPlans(container, plans, opts) {
    var o = opts || {};
    if (!container) return;

    if (!plans || !plans.length) {
      container.innerHTML =
        '<div class="no-match">' +
          '<div class="ic ic-gold">' + ICON_SEARCH + '</div>' +
          '<h4>No plan fits that budget yet</h4>' +
          '<p>' + (o.emptyMessage ||
            'Our smallest group is TF M at &#8377;2,000 a month (&#8377;50,000 chit value). ' +
            'Try a longer tenure, or talk to us &mdash; we can often work something out.') + '</p>' +
          '<a class="btn btn-gold btn-sm" href="contact.html">Talk To Our Team</a>' +
        '</div>';
      return;
    }

    container.innerHTML = '<div class="match-grid">' + plans.map(function (p, i) {
      var isBest = o.bestCode && p.code === o.bestCode;
      return '' +
        '<article class="match' + (isBest ? ' best' : '') + '" style="animation-delay:' + (i * 45) + 'ms">' +
          (isBest ? '<span class="match-tag">' + (o.badgeText || 'Best Fit') + '</span>' : '') +
          '<span class="match-code">Group ' + p.code + '</span>' +
          '<div class="match-val">' + fmt(p.chitValue) + '</div>' +
          '<div class="match-valsub">Total chit value</div>' +
          '<ul>' +
            '<li><span>Monthly instalment</span><b>' + fmt(p.monthlyInstallment) + '</b></li>' +
            '<li><span>Duration</span><b>' + p.tenure + ' Months</b></li>' +
            '<li><span>Members</span><b>' + p.members + '</b></li>' +
            '<li><span>Max discount</span><b>' + (CFG.maxAuctionDiscountPercent || 30) + '%</b></li>' +
          '</ul>' +
          '<a class="btn ' + (isBest ? 'btn-gold' : 'btn-ghost') + ' btn-sm" href="contact.html">' +
            'Enquire ' + ICON_ARROW +
          '</a>' +
        '</article>';
    }).join('') + '</div>';
  }

  function setCount(el, n, label) {
    if (!el) return;
    el.textContent = n === 0
      ? 'No plans available'
      : n + (n === 1 ? ' plan ' : ' plans ') + (label || 'available to you');
  }

  /* ==========================================================
     CALCULATOR 1 — Income based
     ========================================================== */
  function runIncome() {
    var ids = ['incSalary', 'incEmi', 'incTenure'];
    var result = E.calculateByIncome({
      monthlySalary: num('incSalary'),
      existingCommitments: num('incEmi'),
      tenureMonths: num('incTenure'),
      affordabilityRatio: CFG.affordabilityRatio
    });

    clearErrors(ids);
    if (result.errors.salary) setError('incSalary', result.errors.salary);
    if (result.errors.commitments) setError('incEmi', result.errors.commitments);
    if (result.errors.tenure) setError('incTenure', result.errors.tenure);

    var out = $('#incResults');
    var empty = $('#incEmpty');

    if (!result.valid) {
      if (out) out.hidden = true;
      if (empty) empty.hidden = false;
      renderPlans($('#incPlans'), []);
      setCount($('#incCount'), 0);
      return;
    }

    if (out) out.hidden = false;
    if (empty) empty.hidden = true;

    paint($('#incEmiValue'), fmt(result.applicableChitEmi));
    paint($('#incMaxValue'), fmt(result.maxChitValue));
    paint($('#incMaxShort'), fmtShort(result.maxChitValue));
    paint($('#incSalaryOut'), fmt(result.monthlySalary));
    paint($('#incEmiOut'), '− ' + fmt(result.existingCommitments));
    paint($('#incSurplusOut'), fmt(result.surplusIncome));
    paint($('#incRatioOut'), '× ' + Math.round(result.affordabilityRatio * 100) + '%');
    paint($('#incTenureOut'), '× ' + result.tenureMonths + ' months');
    paint($('#incMaxValueEcho'), fmt(result.maxChitValue));

    var matches = E.matchPlansByChitValue(result.maxChitValue, PLANS);
    var best = E.bestAffordablePlan(result.maxChitValue, PLANS);
    setCount($('#incCount'), matches.length, 'within your budget');
    renderPlans($('#incPlans'), matches, {
      bestCode: best && best.code,
      badgeText: 'Best Fit'
    });
  }

  /* ==========================================================
     CALCULATOR 2 — Instalment based
     ========================================================== */
  function runInstallment() {
    var ids = ['insAmount', 'insTenure'];
    var result = E.calculateByInstallment({
      monthlyInstallment: num('insAmount'),
      tenureMonths: num('insTenure')
    });

    clearErrors(ids);
    if (result.errors.installment) setError('insAmount', result.errors.installment);
    if (result.errors.tenure) setError('insTenure', result.errors.tenure);

    var out = $('#insResults');
    var empty = $('#insEmpty');

    if (!result.valid) {
      if (out) out.hidden = true;
      if (empty) empty.hidden = false;
      renderPlans($('#insPlans'), []);
      setCount($('#insCount'), 0);
      return;
    }

    if (out) out.hidden = false;
    if (empty) empty.hidden = true;

    paint($('#insMaxValue'), fmt(result.maxChitValue));
    paint($('#insMaxShort'), fmtShort(result.maxChitValue));
    paint($('#insAmountOut'), fmt(result.monthlyInstallment));
    paint($('#insTenureOut'), '× ' + result.tenureMonths + ' months');
    paint($('#insTotalOut'), fmt(result.maxChitValue));

    // Plans the customer can afford, capped by BOTH chit value and instalment.
    var byValue = E.matchPlansByChitValue(result.maxChitValue, PLANS);
    var affordable = byValue.filter(function (p) {
      return p.monthlyInstallment <= result.monthlyInstallment;
    });
    var list = affordable.length ? affordable : byValue;
    var closest = E.findClosestPlanByInstallment(result.monthlyInstallment, list);

    setCount($('#insCount'), list.length, 'match your instalment');
    renderPlans($('#insPlans'), list, {
      bestCode: closest && closest.code,
      badgeText: 'Closest Match',
      emptyMessage: 'Nothing matches an instalment of ' + fmt(result.monthlyInstallment) +
        ' over ' + result.tenureMonths + ' months. Our smallest group is &#8377;2,000 a month.'
    });
  }

  /* ==========================================================
     CALCULATOR 3 — Amount based
     ========================================================== */
  function runAmount() {
    var ids = ['amtAmount', 'amtTenure'];
    var result = E.calculateByAmount({
      desiredChitAmount: num('amtAmount'),
      tenureMonths: num('amtTenure')
    });

    clearErrors(ids);
    if (result.errors.amount) setError('amtAmount', result.errors.amount);
    if (result.errors.tenure) setError('amtTenure', result.errors.tenure);

    var out = $('#amtResults');
    var empty = $('#amtEmpty');

    if (!result.valid) {
      if (out) out.hidden = true;
      if (empty) empty.hidden = false;
      renderPlans($('#amtPlans'), []);
      setCount($('#amtCount'), 0);
      return;
    }

    if (out) out.hidden = false;
    if (empty) empty.hidden = true;

    paint($('#amtInstalValue'), fmt(result.requiredMonthlyInstallment));
    paint($('#amtGoalOut'), fmt(result.desiredChitAmount));
    paint($('#amtTenureOut'), '÷ ' + result.tenureMonths + ' months');
    paint($('#amtInstalOut'), fmt(result.requiredMonthlyInstallment));

    var closest = E.findClosestPlanByChitValue(result.desiredChitAmount, PLANS);
    var gap = closest ? closest.chitValue - result.desiredChitAmount : 0;
    var gapNote = '';
    if (closest) {
      if (gap === 0) gapNote = 'Group ' + closest.code + ' is an exact match for your goal.';
      else if (gap > 0) gapNote = 'The closest group is ' + closest.code + ' at ' +
        fmt(closest.chitValue) + ' — ' + fmt(Math.abs(gap)) + ' above your goal.';
      else gapNote = 'The closest group is ' + closest.code + ' at ' +
        fmt(closest.chitValue) + ' — ' + fmt(Math.abs(gap)) + ' below your goal.';
    }
    paint($('#amtClosestNote'), gapNote);

    // Show the closest plan first, then a couple of neighbours for context.
    var sorted = E.activePlans(PLANS).slice().sort(function (a, b) {
      return Math.abs(a.chitValue - result.desiredChitAmount) -
             Math.abs(b.chitValue - result.desiredChitAmount);
    }).slice(0, 3).sort(function (a, b) { return a.chitValue - b.chitValue; });

    setCount($('#amtCount'), sorted.length, 'closest to your goal');
    renderPlans($('#amtPlans'), sorted, {
      bestCode: closest && closest.code,
      badgeText: 'Closest Match'
    });
  }

  /* ==========================================================
     AUCTION & DIVIDEND CALCULATOR
     ========================================================== */
  function runAuction() {
    var ids = ['aucInstal', 'aucMembers', 'aucDiscount', 'aucCommission'];

    var result = E.runAuctionCycle({
      monthlyInstallment: num('aucInstal'),
      numberOfMembers: num('aucMembers'),
      auctionDiscountPercent: num('aucDiscount'),
      foremanCommissionPercent: num('aucCommission')
    });

    clearErrors(ids);
    if (result.errors.installment) setError('aucInstal', result.errors.installment);
    if (result.errors.members) setError('aucMembers', result.errors.members);
    if (result.errors.discount) setError('aucDiscount', result.errors.discount);
    if (result.errors.commission) setError('aucCommission', result.errors.commission);

    // Warn when the bid exceeds the company's own cap.
    var capNote = $('#aucCapNote');
    var cap = CFG.maxAuctionDiscountPercent || 30;
    if (capNote) {
      var over = result.auctionDiscountPercent > cap;
      capNote.hidden = !over;
      if (over) capNote.querySelector('span').textContent =
        'Vetrivaagai caps bidding at ' + cap + '%. A ' + result.auctionDiscountPercent +
        '% discount is shown here for illustration only.';
    }

    var out = $('#aucResults');
    if (!result.valid) { if (out) out.hidden = true; return; }
    if (out) out.hidden = false;

    paint($('#aucChitAmount'), fmt(result.chitAmount));
    paint($('#aucBidOffer'), fmt(result.bidOfferAmount));
    paint($('#aucPrize'), fmt(result.prizeMoney));
    paint($('#aucCommissionOut'), fmt(result.foremanCommission));
    paint($('#aucTotalDiv'), fmt(result.totalDividend));
    paint($('#aucDivPer'), fmt(result.dividendPerCustomer));
    paint($('#aucNextInstal'), fmt(result.nextMonthInstallment));

    paint($('#aucChitNote'),
      fmt(result.monthlyInstallment) + ' × ' + result.numberOfMembers + ' members');
    paint($('#aucBidNote'),
      result.auctionDiscountPercent + '% of ' + fmt(result.chitAmount));
    paint($('#aucCommissionNote'),
      result.foremanCommissionPercent + '% of ' + fmt(result.chitAmount));
    paint($('#aucDivPerNote'),
      fmt(result.totalDividend) + ' ÷ ' + result.numberOfMembers + ' members');
    paint($('#aucNextNote'),
      fmt(result.monthlyInstallment) + ' − ' + fmt(result.dividendPerCustomer) + ' dividend');
    paint($('#aucSavingNote'),
      'You pay ' + fmt(result.dividendPerCustomer) + ' less than this month');

    // Waterfall: prize + dividend + commission = chit amount
    var total = result.chitAmount || 1;
    var segPrize = $('#wfPrize'), segDiv = $('#wfDiv'), segCom = $('#wfCom');
    function seg(el, value, label) {
      if (!el) return;
      var pct = (value / total) * 100;
      el.style.flexBasis = pct + '%';
      el.style.flexGrow = '0';
      el.textContent = pct >= 11 ? Math.round(pct) + '%' : '';
      el.title = label + ': ' + fmt(value);
    }
    seg(segPrize, result.prizeMoney, 'Prize money');
    seg(segDiv, result.totalDividend, 'Total dividend');
    seg(segCom, result.foremanCommission, 'Foreman commission');

    paint($('#wfPrizeVal'), fmt(result.prizeMoney));
    paint($('#wfDivVal'), fmt(result.totalDividend));
    paint($('#wfComVal'), fmt(result.foremanCommission));

    renderProjection(result);
  }

  /* ---------- Full-cycle projection table ---------- */
  function renderProjection(result) {
    var body = $('#projTable');
    if (!body || $('#projBody').classList.contains('open') === false) {
      // Still compute so the table is ready the moment it is opened.
    }
    if (!body) return;

    var proj = E.projectFullCycle({
      monthlyInstallment: result.monthlyInstallment,
      numberOfMembers: result.numberOfMembers,
      tenureMonths: result.numberOfMembers,
      auctionDiscountPercent: result.auctionDiscountPercent,
      foremanCommissionPercent: result.foremanCommissionPercent,
      enrolmentCharge: CFG.enrolmentCharge || 0
    });

    body.innerHTML = proj.rows.map(function (r) {
      return '<tr>' +
        '<td>' + r.month + '</td>' +
        '<td class="num">' + fmt(r.subscription) + '</td>' +
        '<td class="num">' + (r.month === 1 ? '—' : r.auctionDiscountPercent + '%') + '</td>' +
        '<td class="num">' + (r.month === 1 ? '—' : fmt(r.bidOfferAmount)) + '</td>' +
        '<td class="num hl">' + (r.month === 1 ? '—' : fmt(r.prizeMoney)) + '</td>' +
        '<td class="num">' + (r.month === 1 ? '—' : fmt(r.dividendPerCustomer)) + '</td>' +
        '<td class="num">' + fmt(r.cumulativePaid) + '</td>' +
        '</tr>';
    }).join('');

    paint($('#projTotalPaid'), fmt(proj.totalPaid));
    paint($('#projChitAmount'), fmt(proj.chitAmount));
    paint($('#projDividend'), fmt(proj.totalDividendReceived));
  }

  /* ==========================================================
     Tabs
     ========================================================== */
  function initTabs() {
    var tabs = $$('.calc-tab');
    var panels = $$('.calc-panel');

    function select(name) {
      tabs.forEach(function (t) {
        t.setAttribute('aria-selected', t.dataset.tab === name ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.dataset.panel === name);
      });
      if (name === 'income') runIncome();
      if (name === 'installment') runInstallment();
      if (name === 'amount') runAmount();
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); tabs[(i + 1) % tabs.length].click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); tabs[(i - 1 + tabs.length) % tabs.length].click(); }
      });
    });

    select('income');
  }

  /* ==========================================================
     Wire everything up
     ========================================================== */
  function init() {
    initTabs();

    // Calculator 1
    ['incSalary', 'incEmi', 'incTenure'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', runIncome);
    });
    linkRange('incTenure', 'incTenureRange', runIncome);
    linkChips('#incSalaryChips', 'incSalary', runIncome);

    // Calculator 2
    ['insAmount', 'insTenure'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', runInstallment);
    });
    linkRange('insTenure', 'insTenureRange', runInstallment);
    linkChips('#insAmountChips', 'insAmount', runInstallment);

    // Calculator 3
    ['amtAmount', 'amtTenure'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', runAmount);
    });
    linkRange('amtTenure', 'amtTenureRange', runAmount);
    linkChips('#amtAmountChips', 'amtAmount', runAmount);

    // Auction calculator
    ['aucInstal', 'aucMembers', 'aucDiscount', 'aucCommission'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', runAuction);
    });
    linkRange('aucDiscount', 'aucDiscountRange', runAuction);
    linkRange('aucMembers', 'aucMembersRange', runAuction);

    // "Members = months" convenience link
    var lockMembers = $('#aucLockMembers');
    if (lockMembers) {
      lockMembers.addEventListener('change', function () {
        runAuction();
      });
    }

    // Load a real plan into the auction calculator
    var planPicker = $('#aucPlanPicker');
    if (planPicker) {
      E.activePlans(PLANS).forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.code;
        opt.textContent = 'Group ' + p.code + ' — ' + fmt(p.monthlyInstallment) +
                          '/month · ' + fmt(p.chitValue);
        planPicker.appendChild(opt);
      });
      planPicker.addEventListener('change', function () {
        var plan = E.activePlans(PLANS).filter(function (p) { return p.code === planPicker.value; })[0];
        if (!plan) return;
        var instal = document.getElementById('aucInstal');
        var members = document.getElementById('aucMembers');
        var mRange = document.getElementById('aucMembersRange');
        if (instal) instal.value = plan.monthlyInstallment;
        if (members) members.value = plan.members;
        if (mRange) mRange.value = plan.members;
        runAuction();
      });
    }

    // Projection expand/collapse
    var projBtn = $('#projBtn');
    if (projBtn) {
      projBtn.addEventListener('click', function () {
        var body = $('#projBody');
        var open = body.classList.toggle('open');
        projBtn.textContent = open ? 'Hide the month-by-month table' : 'Show the month-by-month table';
        projBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // First paint
    runIncome();
    runInstallment();
    runAmount();
    runAuction();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
