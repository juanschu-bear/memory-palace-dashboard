import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Entrance", end: true },
  { to: "/wings", label: "Wings" },
  { to: "/rooms", label: "Rooms" },
  { to: "/diary", label: "Diary" },
  { to: "/tunnels", label: "Tunnels" },
  { to: "/contacts", label: "Contacts" },
  { to: "/skills", label: "Skills" },
];

export default function AppLayout() {
  return (
    <>
      <nav className="global-nav">
        <NavLink to="/" className="nav-brand" end>
          MEMORY PALACE
        </NavLink>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  );
}
