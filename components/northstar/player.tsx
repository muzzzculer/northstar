"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, ListMusic, Mic2, Volume2, VolumeX, Music2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { QueueItem, Release, media, time } from "@/lib/types";
type PlayerState={current:QueueItem|null;queue:QueueItem[];playing:boolean;position:number;duration:number;loading:boolean;volume:number;shuffle:boolean;repeat:boolean;lyricsOpen:boolean;queueOpen:boolean;playRelease:(r:Release,index?:number,shuffled?:boolean)=>void;playQueue:(items:QueueItem[],index?:number)=>void;toggle:()=>void;next:()=>void;previous:()=>void;seek:(s:number)=>void;setVolume:(v:number)=>void;setShuffle:(v:boolean)=>void;setRepeat:(v:boolean)=>void;setLyricsOpen:(v:boolean)=>void;setQueueOpen:(v:boolean)=>void};
const PlayerContext=createContext<PlayerState|null>(null);
export function usePlayer(){const p=useContext(PlayerContext);if(!p)throw new Error("Player is unavailable");return p;}
export function PlayerProvider({children}:{children:ReactNode}){
  const audio=useRef<HTMLAudioElement|null>(null),queueRef=useRef<QueueItem[]>([]),indexRef=useRef(0),repeatRef=useRef(false),shuffleRef=useRef(false);
  const awaitingPlay=useRef(false);
  const [queue,setQueue]=useState<QueueItem[]>([]),[current,setCurrent]=useState<QueueItem|null>(null),[playing,setPlaying]=useState(false),[position,setPosition]=useState(0),[duration,setDuration]=useState(0),[loading,setLoading]=useState(false),[volume,setVolumeState]=useState(.8),[shuffle,setShuffleState]=useState(false),[repeat,setRepeatState]=useState(false),[lyricsOpen,setLyricsOpen]=useState(false),[queueOpen,setQueueOpen]=useState(false);
  function countPlay(){const track=queueRef.current[indexRef.current];if(!track?.releaseId)return;const body=JSON.stringify({action:"start",playId:crypto.randomUUID(),trackId:track.id,releaseId:track.releaseId});async function send(){return fetch("/api/listen",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true});}send().then(r=>{if(r.status>=500)return send();}).catch(()=>send().catch(()=>{}));}
  function load(index:number){
    const a=audio.current,track=queueRef.current[index];if(!a||!track)return;
    awaitingPlay.current=false;
    indexRef.current=index;setCurrent(track);setPosition(0);setDuration(track.duration);setLoading(true);a.src=media(track.asset_id);a.load();
    a.play().catch(()=>{setLoading(false);setPlaying(false);toast.error("Playback couldn't start. Press play to try again.");});
  }
  function playQueue(items:QueueItem[],index=0){if(!items.length)return;queueRef.current=items;setQueue(items);load(index);}
  function playRelease(r:Release,index=0,shuffled=false){let items=r.tracks.map(t=>({...t,releaseId:r.status==="published"?r.id:"",releaseTitle:r.title,coverId:r.cover_id}));if(shuffled){items=[...items].sort(()=>Math.random()-.5);setShuffle(true);}playQueue(items,index);}
  function next(){if(!queueRef.current.length)return;let n=indexRef.current+1;if(shuffleRef.current&&queueRef.current.length>1){do{n=Math.floor(Math.random()*queueRef.current.length);}while(n===indexRef.current);}if(n>=queueRef.current.length){if(repeatRef.current)n=0;else{audio.current?.pause();return;}}load(n);}
  function previous(){if(audio.current&&audio.current.currentTime>3){seek(0);return;}load(Math.max(0,indexRef.current-1));}
  function seek(seconds:number){if(audio.current){audio.current.currentTime=seconds;setPosition(seconds);}}
  function toggle(){const a=audio.current;if(!a||!current)return;if(a.paused)a.play().catch(()=>toast.error("This audio couldn't play. Check the file or your connection."));else a.pause();}
  function setVolume(v:number){setVolumeState(v);if(audio.current)audio.current.volume=v;localStorage.setItem("northstar-volume",String(v));}
  function setRepeat(v:boolean){repeatRef.current=v;setRepeatState(v);}function setShuffle(v:boolean){shuffleRef.current=v;setShuffleState(v);}
  useEffect(()=>{
    const a=new Audio();a.preload="metadata";audio.current=a;const saved=Number(localStorage.getItem("northstar-volume")??.8);a.volume=Number.isFinite(saved)?Math.max(0,Math.min(1,saved)):.8;setVolumeState(a.volume);
    a.addEventListener("timeupdate",()=>setPosition(a.currentTime));a.addEventListener("play",()=>{awaitingPlay.current=true;});a.addEventListener("playing",()=>{setPlaying(true);setLoading(false);if(awaitingPlay.current){awaitingPlay.current=false;countPlay();}});a.addEventListener("pause",()=>{awaitingPlay.current=false;setPlaying(false);});a.addEventListener("canplay",()=>setLoading(false));a.addEventListener("waiting",()=>setLoading(true));a.addEventListener("loadedmetadata",()=>setDuration(Number.isFinite(a.duration)?a.duration:0));a.addEventListener("ended",()=>{awaitingPlay.current=false;next();});a.addEventListener("error",()=>{awaitingPlay.current=false;setLoading(false);setPlaying(false);toast.error("Audio isn't available. Please try another song or check your connection.");});
    return()=>{a.pause();a.src="";};
  },[]);
  useEffect(()=>{if(!current||!("mediaSession" in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:"NorthStar",album:current.releaseTitle,artwork:current.coverId?[{src:new URL(media(current.coverId),location.origin).href}]:[]});navigator.mediaSession.setActionHandler("play",()=>audio.current?.play());navigator.mediaSession.setActionHandler("pause",()=>audio.current?.pause());navigator.mediaSession.setActionHandler("nexttrack",next);navigator.mediaSession.setActionHandler("previoustrack",previous);navigator.mediaSession.setActionHandler("seekto",d=>{if(d.seekTime!=null)seek(d.seekTime);});},[current]);
  return <PlayerContext.Provider value={{current,queue,playing,position,duration,loading,volume,shuffle,repeat,lyricsOpen,queueOpen,playRelease,playQueue,toggle,next,previous,seek,setVolume,setShuffle,setRepeat,setLyricsOpen,setQueueOpen}}>{children}</PlayerContext.Provider>;
}
export function Cover({id,title,className=""}:{id:string|null;title:string;className?:string}){return id?<img className={`cover ${className}`} src={media(id)} alt={`${title} artwork`} loading="lazy"/>:<div className={`cover cover-fallback ${className}`}><Music2 aria-hidden="true"/></div>;}
export function MusicPlayer(){
  const p=usePlayer();const iconButton=(label:string,icon:ReactNode,action:()=>void,active=false,disabled=false)=><button type="button" className={`icon-button ${active?"active":""}`} aria-label={label} aria-pressed={active||undefined} onClick={action} disabled={disabled}>{icon}</button>;
  return <>
    <footer className={`music-player ${!p.current?"idle":""}`} aria-label="Music player">
      <button className="now-playing" onClick={()=>p.setLyricsOpen(true)} disabled={!p.current} aria-label={p.current?`Now playing ${p.current.title}`:"Nothing playing"}>
        <Cover id={p.current?.coverId??null} title={p.current?.releaseTitle??"NorthStar"}/><span><strong>{p.current?.title??"Not playing"}</strong><small>{p.current?"NorthStar":"Choose a release to listen"}</small></span>
      </button>
      <div className="player-center"><div className="transport">
        {iconButton("Shuffle",<Shuffle/>,()=>p.setShuffle(!p.shuffle),p.shuffle,!p.current)}
        {iconButton("Previous song",<SkipBack fill="currentColor"/>,p.previous,false,!p.current)}
        <button className="play-toggle" aria-label={p.playing?"Pause":"Play"} onClick={p.toggle} disabled={!p.current}>{p.loading?<span className="spinner"/>:p.playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
        {iconButton("Next song",<SkipForward fill="currentColor"/>,p.next,false,!p.current)}
        {iconButton("Repeat queue",<Repeat/>,()=>p.setRepeat(!p.repeat),p.repeat,!p.current)}
      </div><div className="seek-row"><span>{time(p.position)}</span><Slider aria-label="Playback position" min={0} max={Math.max(p.duration,1)} step={.1} value={[p.position]} onValueChange={v=>p.seek(v[0])} disabled={!p.current}/><span>{time(p.duration)}</span></div></div>
      <div className="player-tools">{iconButton("Lyrics and now playing",<Mic2/>,()=>p.setLyricsOpen(true),p.lyricsOpen,!p.current)}{iconButton("Up next",<ListMusic/>,()=>p.setQueueOpen(true),p.queueOpen,!p.current)}<div className="volume-control">{iconButton(p.volume?"Mute":"Unmute",p.volume?<Volume2/>:<VolumeX/>,()=>p.setVolume(p.volume?0:.8))}<Slider aria-label="Volume" min={0} max={1} step={.01} value={[p.volume]} onValueChange={v=>p.setVolume(v[0])}/></div></div>
    </footer>
    <Sheet open={p.lyricsOpen} onOpenChange={p.setLyricsOpen}><SheetContent className="music-sheet" side="right"><SheetHeader><SheetTitle>Now playing</SheetTitle><SheetDescription>NorthStar</SheetDescription></SheetHeader>{p.current&&<div className="sheet-body"><Cover id={p.current.coverId} title={p.current.releaseTitle} className="expanded-cover"/><h2>{p.current.title}</h2><p className="muted">{p.current.releaseTitle}</p><h3>Lyrics</h3>{p.current.lyrics?<div className="lyrics-text">{p.current.lyrics}</div>:<p className="muted">No lyrics for this song yet.</p>}{p.current.credits&&<><h3>Credits</h3><p className="lyrics-text credits-text">{p.current.credits}</p></>}</div>}</SheetContent></Sheet>
    <Sheet open={p.queueOpen} onOpenChange={p.setQueueOpen}><SheetContent className="music-sheet" side="right"><SheetHeader><SheetTitle>Up next</SheetTitle><SheetDescription>{p.queue.length} songs in the queue</SheetDescription></SheetHeader><div className="sheet-body queue-list">{p.queue.map((track,i)=><button key={`${track.id}-${i}`} className={`queue-track ${p.current?.id===track.id?"selected":""}`} onClick={()=>p.playQueue(p.queue,i)}><Cover id={track.coverId} title={track.releaseTitle}/><span><strong>{track.title}</strong><small>NorthStar · {track.releaseTitle}</small></span><span>{time(track.duration)}</span></button>)}</div></SheetContent></Sheet>
  </>;
}
