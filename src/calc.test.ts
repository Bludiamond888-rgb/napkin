import { describe, it, expect } from 'vitest'
import * as c from './calc'
const ex = c.EXAMPLE
describe('napkin formulas', () => {
  it('cash needed', () => expect(c.cashNeeded(ex)).toBe(60000))
  it('expenses 50%', () => expect(c.expenses(ex)).toBe(1100))
  it('mortgage ~1330.60', () => expect(c.loanMortgage(ex)).toBeCloseTo(1330.6, 1))
  it('zero rate & zero principal', () => { expect(c.mortgagePayment(360000, 0, 30)).toBe(1000); expect(c.mortgagePayment(0, 7, 30)).toBe(0) })
  it('cash flow ~-230.60 => PASS', () => { expect(c.cashFlow(ex)).toBeCloseTo(-230.6, 1); expect(c.verdict(ex)).toBe('PASS') })
  it('CoC', () => expect(c.cashOnCash(ex)).toBeCloseTo((-230.6 * 12) / 60000 * 100, 1))
  it('NOI & cap rate', () => { expect(c.noi(ex)).toBe(13200); expect(c.capRate(ex)).toBeCloseTo(5.28, 2) })
  it('1% rule', () => { expect(c.onePctPass(ex)).toBe(false); expect(c.onePctPass({ ...ex, rent: 2500 })).toBe(true) })
  it('$2,800 rent turns positive', () => { const d = { ...ex, rent: 2800 }; expect(c.cashFlow(d)).toBeGreaterThan(0); expect(c.cashFlow(d)).toBeCloseTo(69.4, 1); expect(c.verdict(d)).toBe('MAYBE') })
  it('DIG DEEPER when CoC >= target', () => expect(c.verdict({ ...ex, rent: 3500 })).toBe('DIG DEEPER'))
  it('break-even rent', () => { const be = c.breakEvenRent(ex); expect(be).toBeCloseTo(2661.2, 0); expect(c.cashFlow({ ...ex, rent: be })).toBeCloseTo(0, 6) })
  it('max offer hits target CoC', () => { const p = c.maxOfferPrice(ex); expect(p).toBeGreaterThan(0); expect(p).toBeLessThan(250000); expect(c.cashOnCash({ ...ex, price: p })).toBeCloseTo(8, 3) })
  it('share text', () => expect(c.shareText('Elm St', ex)).toContain('Verdict: PASS'))
})
