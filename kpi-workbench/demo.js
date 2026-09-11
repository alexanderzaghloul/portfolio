'use strict';
/* Deterministic synthetic portfolio data. No employer or production data. */
const BASELINE = (() => {
  const DAY = 86400000;
  const asOf = Date.UTC(2026, 8, 10) / DAY;
  const programs = ['Roadside Assistance', 'Travel Support', 'Home Emergency', 'Vehicle Protection', 'Specialty Services'];
  const rows = [];
  let index = 1;
  for (let month = 1; month <= 8; month++) {
    const daysInMonth = new Date(Date.UTC(2026, month, 0)).getUTCDate();
    for (let j = 0; j < 210; j++, index++) {
      const startDate = Date.UTC(2026, month - 1, Math.min(1 + (j * 7) % daysInMonth, daysInMonth)) / DAY;
      let days = (j * 13 + month * 5) % Math.max(1, 8 - Math.floor(month / 3));
      if (j % 31 === 0) days = 11 + (j % 19);
      let status = 'Paid', paid = true, review = false, reason = '';
      if ((j === 17 || j === 101) && (month === 1 || month === 3 || month === 8)) {
        status = 'Unselected'; paid = false; days = asOf - startDate;
      }
      if (j === 147 && month === 4) {
        paid = false; review = true; days = -2; reason = 'Negative duration';
      }
      let cents = 7000 + ((j * 97 + month * 211) % 185000);
      if (status === 'Unselected' && j === 101) cents = -cents;
      rows.push({
        row: index + 1,
        month: `2026-${String(month).padStart(2, '0')}`,
        program: programs[(j + month) % programs.length],
        days, paid, review, cents, status, reason
      });
    }
  }
  return {
    name: 'synthetic_portfolio_demo.csv',
    id: 'synthetic-demo-v1-no-production-data',
    asOf: '2026-09-10',
    rows,
    counts: { raw: 1698, other: 1, canceled: 12, closed: 5, duplicates: 0 },
    loadedAt: '2026-09-10T00:00:00.000Z'
  };
})();
