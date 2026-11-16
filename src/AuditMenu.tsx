import {useEffect,useState} from 'react';
import type {Engine,State} from './engine';

type Props={engine?:Engine; state?:State};
const families=['nature','space','room','desktop'] as const;
const stages=['legacy','design','interactive','personalized','desperate'] as const;
const projects=['project','alternate','extra','more'] as const;

export function AuditMenu({engine:passed}:Props){
 const [open,setOpen]=useState(false); const [beat,setBeat]=useState('C011'); const [pulse,setPulse]=useState(0); const [current,setCurrent]=useState<Engine|undefined>(passed);
 useEffect(()=>{if(passed)return;const id=window.setInterval(()=>{setCurrent((window as Window&{__dontGoEngine?:Engine}).__dontGoEngine);setPulse(v=>v+1)},100);return()=>window.clearInterval(id)},[passed]);
 const engine=passed||current;
 if(!engine)return null;
 const jump=(fn:()=>void)=>{fn();setOpen(false)};
 return <div className={`audit-menu ${open?'audit-open':''}`}>
  <button className="audit-toggle" onClick={()=>setOpen(v=>!v)}>AUDIT STATES</button>
  {open&&<div className="audit-panel">
   <strong>QUICK STATE AUDIT</strong>
   <small>Jump directly to an authored state.</small>
   <div className="audit-group"><label>Desperation scene</label><button onClick={()=>jump(()=>engine.debugPlea())}>Please don’t go</button></div>
   <div className="audit-group"><label>Exit preview</label><button disabled={engine.state.exitHiddenUntil!==null} onClick={()=>jump(()=>engine.debugHideExit())}>Hide End Conversation</button></div>
   <div className="audit-group"><label>Stages</label>{stages.map(s=><button key={s} onClick={()=>jump(()=>engine.debugStage(s))}>{s}</button>)}</div>
   <div className="audit-group"><label>Families</label>{families.map(f=><button key={f} onClick={()=>jump(()=>engine.debugFamily(f))}>{f}</button>)}</div>
   <div className="audit-group"><label>Projects</label>{families.map(f=><div className="audit-row" key={f}>{projects.filter(p=>f!=='nature'||p!=='more').map(p=><button key={f+p} onClick={()=>jump(()=>engine.debugProject(f,p==='project'?false:p==='alternate'?true:p))}>{f} {p}</button>)}</div>)}</div>
   <div className="audit-group"><label>Authored beat</label><div className="audit-row"><input value={beat} onChange={e=>setBeat(e.target.value.toUpperCase())} aria-label="Beat id"/><button onClick={()=>jump(()=>engine.debugBeat(beat))}>Jump</button></div></div>
   <div className="audit-group"><label>Visual toggles</label><div className="audit-row">{(['turtle','pond','rain'] as const).map(id=><button key={id} onClick={()=>engine.debugMutation(id,!engine.state[id])}>{engine.state[id]?'Hide ':'Show '}{id}</button>)}</div></div>
   <div className="audit-current">{engine.state.stage} · {engine.state.family||'no family'} · {engine.state.beat}</div>
  </div>}
 </div>
}
