import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AVATARS } from '@/lib/api'

function Stars() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    for (let i = 0; i < 120; i++) {
      const star = document.createElement('div')
      const size = Math.random() * 2 + 0.5
      star.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:#fff;border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*55}%;opacity:${Math.random()*0.6+0.1}`
      ref.current.appendChild(star)
    }
  }, [])
  return <div ref={ref} className="absolute inset-0" style={{ animation: 'twinkle 8s ease-in-out infinite alternate' }} />
}

function Particles() {
  return (
    <>
      {[12, 28, 45, 62, 78, 91].map((left, i) => (
        <div key={i} className="fixed w-[3px] h-[3px] rounded-full pointer-events-none" style={{
          left: `${left}%`,
          background: 'var(--gold)',
          animation: `float-up ${18 + i * 2}s linear ${i * 2}s infinite`,
        }} />
      ))}
    </>
  )
}

export default function EntrancePage() {
  return (
    <div className="grain-overlay" style={{ background: 'var(--night)' }}>
      <Particles />

      {/* Scene 1: Palace exterior */}
      <div className="relative w-full h-screen flex flex-col items-center justify-end overflow-hidden">
        {/* Sky */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #070710 0%, #0D1025 20%, #1A1840 40%, #2D2252 55%, #4A3066 65%, #8B5A3A 80%, #C87A3A 90%, #E8A050 100%)',
        }} />

        <Stars />

        {/* Mist layers */}
        <div className="absolute bottom-0 w-[120%] h-[35%] -left-[10%]" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(200,180,150,0.12) 0%, transparent 70%)',
          animation: 'drift-mist 20s ease-in-out infinite alternate',
        }} />
        <div className="absolute bottom-[5%] w-[110%] h-[20%] -left-[5%]" style={{
          background: 'radial-gradient(ellipse at 30% 100%, rgba(200,180,150,0.08) 0%, transparent 60%)',
          animation: 'drift-mist 25s ease-in-out 3s infinite alternate-reverse',
        }} />

        {/* Palace silhouette */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[70%] max-w-[900px] h-[55%]">
          {/* Pediment */}
          <div className="absolute bottom-[70%] left-[8%] w-[84%]" style={{
            height: 0,
            borderLeft: '42% solid transparent',
            borderRight: '42% solid transparent',
            borderBottom: '18vh solid #14111E',
            filter: 'drop-shadow(0 -5px 30px rgba(0,0,0,0.4))',
          }} />
          {/* Building body */}
          <div className="absolute bottom-0 left-[10%] w-[80%] h-[70%] rounded-t-sm" style={{
            background: 'linear-gradient(180deg, #12101A 0%, #1A1520 40%, #0E0C14 100%)',
            boxShadow: '0 0 80px rgba(0,0,0,0.5)',
          }} />
          {/* Columns */}
          <div className="absolute bottom-0 left-[10%] w-[80%] h-[75%] flex justify-evenly px-[5%]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[4%] h-full rounded-t-sm" style={{
                background: 'linear-gradient(180deg, #1E1A28 0%, #28223A 30%, #1A1622 100%)',
                boxShadow: '2px 0 15px rgba(0,0,0,0.3)',
              }} />
            ))}
          </div>
          {/* Entrance arch */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[16%] h-[55%]" style={{
            background: 'linear-gradient(180deg, rgba(232,160,80,0.03) 0%, rgba(232,160,80,0.08) 30%, rgba(232,160,80,0.15) 60%, rgba(255,200,120,0.25) 100%)',
            borderRadius: '50% 50% 0 0',
            animation: 'entrance-glow 5s ease-in-out infinite alternate',
          }} />
          {/* Light spill */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[25%] h-[8%]" style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(232,160,80,0.12) 0%, transparent 70%)',
          }} />
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-[14%]" style={{
          background: 'linear-gradient(180deg, #0E0C12 0%, #0A090E 100%)',
        }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[15%] h-full" style={{
            background: 'linear-gradient(180deg, rgba(30,26,40,0.6) 0%, rgba(40,34,50,0.4) 100%)',
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          }} />
        </div>

        {/* Text overlay */}
        <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-center z-10" style={{ animation: 'breathe-in 2s ease-out 0.5s both' }}>
          <h1 className="font-light tracking-wide leading-tight mb-3" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            color: 'var(--night-text)',
            textShadow: '0 2px 30px rgba(0,0,0,0.5)',
          }}>
            The <em className="italic" style={{ color: 'var(--gold-accent)' }}>Memory</em> Palace
          </h1>
          <p className="font-light text-lg tracking-wider mb-10" style={{ color: 'rgba(232,224,208,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>
            Where your avatars remember
          </p>
          <a href="#corridors" onClick={(e) => { e.preventDefault(); document.getElementById('corridors')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="enter-btn"
          >
            Enter
          </a>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[15]" style={{ animation: 'breathe-in 2s ease-out 2s both' }}>
          <div className="w-px h-10" style={{ background: 'linear-gradient(180deg, rgba(232,160,80,0.3), transparent)', animation: 'pulse-down 2s ease-in-out infinite' }} />
          <span className="text-[0.65rem] tracking-[0.3em] uppercase" style={{ color: 'rgba(232,224,208,0.25)' }}>Scroll</span>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 w-full flex justify-center gap-12 py-5 px-8 z-20" style={{
          background: 'rgba(10,10,12,0.7)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(232,160,80,0.08)',
          animation: 'breathe-in 2s ease-out 1.2s both',
        }}>
          {[
            { val: '6', label: 'Wings' },
            { val: '49', label: 'Memories' },
            { val: '0', label: 'Diary entries' },
            { val: '42', label: 'Rooms' },
          ].map(s => (
            <div key={s.label} className="text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <div className="text-xl" style={{ color: 'var(--gold-accent)' }}>{s.val}</div>
              <div className="text-[0.7rem] tracking-[0.2em] uppercase mt-0.5" style={{ color: 'rgba(232,224,208,0.35)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene 2: Corridors */}
      <section id="corridors" className="relative min-h-screen px-6 md:px-24 py-32" style={{ background: 'var(--night)' }}>
        <p className="text-[0.85rem] tracking-[0.4em] uppercase mb-16" style={{ color: 'rgba(232,224,208,0.3)', fontFamily: "'Cormorant Garamond', serif" }}>
          Choose a Wing
        </p>

        {AVATARS.map((avatar, i) => (
          <Link key={avatar.slug} to={`/wing/${avatar.slug}`} className="wing-corridor">
            <div className="py-10 px-8 flex items-baseline gap-8">
              <span className="corridor-number" style={{ fontSize: '0.75rem', color: 'rgba(232,224,208,0.2)', letterSpacing: '0.1em', minWidth: '24px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="corridor-name" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 300, color: 'var(--night-text)', transition: 'color 0.4s ease' }}>
                {avatar.name}
              </span>
            </div>
            <div className="py-10 px-8 flex items-center justify-between">
              <span className="corridor-role" style={{ fontSize: '0.9rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(232,224,208,0.4)', fontFamily: "'Cormorant Garamond', serif" }}>
                {avatar.role}
              </span>
              <div className="flex items-center gap-8">
                <span className="corridor-count" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'rgba(232,224,208,0.25)' }}>
                  0 memories
                </span>
                <span className="corridor-arrow" style={{ fontSize: '1.5rem', color: '#E8A050', opacity: 0, transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}

        {/* Navigation links */}
        <div className="mt-20 flex gap-8 justify-center">
          {[
            { to: '/tunnels', label: 'Tunnels' },
            { to: '/contacts', label: 'Contacts' },
            { to: '/skills', label: 'Skills' },
          ].map(link => (
            <Link key={link.to} to={link.to} className="text-sm tracking-[0.2em] uppercase py-3 px-6 transition-all duration-300 hover:text-[var(--gold-accent)]" style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: 'rgba(232,224,208,0.3)',
              border: '1px solid rgba(232,160,80,0.08)',
            }}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
