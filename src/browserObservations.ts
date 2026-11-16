import type {Engine} from './engine';

export function observeBrowser(engine:Engine, getExit:()=>HTMLButtonElement|null){
  let approachTimer:number|undefined;
  let hoverTimer:number|undefined;
  let resizeTimer:number|undefined;
  let exitRegionActive=false;
  let outsideSince=-Infinity;
  let hovered=false;
  let lastActivity=0;
  let lastSize={width:window.innerWidth,height:window.innerHeight};
  let lastResizeAt=-Infinity;

  function clearPointer(){
    window.clearTimeout(approachTimer);
    window.clearTimeout(hoverTimer);
    approachTimer=undefined;
    hoverTimer=undefined;
    hovered=false;
    if(exitRegionActive)outsideSince=Date.now();
    exitRegionActive=false;
  }

  function move(event:PointerEvent){
    if(document.hidden||event.pointerType==='touch'||event.buttons)return;
    const now=Date.now();
    if(now-lastActivity>=1000){
      lastActivity=now;
      engine.dispatch({type:'ACTIVITY',at:now});
    }
    const bounds=getExit()?.getBoundingClientRect();
    if(!bounds)return;
    const {clientX:x,clientY:y}=event;
    const inside=x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom;
    const margin=Math.max(60,Math.min(100,window.innerWidth*.08));
    const near=x>=bounds.left-margin&&x<=bounds.right+margin&&y>=bounds.top-margin&&y<=bounds.bottom+margin;
    if(!near){clearPointer();return}
    if(!exitRegionActive&&now-outsideSince>=550){
      exitRegionActive=true;
      approachTimer=window.setTimeout(()=>{
        approachTimer=undefined;
        const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        engine.dispatch({type:'POINTER_NEAR_EXIT',at:Date.now(),value:hovered?'hover':reducedMotion?'reduced-motion':'approach'});
      },140);
    }
    if(inside===hovered)return;
    hovered=inside;
    window.clearTimeout(hoverTimer);
    if(inside){
      engine.cancelExitFlinch();
      hoverTimer=window.setTimeout(()=>engine.dispatch({type:'EXIT_HOVERED',at:Date.now(),value:'long'}),950);
    }
  }

  function cancelInteraction(){
    clearPointer();
    engine.cancelExitFlinch();
  }

  function pointerOut(event:PointerEvent){
    if(!event.relatedTarget)cancelInteraction();
  }

  function resize(){
    cancelInteraction();
    window.clearTimeout(resizeTimer);
    resizeTimer=window.setTimeout(()=>{
      if(document.hidden)return;
      const size={width:window.innerWidth,height:window.innerHeight};
      const widthChange=size.width-lastSize.width;
      const heightChange=size.height-lastSize.height;
      if(Math.max(Math.abs(widthChange),Math.abs(heightChange))<32)return;
      lastSize=size;
      const at=Date.now();
      const majorChange=Math.abs(widthChange)>=Math.abs(heightChange)?widthChange:heightChange;
      const value=at-lastResizeAt<1100?'rapid':majorChange>0?'wider':'narrower';
      lastResizeAt=at;
      engine.dispatch({type:'VIEWPORT_RESIZED',at,value});
    },320);
  }

  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerout',pointerOut);
  window.addEventListener('pointerdown',cancelInteraction);
  window.addEventListener('pointercancel',cancelInteraction);
  window.addEventListener('blur',cancelInteraction);
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',cancelInteraction);
  return ()=>{
    clearPointer();
    window.clearTimeout(resizeTimer);
    window.removeEventListener('pointermove',move);
    window.removeEventListener('pointerout',pointerOut);
    window.removeEventListener('pointerdown',cancelInteraction);
    window.removeEventListener('pointercancel',cancelInteraction);
    window.removeEventListener('blur',cancelInteraction);
    window.removeEventListener('resize',resize);
    document.removeEventListener('visibilitychange',cancelInteraction);
  };
}
