import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./main.css";
import AppLayout from "./components/Layout";
import EntrancePage from "./pages/Entrance";
import WingsPage from "./pages/Wings";
import WingPage from "./pages/Wing";
import UserWingPage from "./pages/UserWing";
import RoomPage from "./pages/Room";
import RoomsSelectPage from "./pages/RoomsSelect";
import DiaryPage from "./pages/Diary";
import DiarySelectPage from "./pages/DiarySelect";
import TunnelsPage from "./pages/Tunnels";
import TunnelsSelectPage from "./pages/TunnelsSelect";
import ContactsPage from "./pages/Contacts";
import SkillsPage from "./pages/Skills";
import SkillsSelectPage from "./pages/SkillsSelect";
import GraphView from "./pages/GraphView";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<EntrancePage />} />
          <Route path="/wings" element={<WingsPage />} />
          <Route path="/wing/user/:contactId" element={<UserWingPage />} />
          <Route path="/wing/:slug" element={<WingPage />} />
          <Route path="/wing/:slug/room/:room" element={<RoomPage />} />
          <Route path="/wing/:slug/diary" element={<DiaryPage />} />
          <Route path="/rooms" element={<RoomsSelectPage />} />
          <Route path="/diary" element={<DiarySelectPage />} />
          <Route path="/tunnels" element={<TunnelsSelectPage />} />
          <Route path="/tunnels/:slug" element={<TunnelsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/skills" element={<SkillsSelectPage />} />
          <Route path="/skills/:slug" element={<SkillsPage />} />
          <Route path="/graph" element={<GraphView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
