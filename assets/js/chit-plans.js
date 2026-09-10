/* ============================================================
   VETRIVAAGAI CHIT FUNDS
   assets/js/chit-plans.js

   ============================================================
   THIS IS THE ONE PLACE TO EDIT CHIT PLANS.
   ============================================================

   Every calculator on the site reads from this array. Nothing
   else hard-codes a plan. Add, remove or edit a plan here and
   all three affordability calculators pick it up immediately.

   Each plan needs, at minimum:
     chitValue          total chit value in rupees
     monthlyInstallment monthly subscription in rupees
     tenure             number of months
     members            number of members (normally = tenure)

   Optional but recommended:
     code     short group name shown on the result card
     branch   'Sivagiri' | 'Karur' | 'All'
     tier     'starter' | 'growth' | 'premium'
     active   set false to hide a plan without deleting it

   RULE OF THUMB: chitValue === monthlyInstallment * members
   ============================================================ */

var CHIT_PLANS = [
  {
    code: 'TF M',
    chitValue: 50000,
    monthlyInstallment: 2000,
    tenure: 25,
    members: 25,
    tier: 'starter',
    branch: 'All',
    active: true
  },
  {
    code: 'TF A',
    chitValue: 75000,
    monthlyInstallment: 3000,
    tenure: 25,
    members: 25,
    tier: 'starter',
    branch: 'All',
    active: true
  },
  {
    code: 'TF P',
    chitValue: 100000,
    monthlyInstallment: 4000,
    tenure: 25,
    members: 25,
    tier: 'starter',
    branch: 'All',
    active: true
  },
  {
    code: 'TF S',
    chitValue: 150000,
    monthlyInstallment: 6000,
    tenure: 25,
    members: 25,
    tier: 'growth',
    branch: 'All',
    active: true
  },
  {
    code: 'TF R',
    chitValue: 200000,
    monthlyInstallment: 8000,
    tenure: 25,
    members: 25,
    tier: 'growth',
    branch: 'All',
    active: true
  },
  {
    code: 'TF T',
    chitValue: 250000,
    monthlyInstallment: 10000,
    tenure: 25,
    members: 25,
    tier: 'growth',
    branch: 'All',
    active: true
  },
  {
    code: 'TF X',
    chitValue: 500000,
    monthlyInstallment: 20000,
    tenure: 25,
    members: 25,
    tier: 'premium',
    branch: 'All',
    active: true
  },
  {
    code: 'TF I',
    chitValue: 1000000,
    monthlyInstallment: 40000,
    tenure: 25,
    members: 25,
    tier: 'premium',
    branch: 'All',
    active: true
  },
  {
    code: 'TF V',
    chitValue: 2500000,
    monthlyInstallment: 100000,
    tenure: 25,
    members: 25,
    tier: 'premium',
    branch: 'All',
    active: true
  }

  /* ----------------------------------------------------------
     TO ADD A NEW PLAN, copy the block below, uncomment it and
     fill in your numbers. Remember the comma after the previous
     plan's closing brace.

  ,{
    code: 'DP P',
    chitValue: 100000,
    monthlyInstallment: 4000,
    tenure: 25,
    members: 25,
    tier: 'starter',
    branch: 'Karur',
    active: true
  }
  ---------------------------------------------------------- */
];

/* ------------------------------------------------------------
   COMPANY DEFAULTS
   Used to pre-fill the auction calculator. Change here, not in
   the calculator code.
   ------------------------------------------------------------ */
var CHIT_DEFAULTS = {
  foremanCommissionPercent: 5,   // Vetrivaagai charges 5%
  maxAuctionDiscountPercent: 30, // company cap on bidding
  defaultAuctionDiscountPercent: 30,
  affordabilityRatio: 0.5,       // 50% of surplus income
  enrolmentCharge: 500           // one-time, first month only
};

/* Export for Node (used by the test suite); harmless in a browser. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHIT_PLANS: CHIT_PLANS, CHIT_DEFAULTS: CHIT_DEFAULTS };
}
