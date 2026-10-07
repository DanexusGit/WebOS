'use strict';
/* WINDOW MANAGER: create/drag/resize/snap/minimise/maximise/close, z-order focus, dialogs, session save.
   Pointer events + setPointerCapture keep drags alive even when the cursor leaves the handle. */
const WMS={z:10,list:[],cur:null,restoring:false,
  create(o){const W=el('div','win'),n=WMS.list.length,ic=(OS.apps[o.appId]&&OS.apps[o.appId].icon)||o.icon||'🗔';
    const win={el:W,id:Math.random().toString(36).slice(2),title:o.title,icon:ic,appId:o.appId,args:o.args||{},max:false,min:false,snapped:false,onFocus:o.onFocus,onClose:o.onClose};
    W.style.cssText=`left:${o.x??50+n%8*30}px;top:${o.y??30+n%8*30}px;width:${o.w||640}px;height:${o.h||420}px`;
    W.innerHTML=`<div class="tb"><span>${ic} ${esc(o.title)}</span><span class="wb"><button data-a="min">–</button><button data-a="max">▢</button><button data-a="x">✕</button></span></div><div class="wc"></div>`+
      ['n','s','e','w','ne','nw','se','sw'].map(d=>`<i class="rz ${d}" data-d="${d}"></i>`).join('');
    $('.wc',W).append(o.body);$('#windows').append(W);WMS.list.push(win);
    W.addEventListener('pointerdown',()=>WMS.focus(win),true); // capture phase: any click inside raises the window
    $('.tb',W).ondblclick=()=>WMS.setMax(win,!win.max);$('.tb',W).oncontextmenu=e=>Ctx.win(e,win);$('.wc',W).oncontextmenu=e=>{if(!e.target.closest('input,textarea'))Ctx.win(e,win,1)};
    $('.wb',W).onclick=e=>{const a=e.target.dataset.a;if(a==='min')WMS.minimize(win);if(a==='max')WMS.setMax(win,!win.max);if(a==='x')WMS.close(win)};
    WMS.dragInit(win);WMS.resizeInit(win);WMS.focus(win);WMS.save();return win},
  /* Focus = highest z-index. Unfocused windows get dimmed by CSS (.win:not(.focus)). */
  focus(win){if(WMS.cur===win&&!win.min)return;if(win.min){win.min=false;win.el.classList.remove('hid');void win.el.offsetWidth;win.el.classList.remove('min')}
    win.el.style.zIndex=++WMS.z;WMS.list.forEach(w=>w.el.classList.toggle('focus',w===win));WMS.cur=win;
    OS.gameFocus=/^(game|geochat|unity|snake)$/.test(win.appId); // desktop shortcuts check this flag so games own the keyboard
    WMS.list.forEach(w=>$$('iframe',w.el).forEach(f=>f.inert=w!==win));win.onFocus&&win.onFocus();Desktop.tasks()},
  top(){return WMS.list.filter(w=>!w.min).sort((a,b)=>b.el.style.zIndex-a.el.style.zIndex)[0]},
  minimize(win){win.min=true;$$('iframe',win.el).forEach(f=>f.inert=true);win.el.classList.add('min');setTimeout(()=>{if(win.min)win.el.classList.add('hid')},230);win.el.classList.remove('focus');const t=WMS.top();t?WMS.focus(t):(WMS.cur=null,OS.gameFocus=false);Desktop.tasks()},
  setMax(win,on){const W=win.el;if(on===win.max)return;
    if(on&&!win.snapped)win.prev=[W.style.left,W.style.top,W.style.width,W.style.height];
    else if(!on&&win.prev)[W.style.left,W.style.top,W.style.width,W.style.height]=win.prev;
    win.max=on;win.snapped=false;W.classList.toggle('max',on);WMS.save()},
  close(win){win.onClose&&win.onClose();WMS.list=WMS.list.filter(w=>w!==win);win.el.classList.add('closing');setTimeout(()=>win.el.remove(),170);
    const t=WMS.top();t?WMS.focus(t):(WMS.cur=null,OS.gameFocus=false);Desktop.tasks();WMS.save()},
  preview(z){const s=$('#snap');if(!z){s.style.display='none';return}s.style.display='block';Object.assign(s.style,{left:z==='r'?'50%':'0',top:'0',width:z==='t'?'100%':'50%',height:'100%'})},
  half(win,z){const W=win.el;if(!win.snapped)win.prev=[W.style.left,W.style.top,W.style.width,W.style.height];win.snapped=true;Object.assign(W.style,{left:z==='r'?'50%':'0',top:'0',width:'50%',height:'100%'})},
  dragInit(win){const W=win.el,tb=$('.tb',W);
    tb.onpointerdown=e=>{if(OS.mobile||e.target.closest('button')||e.button)return;
      if(win.max||win.snapped){const fx=(e.clientX-W.getBoundingClientRect().left)/W.offsetWidth; // grab from maximised/snapped: restore size under the cursor
        if(win.max)WMS.setMax(win,false);else{[W.style.left,W.style.top,W.style.width,W.style.height]=win.prev;win.snapped=false}
        W.style.left=e.clientX-fx*W.offsetWidth+'px';W.style.top='0px'}
      const ox=e.clientX-W.offsetLeft,oy=e.clientY-W.offsetTop;$('#desktop').classList.add('dragging');tb.setPointerCapture(e.pointerId);
      let raf=0,lm;tb.onpointermove=m=>{lm=m;if(raf)return;raf=requestAnimationFrame(()=>{raf=0;W.style.left=lm.clientX-ox+'px';W.style.top=Math.max(0,lm.clientY-oy)+'px';
        win.zone=lm.clientX<8?'l':lm.clientX>innerWidth-8?'r':lm.clientY<8?'t':null;WMS.preview(win.zone)})}; // edge zones = Aero Snap
      tb.onpointerup=()=>{if(raf){cancelAnimationFrame(raf);raf=0;W.style.left=lm.clientX-ox+'px';W.style.top=Math.max(0,lm.clientY-oy)+'px'}tb.onpointermove=tb.onpointerup=null;$('#desktop').classList.remove('dragging');WMS.preview(null);
        if(win.zone==='t')WMS.setMax(win,true);else if(win.zone)WMS.half(win,win.zone);win.zone=null;WMS.save()}}},
  resizeInit(win){const W=win.el;$$('.rz',W).forEach(h=>h.onpointerdown=e=>{e.stopPropagation();WMS.focus(win);if(win.max)return;win.snapped=false;h.setPointerCapture(e.pointerId);
    const d=h.dataset.d,s={x:e.clientX,y:e.clientY,l:W.offsetLeft,t:W.offsetTop,w:W.offsetWidth,h:W.offsetHeight};$('#desktop').classList.add('dragging');
    h.onpointermove=m=>{const dx=m.clientX-s.x,dy=m.clientY-s.y;
      if(d.includes('e'))W.style.width=Math.max(260,s.w+dx)+'px';
      if(d.includes('s'))W.style.height=Math.max(160,s.h+dy)+'px';
      if(d.includes('w')){const w=Math.max(260,s.w-dx);W.style.width=w+'px';W.style.left=s.l+s.w-w+'px'}
      if(d.includes('n')){const hh=Math.max(160,s.h-dy);W.style.height=hh+'px';W.style.top=s.t+s.h-hh+'px'}};
    h.onpointerup=()=>{h.onpointermove=h.onpointerup=null;$('#desktop').classList.remove('dragging');WMS.save()}})},
  /* Session: open windows (app, args, geometry) are saved per user and re-opened after a reload. Guests are not persisted. */
  save(){if(!OS.user||OS.user.guest||WMS.restoring)return;OS.db.set('session:'+OS.user.name,WMS.list.map(w=>({a:w.appId,args:w.args,x:w.el.style.left,y:w.el.style.top,w:w.el.style.width,h:w.el.style.height,max:w.max})))},
  restore(){const s=OS.db.get('session:'+OS.user.name,[]);WMS.restoring=true;s.forEach(r=>OS.launch(r.a,r.args,r));WMS.restoring=false;WMS.save()}};

OS.launch=(id,args={},g)=>{const a=OS.apps[id];if(!a)return;const w=a.open(args);if(w&&g){Object.assign(w.el.style,{left:g.x,top:g.y,width:g.w,height:g.h});if(g.max)WMS.setMax(w,true)}return w};

/* Modal dialogs: a full-screen overlay blocks everything underneath until a button is pressed. Each helper returns a Promise. */
OS.dialog=(title,msg,{input,buttons=['OK']}={})=>new Promise(res=>{const m=$('#modal');m.hidden=false;
  m.innerHTML=`<div class="dlg"><h3>${esc(title)}</h3><p>${esc(msg)}</p>${input!=null?`<input value="${esc(input)}">`:''}<div>${buttons.map((b,i)=>`<button data-i="${i}">${esc(b)}</button>`).join('')}</div></div>`;
  const inp=$('input',m);if(inp){inp.focus();inp.onkeydown=e=>{if(e.key==='Enter')$('button',m).click()}}
  m.onclick=e=>{const b=e.target.closest('button');if(!b)return;m.hidden=true;Snd.click();res(input!=null?(+b.dataset.i===0?inp.value:null):+b.dataset.i)}});
OS.alert=(t,m)=>OS.dialog(t,m);
OS.confirm=async(t,m)=>(await OS.dialog(t,m,{buttons:['Yes','No']}))===0;
OS.prompt=(t,m,d='')=>OS.dialog(t,m,{input:d,buttons:['OK','Cancel']});
