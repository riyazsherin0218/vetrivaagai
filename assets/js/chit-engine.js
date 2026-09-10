/* ============================================================
   VETRIVAAGAI CHIT FUNDS
   assets/js/chit-engine.js

   The calculation engine. Every function here is PURE — it takes
   numbers in and returns numbers or plain objects out. Nothing
   here touches the DOM, so this file can be lifted straight into
   a Node backend, an API route or a React app unchanged.

   Five clearly separated concerns:
     1. Customer affordability   calcSurplusIncome / calcApplicableChitEmi / calcMaxChitValue
     2. Chit-plan matching       matchPlansByChitValue / findClosestPlanByChitValue
     3. Auction calculation      calcChitAmount / calcBidOfferAmount / calcPrizeMoney
     4. Dividend calculation     calcForemanCommission / calcTotalDividend / calcDividendPerCustomer
     5. Prize-money & next dues  calcNextMonthInstallment / runAuctionCycle

   This is NOT an EMI / loan amortisation calculator. A chit is a
   savings and auction instrument: no interest rate is applied and
   no reducing-balance schedule is computed.
   ============================================================ */

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChitEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==========================================================
     0. HELPERS — number handling and Indian Rupee formatting
     ========================================================== */

  /** Coerce anything to a finite number; non-numbers become 0. */
  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    var n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  /** Round to a whole rupee. */
  function round(n) {
    return Math.round(toNumber(n));
  }

  /** Round down to a whole rupee — used where we must not overstate affordability. */
  function floor(n) {
    return Math.floor(toNumber(n));
  }

  /**
   * Format a number as Indian Rupees with the lakh/crore grouping.
   * 1350000 -> "₹13,50,000"
   */
  function formatINR(value, opts) {
    var o = opts || {};
    var n = toNumber(value);
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: o.decimals || 0,
        maximumFractionDigits: o.decimals || 0
      }).format(n);
    } catch (e) {
      return '₹' + formatIndianDigits(Math.round(n));
    }
  }

  /** Digits only, with Indian grouping: 1350000 -> "13,50,000" */
  function formatIndianDigits(value) {
    var n = Math.abs(round(value));
    var sign = toNumber(value) < 0 ? '-' : '';
    var s = String(n);
    if (s.length <= 3) return sign + s;
    var last3 = s.slice(-3);
    var rest = s.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return sign + rest + ',' + last3;
  }

  /**
   * Short Indian form for headline figures.
   * 1350000 -> "₹13.5 Lakh"   25000000 -> "₹2.5 Crore"
   */
  function formatINRShort(value) {
    var n = toNumber(value);
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    function trim(x) { return String(parseFloat(x.toFixed(2))); }
    if (abs >= 10000000) return sign + '₹' + trim(abs / 10000000) + ' Crore';
    if (abs >= 100000) return sign + '₹' + trim(abs / 100000) + ' Lakh';
    return formatINR(n);
  }

  /** Percentage of an amount. pct is a whole number: 35 means 35%. */
  function percentOf(amount, pct) {
    return toNumber(amount) * (toNumber(pct) / 100);
  }

  /* ==========================================================
     1. CUSTOMER AFFORDABILITY
     ========================================================== */

  /**
   * Surplus Income = Monthly Salary − Existing Monthly Commitments
   */
  function calcSurplusIncome(monthlySalary, existingCommitments) {
    return toNumber(monthlySalary) - toNumber(existingCommitments);
  }

  /**
   * Applicable Chit EMI = Surplus Income × affordability ratio (default 50%)
   * The ratio is configurable so the company can tighten or relax the rule.
   */
  function calcApplicableChitEmi(surplusIncome, ratio) {
    var r = (ratio === undefined || ratio === null) ? 0.5 : toNumber(ratio);
    return toNumber(surplusIncome) * r;
  }

  /**
   * Maximum Chit Value = Applicable Chit EMI × Tenure (in months)
   */
  function calcMaxChitValue(applicableChitEmi, tenureMonths) {
    return toNumber(applicableChitEmi) * toNumber(tenureMonths);
  }

  /**
   * Validate the income-based calculator inputs.
   * Returns { valid, errors: { field: message }, firstError }
   */
  function validateIncomeInputs(monthlySalary, existingCommitments, tenureMonths) {
    var salary = toNumber(monthlySalary);
    var emi = toNumber(existingCommitments);
    var tenure = toNumber(tenureMonths);
    var errors = {};

    if (!(salary > 0)) {
      errors.salary = 'Monthly salary must be greater than zero.';
    }
    if (emi < 0) {
      errors.commitments = 'Existing commitments cannot be negative.';
    }
    if (salary > 0 && emi > salary) {
      errors.commitments = 'Commitments cannot be more than your salary.';
    }
    if (!(tenure > 0) || Math.floor(tenure) !== tenure) {
      errors.tenure = 'Tenure must be a whole number of months, greater than zero.';
    }
    if (!errors.salary && !errors.commitments && !(salary - emi > 0)) {
      errors.commitments = 'Surplus income must be greater than zero.';
    }

    var keys = Object.keys(errors);
    return {
      valid: keys.length === 0,
      errors: errors,
      firstError: keys.length ? errors[keys[0]] : null
    };
  }

  /**
   * The whole income-based calculation in one call.
   * Returns every intermediate value so the UI can show the working.
   */
  function calculateByIncome(input) {
    var monthlySalary = toNumber(input.monthlySalary);
    var existingCommitments = toNumber(input.existingCommitments);
    var tenureMonths = toNumber(input.tenureMonths);
    var ratio = (input.affordabilityRatio === undefined) ? 0.5 : toNumber(input.affordabilityRatio);

    var validation = validateIncomeInputs(monthlySalary, existingCommitments, tenureMonths);

    var surplusIncome = calcSurplusIncome(monthlySalary, existingCommitments);
    var applicableChitEmi = calcApplicableChitEmi(surplusIncome, ratio);
    var maxChitValue = calcMaxChitValue(applicableChitEmi, tenureMonths);

    return {
      valid: validation.valid,
      errors: validation.errors,
      monthlySalary: monthlySalary,
      existingCommitments: existingCommitments,
      tenureMonths: tenureMonths,
      affordabilityRatio: ratio,
      surplusIncome: round(surplusIncome),
      applicableChitEmi: floor(applicableChitEmi),
      maxChitValue: floor(maxChitValue)
    };
  }

  /**
   * Instalment-based calculation.
   * Maximum Chit Value = Desired Monthly Instalment × Tenure
   */
  function calculateByInstallment(input) {
    var monthlyInstallment = toNumber(input.monthlyInstallment);
    var tenureMonths = toNumber(input.tenureMonths);
    var errors = {};

    if (!(monthlyInstallment > 0)) {
      errors.installment = 'Monthly instalment must be greater than zero.';
    }
    if (!(tenureMonths > 0) || Math.floor(tenureMonths) !== tenureMonths) {
      errors.tenure = 'Tenure must be a whole number of months, greater than zero.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
      monthlyInstallment: monthlyInstallment,
      tenureMonths: tenureMonths,
      maxChitValue: floor(monthlyInstallment * tenureMonths)
    };
  }

  /**
   * Amount-based calculation.
   * Monthly Instalment = Desired Chit Amount ÷ Tenure
   */
  function calculateByAmount(input) {
    var desiredChitAmount = toNumber(input.desiredChitAmount);
    var tenureMonths = toNumber(input.tenureMonths);
    var errors = {};

    if (!(desiredChitAmount > 0)) {
      errors.amount = 'Desired chit amount must be greater than zero.';
    }
    if (!(tenureMonths > 0) || Math.floor(tenureMonths) !== tenureMonths) {
      errors.tenure = 'Tenure must be a whole number of months, greater than zero.';
    }

    var required = tenureMonths > 0 ? desiredChitAmount / tenureMonths : 0;

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
      desiredChitAmount: desiredChitAmount,
      tenureMonths: tenureMonths,
      requiredMonthlyInstallment: round(required)
    };
  }

  /* ==========================================================
     2. CHIT-PLAN MATCHING
     ========================================================== */

  /** Only plans not explicitly deactivated. */
  function activePlans(plans) {
    return (plans || []).filter(function (p) { return p && p.active !== false; });
  }

  /**
   * Every plan the customer can afford: Plan Chit Value <= Maximum Chit Value.
   * Sorted from lowest chit value to highest.
   */
  function matchPlansByChitValue(maxChitValue, plans) {
    var cap = toNumber(maxChitValue);
    return activePlans(plans)
      .filter(function (p) { return toNumber(p.chitValue) <= cap; })
      .sort(function (a, b) { return toNumber(a.chitValue) - toNumber(b.chitValue); });
  }

  /**
   * Every plan whose monthly instalment fits the customer's budget.
   * Sorted from lowest chit value to highest.
   */
  function matchPlansByInstallment(maxMonthlyInstallment, plans) {
    var cap = toNumber(maxMonthlyInstallment);
    return activePlans(plans)
      .filter(function (p) { return toNumber(p.monthlyInstallment) <= cap; })
      .sort(function (a, b) { return toNumber(a.chitValue) - toNumber(b.chitValue); });
  }

  /**
   * The single plan whose chit value sits closest to a target.
   * Ties break towards the smaller (safer) plan.
   */
  function findClosestPlanByChitValue(targetChitValue, plans) {
    var target = toNumber(targetChitValue);
    var list = activePlans(plans);
    if (!list.length) return null;

    return list.reduce(function (best, p) {
      if (!best) return p;
      var dBest = Math.abs(toNumber(best.chitValue) - target);
      var dP = Math.abs(toNumber(p.chitValue) - target);
      if (dP < dBest) return p;
      if (dP === dBest && toNumber(p.chitValue) < toNumber(best.chitValue)) return p;
      return best;
    }, null);
  }

  /**
   * The single plan whose monthly instalment sits closest to a target.
   */
  function findClosestPlanByInstallment(targetInstallment, plans) {
    var target = toNumber(targetInstallment);
    var list = activePlans(plans);
    if (!list.length) return null;

    return list.reduce(function (best, p) {
      if (!best) return p;
      var dBest = Math.abs(toNumber(best.monthlyInstallment) - target);
      var dP = Math.abs(toNumber(p.monthlyInstallment) - target);
      if (dP < dBest) return p;
      if (dP === dBest && toNumber(p.monthlyInstallment) < toNumber(best.monthlyInstallment)) return p;
      return best;
    }, null);
  }

  /** The largest affordable plan — the one usually recommended. */
  function bestAffordablePlan(maxChitValue, plans) {
    var matches = matchPlansByChitValue(maxChitValue, plans);
    return matches.length ? matches[matches.length - 1] : null;
  }

  /* ==========================================================
     3. AUCTION CALCULATION
     ========================================================== */

  /**
   * Gross Chit Amount = Monthly Instalment × Number of Members
   */
  function calcChitAmount(monthlyInstallment, numberOfMembers) {
    return toNumber(monthlyInstallment) * toNumber(numberOfMembers);
  }

  /**
   * Bid Offer Amount = Chit Amount × Auction Discount %
   */
  function calcBidOfferAmount(chitAmount, auctionDiscountPercent) {
    return percentOf(chitAmount, auctionDiscountPercent);
  }

  /**
   * Prize Money = Chit Amount − Bid Offer Amount
   * This is what the winning bidder actually receives.
   */
  function calcPrizeMoney(chitAmount, bidOfferAmount) {
    return toNumber(chitAmount) - toNumber(bidOfferAmount);
  }

  /* ==========================================================
     4. DIVIDEND CALCULATION
     ========================================================== */

  /**
   * Foreman Commission = Chit Amount × Foreman Commission %
   * Vetrivaagai's commission is 5% of the chit amount.
   */
  function calcForemanCommission(chitAmount, foremanCommissionPercent) {
    return percentOf(chitAmount, foremanCommissionPercent);
  }

  /**
   * Total Dividend = Bid Offer Amount − Foreman Commission
   * What is left of the discount, to be shared among all members.
   */
  function calcTotalDividend(bidOfferAmount, foremanCommission) {
    return toNumber(bidOfferAmount) - toNumber(foremanCommission);
  }

  /**
   * Dividend Per Customer = Total Dividend ÷ Number of Members
   */
  function calcDividendPerCustomer(totalDividend, numberOfMembers) {
    var members = toNumber(numberOfMembers);
    if (!(members > 0)) return 0;
    return toNumber(totalDividend) / members;
  }

  /* ==========================================================
     5. NEXT MONTH'S DUES
     ========================================================== */

  /**
   * Next Month Instalment = Monthly Instalment − Dividend Per Customer
   * This is why a chit subscription falls as the group matures.
   */
  function calcNextMonthInstallment(monthlyInstallment, dividendPerCustomer) {
    return toNumber(monthlyInstallment) - toNumber(dividendPerCustomer);
  }

  /**
   * Validate the auction calculator inputs.
   */
  function validateAuctionInputs(input) {
    var errors = {};
    var installment = toNumber(input.monthlyInstallment);
    var members = toNumber(input.numberOfMembers);
    var discount = toNumber(input.auctionDiscountPercent);
    var commission = toNumber(input.foremanCommissionPercent);

    if (!(installment > 0)) {
      errors.installment = 'Monthly instalment must be greater than zero.';
    }
    if (!(members > 0) || Math.floor(members) !== members) {
      errors.members = 'Number of members must be a whole number, greater than zero.';
    }
    if (discount < 0 || discount > 100) {
      errors.discount = 'Auction discount must be between 0% and 100%.';
    }
    if (commission < 0 || commission > 100) {
      errors.commission = 'Foreman commission must be between 0% and 100%.';
    }
    if (discount >= 0 && commission >= 0 && commission > discount) {
      errors.commission = 'Commission is larger than the bid, so there is no dividend to share this month.';
    }

    var keys = Object.keys(errors);
    return { valid: keys.length === 0, errors: errors, firstError: keys.length ? errors[keys[0]] : null };
  }

  /**
   * Run one full auction month and return every figure in the chain.
   *
   * input = {
   *   monthlyInstallment, numberOfMembers,
   *   auctionDiscountPercent, foremanCommissionPercent,
   *   chitAmount            (optional — derived if omitted)
   * }
   */
  function runAuctionCycle(input) {
    var monthlyInstallment = toNumber(input.monthlyInstallment);
    var numberOfMembers = toNumber(input.numberOfMembers);
    var auctionDiscountPercent = toNumber(input.auctionDiscountPercent);
    var foremanCommissionPercent = toNumber(input.foremanCommissionPercent);

    var validation = validateAuctionInputs({
      monthlyInstallment: monthlyInstallment,
      numberOfMembers: numberOfMembers,
      auctionDiscountPercent: auctionDiscountPercent,
      foremanCommissionPercent: foremanCommissionPercent
    });

    // The chit amount may be supplied directly, otherwise it is derived.
    var chitAmount = (input.chitAmount !== undefined && input.chitAmount !== null && input.chitAmount !== '')
      ? toNumber(input.chitAmount)
      : calcChitAmount(monthlyInstallment, numberOfMembers);

    var bidOfferAmount = calcBidOfferAmount(chitAmount, auctionDiscountPercent);
    var prizeMoney = calcPrizeMoney(chitAmount, bidOfferAmount);
    var foremanCommission = calcForemanCommission(chitAmount, foremanCommissionPercent);
    var totalDividend = calcTotalDividend(bidOfferAmount, foremanCommission);
    var dividendPerCustomer = calcDividendPerCustomer(totalDividend, numberOfMembers);
    var nextMonthInstallment = calcNextMonthInstallment(monthlyInstallment, dividendPerCustomer);

    return {
      valid: validation.valid,
      errors: validation.errors,

      monthlyInstallment: round(monthlyInstallment),
      numberOfMembers: numberOfMembers,
      auctionDiscountPercent: auctionDiscountPercent,
      foremanCommissionPercent: foremanCommissionPercent,

      chitAmount: round(chitAmount),
      bidOfferAmount: round(bidOfferAmount),
      prizeMoney: round(prizeMoney),
      foremanCommission: round(foremanCommission),
      totalDividend: round(totalDividend),
      dividendPerCustomer: round(dividendPerCustomer),
      nextMonthInstallment: round(nextMonthInstallment)
    };
  }

  /**
   * Project the whole cycle month by month at a CONSTANT auction discount.
   *
   * This is an illustration, not a promise: in a real group the discount
   * falls as the months pass, because fewer members still need the money.
   * Month 1 has no auction — the first subscription goes to the company.
   */
  function projectFullCycle(input) {
    var months = toNumber(input.tenureMonths) || toNumber(input.numberOfMembers);
    var base = runAuctionCycle(input);
    var rows = [];
    var totalPaid = 0;

    for (var m = 1; m <= months; m++) {
      if (m === 1) {
        var first = base.monthlyInstallment + toNumber(input.enrolmentCharge || 0);
        totalPaid += first;
        rows.push({
          month: 1,
          subscription: first,
          auctionDiscountPercent: 0,
          bidOfferAmount: 0,
          prizeMoney: 0,
          foremanCommission: 0,
          dividendPerCustomer: 0,
          cumulativePaid: round(totalPaid)
        });
      } else {
        totalPaid += base.nextMonthInstallment;
        rows.push({
          month: m,
          subscription: base.nextMonthInstallment,
          auctionDiscountPercent: base.auctionDiscountPercent,
          bidOfferAmount: base.bidOfferAmount,
          prizeMoney: base.prizeMoney,
          foremanCommission: base.foremanCommission,
          dividendPerCustomer: base.dividendPerCustomer,
          cumulativePaid: round(totalPaid)
        });
      }
    }

    return {
      rows: rows,
      totalPaid: round(totalPaid),
      chitAmount: base.chitAmount,
      totalDividendReceived: round(base.dividendPerCustomer * Math.max(0, months - 1)),
      assumesConstantDiscount: true
    };
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */
  return {
    // helpers
    toNumber: toNumber,
    round: round,
    floor: floor,
    percentOf: percentOf,
    formatINR: formatINR,
    formatINRShort: formatINRShort,
    formatIndianDigits: formatIndianDigits,

    // 1. affordability
    calcSurplusIncome: calcSurplusIncome,
    calcApplicableChitEmi: calcApplicableChitEmi,
    calcMaxChitValue: calcMaxChitValue,
    validateIncomeInputs: validateIncomeInputs,
    calculateByIncome: calculateByIncome,
    calculateByInstallment: calculateByInstallment,
    calculateByAmount: calculateByAmount,

    // 2. plan matching
    activePlans: activePlans,
    matchPlansByChitValue: matchPlansByChitValue,
    matchPlansByInstallment: matchPlansByInstallment,
    findClosestPlanByChitValue: findClosestPlanByChitValue,
    findClosestPlanByInstallment: findClosestPlanByInstallment,
    bestAffordablePlan: bestAffordablePlan,

    // 3. auction
    calcChitAmount: calcChitAmount,
    calcBidOfferAmount: calcBidOfferAmount,
    calcPrizeMoney: calcPrizeMoney,

    // 4. dividend
    calcForemanCommission: calcForemanCommission,
    calcTotalDividend: calcTotalDividend,
    calcDividendPerCustomer: calcDividendPerCustomer,

    // 5. next dues
    calcNextMonthInstallment: calcNextMonthInstallment,
    validateAuctionInputs: validateAuctionInputs,
    runAuctionCycle: runAuctionCycle,
    projectFullCycle: projectFullCycle
  };
});
