'use strict';
/* APPS 3: preferences schema, lazy-loaded Games, proxy-based Browser with tabs, tabbed Settings, Notes, Photos zoom, paste. */
const FONTS={system:'"Segoe UI","Segoe UI Variable Text",Tahoma,"Noto Sans","DejaVu Sans",Arial,sans-serif',serif:'Georgia,serif',mono:'ui-monospace,Menlo,monospace',rounded:'ui-rounded,"Segoe UI",sans-serif'};
const CUR={default:'auto',crosshair:'crosshair',pointer:'pointer',big:`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M3 2l22 12-10 2-4 10z" fill="white" stroke="black" stroke-width="2"/></svg>')}") 3 2, auto`};
Object.assign(WALLS,{Midnight:'linear-gradient(160deg,#050816,#1a1f4d)',Sunset:'linear-gradient(135deg,#ff7e5f,#b04a8f 55%,#2c1a5e)',Mint:'linear-gradient(135deg,#0f3d3e,#2bb39a)',Graphite:'linear-gradient(135deg,#1c1c1f,#3a3a42)',Rose:'linear-gradient(135deg,#3b0f2e,#e0577a)'});
const PREF_DEF={theme:'dark',accent:null,wall:WALLS.Aurora,font:'system',radius:12,opacity:.62,blur:14,tbPos:'bottom',tbSize:48,dock:false,tbAlign:'center',icoSize:36,cursor:'default',anim:true,perf:false,sound:true,wallAnim:false,widget:true};

/* Games = the uploaded file. bundle.js (660 KB) is only fetched the first time you open it, which keeps startup fast. */
OS.apps.geochat={name:'Games',icon:'🎮',cat:'Games',open(a){const f=el('iframe','game');
  f.setAttribute('sandbox','allow-scripts allow-forms allow-pointer-lock allow-popups allow-same-origin allow-modals');f.setAttribute('allow','fullscreen; autoplay; gamepad; clipboard-write');
  const win=WMS.create({title:'Games',icon:'🎮',appId:'geochat',args:a,body:f,w:960,h:600,onFocus:()=>setTimeout(()=>f.focus())}),go=()=>f.srcdoc=BUNDLE.geochat;
  if(typeof BUNDLE!=='undefined')go();else{const s=el('script');s.src='games/geochat.js';s.onload=go;s.onerror=()=>OS.alert('Games','games/geochat.js is missing.');document.head.append(s)}return win}};

/* BROWSER: tabs, history, bookmarks (right-click to remove), search engines.
   Proxy mode fetches the page HTML through public CORS proxies and renders it in srcdoc, which sidesteps X-Frame-Options.
   Limits: logins and heavy JS apps may load incompletely. Direct mode is a plain iframe and many big sites refuse it. */
const BRH=new Set();addEventListener('message',e=>BRH.forEach(h=>h(e)));
const PROXIES=[u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u),u=>'https://corsproxy.io/?url='+encodeURIComponent(u)];
const NAV='<script>addEventListener("click",function(e){var a=e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||h[0]==="#"||h.indexOf("javascript:")===0)return;e.preventDefault();try{parent.postMessage({webosNav:new URL(h,document.baseURI).href},"*")}catch(x){}});addEventListener("submit",function(e){var f=e.target;e.preventDefault();try{var u=new URL(f.getAttribute("action")||document.baseURI,document.baseURI);if((f.method||"get").toLowerCase()==="get")new FormData(f).forEach(function(v,k){u.searchParams.set(k,v)});parent.postMessage({webosNav:u.href},"*")}catch(x){}});<\/script>';
OS.apps.browser={name:'Browser',icon:'🌐',cat:'Productivity',open(a){
  const S=Object.assign({bm:[['DuckDuckGo','https://html.duckduckgo.com/html/'],['Bing','https://www.bing.com'],['Hacker News','https://news.ycombinator.com'],['MDN','https://developer.mozilla.org'],['Wikipedia','https://en.wikipedia.org']],eng:'ddg',mode:'proxy'},OS.db.get('browser',{}));
  const b=col(),ENG={ddg:'https://html.duckduckgo.com/html/?q=',bing:'https://www.bing.com/search?q=',brave:'https://search.brave.com/search?q='};let tabs=[],cur=null;
  b.innerHTML='<div class="tabs"></div><div class="bar2"><button data-b>◀</button><button data-f>▶</button><button data-r>⟳</button><button data-h>🏠</button><input class="url" style="flex:1;min-width:0" placeholder="Search or enter address"><button data-s>☆</button><select data-m><option value="proxy">🛡️ Proxy</option><option value="direct">🌐 Direct</option></select><select data-e><option value="ddg">DuckDuckGo</option><option value="bing">Bing</option><option value="brave">Brave</option></select><button data-x title="Open in a real tab">↗</button></div><div class="bar2 bms"></div><div class="prog"></div><div style="flex:1;position:relative;min-height:0" class="views"></div>';
  const q=s=>$(s,b),U=q('.url'),V=q('.views'),save=()=>OS.db.set('browser',S),home=()=>S.bm[0]?S.bm[0][1]:'https://html.duckduckgo.com/html/';
  q('[data-m]').value=S.mode;q('[data-e]').value=S.eng;
  const norm=v=>{v=v.trim();return /^https?:\/\//i.test(v)?v:(/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(v)&&!v.includes(' '))?'https://'+v:ENG[S.eng]+encodeURIComponent(v)};
  const prog=on=>{const p=q('.prog');p.style.width=on?'70%':'100%';if(!on)setTimeout(()=>p.style.width='0',250)};
  const draw=()=>{const T=q('.tabs');T.innerHTML='';tabs.forEach(t=>{const x=el('div','tab'+(t===cur?' on':''),`<span>${esc((t.title||'New tab').slice(0,22))}</span><i>✕</i>`);x.onclick=e=>e.target.tagName==='I'?close(t):sw(t);T.append(x)});
    const n=el('button',null,'＋');n.onclick=()=>add();T.append(n);q('[data-s]').textContent=cur&&S.bm.some(m=>m[1]===cur.url)?'★':'☆';
    const B=q('.bms');B.innerHTML='';S.bm.forEach(([nm,u],i)=>{const x=el('button',null,esc(nm));x.title='Right-click to remove';x.onclick=()=>load(cur,u);x.oncontextmenu=e=>{e.preventDefault();S.bm.splice(i,1);save();draw()};B.append(x)})};
  const sw=t=>{cur=t;tabs.forEach(x=>x.f.style.display=x===t?'block':'none');U.value=t.url||'';draw()};
  const close=t=>{t.f.remove();tabs=tabs.filter(x=>x!==t);if(!tabs.length)add();else if(cur===t)sw(tabs[tabs.length-1]);else draw()};
  const add=url=>{const f=el('iframe');f.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff';const t={f,url:'',title:'',hist:[],hi:-1};tabs.push(t);V.append(f);sw(t);load(t,url||home())};
  async function load(t,url,push=true){if(!t)return;if(push){t.hist.splice(t.hi+1);t.hist.push(url);t.hi=t.hist.length-1}t.url=url;if(t===cur)U.value=url;win.args.url=url;prog(1);const f=t.f;
    if(S.mode==='direct'){f.setAttribute('sandbox','allow-scripts allow-forms allow-popups allow-same-origin');f.removeAttribute('srcdoc');f.src=url;f.onload=()=>prog(0);t.title=new URL(url).hostname;return draw()}
    f.setAttribute('sandbox','allow-scripts allow-forms allow-popups');let html=null;
    for(const p of PROXIES){try{const c=new AbortController(),to=setTimeout(()=>c.abort(),9000),r=await fetch(p(url),{signal:c.signal});clearTimeout(to);if(!r.ok)throw 0;html=await r.text();if(html)break}catch{}}
    if(t.url!==url)return;f.removeAttribute('src');
    if(!html){f.srcdoc='<body style="font:15px system-ui;padding:40px;color:#444"><h2>Could not load this page</h2><p>The proxies could not fetch '+esc(url)+'. Try Direct mode, or open it in a real tab with the ↗ button.</p></body>';t.title='Error';prog(0);return draw()}
    html=html.replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,'');const base='<base href="'+esc(url)+'">';
    html=/<head[^>]*>/i.test(html)?html.replace(/<head[^>]*>/i,m=>m+base):base+html;html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,NAV+'</body>'):html+NAV;
    f.srcdoc=html;t.title=((html.match(/<title[^>]*>([^<]*)/i)||[])[1]||'').trim()||new URL(url).hostname;prog(0);draw()}
  const win=WMS.create({title:'Browser',icon:'🌐',appId:'browser',args:a,body:b,w:900,h:580,onClose:()=>BRH.delete(h)}),h=e=>{const u=e.data&&e.data.webosNav,t=tabs.find(t=>t.f.contentWindow===e.source);if(u&&t)load(t,u)};BRH.add(h);
  U.onkeydown=e=>{if(e.key==='Enter')load(cur,norm(U.value))};q('[data-b]').onclick=()=>cur.hi>0&&load(cur,cur.hist[--cur.hi],false);q('[data-f]').onclick=()=>cur.hi<cur.hist.length-1&&load(cur,cur.hist[++cur.hi],false);
  q('[data-r]').onclick=()=>load(cur,cur.url,false);q('[data-h]').onclick=()=>load(cur,home());q('[data-x]').onclick=()=>window.open(cur.url,'_blank','noopener');
  q('[data-s]').onclick=()=>{const i=S.bm.findIndex(m=>m[1]===cur.url);i>=0?S.bm.splice(i,1):S.bm.push([cur.title||cur.url,cur.url]);save();draw()};
  q('[data-m]').onchange=e=>{S.mode=e.target.value;save();load(cur,cur.url,false)};q('[data-e]').onchange=e=>{S.eng=e.target.value;save()};
  add(a.url);return win}};

/* SETTINGS: tabbed, schema-driven. Every control writes into OS.prefs and calls OS.applyPrefs() (CSS variables + classes). */
OS.apps.settings={name:'Settings',icon:'⚙️',cat:'System',open(a){const P=OS.prefs,b=el('div'),side=el('div','side'),main=el('div','pad');b.style.cssText='flex:1;display:flex;min-height:0';b.append(side,main);main.style.flex='1';
  const CT={Appearance:[['Theme','theme','sel',['aero','dark','light','cyberpunk','ocean','forest','neumorphic']],['Accent colour','accent','color'],['Font','font','sel',Object.keys(FONTS)],['Corner radius','radius','range',[0,28,1]],['Window opacity','opacity','range',[.2,1,.02]],['Glass blur','blur','range',[0,30,1]],['Cursor','cursor','sel',Object.keys(CUR)],['Text size','fontSize','range',[12,18,1]],['Window border','bw','range',[0,4,1]],['Shadow strength','sh','range',[0,.9,.05]],['Title bar buttons','btnStyle','sel',['right','left']]],
    Desktop:[['Wallpaper','wall','walls'],['Animated wallpaper','wallAnim','chk'],['Wallpaper fit','fit','sel',['cover','contain','auto']],['Wallpaper dimming','dim','range',[0,.8,.05]],['Icon labels','labels','chk'],['Icon size','icoSize','range',[24,64,2]],['Clock widget','widget','chk']],
    Taskbar:[['Position','tbPos','sel',['bottom','top']],['Alignment','tbAlign','sel',['center','left']],['Height','tbSize','range',[36,72,2]],['Floating dock','dock','chk'],['Window labels','tbLabels','chk'],['24-hour clock','clock24','chk'],['Show seconds','secs','chk']],
    System:[['Animations','anim','chk'],['Performance mode (no blur or animations)','perf','chk'],['Sounds','sound','chk'],['Auto-lock after (min, 0 = off)','idle','range',[0,30,1]],['Interface (reloads)','mode','sel',['auto','pc','mobile','xbox']]]};
  const set=(k,v)=>{P[k]=v;OS.applyPrefs();if(/^(tbPos|dock|tbSize)$/.test(k))Desktop.icons()};
  const ctl=([l,k,t,o])=>{const w=el('label',null,esc(l)+' ');let i;
    if(t==='sel'){i=el('select',null,o.map(v=>`<option ${P[k]===v?'selected':''}>${v}</option>`).join(''));i.onchange=()=>set(k,i.value)}
    else if(t==='range'){i=el('input');i.type='range';[i.min,i.max,i.step]=o;i.value=P[k];i.oninput=()=>set(k,+i.value)}
    else if(t==='chk'){i=el('input');i.type='checkbox';i.checked=!!P[k];i.onchange=()=>set(k,i.checked)}
    else if(t==='color'){i=el('input');i.type='color';i.value=P[k]||'#6aa8ff';i.oninput=()=>set(k,i.value)}
    else{i=el('div','wallgrid');Object.keys(WALLS).forEach(n=>{const x=el('button',null,n);x.style.background=(typeof WALLTHUMB!=='undefined'&&WALLTHUMB[n])||WALLS[n];x.style.color='#fff';x.title=n;x.onclick=()=>set('wall',WALLS[n]);i.append(x)});
      const c=el('input');c.type='color';c.title='Solid colour';c.oninput=()=>set('wall',c.value);const u=el('button',null,'Upload image'),fi=el('input');fi.type='file';fi.accept='image/*';fi.hidden=true;u.onclick=()=>fi.click();
      fi.onchange=()=>{const r=new FileReader();r.onload=()=>set('wall',r.result);r.readAsDataURL(fi.files[0])};i.append(c,u,fi);w.style.display='grid'}
    w.append(i);return w};
  const show=n=>{main.innerHTML='';
    if(n==='Users'){const U=OS.db.get('users',[{name:'Admin',pw:'',av:'🧑‍💻'}]);U.forEach((u,i)=>{const r=el('div',null,`<span class="avs">${avHTML(u.av)}</span> ${esc(u.name)} `);$('.avs',r).title='Trocar imagem';$('.avs',r).onclick=()=>{u.av=AVATARS[(AVATARS.indexOf(avKey(u.av))+1)%AVATARS.length];OS.db.set('users',U);show('Users')};if(i){const d=el('button',null,'Remove');d.onclick=()=>{U.splice(i,1);OS.db.set('users',U);show('Users')};r.append(d)}main.append(r)});
      const nm=el('input'),pw=el('input'),ad=el('button',null,'Add user');nm.placeholder='Name';pw.placeholder='Password (optional)';pw.type='password';
      ad.onclick=()=>{const v=nm.value.trim();if(!v||U.some(x=>x.name===v))return OS.alert('Cannot add','Enter a unique name.');U.push({name:v,pw:pw.value,av:AVATARS[2+U.length%4]});OS.db.set('users',U);show('Users')};main.append(nm,pw,ad)}
    else{CT[n].forEach(c=>main.append(ctl(c)));if(n==='System'){const r=el('button',null,'Reset all settings');r.onclick=async()=>{if(await OS.confirm('Reset','Reset every setting to default?')){Object.assign(P,PREF_DEF,{pos:{}});OS.applyPrefs();Desktop.icons();show('System')}};main.append(r)}}};
  [...Object.keys(CT),'Users'].forEach(n=>{const x=el('button',null,n);x.onclick=()=>show(n);side.append(x)});show('Appearance');
  return WMS.create({title:'Settings',icon:'⚙️',appId:'settings',args:a,body:b,w:640,h:440})}};

OS.apps.notes={name:'Notes',icon:'🗒️',cat:'Productivity',open(a){const t=el('textarea'),k='notes:'+OS.user.name;t.style.cssText='flex:1;border:0;border-radius:0;resize:none;padding:12px;background:#fff7a8;color:#3a3200';t.value=OS.db.get(k,'');t.oninput=()=>OS.db.set(k,t.value);
  return WMS.create({title:'Notes',icon:'🗒️',appId:'notes',args:a,body:t,w:300,h:300})}};
OS.apps.viewer={name:'Photos',icon:'🖼️',cat:null,open(a){const n=VFS.get(a.path),i=el('img'),w=el('div');let z=1;i.src=n.d;i.style.cssText='max-width:100%;max-height:100%;margin:auto';w.style.cssText='flex:1;display:flex;overflow:auto';w.append(i);
  w.onwheel=e=>{e.preventDefault();z=Math.min(8,Math.max(.2,z*(e.deltaY<0?1.1:.9)));i.style.transform=`scale(${z})`};i.ondblclick=()=>{z=1;i.style.transform=''};
  return WMS.create({title:a.path.split('/').pop(),icon:'🖼️',appId:'viewer',args:a,body:w})}};
OS.paste=(dir,done)=>{const c=OS.clip;if(!c||!VFS.get(c.p))return OS.notify('Nothing to paste');if(dir===c.p||dir.startsWith(c.p+'/'))return OS.notify('Cannot move a folder into itself');let n=c.p.split('/').pop();const D=VFS.get(dir);while(D.c[n])n='Copy of '+n;D.c[n]=structuredClone(VFS.get(c.p));if(c.cut){VFS.rm(c.p);OS.clip=null}VFS.save();done()};
