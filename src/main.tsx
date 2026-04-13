import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './main.css'

import EntrancePage from '@/pages/Entrance'
import WingPage from '@/pages/Wing'
import RoomPage from '@/pages/Room'
import DiaryPage from '@/pages/Diary'
import TunnelsPage from '@/pages/Tunnels'
import ContactsPage from '@/pages/Contacts'
import SkillsPage from '@/pages/Skills'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntrancePage />} />
        <Route path="/wing/:avatarSlug" element={<WingPage />} />
        <Route path="/wing/:avatarSlug/room/:roomSlug" element={<RoomPage />} />
        <Route path="/wing/:avatarSlug/diary" element={<DiaryPage />} />
        <Route path="/tunnels" element={<TunnelsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/skills" element={<SkillsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
