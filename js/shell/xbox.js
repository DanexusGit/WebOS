'use strict';
/* XBOX: dashboard estilo Xbox 360 (Metro, 2011): abas no topo, tiles verdes, tile grande selecionado com borda branca,
   cracha do jogador, dicas A/B e menu Guide. Ative em Settings > System > Interface = xbox (ou ?mode=xbox).
   Usa exatamente os mesmos apps e papeis de parede do resto do sistema. Teclado, mouse, toque e controle (Gamepad API). */
OS.xbox=(()=>{const q=new URLSearchParams(location.search).get('mode')||OS.db.get('mode','auto');return q==='xbox'})();
PREF_DEF.xbBg='';
if(OS.xbox){
document.documentElement.classList.add('xbox');
const TABS=['home','video','games','music','apps','settings'],hue=s=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0)*47%360;
const XB={tab:'home',sel:null,
  /* avatar de corpo inteiro (estilizado); a cor da camisa vem do nome do jogador */
  figure(){const h=hue(OS.user.name);return `<svg viewBox="0 0 200 440" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d3b3"/><stop offset="1" stop-color="#e6b48c"/></linearGradient><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 58%)"/><stop offset="1" stop-color="hsl(${h} 70% 38%)"/></linearGradient></defs><ellipse cx="100" cy="428" rx="66" ry="9" fill="rgba(0,0,0,.28)"/><rect x="66" y="286" width="32" height="118" rx="14" fill="#34445f"/><rect x="102" y="286" width="32" height="118" rx="14" fill="#2b3a54"/><ellipse cx="80" cy="410" rx="27" ry="13" fill="#ececec"/><ellipse cx="120" cy="410" rx="27" ry="13" fill="#dcdcdc"/><rect x="34" y="158" width="26" height="116" rx="13" fill="url(#sk)"/><rect x="140" y="158" width="26" height="116" rx="13" fill="url(#sk)"/><path d="M54 152q46-14 92 0l8 30v110H46V182z" fill="url(#sh)"/><path d="M62 160q38-10 76 0" stroke="rgba(255,255,255,.35)" stroke-width="4" fill="none"/><rect x="88" y="132" width="24" height="26" rx="8" fill="url(#sk)"/><circle cx="100" cy="92" r="52" fill="url(#sk)"/><path d="M48 84q-4-50 52-52q54 0 52 52q-14-26-52-26q-38 0-52 26z" fill="#4a3220"/><ellipse cx="80" cy="96" rx="9" ry="11" fill="#fff"/><ellipse cx="120" cy="96" rx="9" ry="11" fill="#fff"/><circle cx="82" cy="98" r="5.5" fill="#2a1d12"/><circle cx="118" cy="98" r="5.5" fill="#2a1d12"/><path d="M82 124q18 14 36 0" stroke="#9a4b3a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="68" cy="116" r="7" fill="#f2a58a" opacity=".5"/><circle cx="132" cy="116" r="7" fill="#f2a58a" opacity=".5"/></svg>`},
  A(id,o={}){const a=OS.apps[id];return a?{label:o.label||a.name,icon:(OS.prefs.ic||{})['app:'+id]||a.icon,big:o.big,act:()=>XB.open(id)}:null},
  tiles(){const A=XB.A,lib=typeof Store!=='undefined'?Object.values(Store.getLib()):[];
    return({home:[A('explorer'),A('browser'),A('store',{big:1}),A('geochat'),A('music'),A('video'),A('camera'),A('ai')],
      video:[A('video',{big:1}),A('camera')],
      games:[A('store',{big:1}),A('geochat'),A('unity'),...lib.map(g=>({label:g.name,icon:(g.name.match(/[A-Za-z0-9]/)||['?'])[0].toUpperCase(),hue:hue(g.name),act:()=>Store.launch(g)}))],
      music:[A('music',{big:1})],
      apps:[A('browser',{big:1}),A('explorer'),A('calc'),A('calendar'),A('clock'),A('ai'),A('paint'),A('notepad'),A('terminal'),A('taskmgr'),A('sysinfo'),A('trash')],
      settings:[A('settings',{big:1}),{label:'Background',white:1,act:()=>XB.pickBg()},{label:'Interface',white:1,act:()=>XB.pickUi()},{label:'Sign out',white:1,act:()=>{WMS.save();location.reload()}},A('taskmgr'),A('sysinfo')]})[XB.tab].filter(Boolean)},
  build(){const x=el('div');x.id='xb';XB.root=x;
    x.innerHTML='<div class="xbg"></div><div class="xav"></div><div class="xtabs"><div class="xtr"></div></div><div class="xbadge"></div><div class="xmask"><div class="xstrip"></div></div><div class="xhint"><span><i class="a">A</i>Select</span><span><i class="b">B</i>Back</span><span><i class="y">Home</i>Guide</span></div>';
    $('#desktop').prepend(x);XB.tr=$('.xtr',x);XB.strip=$('.xstrip',x);XB.mask=$('.xmask',x);
    XB.g=el('div','xguide');XB.g.hidden=true;XB.p=el('div','xpick');XB.p.hidden=true;const ring=el('div','xring');ring.title='Guide';ring.onclick=()=>XB.guide();document.body.append(XB.g,XB.p,ring);
    $('.xav',x).innerHTML=XB.figure();TABS.forEach(t=>{const s=el('span',null,t);s.onclick=()=>XB.setTab(t);XB.tr.append(s)});
    XB.badge();addEventListener('online',XB.badge);addEventListener('offline',XB.badge);XB.applyBg();XB.render();WMS.list.forEach(w=>WMS.minimize(w));addEventListener('resize',()=>{XB.tabsPos();XB.sel&&XB.center()})},
  badge(){$('.xbadge',XB.root).innerHTML=`<div><b>${esc(OS.user.name)}</b><small>${navigator.onLine?'Online':'Offline'}</small></div><i class="xdot">${avHTML(OS.user.av)}</i>`},
  render(){const s=XB.strip;s.innerHTML='';XB.root.classList.toggle('xhome',XB.tab==='home');
    XB.tiles().forEach((o,i)=>{const t=el('div','xt'+(o.big?' big':'')+(o.white?' w':''),`<div class="xi">${o.icon||''}</div><span>${esc(o.label)}</span>`);if(o.hue!=null)t.style.background=`linear-gradient(160deg,hsl(${o.hue} 55% 38%),hsl(${(o.hue+40)%360} 55% 20%))`;
      t.style.animationDelay=i*35+'ms';t.onmouseenter=()=>XB.select(t,false);t.onclick=()=>{XB.select(t);o.act()};t._o=o;s.append(t)});
    XB.sel=null;XB.select($('.xt.big',s)||$('.xt',s),true,true);XB.tabsPos()},
  select(t,center=true,quiet){if(!t||t===XB.sel)return;XB.sel&&XB.sel.classList.remove('sel');XB.sel=t;t.classList.add('sel');if(center)XB.center();if(!quiet)Snd.beep(900,.025)},
  center(){const t=XB.sel;XB.strip.style.transform=`translateX(${XB.mask.clientWidth/2-(t.offsetLeft+t.offsetWidth/2)}px)`},
  tabsPos(){const sp=$$('span',XB.tr),on=sp[TABS.indexOf(XB.tab)];sp.forEach(x=>x.classList.toggle('on',x===on));XB.tr.style.transform=`translateX(${innerWidth/2-(on.offsetLeft+on.offsetWidth/2)}px)`},
  setTab(t){if(t===XB.tab)return;XB.tab=t;Snd.beep(660,.04);XB.render()},
  tabStep(d){const i=TABS.indexOf(XB.tab)+d;if(i>=0&&i<TABS.length)XB.setTab(TABS[i])},
  move(dx,dy){const c=XB.sel.getBoundingClientRect(),cx=c.left+c.width/2,cy=c.top+c.height/2;let best=null,bd=1e9;
    $$('.xt',XB.strip).forEach(t=>{if(t===XB.sel)return;const r=t.getBoundingClientRect(),x=r.left+r.width/2-cx,y=r.top+r.height/2-cy,p=dx?x*dx:y*dy,s=dx?Math.abs(y):Math.abs(x);if(p<=4)return;const d=p+s*2;if(d<bd){bd=d;best=t}});
    if(best)XB.select(best);else if(dx)XB.tabStep(dx)},
  open(id){XB.closeOverlays();const w=WMS.list.find(x=>x.appId===id);w?WMS.focus(w):OS.launch(id);Snd.beep(520,.07)},
  closeOverlays(){XB.g.hidden=true;XB.p.hidden=true},
  back(){if(!XB.g.hidden||!XB.p.hidden)return XB.closeOverlays();const w=WMS.top();w&&WMS.close(w)},
  home(){XB.closeOverlays();WMS.list.forEach(w=>!w.min&&WMS.minimize(w))},
  guide(){const g=XB.g;if(!g.hidden){g.hidden=true;return}XB.p.hidden=true;g.hidden=false;
    g.innerHTML=`<div class="gc"><i class="gp">${avHTML(OS.user.av)}</i><div><b>${esc(OS.user.name)}</b><small>${navigator.onLine?'Online':'Offline'}</small></div></div><div class="gi" data-a="dash">Return to Dashboard</div>${WMS.list.length?'<div class="gh">Open apps</div>':''}${WMS.list.map((w,i)=>`<div class="gi" data-w="${i}">${w.icon||''} ${esc(w.title)}</div>`).join('')}<div class="gh">Profile</div><div class="gi" data-a="out">Sign out</div>`;
    g.onclick=e=>{const d=e.target.closest('.gi');if(!d)return;g.hidden=true;if(d.dataset.a==='dash')XB.home();else if(d.dataset.a==='out'){WMS.save();location.reload()}else{const w=WMS.list[+d.dataset.w];w&&WMS.focus(w)}}},
  pick(title,items){const p=XB.p;XB.g.hidden=true;p.hidden=false;p.innerHTML=`<h2>${title}</h2><div class="xp-grid"></div>`;
    items.forEach(it=>{const d=el('div','xp-i',`<span>${esc(it.label)}</span>`);if(it.thumb){d.style.background=it.thumb;d.style.backgroundSize='cover';d.style.backgroundPosition='center'}d.onclick=()=>{it.act();p.hidden=true};$('.xp-grid',p).append(d)})},
  pickBg(){const P=OS.prefs;XB.pick('Background',[{label:'Dashboard (padrão)',act:()=>{P.xbBg='';OS.applyPrefs()}},...Object.keys(WALLS).map(n=>({label:n,thumb:(typeof WALLTHUMB!=='undefined'&&WALLTHUMB[n])||WALLS[n],act:()=>{P.xbBg=n;OS.applyPrefs()}}))])},
  pickUi(){const P=OS.prefs;XB.pick('Interface',[['auto','Automático'],['pc','PC (Windows 7)'],['mobile','Celular (iOS)'],['xbox','Xbox 360']].map(([v,l])=>({label:l,act:()=>{P.mode=v;OS.applyPrefs()}})))},
  applyBg(){if(!XB.root)return;const n=OS.prefs.xbBg,v=n&&WALLS[n],b=$('.xbg',XB.root);b.style.background='';b.classList.toggle('img',!!v);if(v){b.style.background=v;b.style.backgroundSize='cover';b.style.backgroundPosition='center'}},
  btn(k){const dash=!WMS.top()&&XB.g.hidden&&XB.p.hidden;
    if(k==='b')return XB.back();if(k==='gd')return XB.guide();if(!dash)return;
    if(k==='a'&&XB.sel)XB.sel._o.act();else if(k==='l')XB.tabStep(-1);else if(k==='r')XB.tabStep(1);
    else if(k==='u')XB.move(0,-1);else if(k==='d')XB.move(0,1);else if(k==='lf')XB.move(-1,0);else if(k==='rt')XB.move(1,0)}};
window.XB=XB;
const _di=Desktop.init;Desktop.init=function(){_di.call(Desktop);XB.build()};
const _xa=OS.applyPrefs;OS.applyPrefs=()=>{_xa();XB.applyBg()};
/* teclado */
addEventListener('keydown',e=>{if(!XB.root||e.ctrlKey||e.altKey||e.metaKey)return;const k=e.key;
  if(k==='Escape'||(k==='Backspace'&&!isField(e.target))){e.preventDefault();XB.btn('b');return}
  if(isField(e.target))return;
  const m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'lf',ArrowRight:'rt',Enter:'a',' ':'a',Home:'gd',F1:'gd',q:'l',PageUp:'l','[':'l',e:'r',PageDown:'r',']':'r'}[k];
  if(m&&!OS.gameFocus){e.preventDefault();XB.btn(m)}});
addEventListener('wheel',e=>{if(!XB.root||WMS.top()||!XB.g.hidden||!XB.p.hidden)return;XB.btn(e.deltaY>0||e.deltaX>0?'rt':'lf')},{passive:true});
/* controle (Gamepad API): A, B, LB, RB, direcionais/analogico, Guide */
{let pad={},lastDir=0,polling=0;const tick=()=>{const g=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;
  if(g&&XB.root){const b=i=>g.buttons[i]&&g.buttons[i].pressed,now=performance.now(),ax=g.axes[0]||0,ay=g.axes[1]||0;
    const st={a:b(0),b:b(1),l:b(4),r:b(5),u:b(12)||ay<-.6,d:b(13)||ay>.6,lf:b(14)||ax<-.6,rt:b(15)||ax>.6,gd:b(16)||b(8)||b(9)};
    for(const k in st){const dir=/^(u|d|lf|rt)$/.test(k),rep=dir&&now-lastDir>240;if(st[k]&&(!pad[k]||rep)){if(dir)lastDir=now;XB.btn(k)}pad[k]=st[k]}}
  requestAnimationFrame(tick)};addEventListener('gamepadconnected',()=>{if(!polling){polling=1;tick()}})}
/* login: escolha de perfil no estilo Xbox */
showLogin=function(){const L=$('#login'),users=[...OS.db.get('users',[{name:'Admin',pw:'',av:'user'}]),{name:'Guest',pw:'',av:'guest',guest:1}];L.hidden=false;L.className='xbl';
  L.innerHTML='<div class="xl-t">Select a profile</div><div class="xl-row"></div><div class="xl-pw" hidden><input type="password" placeholder="Password" autocomplete="off"><div class="lerr"></div></div><div class="xhint xl-h"><span><i class="a">A</i>Select</span></div>';
  const row=$('.xl-row',L),pw=$('.xl-pw',L),inp=$('input',L);let cur=null;
  users.forEach(u=>{const b=el('button','xt xl-u',`<div class="xi">${avHTML(u.av)}</div><span>${esc(u.name)}</span>`);
    b.onclick=()=>{Snd.click();if(!u.pw)return login(u);cur=u;pw.hidden=false;$('.lerr',L).textContent='';inp.value='';inp.focus()};row.append(b)});
  inp.onkeydown=e=>{if(e.key==='Enter'){if(inp.value===cur.pw)login(cur);else{$('.lerr',L).textContent='Incorrect password. Try again.';inp.value='';Snd.error()}}};
  L.onkeydown=e=>{if(isField(e.target))return;const bs=$$('.xl-u',L),i=bs.indexOf(document.activeElement);if(e.key==='ArrowRight')bs[Math.min(bs.length-1,i+1)].focus();if(e.key==='ArrowLeft')bs[Math.max(0,i-1)].focus()};
  $('.xl-u',L).focus()};
}
