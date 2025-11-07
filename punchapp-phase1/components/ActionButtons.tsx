"use client";
import { useEffect, useState } from "react";
type State="idle"|"working"|"break";

export default function ActionButtons(){
  const [state,setState]=useState<State>("idle");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{(async()=>{
    const res=await fetch("/api/state");
    if(res.ok){ const {state}=await res.json(); setState(state||"idle"); }
  })();},[]);

  async function send(action:"IN"|"OUT"|"BREAK OUT"|"BREAK IN"){
    try{
      setBusy(true); setError(null);
      const res=await fetch("/api/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,client_ts:new Date().toISOString()})});
      if(!res.ok) throw new Error(await res.text());
      if(action==="IN") setState("working");
      if(action==="OUT") setState("idle");
      if(action==="BREAK OUT") setState("break");
      if(action==="BREAK IN") setState("working");
    }catch(e:any){ setError(e.message||"Failed"); }
    finally{ setBusy(false); }
  }

  const Btn=({label,active,onClick,disabled}:{label:string,active:boolean,onClick:()=>void,disabled?:boolean})=>(
    <button className={`w-full py-4 rounded-2xl border border-white/10 transition ${active?"bg-white text-black":"bg-neutral-900 hover:bg-neutral-800 text-white"} ${disabled?"opacity-60 cursor-not-allowed":""}`} onClick={onClick} disabled={disabled}>{label}</button>
  );

  return (
    <div className="grid" style={{gap:"12px"}}>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        <Btn label="Punch In"  active={state==="working"} onClick={()=>send("IN")}  disabled={busy||state!=="idle"}/>
        <Btn label="Punch Out" active={state==="idle"}    onClick={()=>send("OUT")} disabled={busy||state==="idle"}/>
      </div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        <Btn label="Break Out" active={state==="break"}   onClick={()=>send("BREAK OUT")} disabled={busy||state!=="working"}/>
        <Btn label="Break In"  active={state==="working"} onClick={()=>send("BREAK IN")}  disabled={busy||state!=="break"}/>
      </div>
      {error && <p style={{color:"#f88"}}>{error}</p>}
    </div>
  );
}
