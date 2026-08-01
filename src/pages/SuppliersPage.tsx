import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { listInventory, type StockItem } from '../services/inventory'
import {
  createPurchaseOrder,
  fetchSuppliers,
  receivePurchaseOrder,
  type PurchaseOrder,
  type Supplier,
} from '../services/suppliers'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [supplierId, setSupplierId] = useState('')
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(20)

  async function refresh() {
    try {
      const [s, inv] = await Promise.all([
        fetchSuppliers(),
        listInventory().catch(() => ({ items: [] as StockItem[] })),
      ])
      setSuppliers(s.suppliers)
      setOrders(s.orders)
      setItems(inv.items)
      if (!supplierId && s.suppliers[0]) setSupplierId(s.suppliers[0].id)
      if (!itemId && inv.items[0]) setItemId(inv.items[0].id)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tedarik verisi alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onOrder(e: FormEvent) {
    e.preventDefault()
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    try {
      await createPurchaseOrder({
        supplierId,
        lines: [
          {
            itemId: item.id,
            sku: item.sku,
            name: item.name,
            qty,
            unit: item.unit,
          },
        ],
      })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sipariş açılamadı')
    }
  }

  async function onReceive(id: string) {
    try {
      await receivePurchaseOrder(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Teslim alınamadı')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Tedarik / AGORA</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tedarikçiler ve satınalma siparişleri — teslim stoka işler.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Yeni satınalma">
        <form onSubmit={(e) => void onOrder(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400 md:col-span-2">
            Tedarikçi
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            SKU
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sku} — {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Adet
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Sipariş aç
            </button>
          </div>
        </form>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={`Tedarikçiler (${suppliers.length})`}>
          <ul className="space-y-2 text-sm">
            {suppliers.map((s) => (
              <li key={s.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
                <div className="font-medium text-slate-200">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.category} · lead {s.leadDays}g · {s.contact || s.phone || '—'}
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title={`Siparişler (${orders.length})`}>
          <ul className="space-y-2 text-sm">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2"
              >
                <div>
                  <div className="font-medium text-slate-200">
                    {o.supplierName} · {o.status}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(o.lines || []).map((l) => `${l.name}×${l.qty}`).join(', ')}
                  </div>
                </div>
                {o.status !== 'received' && (
                  <button
                    type="button"
                    onClick={() => void onReceive(o.id)}
                    className="rounded-md bg-emerald-600/80 px-2 py-1 text-xs text-white"
                  >
                    Teslim al
                  </button>
                )}
              </li>
            ))}
            {orders.length === 0 && <li className="text-slate-500">Henüz sipariş yok.</li>}
          </ul>
        </PanelCard>
      </div>
    </div>
  )
}
