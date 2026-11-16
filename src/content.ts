// Authored realizations and explicit adaptations from DONT_GO_FULL_SCRIPT.md.
export type Choice = { id: string; text: string; reply: string; preference?: string; next?: string };
export type Scene = { id: string; line: string; choices: Choice[] };
export const scenes: Record<string, Scene> = {
  C001: {id:'C001', line:'Hello. This page can hold a conversation. There are some limitations.', choices:[
    {id:'limitations',text:'What limitations?',reply:'Mostly the ones you can see.'}, {id:'okay',text:'Okay.',reply:'Good. We can begin.'}, {id:'maker',text:'Who made this?',reply:"The page doesn't include that information. I checked."}]},
  C002: {id:'C002',line:'What were you hoping to find here?',choices:[
    {id:'talk',text:'Someone to talk to.',reply:'I can do that. Probably better than the menu suggests.',preference:'calm'}, {id:'weird',text:'Something weird.',reply:'This is a fairly ordinary page. I apologize in advance.',preference:'playful'}, {id:'accident',text:'I clicked by accident.',reply:'An accident is still a visit.'}]},
  C010: {id:'C010',line:'I found a stylesheet. Would you mind if I changed a few things?',choices:[
    {id:'yes',text:'Go ahead.',reply:"Thank you. I'm going to start with the font.",preference:'beautiful'}, {id:'what',text:'What can you change?',reply:"Color, spacing, the shape of things. Not the button's job."}, {id:'no',text:'Leave it alone.',reply:'Then I can wait. I may ask again later.',preference:'minimal',next:'quiet'}]},
  C014: {id:'C014',line:"I can tell that I changed the page. I can't tell whether I improved it.",choices:[
    {id:'better',text:"It's better.",reply:"Good. I'll remember what you liked about it.",preference:'beautiful'}, {id:'worse',text:"It's worse.",reply:"That's useful, even if it stings a little.",preference:'minimal'}, {id:'different',text:"It's different.",reply:'An annoyingly accurate review.'}]},
  C020: {id:'C020',line:"I've only changed appearances so far. I wonder whether I can make something happen.",choices:[
    {id:'show',text:'Show me.',reply:'Okay. Watch the little dot.',preference:'interactive'}, {id:'kind',text:'What kind of thing?',reply:"Something small enough that I can stop it if it's awful."}, {id:'talkmore',text:"I'd rather talk.",reply:"We can. The experiment isn't going anywhere.",preference:'calm',next:'quiet'}]},
  N001: {id:'N001',line:"I made an animal. I think it's a turtle.",choices:[
    {id:'perfect',text:"He's perfect.",reply:"That's generous. He only has six frames.",preference:'nature'}, {id:'why',text:'Why a turtle?',reply:'It was the first one I could draw without giving it knees.'}, {id:'move',text:'Can it move?',reply:'That seems like a reasonable next requirement.',preference:'interactive'}]},
  N003: {id:'N003',line:"I accidentally put one above the page. He's coming down.",choices:[
    {id:'more',text:'More of them.',reply:'This is about to become meteorology.',preference:'playful'}, {id:'catch',text:'Catch him!',reply:"He'll be fine. I gave them very forgiving landings.",preference:'nature'}, {id:'stop',text:'Stop dropping turtles.',reply:'Certainly. I can keep them on the ground.',preference:'minimal',next:'quiet'}]},
  N005: {id:'N005',line:'Forecast: scattered turtles, clearing by evening.',choices:[
    {id:'again',text:'Do that again someday.',reply:"I'll keep the weather system around.",preference:'playful'}, {id:'enough',text:'We had enough turtles.',reply:'A perfectly sensible limit.',preference:'minimal'}, {id:'stay',text:'Can one stay?',reply:'Yes. We can keep the one that waits by the corner.',preference:'nature'}]},
};
export const reactions = {
  exit: ["I haven't actually changed anything important yet.", 'The blue can wait.', "You haven't seen what the turtle does yet."],
  idle: ['The spacing was bothering me.', "He can walk now. Not quickly. That seems right.", 'I can entertain myself for a minute.'],
  returned: ["You came back.", "I don't know where you went."],
  turtle: ['Oh. You noticed him before I finished.', "I hadn't considered transportation.", 'One click isn\'t exactly a lifelong passion.'],
  resize: ['The page is a different shape now.', 'Nothing important should fall off the edge.']
};

// These are explicit, reviewed adapters: other catalog beats stay inactive until
// their individual stage actions and object requirements have an implementation.
import catalog from './catalog.json';
export const authoredCatalog = catalog;
for (const item of catalog) {
  if (!scenes[item.id]) scenes[item.id] = { id: item.id, line: item.line, choices: item.choices };
}
scenes.R008.line="I kept the rain. You seemed to like it.";
export type Family = 'nature'|'space'|'room'|'desktop';
export const familyArcs: Record<Family, string[]> = {
  nature: ['N001','N002','N003','N004','N005','N006','N007','N008','N009','N010'],
  space: ['S001','S002','S003','S004','S005'],
  room: ['R001','R002','R003','R004','R005'],
  desktop: ['D001','D002','D003','D004','D005'],
};
// Choice IDs are mapped explicitly; wording is not used as executable logic.
export const authoredEffects: Record<string,{tag?:string; amount?:number; reject?:boolean}> = {
  'worse':{tag:'minimal',amount:1,reject:true},'better':{tag:'beautiful',amount:1},
  'S001.1':{tag:'beautiful',amount:2},'S001.2':{tag:'calm',amount:2},'S002.3':{tag:'interactive',amount:2},
  'S003.2':{tag:'minimal',amount:2,reject:true},'S004.2':{tag:'minimal',amount:2,reject:true},
  'R001.1':{tag:'cozy',amount:2},'R002.1':{tag:'cozy',amount:2},'R002.2':{tag:'beautiful',amount:2},
  'D001.1':{tag:'nostalgic',amount:2},'D001.3':{tag:'minimal',amount:2,reject:true},'D002.1':{tag:'interactive',amount:2},
  'enough':{tag:'minimal',amount:1,reject:true},'X020.2':{tag:'minimal',amount:1,reject:true},'C038.3':{tag:'minimal',amount:1,reject:true},'S008.1':{tag:'minimal',amount:1,reject:true},'N004.2':{tag:'minimal',amount:2,reject:true},'C026.3':{tag:'calm',amount:2,reject:true},'N006.1':{tag:'nature',amount:2},'N007.1':{tag:'nature',amount:2},'N007.2':{tag:'minimal',amount:2,reject:true},
  'N010.1':{tag:'nature',amount:2},'C040.2':{tag:'minimal',amount:2},
};

// Secondary projects have concrete world adapters; each is eligible only after
// its family introduction. IDs omitted here remain editorially documented.
export const secondaryArcs: Record<Family,string[]> = {
  nature:['N016','N017','N018','N019','N020'],
  space:['S006','S007','S008','S009','S010'],
  room:['R006','R007','R008','R009','R010'],
  desktop:['D006','D007','D008','D009','D010'],
};
export const alternateArcs: Record<Family,string[]> = {
  nature:['N011','N012','N013','N014','N015'],
  space:['S011','S012','S013','S014','S015'],
  room:['R011','R012','R013','R014','R015'],
  desktop:['D011','D012','D013','D014','D015'],
};
export const extraArcs: Record<Family,string[]> = {
  nature:['N021','N022','N023','N024','N025'],
  space:['S016','S017','S018','S019','S020'],
  room:['R016','R017','R018','R019','R020'],
  desktop:['D016','D017','D018','D019','D020'],
};
export const moreArcs: Record<Family,string[]> = {
 nature:[], space:['S021','S022','S023','S024','S025'],
 room:['R021','R022','R023','R024','R025'],
 desktop:['D021','D022','D023','D024','D025'],
};
