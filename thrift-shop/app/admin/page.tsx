'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function AdminPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.getDashboardData()
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError('The admin service is unavailable. Please check the backend connection.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-10 text-[#2d2023] dark:bg-[#1c1517] dark:text-[#fff7f2]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[#d9c8c1] pb-6 dark:border-[#49383b]">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.24em] text-[#8c5861]">Mery Rose</p>
            <h1 className="font-serif text-4xl font-semibold">Admin dashboard</h1>
          </div>
          <a className="rounded-full border border-[#8b273d] px-5 py-2 text-sm font-medium text-[#8b273d] transition hover:bg-[#8b273d] hover:text-white" href="/">
            Back to shop
          </a>
        </div>

        {loading && <p className="text-[#806d70]">Loading dashboard…</p>}
        {error && <div className="rounded-2xl border border-[#e3b5b5] bg-[#fff1f1] p-5 text-[#9b3030]">{error}</div>}
        {!loading && !error && (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data ?? {}).slice(0, 8).map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-[#eadbd5] bg-white p-6 shadow-sm dark:border-[#49383b] dark:bg-[#271d20]">
                <p className="text-sm capitalize text-[#806d70]">{label.replaceAll('_', ' ')}</p>
                <p className="mt-3 text-3xl font-semibold text-[#8b273d]">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
