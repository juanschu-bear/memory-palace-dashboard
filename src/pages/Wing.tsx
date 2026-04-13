import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AVATARS, ROOMS, ROOM_DESCRIPTIONS } from '@/lib/api'

function DustParticles() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    for (let i = 0; i < 25; i++) {
      const dust = document.createElement('div')
      dust.style.cssText = `position:fixed;width:2px;height:2px;background:rgba(232,200,150,0.4);border-radius:50%;pointer-events:none;z-index:1;left:${20+Math.random()*60}%;top:${15+Math.random()*55}%;animation:dust-drift ${5+Math.random()*8}s linear ${Math.random()*10}s infinite`
      ref.current.appendChild(dust)
    }
  }, [])
  return <div ref={ref} />
}

const ROOM_PEEKS: Record<string, string> = {
  'business': '"Pricing fear is always about self-worth, never about the number."',
  'personal': '"She talked about her son for the first time today."',
  'growth': '"First time she set a boundary with a client."',
  'challenges': '"Imposter syndrome hit hard when she got the big client."',
  'wins': '"12 signups in one week. She cried."',
  'behavioral': '"Voice tremor spikes when discussing revenue."',
  'avatar-diary': '"I learned to ask the self-worth question before the pricing question."',
}

export default function WingPage() {
  const { avatarSlug } = useParams<{ avatarSlug: string }>()
  const avatar = AVATARS.find(a => a.slug === avatarSlug) ?? AVATARS[0]

  return (
    <div style={{ background: 'var(--night)', color: 'var(--night-text)', minHeight: '100vh' }}>
      {/* Fixed corridor background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[-20%] w-[140%] h-[35%]" style={{ background: 'linear-gradient(0deg, #18142A 0%, #0A0810 100%)', transform: 'perspective(800px) rotateX(-35deg)', transformOrigin: 'top center' }} />
        <div className="absolute bottom-0 left-[-20%] w-[140%] h-[50%]" style={{ background: 'linear-gradient(180deg, #15121E 0%, #0D0B14 100%)', transform: 'perspective(800px) rotateX(45deg)', transformOrigin: 'bottom center' }} />
        <div className="absolute top-0 left-0 w-[30%] h-full" style={{ background: 'linear-gradient(90deg, #0C0A12 0%, #14111E 60%, transparent 100%)' }} />
        <div className="absolute top-0 right-0 w-[30%] h-full" style={{ background: 'linear-gradient(-90deg, #0C0A12 0%, #14111E 60%, transparent 100%)' }} />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[200px]" style={{ background: 'radial-gradient(ellipse, rgba(232,160,80,0.1) 0%, transparent 70%)', animation: 'deep-pulse 6s ease-in-out infinite alternate' }} />
      </div>

      {/* Light rays */}
      {[{ left: '30%', rot: -5 }, { left: '45%', rot: -1, h: '45%', o: 0.3 }, { left: '55%', rot: 1, h: '48%', o: 0.4 }, { left: '70%', rot: 5 }].map((r, i) => (
        <div key={i} className="fixed top-0 w-[2px] pointer-events-none z-[1]" style={{
          left: r.left, height: r.h ?? '55%', opacity: r.o ?? 0.5,
          background: 'linear-gradient(180deg, rgba(232,160,80,0.06) 0%, transparent 100%)',
          transformOrigin: 'top center', transform: `rotate(${r.rot}deg)`,
        }} />
      ))}

      {/* Torches */}
      {[{ left: '10%', top: '28%' }, { left: '15%', top: '50%' }, { right: '10%', top: '28%' }, { right: '15%', top: '50%' }].map((pos, i) => (
        <div key={i} className="fixed w-[6px] h-[16px] rounded-t-full z-[1] pointer-events-none" style={{
          ...pos,
          background: 'linear-gradient(180deg, #F0C060 0%, #E8A050 50%, #8B5A3A 100%)',
        }}>
          <div className="absolute -top-[30px] -left-[40px] w-[86px] h-[70px]" style={{
            background: 'radial-gradient(ellipse, rgba(232,160,80,0.15) 0%, rgba(232,160,80,0.05) 40%, transparent 70%)',
            animation: 'torch-flicker 3s ease-in-out infinite alternate',
          }} />
        </div>
      ))}

      <DustParticles />

      {/* Content */}
      <div className="relative z-[5]">
        {/* Back button */}
        <Link to="/" className="back-btn fixed top-8 left-10 z-20">
          <span className="arrow text-lg">&larr;</span> Palace Entrance
        </Link>

        {/* Wing header */}
        <section className="pt-28 pb-12 text-center" style={{ animation: 'fade-down 1.5s ease-out 0.3s both' }}>
          <div className="inline-block px-6 py-1.5 mb-6 text-[0.65rem] tracking-[0.5em] uppercase rounded-sm" style={{
            border: '1px solid rgba(232,160,80,0.15)',
            color: 'rgba(232,160,80,0.5)',
            background: 'rgba(232,160,80,0.03)',
          }}>
            You are inside Wing {avatar.wingNumber}
          </div>
          <h1 className="font-light tracking-wide mb-2" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            textShadow: '0 2px 40px rgba(0,0,0,0.6)',
          }}>
            {avatar.name}
          </h1>
          <p className="font-light italic text-lg" style={{ color: 'rgba(232,224,208,0.4)', fontFamily: "'Cormorant Garamond', serif" }}>
            {avatar.role}
          </p>
          <div className="flex gap-10 justify-center mt-5 flex-wrap">
            {[{ n: '49', l: 'Memories' }, { n: '7', l: 'Rooms' }, { n: '3', l: 'Skills learned' }, { n: '12', l: 'Sessions' }].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-2xl" style={{ color: 'var(--gold-accent)', fontFamily: "'Cormorant Garamond', serif" }}>{s.n}</div>
                <div className="text-[0.6rem] tracking-[0.2em] uppercase mt-1" style={{ color: 'rgba(232,224,208,0.3)', fontFamily: "'DM Sans', sans-serif" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="w-[60px] h-px mx-auto" style={{ background: 'rgba(232,160,80,0.2)' }} />

        {/* Rooms */}
        <section className="px-8 md:px-16 py-12" style={{ animation: 'fade-up 1.6s ease-out 0.6s both' }}>
          <p className="text-center text-[0.7rem] tracking-[0.5em] uppercase mb-12" style={{ color: 'rgba(232,224,208,0.25)' }}>
            Open a Room
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-[1000px] mx-auto pb-4">
            {ROOMS.map(room => {
              const isDiary = room === 'avatar-diary'
              const to = isDiary ? `/wing/${avatar.slug}/diary` : `/wing/${avatar.slug}/room/${room}`
              return (
                <Link key={room} to={to} className={`room-door ${isDiary ? 'diary-door' : ''}`}>
                  <div className="door-frame" style={{
                    width: '100%',
                    aspectRatio: '0.55',
                    borderRadius: '50% 50% 0 0 / 25% 25% 0 0',
                    border: `1px solid rgba(232,160,80,${isDiary ? 0.18 : 0.1})`,
                    background: isDiary
                      ? 'linear-gradient(180deg, rgba(30,22,15,0.95) 0%, rgba(20,15,10,0.98) 50%, rgba(12,9,6,1) 100%)'
                      : 'linear-gradient(180deg, rgba(20,17,30,0.95) 0%, rgba(15,12,22,0.98) 50%, rgba(10,8,15,1) 100%)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    position: 'relative' as const,
                    overflow: 'hidden' as const,
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}>
                    <div className="absolute" style={{
                      inset: '10%',
                      borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
                      background: `radial-gradient(ellipse at 50% 30%, rgba(232,160,80,${isDiary ? 0.07 : 0.04}) 0%, transparent 60%)`,
                    }} />
                    <div className="absolute rounded-sm" style={{
                      right: '20%', top: '55%', width: '4px', height: '18px',
                      background: `rgba(232,160,80,${isDiary ? 0.5 : 0.3})`,
                    }} />
                    <div className="door-glow absolute" style={{
                      bottom: '-5px', left: '10%', width: '80%', height: '25px',
                      background: 'radial-gradient(ellipse at 50% 100%, rgba(232,160,80,0.2) 0%, transparent 70%)',
                      opacity: isDiary ? 0.5 : 0.3,
                      transition: 'opacity 0.5s ease',
                    }} />
                    <div className="door-peek absolute pointer-events-none" style={{
                      bottom: '12%', left: '10%', right: '10%',
                      opacity: 0, transform: 'translateY(8px)',
                      transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    }}>
                      <p className="italic leading-relaxed" style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '0.72rem',
                        color: 'rgba(232,224,208,0.45)',
                      }}>
                        {ROOM_PEEKS[room] ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-center mt-4 pb-2">
                    <div className="door-name" style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1rem', fontWeight: 400, letterSpacing: '0.05em',
                      color: isDiary ? 'rgba(232,160,80,0.6)' : 'rgba(232,224,208,0.65)',
                      transition: 'color 0.4s ease',
                    }}>
                      {room === 'avatar-diary' ? 'Avatar Diary' : room.charAt(0).toUpperCase() + room.slice(1)}
                    </div>
                    <div className="door-count" style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const,
                      color: 'rgba(232,160,80,0.4)',
                      marginTop: '0.25rem', opacity: 0, transition: 'opacity 0.4s ease',
                    }}>
                      {room === 'avatar-diary' ? '2 entries' : `${Math.floor(Math.random() * 20 + 3)} memories`}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Diary preview */}
        <section className="py-16 text-center" style={{ animation: 'fade-up 1.8s ease-out 1s both' }}>
          <div className="w-[40px] h-px mx-auto mb-8" style={{ background: 'rgba(232,160,80,0.15)' }} />
          <p className="text-[0.65rem] tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(232,160,80,0.3)' }}>
            {avatar.name}'s latest reflection
          </p>
          <p className="italic font-light text-lg max-w-[560px] mx-auto leading-relaxed px-4" style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: 'rgba(232,224,208,0.45)',
          }}>
            "When someone switches topics fast, they are avoiding something. I now skip the surface and go straight to what they are protecting."
          </p>
          <p className="text-[0.7rem] mt-4 tracking-wide" style={{ color: 'rgba(232,224,208,0.2)' }}>April 13, 2026</p>
          <Link to={`/wing/${avatar.slug}/diary`} className="diary-link mt-6">
            Read full diary
          </Link>
        </section>
      </div>
    </div>
  )
}
