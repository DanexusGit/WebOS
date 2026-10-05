'use strict';
/* INPUT: keeps typing working everywhere.
   1. Global shortcuts never see keys typed into a text field (document listeners run before window ones).
   2. Fields are focused explicitly inside the tap/click, which iOS Safari needs before it opens the keyboard.
   3. On phones, the visible height (without the keyboard) is exposed as --vvh and the focused field is scrolled into view. */
const FIELD='input:not([type=range]):not([type=checkbox]):not([type=color]):not([type=file]),textarea,[contenteditable=""],[contenteditable="true"]';
const isField=t=>t&&t.closest&&t.closest(FIELD);
['keydown','keypress','keyup'].forEach(t=>document.addEventListener(t,e=>{if(isField(e.target))e.stopPropagation()}));
['pointerdown','touchend','click'].forEach(t=>document.addEventListener(t,e=>{const f=isField(e.target);if(f&&document.activeElement!==f&&!f.readOnly&&!f.disabled)f.focus()},true));
if(window.visualViewport){const v=visualViewport,u=()=>document.documentElement.style.setProperty('--vvh',v.height+'px');v.addEventListener('resize',u);u()}
document.addEventListener('focusin',e=>{if(isField(e.target))setTimeout(()=>e.target.scrollIntoView({block:'center',behavior:'smooth'}),300)});
/* 4. Focus stealing: a game or web page running in a background window can call focus() on itself, which pulls the keyboard away from the
      field you are typing in (inert does not stop that across frames). When an iframe outside the focused window grabs focus, give it back. */
let lastField=null;document.addEventListener('focusin',e=>{if(isField(e.target))lastField=e.target});
addEventListener('blur',()=>setTimeout(()=>{const a=document.activeElement;if(a&&a.tagName==='IFRAME'&&lastField&&lastField.isConnected&&!a.closest('.win.focus'))lastField.focus()},0));
