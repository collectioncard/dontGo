import type {State} from './engine';
export type Crossover = {id:string;feature:string};
/** A crossover is eligible only when its referenced in-session objects exist. */
export function eligibleCrossovers(s:State,repeated:boolean):Crossover[]{
 const out:Crossover[]=[],beautiful=(s.preferences.beautiful||0)>=2,has=(f:string)=>s.unlockedFamilies.includes(f as typeof s.unlockedFamilies[number]);
 if(beautiful&&s.family==='nature'&&s.turtle)out.push({id:'X001',feature:'astronaut'});
 if(beautiful&&s.family==='nature'&&s.pond)out.push({id:'X002',feature:'pond-night'});
 if(beautiful&&s.family==='room')out.push({id:'X005',feature:'window-stars'});
 if(s.family==='room'&&has('nature')&&s.pond)out.push({id:'X003',feature:'pond-window'});
 if(s.family==='room'&&has('nature')&&s.completed.includes('N020'))out.push({id:'X004',feature:'terrarium'});
 if(s.family==='room'&&has('space')&&s.constellationKept)out.push({id:'X006',feature:'wall-stars'});
 if(s.family==='desktop'&&has('nature')&&s.turtle)out.push({id:'X007',feature:'turtle-app'});
 if(s.family==='desktop'&&has('nature')&&s.pond)out.push({id:'X008',feature:'pond-wallpaper'});
 if(s.family==='desktop'&&has('space')&&s.constellationKept&&s.events.some(e=>e.value==='better'))out.push({id:'X009',feature:'star-app'});
 if(s.family==='desktop'&&has('space')&&s.orbitKept)out.push({id:'X010',feature:'orbit-icon'});
 if(s.family==='desktop'&&has('room'))out.push({id:'X011',feature:'room-app'},{id:'X012',feature:'room-wallpaper'});
 if(s.approvals>0&&s.rejections>0)out.push({id:'X013',feature:'pending-preview'});
 if(s.family==='room'&&has('nature')&&s.gameKept)out.push({id:'X014',feature:'room-game'});
 if(s.abandonedProject&&s.rejections>0)out.push({id:'X015',feature:'teardown'});
 if(s.quietWasRequested&&s.resumedAfterQuiet&&s.character.urgency>=40&&!s.quiet)out.push({id:'X016',feature:'quiet-project'});
 if(s.abandonedProject&&s.pond&&has('room'))out.push({id:'X017',feature:'bridge-sketch'});
 if(s.stage==='desperate'&&s.rejections>0)out.push({id:'X018',feature:'overcorrect'});
 if(s.events.filter(e=>e.type==='VIEWPORT_RESIZED').length>=2)out.push({id:'X019',feature:'boundary'});
 if(repeated)out.push({id:'X020',feature:'favorite'});
 return out.filter(x=>!s.completed.includes(x.id));
}
