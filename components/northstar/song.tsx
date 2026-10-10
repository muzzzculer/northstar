"use client";
import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "./navigation";
import { Cover, usePlayer } from "./player";
import { ShareButton } from "./share";
import { Release, time } from "@/lib/types";
export function SongDetail({id}:{id:string}){
  const [release,setRelease]=useState<Release|null>(null),[loading,setLoading]=useState(true);const p=usePlayer();
  useEffect(()=>{let live=true;fetch("/api/catalog").then(r=>{if(!r.ok)throw new Error();return r.json();}).then((d:any)=>{if(live)setRelease(d.releases.find((r:Release)=>r.tracks.some(t=>t.id===id))??null);}).catch(()=>{}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[id]);
  if(loading)return <div className="detail-loading"><Skeleton className="detail-cover"/><Skeleton className="detail-skeleton"/></div>;
  const track=release?.tracks.find(t=>t.id===id);
  if(!release||!track)return <div className="empty-release"><h1>Song unavailable</h1><p className="muted">This song hasn't been released or is no longer available.</p><Link href="/discography" className="text-link">Browse releases</Link></div>;
  const active=p.current?.id===id&&p.current.releaseId===release.id;
  return <div className="release-detail route-enter"><section className="release-hero"><Cover id={release.cover_id} title={release.title} className="detail-cover"/><div className="release-info"><span className="eyebrow red">SONG</span><h1>{track.title}</h1><Link href="/" className="artist-name">NorthStar</Link><p className="muted">{release.release_date.slice(0,4)} · {time(track.duration)}</p><p className="release-description">From <Link href={`/release/${release.id}`} className="text-link">{release.title}</Link></p><div className="release-buttons"><button className="primary-button" onClick={()=>active?p.toggle():p.playRelease({...release,tracks:[track]})}>{active&&p.playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{active&&p.playing?"Pause":"Play"}</button><ShareButton path={`/song/${id}`} title={track.title}/></div></div></section>{track.lyrics&&<section><h2>Lyrics</h2><div className="lyrics-text">{track.lyrics}</div></section>}{track.credits&&<section><h2>Credits</h2><p className="lyrics-text">{track.credits}</p></section>}</div>;
}
