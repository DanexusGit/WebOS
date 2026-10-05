'use strict';
/* APPS 4: Unity, Windows-10-style login, right-click menus everywhere, taskbar pinning, extra prefs, more apps. */
const CUBE='<img alt="" style="width:1.1em;height:1.1em;vertical-align:-.15em" src="data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,4 58,18 32,32 6,18" fill="#9fe6ff"/><polygon points="6,18 32,32 32,60 6,46" fill="#2f7fd6"/><polygon points="58,18 32,32 32,60 58,46" fill="#1b4f9c"/><path d="M32 4L58 18V46L32 60L6 46V18Z M6 18L32 32L58 18M32 32V60" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" opacity=".8"/></svg>')+'">';
const DEFAPPS=['explorer','terminal','arcade','geochat','unity','browser','music','video','camera','calc','calendar','clock','weather','convert','ai','paint','notes','notepad','snake','settings','taskmgr','sysinfo','trash'];
Object.assign(PREF_DEF,{fontSize:14,bw:1,sh:.5,btnStyle:'right',fit:'cover',dim:0,labels:true,tbLabels:false,clock24:false,secs:false,idle:0});

/* Extra prefs on top of the base applyPrefs; also seeds default pins and desktop apps. */
const _ap=OS.applyPrefs;OS.applyPrefs=()=>{const P=OS.prefs;P.pins??=['app:explorer','app:browser','app:settings'];P.dapps??=DEFAPPS.slice();_ap();
  const s=document.documentElement.style,D=$('#desktop');s.setProperty('--fs',P.fontSize+'px');s.setProperty('--bw',P.bw+'px');s.setProperty('--sh',P.sh);s.setProperty('--dim',P.dim);s.setProperty('--fit',P.fit);
  D.classList.toggle('btnleft',P.btnStyle==='left');D.classList.toggle('nolabels',!P.labels);D.classList.toggle('tb-labels',!!P.tbLabels);$('#icons').hidden=!!P.hideIcons};

/* Unity = BlockUnity_2D_3D.html, embedded in bundle2.js and loaded on first open. It pulls three.js from a CDN, so it needs internet. */
OS.apps.unity={name:'Unity',icon:CUBE,cat:'Games',open(a){const f=el('iframe','game');
  f.setAttribute('sandbox','allow-scripts allow-forms allow-pointer-lock allow-popups allow-same-origin allow-modals allow-downloads');f.setAttribute('allow','fullscreen; autoplay; gamepad; clipboard-write');
  const win=WMS.create({title:'Unity',icon:CUBE,appId:'unity',args:a,body:f,w:1000,h:620,onFocus:()=>setTimeout(()=>f.focus())}),go=()=>f.srcdoc=BUNDLE2.unity;
  if(typeof BUNDLE2!=='undefined')go();else{const s=el('script');s.src='games/unity.js';s.onload=go;s.onerror=()=>OS.alert('Unity','games/unity.js is missing.');document.head.append(s)}return win}};

/* ---------- Windows 10 style sign-in: lock screen with clock, then avatar + password ---------- */
showLogin=function(){const users=OS.locked?[OS.user]:[...OS.db.get('users',[{name:'Admin',pw:'',av:'🧑‍💻'}]),{name:'Guest',pw:'',av:'👤',guest:1}],L=$('#login');L.hidden=false;L.className='w10';
  L.innerHTML='<div class="lock"><div class="lt"></div><div class="ld"></div></div><div class="signin" hidden><div class="av"></div><h2></h2><div class="pwrow"><input type="password" placeholder="Senha" autocomplete="off"><button></button></div><div class="lerr"></div></div><div class="sys"><span>📶</span><span class="pw" title="Reiniciar">⏻</span></div><div class="ulist"></div>';
  const q=s=>$(s,L),pick=u=>{q('.av').textContent=u.av;q('h2').textContent=u.name;const i=q('input'),b=q('.pwrow button'),er=q('.lerr'),row=q('.pwrow');er.textContent='';i.value='';i.hidden=!u.pw;b.textContent=u.pw?'➜':'Entrar';
    const go=()=>{if(!u.pw||i.value===u.pw)return login(u);er.textContent='A senha está incorreta. Tente novamente.';i.value='';Snd.error();row.classList.remove('shake');void row.offsetWidth;row.classList.add('shake')};
    b.onclick=go;i.onkeydown=e=>{if(e.key==='Enter')go()};setTimeout(()=>(u.pw?i:b).focus(),50);$$('.ulist .u',L).forEach(x=>x.classList.toggle('on',x.dataset.n===u.name))};
  users.forEach(u=>{const x=el('div','u',`<span>${u.av}</span>${esc(u.name)}`);x.dataset.n=u.name;x.onclick=()=>{Snd.click();pick(u)};q('.ulist').append(x)});
  const unlock=()=>{if(L.hidden||q('.lock').classList.contains('up'))return;q('.lock').classList.add('up');q('.signin').hidden=false;pick(users[0])};
  q('.lock').onclick=unlock;addEventListener('keydown',unlock);q('.pw').onclick=()=>location.reload();
  const tick=()=>{if(L.hidden)return clearInterval(iv);const d=new Date();q('.lt').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});q('.ld').textContent=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})},iv=setInterval(tick,1000);tick()};

/* ---------- Pinning: pins are 'app:id' or a VFS path, stored in prefs.pins ---------- */
OS.pin=k=>{const P=OS.prefs,l=P.pins||(P.pins=[]);if(!l.includes(k)){l.push(k);OS.notify('Pinned to taskbar')}OS.applyPrefs();Desktop.tasks()};
OS.unpin=k=>{OS.prefs.pins=(OS.prefs.pins||[]).filter(x=>x!==k);OS.applyPrefs();Desktop.tasks()};
Desktop.tasks=function(){const T=$('#tasks');if(!T)return;T.innerHTML='';const P=OS.prefs||{},used=new Set();
  const mk=(icon,label,ws,click,ctx)=>{const b=el('button','task'+(ws.length?' run':'')+(ws.some(w=>w===WMS.cur&&!w.min)?' on':''),`${icon}<span class="tl">${esc(label)}</span>`);b.onclick=click;b.oncontextmenu=ctx;
    if(ws.length){b.onmouseenter=()=>Desktop.tip(b,ws[ws.length-1]);b.onmouseleave=()=>$('#tip').hidden=true}T.append(b)};
  (P.pins||[]).forEach(k=>{if(k.startsWith('C:')){const n=VFS.get(k);if(!n)return;const nm=k.split('/').pop();mk(fileIcon(nm,n),nm,[],()=>OS.open(k),e=>Ctx.pinned(e,k))}
    else{const id=k.slice(4),a=OS.apps[id];if(!a)return;const ws=WMS.list.filter(w=>w.appId===id);ws.forEach(w=>used.add(w));
      mk((P.ic||{})[k]||a.icon,(P.ren||{})[k]||a.name,ws,()=>{if(!ws.length)OS.launch(id);else{const t=ws.find(w=>w===WMS.cur&&!w.min);t?WMS.minimize(t):WMS.focus(ws[ws.length-1])}},e=>Ctx.tbapp(e,id,ws))}});
  WMS.list.filter(w=>!used.has(w)).forEach(w=>mk(w.icon||'🗔',w.title,[w],()=>WMS.cur!==w||w.min?WMS.focus(w):WMS.minimize(w),e=>Ctx.tbapp(e,w.appId,[w])))};
{const tb=$('#taskbar');tb.ondragover=e=>e.preventDefault();tb.ondrop=e=>{e.preventDefault();const p=e.dataTransfer.getData('text/webos');if(p)OS.pin(p)};tb.oncontextmenu=e=>{if(!e.target.closest('.task'))Ctx.taskbar(e)}}

/* ---------- Context menus ---------- */
const EDIT=/^(txt|md|js|css|json|html?|xml|csv|log|ini)$/,pk=id=>'app:'+id,isPinned=k=>(OS.prefs.pins||[]).includes(k);
const tile=()=>{const L=WMS.list.filter(w=>!w.min),r=$('#windows').getBoundingClientRect(),c=Math.ceil(Math.sqrt(L.length)),rw=Math.ceil(L.length/c);L.forEach((w,i)=>{w.max&&WMS.setMax(w,false);Object.assign(w.el.style,{left:i%c*(r.width/c)+'px',top:Math.floor(i/c)*(r.height/rw)+'px',width:r.width/c+'px',height:r.height/rw+'px'})})};
Ctx.taskbar=e=>{e.preventDefault();const P=OS.prefs,set=(k,v)=>()=>{P[k]=v;OS.applyPrefs();Desktop.icons()};
  Ctx.show(e,[['Task Manager',()=>OS.launch('taskmgr')],['Show desktop',()=>WMS.list.forEach(w=>!w.min&&WMS.minimize(w))],['Cascade windows',()=>WMS.list.forEach((w,i)=>{w.el.style.left=40+i*32+'px';w.el.style.top=30+i*32+'px'})],['Tile windows',tile],
    [P.tbPos==='top'?'Move taskbar to bottom':'Move taskbar to top',set('tbPos',P.tbPos==='top'?'bottom':'top')],[P.dock?'Disable floating dock':'Floating dock',set('dock',!P.dock)],[P.tbAlign==='left'?'Center icons':'Align icons left',set('tbAlign',P.tbAlign==='left'?'center':'left')],
    [P.tbLabels?'Hide window labels':'Show window labels',set('tbLabels',!P.tbLabels)],['Unpin all',()=>{P.pins=[];OS.applyPrefs();Desktop.tasks()}],['Taskbar settings',()=>OS.launch('settings')]])};
Ctx.tbapp=(e,id,ws)=>{e.preventDefault();e.stopPropagation();const k=pk(id),it=[['Open new window',()=>OS.launch(id)],[isPinned(k)?'Unpin from taskbar':'Pin to taskbar',()=>isPinned(k)?OS.unpin(k):OS.pin(k)]];
  if(ws.length){const w=ws[ws.length-1];it.push([w.min?'Restore':'Minimize',()=>w.min?WMS.focus(w):WMS.minimize(w)],[w.max?'Unmaximize':'Maximize',()=>WMS.setMax(w,!w.max)],[ws.length>1?'Close all windows':'Close window',()=>ws.forEach(x=>WMS.close(x))])}Ctx.show(e,it)};
Ctx.pinned=(e,p)=>{e.preventDefault();e.stopPropagation();Ctx.show(e,[['Open',()=>OS.open(p)],['Unpin from taskbar',()=>OS.unpin(p)]])};
Ctx.app=(e,id,done)=>{e.preventDefault();e.stopPropagation();const P=OS.prefs,k=pk(id),a=OS.apps[id],on=(P.dapps||[]).includes(id),refresh=()=>{OS.applyPrefs();Desktop.icons();Desktop.tasks()};
  Ctx.show(e,[['Open',()=>OS.launch(id)],[isPinned(k)?'Unpin from taskbar':'Pin to taskbar',()=>isPinned(k)?OS.unpin(k):OS.pin(k)],on?['Remove from desktop',()=>{P.dapps=P.dapps.filter(x=>x!==id);refresh()}]:['Add to desktop',()=>{P.dapps.push(id);refresh()}],
    ['Rename',async()=>{const v=await OS.prompt('Rename shortcut','Label:',(P.ren||{})[k]||a.name);if(v){(P.ren??={})[k]=v;refresh()}}],['Change icon',async()=>{const v=await OS.prompt('Change icon','Emoji or text:','📦');if(v){(P.ic??={})[k]=v;refresh()}}],
    ['Properties',()=>OS.alert(a.name,'Category: '+(a.cat||'hidden')+'\nId: '+id)]])};
Ctx.win=(e,w,body)=>{e.preventDefault();e.stopPropagation();const k=pk(w.appId),half=s=>()=>{WMS.setMax(w,false);WMS.half(w,s)},
  it=[[w.max?'Restore':'Maximize',()=>WMS.setMax(w,!w.max)],['Minimize',()=>WMS.minimize(w)],['Snap left',half('l')],['Snap right',half('r')],
  ['Center',()=>{const r=$('#windows').getBoundingClientRect();WMS.setMax(w,false);w.el.style.left=(r.width-w.el.offsetWidth)/2+'px';w.el.style.top=(r.height-w.el.offsetHeight)/2+'px'}],
  [w.el.classList.contains('ontop')?'Disable always on top':'Always on top',()=>w.el.classList.toggle('ontop')],[isPinned(k)?'Unpin from taskbar':'Pin to taskbar',()=>isPinned(k)?OS.unpin(k):OS.pin(k)]];
  if(body)it.push(['Reload app',()=>{const id=w.appId,a=w.args;WMS.close(w);setTimeout(()=>OS.launch(id,a),200)}]);it.push(['Close',()=>WMS.close(w)]);Ctx.show(e,it)};
Ctx.file=(e,p,done)=>{e.preventDefault();e.stopPropagation();const n=VFS.get(p),name=p.split('/').pop(),dir=p.slice(0,p.lastIndexOf('/')),x=ext(name),isD=n.t==='d',D=VFS.home()+'/Desktop';
  const it=[['Open',()=>OS.open(p)]];if(!isD&&EDIT.test(x))it.push(['Edit',()=>OS.open(p,'notepad')]);
  if(!isD)it.push(['Open with…',()=>Ctx.show(e,[['Editor','notepad'],['Games runner','game'],['Photos','viewer'],['Music','music'],['Videos','video'],['PDF Reader','pdf']].map(([l,a])=>[l,()=>OS.open(p,a)]))]);
  it.push(['Pin to taskbar',()=>OS.pin(p)],['Send to Desktop',()=>{OS.clip={p,cut:0};OS.paste(D,done)}],['Copy',()=>OS.clip={p,cut:0}],['Cut',()=>OS.clip={p,cut:1}],['Duplicate',()=>{OS.clip={p,cut:0};OS.paste(dir,done)}],
    ['Rename',async()=>{const v=await OS.prompt('Rename','New name:',name),d=VFS.get(dir);if(!v||v===name)return;if(d.c[v])return OS.alert('Name taken','That name already exists here.');d.c[v]=n;delete d.c[name];VFS.save();done()}],
    ['Move to…',async()=>{const v=await OS.prompt('Move to','Destination folder:',dir);if(!v)return;const t=VFS.get(v);if(!t||t.t!=='d')return OS.alert('Not found','That folder does not exist.');OS.clip={p,cut:1};OS.paste(v,done)}],
    ['Delete',async()=>{if(await OS.confirm('Delete',p.startsWith('C:/Trash')?'Delete '+name+' permanently?':'Move '+name+' to Trash?')){if(!p.startsWith('C:/Trash')){VFS.mkdir('C:/Trash',1);VFS.get('C:/Trash').c[name]=n}VFS.rm(p);Snd.beep(300,.1);Desktop.tasks();done()}}],
    ['Properties',()=>OS.alert(name,`Type: ${isD?'Folder':x||'file'}\nSize: ${isD?Object.keys(n.c).length+' items':String(n.d).length+' chars'}\nModified: ${n.m?new Date(n.m).toLocaleString():'-'}\nPath: ${p}`)]);Ctx.show(e,it)};
Ctx.bg=(e,dir,done)=>{e.preventDefault();e.stopPropagation();const P=OS.prefs,sz=v=>()=>{P.icoSize=v;OS.applyPrefs()},mk=(t,def,txt)=>async()=>{const v=await OS.prompt('New '+t,'Name:',def);if(v){txt==null?VFS.mkdir(dir+'/'+v):VFS.write(dir+'/'+v,txt);done()}};
  Ctx.show(e,[['View: Large icons',sz(56)],['View: Medium icons',sz(36)],['View: Small icons',sz(26)],['Auto-arrange icons',()=>{P.pos={};OS.applyPrefs();Desktop.icons()}],[P.hideIcons?'Show desktop icons':'Hide desktop icons',()=>{P.hideIcons=!P.hideIcons;OS.applyPrefs()}],
    ['Refresh',done],['Paste',()=>OS.paste(dir,done)],['New folder',mk('folder','New folder')],['New text file',mk('file','new.txt','')],['New HTML page',mk('page','page.html','<!DOCTYPE html>\n<title>New page</title>\n')],['Open terminal',()=>OS.launch('terminal')],['Display settings',()=>OS.launch('settings')],['Personalize',()=>OS.launch('settings')]])};

/* Auto-lock: reloads to the lock screen after N idle minutes (open windows are restored after sign-in). */
let act=Date.now();['pointermove','keydown','pointerdown'].forEach(v=>addEventListener(v,()=>act=Date.now(),{passive:true}));
setInterval(()=>{const m=OS.prefs&&OS.prefs.idle;if(m&&OS.user&&!OS.locked&&Date.now()-act>m*60000)OS.lock()},10000);

/* ---------- More apps ---------- */
const mkWin=(id,name,icon,body,w,h,extra)=>WMS.create({title:name,icon,appId:id,args:{},body,w,h,...extra});
OS.apps.snake={name:'Snake',icon:'🐍',cat:'Games',open(a){const c=el('canvas');c.width=c.height=320;c.tabIndex=0;c.style.cssText='margin:auto;background:#111;max-width:100%';let s=[[8,8]],d=[1,0],f=[12,5],sc=0;const g=c.getContext('2d');
  const dr=()=>{g.fillStyle='#111';g.fillRect(0,0,320,320);g.fillStyle='#f55';g.fillRect(f[0]*16,f[1]*16,15,15);g.fillStyle='#6f6';s.forEach(p=>g.fillRect(p[0]*16,p[1]*16,15,15));g.fillStyle='#fff';g.fillText('Score '+sc+'  (arrows or WASD)',6,12)};
  const t=setInterval(()=>{const h=[(s[0][0]+d[0]+20)%20,(s[0][1]+d[1]+20)%20];if(s.some(p=>p[0]===h[0]&&p[1]===h[1])){s=[[8,8]];sc=0;d=[1,0]}else{s.unshift(h);if(h[0]===f[0]&&h[1]===f[1]){sc++;f=[Math.random()*20|0,Math.random()*20|0]}else s.pop()}dr()},110);
  c.onkeydown=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(m&&(m[0]+d[0]||m[1]+d[1])){d=m;e.preventDefault()}};
  return mkWin('snake','Snake','🐍',c,360,380,{onClose:()=>clearInterval(t),onFocus:()=>setTimeout(()=>c.focus())})}};
OS.apps.weather={name:'Weather',icon:'⛅',cat:'Productivity',open(a){const b=el('div','pad',' Loading…');
  const show=(la,lo,n)=>fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`).then(r=>r.json()).then(j=>{const c=j.current_weather,D=j.daily;
    b.innerHTML=`<h2 style="margin:0">${esc(n)}</h2><div style="font-size:48px">${Math.round(c.temperature)}°C</div><div>Wind ${c.windspeed} km/h</div>`+D.time.map((t,i)=>`<div>${t}: ${D.temperature_2m_min[i]}° / ${D.temperature_2m_max[i]}°</div>`).join('')}).catch(()=>b.textContent='Could not load the weather (offline?).');
  show(-23.55,-46.63,'São Paulo');navigator.geolocation?.getCurrentPosition(p=>show(p.coords.latitude,p.coords.longitude,'Your location'),()=>{});return mkWin('weather','Weather','⛅',b,340,360)}};
OS.apps.camera={name:'Camera',icon:'📷',cat:'Media',open(a){const b=col(),v=el('video'),bar=el('div','bar2','<button>📸 Take photo</button><span style="opacity:.7"></span>');v.autoplay=v.muted=v.playsInline=true;v.style.cssText='flex:1;min-height:0;width:100%;background:#000';b.append(v,bar);let st;
  navigator.mediaDevices?.getUserMedia({video:true}).then(s=>{st=s;v.srcObject=s}).catch(()=>$('span',bar).textContent='Camera unavailable or blocked.');
  $('button',bar).onclick=()=>{if(!v.videoWidth)return;const c=el('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);const n='photo-'+Date.now()+'.png';VFS.write(VFS.home()+'/Pictures/'+n,c.toDataURL());OS.notify('Saved '+n)};
  return mkWin('camera','Camera','📷',b,520,420,{onClose:()=>st&&st.getTracks().forEach(t=>t.stop())})}};
OS.apps.video={name:'Videos',icon:'🎬',cat:'Media',open(a){const b=col(),v=el('video');v.controls=true;v.style.cssText='flex:1;min-height:0;width:100%;background:#000';b.innerHTML='<div class="bar2"><button>📂 Open video</button><input type="file" accept="video/*" hidden></div>';b.append(v);const fi=$('input',b);
  $('button',b).onclick=()=>fi.click();fi.onchange=()=>{v.src=URL.createObjectURL(fi.files[0]);v.play()};if(a.path)fetch(VFS.get(a.path).d).then(r=>r.blob()).then(bl=>{v.src=URL.createObjectURL(bl)});return mkWin('video','Videos','🎬',b,640,420)}};
OS.apps.pdf={name:'PDF Reader',icon:'📕',cat:'Productivity',open(a){const b=col(),f=el('iframe');f.style.cssText='flex:1;border:0;background:#fff';b.innerHTML='<div class="bar2"><button>📂 Open PDF</button><input type="file" accept="application/pdf" hidden></div>';b.append(f);const fi=$('input',b);
  $('button',b).onclick=()=>fi.click();fi.onchange=()=>f.src=URL.createObjectURL(fi.files[0]);if(a.path)fetch(VFS.get(a.path).d).then(r=>r.blob()).then(bl=>{f.src=URL.createObjectURL(bl)});return mkWin('pdf','PDF Reader','📕',b,700,520)}};
OS.apps.convert={name:'Converter',icon:'📐',cat:'Productivity',open(a){const b=el('div','pad'),U={Length:{m:1,km:1000,cm:.01,mi:1609.344,ft:.3048,in:.0254},Mass:{kg:1,g:.001,lb:.45359237,oz:.0283495},Data:{B:1,KB:1024,MB:1048576,GB:1073741824}};
  b.innerHTML='<select data-c></select><input type="number" value="1" data-v><select data-f></select><select data-t></select><b data-r></b>';const q=s=>$(s,b),c=q('[data-c]'),f=q('[data-f]'),t=q('[data-t]'),v=q('[data-v]'),r=q('[data-r]'),opt=l=>l.map(x=>`<option>${x}</option>`).join('');
  const calc=()=>{const m=U[c.value];r.textContent=(v.value*m[f.value]/m[t.value]).toPrecision(6)},fill=()=>{f.innerHTML=t.innerHTML=opt(Object.keys(U[c.value]));t.selectedIndex=1;calc()};
  c.innerHTML=opt(Object.keys(U));c.onchange=fill;[f,t,v].forEach(x=>x.oninput=calc);fill();return mkWin('convert','Converter','📐',b,340,260)}};
OS.apps.sysinfo={name:'About',icon:'ℹ️',cat:'System',open(a){const b=el('div','pad'),used=Object.keys(localStorage).reduce((s,k)=>s+localStorage[k].length,0);
  b.innerHTML=`<h2 style="margin:0">WebOS</h2><div>User: ${esc(OS.user.name)}</div><div>Browser: ${esc(navigator.userAgent.slice(0,90))}</div><div>CPU threads: ${navigator.hardwareConcurrency||'?'}</div><div>Memory: ${navigator.deviceMemory||'?'} GB</div><div>Screen: ${screen.width}x${screen.height}</div><div>Storage used: ${(used/1024).toFixed(0)} KB of about 5000 KB</div><div>Apps: ${Object.keys(OS.apps).length}</div>`;return mkWin('sysinfo','About','ℹ️',b,420,300)}};
