/* Test suite for the Vetrivaagai chit calculation engine.
   Run with:  node _tests/engine.test.js                      */

var E = require('../assets/js/chit-engine.js');
var cfg = require('../assets/js/chit-plans.js');
var PLANS = cfg.CHIT_PLANS;

var pass = 0, fail = 0;

function eq(label, actual, expected) {
  var ok = actual === expected;
  if (ok) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + '\n         expected: ' + expected + '\n         actual:   ' + actual); }
}
function truthy(label, actual) { eq(label, !!actual, true); }
function section(t) { console.log('\n' + t); }

/* ============================================================
   SPEC EXAMPLE 1 — Income-based calculator
   Salary 50,000 · EMI 5,000 · Tenure 60
   Surplus 45,000 → Chit EMI 22,500 → Max Chit Value 13,50,000
   ============================================================ */
section('Calculator 1 — income-based (spec example)');
var r1 = E.calculateByIncome({ monthlySalary: 50000, existingCommitments: 5000, tenureMonths: 60 });
eq('surplus income = 45000', r1.surplusIncome, 45000);
eq('applicable chit EMI = 22500', r1.applicableChitEmi, 22500);
eq('max chit value = 1350000', r1.maxChitValue, 1350000);
truthy('inputs are valid', r1.valid);
eq('formats as ₹13,50,000', E.formatINR(r1.maxChitValue).replace(/₹/, '₹'), '₹13,50,000');

section('Calculator 1 — individual formulas');
eq('calcSurplusIncome(50000, 5000)', E.calcSurplusIncome(50000, 5000), 45000);
eq('calcApplicableChitEmi(45000)', E.calcApplicableChitEmi(45000), 22500);
eq('calcApplicableChitEmi(45000, 0.4)', E.calcApplicableChitEmi(45000, 0.4), 18000);
eq('calcMaxChitValue(22500, 60)', E.calcMaxChitValue(22500, 60), 1350000);

section('Calculator 1 — validation rules');
eq('salary must be > 0', E.validateIncomeInputs(0, 0, 25).valid, false);
eq('negative salary rejected', E.validateIncomeInputs(-100, 0, 25).valid, false);
eq('negative commitments rejected', E.validateIncomeInputs(50000, -1, 25).valid, false);
eq('commitments > salary rejected', E.validateIncomeInputs(50000, 60000, 25).valid, false);
eq('commitments == salary rejected (no surplus)', E.validateIncomeInputs(50000, 50000, 25).valid, false);
eq('tenure must be > 0', E.validateIncomeInputs(50000, 5000, 0).valid, false);
eq('tenure must be whole', E.validateIncomeInputs(50000, 5000, 25.5).valid, false);
eq('zero commitments is allowed', E.validateIncomeInputs(50000, 0, 25).valid, true);
eq('valid case passes', E.validateIncomeInputs(50000, 5000, 60).valid, true);

/* ============================================================
   SPEC EXAMPLE 2 — Instalment-based calculator
   Instalment 10,000 · Tenure 50 → Max Chit Value 5,00,000
   ============================================================ */
section('Calculator 2 — instalment-based (spec example)');
var r2 = E.calculateByInstallment({ monthlyInstallment: 10000, tenureMonths: 50 });
eq('max chit value = 500000', r2.maxChitValue, 500000);
truthy('inputs are valid', r2.valid);
eq('zero instalment rejected', E.calculateByInstallment({ monthlyInstallment: 0, tenureMonths: 50 }).valid, false);
eq('zero tenure rejected', E.calculateByInstallment({ monthlyInstallment: 10000, tenureMonths: 0 }).valid, false);

/* ============================================================
   SPEC EXAMPLE 3 — Amount-based calculator
   Amount 5,00,000 · Tenure 50 → Instalment 10,000
   ============================================================ */
section('Calculator 3 — amount-based (spec example)');
var r3 = E.calculateByAmount({ desiredChitAmount: 500000, tenureMonths: 50 });
eq('required instalment = 10000', r3.requiredMonthlyInstallment, 10000);
truthy('inputs are valid', r3.valid);
var r3b = E.calculateByAmount({ desiredChitAmount: 500000, tenureMonths: 25 });
eq('500000 over 25 months = 20000', r3b.requiredMonthlyInstallment, 20000);
eq('zero amount rejected', E.calculateByAmount({ desiredChitAmount: 0, tenureMonths: 25 }).valid, false);

/* ============================================================
   PLAN MATCHING
   ============================================================ */
section('Plan matching');
var m = E.matchPlansByChitValue(1350000, PLANS);
eq('9 plans exist in config', E.activePlans(PLANS).length, 9);
eq('1350000 matches 8 plans (all but TF V)', m.length, 8);
eq('sorted lowest first', m[0].chitValue, 50000);
eq('sorted highest last', m[m.length - 1].chitValue, 1000000);
eq('no plan exceeds the cap', m.every(function (p) { return p.chitValue <= 1350000; }), true);

eq('cap of 200000 matches 5 plans', E.matchPlansByChitValue(200000, PLANS).length, 5);
eq('boundary is inclusive (<=)', E.matchPlansByChitValue(200000, PLANS).some(function (p) { return p.chitValue === 200000; }), true);
eq('cap of 40000 matches nothing', E.matchPlansByChitValue(40000, PLANS).length, 0);
eq('cap of 99999999 matches all 9', E.matchPlansByChitValue(99999999, PLANS).length, 9);

eq('best affordable for 1350000 is TF I', E.bestAffordablePlan(1350000, PLANS).code, 'TF I');
eq('best affordable for 40000 is null', E.bestAffordablePlan(40000, PLANS), null);

eq('closest to 500000 is TF X', E.findClosestPlanByChitValue(500000, PLANS).code, 'TF X');
eq('closest to 480000 is TF X', E.findClosestPlanByChitValue(480000, PLANS).code, 'TF X');
eq('closest to 220000 is TF R', E.findClosestPlanByChitValue(220000, PLANS).code, 'TF R');
eq('closest instalment to 10000 is TF T', E.findClosestPlanByInstallment(10000, PLANS).code, 'TF T');
eq('instalment filter 8000 gives 5 plans', E.matchPlansByInstallment(8000, PLANS).length, 5);

eq('inactive plans are excluded', E.activePlans([{ chitValue: 1, active: false }, { chitValue: 2 }]).length, 1);
eq('empty plan list is safe', E.findClosestPlanByChitValue(500000, []), null);

/* ============================================================
   SPEC EXAMPLE 4 — Auction cycle
   Instalment 10,000 · Members 50 · Discount 35% · Commission 5%
   Chit 5,00,000 · Bid 1,75,000 · Prize 3,25,000
   Commission 25,000 · Dividend 1,50,000 · Per member 3,000
   Next instalment 7,000
   ============================================================ */
section('Auction cycle (spec example)');
var a = E.runAuctionCycle({
  monthlyInstallment: 10000,
  numberOfMembers: 50,
  auctionDiscountPercent: 35,
  foremanCommissionPercent: 5
});
eq('chit amount = 500000', a.chitAmount, 500000);
eq('bid offer = 175000', a.bidOfferAmount, 175000);
eq('prize money = 325000', a.prizeMoney, 325000);
eq('foreman commission = 25000', a.foremanCommission, 25000);
eq('total dividend = 150000', a.totalDividend, 150000);
eq('dividend per customer = 3000', a.dividendPerCustomer, 3000);
eq('next month instalment = 7000', a.nextMonthInstallment, 7000);
truthy('inputs are valid', a.valid);

section('Auction — individual formulas');
eq('calcChitAmount(10000, 50)', E.calcChitAmount(10000, 50), 500000);
eq('calcBidOfferAmount(500000, 35)', E.calcBidOfferAmount(500000, 35), 175000);
eq('calcPrizeMoney(500000, 175000)', E.calcPrizeMoney(500000, 175000), 325000);
eq('calcForemanCommission(500000, 5)', E.calcForemanCommission(500000, 5), 25000);
eq('calcTotalDividend(175000, 25000)', E.calcTotalDividend(175000, 25000), 150000);
eq('calcDividendPerCustomer(150000, 50)', E.calcDividendPerCustomer(150000, 50), 3000);
eq('calcNextMonthInstallment(10000, 3000)', E.calcNextMonthInstallment(10000, 3000), 7000);
eq('divide by zero members is safe', E.calcDividendPerCustomer(150000, 0), 0);

/* ============================================================
   VETRIVAAGAI REAL PLAN — TF R at the company's 30% cap
   ₹8,000 × 25 = ₹2,00,000 · 30% bid · 5% commission
   Matches the printed chart: dividend ₹2,000, next dues ₹6,000
   ============================================================ */
section("Auction — Vetrivaagai TF R at the 30% cap (matches printed chart)");
var v = E.runAuctionCycle({
  monthlyInstallment: 8000,
  numberOfMembers: 25,
  auctionDiscountPercent: 30,
  foremanCommissionPercent: 5
});
eq('chit amount = 200000', v.chitAmount, 200000);
eq('bid offer = 60000', v.bidOfferAmount, 60000);
eq('prize money = 140000', v.prizeMoney, 140000);
eq('foreman commission = 10000', v.foremanCommission, 10000);
eq('total dividend = 50000', v.totalDividend, 50000);
eq('dividend per customer = 2000', v.dividendPerCustomer, 2000);
eq('next month instalment = 6000', v.nextMonthInstallment, 6000);

section("Auction — TF X (₹20,000 × 25 = ₹5,00,000) at 30%");
var x = E.runAuctionCycle({
  monthlyInstallment: 20000, numberOfMembers: 25,
  auctionDiscountPercent: 30, foremanCommissionPercent: 5
});
eq('chit amount = 500000', x.chitAmount, 500000);
eq('bid offer = 150000', x.bidOfferAmount, 150000);
eq('prize money = 350000', x.prizeMoney, 350000);
eq('foreman commission = 25000', x.foremanCommission, 25000);
eq('dividend per customer = 5000', x.dividendPerCustomer, 5000);
eq('next month instalment = 15000', x.nextMonthInstallment, 15000);

section('Auction — validation and edge cases');
eq('zero members rejected', E.runAuctionCycle({ monthlyInstallment: 10000, numberOfMembers: 0, auctionDiscountPercent: 30, foremanCommissionPercent: 5 }).valid, false);
eq('discount over 100 rejected', E.validateAuctionInputs({ monthlyInstallment: 10000, numberOfMembers: 25, auctionDiscountPercent: 101, foremanCommissionPercent: 5 }).valid, false);
eq('negative discount rejected', E.validateAuctionInputs({ monthlyInstallment: 10000, numberOfMembers: 25, auctionDiscountPercent: -1, foremanCommissionPercent: 5 }).valid, false);
eq('commission above bid rejected', E.validateAuctionInputs({ monthlyInstallment: 10000, numberOfMembers: 25, auctionDiscountPercent: 3, foremanCommissionPercent: 5 }).valid, false);
eq('0% discount gives 0 dividend', E.runAuctionCycle({ monthlyInstallment: 10000, numberOfMembers: 25, auctionDiscountPercent: 0, foremanCommissionPercent: 0 }).dividendPerCustomer, 0);
eq('explicit chitAmount overrides derivation', E.runAuctionCycle({ monthlyInstallment: 10000, numberOfMembers: 25, chitAmount: 300000, auctionDiscountPercent: 30, foremanCommissionPercent: 5 }).chitAmount, 300000);

section('Identity: prize + bid = chit amount');
[[8000, 25, 30], [20000, 25, 12], [100000, 25, 7], [10000, 50, 35]].forEach(function (t) {
  var res = E.runAuctionCycle({ monthlyInstallment: t[0], numberOfMembers: t[1], auctionDiscountPercent: t[2], foremanCommissionPercent: 5 });
  eq('prize + bid = chit (' + t[0] + '×' + t[1] + ' @' + t[2] + '%)', res.prizeMoney + res.bidOfferAmount, res.chitAmount);
  eq('dividend + commission = bid (' + t[0] + '×' + t[1] + ' @' + t[2] + '%)', res.totalDividend + res.foremanCommission, res.bidOfferAmount);
});

/* ============================================================
   FULL CYCLE PROJECTION
   ============================================================ */
section('Full cycle projection');
var proj = E.projectFullCycle({
  monthlyInstallment: 8000, numberOfMembers: 25, tenureMonths: 25,
  auctionDiscountPercent: 30, foremanCommissionPercent: 5, enrolmentCharge: 500
});
eq('25 rows produced', proj.rows.length, 25);
eq('month 1 has no auction', proj.rows[0].dividendPerCustomer, 0);
eq('month 1 includes the ₹500 enrolment charge', proj.rows[0].subscription, 8500);
eq('month 2 subscription = 6000', proj.rows[1].subscription, 6000);
eq('total paid = 8500 + 24×6000', proj.totalPaid, 8500 + 24 * 6000);
eq('flagged as an assumption', proj.assumesConstantDiscount, true);

/* ============================================================
   CURRENCY FORMATTING
   ============================================================ */
section('Indian Rupee formatting');
eq('1350000 digits', E.formatIndianDigits(1350000), '13,50,000');
eq('500000 digits', E.formatIndianDigits(500000), '5,00,000');
eq('2500 digits', E.formatIndianDigits(2500), '2,500');
eq('100 digits', E.formatIndianDigits(100), '100');
eq('25000000 digits', E.formatIndianDigits(25000000), '2,50,00,000');
eq('short 1350000', E.formatINRShort(1350000), '₹13.5 Lakh');
eq('short 2500000', E.formatINRShort(2500000), '₹25 Lakh');
eq('short 25000000', E.formatINRShort(25000000), '₹2.5 Crore');
eq('short 50000', E.formatINRShort(50000).replace(/₹/, '₹'), '₹50,000');

section('Input coercion');
eq('strips ₹ and commas', E.toNumber('₹1,35,000'), 135000);
eq('empty string is 0', E.toNumber(''), 0);
eq('null is 0', E.toNumber(null), 0);
eq('NaN is 0', E.toNumber('abc'), 0);

/* ============================================================ */
console.log('\n' + '='.repeat(52));
console.log(fail === 0 ? 'ALL ' + pass + ' TESTS PASSED' : pass + ' passed, ' + fail + ' FAILED');
console.log('='.repeat(52));
process.exit(fail === 0 ? 0 : 1);
