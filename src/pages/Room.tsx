import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AVATARS, ROOM_DESCRIPTIONS, HALLS, type RoomName } from '@/lib/api'

interface Drawer {
  id: string
  date: string
  title: string
  summary: string
  hall: string
  contact: string
  detail: string
  tags: string[]
}

const MOCK_DRAWERS: Drawer[] = [
  { id: '1', date: 'Apr 12, 2026', title: 'Maria raised her course price from 197 to 297 euros', summary: 'After three sessions of circling the topic, Maria finally committed to the higher price. The trigger was reframing it from "charging more" to "valuing her expertise".', hall: 'decision', contact: 'Maria', detail: 'Full transcript excerpt: "I set it to 297. It felt uncomfortable but... right? Like, I actually believe it now." OPM noted a drop in vocal tremor compared to the first session.', tags: ['pricing', 'self-worth'] },
  { id: '2', date: 'Apr 10, 2026', title: 'Pedro cannot decide whether to keep his current pricing', summary: 'Pedro has been going back and forth for two sessions. The core blocker is fear of losing existing clients if he raises prices.', hall: 'problem', contact: 'Pedro', detail: 'Pedro asked "What if my best clients leave?" three times across two sessions. The root fear is whether Pedro believes his clients stay for his value rather than his price.', tags: ['pricing', 'fear'] },
  { id: '3', date: 'Apr 8, 2026', title: 'Pricing fear is always about self-worth', summary: 'Cross-contact pattern recognized: every person who struggled with pricing ultimately had a self-worth question underneath.', hall: 'discovery', contact: 'Multiple', detail: 'Observed across Maria, Pedro, and Lisa. All three framed pricing as a market question. All three revealed the real question was "Am I worth it?" Recommendation: always go to the self-worth question first.', tags: ['pattern', 'cross-contact'] },
  { id: '4', date: 'Apr 5, 2026', title: 'Maria prefers direct confrontation over gentle probing', summary: 'When asked gently, Maria deflects. When confronted directly, she engages honestly.', hall: 'preference', contact: 'Maria', detail: 'Session 3 vs Session 1 comparison. Gentle probing led to 4 minutes of deflection. Direct confrontation led to immediate honest engagement. OPM confirmed: authenticity markers spiked after direct confrontation.', tags: ['communication'] },
  { id: '5', date: 'Apr 2, 2026', title: 'Maria launched her online course successfully', summary: '12 signups in the first week at the new 297 price point. Revenue exceeded her monthly target within 7 days.', hall: 'event', contact: 'Maria', detail: 'Maria was emotional during this session. OPM detected elevated positive valence. She said: "I almost set it back to 197 the night before launch. I am glad I did not."', tags: ['launch', 'revenue'] },
]

const HALL_COLORS: Record<string, string> = {
  decision: 'rgba(100,180,255,0.5)',
  discovery: 'rgba(160,220,120,0.5)',
  event: 'rgba(232,160,80,0.5)',
  problem: 'rgba(255,120,120,0.5)',
  preference: 'rgba(200,160,255,0.5)',
  pattern: 'rgba(160,220,120,0.5)',
  shift: 'rgba(100,180,255,0.5)',
  contradiction: 'rgba(255,120,120,0.5)',
}

export default function RoomPage() {
  const { avatarSlug, roomSlug } = useParams<{ avatarSlug: string; roomSlug: string }>()
  const avatar = AVATARS.find(a => a.slug === avatarSlug) ?? AVATARS[0]
  const roomName = (roomSlug ?? 'business') as RoomName
  const [activeHall, setActiveHall] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDrawers = MOCK_DRAWERS.filter(d => {
    if (activeHall && d.hall !== activeHall) return false
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase()) && !d.summary.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="grain-overlay" style={{ background: 'var(--night-surface)', color: 'var(--night-text)', minHeight: '100vh' }}>
      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(30,25,45,0.8) 0%, var(--night-surface) 70%)' }} />
      <div className="fixed top-[-5%] left-1/2 -translate-x-1/2 w-1/2 h-[40%] pointer-events-none z-[1]" style={{ background: 'radial-gradient(ellipse, rgba(232,160,80,0.06) 0%, transparent 70%)', animation: 'light-breathe 8s ease-in-out infinite alternate' }} />

      <div className="relative z-[5] max-w-[820px] mx-auto px-8">
        {/* Breadcrumb */}
        <nav className="fixed top-8 left-10 z-20 flex items-center gap-2 text-[0.72rem] tracking-wide px-4 py-2.5 rounded" style={{
          background: 'rgba(10,9,14,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,160,80,0.06)',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          <Link to="/" className="transition-colors hover:text-[var(--gold-accent)]" style={{ color: 'rgba(232,224,208,0.35)' }}>Palace</Link>
          <span style={{ color: 'rgba(232,224,208,0.15)' }}>/</span>
          <Link to={`/wing/${avatar.slug}`} className="transition-colors hover:text-[var(--gold-accent)]" style={{ color: 'rgba(232,224,208,0.35)' }}>{avatar.name}</Link>
          <span style={{ color: 'rgba(232,224,208,0.15)' }}>/</span>
          <span style={{ color: 'rgba(232,160,80,0.6)' }}>{roomName.charAt(0).toUpperCase() + roomName.slice(1)}</span>
        </nav>

        {/* Room header */}
        <section className="pt-28 pb-12 text-center" style={{ animation: 'fade-up 1.2s ease-out 0.2s both' }}>
          <div className="inline-block px-5 py-1 mb-5 text-[0.6rem] tracking-[0.4em] uppercase rounded-sm" style={{
            border: '1px solid rgba(232,160,80,0.12)',
            color: 'rgba(232,160,80,0.4)',
            background: 'rgba(232,160,80,0.02)',
          }}>
            {avatar.name} &middot; Room
          </div>
          <h1 className="font-light tracking-wide mb-2" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
          }}>
            {roomName.charAt(0).toUpperCase() + roomName.slice(1)}
          </h1>
          <p className="font-light italic text-base max-w-[500px] mx-auto leading-relaxed" style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: 'rgba(232,224,208,0.4)',
          }}>
            {ROOM_DESCRIPTIONS[roomName]}
          </p>
          <div className="flex justify-center gap-8 mt-6">
            {[{ n: '23', l: 'memories' }, { n: '4', l: 'contacts' }, { n: '2', l: 'tunnels' }].map(m => (
              <div key={m.l} className="text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: 'rgba(232,224,208,0.25)', fontFamily: "'DM Sans', sans-serif" }}>
                <strong className="text-sm" style={{ color: 'var(--gold-accent)', fontWeight: 400 }}>{m.n}</strong> {m.l}
              </div>
            ))}
          </div>
        </section>

        <div className="w-[40px] h-px mx-auto mb-12" style={{ background: 'rgba(232,160,80,0.15)' }} />

        {/* Search */}
        <div className="mb-8" style={{ animation: 'fade-up 1.3s ease-out 0.4s both' }}>
          <input
            type="text"
            placeholder="Search within this room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 rounded-sm outline-none transition-colors"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1rem', fontWeight: 300, letterSpacing: '0.03em',
              background: 'rgba(232,160,80,0.02)',
              border: '1px solid rgba(232,160,80,0.08)',
              color: 'var(--night-text)',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(232,160,80,0.25)'}
            onBlur={e => e.target.style.borderColor = 'rgba(232,160,80,0.08)'}
          />
        </div>

        {/* Hall filters */}
        <div className="flex gap-2 flex-wrap mb-10" style={{ animation: 'fade-up 1.35s ease-out 0.45s both' }}>
          <button
            onClick={() => setActiveHall(null)}
            className="px-4 py-1.5 rounded-sm text-[0.65rem] tracking-[0.1em] uppercase transition-all duration-300"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${activeHall === null ? 'rgba(232,160,80,0.4)' : 'rgba(232,160,80,0.1)'}`,
              background: activeHall === null ? 'rgba(232,160,80,0.1)' : 'transparent',
              color: activeHall === null ? 'var(--gold-accent)' : 'rgba(232,224,208,0.35)',
            }}
          >
            All
          </button>
          {HALLS.slice(0, 5).map(hall => (
            <button
              key={hall}
              onClick={() => setActiveHall(activeHall === hall ? null : hall)}
              className="px-4 py-1.5 rounded-sm text-[0.65rem] tracking-[0.1em] uppercase transition-all duration-300"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                border: `1px solid ${activeHall === hall ? HALL_COLORS[hall] : 'rgba(232,160,80,0.08)'}`,
                background: activeHall === hall ? `${HALL_COLORS[hall]}15` : 'transparent',
                color: activeHall === hall ? HALL_COLORS[hall] : 'rgba(232,224,208,0.3)',
              }}
            >
              {hall}
            </button>
          ))}
        </div>

        {/* Drawers */}
        <section className="pb-16" style={{ animation: 'fade-up 1.4s ease-out 0.5s both' }}>
          {filteredDrawers.map(drawer => (
            <div key={drawer.id} className="drawer-item"
              onClick={() => setExpandedId(expandedId === drawer.id ? null : drawer.id)}
            >
              <div className="flex justify-between items-start gap-8" style={{ transition: 'padding-left 0.3s ease' }}>
                <div className="text-[0.6rem] tracking-[0.1em] min-w-[90px] pt-1" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>
                  {drawer.date}
                </div>
                <div className="flex-1">
                  <div className="drawer-title" style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.15rem', fontWeight: 400, lineHeight: 1.4,
                    color: 'rgba(232,224,208,0.75)',
                    transition: 'color 0.3s ease',
                    marginBottom: '0.3rem',
                  }}>
                    {drawer.title}
                  </div>
                  <div className="text-sm font-light leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.35)' }}>
                    {drawer.summary}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-[0.58rem] tracking-[0.1em] uppercase px-3 py-1 rounded-sm" style={{
                      fontFamily: "'DM Sans', sans-serif",
                      border: `1px solid ${HALL_COLORS[drawer.hall]}30`,
                      color: HALL_COLORS[drawer.hall],
                      background: `${HALL_COLORS[drawer.hall]}08`,
                    }}>
                      {drawer.hall}
                    </span>
                    {drawer.tags.map(tag => (
                      <span key={tag} className="text-[0.58rem] tracking-[0.1em] uppercase px-3 py-1 rounded-sm" style={{
                        fontFamily: "'DM Sans', sans-serif",
                        border: '1px solid rgba(232,160,80,0.1)',
                        color: 'rgba(232,160,80,0.4)',
                        background: 'rgba(232,160,80,0.02)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Expanded detail */}
                  {expandedId === drawer.id && (
                    <div className="mt-4 p-5 rounded-sm" style={{
                      background: 'rgba(232,160,80,0.02)',
                      border: '1px solid rgba(232,160,80,0.06)',
                    }}>
                      <p className="text-sm font-light leading-loose" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.5)' }}>
                        {drawer.detail}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[0.65rem] whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>
                    {drawer.contact}
                  </span>
                  <span className="drawer-expand" style={{ fontSize: '1rem', color: 'rgba(232,160,80,0.4)', opacity: 0, transition: 'opacity 0.3s ease' }}>
                    {expandedId === drawer.id ? '\u2191' : '\u2193'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredDrawers.length > 0 && <div className="border-b" style={{ borderColor: 'rgba(232,160,80,0.06)' }} />}
        </section>

        {/* Tunnels */}
        <section className="pb-16">
          <p className="text-[0.65rem] tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(232,224,208,0.2)' }}>Tunnels from this room</p>
          {[
            { wing: 'Adri Kastel', room: 'Business', desc: 'Shared pricing patterns across 3 contacts' },
            { wing: 'Juan Schubert', room: 'Business', desc: 'ONIOKO strategy discussions' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b transition-all duration-300 group cursor-pointer hover:pl-2" style={{ borderColor: 'rgba(232,160,80,0.04)' }}>
              <span className="text-sm" style={{ color: 'rgba(232,160,80,0.3)' }}>&#x2194;</span>
              <span className="text-sm group-hover:text-[var(--gold-accent)] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,224,208,0.4)' }}>
                {t.wing} &rarr; {t.room}
              </span>
              <span className="ml-auto text-[0.7rem]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>
                {t.desc}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
