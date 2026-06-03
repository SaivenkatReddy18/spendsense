import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../api/axios'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#94a3b8'
]

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0)

const today = new Date().toISOString().split('T')[0]
const emptyTx = { amount: '', description: '', date: today, type: 'expense', category_id: '' }
const emptyCat = { name: '', type: 'expense', color: '#6366f1' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [filterType, setFilterType] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [loading, setLoading] = useState(true)

  const [txModal, setTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [txForm, setTxForm] = useState(emptyTx)
  const [txLoading, setTxLoading] = useState(false)

  const [catModal, setCatModal] = useState(false)
  const [catForm, setCatForm] = useState(emptyCat)
  const [catLoading, setCatLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [txRes, catRes] = await Promise.all([
        api.get('/transactions/'),
        api.get('/categories/'),
      ])
      setTransactions(txRes.data)
      setCategories(catRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAddTx = () => { setEditingTx(null); setTxForm(emptyTx); setTxModal(true) }

  const openEditTx = (tx) => {
    setEditingTx(tx)
    setTxForm({ amount: tx.amount, description: tx.description, date: tx.date, type: tx.type, category_id: tx.category_id ?? '' })
    setTxModal(true)
  }

  const handleSaveTx = async () => {
    setTxLoading(true)
    try {
      const payload = { ...txForm, amount: parseFloat(txForm.amount), category_id: txForm.category_id || null }
      if (editingTx) { await api.put(`/transactions/${editingTx.id}`, payload) }
      else { await api.post('/transactions/', payload) }
      setTxModal(false)
      fetchAll()
    } catch (err) { console.error(err) }
    finally { setTxLoading(false) }
  }

  const handleDeleteTx = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/transactions/${id}`)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const handleSaveCat = async () => {
    setCatLoading(true)
    try {
      await api.post('/categories/', catForm)
      setCatModal(false); setCatForm(emptyCat); fetchAll()
    } catch (err) { console.error(err) }
    finally { setCatLoading(false) }
  }

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete this category?')) return
    await api.delete(`/categories/${id}`)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const filtered = transactions.filter(tx => {
    if (filterType && tx.type !== filterType) return false
    if (filterCat && tx.category_id !== Number(filterCat)) return false
    return true
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <p className="text-slate-400 text-sm mt-1">{transactions.length} total</p>
        </div>
        <button onClick={openAddTx} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-surface border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary cursor-pointer">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-surface border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary cursor-pointer">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filterType || filterCat) && (
          <button onClick={() => { setFilterType(''); setFilterCat('') }} className="text-slate-400 hover:text-white text-sm transition-colors">
            Clear
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-slate-700/50 mb-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <Plus size={32} className="text-slate-700" />
            <span className="text-sm">No transactions found</span>
            <button onClick={openAddTx} className="text-primary text-sm hover:underline mt-1">Add your first one</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filtered.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-10 rounded-full ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{tx.description || 'No description'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{tx.category?.name ?? 'Uncategorized'} · {tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditTx(tx)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Tag size={15} className="text-primary" />
            Categories
          </h3>
          <button onClick={() => { setCatForm(emptyCat); setCatModal(true) }} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors">
            <Plus size={14} />
            Add
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm">No categories yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 group">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300 text-sm">{cat.name}</span>
                <span className="text-slate-600 text-xs capitalize">{cat.type}</span>
                <button onClick={() => handleDeleteCat(cat.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {txModal && (
        <Modal title={editingTx ? 'Edit Transaction' : 'Add Transaction'} onClose={() => setTxModal(false)}>
          <div className="space-y-4">
            <div className="flex rounded-xl overflow-hidden border border-slate-600">
              {['income', 'expense'].map(t => (
                <button key={t} onClick={() => setTxForm(f => ({ ...f, type: t, category_id: '' }))}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    txForm.type === t
                      ? t === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      : 'text-slate-400 hover:text-white'
                  }`}>{t}</button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Amount</label>
              <input type="number" step="0.01" min="0" value={txForm.amount}
                onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Description</label>
              <input type="text" value={txForm.description}
                onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                placeholder="What's this for?" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Category</label>
              <select value={txForm.category_id} onChange={e => setTxForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary">
                <option value="">No category</option>
                {categories.filter(c => c.type === txForm.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Date</label>
              <input type="date" value={txForm.date}
                onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTxModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleSaveTx} disabled={!txForm.amount || txLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
                {txLoading ? 'Saving...' : editingTx ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {catModal && (
        <Modal title="Add Category" onClose={() => setCatModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Name</label>
              <input type="text" value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                placeholder="e.g. Groceries" />
            </div>
            <div className="flex rounded-xl overflow-hidden border border-slate-600">
              {['income', 'expense'].map(t => (
                <button key={t} onClick={() => setCatForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    catForm.type === t
                      ? t === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      : 'text-slate-400 hover:text-white'
                  }`}>{t}</button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setCatForm(f => ({ ...f, color: c }))}
                    className={`w-8 h-8 rounded-lg transition-all ${catForm.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-surface' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCatModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleSaveCat} disabled={!catForm.name || catLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
                {catLoading ? 'Saving...' : 'Add Category'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}