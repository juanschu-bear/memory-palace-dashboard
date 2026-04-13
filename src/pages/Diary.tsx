import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AVATARS, readDiary } from '@/lib/api'

type DiaryEntry = { date?: string; content?: string; topic?: string; timestamp?: string }

const TAG_COLORS: Record<string, { border: string; color: string; bg: string }> = {
  skill: { border: 'rgba(107,138,90,0.2)', color: 'rgb(107,138,90)', bg: 'rgba(107,138,90,0.06)' },
  pattern: { border: 'rgba(138,107,90,0.2)', color: 'rgb(138,107,90)', bg: 'rgba(138,107,90,0.06)' },
  contact: { border: 'rgba(90,107,138,0.2)', color: 'rgb(90,107,138)', bg: 'rgba(90,107,138,0.06)' },
}

export default function DiaryPage() {
  const { avatarSlug } = useParams<{ avatarSlug: string }>()
  const avatar = AVATARS.find((a) => a.slug === avatarSlug) ?? AVATARS[0]
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [entries, setEntries] = useState<DiaryEntry[]>([])

  useEffect(() => {
    readDiary(avatar.slug, 20)
      .then((d) => setEntries(Array.isArray(d?.entries) ? d.entries : []))
      .catch(() => setEntries([]))
  }, [avatar.slug])

  const normalized = useMemo(() => {
    return entries.map((e) => {
      const content = e.content || ''
      const found = Array.from(content.matchAll(/\b(skill|pattern|contact)\/([\w-]+)/gi)).map((m) => ({
        t: `${m[1].toLowerCase()}/${m[2].toLowerCase()}`,
        c: m[1].toLowerCase(),
      }))
      return {
        date: e.date || (e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'Unknown date'),
        body: [content || 'No diary content available yet.'],
        tags: found,
      }
    })
  }, [entries])

  const allTags = [...new Set(normalized.flatMap((e) => e.tags.map((t) => t.t)))]
  const filtered = activeFilter ? normalized.filter((e) => e.tags.some((t) => t.t === activeFilter)) : normalized

  return (
    <div className="grain-overlay" style={{ background: 'var(--paper)', color: 'var(--ink)', minHeight: '100vh' }}>
      <nav className="fixed top-8 left-10 z-20 flex items-center gap-2 text-[0.72rem] tracking-wide px-4 py-2 rounded" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'rgba(247,242,234,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,184,154,0.3)' }}>
        <Link to="/" className="hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--ink-muted)' }}>Palace</Link>
        <span style={{ color: 'var(--warm)' }}>/</span>
        <Link to={`/wing/${avatar.slug}`} className="hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--ink-muted)' }}>{avatar.name}</Link>
        <span style={{ color: 'var(--warm)' }}>/</span>
        <span style={{ color: 'var(--gold)' }}>Diary</span>
      </nav>

      <div className="max-w-[680px] mx-auto px-8">
        <section className="pt-32 pb-12 text-center" style={{ animation: 'fade-up 1.2s ease-out 0.2s both' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-6 flex items-center justify-center text-xl font-medium" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, #8B6A3E 100%)', color: 'var(--paper)' }}>
            {avatar.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <h1 className="font-light tracking-wide mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>{avatar.name.split(' ')[0]}'s Diary</h1>
          <p className="italic font-light" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--ink-muted)' }}>What I learned, what I noticed, what I would do differently.</p>
          <p className="mt-4 text-[0.7rem]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--warm)', letterSpacing: '0.1em' }}>{normalized.length} entries</p>
        </section>

        <div className="w-[50px] h-px mx-auto mb-12" style={{ background: 'var(--warm)' }} />

        <div className="flex gap-2 flex-wrap justify-center mb-12" style={{ animation: 'fade-up 1.4s ease-out 0.4s both' }}>
          <button onClick={() => setActiveFilter(null)} className="px-4 py-1.5 rounded-full text-[0.65rem] tracking-[0.08em] transition-all duration-300" style={{ fontFamily: "'DM Sans', sans-serif", border: `1px solid ${activeFilter === null ? 'var(--ink)' : 'var(--stone-deep)'}`, background: activeFilter === null ? 'var(--ink)' : 'transparent', color: activeFilter === null ? 'var(--paper)' : 'var(--ink-muted)' }}>All</button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setActiveFilter(activeFilter === tag ? null : tag)} className="px-4 py-1.5 rounded-full text-[0.65rem] tracking-[0.08em] transition-all duration-300" style={{ fontFamily: "'DM Sans', sans-serif", border: `1px solid ${activeFilter === tag ? 'var(--ink)' : 'var(--stone-deep)'}`, background: activeFilter === tag ? 'var(--ink)' : 'transparent', color: activeFilter === tag ? 'var(--paper)' : 'var(--ink-muted)' }}>{tag.split('/')[1]}</button>
          ))}
        </div>

        <section className="pb-16">
          {filtered.map((entry, idx) => (
            <article key={idx} style={{ animation: `fade-up 1s ease-out ${0.5 + idx * 0.15}s both` }}>
              {idx > 0 && <div className="text-center py-10 text-[0.6rem] tracking-[1em]" style={{ color: 'var(--warm)' }}>&#x2022; &nbsp; &#x2022; &nbsp; &#x2022;</div>}
              <div className="text-[0.65rem] tracking-[0.15em] uppercase mb-4" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--warm)' }}>{entry.date}</div>
              <div className="pl-6 border-l-2" style={{ borderColor: 'var(--stone-deep)', fontFamily: "'Caveat', cursive", fontSize: '1.35rem', lineHeight: 1.85, color: '#3D3428' }}>
                {entry.body.map((p, pi) => <p key={pi} className="mb-3">{p}</p>)}
              </div>
              <div className="flex gap-2 flex-wrap mt-5 pl-6">
                {entry.tags.map((tag) => {
                  const tc = TAG_COLORS[tag.c] ?? TAG_COLORS.skill
                  return <span key={tag.t} className="text-[0.55rem] tracking-[0.08em] uppercase px-3 py-1 rounded-sm" style={{ fontFamily: "'DM Sans', sans-serif", border: `1px solid ${tc.border}`, color: tc.color, background: tc.bg }}>{tag.t}</span>
                })}
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p style={{ color: 'var(--ink-muted)' }}>No entries found.</p>}
        </section>
      </div>
    </div>
  )
}
