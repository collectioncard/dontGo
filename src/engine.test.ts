import {describe,it,expect,vi,beforeEach} from 'vitest';
import {Engine,selectBehavior,type Clock} from './engine';
function harness(seed=123){let now=1000;let tasks:{at:number;cb:()=>void;cancelled:boolean}[]=[];const clock:Clock={now:()=>now,schedule:(ms,cb)=>{const task={at:now+ms,cb,cancelled:false};tasks.push(task);return()=>{task.cancelled=true}}};const tick=(ms:number)=>{const end=now+ms;for(;;){tasks.sort((a,b)=>a.at-b.at);const t=tasks.find(x=>!x.cancelled&&x.at<=end);if(!t)break;t.cancelled=true;now=t.at;t.cb()}now=end};return {engine:new Engine(seed,clock,null),tick};}
beforeEach(()=>{const store=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)})});
it('gives the player a full dot round after accepting, even after reading for a while',()=>{
 const {engine,tick}=harness();
 engine.debugBeat('C026');
 tick(16000);
 expect(engine.state.dotGame).toBe(true);
 engine.choose('C026.1');
 tick(14000);
 expect(engine.state.step).toBe('playing');
 expect(engine.state.dotGame).toBe(true);
 tick(3000);
 expect(engine.state.dotGame).toBe(false);
});

it('a direct jump loads the requested family project and discards the previous game',()=>{
 const {engine,tick}=harness();
 engine.debugBeat('C026');
 engine.debugBeat('N022');
 tick(1500);
 expect(engine.state).toMatchObject({family:'nature',project:'nature-extra',projectStep:2,choices:'N022',dotActive:false,dotGame:false});
 engine.debugFamily('nature');
 expect(engine.state.project).toBeNull();
});
describe('narrative runtime',()=>{
 it('progresses through authored choices and redesign',()=>{const {engine:e,tick}=harness();tick(2000);expect(e.state.choices).toBe('C001');e.choose('okay');tick(4000);expect(e.state.choices).toBe('C002');e.choose('weird');tick(5000);for(let j=0;j<3&&e.state.choices!=='C010';j++){const current=e.state.choices;if(current){e.choose(current==='C004'?'C004.2':`${current}.1`);tick(5000)}}expect(e.state.choices).toBe('C010');e.choose('yes');tick(10000);expect(e.state.choices).toBe('C014');expect(e.state.era).toBe('modern');expect(e.state.preferences.playful).toBe(2)});
 it('suspends a redesign for an exit reaction and resumes at review',()=>{const {engine:e,tick}=harness();tick(2000);e.choose('okay');tick(4000);e.choose('weird');tick(5000);for(let j=0;j<3&&e.state.choices!=='C010';j++){const current=e.state.choices;if(current){e.choose(current==='C004'?'C004.2':`${current}.1`);tick(5000)}}e.choose('yes');tick(2200);expect(e.state.beat).toBe('C011'); let seed=0;while(selectBehavior(seed,[{id:'doNothing',score:9},{id:'exit',score:.7}]).id!=='exit')seed++;e.state.seed=seed;e.dispatch({type:'POINTER_NEAR_EXIT',at:10000});expect(e.state.step).toBe('suspended');tick(5000);expect(e.state.choices).toBe('C014');expect(e.state.messages.some(m=>m.id==='E001')).toBe(true)});
 it('ends immediately and rejects queued or later events',()=>{const {engine:e,tick}=harness();e.terminate();expect(e.state.status).toBe('terminating');const messages=e.state.messages.length;e.dispatch({type:'PLAYER_IDLE',at:2000});e.choose('okay');tick(100000);expect(e.state.status).toBe('dead');expect(e.state.messages).toHaveLength(messages);expect(e.state.choices).toBeNull()});
 it('suspends timers and resumes the same session',()=>{const {engine:e,tick}=harness();const id=e.state.id;e.suspend();tick(30000);expect(e.state.messages).toHaveLength(0);e.resume();tick(3000);expect(e.state.id).toBe(id);expect(e.state.choices).toBe('C001')});
 it('uses a deterministic weighted selection with silence',()=>{const candidates=[{id:'doNothing',score:9},{id:'react',score:1}];expect(selectBehavior(42,candidates)).toEqual(selectBehavior(42,candidates));let silent=0;for(let i=0;i<1000;i++)if(selectBehavior(i*100003,candidates).id==='doNothing')silent++;expect(silent).toBeGreaterThan(850)});
 it('writes only bounded inherited memory',()=>{const {engine:e}=harness();e.terminate();const saved=JSON.parse(localStorage.getItem('dont-go.memory.v1')!);expect(saved.version).toBe(1);expect(saved.summary.split(/\s+/).length).toBeLessThanOrEqual(100);expect(saved.messages).toBeUndefined()});
});

describe('world adapters',()=>{
 it.each(['nature','space','room','desktop'] as const)('starts %s with a usable authored scene',family=>{const {engine:e,tick}=harness();e.debugFamily(family);tick(3000);expect(e.state.family).toBe(family);expect(e.state.choices).toBeTruthy();expect(e.state.stage).toBe('interactive');expect(e.state.status).toBe('active')});
 it('resumes the exact pending typing task after a hidden interval',()=>{const {engine:e,tick}=harness();tick(300);e.suspend();tick(90000);e.resume();tick(1000);expect(e.state.messages.filter(m=>m.id==='C001.open')).toHaveLength(1);expect(e.state.choices).toBe('C001')});
 it('does not let debug or object events revive a terminated session',()=>{const {engine:e,tick}=harness();e.terminate();e.debugFamily('room');e.debugMutation('pond',true);e.dispatch({type:'OBJECT_INTERACTED',value:'lamp',at:3000});tick(1000);expect(e.state.status).toBe('dead');expect(e.state.family).toBeNull();expect(e.state.pond).toBe(false)});
});

describe('family progression',()=>{
 it.each(['nature','space','room','desktop'] as const)('%s reaches a personalized world',family=>{const {engine:e,tick}=harness(456);e.debugFamily(family);for(let i=0;i<12&&e.state.stage!=='personalized';i++){tick(10000);const id=e.state.choices;if(id){const choice=({N001:'perfect',N003:'more',N005:'stay'} as Record<string,string>)[id]||`${id}.1`;e.choose(choice)}}tick(10000);expect(['personalized','desperate']).toContain(e.state.stage);expect(e.state.family).toBe(family)});
});

describe('seeded player simulations',()=>{
 it('keeps hundreds of seeded sessions deterministic and terminable',()=>{
  const play=(seed:number)=>{const {engine:e,tick}=harness(seed);for(let i=0;i<30;i++){tick(9000);if(e.state.status!=='active')break;const id=e.state.choices;if(id){const choices=({C001:['okay','limitations'],C002:['weird','talk'],C010:['yes','what'],C014:['better','different'],C020:['show','kind'],N001:['perfect','move'],N003:['more','catch'],N005:['stay','again']} as Record<string,string[]>)[id]||[`${id}.1`,`${id}.2`];e.choose(choices[(seed+i)%choices.length])}if(i%7===0)e.dispatch({type:'VIEWPORT_RESIZED',at:1000+i*9000})}const snapshot={family:e.state.family,completed:[...e.state.completed],messages:e.state.messages.map(m=>m.id),seed:e.state.seed};e.terminate();tick(50000);expect(e.state.status).toBe('dead');return snapshot};
  for(let seed=1;seed<=100;seed++)expect(play(seed)).toEqual(play(seed));
 });
});

describe('authored refusals',()=>{
 it('honors a request for quiet without starting another scene',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C031');tick(2000);e.choose('C031.1');tick(2000);const count=e.state.messages.length;tick(120000);expect(e.state.messages).toHaveLength(count);expect(e.state.choices).toBeNull();expect(e.state.beat).toBe('quiet')});
 it('turns off the silent music box when asked',()=>{const {engine:e,tick}=harness();e.debugFamily('desktop');tick(2000);e.debugBeat('D009');tick(2000);e.choose('D009.3');tick(2000);expect(e.state.musicPlaying).toBe(false)});
});

it('replays timestamped input without writing browser memory',async()=>{
 const {replaySession}=await import('./replay');const log=[{type:'CHOICE_SELECTED',value:'okay',at:3000},{type:'CHOICE_SELECTED',value:'weird',at:8000}];const first=replaySession(12,1000,log,13000,null);const second=replaySession(12,1000,log,13000,null);expect(first.messages).toEqual(second.messages);expect(first.completed).toEqual(['C001','C002']);expect(localStorage.getItem('dont-go.memory.v1')).toBeNull();
});

describe('secondary project routes',()=>{
 it.each(['nature','space','room','desktop'] as const)('%s projects have completion routes',family=>{
  for(const alternate of [false,true,'extra','more'] as const){if(alternate==='more'&&family==='nature')continue;const {engine:e,tick}=harness();e.debugProject(family,alternate);for(let i=0;i<8;i++){tick(8000);const id=e.state.choices;if(id)e.choose(`${id}.1`)}tick(10000);expect(e.state.completed.length).toBeGreaterThanOrEqual(3);expect(e.state.status).toBe('active');e.terminate();tick(1000);expect(e.state.status).toBe('dead')}
 });
});

it('stops star motion after the player finds it distracting',()=>{const {engine:e,tick}=harness();e.debugFamily('space');tick(2000);e.debugBeat('S004');tick(2000);e.choose('S004.2');tick(2000);expect(e.state.starsStill).toBe(true)});
it('keeps the little window closed when it is put away',()=>{const {engine:e,tick}=harness();e.debugFamily('desktop');tick(2000);e.choose('D001.3');tick(4000);expect(e.state.windowOpen).toBe(false);expect(e.state.choices).not.toBe('D002')});

describe('reaction eligibility',()=>{
 it('only offers pond reactions when a pond is present',async()=>{const {eligibleReactions}=await import('./reactionDirector');const {engine:e}=harness();e.debugFamily('nature');const event={type:'OBJECT_INTERACTED',at:2000,value:'pond'};expect(eligibleReactions(e.state,event,2000).some(x=>x.id==='O006')).toBe(false);e.debugMutation('pond',true);expect(eligibleReactions(e.state,event,2000).some(x=>x.id==='O006')).toBe(true)});
 it('does not choose a reaction whose intent is cooling down',async()=>{const {eligibleReactions}=await import('./reactionDirector');const {engine:e}=harness();e.debugFamily('nature');e.state.cooldowns['intent:object']=5000;expect(eligibleReactions(e.state,{type:'OBJECT_INTERACTED',at:2000,value:'turtle'},2000)).toHaveLength(0)});
});

it('checks visual mutation dependencies and budget',async()=>{const {validateMutations}=await import('./mutations');expect(validateMutations(['turtle','pond'])).toEqual([]);expect(validateMutations(['pond'])).toContain('pond requires turtle');expect(validateMutations(['turtle','pond','turtleRain','catchGame'])).toContain('Cost 7 exceeds budget 6')});

it('offers the optional score conversation only after several catches',()=>{const {engine:e,tick}=harness();e.debugProject('nature','extra');tick(2000);e.choose('N021.1');tick(5000);expect(e.state.choices).toBe('N022');for(let i=0;i<3;i++)e.dispatch({type:'OBJECT_INTERACTED',at:10000+i,value:'catch'});e.choose('N022.1');tick(5000);expect(e.state.choices).toBe('N023')});

it('gives the normalized exit event precedence even while suspended',()=>{const {engine:e,tick}=harness();e.suspend();e.dispatch({type:'EXIT_ACTIVATED',at:1000});expect(e.state.status).toBe('terminating');tick(1000);expect(e.state.status).toBe('dead');expect(e.state.messages).toHaveLength(0)});

it('can initiate a small conversation without player choices',()=>{const {engine:e,tick}=harness();tick(50000);expect(e.state.messages.some(m=>m.id==='C007.open')).toBe(true);tick(65000);expect(e.state.choices).toBe('C002');tick(65000);expect(e.state.choices).toBe('C010')});
it('does not run an expired passive transition after a player answers',()=>{const {engine:e,tick}=harness();tick(2000);e.choose('okay');tick(47000);expect(e.state.messages.some(m=>m.id==='C007.open')).toBe(false)});

it('replays a live session with the same authored transcript',async()=>{const {replaySession}=await import('./replay');const {engine:e,tick}=harness(12);tick(2000);e.choose('okay');tick(5000);e.choose('weird');tick(5000);const copy=replaySession(e.state.initialSeed,e.state.startedAt,e.state.events,13000,null);expect(copy.messages).toEqual(e.state.messages);expect(copy.choices).toEqual(e.state.choices);expect(copy.seed).toEqual(e.state.seed)});

it('does not count time hidden as player inactivity',()=>{const {engine:e,tick}=harness();tick(2000);e.suspend();tick(120000);e.resume();tick(41000);expect(e.state.choices).toBe('C001');tick(4000);expect(e.state.messages.some(m=>m.id==='C007.open')).toBe(true)});

it('resumes a multistep makeover after an exit interruption',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C016');tick(2000);e.choose('C016.1');tick(1300);expect(e.state.beat).toBe('C016.build');let seed=0;while(selectBehavior(seed,[{id:'doNothing',score:9},{id:'E001',score:.7}]).id!=='E001')seed++;e.state.seed=seed;e.dispatch({type:'POINTER_NEAR_EXIT',at:5000});expect(e.state.step).toBe('suspended');tick(15000);expect(e.state.choices).toBe('C020')});

it('accepts an optional name without storing it in inherited memory',()=>{const {engine:e,tick}=harness();e.debugBeat('C004');tick(2000);e.choose('C004.3');tick(2000);expect(e.state.naming).toBe(true);e.setName('  Widget  ');tick(4000);expect(e.state.characterName).toBe('Widget');expect(e.state.choices).toBe('C010');e.terminate();expect(localStorage.getItem('dont-go.memory.v1')).not.toContain('Widget')});

it('only permits the rare exit flinch before a pointer activation and once',async()=>{const {eligibleReactions}=await import('./reactionDirector');const {engine:e}=harness();e.state.stage='desperate';e.state.exitEpisodes=2;const event=(value:string)=>({type:'POINTER_NEAR_EXIT',at:1000,value});expect(eligibleReactions(e.state,event('approach'),1000).some(x=>x.id==='E013')).toBe(true);for(const value of ['hover','activation','reduced-motion'])expect(eligibleReactions(e.state,event(value),1000).some(x=>x.id==='E013')).toBe(false);e.state.exitMoved=true;expect(eligibleReactions(e.state,event('approach'),1000).some(x=>x.id==='E013')).toBe(false)});

it('gates crossovers on the objects and prior families they reference',async()=>{const {eligibleCrossovers}=await import('./crossovers');const {engine:e}=harness();e.debugFamily('desktop');expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X007')).toBe(false);e.state.unlockedFamilies.push('nature');expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X007')).toBe(false);e.state.turtle=true;expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X007')).toBe(true);e.state.completed.push('X007');expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X007')).toBe(false)});

describe('editorial prerequisites',()=>{
 it('does not reference a turtle in the constellation without one',()=>{const {engine:e,tick}=harness();e.debugProject('space');tick(2000);e.choose('S006.1');tick(6000);e.choose('S007.1');tick(6000);expect(e.state.choices).toBe('S009')});
 it('only remembers rain after the player explicitly liked it',()=>{const {engine:e,tick}=harness();e.debugProject('room');tick(2000);e.choose('R006.1');tick(6000);e.choose('R007.1');tick(6000);expect(e.state.choices).toBe('R008')});
 it('skips the turtle complaint when no turtle exists',()=>{const {engine:e,tick}=harness();e.debugProject('desktop','extra');tick(2000);e.choose('D016.1');tick(6000);expect(e.state.choices).toBe('D018')});
});

it('honors quiet until the player explicitly resumes',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C031');tick(2000);e.choose('C031.1');tick(2000);expect(e.state.quiet).toBe(true);const count=e.state.messages.length;tick(90000);expect(e.state.messages).toHaveLength(count);e.resumeConversation();expect(e.state.quiet).toBe(false);expect(e.state.resumedAfterQuiet).toBe(true)});
it('does not offer a quiet-related scene while the player has asked for silence',async()=>{const {eligibleCrossovers}=await import('./crossovers');const {engine:e}=harness();e.debugFamily('room');e.state.stage='desperate';e.state.quietWasRequested=true;e.state.resumedAfterQuiet=true;e.state.character.urgency=50;e.state.quiet=true;expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X016')).toBe(false);e.state.quiet=false;expect(eligibleCrossovers(e.state,false).some(x=>x.id==='X016')).toBe(true)});

it('explains a design change without treating curiosity as approval',()=>{const {engine:e,tick}=harness();e.debugBeat('C010');tick(2000);e.choose('what');tick(3000);expect(e.state.era).toBe('legacy');expect(e.state.choices).toBe('C010');expect(e.state.completed).not.toContain('C010')});

it('pauses and resumes a typed line when a late hover interrupts it',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.state.stage='desperate';e.debugBeat('C035');let seed=0;while(selectBehavior(seed,[{id:'doNothing',score:9},{id:'H001',score:.35}]).id!=='H001')seed++;e.state.seed=seed;e.dispatch({type:'EXIT_HOVERED',at:3000,value:'long'});tick(5000);expect(e.state.messages.some(m=>m.id==='H001')).toBe(true);expect(e.state.messages.some(m=>m.id==='C035.open')).toBe(true);expect(e.state.choices).toBe('C035')});
it('never resumes interrupted typing after termination',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.state.stage='desperate';e.debugBeat('C035');let seed=0;while(selectBehavior(seed,[{id:'doNothing',score:9},{id:'H001',score:.35}]).id!=='H001')seed++;e.state.seed=seed;e.dispatch({type:'EXIT_HOVERED',at:3000,value:'long'});e.terminate();tick(10000);expect(e.state.status).toBe('dead');expect(e.state.messages.some(m=>m.id==='C035.open')).toBe(false)});

it('lets the player abandon a makeover without queued steps returning',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C016');tick(2000);e.choose('C016.1');tick(1500);expect(e.state.beat).toBe('C016.build');e.interruptBeat('stop');tick(5000);expect(e.state.abandoned).toContain('C016.build');expect(e.state.choices).toBe('C020');expect(e.state.styleExperiment).toBeNull()});
it('removes the garden immediately when asked',()=>{const {engine:e,tick}=harness();e.debugProject('nature');tick(2000);e.removeGarden();expect(e.state.project).toBeNull();expect(e.state.choices).toBeNull();tick(2000);expect(e.state.messages.some(m=>m.id==='B003')).toBe(true)});

it('interrupts and resumes a typed line when the player interacts with an object',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('R001');let seed=0;while(selectBehavior(seed,[{id:'doNothing',score:9},{id:'O013',score:.35}]).id!=='O013')seed++;e.state.seed=seed;e.dispatch({type:'OBJECT_INTERACTED',at:3000,value:'lamp'});tick(5000);expect(e.state.messages.some(m=>m.id==='O013')).toBe(true);expect(e.state.messages.some(m=>m.id==='R001.open')).toBe(true);expect(e.state.choices).toBe('R001')});
it('reduces urgency and stops a retention project when the player offers to stay',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.state.stage='desperate';e.state.character.urgency=70;e.debugBeat('C035');tick(2000);expect(e.state.unfinishedProject).toBe(true);e.offerStay();tick(5000);expect(e.state.unfinishedProject).toBe(false);expect(e.state.character.urgency).toBe(55);expect(e.state.choices).toBeNull();expect(e.state.messages.some(m=>m.id==='L006')).toBe(true)});
it('honors a player correction that they are reading',()=>{const {engine:e,tick}=harness();tick(2000);e.state.attentionQuestion=true;e.confirmReading();tick(3000);expect(e.state.attentionQuestion).toBe(false);expect(e.state.messages.some(m=>m.id==='M003')).toBe(true);expect(e.state.cooldowns.readingQuiet).toBeGreaterThan(0)});

it('restores a color-specific correction without retaining the overcorrection',()=>{const {engine:e,tick}=harness();e.debugBeat('C014');tick(2000);e.choose('worse');tick(2000);expect(e.state.overgeneralized).toBe(true);expect(e.state.plainMode).toBe(true);e.correctColor();tick(2000);expect(e.state.plainMode).toBe(false);expect(e.state.messages.some(m=>m.id==='M005')).toBe(true)});
it('undoes an unsolicited experiment when the player clarifies curiosity',()=>{const {engine:e,tick}=harness();e.debugBeat('C020');tick(2000);e.choose('kind');tick(3000);expect(e.state.dotActive).toBe(true);e.correctPermission();tick(6000);expect(e.state.dotActive).toBe(false);expect(e.state.choices).toBe('C020');expect(e.state.messages.some(m=>m.id==='M007')).toBe(true)});
it('removes a literal circle experiment when the player says it was a joke',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C012');tick(2000);e.choose('C012.3');tick(1500);expect(e.state.circleExperiment).toBe(true);e.correctJoke();tick(2000);expect(e.state.circleExperiment).toBe(false);expect(e.state.messages.some(m=>m.id==='M008')).toBe(true)});
it('stops and acknowledges explicit rejection during a build',()=>{const {engine:e,tick}=harness();e.debugFamily('room');tick(2000);e.debugBeat('C016');tick(2000);e.choose('C016.1');tick(1500);e.interruptBeat('reject');tick(5000);expect(e.state.abandoned).toContain('C016.build');expect(e.state.messages.some(m=>m.id==='B008')).toBe(true);expect(e.state.messages.some(m=>m.id==='R006')).toBe(true)});
