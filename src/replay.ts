import {Engine,type Clock,type Event,type State} from './engine';
import type {InheritedMemoryV1} from '../dont-go-contracts';

/** Replays timestamped normalized input under a virtual clock. */
export function replaySession(seed:number,start:number,events:Event[],end:number,memory:InheritedMemoryV1|null):State {
 let now=start; const queue:{at:number;run:()=>void;cancelled:boolean}[]=[];
 const clock:Clock={now:()=>now,schedule:(delay,run)=>{const task={at:now+delay,run,cancelled:false};queue.push(task);return()=>{task.cancelled=true}}};
 const advance=(target:number)=>{for(;;){queue.sort((a,b)=>a.at-b.at);const task=queue.find(t=>!t.cancelled&&t.at<=target);if(!task)break;task.cancelled=true;now=task.at;task.run()}now=target};
 const engine=new Engine(seed,clock,memory,false);
 for(const event of events){if(event.source==='autonomous')continue;advance(Math.max(now,event.at));if(event.type==='CHOICE_SELECTED'&&event.value)engine.choose(event.value);else if(event.type==='BEAT_INTERRUPTED'&&event.value==='garden-remove')engine.removeGarden();else if(event.type==='BEAT_INTERRUPTED'&&(event.value==='stop'||event.value==='simplify'||event.value==='reject'))engine.interruptBeat(event.value);else if(event.type==='COLOR_CORRECTED')engine.correctColor();else if(event.type==='PERMISSION_CORRECTED')engine.correctPermission();else if(event.type==='JOKE_CORRECTED')engine.correctJoke();else if(event.type==='READING_CONFIRMED')engine.confirmReading();else if(event.type==='QUESTION_BOUNDARY')engine.askBoundary();else if(event.type==='OFFER_STAY')engine.offerStay();else if(event.type==='FAVORITE_CORRECTED')engine.correctFavorite();else if(event.type==='RESUME_TALKING')engine.resumeConversation();else if(event.type==='NAME_SET')engine.setName(event.value||'');else if(event.type==='PLAYER_HIDDEN')engine.suspend();else if(event.type==='PLAYER_RETURNED'&&engine.state.status==='suspended')engine.resume();else if(event.type==='EXIT_ACTIVATED')engine.terminate();else engine.dispatch(event)}
 advance(Math.max(now,end));const result=engine.state;engine.dispose();return result;
}
