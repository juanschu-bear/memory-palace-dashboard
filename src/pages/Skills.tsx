import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AVATARS, readDiary } from '@/lib/api'

type Skill = { name: string; desc: string; avatar: string; refs: number; since: string; intensity: 'strong' | 'moderate' | 'emerging' }

function Starfield() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement('div')
      dot.style.cssText = `position:absolute;width:${Math.random()*2+0.5}px;height:${Math.random()*2+0.5}px;background:rgba(232,200,150,${Math.random()*0.3+0.05});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%`
      ref.current.appendChild(dot)
    }
  }, [])
  return <div ref={ref} className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40" style={{ animation: 'slow-rotate 300s linear infinite' }} />
}

const INTENSITY_STYLES = {
  strong: { background: '#E8A050', boxShadow: '0 0 8px rgba(232,160,80,0.3)' },
  moderate: { background: 'rgba(232,160,80,0.5)' },
  emerging: { background: 'rgba(232,160,80,0.2)', border: '1px solid rgba(232,160,80,0.3)' },
}

export default function SkillsPage() {
  const [activeAvatar, setActiveAvatar] = useState<string | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    Promise.all(AVATARS.map((a) => readDiary(a.slug, 30).then((d) => ({ avatar: a.name, entries: Array.isArray(d?.entries) ? d.entries : [] })))).then((all) => {
      const map = new Map<string, Skill>()
      all.forEach(({ avatar, entries }) => {
        entries.forEach((e: any) => {
          const text = `${e.topic || ''} ${e.content || ''}`
          const tags = Array.from(text.matchAll(/\bskill\/([\w-]+)/gi)).map((m) => m[1].toLowerCase())
          tags.forEach((t) => {
            const key = `${avatar}:${t}`
            const cur = map.get(key)
            const refs = (cur?.refs || 0) + 1
            map.set(key, {
              name: t.replace(/-/g, ' '),
              desc: 'Extracted from diary reflections and repeated usage patterns.',
              avatar,
              refs,
              since: e.date || (e.timestamp ? new Date(e.timestamp).toLocaleDateString() : '—'),
              intensity: refs >= 3 ? 'strong' : refs >= 2 ? 'moderate' : 'emerging',
            })
          })
        })
      })
      setSkills(Array.from(map.values()))
    }).catch(() => setSkills([]))
  }, [])

  const filtered = useMemo(() => activeAvatar ? skills.filter((s) => s.avatar === activeAvatar) : skills, [skills, activeAvatar])

  return (
    <div style={{ background: '#06060A', color: 'var(--night-text)', minHeight: '100vh' }}>
      <nav className="fixed top-8 left-10 z-20 flex items-center gap-2 text-[0.72rem] tracking-wide px-4 py-2 rounded" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'rgba(6,6,10,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(232,160,80,0.06)' }}>
        <Link to="/" className="hover:text-[var(--gold-accent)] transition-colors" style={{ color: 'rgba(232,224,208,0.35)' }}>Palace</Link>
        <span style={{ color: 'rgba(232,224,208,0.15)' }}>/</span><span style={{ color: 'rgba(232,160,80,0.6)' }}>Skills</span>
      </nav>

      <section className="text-center pt-32 pb-8 px-8" style={{ animation: 'fade-up 1.2s ease-out 0.2s both' }}>
        <h1 className="font-light tracking-wide mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)' }}>Skills</h1>
        <p className="font-light italic text-base max-w-[500px] mx-auto" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,224,208,0.4)' }}>What each avatar has learned through conversation.</p>
      </section>

      <div className="flex justify-center gap-3 flex-wrap px-8 mb-10" style={{ animation: 'fade-up 1.3s ease-out 0.4s both' }}>
        <button onClick={() => setActiveAvatar(null)} className="px-5 py-2 rounded-full text-[0.68rem] tracking-[0.1em] transition-all duration-300" style={{ fontFamily: "'DM Sans', sans-serif", border: `1px solid ${activeAvatar === null ? 'rgba(232,160,80,0.4)' : 'rgba(232,160,80,0.12)'}`, background: activeAvatar === null ? 'rgba(232,160,80,0.1)' : 'transparent', color: activeAvatar === null ? 'var(--gold-accent)' : 'rgba(232,224,208,0.4)' }}>All avatars</button>
        {AVATARS.map((a) => <button key={a.slug} onClick={() => setActiveAvatar(activeAvatar === a.name ? null : a.name)} className="px-5 py-2 rounded-full text-[0.68rem] tracking-[0.1em] transition-all duration-300" style={{ fontFamily: "'DM Sans', sans-serif", border: `1px solid ${activeAvatar === a.name ? 'rgba(232,160,80,0.4)' : 'rgba(232,160,80,0.12)'}`, background: activeAvatar === a.name ? 'rgba(232,160,80,0.1)' : 'transparent', color: activeAvatar === a.name ? 'var(--gold-accent)' : 'rgba(232,224,208,0.4)' }}>{a.name}</button>)}
      </div>

      <div className="flex justify-center px-8 py-8 relative" style={{ animation: 'fade-up 1.4s ease-out 0.5s both' }}><Starfield /></div>

      <section className="max-w-[700px] mx-auto px-8 pt-12 pb-20" style={{ animation: 'fade-up 1.6s ease-out 0.8s both' }}>
        <p className="text-center text-[0.7rem] tracking-[0.4em] uppercase mb-8" style={{ color: 'rgba(232,224,208,0.2)' }}>Skill inventory</p>
        {filtered.map((skill) => (
          <div key={`${skill.avatar}:${skill.name}`} className="grid grid-cols-[auto_1fr_auto] gap-6 items-start py-7 border-t transition-all duration-300 hover:pl-2 hover:bg-[rgba(232,160,80,0.01)]" style={{ borderColor: 'rgba(232,160,80,0.05)' }}>
            <div className="w-2.5 h-2.5 rounded-full mt-2 shrink-0" style={INTENSITY_STYLES[skill.intensity]} />
            <div><div className="text-lg font-normal" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,224,208,0.75)' }}>{skill.name}</div><div className="text-sm font-light leading-relaxed mt-1" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.35)' }}>{skill.desc}</div><div className="text-[0.6rem] mt-2" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,160,80,0.4)', letterSpacing: '0.06em' }}>{skill.avatar}</div></div>
            <div className="text-right shrink-0"><div className="text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold-accent)' }}>{skill.refs > 0 ? skill.refs : '—'}</div><div className="text-[0.55rem] tracking-[0.12em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>{skill.refs > 0 ? (skill.refs === 1 ? 'Reference' : 'References') : 'Emerging'}</div><div className="text-[0.6rem] mt-2" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>{skill.refs > 0 ? `Since ${skill.since}` : skill.since}</div></div>
          </div>
        ))}
      </section>
    </div>
  )
}
