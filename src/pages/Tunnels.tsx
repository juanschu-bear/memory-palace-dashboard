import { Link } from 'react-router-dom'

export default function TunnelsPage() {
  return (
    <div style={{ background: 'var(--night)', color: 'var(--night-text)', minHeight: '100vh' }}>
      <nav className="fixed top-8 left-10 z-20 flex items-center gap-2 text-[0.72rem] tracking-wide px-4 py-2 rounded" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'rgba(8,8,11,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(232,160,80,0.06)' }}>
        <Link to="/" className="hover:text-[var(--gold-accent)] transition-colors" style={{ color: 'rgba(232,224,208,0.35)' }}>Palace</Link>
        <span style={{ color: 'rgba(232,224,208,0.15)' }}>/</span>
        <span style={{ color: 'rgba(232,160,80,0.6)' }}>Tunnels</span>
      </nav>

      <section className="text-center pt-32 pb-8 px-8" style={{ animation: 'fade-up 1.2s ease-out 0.2s both' }}>
        <h1 className="font-light tracking-wide mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)' }}>Tunnels</h1>
        <p className="font-light italic text-base max-w-[480px] mx-auto" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,224,208,0.4)' }}>
          Hidden corridors connecting wings. When two avatars encounter the same theme, a tunnel forms between them.
        </p>
      </section>

      {/* SVG Network */}
      <div className="flex justify-center px-8 py-12" style={{ animation: 'fade-up 1.4s ease-out 0.5s both' }}>
        <svg viewBox="0 0 700 500" className="w-full max-w-[800px]">
          <line x1="200" y1="180" x2="500" y2="160" stroke="#E8A050" strokeWidth="2" strokeOpacity="0.3" />
          <line x1="200" y1="180" x2="500" y2="160" stroke="#E8A050" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 26" style={{ animation: 'pulse-along 3s linear infinite' }} />
          <line x1="200" y1="180" x2="350" y2="80" stroke="#E8A050" strokeWidth="1.5" strokeOpacity="0.15" />
          <line x1="200" y1="180" x2="150" y2="350" stroke="#E8A050" strokeWidth="1" strokeOpacity="0.08" />
          <line x1="500" y1="160" x2="350" y2="80" stroke="#E8A050" strokeWidth="1" strokeOpacity="0.1" />
          <line x1="550" y1="340" x2="350" y2="400" stroke="#E8A050" strokeWidth="1" strokeOpacity="0.06" />

          {[
            { x: 200, y: 180, r: 38, o: 0.08, so: 0.4, name: 'Trace', mem: '49 memories' },
            { x: 350, y: 80, r: 30, o: 0.05, so: 0.25, name: 'Juan', mem: '0 memories' },
            { x: 500, y: 160, r: 32, o: 0.06, so: 0.3, name: 'Adri', mem: '0 memories' },
            { x: 550, y: 340, r: 28, o: 0.04, so: 0.2, name: 'Brian', mem: '0 memories' },
            { x: 150, y: 350, r: 28, o: 0.04, so: 0.2, name: 'Clara', mem: '0 memories' },
            { x: 350, y: 400, r: 26, o: 0.03, so: 0.15, name: 'Elena', mem: '0 memories' },
          ].map(n => (
            <g key={n.name} className="cursor-pointer" style={{ transition: 'all 0.4s ease' }}>
              <circle cx={n.x} cy={n.y} r={n.r} fill="#E8A050" fillOpacity={n.o} stroke="#E8A050" strokeOpacity={n.so} strokeWidth={n.r > 30 ? 1 : 0.6} />
              <text x={n.x} y={n.y - 4} textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="13" fill="#E8E0D0" fillOpacity="0.7">{n.name}</text>
              <text x={n.x} y={n.y + 12} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="rgba(232,224,208,0.3)">{n.mem}</text>
            </g>
          ))}

          <text fontFamily="'DM Sans', sans-serif" fontSize="9" fill="rgba(232,160,80,0.35)" textAnchor="middle" x="350" y="158">pricing</text>
          <text fontFamily="'DM Sans', sans-serif" fontSize="9" fill="rgba(232,160,80,0.2)" textAnchor="middle" x="268" y="118">strategy</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-8 pb-12 flex-wrap">
        {[{ label: 'Strong connection', opacity: 0.5 }, { label: 'Moderate', opacity: 0.25 }, { label: 'Emerging', opacity: 0.1 }].map(l => (
          <div key={l.label} className="flex items-center gap-2 text-[0.65rem]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.3)' }}>
            <div className="w-6 h-0.5 rounded" style={{ background: `rgba(232,160,80,${l.opacity})` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Tunnel list */}
      <section className="max-w-[700px] mx-auto px-8 pb-20" style={{ animation: 'fade-up 1.6s ease-out 0.8s both' }}>
        <p className="text-center text-[0.7rem] tracking-[0.4em] uppercase mb-8" style={{ color: 'rgba(232,224,208,0.2)' }}>Active tunnels</p>
        {[
          { a: 'Trace Flores', b: 'Adri Kastel', room: 'Business / Pricing', strength: '3 shared patterns' },
          { a: 'Trace Flores', b: 'Juan Schubert', room: 'Business / Strategy', strength: '1 shared pattern' },
          { a: 'Trace Flores', b: 'Clara Fontaine', room: 'Challenges / Communication', strength: 'Emerging' },
        ].map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-6 py-6 border-t cursor-pointer transition-all duration-300 hover:bg-[rgba(232,160,80,0.015)] hover:px-3" style={{ borderColor: 'rgba(232,160,80,0.05)' }}>
            <span className="text-sm" style={{ color: 'rgba(232,224,208,0.5)', fontFamily: "'Cormorant Garamond', serif" }}>{t.a}</span>
            <div className="flex items-center gap-1">
              <div className="w-[30px] h-px" style={{ background: 'rgba(232,160,80,0.2)' }} />
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'rgba(232,160,80,0.4)' }} />
              <div className="w-[30px] h-px" style={{ background: 'rgba(232,160,80,0.2)' }} />
            </div>
            <span className="text-sm" style={{ color: 'rgba(232,224,208,0.5)', fontFamily: "'Cormorant Garamond', serif" }}>{t.b}</span>
            <div className="text-right">
              <div className="text-sm" style={{ color: 'rgba(232,224,208,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>{t.room}</div>
              <div className="text-[0.6rem]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(232,224,208,0.2)' }}>{t.strength}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
