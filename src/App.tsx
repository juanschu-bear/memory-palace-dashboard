import { useEffect, useMemo, useState } from "react";

type View = "entrance" | "wing" | "room" | "diary" | "tunnels" | "contacts" | "skills";
type StatusResponse = { total_drawers: number; wings: Record<string, number>; rooms: Record<string, number> };
type DiaryEntry = { date: string; timestamp: string; topic: string; content: string };
type Contact = { id: string; name: string; sessions: number; last: string };

const API = {
  mempalace: "https://mempalace.onioko.com",
  memos: "https://memos-local.onioko.com",
  supabase: "https://wofklmwbokdjoqlstjmy.supabase.co/rest/v1",
};

const wingsFallback = ["trace-flores", "juan-schubert", "adri-kastel", "prof-brian-cox", "clara-fontaine", "elena-navarro"];

export default function App() {
  const [view, setView] = useState<View>("entrance");
  const [selectedWing, setSelectedWing] = useState("trace-flores");
  const [selectedRoom, setSelectedRoom] = useState("general");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [roomSearch, setRoomSearch] = useState("pricing");
  const [roomResults, setRoomResults] = useState<any[]>([]);
  const [memosSearch, setMemosSearch] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const wings = useMemo(() => (!status ? wingsFallback : Object.keys(status.wings).map((w) => w.replace(/^wing_/, "")).sort()), [status]);

  useEffect(() => {
    fetch(`${API.mempalace}/status`).then((r) => r.json()).then(setStatus).catch(() => null);
  }, []);

  useEffect(() => {
    fetch(`${API.mempalace}/diary/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: selectedWing, last_n: 8 }),
    }).then((r) => r.json()).then((d) => setDiary(d.entries ?? [])).catch(() => setDiary([]));
  }, [selectedWing]);

  useEffect(() => {
    fetch(`${API.mempalace}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: roomSearch, wing: selectedWing, room: selectedRoom }),
    }).then((r) => r.json()).then((d) => setRoomResults(d.results ?? [])).catch(() => setRoomResults([]));

    fetch(`${API.memos}/product/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "anima-cf-test", query: roomSearch }),
    }).then((r) => r.json()).then(setMemosSearch).catch(() => setMemosSearch(null));
  }, [roomSearch, selectedWing, selectedRoom]);

  useEffect(() => {
    const anon = "<SECRET>";
    fetch(`${API.supabase}/wa_contacts?select=id,name,updated_at&order=updated_at.desc&limit=20`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    })
      .then((r) => r.json())
      .then((rows) => setContacts((rows || []).map((c: any) => ({ id: c.id, name: c.name || c.id, sessions: 0, last: c.updated_at || "" }))))
      .catch(() => setContacts([]));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-black" />
      <div className="relative z-10 mx-auto max-w-7xl p-6">
        <h1 className="text-3xl font-semibold tracking-wide text-amber-100">Memory Palace Dashboard</h1>
        <p className="mt-1 text-sm text-amber-300/80">Walk the palace. Enter wings. Open rooms. Read diaries.</p>

        <nav className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-7">
          {(["entrance", "wing", "room", "diary", "tunnels", "contacts", "skills"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-md border px-3 py-2 text-sm capitalize transition ${view === v ? "border-amber-300 bg-amber-950/60" : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800"}`}>
              {v}
            </button>
          ))}
        </nav>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-black/40 p-5 shadow-2xl backdrop-blur">
          {view === "entrance" && (
            <section>
              <h2 className="text-xl text-amber-100">Palace Entrance</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <Card label="Wings" value={wings.length} />
                <Card label="Total Memories" value={status?.total_drawers ?? "..."} />
                <Card label="Diary Entries" value={diary.length} />
                <Card label="Recent Activity" value={roomResults.length} />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {wings.map((w) => (
                  <button key={w} onClick={() => { setSelectedWing(w); setView("wing"); }} className="rounded-lg border border-amber-800/40 bg-zinc-900 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-500">
                    <div className="text-base font-medium text-amber-100">{w}</div>
                    <div className="mt-1 text-xs text-zinc-400">Enter corridor</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "wing" && (
            <section>
              <h2 className="text-xl text-amber-100">Wing View: {selectedWing}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(status?.rooms ?? { general: 1 }).map((r) => (
                  <button key={r} onClick={() => { setSelectedRoom(r); setView("room"); }} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:border-amber-500">{r}</button>
                ))}
              </div>
            </section>
          )}

          {view === "room" && (
            <section>
              <h2 className="text-xl text-amber-100">Room View: {selectedWing} / {selectedRoom}</h2>
              <input value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} className="mt-4 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Box title="MemPalace Drawers" data={roomResults} />
                <Box title="MemOS Local" data={memosSearch} />
              </div>
            </section>
          )}

          {view === "diary" && <Journal diary={diary} selectedWing={selectedWing} />}
          {view === "tunnels" && <Tunnels wings={wings} />}
          {view === "contacts" && <Contacts contacts={contacts} />}
          {view === "skills" && <Skills />}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"><div className="text-xs uppercase tracking-widest text-zinc-400">{label}</div><div className="mt-2 text-2xl font-semibold text-amber-100">{value}</div></div>;
}

function Box({ title, data }: { title: string; data: any }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"><h3 className="text-sm text-amber-300">{title}</h3><pre className="mt-2 max-h-72 overflow-auto text-xs text-zinc-300">{JSON.stringify(data, null, 2)}</pre></div>;
}

function Journal({ diary, selectedWing }: { diary: DiaryEntry[]; selectedWing: string }) {
  return <section><h2 className="text-xl text-amber-100">Diary View: {selectedWing}</h2><div className="mt-4 space-y-3">{diary.map((d, i) => <article key={i} className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4"><div className="text-xs text-amber-300">{d.date} · {d.topic}</div><p className="mt-2 text-sm leading-relaxed text-zinc-200">{d.content}</p></article>)}</div></section>;
}

function Tunnels({ wings }: { wings: string[] }) {
  return <section><h2 className="text-xl text-amber-100">Tunnels View</h2><div className="mt-4 grid gap-2 md:grid-cols-3">{wings.map((w, i) => <div key={w} className="rounded border border-zinc-700 bg-zinc-900/60 p-3 text-sm">{w} → {wings[(i + 1) % wings.length]}</div>)}</div></section>;
}

function Contacts({ contacts }: { contacts: Contact[] }) {
  return <section><h2 className="text-xl text-amber-100">Contacts View</h2><div className="mt-4 grid gap-2">{contacts.map((c) => <div key={c.id} className="rounded border border-zinc-700 bg-zinc-900/60 p-3 text-sm"><div className="font-medium">{c.name}</div><div className="text-xs text-zinc-400">{c.id} · last {c.last}</div></div>)}</div></section>;
}

function Skills() {
  return <section><h2 className="text-xl text-amber-100">Skills View</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{["pattern-recognition", "direct-questioning", "pricing-confidence"].map((s) => <div key={s} className="rounded-lg border border-amber-800/40 bg-zinc-900/70 p-4"><div className="text-sm text-amber-300">skill/{s}</div><div className="mt-1 text-xs text-zinc-400">trajectory rising</div></div>)}</div></section>;
}
