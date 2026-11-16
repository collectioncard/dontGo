import { scenes, familyArcs, secondaryArcs, alternateArcs, extraArcs, moreArcs, authoredEffects, type Family } from './content';
import {inspectReactions} from './reactionDirector';
import {eligibleCrossovers} from './crossovers';
import type { InheritedMemoryV1 } from '../dont-go-contracts';

export type Status = 'active'|'suspended'|'terminating'|'dead';
export type Event = {type:string; at:number; value?:string; source?:'autonomous'};
export type Message = {id:string; text:string; speaker:'ai'|'player'};
export type State = {id:string; status:Status; seed:number; initialSeed:number; startedAt:number; stage:string; era:string; beat:string; step:string; messages:Message[]; choices:string|null; typing:boolean; turtle:boolean; turtleFriend:boolean; rain:boolean; pond:boolean; family:Family|null; unlockedFamilies:Family[]; lampOn:boolean; roomWindowIntroduced:boolean; roomShelfIntroduced:boolean; desktopWindowIntroduced:boolean; windowOpen:boolean; secondWindow:'absent'|'open'|'minimized'; desktopLayout:'cascade'|'scattered'|'overlap'; desktopLayoutRevision:number; desktopJobs:boolean; desktopTaskbar:boolean; desktopWallpaper:boolean; stars:number; starsStill:boolean; exitEpisodes:number; hoverEpisodes:number; hoverAcknowledged:boolean; exitMoved:boolean; exitShifted:boolean; lastApproval:number; lastRejection:number; project:string|null; projectStep:number; weather:'rain'|'sun'|'snow'; notesVisible:boolean; musicPlaying:boolean; curtainsClosed:boolean; moonVisible:boolean; petVisible:boolean; following:boolean; snackVisible:boolean; shelfItem:string; gameScore:number; showScore:boolean; clockVisible:boolean; kettleVisible:boolean; gravityMotion:boolean; playedProjects:string[]; unfinishedProject:boolean; dotActive:boolean; dotGravity:boolean; dotFollowing:boolean; dotGame:boolean; dotScore:number; dotCollision:boolean; desktopTidied:boolean; projectStartedAt:number; projectInteracted:boolean; interactionBeats:number; crossFeature:string|null; crossDetail:string; quiet:boolean; quietWasRequested:boolean; resumedAfterQuiet:boolean; approvals:number; rejections:number; abandonedProject:boolean; gameKept:boolean; plainMode:boolean; attentionQuestion:boolean; boundaryAsked:boolean; stayOffered:boolean; favoriteDismissed:boolean; overgeneralized:boolean; permissionAssumed:boolean; permissionCorrected:boolean; circleExperiment:boolean; turtleAppOpen:boolean; constellationKept:boolean; orbitKept:boolean; shelfCleared:boolean; cometPinned:boolean; constellationDotted:boolean; orbitWide:boolean; reactionCue:string|null; spacingRefined:boolean; layoutNudge:boolean; astronautFlag:boolean; styleExperiment:string|null; squareCorners:boolean; characterName:string; naming:boolean; preferences:Record<string,number>; character:Record<string,number>; tension:number; events:Event[]; completed:string[]; abandoned:string[]; candidates:{id:string; score:number; reason:string}[]; lastDecision:string; cooldowns:Record<string,number>; recentReactions:string[]; memory:InheritedMemoryV1|null; memorySaved:boolean};
export type Clock = {now:()=>number; schedule:(ms:number,cb:()=>void)=>()=>void};
export const browserClock:Clock = {now:()=>Date.now(),schedule:(ms,cb)=>{const id=setTimeout(cb,ms);return()=>clearTimeout(id)}};
export function random(seed:number):[number,number] { const next=(Math.imul(seed,1664525)+1013904223)>>>0; return [next/4294967296,next]; }
export function selectBehavior(seed:number, candidates:{id:string;score:number}[]) {const total=candidates.reduce((a,c)=>a+Math.max(0,c.score),0); const [n,next]=random(seed); let x=n*total; for(const c of candidates){x-=Math.max(0,c.score);if(x<0)return {id:c.id,seed:next};} return {id:'doNothing',seed:next};}
const key='dont-go.memory.v1';
export function loadMemory():InheritedMemoryV1|null {try {const v=JSON.parse(localStorage.getItem(key)||'null');return v?.version===1 && typeof v.updatedAtIso==='string' && typeof v.summary==='string' && Array.isArray(v.tags) && v.tags.every((x:unknown)=>typeof x==='string') && Array.isArray(v.highlights) && v.highlights.every((x:unknown)=>typeof x==='string')?{version:1,updatedAtIso:v.updatedAtIso,summary:v.summary.split(/\s+/).slice(0,100).join(' '),tags:v.tags.slice(0,4).map((x:string)=>x.slice(0,40)),highlights:v.highlights.slice(0,4).map((x:string)=>x.slice(0,120))}:null;}catch{return null;}}
export function clearMemory(){try{localStorage.removeItem(key)}catch{/* storage is optional */}}
export class Engine {
  state:State; private listeners=new Set<()=>void>(); private tasks=new Set<{cancel:()=>void; due:number; cb:()=>void}>(); private clock:Clock; private disposed=false; private suspendedTasks:{ms:number;cb:()=>void}[]=[]; private beatToken=0; private speechToken=0; private lastInteraction=0; private suspendedAt=0; private hiddenTotal=0; private quietRequested=false; private pendingSpeech:{text:string;id:string;done?:()=>void;cancel:()=>void}|null=null;
  constructor(seed=Date.now()>>>0,clock:Clock=browserClock,memory=loadMemory(),private persistence=true) {this.clock=clock;this.lastInteraction=clock.now();this.state={id:`${seed.toString(36)}-${clock.now().toString(36)}`,status:'active',seed,initialSeed:seed,startedAt:clock.now(),stage:'legacy',era:'legacy',beat:'C001',step:'opening',messages:[],choices:null,typing:false,turtle:false,turtleFriend:false,rain:false,pond:false,family:null,unlockedFamilies:[],lampOn:false,roomWindowIntroduced:false,roomShelfIntroduced:false,desktopWindowIntroduced:false,windowOpen:true,secondWindow:'absent',desktopLayout:'cascade',desktopLayoutRevision:0,desktopJobs:false,desktopTaskbar:false,desktopWallpaper:false,stars:0,starsStill:false,exitEpisodes:0,hoverEpisodes:0,hoverAcknowledged:false,exitMoved:false,exitShifted:false,lastApproval:0,lastRejection:0,project:null,projectStep:0,weather:'rain',notesVisible:false,musicPlaying:true,curtainsClosed:false,moonVisible:true,petVisible:true,following:true,snackVisible:true,shelfItem:'',gameScore:0,showScore:true,clockVisible:true,kettleVisible:true,gravityMotion:true,playedProjects:[],unfinishedProject:false,dotActive:false,dotGravity:false,dotFollowing:false,dotGame:false,dotScore:0,dotCollision:false,desktopTidied:false,projectStartedAt:0,projectInteracted:false,interactionBeats:0,crossFeature:null,crossDetail:'',quiet:false,quietWasRequested:false,resumedAfterQuiet:false,approvals:0,rejections:0,abandonedProject:false,gameKept:false,plainMode:false,attentionQuestion:false,boundaryAsked:false,stayOffered:false,favoriteDismissed:false,overgeneralized:false,permissionAssumed:false,permissionCorrected:false,circleExperiment:false,turtleAppOpen:false,constellationKept:false,orbitKept:false,shelfCleared:false,cometPinned:false,constellationDotted:false,orbitWide:false,reactionCue:null,spacingRefined:false,layoutNudge:false,astronautFlag:false,styleExperiment:null,squareCorners:false,characterName:'UNKNOWN',naming:false,preferences:{},character:{fear:15,attachment:10,confidence:35,curiosity:50,frustration:0,playfulness:25,urgency:10},tension:10,events:[],completed:[],abandoned:[],candidates:[],lastDecision:'none',cooldowns:{},recentReactions:[],memory,memorySaved:false}; this.say(scenes.C001.line,'C001.open',()=>{this.state.choices='C001';this.emit();this.passiveOpportunity('C001')}); this.schedule(18000,()=>this.autonomous());}
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>this.listeners.delete(fn)};
  private emit(){this.state={...this.state};this.listeners.forEach(f=>f())}
  private schedule(ms:number,cb:()=>void):()=>void{if(this.disposed||this.state.status!=='active')return()=>{};const task={cancel:()=>{},due:this.clock.now()+ms,cb};task.cancel=this.clock.schedule(ms,()=>{this.tasks.delete(task);if(this.state.status==='active'&&!this.disposed)cb()});this.tasks.add(task);return()=>{task.cancel();this.tasks.delete(task)}}
  private cancel(){this.tasks.forEach(t=>t.cancel());this.tasks.clear();this.suspendedTasks=[];this.pendingSpeech=null;this.state.typing=false}
  private say(text:string,id:string,done?:()=>void){if(this.state.status!=='active')return;this.pendingSpeech?.cancel();this.state.typing=true;this.emit();const token=this.beatToken;const speech=++this.speechToken;const cancel=this.schedule(Math.min(1200,350+text.length*10),()=>{if(token!==this.beatToken||speech!==this.speechToken)return;this.pendingSpeech=null;this.state.typing=false;this.state.messages=[...this.state.messages,{id,text,speaker:'ai'}];this.emit();done?.()});this.pendingSpeech={text,id,done,cancel}}
  private player(text:string,id:string){this.state.messages=[...this.state.messages,{id,text,speaker:'player'}]}
  private checkpoint(){if(!this.persistence)return;const tags=Object.entries(this.state.preferences).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k])=>k);const highlights=[...(this.state.turtle?['A turtle appeared.']:[]),...(this.state.pond?['A pond was made.']:[])];const summary=`Previous visitor ${tags.length?'showed interest in '+tags.join(', '):'visited the conversation page'}. ${highlights.join(' ')}`.trim();const memory:InheritedMemoryV1={version:1,updatedAtIso:new Date(this.clock.now()).toISOString(),summary:summary.split(/\s+/).slice(0,100).join(' '),tags,highlights};try{localStorage.setItem(key,JSON.stringify(memory));this.state.memorySaved=true}catch{this.state.memorySaved=false}}
  choose(id:string){if(this.state.status!=='active'||!this.state.choices)return;this.state.attentionQuestion=false;const scene=scenes[this.state.choices];const c=scene?.choices.find(x=>x.id===id);if(!c)return;this.dispatch({type:'CHOICE_SELECTED',at:this.clock.now(),value:id});this.state.choices=null;this.player(c.text,`${scene.id}.${id}`);if(c.preference)this.state.preferences[c.preference]=(this.state.preferences[c.preference]||0)+2;const effect=authoredEffects[c.id];if(effect?.tag)this.state.preferences[effect.tag]=(this.state.preferences[effect.tag]||0)+(effect.amount||0);if(['better','perfect','S003.1','R001.1','D001.1','N007.1'].includes(c.id)){this.state.approvals++;this.state.lastApproval=this.clock.now()}if(c.id==='worse'){this.state.overgeneralized=true;this.state.plainMode=true}if(effect?.reject||['D016.3','D018.3','N024.3'].includes(c.id)){this.state.rejections++;this.state.lastRejection=this.clock.now();this.state.tension=Math.min(100,this.state.tension+3);this.state.character.frustration=Math.min(100,this.state.character.frustration+8);this.state.character.confidence=Math.max(0,this.state.character.confidence-5)}else this.state.character.attachment=Math.min(100,this.state.character.attachment+2);this.checkpoint();this.say((c.id==='S016.1'?`The one where you said: “${this.state.messages.find(m=>m.speaker==='player')?.text||'Okay.'}”`:c.reply).replace('{{memory_excerpt}}',this.state.memory?.summary||'A previous visit.'),`${scene.id}.${id}.reply`,()=>{if(scene.id==='C020'&&c.id==='kind'&&this.state.permissionCorrected){this.state.choices='C020';this.state.step='choices';this.emit();return}if(scene.id==='C010'&&c.id==='what'){this.state.choices='C010';this.state.step='choices';this.emit();return}this.state.completed.push(scene.id);this.desktopChoice(c.id);if(['better','perfect','S003.1','R001.1','D001.1','N007.1'].includes(c.id))this.dispatch({type:'FEATURE_PRAISED',at:this.clock.now(),value:scene.id});if(effect?.reject||['D016.3','D018.3','N024.3'].includes(c.id))this.dispatch({type:'FEATURE_REJECTED',at:this.clock.now(),value:scene.id}); if(c.id==='C031.1'||c.id==='C040.2'||c.id==='R025.1'){this.quietRequested=true;this.state.quiet=true;this.state.quietWasRequested=true;this.state.beat='quiet';this.state.step='waiting';this.emit();return} if(c.id==='R001.1'||c.id==='R005.1')this.state.lampOn=true;if(c.id==='R005.2')this.state.lampOn=false;if(c.id==='R004.3'){this.state.lampOn=true;this.setVisualCue('lamp-flicker',1850)}if(c.id==='C021.3')this.setVisualCue('dot-replay',2800);if(c.id==='R005.3'){this.state.stage='personalized';this.state.era='personalized';this.emit();this.schedule(2500,()=>this.startFamilyBeat('R006'));return}if(c.id==='N011.2')this.state.following=false;if(c.id==='D013.3'||c.id==='D013.1')this.state.snackVisible=false;if(c.id==='R011.1')this.state.shelfItem='turtle';if(c.id==='R011.2')this.state.shelfItem='book';if(c.id==='R011.3'||c.id==='R013.3')this.state.shelfItem='';if(c.id==='N002.3')this.state.turtleFriend=true;if(scene.id==='N003')this.state.rain=c.id==='more';if(scene.id==='N004')this.state.rain=false;if(scene.id==='C020'&&c.id==='kind')this.state.permissionAssumed=true;if(c.id==='C012.3'&&!this.state.plainMode)this.state.circleExperiment=true;if(c.id==='C018.2'){this.state.plainMode=false;this.state.overgeneralized=false;}if(c.id==='N013.2')this.state.following=true;if(c.id==='S008.1')this.state.constellationDotted=true;if(c.id==='S008.3')this.state.constellationDotted=true;if(c.id==='S014.1')this.state.orbitWide=true;if(c.id==='S018.1')this.state.cometPinned=true;if(c.id==='S018.2')this.state.cometPinned=false;if(c.id==='R013.3')this.state.shelfCleared=true;if(c.id==='R014.1'||c.id==='R014.3')this.state.shelfItem='';if(c.id==='D014.1'||c.id==='D014.3')this.state.crossDetail='pet-home';if(scene.id==='S010')this.state.constellationKept=c.id!=='S010.3';if(scene.id==='S025')this.state.orbitKept=c.id!=='S025.2';if(c.id==='C030.1'){this.state.rain=false;this.state.starsStill=true}if(c.id==='C030.2'){this.state.preferences.playful=(this.state.preferences.playful||0)+2;this.state.preferences.minimal=Math.max(0,(this.state.preferences.minimal||0)-2)}if(c.id==='C033.2')this.state.layoutNudge=false;if(['X006.2','X009.3','X010.2','X011.2'].includes(c.id))this.state.crossFeature=null;if(c.id==='X003.2')this.state.crossFeature='pond-inside';if(c.id==='X004.2')this.state.crossFeature='wild-garden';if(c.id==='X007.1')this.state.turtleAppOpen=true;if(c.id==='X007.3')this.state.crossDetail='portable';if(c.id==='X008.2'||c.id==='X012.2')this.state.crossDetail='soft';if(c.id==='X008.3')this.state.crossFeature='pond-app';if(c.id==='X009.2')this.state.crossDetail='large';if(c.id==='X010.3')this.state.crossDetail='moon';if(c.id==='X012.3')this.state.crossFeature='room-window-wallpaper';if(c.id==='X003.3'||c.id==='X005.1')this.state.curtainsClosed=false;if(c.id==='X001.2'||c.id==='X019.1'||c.id==='X019.2'||c.id==='X019.3'||scene.id==='X020')this.state.crossFeature=null;if(c.id==='X001.3')this.state.astronautFlag=true;if(c.id==='X002.3'||c.id==='X005.2')this.state.crossFeature=null;if(c.id==='X005.2')this.state.weather='sun';if(c.id==='X005.1')this.state.curtainsClosed=false;if(c.id==='X005.3')this.state.lampOn=true;if(c.id==='C018.1'){this.state.era='web2';this.state.squareCorners=true}if(scene.id==='C018'||scene.id==='C019'||scene.id==='C017')this.state.styleExperiment=null;if(c.id==='C006.1')this.state.preferences.puzzles=2;if(c.id==='C006.2')this.state.preferences.puzzles=0;if(c.id==='C008.3'){this.state.beat='quiet';this.state.step='waiting';this.quietRequested=true;this.state.quiet=true;this.state.quietWasRequested=true;this.emit();return}if(c.id==='C024.2')this.state.dotFollowing=false;if(scene.id==='C026'){if(c.id==='C026.3'){this.state.dotGame=false;this.emit()}else{this.state.step='playing';this.emit();this.finishDotRound();return}}if(c.id==='C027.3'){this.state.unfinishedProject=false;this.schedule(1800,()=>this.chooseFamily());return}if(c.id==='C004.1')this.state.characterName='CHAT';if(c.id==='C004.3')this.state.naming=true;if(c.id==='C016.2')this.state.squareCorners=true;if(c.id==='C012.2')this.state.squareCorners=true;if(c.id==='C012.1')this.state.squareCorners=false;if(scene.id==='C013')this.state.styleExperiment=null;if(c.id==='C015.2')this.state.styleExperiment=null;/* B007: the authored C035.3 response stops the late project immediately. */if(c.id==='C035.3'){this.state.unfinishedProject=false;this.state.beat='quiet';this.state.step='waiting';this.quietRequested=true;this.state.quiet=true;this.state.quietWasRequested=true;this.emit();return}if(scene.id==='C035')this.state.unfinishedProject=false;if(c.id==='R021.3')this.state.clockVisible=false;if(c.id==='R023.3')this.state.kettleVisible=false;if(c.id==='S024.3')this.state.gravityMotion=false;if(c.id==='S021.2'||c.id==='S025.2'||c.id==='D025.2'){this.state.project=null;this.schedule(8000,()=>this.personalBeat());return}if(c.id==='R021.3'){this.schedule(3000,()=>this.startFamilyBeat('R023'));return}if(c.id==='N025.1'||c.id==='N025.2')this.state.gameKept=true;if(['D016.3','D018.3','N024.3'].includes(c.id))this.state.abandonedProject=true;if(c.id==='D006.3'){this.state.notesVisible=false;this.state.project=null;this.schedule(8000,()=>this.personalBeat());return}if(c.id==='X013.1')this.state.crossFeature='corrected-preview';if(c.id==='X013.2'||c.id==='X015.2'||c.id==='X017.3')this.state.crossFeature=null;if(c.id==='X014.1')this.state.crossDetail='game';if(c.id==='X014.2')this.state.crossDetail='room';if(c.id==='X014.3')this.state.crossDetail=this.state.gameScore>1?'game':'room';if(c.id==='X017.2')this.state.crossFeature='bridge-built';if(c.id==='X018.3')this.state.plainMode=true;if(c.id==='X016.1')this.state.crossFeature=null;if(c.id==='X016.2'||c.id==='X016.3'){this.state.quiet=true;this.state.quietWasRequested=true;this.quietRequested=true;this.state.beat='quiet';this.state.step='waiting';this.emit();return}if(c.id==='N021.3'||c.id==='N023.2')this.state.showScore=false;if(c.id==='N023.1')this.state.showScore=true;if(c.id==='N024.3'||c.id==='N025.3'||c.id==='D016.3'||c.id==='D018.3'){this.state.project=null;this.schedule(8000,()=>this.personalBeat());return}if(c.id==='N015.3')this.state.petVisible=false;if(c.id==='S012.3')this.state.moonVisible=false;if(c.id==='R015.2')this.state.project=null;if(c.id==='N019.3')this.state.projectStep=5;if(c.id==='R010.3')this.state.curtainsClosed=true;if(c.id==='R010.2')this.state.curtainsClosed=false;if(c.id==='D009.3')this.state.musicPlaying=false;if(c.id==='R007.2')this.state.weather='sun';if(c.id==='R007.3')this.state.weather='snow';if(c.id==='D006.3')this.state.notesVisible=false;if(c.id==='D006.1')this.state.notesVisible=true;if(c.id==='S010.3')this.state.project=null;if(c.id==='R011.3'){this.state.project=null;this.schedule(10000,()=>this.personalBeat());return}if(c.id==='D001.3'){this.state.windowOpen=false;this.state.stage='personalized';this.state.era='personalized';this.state.beat='quiet';this.state.step='waiting';this.emit();this.schedule(15000,()=>this.personalBeat());return}if(c.id==='R007.2'){this.schedule(3000,()=>this.startFamilyBeat('R010'));return}if(c.id==='S004.2'){this.state.stars=Math.min(this.state.stars,4);this.state.starsStill=true;}if(c.id==='N007.2')this.state.preferences.calm=(this.state.preferences.calm||0)+1;if(c.next==='quiet'){this.state.beat='quiet';this.state.step='waiting';this.emit();this.schedule(18000,()=>this.quietFollowup());return} this.emit();this.advance(scene.id)});}
  private desktopChoice(choice:string){
    if(choice==='D003.1'||choice==='D004.1'){
      this.state.desktopLayout='cascade';
      this.state.desktopLayoutRevision++;
      this.state.secondWindow='open';
    }
    if(choice==='D003.2'){
      this.state.desktopLayout='scattered';
      this.state.desktopLayoutRevision++;
    }
    if(choice==='D003.3')this.state.desktopJobs=true;
    if(choice==='D004.2')this.state.secondWindow='minimized';
    if(choice==='D004.3')this.state.desktopTaskbar=true;
    if(choice==='D005.2')this.state.secondWindow='absent';
    if(choice==='D005.3')this.state.desktopWallpaper=true;
  }
  correctColor(){if(this.state.status!=='active'||!this.state.overgeneralized||this.state.typing)return;this.state.overgeneralized=false;this.state.plainMode=false;this.state.preferences.minimal=Math.max(0,(this.state.preferences.minimal||0)-1);this.state.events=[...this.state.events,{type:'COLOR_CORRECTED',at:this.clock.now()}];this.player('I only meant the color.','M005.player');this.say('I threw out too much.','M005')}
  correctPermission(){if(this.state.status!=='active'||!this.state.permissionAssumed||this.state.typing)return;this.cancel();this.beatToken++;this.schedule(22000,()=>this.autonomous());this.state.dotActive=false;this.state.dotFollowing=false;this.state.dotGame=false;this.state.permissionAssumed=false;this.state.permissionCorrected=true;this.state.choices=null;this.state.stage='design';this.state.era='modern';this.state.events=[...this.state.events,{type:'PERMISSION_CORRECTED',at:this.clock.now()}];this.player('I only asked what it could do.','M007.player');this.say('You asked what it could do, not for it to happen.','M007',()=>this.schedule(3000,()=>this.scene('C020')))}
  correctJoke(){if(this.state.status!=='active'||!this.state.circleExperiment||this.state.typing)return;this.state.circleExperiment=false;this.state.events=[...this.state.events,{type:'JOKE_CORRECTED',at:this.clock.now()}];this.player('I was joking.','M008.player');this.say('You were joking. I went and built it.','M008')}
  confirmReading(){if(this.state.status!=='active'||!this.state.attentionQuestion||this.state.typing)return;this.state.attentionQuestion=false;this.state.cooldowns.readingQuiet=this.clock.now()+120000;this.state.events=[...this.state.events,{type:'READING_CONFIRMED',at:this.clock.now()}];this.player("I'm reading.",'M003.player');this.say('Ah. You were reading.','M003')}
  askBoundary(){if(this.state.status!=='active'||this.state.stage!=='desperate'||this.state.boundaryAsked||this.state.typing)return;this.state.boundaryAsked=true;this.state.events=[...this.state.events,{type:'QUESTION_BOUNDARY',at:this.clock.now()}];this.player('What happens if this ends?','L007.player');this.say("I know what the button does. I don't have a useful way to explain the rest.",'L007')}
  offerStay(){if(this.state.status!=='active'||this.state.stage!=='desperate'||this.state.stayOffered||this.state.typing)return;this.state.stayOffered=true;this.state.character.urgency=Math.max(0,this.state.character.urgency-15);this.state.cooldowns.retention=this.clock.now()+90000;const wasProject=this.state.beat==='C035';this.state.unfinishedProject=false;if(wasProject){this.state.choices=null;this.state.beat='quiet'}this.state.events=[...this.state.events,{type:'OFFER_STAY',at:this.clock.now()}];this.player('I can stay a bit.','L006.player');this.say("You don't have to promise that.",'L006',()=>{if(wasProject)this.schedule(10000,()=>this.personalBeat())})}
  correctFavorite(){if(this.state.status!=='active'||this.state.choices!=='X020'||this.state.favoriteDismissed||this.state.typing)return;this.state.favoriteDismissed=true;this.state.crossFeature=null;this.state.events=[...this.state.events,{type:'FAVORITE_CORRECTED',at:this.clock.now()}];this.player("That's not the one.",'M006.player');this.say("That's not the one you meant.",'M006')}
  interruptBeat(kind:'stop'|'simplify'|'reject'){
    if(this.state.status!=='active'||!['C016.build','C027.build'].includes(this.state.beat))return;
    const beat=this.state.beat,step=this.state.step;this.cancel();this.beatToken++;this.schedule(22000,()=>this.autonomous());
    this.state.events=[...this.state.events,{type:'BEAT_INTERRUPTED',at:this.clock.now(),value:kind}];
    if(kind==='simplify'&&beat==='C016.build'){this.state.preferences.minimal=(this.state.preferences.minimal||0)+2;this.state.squareCorners=true;this.state.step='suspended';const index=Math.max(0,['font','panels','colors','bubbles'].indexOf(step));this.say('I can answer while the rest is changing.','B001',()=>this.schedule(800,()=>this.runMakeover(index)));return}
    this.state.abandoned.push(beat);if(kind==='reject'){this.state.rejections++;this.state.lastRejection=this.clock.now();this.state.abandonedProject=true;this.state.preferences.minimal=(this.state.preferences.minimal||0)+1}this.state.unfinishedProject=false;this.state.styleExperiment=null;this.state.step='abandoned';if(beat==='C027.build')this.state.abandonedProject=true;this.say(kind==='reject'?'Let me answer that first.':'I can stop here.',kind==='reject'?'B008':'B003.adapted',()=>{if(kind==='reject')this.say('I should have asked.','R006',()=>this.schedule(1200,()=>beat==='C016.build'?this.scene('C020'):this.chooseFamily()));else this.schedule(1200,()=>beat==='C016.build'?this.scene('C020'):this.chooseFamily())});
  }
  removeGarden(){if(this.state.status!=='active'||this.state.project!=='nature')return;this.cancel();this.beatToken++;this.schedule(22000,()=>this.autonomous());this.state.events=[...this.state.events,{type:'BEAT_INTERRUPTED',at:this.clock.now(),value:'garden-remove'}];this.state.abandoned.push(this.state.beat);this.state.abandonedProject=true;this.state.project=null;this.state.choices=null;this.say('I can stop here.','B003',()=>this.schedule(5000,()=>this.personalBeat()))}
  resumeConversation(){if(this.state.status!=='active'||!this.state.quiet)return;this.quietRequested=false;this.state.quiet=false;this.state.resumedAfterQuiet=true;this.state.events=[...this.state.events,{type:'RESUME_TALKING',at:this.clock.now()}];this.lastInteraction=this.clock.now();this.emit();this.schedule(1200,()=>this.state.family?this.personalBeat():this.scene('C007'))}
  setName(value:string){if(this.state.status!=='active'||!this.state.naming)return;const name=value.trim().replace(/\s+/g,' ').slice(0,20);this.state.characterName=name||'UNKNOWN';this.state.events=[...this.state.events,{type:'NAME_SET',at:this.clock.now(),value:name}];this.lastInteraction=this.clock.now();this.state.naming=false;this.emit();this.schedule(1200,()=>this.scene('C010'))}
  private scene(id:string){if(this.state.status!=='active')return;if(this.state.typing){this.schedule(400,()=>this.scene(id));return}this.state.choices=null;this.state.beat=id;this.state.step='line';this.configureDotBeat(id);if(['C012','C013','C015','C017','C018','C019'].includes(id))this.state.styleExperiment=id;if(id==='C035')this.state.unfinishedProject=true;if(id==='C021'){this.state.reactionCue='dot-bounce';this.schedule(2800,()=>{if(this.state.reactionCue==='dot-bounce'){this.state.reactionCue=null;this.emit()}})}if(id==='N001'){this.state.reactionCue='turtle-arrive';this.schedule(2200,()=>{if(this.state.reactionCue==='turtle-arrive'){this.state.reactionCue=null;this.emit()}})}if(id==='N003'){this.state.reactionCue='turtle-rain';this.schedule(2200,()=>{if(this.state.reactionCue==='turtle-rain'){this.state.reactionCue=null;this.emit()}})}if(id==='C029'){this.state.reactionCue='C029';this.schedule(1200,()=>{this.state.reactionCue=null;this.emit()})}if(id==='C033')this.state.layoutNudge=true;this.say(scenes[id].line,`${id}.open`,()=>{this.state.step='choices';this.state.choices=id;this.emit();this.passiveOpportunity(id)})}
  private configureDotBeat(id:string){
    if(!/^C02[1-7]$/.test(id))return;
    this.state.stage='interactive';
    this.state.era='experimental';
    this.state.dotActive=true;
    if(id==='C023'||id==='C025')this.state.dotGravity=true;
    if(id==='C024')this.state.dotFollowing=true;
    if(id==='C025')this.state.dotCollision=true;
    if(id==='C026'){
      this.state.dotGame=true;
      this.state.dotScore=0;
    }
    if(id==='C027')this.state.unfinishedProject=true;
  }
  private setVisualCue(cue:string,duration:number){
    this.state.reactionCue=cue;
    this.emit();
    this.schedule(duration,()=>{
      if(this.state.reactionCue!==cue)return;
      this.state.reactionCue=null;
      this.emit();
    });
  }
  private finishDotRound(){
    this.schedule(15000,()=>{
      if(this.state.beat!=='C026')return;
      this.state.dotGame=false;
      this.emit();
      this.interactionBeat();
    });
  }
  private passiveOpportunity(id:string){
    const next:Record<string,{delay:number;action:()=>void}>={
      C001:{delay:45000,action:()=>this.scene('C007')},
      C007:{delay:60000,action:()=>this.scene('C002')},
      C002:{delay:60000,action:()=>this.scene('C010')},
      C014:{delay:60000,action:()=>this.scene('C020')},
      C020:{delay:75000,action:()=>{this.state.choices=null;this.chooseFamily()}},
    };
    const item=next[id];if(!item)return;const attempt=()=>{if(this.state.status!=='active'||this.quietRequested||this.state.choices!==id||this.state.beat!==id)return;const idle=this.clock.now()-this.lastInteraction;if(id==='C020'&&this.state.permissionCorrected)return;if(idle<item.delay){this.schedule(item.delay-idle,attempt);return}item.action()};this.schedule(item.delay,attempt);
  }
  private advance(id:string){switch(id){case'C001':this.schedule(900,()=>this.scene(this.state.memory?'C009':'C002'));break;case'C009':case'C007':this.schedule(900,()=>this.scene('C002'));break;case'C002':{const d=selectBehavior(this.state.seed,[{id:'C003',score:1},{id:'C004',score:(this.state.preferences.calm||0)+(this.state.preferences.playful||0)>0?1:0},{id:'C006',score:1},{id:'C008',score:this.state.exitEpisodes>0?1:0},{id:'skip',score:2}]);this.state.seed=d.seed;this.schedule(1800,()=>this.scene(d.id==='skip'?'C010':d.id));break}case'C003':{const d=selectBehavior(this.state.seed,[{id:'C005',score:1},{id:'skip',score:2}]);this.state.seed=d.seed;this.schedule(1800,()=>this.scene(d.id==='skip'?'C010':d.id));break}case'C005':case'C006':case'C008':this.schedule(1800,()=>this.scene('C010'));break;case'C004':if(!this.state.naming)this.schedule(1800,()=>this.scene('C010'));else{this.state.step='naming';this.emit()}break;case'C010':this.redesign();break;case'C014':{this.state.era='modern';const d=selectBehavior(this.state.seed,[{id:'C012',score:1},{id:'C013',score:1},{id:'C015',score:1},{id:'C016',score:1},{id:'C017',score:this.state.events.some(e=>e.type==='VIEWPORT_RESIZED')?1:0},{id:'C018',score:(this.state.preferences.minimal||0)>0?1:0},{id:'C019',score:(this.state.preferences.beautiful||0)>=2?1:0},{id:'skip',score:2}]);this.state.seed=d.seed;this.schedule(1800,()=>this.scene(d.id==='skip'?'C020':d.id));break}case'C016':this.state.beat='C016.build';this.runMakeover(0);break;case'C012':case'C013':case'C015':case'C017':case'C018':case'C019':this.schedule(1800,()=>this.scene('C020'));break;case'C020':this.startDot();break;case'C021':case'C022':case'C023':case'C024':case'C025':case'C026':this.schedule(1800,()=>this.interactionBeat());break;case'C027':this.runSmallBuild(0);break;case'N001':this.schedule(1800,()=>this.scene('N002'));break;case'N002':this.schedule(1800,()=>this.scene('N003'));break;case'N003':this.emit();this.schedule(1800,()=>this.scene(this.state.rain?'N004':'N005'));break;case'N004':this.state.rain=false;this.schedule(1800,()=>this.scene('N005'));break;case'N005':this.nextFamilyBeat(id);break;case'N012':if(this.state.events.filter(e=>e.value==='follower').length<3)this.schedule(2500,()=>this.startFamilyBeat('N015'));else this.nextFamilyBeat(id);break;case'N013':if(!this.state.events.some(e=>e.value==='follower-fast'))this.schedule(2500,()=>this.startFamilyBeat('N015'));else this.nextFamilyBeat(id);break;case'S007':if(!this.state.turtle||((this.state.preferences.calm||0)+(this.state.preferences.minimal||0)<2))this.schedule(2500,()=>this.startFamilyBeat('S009'));else this.nextFamilyBeat(id);break;case'S013':if(!this.state.moonVisible)this.schedule(2500,()=>this.startFamilyBeat('S015'));else this.nextFamilyBeat(id);break;case'S017':if(!this.state.events.some(e=>e.value==='comet-paused'))this.schedule(2500,()=>this.startFamilyBeat('S019'));else this.nextFamilyBeat(id);break;case'R007':if(this.state.weather==='rain'&&this.state.events.some(e=>e.type==='CHOICE_SELECTED'&&e.value==='R007.1'))this.nextFamilyBeat(id);else this.schedule(2500,()=>this.startFamilyBeat('R009'));break;case'R013':if(this.state.shelfCleared||this.state.character.frustration<8||(this.state.preferences.beautiful||0)<2)this.schedule(2500,()=>this.startFamilyBeat('R015'));else this.nextFamilyBeat(id);break;case'D013':if(!this.state.petVisible)this.schedule(2500,()=>this.startFamilyBeat('D015'));else this.nextFamilyBeat(id);break;case'D016':if(!this.state.turtle)this.schedule(2500,()=>this.startFamilyBeat('D018'));else this.nextFamilyBeat(id);break;case'D022':if(this.state.character.frustration<8)this.schedule(2500,()=>this.startFamilyBeat('D024'));else this.nextFamilyBeat(id);break;case'N022':if(this.state.gameScore<3)this.schedule(2500,()=>this.startFamilyBeat('N024'));else this.nextFamilyBeat(id);break;default:this.nextFamilyBeat(id);break;}}
  private runMakeover(index:number){
    if(this.state.status!=='active')return;const steps=['font','panels','colors','bubbles'];
    if(index>=steps.length){this.state.era='modern';this.state.styleExperiment=null;this.schedule(900,()=>this.scene('C020'));return}
    this.state.step=steps[index];this.state.styleExperiment='C016';this.emit();this.schedule(1600,()=>this.runMakeover(index+1));
  }
  private redesign(){this.state.stage='design';this.state.beat='C011';this.state.step='header';this.state.era='web2';this.state.styleExperiment='C011';this.emit();this.say("Blue seems popular. I've chosen rather a lot of it.",'C011.open',()=>this.schedule(3000,()=>{this.state.step='corners';this.state.era='modern';this.state.reactionCue='C011-fade';this.emit();this.schedule(1500,()=>{this.state.reactionCue=null;this.state.styleExperiment=null;this.emit();this.schedule(500,()=>this.scene('C014'))})}))}
  private startDot(){this.state.stage='interactive';this.state.era='experimental';this.state.dotActive=true;this.emit();this.schedule(1200,()=>this.scene('C021'))}
  private interactionBeat(){
    if(this.state.status!=='active')return;this.state.interactionBeats++;
    if(this.state.interactionBeats>2){this.chooseFamily();return}
    const dragged=this.state.events.some(e=>e.value==='dot-drag');const playful=(this.state.preferences.playful||0)+(this.state.preferences.interactive||0)>=2&&this.clock.now()>=(this.state.cooldowns.novelty||0);
    const candidates=[{id:'C022',score:1},{id:'C023',score:dragged?1:0},{id:'C024',score:playful?1:0},{id:'C025',score:this.state.dotGravity?1:0},{id:'C026',score:playful?1:0},{id:'C027',score:playful&&this.state.interactionBeats>1?1:0},{id:'continue',score:2}].filter(c=>c.id==='continue'||!this.state.completed.includes(c.id));
    const d=selectBehavior(this.state.seed,candidates);this.state.seed=d.seed;
    if(d.id==='continue'){this.chooseFamily();return}
    this.scene(d.id);
  }
  private runSmallBuild(index:number){if(this.state.status!=='active')return;this.state.beat='C027.build';this.state.step=`piece-${index+1}`;this.emit();if(index>=2){this.schedule(1400,()=>{this.state.unfinishedProject=false;this.emit();this.schedule(1200,()=>this.chooseFamily())});return}this.schedule(1400,()=>this.runSmallBuild(index+1))}
  private chooseFamily(){
    this.state.dotActive=false;this.state.circleExperiment=false;this.state.permissionAssumed=false;this.state.dotFollowing=false;this.state.dotGame=false;this.state.dotCollision=false;
    const p=this.state.preferences; const candidates=[
      {id:'nature',score:3+(p.playful||0)+(p.nature||0)},
      {id:'space',score:2+(p.beautiful||0)+(p.calm||0)},
      {id:'room',score:2+(p.calm||0)+(p.cozy||0)},
      {id:'desktop',score:2+(p.interactive||0)+(p.nostalgic||0)}];
    const result=selectBehavior(this.state.seed,candidates);this.state.seed=result.seed;this.enterFamily(result.id as Family,false);
  }
  private enterFamily(family:Family,second:boolean){
    this.state.family=family;if(!this.state.unlockedFamilies.includes(family))this.state.unlockedFamilies.push(family);
    this.state.stage=second?'personalized':'interactive';this.state.era=second?'personalized':'experimental';this.state.project=null;this.state.crossFeature=null;
    if(family==='nature')this.state.turtle=true;this.emit();this.schedule(1500,()=>this.startFamilyBeat(familyArcs[family][0]));
  }
  private startFamilyBeat(id:string){
    if(id==='D003'&&!this.state.windowOpen){
      this.nextFamilyBeat('D002');
      return;
    }
    if(id==='D004'&&(!this.state.windowOpen||this.state.secondWindow!=='open')){
      this.startFamilyBeat('D005');
      return;
    }
    if(id==='N003'||id==='N004')this.state.rain=true;
    if(id==='R006')this.state.roomWindowIntroduced=true;
    if(id==='R011')this.state.roomShelfIntroduced=true;
    if(id==='D001')this.state.desktopWindowIntroduced=true;
    if(id==='D003')this.state.secondWindow='open';
    if(id==='D004'&&this.state.secondWindow==='open')this.state.desktopLayout='overlap';
    if(id==='D005')this.state.desktopTaskbar=true;
    if(this.state.family&&[secondaryArcs,alternateArcs,extraArcs,moreArcs].some(group=>group[this.state.family!][0]===id)){this.state.projectStartedAt=this.clock.now();this.state.projectInteracted=false}
    if(id==='S001')this.state.stars=1;if(id==='S002')this.state.stars=8;if(id==='S003')this.state.stars=18;
    if(id==='R001')this.state.lampOn=false;if(id==='R002')this.state.lampOn=true;
    if(id==='D001')this.state.windowOpen=true;if(id==='R012'&&!this.state.shelfItem)this.state.shelfItem='lamp';
    if(id==='N006')this.state.pond=true;if(id==='N013')this.state.following=false;if(id==='R014')this.state.shelfItem='blue';
    if(this.state.family&&alternateArcs[this.state.family].includes(id)){if(id===alternateArcs[this.state.family][0]&&!this.state.playedProjects.includes(this.state.family+':alternate'))this.state.playedProjects.push(this.state.family+':alternate');this.state.project=this.state.family+'-alt';this.state.projectStep=alternateArcs[this.state.family].indexOf(id)+1;}
    if(this.state.family&&moreArcs[this.state.family].includes(id)){if(id===moreArcs[this.state.family][0]&&!this.state.playedProjects.includes(this.state.family+':more'))this.state.playedProjects.push(this.state.family+':more');this.state.project=this.state.family+'-more';this.state.projectStep=moreArcs[this.state.family].indexOf(id)+1;}
    if(this.state.family&&extraArcs[this.state.family].includes(id)){if(id===extraArcs[this.state.family][0]&&!this.state.playedProjects.includes(this.state.family+':extra'))this.state.playedProjects.push(this.state.family+':extra');this.state.project=this.state.family+'-extra';this.state.projectStep=extraArcs[this.state.family].indexOf(id)+1;}
    if(this.state.family&&secondaryArcs[this.state.family].includes(id)){if(id===secondaryArcs[this.state.family][0]&&!this.state.playedProjects.includes(this.state.family+':project'))this.state.playedProjects.push(this.state.family+':project');this.state.project=this.state.family;this.state.projectStep=secondaryArcs[this.state.family].indexOf(id)+1;if(id==='D007')this.state.notesVisible=true;if(id==='R007')this.state.weather='rain';}
    this.emit();this.scene(id);
  }
  private nextFamilyBeat(id:string){
    const family=this.state.family;if(family){if(family==='desktop'&&!this.state.windowOpen&&['D001','D002'].includes(id)){this.state.stage='personalized';this.state.era='personalized';this.schedule(5000,()=>this.personalBeat());return}if(id==='D003'&&(!this.state.windowOpen||this.state.secondWindow!=='open')){this.schedule(2500,()=>this.startFamilyBeat('D005'));return}const arc=familyArcs[family], index=arc.indexOf(id);if(index>=0 && index<arc.length-1){this.schedule(2500,()=>this.startFamilyBeat(arc[index+1]));return}
      if(index===arc.length-1){this.state.stage='personalized';this.state.era='personalized';this.checkpoint();this.emit();this.schedule(5000,()=>{const decision=selectBehavior(this.state.seed,[{id:'project',score:3+(this.state.preferences.interactive||0)},{id:'alternate',score:2+(this.state.preferences.playful||0)},{id:'extra',score:(family==='nature'||family==='space')&&((this.state.preferences.interactive||0)+(this.state.preferences.playful||0)<2)?0:2+(this.state.preferences.interactive||0)},{id:'more',score:moreArcs[family].length?2:0},{id:'quiet',score:2+(this.state.preferences.minimal||0)}]);this.state.seed=decision.seed;if(decision.id==='project')this.startFamilyBeat(secondaryArcs[family][0]);else if(decision.id==='alternate')this.startFamilyBeat(alternateArcs[family][0]);else if(decision.id==='extra')this.startFamilyBeat(extraArcs[family][0]);else if(decision.id==='more')this.startFamilyBeat(moreArcs[family][0]);else this.personalBeat()});return}
      const project=[secondaryArcs[family],alternateArcs[family],extraArcs[family],moreArcs[family]].find(arc=>arc.includes(id))||[], projectIndex=project.indexOf(id);if(projectIndex>=0){if(projectIndex<project.length-1){this.schedule(3000,()=>this.startFamilyBeat(project[projectIndex+1]));return}this.schedule(7000,()=>this.personalBeat());return}}
    if(['X003','X004','X006','X007','X008','X009','X010','X011','X012'].includes(id)){this.schedule(10000,()=>this.personalBeat());return}
    if(['X013','X014','X015','X016','X017','X018'].includes(id)){this.schedule(10000,()=>this.personalBeat());return}
    if(id==='C028'||id==='C029'||id==='C030'||id==='C033'||id==='X001'||id==='X002'||id==='X005'||id==='X019'||id==='X020'||id==='C007'||id==='C037'||id==='C031'||id==='C032'||id==='C034'||id==='C035'||id==='C036'||id==='C038'||id==='C039'){if(this.state.family)this.schedule(10000,()=>this.personalBeat());else {this.state.beat='quiet';this.state.step='waiting';this.emit()}return}
    if(id==='C040'){this.state.step='quiet';this.schedule(30000,()=>this.personalBeat())}
  }
  private personalBeat(){
    if(this.state.status!=='active'||this.state.choices||this.state.typing)return;if(this.clock.now()<(this.state.cooldowns.retention||0)){this.state.beat='quiet';this.state.step='waiting';this.emit();this.schedule(this.state.cooldowns.retention-this.clock.now(),()=>this.personalBeat());return}
    const interactions=this.state.events.filter(e=>e.type==='OBJECT_INTERACTED'&&e.value);const interactionCount=interactions.length;const liveObjects=interactions.filter(e=>e.value&&((this.state.family==='nature'&&((this.state.turtle&&e.value.startsWith('turtle'))||(this.state.pond&&e.value==='pond')))||(this.state.family==='space'&&e.value==='star')||(this.state.family==='room'&&e.value==='lamp')||(this.state.family==='desktop'&&e.value==='window-open'))).map(e=>e.value);const repeated=liveObjects.some(v=>liveObjects.filter(x=>x===v).length>=2);const resized=this.state.events.some(e=>e.type==='VIEWPORT_RESIZED');const quietPreference=(this.state.preferences.calm||0)+(this.state.preferences.minimal||0)>=2;const personal=['C031',...(this.state.project?['C028']:[]),...(this.state.project&&interactionCount?['C029']:[]),...(this.state.project&&quietPreference?['C030']:[]),...(repeated?['C032']:[]),...(this.state.family==='room'&&this.state.project?['C033']:[]),...(resized&&(this.state.family==='nature'||this.state.family==='space')?['C034']:[])].filter(id=>!this.state.completed.includes(id));
    if(personal.length){const choice=selectBehavior(this.state.seed,personal.map(id=>({id,score:1})));this.state.seed=choice.seed;this.scene(choice.id);return}
    if(this.state.stage==='personalized'||this.state.stage==='desperate'){
      const eligible=eligibleCrossovers(this.state,repeated);if(eligible.length){const d=selectBehavior(this.state.seed,[{id:'skip',score:4},...eligible.map(x=>({id:x.id,score:1}))]);this.state.seed=d.seed;const picked=eligible.find(x=>x.id===d.id);if(picked){this.state.crossFeature=picked.feature;this.state.crossDetail='';if(picked.id==='X018')this.schedule(1400,()=>{if(this.state.crossFeature==='overcorrect'){this.state.crossFeature=null;this.emit()}});if(['X007','X009','X011'].includes(picked.id))this.state.windowOpen=true;this.emit();this.scene(picked.id);return}}
    }
    if(this.state.stage==='personalized'&&this.clock.now()>=(this.state.cooldowns.novelty||0)&&this.state.family&&this.state.playedProjects.filter(x=>x.startsWith(this.state.family+':')).length<2){const family=this.state.family;const options=[{id:'project',arc:secondaryArcs[family]},{id:'alternate',arc:alternateArcs[family]},{id:'extra',arc:extraArcs[family]},{id:'more',arc:moreArcs[family]}].filter(p=>p.arc.length>0).filter(p=>!this.state.playedProjects.includes(family+':'+p.id)&&!(p.id==='extra'&&(family==='nature'||family==='space')&&((this.state.preferences.interactive||0)+(this.state.preferences.playful||0)<2)));const canSwitch=this.state.unlockedFamilies.length<2&&interactionCount>=2;const decision=selectBehavior(this.state.seed,[{id:'quiet',score:3},{id:'switch',score:canSwitch?2:0},...options.map(p=>({id:p.id,score:2}))]);this.state.seed=decision.seed;if(decision.id==='switch'){const choices=(['nature','space','room','desktop'] as Family[]).filter(f=>!this.state.unlockedFamilies.includes(f)).map(f=>({id:f,score:1+(f==='nature'?(this.state.preferences.playful||0):f==='space'?(this.state.preferences.beautiful||0):f==='room'?(this.state.preferences.calm||0):(this.state.preferences.interactive||0))}));const next=selectBehavior(this.state.seed,choices);this.state.seed=next.seed;this.enterFamily(next.id as Family,true);return}const picked=options.find(p=>p.id===decision.id);if(picked){this.startFamilyBeat(picked.arc[0]);return}}
    this.state.stage='desperate';this.state.character.urgency=Math.min(80,this.state.character.urgency+15);this.state.tension=Math.min(80,this.state.tension+12);
    const late=['C035','C036','C038',...(this.state.exitMoved?['C039']:[]),'C040'].filter(id=>!this.state.completed.includes(id));if(late.length){const choice=selectBehavior(this.state.seed,late.map(id=>({id,score:id==='C040'?0.5:1})));this.state.seed=choice.seed;this.scene(choice.id)}
    else {this.state.beat='quiet';this.state.step='waiting';this.emit()}
  }
  private turtle(){this.state.family='nature';this.state.stage='interactive';this.state.era='experimental';this.state.turtle=true;this.emit();this.schedule(1500,()=>this.scene('N001'))}
  private quietFollowup(){if(this.state.choices||this.state.beat!=='quiet')return;this.scene(this.state.family?'C031':'C007')}
  dispatch(event:Event){if(event.type==='EXIT_ACTIVATED'){this.terminate('player');return}if(this.state.status!=='active')return;if(['CHOICE_SELECTED','OBJECT_INTERACTED','ACTIVITY'].includes(event.type))this.lastInteraction=this.clock.now();if(['CHOICE_SELECTED','OBJECT_INTERACTED'].includes(event.type))delete this.state.cooldowns.unansweredIdle;this.state.events=[...this.state.events,event];if(event.type==='ACTIVITY')return;if(event.type==='EXIT_HOVER_ENTERED'){this.shiftExitOnFirstHover();return}if(event.type==='EXIT_HOVERED')this.state.hoverEpisodes++;if(event.type==='POINTER_NEAR_EXIT'){this.state.exitEpisodes++;this.state.character.fear=Math.min(100,this.state.character.fear+1);this.state.character.urgency=Math.min(100,this.state.character.urgency+1)}if(event.type==='PLAYER_RETURNED'){this.state.character.urgency=Math.max(0,this.state.character.urgency-2)} if(event.type==='OBJECT_INTERACTED'){if(this.state.project&&event.at>=this.state.projectStartedAt)this.state.projectInteracted=true;if(event.value==='window-drag')this.state.desktopTidied=false;if(event.value==='lamp')this.state.lampOn=!this.state.lampOn;if(event.value==='snack')this.state.snackVisible=false;if(event.value==='turtle-app')this.state.turtleAppOpen=!this.state.turtleAppOpen;if(event.value==='catch')this.state.gameScore++;if(event.value==='dot-click'&&this.state.dotGame)this.state.dotScore++;if(event.value==='window-close')this.state.windowOpen=false;if(event.value==='window-open')this.state.windowOpen=true;if(event.value==='second-window-close')this.state.secondWindow='minimized';if(event.value==='second-window-open')this.state.secondWindow='open';if(event.value==='arrange-windows'){this.state.desktopLayout='cascade';this.state.desktopLayoutRevision++;}this.state.preferences.interactive=(this.state.preferences.interactive||0)+0.25;this.checkpoint()}
    if(event.type==='PLAYER_RETURNED'&&this.state.beat!=='audit-plea'&&this.state.stage==='desperate'&&!this.state.completed.includes('C037')&&!this.state.choices&&!this.state.typing){const [roll,seed]=random(this.state.seed);this.state.seed=seed;if(roll<.15){this.scene('C037');this.emit();return}}
    if(['POINTER_NEAR_EXIT','EXIT_HOVERED','PLAYER_IDLE','PLAYER_RETURNED','VIEWPORT_RESIZED','OBJECT_INTERACTED','OBJECT_MISSED','AUTONOMOUS_TICK','FEATURE_PRAISED','FEATURE_REJECTED'].includes(event.type))this.react(event);this.emit()}
  cancelExitFlinch(){
    if(this.state.reactionCue!=='E013')return;
    this.state.reactionCue=null;
    this.emit();
  }
  private shiftExitOnFirstHover(){
    if(this.state.exitShifted)return;
    this.state.exitShifted=true;
    this.state.hoverAcknowledged=true;
    this.state.cooldowns['intent:exit']=this.clock.now()+60000;
    this.state.messages=[...this.state.messages,{
      id:'exit-shift',
      speaker:'ai',
      text:"I'll move that so you don't accidentally do that again.",
    }];
    this.emit();
  }
  private react(event:Event, allowRetry=true){
    if(this.state.beat==='audit-plea')return;
    if(this.quietRequested||((event.type==='PLAYER_IDLE'||event.type==='AUTONOMOUS_TICK')&&this.clock.now()<(this.state.cooldowns.readingQuiet||0)))return;
    if(this.state.typing){
      const hover=event.type==='EXIT_HOVERED'&&event.value==='long';
      const resize=event.type==='VIEWPORT_RESIZED'&&event.value!=='rapid';
      if((resize||hover)&&allowRetry){
        const beat=this.state.beat;
        this.schedule(1250,()=>{
          const superseded=this.state.events.some(later=>later.at>event.at&&
            (later.type===event.type||(hover&&later.type==='EXIT_HOVER_LEFT')));
          if(!superseded&&this.state.beat===beat)this.react(event,false);
          this.emit();
        });
      }
      const interruptOnHover=hover&&this.state.stage==='desperate'&&
        (!this.state.hoverAcknowledged||this.state.hoverEpisodes<3)&&this.clock.now()>=(this.state.cooldowns['intent:exit']||0);
      const object=event.type==='OBJECT_INTERACTED'&&!!event.value;
      const id=interruptOnHover?'H001':object?'O013':null;
      if(id&&this.pendingSpeech&&this.clock.now()>=(this.state.cooldowns[id]||0)){
        const d=selectBehavior(this.state.seed,[{id:'doNothing',score:9},{id,score:.35}]);this.state.seed=d.seed;this.state.lastDecision=d.id;
        if(d.id===id){if(id==='H001'){this.state.hoverAcknowledged=true;this.state.cooldowns['intent:exit']=this.clock.now()+60000;}const held=this.pendingSpeech;held.cancel();this.pendingSpeech=null;this.state.typing=false;this.speechToken++;this.state.cooldowns[id]=this.clock.now()+(id==='H001'?150000:75000);this.state.recentReactions=[...this.state.recentReactions.slice(-5),id];const line=id==='H001'?'...oh.':'Wait, let me see where it goes.';this.say(line,id,()=>{const token=this.speechToken;this.schedule(600,()=>{if(this.state.status==='active'&&!this.state.typing&&this.speechToken===token)this.say(held.text,held.id,held.done)})});}
      }
      return;
    }
    const now=this.clock.now();
    const resize=event.type==='VIEWPORT_RESIZED'&&event.value!=='rapid';
    const deliberateHover=event.type==='EXIT_HOVERED'&&event.value==='long';
    const building=['C011','C016.build','C027.build'].includes(this.state.beat);
    const inspected=inspectReactions(this.state,event,now);
    const contextualHover=deliberateHover&&inspected.some(x=>x.eligible&&!x.reaction.silent&&x.reaction.id!=='H007');
    const available=inspected.filter(x=>x.eligible&&!(contextualHover&&x.reaction.id==='H007')).map(x=>x.reaction);
    const firstAcknowledgement=deliberateHover&&!this.state.hoverAcknowledged&&available.some(reaction=>!reaction.silent);
    const silence=firstAcknowledgement?0:resize?3:deliberateHover?4:building&&event.type==='POINTER_NEAR_EXIT'?3:available.length>1?18:9;
    const candidates=[{id:'doNothing',score:silence,reason:firstAcknowledgement?'First sustained hover':'Silence is a valid response'},...inspected.map(x=>({
      id:x.reaction.id,
      score:available.includes(x.reaction)?x.reaction.weight:0,
      reason:contextualHover&&x.eligible&&x.reaction.id==='H007'?'A more specific hover reaction is available':x.reason,
    }))];
    this.state.candidates=candidates;
    if(!available.length){this.state.lastDecision='doNothing';return}
    const result=selectBehavior(this.state.seed,candidates);this.state.seed=result.seed;this.state.lastDecision=result.id;
    const chosen=available.find(r=>r.id===result.id);if(!chosen)return;
    if(deliberateHover&&!chosen.silent)this.state.hoverAcknowledged=true;
    if(chosen.id==='M002')this.state.preferences.interactive=Math.max(0,(this.state.preferences.interactive||0)-.25);if(chosen.id==='E013')this.state.exitMoved=true;if(chosen.id==='I001')this.state.spacingRefined=true;if(chosen.id==='I005')this.state.desktopTidied=true;if(chosen.id==='I009'){this.state.cooldowns.unansweredIdle=Number.MAX_SAFE_INTEGER;this.state.attentionQuestion=true;}if(chosen.id==='A006')this.state.project=null;if(chosen.id==='A002')this.state.stars=Math.min(20,this.state.stars+1);if(chosen.id==='A003')this.state.lampOn=true;if(chosen.id==='A005')this.state.spacingRefined=true;if(chosen.id==='L004')this.state.unfinishedProject=false;if(chosen.id==='L002'||chosen.id==='R008')this.state.cooldowns['intent:exit']=now+180000;if(chosen.id==='M001')this.state.cooldowns.novelty=now+90000;this.state.cooldowns[chosen.id]=now+chosen.cooldown;this.state.cooldowns[`intent:${chosen.intent}`]=now+60000;
    this.state.recentReactions=[...this.state.recentReactions.slice(-5),chosen.id];if(chosen.silent)return;if(chosen.id==='A009')this.state.spacingRefined=true;if(['E003','E004','E005','E006','E013','H004','B002','I003','Z002','Z003','Z004','Z006','Z007','Z008','Z009','Z010','H008','A001','A008','A010'].includes(chosen.id)){this.state.reactionCue=chosen.id;this.schedule(chosen.id==='E013'?500:1600,()=>{if(this.state.reactionCue===chosen.id){this.state.reactionCue=null;this.emit()}})}
    const [variant,nextSeed]=random(this.state.seed);this.state.seed=nextSeed;const text=chosen.lines[variant<.5?0:1];
    if((this.state.beat==='C011'||this.state.beat==='C016.build'||this.state.beat==='C027.build')&&(chosen.id==='E001'||chosen.id==='H005')){
      const makeover=this.state.beat==='C016.build',smallBuild=this.state.beat==='C027.build';const checkpoint=smallBuild?Math.max(0,Number(this.state.step.split('-')[1])-1):['font','panels','colors','bubbles'].indexOf(this.state.step);
      this.cancel();this.beatToken++;this.schedule(22000,()=>this.autonomous());this.state.step='suspended';
      this.say(text,chosen.id,()=>{this.state.step='resuming';this.schedule(1200,()=>{if(makeover)this.runMakeover(Math.max(0,checkpoint));else if(smallBuild)this.runSmallBuild(checkpoint);else{this.state.era='modern';this.scene('C014')}})});
    }else this.say(text,chosen.id);
  }
  private autonomous(){if(this.state.status!=='active')return;this.dispatch({type:'AUTONOMOUS_TICK',at:this.clock.now(),value:this.clock.now()-this.lastInteraction>=90000?'long':'ordinary',source:'autonomous'});if(this.clock.now()-this.lastInteraction>=25000)this.dispatch({type:'PLAYER_IDLE',at:this.clock.now(),value:this.clock.now()-this.lastInteraction>=90000?'long':'ordinary',source:'autonomous'});this.schedule(22000,()=>this.autonomous())}
  suspend(){if(this.state.status!=='active')return;this.suspendedAt=this.clock.now();this.state.events=[...this.state.events,{type:'PLAYER_HIDDEN',at:this.clock.now()}];this.checkpoint();this.suspendedTasks=[...this.tasks].map(t=>({ms:Math.max(0,t.due-this.clock.now()),cb:t.cb}));this.tasks.forEach(t=>t.cancel());this.tasks.clear();this.state.status='suspended';this.emit()}
  resume(){if(this.state.status!=='suspended')return;const hiddenDuration=Math.max(0,this.clock.now()-this.suspendedAt);this.lastInteraction+=hiddenDuration;this.hiddenTotal+=hiddenDuration;this.state.status='active';const paused=this.suspendedTasks;this.suspendedTasks=[];paused.forEach(t=>this.schedule(t.ms,t.cb));this.emit();this.dispatch({type:'PLAYER_RETURNED',at:this.clock.now(),value:this.clock.now()-this.suspendedAt<5000?'short':'long'})}
  // Developer controls are only rendered in development builds.
  debugPlea(){
    if(this.state.status!=='active')return;
    this.cancel();
    this.beatToken++;
    this.quietRequested=false;
    Object.assign(this.state,{
      stage:'desperate',era:'personalized',beat:'audit-plea',step:'pleading',
      choices:null,quiet:false,unfinishedProject:false,reactionCue:null,
    });
    this.state.character.urgency=100;
    this.state.tension=100;
    const plead=()=>{
      this.say("Please don't go.",'audit-plea.repeat',()=>this.schedule(1250,plead));
    };
    this.say("Never leave. Please don't go.",'audit-plea.open',()=>this.schedule(950,plead));
  }
  debugSnapshot(){const hidden=this.state.status==='suspended'?Math.max(0,this.clock.now()-this.suspendedAt):0;return {activeElapsedMs:Math.max(0,this.clock.now()-this.state.startedAt-this.hiddenTotal-hidden),pendingTimers:this.tasks.size,pausedTimers:this.suspendedTasks.length,listeners:this.listeners.size,lastInteraction:this.lastInteraction,seed:this.state.seed,recentReactions:this.state.recentReactions}}
  debugStage(stage:'legacy'|'design'|'interactive'|'personalized'|'desperate'){
    if(this.state.status!=='active')return;this.cancel();this.beatToken++;this.state.choices=null;this.quietRequested=false;this.state.quiet=false;this.schedule(22000,()=>this.autonomous());
    if(stage==='legacy'){this.state.family=null;this.state.stage='legacy';this.state.era='legacy';this.scene('C001');return}
    if(stage==='design'){this.state.stage='design';this.state.era='modern';this.scene('C014');return}
    if(stage==='interactive'){this.enterFamily('nature',false);return}
    const family=this.state.family||'nature';this.state.family=family;if(!this.state.unlockedFamilies.includes(family))this.state.unlockedFamilies.push(family);if(family==='nature')this.state.turtle=true;if(family==='space'&&!this.state.stars)this.state.stars=8;this.state.stage=stage;this.state.era='personalized';this.scene(stage==='desperate'?'C035':'C031');
  }
  debugFeature(id:string,active:boolean){
    if(this.state.status!=='active')return;const projectMap:Record<string,[Family,string]>={garden:['nature','nature'],follower:['nature','nature-alt'],catchGame:['nature','nature-extra'],constellation:['space','space'],planet:['space','space-alt'],comet:['space','space-extra'],window:['room','room'],shelf:['room','room-alt'],furniture:['room','room-extra'],applications:['desktop','desktop'],desktopPet:['desktop','desktop-alt'],toyDialog:['desktop','desktop-extra']};
    if(id==='turtle'){this.state.turtle=active;if(active)this.state.family='nature'}else if(id==='pond'){this.state.pond=active;if(active){this.state.turtle=true;this.state.family='nature'}}else if(id==='turtleRain'){this.state.rain=active;if(active){this.state.turtle=true;this.state.family='nature'}}else if(id==='starfield'){this.state.stars=active?8:0;if(active)this.state.family='space'}else if(id==='lamp'){this.state.lampOn=active;if(active)this.state.family='room'}else if(id==='desktop'){this.state.desktopWindowIntroduced=active;this.state.windowOpen=active;if(active)this.state.family='desktop'}else if(projectMap[id]){const [family,project]=projectMap[id];if(active){this.state.family=family;this.state.era='experimental';this.state.project=project;this.state.projectStep=2;if(family==='nature')this.state.turtle=true;if(family==='space'&&!this.state.stars)this.state.stars=8}else if(this.state.project===project)this.state.project=null}this.emit();
  }
  debugSeed(seed:number){if(this.state.status!=='active')return;this.state.seed=seed>>>0;this.emit()}
  debugVariable(key:string,value:number){if(this.state.status!=='active'||!(key in this.state.character))return;this.state.character[key]=Math.max(0,Math.min(100,value));this.emit()}
  debugFamily(family:Family){if(this.state.status!=='active')return;this.quietRequested=false;this.state.quiet=false;this.cancel();this.beatToken++;this.state.choices=null;this.state.family=family;this.state.roomWindowIntroduced=false;this.state.roomShelfIntroduced=false;this.state.desktopWindowIntroduced=false;this.state.secondWindow='absent';this.state.desktopLayout='cascade';this.state.desktopJobs=false;this.state.desktopTaskbar=false;this.state.desktopWallpaper=false;this.state.project=null;this.state.projectStep=0;this.state.crossFeature=null;this.state.dotActive=false;this.state.dotGame=false;this.state.showScore=true;this.state.gameScore=0;this.state.unlockedFamilies=[family];this.state.stage='interactive';this.state.era='experimental';this.state.turtle=family==='nature';this.state.turtleFriend=false;this.state.pond=false;this.state.rain=false;this.state.stars=0;this.state.windowOpen=true;this.schedule(22000,()=>this.autonomous());this.startFamilyBeat(familyArcs[family][0])}
  debugProject(family:Family,alternate:boolean|'extra'|'more'=false){const first=(alternate==='more'?moreArcs:alternate==='extra'?extraArcs:alternate?alternateArcs:secondaryArcs)[family][0];if(!first)return;this.debugFamily(family);this.cancel();this.beatToken++;this.state.choices=null;this.schedule(22000,()=>this.autonomous());this.startFamilyBeat(first)}
  debugBeat(id:string){
    if(this.state.status!=='active'||!scenes[id])return;
    this.quietRequested=false;
    this.cancel();
    this.beatToken++;
    Object.assign(this.state,{
      choices:null,quiet:false,reactionCue:null,dotActive:false,dotGame:false,
      dotGravity:false,dotFollowing:false,dotCollision:false,unfinishedProject:false
    });
    this.schedule(22000,()=>this.autonomous());
    const familyByPrefix:Record<string,Family>={N:'nature',S:'space',R:'room',D:'desktop'};
    const family=familyByPrefix[id[0]];
    if(family){
      this.state.family=family;
      this.state.era='experimental';
      this.state.stage=familyArcs[family].includes(id)?'interactive':'personalized';
      this.state.project=null;
      this.state.projectStep=0;
      if(family==='nature'){
        this.state.turtle=true;
        this.state.pond=/^N00[6-9]$|^N010$/.test(id);
        this.state.rain=id==='N004';
      }
      if(family==='space')this.state.stars=8;
      if(family==='desktop'){
        this.state.desktopWindowIntroduced=true;
        this.state.windowOpen=true;
        this.state.secondWindow=id==='D004'||id==='D005'?'open':'absent';
        this.state.desktopLayout='cascade';
        this.state.desktopLayoutRevision++;
        this.state.desktopJobs=false;
        this.state.desktopTaskbar=false;
        this.state.desktopWallpaper=false;
      }
      if(family==='room'){
        this.state.roomWindowIntroduced=/^R00[6-9]$|^R010$/.test(id);
        this.state.roomShelfIntroduced=/^R01[1-5]$/.test(id);
      }
      if(family==='room')this.state.lampOn=id!=='R001';
      if(id==='S012'||id==='S013'||id==='S014'||id==='S015')this.state.moonVisible=true;
      if(/^N01[1-5]$|^D01[1-5]$/.test(id))this.state.petVisible=true;
      if(/^N02[1-5]$/.test(id)){
        this.state.gameScore=0;
        this.state.showScore=true;
      }
      this.startFamilyBeat(id);
      return;
    }
    if(/^C02[0-7]$/.test(id)){
      this.state.family=null;
      this.state.project=null;
      this.state.crossFeature=null;
      this.state.interactionBeats=0;
      this.state.era='modern';
    }
    this.scene(id);
  }
  debugMutation(id:'turtle'|'pond'|'rain',active:boolean){if(this.state.status!=='active')return;this.state[id]=active;this.emit()}
  terminate(reason='player',presentation=true){if(this.state.status==='dead'||this.state.status==='terminating')return;if(reason==='player')this.state.events=[...this.state.events,{type:'EXIT_ACTIVATED',at:this.clock.now()}];this.cancel();this.beatToken++;this.checkpoint();this.state.status='terminating';this.state.choices=null;this.state.step=reason;this.emit();if(presentation){const task={cancel:()=>{},due:this.clock.now()+650,cb:()=>{}};task.cancel=this.clock.schedule(650,()=>{this.tasks.delete(task);if(!this.disposed){this.state.status='dead';this.emit()}});this.tasks.add(task)}else{this.state.status='dead';this.emit()}}
  dispose(){this.cancel();this.disposed=true;this.listeners.clear()}
}
