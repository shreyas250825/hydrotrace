import { useFloodStore } from '@/store/useFloodStore'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

function DamSearch() {
  const catalog = useFloodStore((s) => s.damCatalog)
  const selectDam = useFloodStore((s) => s.selectDam)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return catalog.filter((d) => {
      const hay = [d.name, d.officialName, d.state, d.river, d.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [catalog, query])

  return (
    <div className="relative min-w-[12rem] flex-1 md:max-w-xs">
      <label className="sr-only" htmlFor="dam-search">
        Search dams / locations
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-navy-400" />
        <input
          id="dam-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search dams / locations"
          className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-400"
        />
      </div>
      {open && query.trim() ? (
        <div className="absolute left-0 right-0 z-[1200] mt-1 max-h-64 overflow-y-auto rounded-xl border border-navy-100 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-navy-500">No matching dams in catalog.</p>
          ) : (
            results.map((dam) => (
              <button
                key={dam.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-navy-800 hover:bg-navy-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  void selectDam(dam.id)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="font-medium">{dam.name}</span>
                <span className="text-navy-500"> — {dam.state}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export { DamSearch }
