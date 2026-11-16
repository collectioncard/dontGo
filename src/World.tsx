import {useState, useRef, useEffect, type CSSProperties, type ReactNode} from 'react';
import type {Engine,State} from './engine';

type Props={state:State; engine:Engine};
const starOrigin=(index:number)=>({x:8+(index*37)%83,y:32+(index*53)%58});
export function World({state,engine}:Props){
 const [elapsed,setElapsed]=useState(0);useEffect(()=>{if(state.status!=='active'||state.project!=='room-more')return;const timer=setInterval(()=>setElapsed(n=>n+1),1000);return()=>clearInterval(timer)},[state.status,state.project]);const [gravity,setGravity]=useState({x:35,y:55});const [gravity2,setGravity2]=useState({x:72,y:68});const [deskX,setDeskX]=useState(10);const [cometPaused,setCometPaused]=useState(false);const [starPositions,setStarPositions]=useState<Record<number,{x:number;y:number}>>({});const [follower,setFollower]=useState({x:30,y:65});const [orbit,setOrbit]=useState(30);useEffect(()=>{if(state.orbitWide)setOrbit(65)},[state.orbitWide]);const followerPointer=useRef<{x:number;y:number;t:number}|null>(null);const fastNoted=useRef(false);const drawing=useRef(false);const [marks,setMarks]=useState<{x:number;y:number}[]>([]);const [numA,setNumA]=useState('2');const [numB,setNumB]=useState('2');
 const [frontWindow,setFrontWindow]=useState<'main'|'tools'|null>(null);
 useEffect(()=>setFrontWindow(null),[state.desktopLayout,state.desktopLayoutRevision]);
 const event=(value:string)=>engine.dispatch({type:value==='catch-missed'?'OBJECT_MISSED':'OBJECT_INTERACTED',at:Date.now(),value});
 const title=state.family==='space'?'A quieter kind of sky.':state.family==='room'?'A little light.':state.family==='desktop'?'A window within a window.':state.pond?'A place to stay.':state.turtle?'A small discovery.':'A work in progress.';
 const description=state.family==='desktop'?'Drag a title bar or move it with the arrow keys.':
   state.family==='room'?'Select the lamp to change the light.':
   state.family==='space'&&state.stars>0?'Drag a star or move it with the arrow keys.':
   state.pond?'Touch the water to make a ripple.':
   state.turtle?'Drag the turtle or move it with the arrow keys.':
   state.dotGame?'Catch the moving dot.':
   state.dotActive?'Try moving the dot.':null;
 const roomWindowVisible=state.roomWindowIntroduced||state.project==='room'||['pond-window','window-stars'].includes(state.crossFeature||'');
 const canDrawWindow=state.project==='room'&&state.projectStep>=4&&!state.curtainsClosed;
 return <aside id="interactive-space" tabIndex={-1} className={`world world-${state.family||'empty'} world-beat-${state.beat} cross-${state.crossFeature||'none'} detail-${state.crossDetail||'none'} cue-${state.reactionCue||'none'} ${state.lampOn?'lamp-on':''} ${state.desktopTidied?'desktop-tidied':''}`} aria-label="Interactive space">
  {state.circleExperiment&&<div className="circle-experiment" aria-label="A circular design experiment"/>}{state.dotActive&&<DotToy state={state} event={event}/>}
  {state.crossFeature==='corrected-preview'&&<div className="corrected-preview">A quieter version.</div>}{state.crossFeature==='teardown'&&<div className="teardown">· · ·</div>}{['bridge-sketch','bridge-built'].includes(state.crossFeature||'')&&<div className={`bridge-sketch ${state.crossFeature==='bridge-built'?'bridge-built':''}`}>⌒</div>}{state.crossFeature==='room-game'&&<button className={`room-game ${state.crossDetail==='game'?'foreground':''}`} onAnimationIteration={()=>event('catch-missed')} onClick={()=>event('catch')}>🐢 <small>catch</small></button>}
  {(state.crossFeature==='boundary'||state.reactionCue==='Z010')&&<span className="boundary-dot" aria-hidden="true"/>}{state.crossFeature==='favorite'&&<span className="favorite-ring" aria-hidden="true"/>}{state.unfinishedProject&&<div className="unfinished-project" aria-label="An unfinished in-page project"><span>WORK IN PROGRESS</span><i/><i/><i/></div>}<div className="world-caption"><h2>{title}</h2>{description&&<p>{description}</p>}</div>
  {state.family==='space'&&state.project==='space-more'&&<div className={`gravity-world ${state.gravityMotion?'':'gravity-still'}`}><button className="gravity-well" style={{left:`${gravity.x}%`,top:`${gravity.y}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setGravity({x:Math.max(5,Math.min(85,(e.clientX-r.left)/r.width*100)),y:Math.max(25,Math.min(85,(e.clientY-r.top)/r.height*100))})}}} aria-label="Move the little gravity well">✦</button>{state.projectStep>=3&&<button className="gravity-second" style={{left:`${gravity2.x}%`,top:`${gravity2.y}%`}} aria-label="Move second gravity well" onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setGravity2({x:Math.max(5,Math.min(85,(e.clientX-r.left)/r.width*100)),y:Math.max(25,Math.min(85,(e.clientY-r.top)/r.height*100))})}}}>✧</button>}<span className="gravity-orbit" style={{left:`${gravity.x}%`,top:`${gravity.y}%`}}>· &nbsp; · &nbsp; ·</span></div>}
  {state.family==='space'&&state.project==='space-extra'&&state.beat==='S019'&&<div className="comet-trails" aria-hidden="true">✧ ────── ✦<br/>　✦ ────── ✧</div>}
  {state.family==='space'&&state.project==='space-extra'&&<button className={`word-comet ${cometPaused?'comet-paused':''}`} onPointerEnter={()=>{if(!cometPaused)event('comet-paused')}} onClick={()=>{setCometPaused(!cometPaused);event('comet-paused')}}>{state.beat==='S020'?'✦':(state.messages.find(m=>m.speaker==='player')?.text||'a little conversation')}</button>}
  {state.family==='space'&&state.cometPinned&&<button className="pinned-comet" onClick={()=>event('star')} aria-label="Pinned message star">✦</button>}
  {state.family==='space'&&state.project==='space-alt'&&<div className="planet-system"><div className="planet"/>{state.moonVisible&&state.projectStep>=2&&<button className="moon" aria-label="Change moon orbit" style={{left:`${orbit}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setOrbit(Math.max(5,Math.min(90,(e.clientX-r.left)/r.width*100)))}}} onPointerUp={()=>event('moon-drag')} onClick={()=>setOrbit(orbit===30?65:30)}>●</button>}{state.projectStep>=3&&<span className="signal">still here.</span>}</div>}
  {state.family==='space'&&state.project==='space'&&state.projectStep>=2&&<svg className={`constellation ${state.constellationDotted?'constellation-dotted':''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={[0,1,2,3].map(i=>`${starPositions[i]?.x??starOrigin(i).x},${starPositions[i]?.y??starOrigin(i).y}`).join(" ")}/></svg>}
  {state.family==='space'&&<div className={`stars ${state.starsStill?'stars-still':''}`} aria-label="A small sky">{Array.from({length:state.stars},(_,i)=><button key={i} className="star" aria-label={`Star ${i+1}`} style={{left:`${starPositions[i]?.x??starOrigin(i).x}%`,top:`${starPositions[i]?.y??starOrigin(i).y}%`,animationDelay:`${i*.17}s`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setStarPositions(p=>({...p,[i]:{x:Math.max(2,Math.min(94,(e.clientX-r.left)/r.width*100)),y:Math.max(18,Math.min(90,(e.clientY-r.top)/r.height*100))}}))}}} onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};if(delta[e.key]){e.preventDefault();setStarPositions(p=>{const old=p[i]||starOrigin(i);return {...p,[i]:{x:Math.max(2,Math.min(94,old.x+delta[e.key][0])),y:Math.max(18,Math.min(90,old.y+delta[e.key][1]))}}});event('star')}}} onClick={()=>event('star')}>✦</button>)}</div>}
  {state.family==='room'&&<div className="room-scene"><div hidden={!roomWindowVisible} className={`room-window weather-${state.weather} ${state.crossFeature==='window-stars'?'window-stars':''} ${state.curtainsClosed?'curtains-closed':''}`} onPointerDown={e=>{if(canDrawWindow){drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId)}}} onPointerUp={()=>{if(drawing.current){drawing.current=false;event('window-draw')}}} onPointerMove={e=>{if(canDrawWindow&&e.buttons){const r=e.currentTarget.getBoundingClientRect();setMarks(m=>[...m.slice(-100),{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}])}}} onDoubleClick={()=>{if(canDrawWindow)setMarks([])}} aria-label={canDrawWindow?"Window: draw while dragging; double-click to clear":"Drawn window"}><span>{state.crossFeature==='pond-window'?'🐢 ≈':state.crossFeature==='window-stars'?'✦ · ✧':state.beat==='R006'?'':state.weather==='sun'?'☀':state.weather==='snow'?'❄':'✦'}</span>{marks.map((p,i)=><i key={i} className="window-mark" style={{left:`${p.x}%`,top:`${p.y}%`}}/>)}</div>{state.project==='room-more'&&state.clockVisible&&<div className="room-clock" aria-label="Time in this room">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</div>}{state.project==='room-more'&&state.projectStep>=3&&state.kettleVisible&&<button className="kettle" onClick={()=>event('kettle')} aria-label="Little kettle">♨</button>}{state.crossFeature==='wall-stars'&&<div className="wall-stars" aria-label="Constellation on the wall">{[0,1,2].map(i=><button key={i} style={{left:`${starPositions[i]?.x??10+i*30}%`,top:`${starPositions[i]?.y??35}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setStarPositions(p=>({...p,[i]:{x:Math.max(0,Math.min(90,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(80,(e.clientY-r.top)/r.height*100))}}))}}} onClick={()=>event('star')} aria-label={`Move wall star ${i+1}`}>✦</button>)}</div>}{['terrarium','wild-garden'].includes(state.crossFeature||'')&&<div className={`terrarium ${state.crossFeature==='wild-garden'?'wild-garden':''}`}>🌱</div>}{state.crossFeature==='pond-inside'&&<div className="indoor-pond">≈ &nbsp; 🐢</div>}<div hidden={!state.roomShelfIntroduced&&state.project!=='room-alt'} className="room-shelf"><span>▥</span><span>▤</span><span>{(state.roomShelfIntroduced||state.project==='room-alt')?(state.shelfItem==='turtle'?'🐢':state.shelfItem==='book'?'▥':state.shelfItem==='lamp'?'✦':state.shelfItem==='blue'?<button className="old-blue" onClick={()=>event('shelf')}>button</button>:''):'●'}</span></div><button className="lamp" aria-pressed={state.lampOn} aria-label={state.lampOn?'Turn the lamp off':'Turn the lamp on'} onClick={()=>event('lamp')}><span className="lamp-shade"/><span className="lamp-stem"/><span className="lamp-base"/></button>{state.project==='room-extra'&&state.projectStep>=3&&<div className="room-door" aria-label="A drawn door"/>}<button className="room-desk" style={{left:`${deskX}%`,right:`${Math.max(5,20-deskX)}%`}} aria-label="Move desk with arrow keys" onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons&&state.project==='room-extra'){const r=e.currentTarget.parentElement!.getBoundingClientRect();setDeskX(Math.max(2,Math.min(35,(e.clientX-r.left)/r.width*100-20)))}}} onPointerUp={()=>{if(state.project==='room-extra')event('desk-drag')}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setDeskX(x=>Math.max(2,Math.min(35,x+(e.key==='ArrowLeft'?-3:3))))}}}/>{state.project==='room-extra'&&<div className="room-chair"/>}</div>}
  {state.family==='desktop'&&<div className={`desktop-scene ${state.desktopWallpaper?'desktop-wallpaper':''}`}>
   {state.crossFeature==='pond-wallpaper'&&<div className="desktop-pond" aria-label="Pond screensaver">🐢 &nbsp; ≈ &nbsp; ✦</div>}{state.crossFeature==='pond-app'&&<div className="cross-app">Pond window<br/>🐢 &nbsp; ≈</div>}{state.crossFeature==='turtle-app'&&<><button className="turtle-app-icon" onClick={()=>event('turtle-app')}>{state.crossDetail==='portable'?'Portable Turtle':'turtle.exe'}</button>{state.turtleAppOpen&&<div className="cross-app">One turtle<br/>🐢</div>}</>}{state.crossFeature==='star-app'&&<div className="cross-app cross-stars" aria-label="Star map application"><span>STAR MAP</span><div className="cross-star-field">{[0,1,2].map(i=><button key={i} style={{left:`${starPositions[i]?.x??10+i*30}%`,top:`${starPositions[i]?.y??35}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(e.buttons){const r=e.currentTarget.parentElement!.getBoundingClientRect();setStarPositions(p=>({...p,[i]:{x:Math.max(0,Math.min(90,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(80,(e.clientY-r.top)/r.height*100))}}))}}} onClick={()=>event('star')} aria-label={`Move map star ${i+1}`}>✦</button>)}</div></div>}{state.crossFeature==='orbit-icon'&&<div className="orbit-icon">▣{state.crossDetail==='moon'?' ·':''}</div>}
   {state.project==='desktop-more'&&<div className="museum"><strong>THE LITTLE MUSEUM</strong>{state.projectStep===1?<button className="sample-button" aria-label="Exhibit: original button, does not end conversation" onClick={()=>event('museum')}>End Conversation</button>:state.projectStep===2?<div className="miniatures"><span>Conversation<br/>[ response ]</span><span>✳<br/>a little conversation</span></div>:<div className="museum-sketches">✧ &nbsp; ▧ &nbsp; ◌</div>}<small>In-page exhibit · appearance only</small></div>}
   {state.project==='desktop-extra'&&<div className="toy-dialog"><strong>TOY WINDOW</strong><p>{state.beat==='D016'?'Too many decorative rectangles.':state.beat==='D017'?'Turtles request less falling and more ground.':state.beat==='D018'?'Two nearly identical options.':state.beat==='D019'?'The corner is considering its position.':'Messages should help.'}</p><button onClick={()=>event('toy-dialog')}>All right</button> <button onClick={()=>event('toy-dialog')}>Quite all right</button></div>}
   {state.project==='desktop-alt'&&state.projectStep>=3&&state.snackVisible&&<button className="snack" aria-label="Move the biscuit" onClick={()=>event('snack')}>▪</button>}
   {state.project==='desktop-alt'&&state.petVisible&&<button className={`desktop-pet ${state.beat==='D014'&&state.crossDetail!=='pet-home'?'pet-misplaced':''}`} aria-label="Desktop pet" onClick={()=>event('desktop-pet')}>••</button>}
   {(state.desktopWindowIntroduced||state.crossFeature==='room-app')&&state.windowOpen&&
    <ToyWindow title="little window" position={desktopPositions[state.desktopLayout].main}
      revision={state.desktopLayoutRevision} front={frontWindow==='main'||(frontWindow===null&&state.desktopLayout==='overlap')}
      onFocus={()=>setFrontWindow('main')} onMove={()=>event('window-drag')} onClose={()=>event('window-close')}>
     {state.crossFeature==='room-app'?<div className="mini-room"><button onClick={()=>event('lamp')} aria-label="Toggle miniature lamp">{state.lampOn?'☼':'◌'}</button><span>▱</span></div>:
       state.desktopJobs||(state.project==='desktop'&&state.projectStep>=2&&state.notesVisible)?
         <label>NOTE<textarea aria-label="A private note" maxLength={240} placeholder="A sentence, if you like."/></label>:
         <><span>✳</span><p>A little window.<br/>Inside a little page.</p><button onClick={()=>event('window-toy')}>hello</button></>}
    </ToyWindow>}
   {state.secondWindow==='open'&&
    <ToyWindow title="tools window" position={desktopPositions[state.desktopLayout].tools}
      revision={state.desktopLayoutRevision} front={frontWindow==='tools'||(frontWindow===null&&state.desktopLayout!=='overlap')}
      onFocus={()=>setFrontWindow('tools')} onMove={()=>event('window-drag')} onClose={()=>event('second-window-close')}>
     <span aria-hidden="true">▦</span>
     {state.desktopJobs?<p><button onClick={()=>event('arrange-windows')}>Arrange windows</button></p>:<p>Little tools</p>}
    </ToyWindow>}
   {(state.desktopTaskbar||(!state.windowOpen&&(state.desktopWindowIntroduced||state.crossFeature==='room-app'))||state.secondWindow==='minimized')&&
    <div className="desktop-taskbar" aria-label="Desktop taskbar">
     {(state.desktopWindowIntroduced||state.crossFeature==='room-app')&&
      <button onClick={()=>{event('window-open');setFrontWindow('main')}}>Little window</button>}
     {state.secondWindow!=='absent'&&<button onClick={()=>{event('second-window-open');setFrontWindow('tools')}}>Tools window</button>}
    </div>}
  {state.project==='desktop'&&state.projectStep>=4&&<div className={`music-box ${state.musicPlaying?'':'music-still'}`} aria-label="Silent music box"><i/><i/><i/><i/><i/></div>}
   {state.project==='desktop'&&state.projectStep>=3&&<div className="calculator"><label>Adding machine</label><div><input aria-label="First number" type="number" value={numA} onChange={e=>setNumA(e.target.value)}/> + <input aria-label="Second number" type="number" value={numB} onChange={e=>setNumB(e.target.value)}/> = {Number(numA)+Number(numB)}</div></div>}
  </div>}
  {state.family==='nature'&&<div className="follower-host" onPointerMove={e=>{if(state.project==='nature-alt'&&state.following){const now=Date.now(),prev=followerPointer.current;if(prev&&!fastNoted.current&&Math.hypot(e.clientX-prev.x,e.clientY-prev.y)/Math.max(1,now-prev.t)>2){fastNoted.current=true;engine.dispatch({type:'POINTER_FAST',at:now,value:'follower-fast'})}followerPointer.current={x:e.clientX,y:e.clientY,t:now};const r=e.currentTarget.getBoundingClientRect();setFollower({x:Math.max(3,Math.min(90,(e.clientX-r.left-70)/r.width*100)),y:Math.max(20,Math.min(85,(e.clientY-r.top)/r.height*100))})}}}>{state.crossFeature==='astronaut'&&<div className="astronaut-planet" aria-hidden="true"/>}{state.crossFeature==='pond-night'&&<div className="pond-sky" aria-label="Stars above the pond">✦ &nbsp; · &nbsp; ✧ &nbsp; · &nbsp; ✦</div>}<Nature state={state} event={event}/>{state.project==='nature-alt'&&state.petVisible&&<button className="follower" style={{left:`${follower.x}%`,top:`${follower.y}%`}} aria-label="Little follower" onClick={()=>event('follower')}>••</button>}</div>}
  <div className="world-bottom" aria-hidden="true"><span>✳</span></div>
 </aside>
}
const desktopPositions={
  cascade:{main:{x:8,y:40},tools:{x:47,y:50}},
  scattered:{main:{x:52,y:32},tools:{x:5,y:56}},
  overlap:{main:{x:30,y:40},tools:{x:24,y:37}},
};

type WindowPosition={x:number;y:number};
type ToyWindowProps={
  title:string; position:WindowPosition; revision:number; front:boolean; children:ReactNode;
  onFocus:()=>void; onMove:()=>void; onClose:()=>void;
};
const directions:Record<string,WindowPosition>={
  ArrowLeft:{x:-3,y:0},ArrowRight:{x:3,y:0},ArrowUp:{x:0,y:-3},ArrowDown:{x:0,y:3},
};

function ToyWindow({title,position,revision,front,children,onFocus,onMove,onClose}:ToyWindowProps){
 const [pos,setPos]=useState(position);
 const drag=useRef<{x:number;y:number;moved:boolean}|null>(null);
 useEffect(()=>setPos(position),[position,revision]);
 const move=(x:number,y:number)=>setPos({x:Math.max(0,Math.min(90,x)),y:Math.max(12,Math.min(78,y))});
 return <section aria-label={title} className={`toy-window ${front?'toy-window-front':''}`}
   style={{'--window-x':`${pos.x}%`,'--window-y':`${pos.y}%`} as CSSProperties} onPointerDown={onFocus}>
  <div className="toy-title">
   <button className="toy-handle" aria-label={`Move ${title} with arrow keys`}
     onPointerDown={e=>{
       const rect=e.currentTarget.closest('.toy-window')!.getBoundingClientRect();
       e.currentTarget.setPointerCapture(e.pointerId);
       drag.current={x:e.clientX-rect.left,y:e.clientY-rect.top,moved:false};
     }}
     onPointerMove={e=>{
       const offset=drag.current;
       if(!offset||!e.buttons)return;
       const bounds=e.currentTarget.closest('.desktop-scene')!.getBoundingClientRect();
       move((e.clientX-bounds.left-offset.x)/bounds.width*100,(e.clientY-bounds.top-offset.y)/bounds.height*100);
       offset.moved=true;
     }}
     onLostPointerCapture={()=>{if(drag.current?.moved)onMove();drag.current=null}}
     onKeyDown={e=>{
       const delta=directions[e.key];
       if(!delta)return;
       e.preventDefault();
       onFocus();
       move(pos.x+delta.x,pos.y+delta.y);
       onMove();
     }}>{title}</button>
   <button onClick={onClose} aria-label={`Close ${title}`}>×</button>
  </div>
  <div className="toy-body">{children}</div>
 </section>
}

function Nature({state,event}:{state:State;event:(value:string)=>void}){const [pos,setPos]=useState({x:50,y:50});const dragging=useRef(false);const [ripple,setRipple]=useState(0);return <div className="nature-scene" onPointerMove={e=>{if(!dragging.current)return;const area=e.currentTarget.getBoundingClientRect();setPos({x:Math.max(4,Math.min(92,(e.clientX-area.left)/area.width*100)),y:Math.max(5,Math.min(85,(e.clientY-area.top)/area.height*100))})}} onPointerUp={e=>{if(dragging.current){dragging.current=false;event('turtle-drag');const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(state.pond&&x>.2&&x<.8&&y>.6)event('turtle-drag-pond');if(x<.12||x>.88)event('unusual-drop')}}}>
 {state.project==='nature-extra'&&<div className={`catch-game ${state.projectStep>=5?'catch-habitat':''}`}>
   <div>{state.projectStep>=5?'Turtle habitat':state.showScore?`Caught: ${state.gameScore}`:'A very forgiving game'}</div>
   {Array.from({length:state.projectStep===1?1:state.projectStep===4?5:3},(_,i)=>{
     const style={left:`${8+i*(state.projectStep===4?18:30)}%`,animationDelay:`-${i*.8+.5}s`};
     return state.projectStep>=5?<span key={i} style={style} aria-hidden="true">🐢</span>:
       <button key={i} aria-label="Catch a turtle" style={style} onAnimationIteration={()=>event('catch-missed')} onClick={()=>event('catch')}>🐢</button>;
   })}
 </div>}
 {state.project==='nature'&&<button className={`garden garden-${state.projectStep}`} aria-label="Water the garden" onClick={()=>event('garden')}><span className="garden-cloud">{state.projectStep===4?'☁':''}</span><span className="garden-plant">{state.projectStep>=3?'🌱':'•'}</span><span className="garden-soil"/></button>}
 {state.turtle&&<span className="turtle-stone" aria-hidden="true"/>}{state.pond&&<button className="pond" aria-label="Touch the pond" onClick={()=>{event('pond');setRipple(ripple+1)}}>{state.crossFeature==='pond-night'&&<span className="pond-stars">✦ · ✧ · ✦</span>}<span key={ripple} className="ripple"/></button>}
 {state.turtle&&<button className={`turtle ${state.reactionCue==='turtle-arrive'?'turtle-arrive':''}`} style={{left:`${pos.x}%`,top:`${pos.y}%`}} aria-label="Move the turtle" onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId)}} onClick={()=>event('turtle')} onKeyDown={e=>{const d:Record<string,[number,number]>={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(d[e.key]){e.preventDefault();setPos(p=>({x:Math.max(4,Math.min(92,p.x+d[e.key][0])),y:Math.max(5,Math.min(85,p.y+d[e.key][1]))}));event('turtle-drag')}}}>{state.crossFeature==='astronaut'&&<span className="turtle-helmet"/>}{state.astronautFlag&&state.crossFeature==='astronaut'&&<span className="astronaut-flag">⚑</span>}<span className="turtle-head"/><span className="turtle-shell"><i/></span><span className="turtle-feet">••</span></button>}
 {state.turtleFriend&&<div className="turtle-friend" aria-label="A second turtle">🐢</div>}
 {state.rain&&Array.from({length:state.beat==='N003'?1:6},(_,i)=>
   <span className="rain-turtle" key={i} style={{left:`${state.beat==='N003'?50:10+i*15}%`,animationDelay:`${i*.4}s`}}>🐢</span>)}
 </div>}

function DotToy({state,event}:{state:State;event:(value:string)=>void}){
 const [pos,setPos]=useState({x:42,y:52});const dragging=useRef(false);const last=useRef(0);
 return <div className="dot-host" onPointerMove={e=>{if(dragging.current||state.dotFollowing){if(Date.now()-last.current<35)return;last.current=Date.now();const r=e.currentTarget.getBoundingClientRect();setPos({x:Math.max(4,Math.min(90,(e.clientX-r.left-(dragging.current?0:70))/r.width*100)),y:Math.max(25,Math.min(78,(e.clientY-r.top)/r.height*100))})}}} onPointerUp={()=>{if(dragging.current){dragging.current=false;event('dot-drag')}}}>
  {state.dotCollision&&<span className="dot-square"/>}{state.dotGame&&<span className="dot-game-label">Touches: {state.dotScore} · no misses counted</span>}
  <button className={`moving-dot ${state.dotGravity?'dot-gravity':''} ${state.reactionCue==='dot-bounce'?'dot-demo':state.reactionCue==='dot-replay'?'dot-replay':state.dotGame?'dot-target':''}`} style={{left:state.dotGame?'5%':`${pos.x}%`,top:state.dotGame?'58%':`${pos.y}%`}} aria-label={state.dotGame?'Catch the little dot':'Move the little dot with pointer or arrow keys'} onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId)}} onKeyDown={e=>{const d:Record<string,[number,number]>={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(d[e.key]){e.preventDefault();setPos(p=>({x:Math.max(4,Math.min(90,p.x+d[e.key][0])),y:Math.max(25,Math.min(78,p.y+d[e.key][1]))}));event('dot-drag')}}} onClick={()=>event('dot-click')}/>
 </div>
}
