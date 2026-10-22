import { useEffect, useMemo, useState } from 'react'
import * as c from './calc'
import type { Inputs } from './calc'

interface Deal { id: string; name: string; inputs: Inputs; saved: number }
const KEY = 'napkin.deals.v1', DRAFT = 'napkin.draft.v1'
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
type Tab = 'napkin' | 'saved' | 'compare' | 'how'

const FIELDS: { k: keyof Inputs; label: string; pre?: string; suf?: string; step?: string }[] = [
  { k: 'price', label: 'Price', pre: '$' }, { k: 'rent', label: 'Monthly rent', pre: '$' },
  { k: 'downPct', label: 'Down', suf: '%' }, { k: 'rate', label: 'Rate', suf: '%', step: '0.125' },
  { k: 'closing', label: 'Closing + repairs', pre: '$' }, { k: 'expPct', label: 'Expenses', suf: '% rent' },
  { k: 'term', label: 'Term', suf: 'yrs' }, { k: 'targetCoc', label: 'Target CoC', suf: '%' },
]
const fmtIn = (n: number) => (n ? n.toLocaleString('en-US', { maximumFractionDigits: 3 }) : '')

function Stamp({ v, small }: { v: c.Verdict; small?: boolean }) {
  const cls = v === 'PASS' ? 'red' : v === 'MAYBE' ? 'amber' : 'green'
  return <div className={`stamp ${cls} ${small ? 'small' : ''}`}>{v}</div>
}

export default function App() {
  const [tab, setTab] = useState<Tab>('napkin')
  const [i, setI] = useState<Inputs>(() => load(DRAFT, c.DEFAULTS))
  const [deals, setDeals] = useState<Deal[]>(() => load(KEY, []))
  const [name, setName] = useState('')
  const [pick, setPick] = useState<string[]>([])
  const [toast, setToast] = useState('')
  useEffect(() => localStorage.setItem(DRAFT, JSON.stringify(i)), [i])
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(deals)), [deals])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 1800); return () => clearTimeout(t) } }, [toast])

  const r = useMemo(() => ({
    cash: c.cashNeeded(i), mort: c.loanMortgage(i), exp: c.expenses(i), cf: c.cashFlow(i), coc: c.cashOnCash(i),
    cap: c.capRate(i), one: c.onePctPass(i), ratio: c.onePctRatio(i), be: c.breakEvenRent(i), max: c.maxOfferPrice(i), v: c.verdict(i),
  }), [i])
  const ready = i.price > 0 && i.rent > 0
  const set = (k: keyof Inputs, s: string) => setI({ ...i, [k]: Number(s.replace(/[^0-9.]/g, '')) || 0 })

  const save = () => {
    const d: Deal = { id: crypto.randomUUID(), name: name.trim() || `Deal ${deals.length + 1}`, inputs: i, saved: Date.now() }
    setDeals([d, ...deals]); setName(''); setToast('Saved, Chairman.')
  }
  const share = async (n: string, inp: Inputs) => {
    const text = c.shareText(n, inp)
    if (navigator.share) { try { await navigator.share({ title: 'Back of a Napkin', text }) } catch { /* cancelled */ } }
    else { await navigator.clipboard?.writeText(text); setToast('Copied to clipboard') }
  }
  const backup = () => {
    const blob = new Blob([JSON.stringify({ app: 'napkin', version: 1, exported: new Date().toISOString(), deals }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `napkin-deals-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const restore = (f?: File) => f?.text().then((t) => {
    try { const j = JSON.parse(t); const list: Deal[] = Array.isArray(j) ? j : j.deals; const ids = new Set(deals.map((d) => d.id))
      setDeals([...deals, ...list.filter((d) => d?.inputs && !ids.has(d.id))]); setToast(`Restored ${list.length} deals`) } catch { setToast('Not a Napkin backup') }
  })
  const togglePick = (id: string) => setPick(pick.includes(id) ? pick.filter((x) => x !== id) : [...pick, id].slice(-3))
  const compared = deals.filter((d) => pick.includes(d.id))

  return (
    <div className="app">
      <header><h1>Back of a Napkin</h1><p className="sub">Quick math, Chairman. Dig deeper or pass.</p></header>

      {tab === 'napkin' && <main className="paper">
        <div className="grid">
          {FIELDS.map((f) => (
            <label key={f.k} className={f.k === 'price' || f.k === 'rent' ? 'wide' : ''}>
              <span>{f.label}</span>
              <div className="field">{f.pre && <em>{f.pre}</em>}
                <input inputMode="decimal" value={fmtIn(i[f.k])} placeholder="0" data-k={f.k}
                  onChange={(e) => set(f.k, e.target.value)} onFocus={(e) => e.target.select()} />
                {f.suf && <em>{f.suf}</em>}</div>
            </label>))}
        </div>
        <div className="row-btns"><button className="ghost" onClick={() => setI(c.EXAMPLE)}>Load example</button><button className="ghost" onClick={() => setI(c.DEFAULTS)}>Clear</button></div>

        <hr className="tear" />
        {!ready ? <p className="hint ink">Enter a price and rent to scribble the numbers…</p> : <section className="results">
          <div className="cf"><span>Monthly cash flow</span><b className={r.cf < 0 ? 'neg' : 'ink'}>{c.usd(r.cf)}</b><Stamp v={r.v} /></div>
          <dl>
            <dt>Cash needed</dt><dd>{c.usd(r.cash)}</dd>
            <dt>Mortgage</dt><dd>{c.usd(r.mort)}/mo</dd>
            <dt>Expenses ({i.expPct}%)</dt><dd>{c.usd(r.exp)}/mo</dd>
            <dt>Cash-on-cash</dt><dd>{c.pct(r.coc)}</dd>
            <dt>Cap rate</dt><dd>{c.pct(r.cap)}</dd>
            <dt>1% rule</dt><dd className={r.one ? 'ok' : 'bad'}>{r.one ? '✓' : '✗'} {r.ratio.toFixed(2)}%</dd>
          </dl>
          <div className="extras">
            <div><span>Break-even rent</span><b>{c.usd(r.be)}</b></div>
            <div><span>Max offer @ {i.targetCoc}% CoC</span><b>{r.max > 0 ? c.usd(Math.floor(r.max / 1000) * 1000) : 'none'}</b></div>
          </div>
          <div className="save">
            <input placeholder="Address or nickname" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={save}>Save</button><button className="ghost" onClick={() => share(name, i)}>Share</button>
          </div>
        </section>}
      </main>}

      {tab === 'saved' && <main className="paper">
        <h2>Saved deals</h2>
        {deals.length === 0 && <p className="hint">Nothing saved yet. Napkins pile up fast.</p>}
        <p className="hint">{deals.length > 1 ? 'Tick up to 3 to compare.' : ''}</p>
        <ul className="deals">{deals.map((d) => { const cf = c.cashFlow(d.inputs); return (
          <li key={d.id}>
            <input type="checkbox" checked={pick.includes(d.id)} onChange={() => togglePick(d.id)} aria-label={`compare ${d.name}`} />
            <div className="dmain" onClick={() => { setI(d.inputs); setName(d.name); setTab('napkin') }}>
              <b>{d.name}</b><small>{c.usd(d.inputs.price)} · {c.usd(d.inputs.rent)}/mo</small>
              <span className={cf < 0 ? 'neg' : 'ink'}>{c.usd(cf)}/mo · {c.pct(c.cashOnCash(d.inputs))} CoC</span></div>
            <Stamp v={c.verdict(d.inputs)} small />
            <div className="dact"><button className="ghost xs" onClick={() => share(d.name, d.inputs)}>Share</button>
              <button className="ghost xs" onClick={() => confirm(`Delete ${d.name}?`) && setDeals(deals.filter((x) => x.id !== d.id))}>✕</button></div>
          </li>)})}</ul>
        {pick.length >= 2 && <button className="wideb" onClick={() => setTab('compare')}>Compare {pick.length} side by side</button>}
        <div className="row-btns"><button className="ghost" onClick={backup} disabled={!deals.length}>JSON backup</button>
          <label className="ghost btnlike">Restore<input type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files?.[0])} /></label></div>
      </main>}

      {tab === 'compare' && <main className="paper">
        <h2>Side by side</h2>
        {compared.length < 2 ? <p className="hint">Pick 2–3 deals in Saved.</p> :
          <table className="cmp"><thead><tr><th></th>{compared.map((d) => <th key={d.id}>{d.name}</th>)}</tr></thead><tbody>
            {([['Price', (x: Inputs) => c.usd(x.price)], ['Rent', (x: Inputs) => c.usd(x.rent)], ['Cash needed', (x: Inputs) => c.usd(c.cashNeeded(x))],
              ['Mortgage', (x: Inputs) => c.usd(c.loanMortgage(x))], ['Cash flow', (x: Inputs) => c.usd(c.cashFlow(x))], ['CoC', (x: Inputs) => c.pct(c.cashOnCash(x))],
              ['Cap rate', (x: Inputs) => c.pct(c.capRate(x))], ['1% rule', (x: Inputs) => (c.onePctPass(x) ? '✓' : '✗') + ' ' + c.onePctRatio(x).toFixed(2) + '%'],
              ['Break-even', (x: Inputs) => c.usd(c.breakEvenRent(x))]] as const).map(([l, f]) =>
              <tr key={l}><td>{l}</td>{compared.map((d) => <td key={d.id} className={l === 'Cash flow' && c.cashFlow(d.inputs) < 0 ? 'neg' : 'ink'}>{f(d.inputs)}</td>)}</tr>)}
            <tr><td>Verdict</td>{compared.map((d) => <td key={d.id}><Stamp v={c.verdict(d.inputs)} small /></td>)}</tr>
          </tbody></table>}
      </main>}

      {tab === 'how' && <main className="paper how">
        <h2>How the napkin works</h2>
        <ol>
          <li><b>Cash needed</b> = down payment + closing + repairs.</li>
          <li><b>Expenses</b> = 50% rule: about half of gross rent covers taxes, insurance, maintenance, vacancy and management.</li>
          <li><b>Mortgage</b> = standard amortization on price − down, at your rate and term.</li>
          <li><b>Cash flow</b> = rent − expenses − mortgage.</li>
          <li><b>Cash-on-cash</b> = annual cash flow ÷ cash invested.</li>
          <li><b>Cap rate</b> = NOI ÷ price, NOI = (rent − expenses) × 12.</li>
          <li><b>1% rule</b>: monthly rent ≥ 1% of price, as a quick screen.</li>
        </ol>
        <p><Stamp v="DIG DEEPER" small /> cash flow positive and CoC at/above your target.</p>
        <p><Stamp v="MAYBE" small /> cash flow ≥ 0 but under target. Thin; check the 1% ratio.</p>
        <p><Stamp v="PASS" small /> negative cash flow.</p>
        <p className="ink">Example: $250k, $2,200 rent, 20% down + $10k → $60k in. Expenses $1,100, mortgage ≈ $1,331 → ≈ −$231/mo. PASS. At $2,800 rent it turns positive.</p>
        <p className="caveat">This is a filter, not due diligence. Real taxes, insurance, HOA, rehab bids, rents and financing get checked in a full spreadsheet before any offer.</p>
      </main>}

      {toast && <div className="toast">{toast}</div>}
      <nav>{([['napkin', '✎ Napkin'], ['saved', `▤ Saved${deals.length ? ` (${deals.length})` : ''}`], ['compare', '⇆ Compare'], ['how', '? How']] as [Tab, string][]).map(([t, l]) =>
        <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{l}</button>)}</nav>
    </div>
  )
}
