export interface Inputs { price: number; rent: number; downPct: number; rate: number; closing: number; expPct: number; term: number; targetCoc: number }
export type Verdict = 'DIG DEEPER' | 'MAYBE' | 'PASS'
export const DEFAULTS: Inputs = { price: 0, rent: 0, downPct: 20, rate: 7, closing: 0, expPct: 50, term: 30, targetCoc: 8 }
export const EXAMPLE: Inputs = { ...DEFAULTS, price: 250000, rent: 2200, closing: 10000 }

export function mortgagePayment(principal: number, ratePct: number, years: number): number {
  const n = years * 12
  if (principal <= 0 || n <= 0) return 0
  const r = ratePct / 100 / 12
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}
export const cashNeeded = (i: Inputs) => (i.price * i.downPct) / 100 + i.closing
export const expenses = (i: Inputs) => (i.rent * i.expPct) / 100
export const loanMortgage = (i: Inputs) => mortgagePayment(i.price * (1 - i.downPct / 100), i.rate, i.term)
export const cashFlow = (i: Inputs) => i.rent - expenses(i) - loanMortgage(i)
export const cashOnCash = (i: Inputs) => { const c = cashNeeded(i); return c > 0 ? (cashFlow(i) * 12) / c * 100 : 0 }
export const noi = (i: Inputs) => i.rent * 12 - expenses(i) * 12
export const capRate = (i: Inputs) => (i.price > 0 ? (noi(i) / i.price) * 100 : 0)
export const onePctRatio = (i: Inputs) => (i.price > 0 ? (i.rent / i.price) * 100 : 0)
export const onePctPass = (i: Inputs) => i.price > 0 && i.rent >= i.price * 0.01
/** Rent where cash flow = 0: rent*(1-exp%) = mortgage. */
export const breakEvenRent = (i: Inputs) => (i.expPct >= 100 ? Infinity : loanMortgage(i) / (1 - i.expPct / 100))
/** Highest price where CoC >= target (closing $ held fixed). Bisection; CoC falls as price rises. */
export function maxOfferPrice(i: Inputs): number {
  const coc = (p: number) => cashOnCash({ ...i, price: p })
  if (i.rent <= 0 || coc(1) < i.targetCoc) return 0
  let lo = 1, hi = Math.max(i.rent * 1000, 1e6)
  if (coc(hi) >= i.targetCoc) return hi
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (coc(m) >= i.targetCoc) lo = m; else hi = m }
  return lo
}
export function verdict(i: Inputs): Verdict {
  const cf = cashFlow(i)
  if (cf < 0) return 'PASS'
  if (cf > 0 && cashOnCash(i) >= i.targetCoc) return 'DIG DEEPER'
  return 'MAYBE'
}
export const usd = (n: number, d = 0) => (Number.isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
export const pct = (n: number) => (Number.isFinite(n) ? n.toFixed(1) + '%' : '—')
export function shareText(name: string, i: Inputs): string {
  return [`Back of a Napkin: ${name || 'Deal'}`, `Price ${usd(i.price)} · Rent ${usd(i.rent)}/mo`, `Cash needed ${usd(cashNeeded(i))}`,
    `Mortgage ${usd(loanMortgage(i))} · Expenses ${usd(expenses(i))}`, `Cash flow ${usd(cashFlow(i))}/mo`,
    `CoC ${pct(cashOnCash(i))} · Cap ${pct(capRate(i))} · 1% rule ${onePctPass(i) ? 'pass' : 'fail'}`, `Verdict: ${verdict(i)}`].join('\n')
}
