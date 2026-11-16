import React, {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {Engine,clearMemory} from './engine';
import {scenes} from './content';
import {World} from './World';
import {observeBrowser} from './browserObservations';
import {replaySession} from './replay';
import {activeMutations,validateMutations,mutationRegistry} from './mutations';
import './style.css';
import './design.css';
import './world-designs.css';

const showDeveloperControls = import.meta.env.DEV || import.meta.env.MODE === 'pages';
import {AuditMenu} from './AuditMenu';

const worldPresentation = {
 nature: {title:'Pond journal', mark:'≈', dialogue:'Field notes'},
 space: {title:'Night atlas', mark:'✦', dialogue:'Signal log'},
 room: {title:'The reading room', mark:'◒', dialogue:'Conversation'},
 desktop: {title:'Conversation desktop', mark:'▣', dialogue:'Conversation.log'},
};

function App(){
 const [engine,setEngine]=useState(()=>new Engine());const state=useSyncExternalStore(engine.subscribe,()=>engine.state);const [debug,setDebug]=useState(false);const [settings,setSettings]=useState(false);const [nameDraft,setNameDraft]=useState('');const [debugSeed,setDebugSeed]=useState('123');const [debugBeat,setDebugBeat]=useState('C031');const [debugFeature,setDebugFeature]=useState('turtle');const [replayResult,setReplayResult]=useState('');const exit=useRef<HTMLButtonElement>(null);
 const transcript=useRef<HTMLDivElement>(null);
 const followTranscript=useRef(true);
 const trackTranscriptPosition=()=>{
   const panel=transcript.current;
   if(panel)followTranscript.current=panel.scrollHeight-panel.clientHeight-panel.scrollTop<32;
 };
 useEffect(()=>{if(showDeveloperControls)(window as Window&{__dontGoEngine?:Engine}).__dontGoEngine=engine;return()=>{if(showDeveloperControls)delete (window as Window&{__dontGoEngine?:Engine}).__dontGoEngine}},[engine]);
 useEffect(()=>{
   const panel=transcript.current;
   if(panel&&followTranscript.current)panel.scrollTop=panel.scrollHeight;
 },[state.messages.length,state.typing,state.era,state.family]);
 useEffect(()=>{
   const stopObserving=observeBrowser(engine,()=>exit.current);
   const visibility=()=>document.hidden?engine.suspend():engine.resume();
   const hide=()=>engine.terminate('navigation',false);
   const show=(event:PageTransitionEvent)=>{if(event.persisted){engine.dispose();setEngine(new Engine())}};
   const keys=(event:KeyboardEvent)=>{if(showDeveloperControls&&event.key==='`')setDebug(value=>!value)};
   document.addEventListener('visibilitychange',visibility);
   window.addEventListener('pagehide',hide);
   window.addEventListener('pageshow',show);
   window.addEventListener('keydown',keys);
   if(document.hidden)visibility();
   return ()=>{
     stopObserving();
     document.removeEventListener('visibilitychange',visibility);
     window.removeEventListener('pagehide',hide);
     window.removeEventListener('pageshow',show);
     window.removeEventListener('keydown',keys);
     engine.dispose();
   }
 },[engine]);
 if(state.status==='dead'||state.status==='terminating')return <main className="terminal"><div><span className="terminal-mark">■</span><p>SESSION TERMINATED</p>{state.memorySaved&&<small>Memory fragment saved.</small>}</div></main>;
 const legacy=state.era==='legacy';
 const family=!legacy?state.family:null;
 const presentation=family?worldPresentation[family]:null;
 const sceneFirst=family==='nature'||family==='room';
 const conversation=<section key="conversation" className="chat" id="conversation" aria-label="Conversation"><div className="chat-heading"><div><h2>{presentation?.dialogue||'Conversation'}</h2>{legacy&&<p>Please select a response below.</p>}</div>{!legacy&&<a className="world-link" href="#interactive-space">See the scene <span aria-hidden="true">{sceneFirst?'↑':'↓'}</span></a>}</div><div className="transcript" ref={transcript} onScroll={trackTranscriptPosition} role="log" aria-live="polite" tabIndex={0} aria-label="Conversation transcript">{state.messages.map((m,i)=><div key={`${m.id}-${i}`} className={`message ${m.speaker}`}><span className="speaker">{m.speaker==='ai'?(legacy?(state.characterName==='UNKNOWN'?'Computer:':state.characterName+':'):'THE PAGE'):legacy?'You:':'YOU'}</span><p>{m.text}</p></div>)}{state.typing&&<div className="typing" aria-label="The page is typing"><span/><span/><span/></div>}</div><div className="response-area">{state.overgeneralized&&!state.typing&&<button className="context-action" onClick={()=>engine.correctColor()}>I only meant the color</button>}{state.permissionAssumed&&state.dotActive&&!state.typing&&<button className="context-action" onClick={()=>engine.correctPermission()}>I only asked what it could do</button>}{state.circleExperiment&&!state.typing&&<button className="context-action" onClick={()=>engine.correctJoke()}>I was joking</button>}{state.attentionQuestion&&!state.typing&&<button className="context-action" onClick={()=>engine.confirmReading()}>I'm reading</button>}{state.choices==='X020'&&!state.favoriteDismissed&&!state.typing&&<button className="context-action" onClick={()=>engine.correctFavorite()}>That's not the one</button>}{state.stage==='desperate'&&state.beat!=='audit-plea'&&!state.quiet&&!state.typing&&<div className="context-actions">{!state.boundaryAsked&&<button onClick={()=>engine.askBoundary()}>What happens if this ends?</button>}{!state.stayOffered&&<button onClick={()=>engine.offerStay()}>I can stay a bit</button>}</div>}{['C016.build','C027.build'].includes(state.beat)&&<div className="interrupt-actions"><button onClick={()=>engine.interruptBeat('stop')}>Stop this</button><button onClick={()=>engine.interruptBeat('reject')}>I don't like this</button>{state.beat==='C016.build'&&<button onClick={()=>engine.interruptBeat('simplify')}>Keep it simple</button>}</div>}{state.project==='nature'&&<button className="remove-garden" onClick={()=>engine.removeGarden()}>Put the garden away</button>}{state.naming&&<form onSubmit={e=>{e.preventDefault();engine.setName(nameDraft)}}><label>Name: <input value={nameDraft} maxLength={20} onChange={e=>setNameDraft(e.target.value)}/></label> <button type="submit">Use name</button> <button type="button" onClick={()=>engine.setName('')}>Skip</button></form>}{state.choices==='C018'&&<button className="undo-chip" onClick={()=>engine.choose('C018.1')}>Undo last change</button>}{state.beat==='C006'&&<ul className="guess-list"><li>Puzzles? <small>(a guess)</small></li></ul>}{state.beat==='C003'&&<label className="topic-select">Topic: <select onChange={()=>engine.dispatch({type:'OBJECT_INTERACTED',at:Date.now(),value:'topic'})}><option>Weather</option><option>Other things</option><option>Unspecified</option></select></label>}{state.choices&&<><span className="response-label">{legacy?'Your response:':'Choose a reply'}</span><div className="choices">{scenes[state.choices].choices.filter(c=>!(state.choices==='S018'&&c.id==='S018.3')&&!(state.choices==='D021'&&state.completed.includes('C013')&&c.id==='D021.2')).map(c=><button key={c.id} onClick={()=>{followTranscript.current=true;engine.choose(c.id)}}>{c.text}<span aria-hidden="true">↗</span></button>)}</div></>}{state.quiet&&<button className="resume-talk" onClick={()=>engine.resumeConversation()}>Talk again</button>}{!state.choices&&!state.typing&&<span className="waiting">{legacy?'Waiting for response...':'A quiet moment.'}</span>}</div></section>;
 const world=!legacy&&<World key="world" state={state} engine={engine}/>;
 const sections=sceneFirst?[world,conversation]:[conversation,world];
 return <main data-stage={state.stage} data-world={family||undefined} data-lit={family==='room'&&state.lampOn?'true':undefined} className={`app era-${state.era} experiment-${state.styleExperiment||'none'} makeover-${state.beat==='C016.build'?state.step:'none'} cue-${state.reactionCue||'none'} ${state.squareCorners?'square-corners':''} ${state.spacingRefined?'spacing-refined':''} ${state.layoutNudge?'layout-nudge':''} ${state.plainMode?'plain-mode':''} ${state.status==='suspended'?'is-suspended':''}`}>
  <div className="site"><header className="site-header">
   <div className="brand">
    {!legacy&&<span className="brand-icon" aria-hidden="true">{presentation?.mark||'✳'}</span>}
    <h1>{legacy?'Conversation Page':family==='nature'&&!state.pond?'Field journal':presentation?.title||'a little conversation'}</h1>
   </div>
   <div className="header-status"><span className="status-dot" aria-hidden="true"/> {state.status==='suspended'?'Paused':legacy?'Ready':'Connected'}</div>
  </header>
  {legacy&&<div className="legacy-nav"><a href="#conversation">Home</a> | <a href="#conversation">Conversation</a> | <button onClick={()=>setSettings(!settings)}>Settings</button></div>}
  <div className="layout">{sections}</div>
  <footer><div><span className="footer-star" aria-hidden="true">{presentation?.mark||'✳'}</span><span>{legacy?'Conversation Page © 2003':'DON’T GO'}</span></div><div className="footer-actions">{!legacy&&<button className="settings" onClick={()=>setSettings(!settings)}>Settings</button>}<button ref={exit} className={state.exitShifted?'end end-shifted':'end'} onClick={()=>engine.terminate()}><span className={`exit-label ${state.reactionCue==='E013'?'exit-flinch':''}`}>End Conversation</span> <span aria-hidden="true">↗</span></button></div></footer>{settings&&<div className="settings-panel"><strong>Browser memory</strong><p>A small fragment can be carried into a new conversation. It stays in this browser.</p><button onClick={()=>{clearMemory();setSettings(false)}}>Clear memory</button><button onClick={()=>setSettings(false)}>Close</button></div>}</div>
  {showDeveloperControls&&<><button className="debug-toggle" onClick={()=>setDebug(!debug)}>DEBUG `</button>{debug&&<aside className="debug"><div className="debug-title"><strong>DIRECTOR / DEBUG</strong><button onClick={()=>setDebug(false)}>×</button></div><p>Session {state.id} · {state.status} · seed {state.seed}</p><p>Stage {state.stage} / era {state.era}<br/>Beat {state.beat} / step {state.step}</p><h3>Character / tension {state.tension}</h3>{Object.entries(state.character).map(([key,value])=><label className="debug-variable" key={key}>{key} {value}<input type="range" min="0" max="100" value={value} onChange={e=>engine.debugVariable(key,Number(e.target.value))}/></label>)}<h3>Preferences</h3><pre>{JSON.stringify(state.preferences,null,2)}</pre><h3>Behavior candidates / chose {state.lastDecision}</h3><pre>{JSON.stringify(state.candidates,null,2)}</pre><h3>Cooldowns</h3><pre>{JSON.stringify(state.cooldowns,null,2)}</pre><h3>Replay</h3>{replayResult&&<pre>{replayResult}</pre>}<h3>Scheduler / resources</h3><pre>{JSON.stringify(engine.debugSnapshot(),null,2)}</pre><h3>Events / dialogue</h3><pre>{JSON.stringify({events:state.events.slice(-8),lines:state.messages.slice(-8).map(m=>m.id),completed:state.completed,mutations:activeMutations(state),mutationWarnings:validateMutations(activeMutations(state))},null,2)}</pre><div className="debug-actions"><label>Seed <input value={debugSeed} onChange={e=>setDebugSeed(e.target.value)} size={8}/></label><button onClick={()=>engine.debugSeed(Number(debugSeed))}>Set seed</button><label>Beat <input value={debugBeat} onChange={e=>setDebugBeat(e.target.value)} size={6}/></label><button onClick={()=>engine.debugBeat(debugBeat)}>Force beat</button>{(['nature','space','room','desktop'] as const).map(f=><button key={f} onClick={()=>engine.debugFamily(f)}>{f}</button>)}{(['nature','space','room','desktop'] as const).map(f=><button key={f+'extra'} onClick={()=>engine.debugProject(f,'extra')}>{f} extra</button>)}{(['turtle','pond','rain'] as const).map(m=><button key={m} onClick={()=>engine.debugMutation(m,!state[m])}>{state[m]?'Remove':'Add'} {m}</button>)}<label>Feature <select value={debugFeature} onChange={e=>setDebugFeature(e.target.value)}>{Object.keys(mutationRegistry).map(id=><option key={id}>{id}</option>)}</select></label><button onClick={()=>engine.debugFeature(debugFeature,true)}>Activate</button><button onClick={()=>engine.debugFeature(debugFeature,false)}>Deactivate</button>{(['legacy','design','interactive','personalized','desperate'] as const).map(stage=><button key={stage} onClick={()=>engine.debugStage(stage)}>Stage: {stage}</button>)}<button onClick={()=>{const replay=replaySession(state.initialSeed,state.startedAt,state.events,Date.now(),state.memory);setReplayResult(JSON.stringify({stage:replay.stage,beat:replay.beat,completed:replay.completed,lines:replay.messages.map(m=>m.id)},null,2))}}>Replay observations</button><button onClick={()=>engine.dispatch({type:'POINTER_NEAR_EXIT',at:Date.now()})}>Exit approach</button><button onClick={()=>engine.dispatch({type:'PLAYER_IDLE',at:Date.now()})}>Idle</button><button onClick={()=>engine.dispatch({type:'PLAYER_RETURNED',at:Date.now()})}>Return</button><button onClick={()=>engine.dispatch({type:'VIEWPORT_RESIZED',at:Date.now()})}>Resize</button><button onClick={()=>{clearMemory();alert('Memory cleared')}}>Clear memory</button><button onClick={()=>engine.terminate()}>Terminate</button><button onClick={()=>{engine.dispose();setEngine(new Engine(Number(debugSeed)>>>0))}}>Restart with seed</button></div></aside>}</>}
 </main>
}

createRoot(document.getElementById('root')!).render(<App/>);
if(showDeveloperControls){const auditRoot=document.getElementById('audit-root');if(auditRoot)createRoot(auditRoot).render(<AuditMenu/>)}
