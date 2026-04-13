import { NavLink, Outlet } from "react-router-dom";
const links=[
{to:"/",label:"Entrance"},
{to:"/wing/trace-flores",label:"Wing"},
{to:"/wing/trace-flores/room/business",label:"Room"},
{to:"/wing/trace-flores/diary",label:"Diary"},
{to:"/tunnels",label:"Tunnels"},
{to:"/contacts",label:"Contacts"},
{to:"/skills",label:"Skills"},
];
export default function AppLayout(){return (<><nav className="global-nav"><span className="nav-brand">MEMORY PALACE</span>{links.map(l=><NavLink key={l.to} to={l.to} className={({isActive})=>isActive?"active":""}>{l.label}</NavLink>)}</nav><Outlet/></>)}
