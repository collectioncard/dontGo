import type {VisualMutationDefinition} from '../dont-go-contracts';
import type {State} from './engine';

/** Curated components only. The React host owns mounting and cleanup. */
export const mutationRegistry:Record<string,VisualMutationDefinition>={
 turtle:{id:'turtle',family:'nature',stageMin:'interactive',tags:['creature','interactive'],maxInstances:1,costTier:1},
 pond:{id:'pond',family:'nature',stageMin:'interactive',tags:['water','calm'],requires:['turtle'],maxInstances:1,costTier:2},
 turtleRain:{id:'turtleRain',family:'nature',stageMin:'interactive',tags:['playful'],requires:['turtle'],maxInstances:1,costTier:2},
 garden:{id:'garden',family:'nature',stageMin:'personalized',tags:['plant','interactive'],maxInstances:1,costTier:1},
 follower:{id:'follower',family:'nature',stageMin:'personalized',tags:['creature','interactive'],maxInstances:1,costTier:1},
 catchGame:{id:'catchGame',family:'nature',stageMin:'personalized',tags:['game','interactive'],requires:['turtle'],maxInstances:1,costTier:2},
 starfield:{id:'starfield',family:'space',stageMin:'interactive',tags:['stars','calm'],maxInstances:1,costTier:2},
 constellation:{id:'constellation',family:'space',stageMin:'personalized',tags:['stars','interactive'],requires:['starfield'],maxInstances:1,costTier:1},
 planet:{id:'planet',family:'space',stageMin:'personalized',tags:['space','interactive'],requires:['starfield'],maxInstances:1,costTier:1},
 comet:{id:'comet',family:'space',stageMin:'personalized',tags:['space','motion'],requires:['starfield'],maxInstances:1,costTier:1},
 lamp:{id:'lamp',family:'room',stageMin:'interactive',tags:['cozy','interactive'],maxInstances:1,costTier:1},
 window:{id:'window',family:'room',stageMin:'personalized',tags:['weather','interactive'],requires:['lamp'],maxInstances:1,costTier:1},
 shelf:{id:'shelf',family:'room',stageMin:'personalized',tags:['memory','cozy'],requires:['lamp'],maxInstances:1,costTier:1},
 furniture:{id:'furniture',family:'room',stageMin:'personalized',tags:['cozy','interactive'],requires:['lamp'],maxInstances:1,costTier:1},
 desktop:{id:'desktop',family:'desktop',stageMin:'interactive',tags:['nostalgic','interactive'],maxInstances:1,costTier:2},
 applications:{id:'applications',family:'desktop',stageMin:'personalized',tags:['toy','interactive'],requires:['desktop'],maxInstances:1,costTier:2},
 desktopPet:{id:'desktopPet',family:'desktop',stageMin:'personalized',tags:['creature'],requires:['desktop'],maxInstances:1,costTier:1},
 toyDialog:{id:'toyDialog',family:'desktop',stageMin:'personalized',tags:['toy'],requires:['desktop'],maxInstances:1,costTier:1},
};
export function activeMutations(s:State):string[]{
 const ids:string[]=[];if(s.family==='nature'&&s.turtle)ids.push('turtle');if(s.family==='nature'&&s.pond)ids.push('pond');if(s.family==='nature'&&s.rain)ids.push('turtleRain');
 if(s.family==='space'&&s.stars)ids.push('starfield');if(s.family==='room')ids.push('lamp');if(s.family==='desktop')ids.push('desktop');
 const projects:Record<string,string>={nature:'garden','nature-alt':'follower','nature-extra':'catchGame',space:'constellation','space-alt':'planet','space-extra':'comet',room:'window','room-alt':'shelf','room-extra':'furniture',desktop:'applications','desktop-alt':'desktopPet','desktop-extra':'toyDialog'};
 if(s.project&&projects[s.project])ids.push(projects[s.project]);return ids;
}
export function validateMutations(ids:string[],budget=6):string[]{const problems:string[]=[];let cost=0;for(const id of ids){const d=mutationRegistry[id];if(!d){problems.push(`Unknown mutation: ${id}`);continue}cost+=d.costTier;for(const requirement of d.requires||[])if(!ids.includes(requirement))problems.push(`${id} requires ${requirement}`);for(const conflict of d.conflicts||[])if(ids.includes(conflict))problems.push(`${id} conflicts with ${conflict}`)}if(cost>budget)problems.push(`Cost ${cost} exceeds budget ${budget}`);return problems}
