(()=>{'use strict';
const logo=cls=>{const img=document.createElement('img');img.src='/island-vibes/tournaments/iv-logo.jpg';img.className=cls;img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';return img};
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let pending=false;
function decorate(){
 pending=false;const main=$('#main');if(!main)return;
 const hero=main.querySelector('.hero');
 if(hero){
   if(!hero.querySelector('.island-eyebrow')){
      const eyebrow=document.createElement('div');eyebrow.className='island-eyebrow';
      const mark=document.createElement('span');mark.className='island-eyebrow-mark';mark.textContent='✦';
      const copy=document.createElement('span');copy.textContent='THE NEXT BIG GAME NIGHT';
      eyebrow.append(mark,copy);hero.querySelector('.hero-text')?.prepend(eyebrow);
   }
   if(!main.querySelector('.island-gameflow')){
     const flow=document.createElement('div');flow.className='island-gameflow';
     const steps=[['01','GET IN','Register from your phone'],['02','CHECK IN','Tell the host you made it'],['03','GAME ON','Follow the live bracket']];
     for(const [i,title,caption] of steps){const el=document.createElement('div');el.className='island-gameflow-step';
       const n=document.createElement('span');n.className='flow-number';n.textContent=i;
       const b=document.createElement('div');b.className='flow-copy';const strong=document.createElement('strong');strong.textContent=title;
       const small=document.createElement('small');small.textContent=caption;b.append(strong,small);el.append(n,b);flow.append(el);
     }
     flow.append(logo('flow-logo'));hero.after(flow);
   }
 }
 for(const section of main.querySelectorAll('.section-head')){
    const first=section.firstElementChild;
    if(!first||first.classList.contains('island-heading')||!first.querySelector('h2'))continue;
    first.classList.add('island-heading');first.prepend(logo('island-section-logo'));
 }
 for(const tile of main.querySelectorAll('.event-tile')){
    if(tile.querySelector('.island-event-logo'))continue;
    const arrow=tile.querySelector('.event-arrow');
    if(arrow)arrow.before(logo('island-event-logo'));
 }
 for(const mark of main.querySelectorAll('.bracket-heading')){
   if(mark.querySelector('.island-bracket-logo'))continue;
   mark.append(logo('island-bracket-logo'));
 }
 const host=main.querySelector('.host-strip');if(host&&!host.querySelector('.island-host-logo'))host.prepend(logo('island-host-logo'));
 const reg=main.querySelector('form[data-form="register"]');
 if(reg&&!reg.querySelector('.island-signup-banner')){
   const b=document.createElement('div');b.className='island-signup-banner';
   b.append(logo('island-signup-logo'));
   const c=document.createElement('span');c.textContent='YOU’RE ONE STEP CLOSER TO GAME NIGHT';b.append(c);
   reg.prepend(b);
 }
 const cal=main.querySelector('.calendar-top');if(cal&&!cal.querySelector('.island-calendar-logo'))cal.prepend(logo('island-calendar-logo'));
}
function schedule(){if(pending)return;pending=true;(window.requestAnimationFrame||((cb)=>window.setTimeout(cb,0)))(decorate)}
function init(){
 const main=$('#main');if(!main)return;
 new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();