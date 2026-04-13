import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContacts, fetchMemories, fetchConversationMemory } from '@/lib/api'

type Contact = { id?: string; name?: string; owner_id?: string; updated_at?: string }

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sessionsByContact, setSessionsByContact] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchContacts().then((rows) => setContacts(Array.isArray(rows) ? rows : [])).catch(() => setContacts([]))
    Promise.all([fetchMemories(), fetchConversationMemory()]).then(([m1, m2]) => {
      const counts: Record<string, number> = {}
      ;[...(Array.isArray(m1) ? m1 : []), ...(Array.isArray(m2) ? m2 : [])].forEach((m: any) => {
        const id = m.contact_id || m.user_id || m.owner_id || 'unknown'
        counts[id] = (counts[id] || 0) + 1
      })
      setSessionsByContact(counts)
    }).catch(() => setSessionsByContact({}))
  }, [])

  const filtered = useMemo(() => contacts.filter((c) => (c.name || '').toLowerCase().includes(search.toLowerCase())), [contacts, search])
  const totalSessions = Object.values(sessionsByContact).reduce((a, b) => a + b, 0)

  return (
    <div className="grain-overlay" style={{ background: 'var(--paper-bright)', color: 'var(--ink)', minHeight: '100vh' }}>
      <nav className="fixed top-8 left-10 z-20 flex items-center gap-2 text-[0.72rem] tracking-wide px-4 py-2 rounded" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'rgba(253,251,247,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,184,154,0.25)' }}>
        <Link to="/" className="hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--ink-muted)' }}>Palace</Link>
        <span style={{ color: 'var(--stone-deep)' }}>/</span><span style={{ color: 'var(--gold)' }}>Contacts</span>
      </nav>

      <div className="max-w-[800px] mx-auto px-8">
        <section className="text-center pt-32 pb-8" style={{ animation: 'fade-up 1.2s ease-out 0.2s both' }}>
          <h1 className="font-light tracking-wide mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 4vw, 3rem)' }}>Contacts</h1>
          <p className="font-light italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--ink-muted)' }}>Everyone who has stepped inside the palace.</p>
          <p className="mt-4 text-[0.7rem]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--warm)', letterSpacing: '0.08em' }}>{contacts.length} contacts &middot; {totalSessions} total sessions</p>
        </section>

        <div className="w-[50px] h-px mx-auto mb-12" style={{ background: 'var(--stone-deep)' }} />
        <div className="mb-10" style={{ animation: 'fade-up 1.3s ease-out 0.35s both' }}>
          <input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-5 py-4 rounded-sm outline-none transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 300, background: 'var(--stone)', border: '1px solid var(--stone-deep)', color: 'var(--ink)' }} />
        </div>

        <section className="pb-20">
          {filtered.map((contact, i) => {
            const id = contact.id || contact.owner_id || 'unknown'
            const name = contact.name || id
            return (
              <div key={id + i} className="grid grid-cols-[auto_1fr_auto] gap-6 items-start py-8 border-t cursor-pointer transition-all duration-300 group hover:pl-3 hover:bg-[rgba(184,149,106,0.02)]" style={{ borderColor: 'var(--stone-deep)', animation: `fade-up 1s ease-out ${0.4 + i * 0.1}s both` }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-medium shrink-0 mt-0.5" style={{ background: 'var(--stone)', border: '1px solid var(--stone-deep)', color: 'var(--ink-muted)' }}>{name[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div className="text-xl font-normal group-hover:text-[var(--gold)] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{name}</div>
                  <div className="text-sm font-light leading-relaxed mt-1" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--ink-muted)' }}>{id}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}>{sessionsByContact[id] || 0}</div>
                  <div className="text-[0.6rem] tracking-[0.12em] uppercase mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--warm)' }}>Sessions</div>
                  <div className="text-[0.65rem] mt-3" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--warm)' }}>Last seen: {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            )
          })}
          {filtered.length > 0 && <div className="border-b" style={{ borderColor: 'var(--stone-deep)' }} />}
        </section>
      </div>
    </div>
  )
}
