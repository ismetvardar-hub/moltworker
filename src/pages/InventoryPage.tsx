import { useEffect, useState } from 'react'
import { Package, AlertTriangle, Plus, Minus } from 'lucide-react'
import { adjustStock, listInventory, type StockItem, type StockMovement } from '../services/inventory'

export function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [lowStock, setLowStock] = useState<StockItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function reload() {
    try {
      const inv = await listInventory()
      setItems(inv.items)
      setLowStock(inv.lowStock)
      setMovements(inv.movements)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stok yüklenemedi')
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function onAdjust(id: string, delta: number) {
    setBusy(id)
    try {
      await adjustStock({ id, delta, reason: delta > 0 ? 'restock' : 'use' })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hareket başarısız')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight text-stone-100">Envanter</h1>
        <p className="mt-1 max-w-xl text-sm text-stone-400">
          HEPHAESTUS stok katmanı — kritik eşik altı ürünler ve hareketler.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      {lowStock.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="text-sm font-medium">Düşük stok ({lowStock.length})</h2>
          </div>
          <ul className="space-y-1 text-sm text-amber-100/90">
            {lowStock.map((i) => (
              <li key={i.id}>
                {i.name} — {i.qty} {i.unit} (eşik {i.minQty})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2 text-stone-300">
          <Package className="h-4 w-4" />
          <h2 className="text-sm font-medium">Stok listesi</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Ürün</th>
                <th className="px-3 py-2">Miktar</th>
                <th className="px-3 py-2">Mekan</th>
                <th className="px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-white/5 text-stone-200">
                  <td className="px-3 py-2 font-mono text-xs text-stone-400">{i.sku}</td>
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2">
                    {i.qty} {i.unit}
                    {i.low ? <span className="ml-2 text-xs text-amber-300">düşük</span> : null}
                  </td>
                  <td className="px-3 py-2 text-stone-400">{i.venueId}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy === i.id}
                        onClick={() => void onAdjust(i.id, -1)}
                        className="rounded-md border border-white/10 p-1.5 text-stone-300 hover:bg-white/5 disabled:opacity-40"
                        aria-label="Azalt"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy === i.id}
                        onClick={() => void onAdjust(i.id, 1)}
                        className="rounded-md border border-white/10 p-1.5 text-stone-300 hover:bg-white/5 disabled:opacity-40"
                        aria-label="Artır"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-stone-300">Son hareketler</h2>
        <ul className="space-y-2 text-sm text-stone-400">
          {movements.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className={m.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {m.delta >= 0 ? '+' : ''}
                {m.delta}
              </span>{' '}
              · {m.sku || m.itemId} · {m.reason} · {m.actor} · {new Date(m.at).toLocaleString('tr-TR')}
            </li>
          ))}
          {movements.length === 0 && <li>Henüz hareket yok.</li>}
        </ul>
      </section>
    </div>
  )
}

export default InventoryPage
