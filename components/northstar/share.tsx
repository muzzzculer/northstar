"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export function ShareButton({path,title,compact=false}:{path:string;title:string;compact?:boolean}){
  const [url,setUrl]=useState("");
  async function share(){
    const link=new URL(path,window.location.origin).href;
    if(navigator.share){try{await navigator.share({title:`${title} · NorthStar`,url:link});return;}catch(e){if(e instanceof Error&&e.name==="AbortError")return;}}
    try{await navigator.clipboard.writeText(link);toast.success("Link copied.");}catch{setUrl(link);}
  }
  return <><button type="button" className={compact?"icon-button":"secondary-button"} aria-label={`Share ${title}`} onClick={share}><Share2 size={17}/>{!compact&&"Share"}</button><Dialog open={!!url} onOpenChange={open=>{if(!open)setUrl("");}}><DialogContent><DialogHeader><DialogTitle>Share {title}</DialogTitle><DialogDescription>Select and copy this direct link.</DialogDescription></DialogHeader><input aria-label="Share link" readOnly value={url} onFocus={e=>e.target.select()} className="w-full rounded-md border p-3"/></DialogContent></Dialog></>;
}
