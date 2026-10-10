"use client";
import Link, { NavigationProvider, publicRoute, useNavigation } from "./navigation";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Headphones, Disc3, AudioLines, LayoutDashboard, Music2, LockKeyhole, ChevronRight } from "lucide-react";
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { MusicPlayer } from "./player";
import { Catalogue, ReleaseDetail } from "./catalogue";
import { ListeningPrivacy } from "./privacy";
import { SongDetail } from "./song";
export function BrandMark({className=""}:{className?:string}){return <svg className={className} width="28" height="28" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="m32 4 7 21 21 7-21 7-7 21-7-21-21-7 21-7Z"/></svg>;}
export function AppShell({children,isOwner}:{children:ReactNode;isOwner:boolean}){
  const initialPath=usePathname();
  return <NavigationProvider initialPath={initialPath}><SidebarProvider style={{"--sidebar-width":"224px"} as React.CSSProperties}><ShellContent isOwner={isOwner}>{children}</ShellContent></SidebarProvider></NavigationProvider>;
}
function ShellContent({children,isOwner}:{children:ReactNode;isOwner:boolean}){
  const {pathname:path,changed}=useNavigation(),studio=path.startsWith("/studio");
  const {setOpenMobile}=useSidebar();
  useEffect(()=>{setOpenMobile(false);},[path,setOpenMobile]);
  const route=changed?publicRoute(path):null;
  const content=route?.kind==="listen"?<Catalogue key={path}/>:route?.kind==="discography"?<Catalogue key={path} discography/>:route?.kind==="release"?<ReleaseDetail key={path} id={route.id}/>:route?.kind==="song"?<SongDetail key={path} id={route.id}/>:route?.kind==="privacy"?<ListeningPrivacy/>:children;
  const nav=studio?[{href:"/studio",label:"Overview",Icon:LayoutDashboard},{href:"/studio/releases",label:"Releases",Icon:Disc3},{href:"/studio/tracks",label:"Songs",Icon:Music2}]:[{href:"/",label:"Listen",Icon:Headphones},{href:"/discography",label:"Discography",Icon:Disc3}];
  const active=nav.find(n=>path===n.href)?.label??(path.startsWith("/release/")?"Release":path.startsWith("/song/")?"Song":path==="/privacy"?"Listening privacy":"NorthStar");
  return <>
    <Sidebar className="northstar-sidebar"><SidebarHeader className="ns-sidebar-header"><Link href="/" className="brand"><BrandMark/><span>northstar<span className="brand-period">.</span></span></Link><span className="brand-caption">{studio?"CREATOR STUDIO":"OFFICIAL MUSIC"}</span></SidebarHeader>
      <SidebarContent><SidebarGroup><SidebarGroupLabel>{studio?"YOUR WORKSPACE":"NORTHSTAR"}</SidebarGroupLabel><SidebarMenu>{nav.map(({href,label,Icon})=><SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={path===href}><Link href={href}><Icon/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup>{studio&&<SidebarGroup><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild><Link href="/"><Headphones/><span>View public site</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroup>}</SidebarContent>
      <SidebarFooter className="ns-sidebar-footer">{!studio&&<Link href="/studio" className="studio-link"><LockKeyhole size={15}/><span>Creator studio</span></Link>}{studio&&<form action="/api/auth/logout" method="POST"><button className="studio-link">Sign out</button></form>}<div className="sidebar-rule"/><span className="sidebar-copyright">© {new Date().getFullYear()} NorthStar</span><Link href="/privacy" className="privacy-link">Listening privacy</Link></SidebarFooter>
    </Sidebar>
    <SidebarInset className="ns-main"><header className="topbar"><div className="topbar-left"><SidebarTrigger className="mobile-menu"/><span className="breadcrumb">NorthStar</span><ChevronRight size={13}/><strong>{active}</strong></div><div className="topbar-right">{studio?<span className="private-pill"><LockKeyhole size={12}/>Private studio</span>:<><AudioLines size={16}/><span>Official releases</span>{isOwner&&<Link href="/studio" className="topbar-studio">Studio</Link>}</>}</div></header><main className="page-content">{content}</main><MusicPlayer/></SidebarInset>
    <Toaster position="bottom-right" theme="dark" richColors/>
  </>;
}
