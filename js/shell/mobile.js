'use strict';
/* MOBILE: iOS-style interface for phones/tablets (home screen, dock, status bar, lock screen, Control Center, Spotlight, app switcher).
   Also adds OS.lock() so the desktop (PC) lock screen can be opened any time without rebooting.
   Detection: touch device or mobile user agent. Override with ?mode=mobile or ?mode=pc, or Settings > System > Interface. */
OS.mobile=(()=>{const q=new URLSearchParams(location.search).get('mode')||OS.db.get('mode','auto');if(q==='mobile')return true;if(q==='pc'||q==='xbox')return false;
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&matchMedia('(pointer:coarse)').matches)})();
PREF_DEF.mode='auto';
if(OS.mobile){document.documentElement.classList.add('mobile');document.body.insertAdjacentHTML('beforeend','<div id="bright"></div><div id="banner"></div>');
  /* No right-click on touch screens, so a long press fires a contextmenu event. All the existing menus then work. */
  let lp,sx,sy;addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;sx=e.clientX;sy=e.clientY;lp=setTimeout(()=>e.target.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:sx,clientY:sy})),550)},true);
  addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>10)clearTimeout(lp)},true);['pointerup','pointercancel'].forEach(t=>addEventListener(t,()=>clearTimeout(lp),true))}

const _ap2=OS.applyPrefs;OS.applyPrefs=()=>{_ap2();const m=OS.prefs.mode;if(OS._m===undefined)OS._m=m;else if(m!==OS._m){OS.db.set('mode',m);WMS.save();setTimeout(()=>location.reload(),300)}};
/* Notifications are logged (shown on the lock screen) and shown as banners on mobile. */
const _n=OS.notify;OS.notify=m=>{const l=OS.db.get('notifs',[]);l.unshift({m,t:Date.now()});OS.db.set('notifs',l.slice(0,20));OS.mobile?Mobile.banner(m):_n(m)};
OS.lock=()=>{OS.locked=true;document.activeElement&&document.activeElement.blur();showLogin()};
const _sl=showLogin;showLogin=function(){if(OS.mobile)return Mobile.lock();_sl();const w=OS.prefs&&OS.prefs.wall;if(w)$('#login').style.setProperty('--lw',w.startsWith('data:')?`url(${w})`:w)};
const _login=login;login=function(u){const L=$('#login');if(OS.locked&&OS.user&&u.name===OS.user.name){OS.locked=false;L.hidden=true;Snd.start();return}
  _login(u);OS.locked=false;Desktop.ready=true;if(OS.mobile)Mobile.init();if(OS.afterLogin){OS.launch(OS.afterLogin);OS.afterLogin=null}};
addEventListener('keydown',e=>{if(e.altKey&&e.key==='l'&&OS.user&&!OS.locked){e.preventDefault();OS.lock()}});

const Mobile={
  goHome(){WMS.list.forEach(w=>!w.min&&WMS.minimize(w));['#cc','#spot','#sw'].forEach(s=>$(s).hidden=true)},
  init(){const D=$('#desktop');
    D.insertAdjacentHTML('afterbegin','<div id="home"><div class="pages"></div><div class="dots"></div><div class="srch">🔍 Buscar</div><div class="dock"></div></div>');
    D.insertAdjacentHTML('beforeend','<div id="sbar"><b class="st"></b><span class="sr"><i class="net"></i> <i class="bt"></i></span></div><div id="hbar"><i></i></div><div id="cc" hidden></div><div id="spot" hidden></div><div id="sw" hidden></div>');
    const _i=Desktop.icons,_t=Desktop.tasks;Desktop.icons=function(){_i.call(Desktop);Mobile.home()};Desktop.tasks=function(){_t.call(Desktop);Mobile.dock()};
    Mobile.home();Mobile.status();Mobile.gestures()},
  icon(id,dock){const a=OS.apps[id],k='app:'+id,P=OS.prefs,b=el('button','app'),h=Math.abs([...a.name].reduce((s,c)=>s*31+c.charCodeAt(0)|0,5))%360;
    b.innerHTML=`<i style="background:linear-gradient(160deg,hsl(${h} 80% 62%),hsl(${(h+40)%360} 75% 42%))">${(P.ic||{})[k]||(typeof MOBILE_ICON!=='undefined'&&MOBILE_ICON[id])||a.icon}</i>${dock?'':`<span>${esc((P.ren||{})[k]||a.name)}</span>`}`;
    b.onclick=()=>OS.launch(id);b.oncontextmenu=e=>Ctx.app(e,id,()=>{});return b},
  widgets(){const d=new Date(),w=el('div','wd',`<div class="w1"><small>Clima</small><b>--°</b><small>São Paulo</small></div><div class="w2"><small style="text-transform:capitalize">${d.toLocaleDateString('pt-BR',{weekday:'long'})}</small><b>${d.getDate()}</b><small style="text-transform:capitalize">${d.toLocaleDateString('pt-BR',{month:'long'})}</small></div>`);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current_weather=true').then(r=>r.json()).then(j=>$('.w1 b',w).textContent=Math.round(j.current_weather.temperature)+'°').catch(()=>{});
    $('.w1',w).onclick=()=>OS.launch('weather');$('.w2',w).onclick=()=>OS.launch('calendar');return w},
  home(){const ids=(OS.prefs.dapps||[]).filter(i=>OS.apps[i]),pg=$('#home .pages');if(!pg)return;pg.innerHTML='';const n=Math.max(1,Math.ceil(ids.length/16));
    for(let p=0;p<n;p++){const g=el('div','pg');if(!p)g.append(Mobile.widgets());ids.slice(p*16,p*16+16).forEach(i=>g.append(Mobile.icon(i)));pg.append(g)}
    const dots=$('#home .dots');dots.innerHTML='<i class="on"></i>'+'<i></i>'.repeat(n-1);pg.onscroll=()=>{const i=Math.round(pg.scrollLeft/pg.clientWidth);$$('i',dots).forEach((d,k)=>d.classList.toggle('on',k===i))};
    $('.srch').onclick=Mobile.spot;Mobile.dock()},
  dock(){const d=$('#home .dock');if(!d)return;d.innerHTML='';const ids=(OS.prefs.pins||[]).filter(k=>k.startsWith('app:')).map(k=>k.slice(4)).filter(i=>OS.apps[i]);
    ['explorer','browser','music','settings'].forEach(i=>!ids.includes(i)&&OS.apps[i]&&ids.push(i));ids.slice(0,4).forEach(i=>d.append(Mobile.icon(i,1)))},
  status(){const t=()=>$('.st').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});t();setInterval(t,15000);$('.net').textContent='📶';
    navigator.getBattery?.().then(b=>{const u=()=>$('.bt').textContent='🔋'+Math.round(b.level*100)+'%';u();b.onlevelchange=u});$('.sr').onclick=Mobile.cc},
  /* Gestures: home bar tap = home, swipe up = home, double tap = app switcher. Swipe down from the top right = Control Center. Swipe down on the home screen = Spotlight. */
  gestures(){const hb=$('#hbar');let y0,last=0,sy=null,sx;hb.onpointerdown=e=>{y0=e.clientY;hb.setPointerCapture(e.pointerId)};
    hb.onpointerup=e=>{if(e.clientY-y0<-40)return Mobile.goHome();const n=Date.now();n-last<350?Mobile.sw():Mobile.goHome();last=n};
    addEventListener('pointerdown',e=>{sy=e.clientY;sx=e.clientX},true);
    addEventListener('pointerup',e=>{if(sy==null)return;const dy=e.clientY-sy;if(dy>70&&Math.abs(e.clientX-sx)<60){if(sy<40&&sx>innerWidth/2)Mobile.cc();else if(sy>60&&sy<innerHeight*.7&&!WMS.list.some(w=>!w.min)&&$('#cc').hidden&&$('#spot').hidden)Mobile.spot()}sy=null},true)},
  cc(){const C=$('#cc'),P=OS.prefs;C.hidden=false;C.innerHTML='';
    const tile=(ic,fn,on)=>{const b=el('button','t'+(on?' on':''),ic);b.onclick=()=>{fn();if(!C.hidden)Mobile.cc()};C.append(b)};
    tile('✈️',()=>OS.notify('Modo avião é apenas visual'),0);tile('📶',()=>{},navigator.onLine);tile(P.sound?'🔔':'🔕',()=>{P.sound=!P.sound;OS.applyPrefs()},P.sound);tile('🌙',()=>{P.theme=P.theme==='light'?'dark':'light';OS.applyPrefs()},P.theme!=='light');
    const sl=(ic,v,fn)=>{const w=el('div','sl',`<span>${ic}</span>`),i=el('input');i.type='range';i.min=0;i.max=1;i.step=.02;i.value=v;i.oninput=()=>fn(+i.value);w.append(i);C.append(w)};
    sl('☀️',1-(+$('#bright').style.opacity||0)/.7,v=>$('#bright').style.opacity=(1-v)*.7);sl('🔊',OS.vol,v=>{OS.vol=v;$('#vol').value=v});
    [['🔦'],['⏱️','clock'],['🧮','calc'],['📷','camera'],['⚡','perf'],['🔒','lock'],['⚙️','settings'],['🌐','browser']].forEach(([ic,id])=>tile(ic,id==='perf'?()=>{P.perf=!P.perf;OS.applyPrefs()}:id==='lock'?()=>{C.hidden=true;OS.lock()}:id?()=>{C.hidden=true;OS.launch(id)}:()=>OS.notify('Lanterna ligada'),id==='perf'&&P.perf));
    C.onclick=e=>{if(e.target===C)C.hidden=true}},
  spot(){const S=$('#spot');S.hidden=false;S.innerHTML='<input placeholder="Buscar" style="font-size:17px;padding:12px 16px;border-radius:14px"><div class="res"></div>';const i=$('input',S),R=$('.res',S);
    const draw=q=>{q=q.toLowerCase();R.innerHTML='';const g=el('div','sg');Object.keys(OS.apps).filter(k=>OS.apps[k].cat&&OS.apps[k].name.toLowerCase().includes(q)).slice(0,q?20:8).forEach(id=>{const b=Mobile.icon(id);b.onclick=()=>{S.hidden=true;OS.launch(id)};g.append(b)});R.append(el('h4',null,q?'Apps':'Sugestões da Siri'),g);
      if(q){const f=[];(function w(p){VFS.ls(p).forEach(([n,v])=>{const fp=p+'/'+n;if(n.toLowerCase().includes(q)&&f.length<12)f.push(fp);if(v.t==='d')w(fp)})})('C:');if(f.length){R.append(el('h4',null,'Arquivos'));f.forEach(p=>{const d=el('div','fr',esc(p));d.onclick=()=>{S.hidden=true;OS.open(p)};R.append(d)})}}};
    i.oninput=()=>draw(i.value);draw('');i.focus();S.onclick=e=>{if(e.target===S)S.hidden=true}},
  sw(){const S=$('#sw');S.hidden=false;S.innerHTML=WMS.list.length?'':'<p style="margin:auto">Nenhum app aberto</p>';
    WMS.list.forEach(w=>{const c=el('div','sc',`<b>${w.icon||''} ${esc(w.title)}</b><button>✕</button>`);c.onclick=e=>{if(e.target.tagName==='BUTTON'){WMS.close(w);Mobile.sw()}else{S.hidden=true;WMS.focus(w)}};S.append(c)});S.onclick=e=>{if(e.target===S)S.hidden=true}},
  banner(m){const b=el('div','nb',`<b>WebOS</b><div>${esc(m)}</div>`);$('#banner').append(b);Snd.beep(800,.08);setTimeout(()=>b.remove(),3200)},
  /* iOS lock screen: big clock, notifications, flashlight/camera buttons, swipe up to unlock (password asked if the user has one). */
  lock(){const users=OS.locked?[OS.user]:[...OS.db.get('users',[{name:'Admin',pw:'',av:'🧑‍💻'}]),{name:'Guest',pw:'',av:'👤',guest:1}],L=$('#login');L.hidden=false;L.className='ios';
    const wl=OS.prefs&&OS.prefs.wall;L.style.setProperty('--lw',wl?(wl.startsWith('data:')?`url(${wl})`:wl):'');
    L.innerHTML='<div class="ls"><div class="ld"></div><div class="lt"></div><div class="nc"><h3>Central de Notificações</h3><div class="nl"></div></div><div class="lb"><button class="fl">🔦</button><button class="cm">📷</button></div><div class="hint">Deslize para cima para abrir</div></div><div class="pass" hidden><div class="chips"></div><div class="av"></div><h2></h2><input type="password" placeholder="Senha"><button class="go">Entrar</button><div class="lerr"></div></div>';
    const q=s=>$(s,L),ls=q('.ls'),N=OS.db.get('notifs',[]),nl=q('.nl');
    (N.length?N.slice(0,4):[{m:'Bem-vindo ao WebOS. Deslize para cima para desbloquear.',t:Date.now()}]).forEach(n=>nl.append(el('div',null,`<b>WebOS</b> <small style="opacity:.7;float:right">${new Date(n.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small><div>${esc(n.m)}</div>`)));
    const tick=()=>{if(L.hidden)return clearInterval(iv);const d=new Date();q('.ld').textContent=d.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});q('.lt').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})},iv=setInterval(tick,1000);tick();
    const pick=u=>{q('.av').innerHTML=avHTML(u.av);q('h2').textContent=u.name;const i=q('input'),er=q('.lerr');i.hidden=!u.pw;i.value='';er.textContent='';
      const go=()=>{if(!u.pw||i.value===u.pw)return login(u);er.textContent='Senha incorreta. Tente novamente.';i.value='';Snd.error()};q('.go').onclick=go;i.onkeydown=e=>{if(e.key==='Enter')go()};if(u.pw)i.focus();$$('.chips button',L).forEach(b=>b.classList.toggle('on',b.textContent.includes(u.name)))};
    const unlock=()=>{ls.style.transform='translateY(-100%)';if(users.length===1&&!users[0].pw)return login(users[0]);q('.pass').hidden=false;q('.chips').innerHTML='';users.forEach(u=>{const b=el('button',null,`${avHTML(u.av)} ${esc(u.name)}`);b.onclick=()=>pick(u);q('.chips').append(b)});pick(users[0])};
    let y0=null;ls.onpointerdown=e=>{y0=e.clientY};ls.onpointermove=e=>{if(y0!=null&&e.clientY<y0)ls.style.transform=`translateY(${e.clientY-y0}px)`};
    ls.onpointerup=e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;if(dy<-110)unlock();else ls.style.transform=''};
    q('.hint').onclick=unlock;addEventListener('keydown',function k(e){if(L.hidden||L.className!=='ios')return removeEventListener('keydown',k);if(e.target.tagName!=='INPUT'&&q('.pass').hidden)unlock()});
    q('.fl').onclick=e=>{e.stopPropagation();e.target.classList.toggle('on');Snd.click()};q('.cm').onclick=e=>{e.stopPropagation();OS.afterLogin='camera';unlock()}}};
