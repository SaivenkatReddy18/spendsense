import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

const now = new Date()
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{fmt(value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [month, year])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sRes, tRes, cRes, rRes] = await Promise.all([
        api.get(`/analytics/summary?month=${month}&year=${year}`),
        api.get('/analytics/trend?months=6'),
        api.get(`/analytics/by-category?month=${month}&year=${year}`),
        api.get('/transactions/'),
      ])
      setSummary(sRes.data)
      setTrend(tRes.data)
      setByCategory(cRes.data)
      setRecent(rRes.data.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Your financial snapshot</p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-slate-700 rounded-xl px-4 py-2.5">
          <Calendar size={15} className="text-slate-400" />
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
            {MONTHS.map((m, i) => <option key={i} value={i+1} className="bg-slate-800">{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
            {[2024,2025,2026].map(y => <option key={y} value={y} className="bg-slate-800">{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Income" value={summary?.total_income} icon={TrendingUp} color="#22c55e" />
            <StatCard label="Total Expenses" value={summary?.total_expenses} icon={TrendingDown} color="#ef4444" />
            <StatCard label="Net Balance" value={summary?.net} icon={Wallet} color="#6366f1" />
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="col-span-3 bg-surface rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-white font-semibold mb-6">6-Month Trend</h3>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', fontSize: '13px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    formatter={(val, name) => [fmt(val), name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend formatter={val => <span style={{ color: '#94a3b8', fontSize: 12 }}>{val.charAt(0).toUpperCase() + val.slice(1)}</span>} />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} dot={false} name="income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={false} name="expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-2 bg-surface rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
              {byCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-slate-500 text-sm gap-2">
                  <Wallet size={32} className="text-slate-700" />
                  <span>No data for this month</span>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                        dataKey="total" nameKey="category_name" paddingAngle={3}>
                        {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', fontSize: '13px' }}
                        formatter={(val, name) => [fmt(val), name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5 mt-2">
                    {byCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-400 text-sm">{cat.category_name}</span>
                        </div>
                        <span className="text-white text-sm font-medium">{fmt(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm gap-2">
                <TrendingUp size={28} className="text-slate-700" />
                <span>No transactions yet</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {recent.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {tx.type === 'income' ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{tx.description || 'No description'}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{tx.category?.name ?? 'Uncategorized'} · {tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}