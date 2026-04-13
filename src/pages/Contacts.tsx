import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchContacts, fetchOwners, fetchConversations } from "@/lib/api";

const HTML = `<!-- Global Navigation -->
<nav style="position:fixed;top:0;left:0;width:100%;z-index:50;display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:1rem 2rem;background:rgba(10,10,12,0.75);backdrop-filter:blur(12px);border-bottom:1px solid rgba(232,160,80,0.06)">
  <a href="/" style="font-family:'Cormorant Garamond',serif;font-size:0.85rem;letter-spacing:0.12em;color:rgba(232,160,80,0.6);text-decoration:none;margin-right:1.5rem;padding-right:1.5rem;border-right:1px solid rgba(232,160,80,0.1)">Memory Palace</a>
  <a href="/" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Entrance</a>
  <a href="/wing/trace-flores" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Wings</a>
  <a href="/wing/trace-flores/room/business" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Rooms</a>
  <a href="/wing/trace-flores/diary" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Diary</a>
  <a href="/tunnels" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Tunnels</a>
  <a href="/contacts" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Contacts</a>
  <a href="/skills" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Skills</a>
</nav>


<nav class="breadcrumb">
  <a>Palace</a>
  <span class="sep">/</span>
  <span class="current">Contacts</span>
</nav>

<div class="page-container">

  <section class="page-header">
    <h1>Contacts</h1>
    <p class="subtitle">Everyone who has stepped inside the palace.</p>
    <p class="meta"><span class="contacts-live-count">0</span> contacts &middot; <span class="sessions-live-count">0</span> total sessions &middot; 49 memories stored</p>
  </section>

  <div class="divider"></div>

  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search contacts...">
  </div>

  <section class="contacts-list">

    <div class="contact-card">
      <div class="contact-initial">M</div>
      <div class="contact-info">
        <div class="contact-name">Maria</div>
        <div class="contact-detail">Online course creator transitioning from in-person coaching. Core themes: pricing, self-worth, product launch.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">8</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 12</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">P</div>
      <div class="contact-info">
        <div class="contact-name">Pedro</div>
        <div class="contact-detail">Freelance consultant stuck on pricing. Recurring theme: fear of losing existing clients.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">3</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 10</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">L</div>
      <div class="contact-info">
        <div class="contact-name">Lisa</div>
        <div class="contact-detail">Early-stage founder navigating a business partnership. Core theme: imposter syndrome, delegation.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
          <span class="avatar-chip">Clara Fontaine</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">1</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 5</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">J</div>
      <div class="contact-info">
        <div class="contact-name">Juan Schubert</div>
        <div class="contact-detail">Founder of ONIOKO. Test sessions across multiple avatars. Strategy and product discussions.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
          <span class="avatar-chip">Adri Kastel</span>
          <span class="avatar-chip">Prof. Brian Cox</span>
          <span class="avatar-chip">Clara Fontaine</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">0</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 13</div>
      </div>
    </div>

  </section>

</div>`;

export default function ContactsPage(){
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  useEffect(()=>{
    document.body.classList.add("light-contacts");
    const root=ref.current; if(!root) return;
    (async()=>{
      try{
        const [contacts, owners, conversations] = await Promise.all([fetchContacts(), fetchOwners(), fetchConversations()]);
        const list=root.querySelector('.contacts-list');
        const cCount=root.querySelector('.contacts-live-count');
        const sCount=root.querySelector('.sessions-live-count');
        if(cCount) cCount.textContent=String(Array.isArray(contacts)?contacts.length:0);
        if(sCount) sCount.textContent=String(Array.isArray(conversations)?conversations.length:0);
        if(list && Array.isArray(contacts)){
          list.innerHTML="";
          contacts.slice(0,50).forEach((c:any)=>{
            const id = c.id ?? c.contact_id;
            const conv=(conversations as any[]).filter((x:any)=>x.contact_id===id || x.wa_contact_id===id);
            const ownerIds=new Set(conv.map((x:any)=>x.owner_id).filter(Boolean));
            const ownerNames=(owners as any[]).filter((o:any)=>ownerIds.has(o.id)).map((o:any)=>o.display_name||o.name);
            const node=document.createElement("div");
            node.className="contact-card";
            node.innerHTML=`<div class="contact-initial">${String((c.display_name||c.name||"?")).charAt(0).toUpperCase()}</div><div class="contact-info"><div class="contact-name">${c.display_name||c.name||"Unknown"}</div><div class="contact-detail">${c.notes||c.phone||""}</div><div class="contact-avatars">${ownerNames.map((n:string)=>`<span class="avatar-chip">${n}</span>`).join("")}</div></div><div class="contact-stats"><div class="contact-stat-num">${conv.length}</div><div class="contact-stat-label">Sessions</div><div class="contact-last-seen">Last seen: ${String(c.updated_at||"").slice(0,10)}</div></div>`;
            list.appendChild(node);
          });
        }
      }catch{}
    })();
    return ()=>{ document.body.classList.remove("light-contacts"); };
  },[params.slug,params.room]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:HTML}} />;
}
