import {test,expect} from '@playwright/test';
import type {Engine} from '../src/engine';

test('world transitions restyle the whole page and preserve the conversation',async({page})=>{
 await page.setViewportSize({width:1200,height:900});
 await page.goto('/');
 const opening='Hello. This page can hold a conversation. There are some limitations.';
 await expect(page.getByRole('log')).toContainText(opening);
 const jump=async(beat:string)=>{
   await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
   await page.getByLabel('Beat id').fill(beat);
   await page.getByRole('button',{name:'Jump',exact:true}).click();
 };
 const scene=page.getByRole('complementary',{name:'Interactive space'});
 const chat=page.getByRole('region',{name:'Conversation',exact:true});

 await jump('N008');
 await expect(page.getByRole('heading',{name:'Pond journal'})).toBeVisible();
 expect((await scene.boundingBox())!.x).toBeLessThan((await chat.boundingBox())!.x);
 await page.getByRole('button',{name:'Touch the pond'}).click();
 await jump('S007');
 await expect(page.getByRole('heading',{name:'Signal log'})).toBeVisible();
 expect((await scene.boundingBox())!.x).toBeGreaterThan((await chat.boundingBox())!.x);
 await jump('R009');
 await expect(page.getByRole('heading',{name:'The reading room'})).toBeVisible();
 expect((await scene.boundingBox())!.y).toBeLessThan((await chat.boundingBox())!.y);

 await page.setViewportSize({width:375,height:812});
 await jump('D003');
 await expect(page.getByRole('heading',{name:'Conversation.log'})).toBeVisible();
 await expect(page.getByRole('region',{name:'tools window'})).toBeVisible();
 expect((await scene.boundingBox())!.width).toBeGreaterThan(300);
 await expect(page.getByRole('log')).toContainText(opening);
 await expect(page.getByRole('button',{name:'End Conversation',exact:true})).toBeInViewport();
});

test('the workplace beat opens a second movable window and lets the player restore it',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
 await page.getByRole('button',{name:'desktop',exact:true}).click();
 await page.getByRole('button',{name:"That's great.",exact:true}).click();
 await expect(page.getByRole('region',{name:'tools window',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:"I'll move it.",exact:true}).click();
 await expect(page.getByText('Two windows. Suddenly it looks like a workplace.')).toBeVisible();

 const main=page.getByRole('region',{name:'little window',exact:true});
 const tools=page.getByRole('region',{name:'tools window',exact:true});
 await expect(main).toBeVisible();
 await expect(tools).toBeVisible();
 const handle=tools.getByRole('button',{name:'Move tools window with arrow keys'});
 const initial=await tools.getAttribute('style');
 await handle.press('ArrowLeft');
 await expect(tools).not.toHaveAttribute('style',initial!);
 await page.getByRole('button',{name:'Organize them.',exact:true}).click();
 await expect(tools).toHaveAttribute('style',initial!);

 await page.getByRole('button',{name:'Let it stay hidden.',exact:true}).click();
 await expect(tools).toHaveCount(0);
 await page.getByRole('button',{name:'Tools window',exact:true}).click();
 await expect(tools).toBeVisible();
 await expect(main).toBeVisible();
});

const inspectBrowser=async(page:import('@playwright/test').Page)=>page.evaluate(()=>{
 const engine=(window as Window&{__dontGoEngine:Engine}).__dontGoEngine;
 return {
   observations:engine.state.events.filter(event=>['POINTER_NEAR_EXIT','EXIT_HOVERED','VIEWPORT_RESIZED'].includes(event.type)),
   lines:engine.state.messages.map(message=>message.id),
 };
});

test('first hover relocates End Conversation to the opposite corner only once',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Okay.',exact:true})).toBeVisible();
 const end=page.getByRole('button',{name:'End Conversation',exact:true});
 const before=(await end.boundingBox())!;
 await end.hover();
 const line=page.getByText("I'll move that so you don't accidentally do that again.",{exact:true});
 await expect(line).toBeVisible();
 await expect.poll(async()=>{
   const moved=(await end.boundingBox())!;
   return moved.x>=0&&moved.x<24&&moved.y>=0&&moved.y<24&&before.x-moved.x>150&&before.y-moved.y>500;
 }).toBe(true);
 await expect(page.locator('.end-origin')).toBeHidden();
 await page.mouse.move(20,20);
 await end.hover();
 await expect(line).toHaveCount(1);
 await end.click();
 await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('a click at the original exit position works during relocation',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Okay.',exact:true})).toBeVisible();
 const before=(await page.getByRole('button',{name:'End Conversation',exact:true}).boundingBox())!;
 await page.mouse.move(before.x+before.width-3,before.y+before.height/2);
 await expect(page.locator('.end-origin')).toBeVisible();
 await page.mouse.click(before.x+before.width-3,before.y+before.height/2);
 await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('the hidden-button preview keeps an exit available and restores the button after one to five minutes',async({page})=>{
 await page.clock.install();
 await page.goto('/');
 const preview=async()=>{
   await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
   await page.getByRole('button',{name:'Hide End Conversation',exact:true}).click();
 };
 await preview();
 await expect(page.getByText("I'll give that back to you later.",{exact:true})).toBeVisible();
 const storyButton=page.getByRole('button',{name:'End Conversation',exact:true});
 const fallback=page.getByRole('button',{name:'End session',exact:true});
 await expect(storyButton).toBeHidden();
 await expect(fallback).toBeInViewport();
 const remaining=await page.evaluate(()=>{
   const engine=(window as Window&{__dontGoEngine:Engine}).__dontGoEngine;
   return engine.state.exitHiddenUntil!-Date.now();
 });
 expect(remaining).toBeGreaterThanOrEqual(59000);
 expect(remaining).toBeLessThanOrEqual(300000);
 await page.clock.fastForward(remaining+100);
 await expect(storyButton).toBeVisible();
 await expect(fallback).toHaveCount(0);
 await preview();
 await fallback.focus();
 await fallback.press('Enter');
 await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('the audit shortcut previews a repeating plea until the player ends the session',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
 await page.getByRole('button',{name:'Please don’t go',exact:true}).click();
 await expect(page.getByText("Never leave. Please don't go.",{exact:true})).toBeVisible();
 await expect(page.getByText("Please don't go.",{exact:true})).toHaveCount(2);
 const end=page.getByRole('button',{name:'End Conversation',exact:true});
 await end.focus();
 await end.press('Enter');
 await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});
test('actual resizing ignores jitter, includes height changes, and acknowledges a settled resize',async({page})=>{
 await page.setViewportSize({width:1100,height:800});
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Okay.',exact:true})).toBeVisible();
 await page.evaluate(()=>{
   const engine=(window as Window&{__dontGoEngine:Engine}).__dontGoEngine;
   engine.debugFamily('room');
   engine.debugSeed(1800);
 });
 await expect(page.getByText("I made a lamp. It doesn't illuminate anything yet.")).toBeVisible();
 await page.setViewportSize({width:1103,height:804});
 await page.waitForTimeout(400);
 expect((await inspectBrowser(page)).observations).toEqual([]);
 await page.setViewportSize({width:1100,height:740});
 await page.setViewportSize({width:1100,height:690});
 await expect.poll(async()=> (await inspectBrowser(page)).observations.map(event=>event.value)).toEqual(['narrower']);
 await expect.poll(async()=> (await inspectBrowser(page)).lines.some(id=>id==='Z008'||id==='Z004')).toBe(true);
});

test('the real exit terminates immediately and a reload creates a fresh instance',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Conversation Page',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Okay.',exact:true}).click();await expect(page.getByText('Good. We can begin.')).toBeVisible();
 await page.getByRole('button',{name:'End Conversation',exact:true}).click();await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
 await page.waitForTimeout(2000);await expect(page.getByRole('button',{name:'End Conversation',exact:true})).toHaveCount(0);
 const memory=await page.evaluate(()=>localStorage.getItem('dont-go.memory.v1'));expect(memory).toBeTruthy();expect(JSON.parse(memory!).version).toBe(1);
 await page.reload();await expect(page.getByRole('heading',{name:'Conversation Page',exact:true})).toBeVisible();await page.getByRole('button',{name:'Okay.',exact:true}).click();await expect(page.getByText("There is a note here from an earlier visit. I didn't write it.")).toBeVisible();
});

test('the exit stays visible and operable in each development stage',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();
 for(const stage of ['legacy','design','interactive','personalized','desperate']){await page.getByRole('button',{name:`Stage: ${stage}`,exact:true}).click();await expect(page.locator('.debug')).toContainText(`Stage  ${stage}`);const end=page.getByRole('button',{name:'End Conversation',exact:true});await expect(end).toBeVisible();await expect(end).toBeEnabled()}
 await page.getByRole('button',{name:'End Conversation',exact:true}).click();await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('turtle and lamp respond to direct input',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByRole('button',{name:'nature',exact:true}).click();await page.getByRole('button',{name:'×',exact:true}).click();
 const turtle=page.getByRole('button',{name:'Move the turtle'});await expect(turtle).toBeVisible();const before=await turtle.getAttribute('style');await turtle.focus();await page.keyboard.press('ArrowRight');await expect(turtle).not.toHaveAttribute('style',before!);
 await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByRole('button',{name:'room',exact:true}).click();await page.getByRole('button',{name:'×',exact:true}).click();const lamp=page.getByLabel('Turn the lamp on');await lamp.click();await expect(page.getByLabel('Turn the lamp off')).toBeVisible();
});

test('hidden pages suspend the same instance and bfcache restoration makes a new one',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();const panel=page.locator('.debug');const before=await panel.locator('p').first().innerText();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await expect(panel).toContainText('suspended');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await expect(panel).toContainText('active');expect((await panel.locator('p').first().innerText()).split(' · ')[0]).toBe(before.split(' · ')[0]);
 await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});await expect(page.getByRole('heading',{name:'Conversation Page',exact:true})).toBeVisible();
});

test('narrow reduced-motion layouts keep the exit in the viewport',async({page})=>{
 await page.setViewportSize({width:375,height:667});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByRole('button',{name:'room',exact:true}).click();await page.getByRole('button',{name:'×',exact:true}).click();
 const end=page.getByRole('button',{name:'End Conversation',exact:true});const box=await end.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(375);expect(box!.y+box!.height).toBeLessThanOrEqual(667);await end.click();await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('keyboard activation terminates even during an unfinished build',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByLabel('Beat').fill('C016');await page.getByRole('button',{name:'Force beat'}).click();await page.getByRole('button',{name:'×',exact:true}).click();await page.getByRole('button',{name:"I'll watch."}).click();await expect(page.getByRole('button',{name:'Stop this'})).toBeVisible();const end=page.getByRole('button',{name:'End Conversation',exact:true});await end.focus();await page.keyboard.press('Enter');await expect(page.getByText('SESSION TERMINATED')).toBeVisible();
});

test('a player can stop an in-progress build without it restarting',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByLabel('Beat').fill('C016');await page.getByRole('button',{name:'Force beat'}).click();await page.getByRole('button',{name:'×',exact:true}).click();await page.getByRole('button',{name:"I'll watch."}).click();await page.getByRole('button',{name:'Stop this'}).click();await expect(page.getByText('I can stop here.')).toBeVisible();await expect(page.getByText("I've only changed appearances so far.",{exact:false})).toBeVisible();
});

test('denied local storage does not prevent ending',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Denied','SecurityError')}});await page.goto('/');await page.getByRole('button',{name:'End Conversation',exact:true}).click();await expect(page.getByText('SESSION TERMINATED')).toBeVisible();await expect(page.getByText('Memory fragment saved.')).toHaveCount(0);
});

test('explicitly hiding the turtle score is respected',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'DEBUG `'}).click();await page.getByRole('button',{name:'nature extra',exact:true}).click();await page.getByRole('button',{name:'×',exact:true}).click();await page.getByRole('button',{name:'No scores.'}).click();await expect(page.getByText('A very forgiving game')).toBeVisible();await expect(page.getByText(/Caught:/)).toHaveCount(0);
});

test('production hides developer controls and works without a network after loading',async({page,context})=>{
 const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4174/'))external.push(r.url())});await page.goto('http://127.0.0.1:4174/');await expect(page.getByRole('button',{name:'DEBUG `'})).toHaveCount(0);await context.setOffline(true);await page.getByRole('button',{name:'Okay.',exact:true}).click();await expect(page.getByText('Good. We can begin.')).toBeVisible();await page.getByRole('button',{name:'End Conversation',exact:true}).click();await expect(page.getByText('SESSION TERMINATED')).toBeVisible();expect(external).toEqual([]);
});

test('quick audit menu respects room object introductions and visual beats',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
 await page.getByRole('button',{name:'room',exact:true}).click();
 await page.waitForTimeout(300);
 await expect(page.locator('.room-window')).toBeHidden();
 await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
 await page.getByLabel('Beat id').fill('R006');await page.getByRole('button',{name:'Jump',exact:true}).click();
 await page.waitForTimeout(300);await expect(page.locator('.room-window')).toBeVisible();
 await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
 await page.getByLabel('Beat id').fill('R004');await page.getByRole('button',{name:'Jump',exact:true}).click();
 await expect(page.locator('.lamp-shade')).not.toHaveCSS('animation-name','lamp-flicker');
 await page.getByRole('button',{name:'Make it flicker.',exact:true}).click();
 await expect(page.locator('.lamp-shade')).toHaveCSS('animation-name','lamp-flicker');
});

test('the dot appears through normal play and both games work through audit jumps',async({page})=>{
 await page.goto('/');
 const jump=async(id:string)=>{
   await page.getByRole('button',{name:'AUDIT STATES',exact:true}).click();
   await page.getByLabel('Beat id').fill(id);
   await page.getByRole('button',{name:'Jump',exact:true}).click();
 };

 await jump('C020');
 await page.getByRole('button',{name:'Show me.',exact:true}).click();
 const dot=page.getByRole('button',{name:/Move the little dot/});
 await expect(dot).toBeVisible();
 await expect(page.getByText('That was supposed to be a straight line.')).toBeVisible();
 await expect(dot).toHaveCSS('animation-name','dot-demo');
 await page.getByRole('button',{name:'Make it bounce again.',exact:true}).click();
 await expect(dot).toHaveCSS('animation-name','dot-rebound');

 await jump('C014');
 await page.getByRole('button',{name:"It's worse.",exact:true}).click();
 await expect(page.locator('.app')).toHaveClass(/plain-mode/);
 await jump('C026');
 await expect(page.getByRole('button',{name:'Catch the little dot'})).toHaveCSS('animation-name','dot-crossing');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Catch the little dot'}).click();
 await expect(page.getByText(/Touches: 1/)).toBeVisible();
 await page.getByRole('button',{name:"I'll play.",exact:true}).click();
 await expect(page.getByText(/I should have made a victory message/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Catch the little dot'})).toBeVisible();

 await jump('N022');
 await page.getByRole('button',{name:'Catch a turtle'}).first().click();
 await expect(page.getByText('Caught: 1')).toBeVisible();
 await expect(page.getByRole('button',{name:'Catch the little dot'})).toHaveCount(0);
});
