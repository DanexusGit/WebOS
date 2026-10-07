'use strict';
/* APPS: each app is OS.apps[id] = {name, icon, cat, open(args)}; open() builds a body element and returns WMS.create(...).
   cat:null hides an app from the Start menu (helper apps opened through file associations). */

/* File associations: extension -> app id. Used by double-click, Open With, and the terminal-free launcher. */
const ASSOC={txt:'notepad',md:'notepad',js:'notepad',css:'notepad',json:'notepad',html:'game',mp4:'video',webm:'video',pdf:'pdf',mp3:'music',wav:'music',ogg:'music',htm:'game',png:'viewer',jpg:'viewer',jpeg:'viewer',gif:'viewer',webp:'viewer'};
OS.open=(p,withApp)=>{const n=VFS.get(p);if(!n)return;if(n.t==='d')return OS.launch('explorer',{path:p});
  const a=withApp||ASSOC[ext(p)];a?OS.launch(a,{path:p}):OS.alert('No app','No app is installed for .'+ext(p)+' files yet.')};

/* Import real files (drag-and-drop or file picker) through the File API into the right VFS folder. */
OS.importFiles=(files,done)=>{let n=files.length;if(!n)return;
  files.forEach(f=>{const x=ext(f.name),txt=/^(txt|md|js|css|json|html?)$/.test(x),r=new FileReader(),
    dest=VFS.home()+'/'+(/^html?$/.test(x)?'Games':/^(png|jpe?g|gif|webp)$/.test(x)?'Pictures':/^(mp3|wav|ogg)$/.test(x)?'Music':'Desktop');
    r.onload=()=>{VFS.write(dest+'/'+f.name,r.result);OS.notify('Imported '+f.name);--n||(done&&done())};txt?r.readAsText(f):r.readAsDataURL(f)})};

const col=()=>{const b=el('div');b.style.cssText='display:flex;flex-direction:column;flex:1;min-height:0';return b};

OS.apps.explorer={name:'Files',icon:'📁',cat:'System',open(args){
  let path=args.path||VFS.home(),hist=[path],hi=0;const body=col();
  body.innerHTML='<div class="bar2"><button data-b>◀</button><button data-f>▶</button><button data-u>▲</button><span class="crumb"></span><button data-nf title="New folder">＋📁</button><button data-nt title="New file">＋📄</button><button data-im title="Import files">⬆</button><input class="q" placeholder="Filter" style="width:90px"><input type="file" multiple hidden></div><div class="exp"><div class="side"></div><div class="list"></div></div>';
  const side=$('.side',body),list=$('.list',body),crumb=$('.crumb',body);
  ['Desktop','Documents','Pictures','Music','Games'].forEach(n=>{const b=el('button',null,n);b.onclick=()=>go(VFS.home()+'/'+n);side.append(b)});
  const win=WMS.create({title:'Files',icon:'📁',appId:'explorer',args,body});
  function go(p,push=true){if(!VFS.get(p))return;if(push){hist=hist.slice(0,hi+1);hist.push(p);hi=hist.length-1}path=p;win.args.path=p;render()}
  function render(){crumb.innerHTML='';let acc='';VFS.parts(path).forEach((s,i)=>{acc+=(i?'/':'')+s;const p=acc,b=el('button',null,esc(s));b.onclick=()=>go(p);crumb.append(b)});
    list.innerHTML='';VFS.ls(path).filter(([k])=>k.toLowerCase().includes($('.q',body).value.toLowerCase())).forEach(([name,n])=>{const full=path+'/'+name,it=el('div','item',`<b>${fileIcon(name,n)}</b>${esc(name)}`);
      it.ondblclick=()=>OS.open(full);it.draggable=true;it.ondragstart=e=>e.dataTransfer.setData('text/webos',full);if(n.t==='d'){it.ondragover=e=>e.preventDefault();it.ondrop=e=>{e.preventDefault();e.stopPropagation();const s=e.dataTransfer.getData('text/webos');if(s&&s!==full){OS.clip={p:s,cut:1};OS.paste(full,render)}}}it.oncontextmenu=e=>Ctx.file(e,full,render);list.append(it)});
    list.oncontextmenu=e=>{if(e.target===list)Ctx.bg(e,path,render)}}
  $('[data-b]',body).onclick=()=>{if(hi>0)go(hist[--hi],false)};$('[data-f]',body).onclick=()=>{if(hi<hist.length-1)go(hist[++hi],false)};
  $('[data-u]',body).onclick=()=>{const a=VFS.parts(path);if(a.length>1)go(a.slice(0,-1).join('/'))};
  $('.q',body).oninput=render;const fi=$('input[type=file]',body);$('[data-im]',body).onclick=()=>fi.click();fi.onchange=()=>OS.importFiles([...fi.files],render);
  $('[data-nf]',body).onclick=async()=>{const v=await OS.prompt('New folder','Name:','New folder');if(v){VFS.mkdir(path+'/'+v);render()}};$('[data-nt]',body).onclick=async()=>{const v=await OS.prompt('New file','Name:','new.txt');if(v){VFS.write(path+'/'+v,'');render()}};render();return win}};

OS.apps.notepad={name:'Editor',icon:'📝',cat:'Productivity',open(args){
  let path=args.path||null;const n=path&&VFS.get(path),body=col();
  body.innerHTML='<div class="bar2"><button data-s>💾 Save</button><span data-n style="opacity:.7"></span></div><div class="ed"><pre></pre><textarea spellcheck="false"></textarea></div>';
  const ta=$('textarea',body),pre=$('pre',body),nm=$('[data-n]',body);ta.value=n&&n.t==='f'?n.d:'';nm.textContent=path||'Untitled';
  const nums=()=>{pre.textContent=Array.from({length:ta.value.split('\n').length},(_,i)=>i+1).join('\n');pre.scrollTop=ta.scrollTop};
  ta.oninput=nums;ta.onscroll=()=>pre.scrollTop=ta.scrollTop;nums();
  $('[data-s]',body).onclick=async()=>{if(!path){const v=await OS.prompt('Save as','File name:','note.txt');if(!v)return;path=VFS.home()+'/Documents/'+v;nm.textContent=path;win.args.path=path}VFS.write(path,ta.value);Snd.click()};
  const win=WMS.create({title:'Editor',icon:'📝',appId:'notepad',args,body});return win}};

OS.apps.terminal={name:'Terminal',icon:'⌨️',cat:'System',open(args){
  let cwd=VFS.home();const body=el('div','term');body.innerHTML='<div class="out">WebOS shell. Type help.\n</div><div>$ <input spellcheck="false"></div>';
  const out=$('.out',body),inp=$('input',body),P=s=>{out.textContent+=s+'\n';body.scrollTop=body.scrollHeight};
  const abs=p=>{if(!p)return cwd;const a=p.startsWith('C:')?[]:VFS.parts(cwd);VFS.parts(p).forEach(s=>s==='..'?a.pop():s!=='.'&&a.push(s));return a.join('/')};
  const C={help:()=>P('help date whoami pwd ls [dir] cd <dir> mkdir <d> rm <path> cat <file> echo touch cp mv open run apps theme neofetch clear reboot'),
    date:()=>P(new Date().toString()),whoami:()=>P(OS.user.name),pwd:()=>P(cwd),echo:a=>P(a.join(' ')),
    ls:a=>{const p=abs(a[0]);VFS.get(p)?P(VFS.ls(p).map(([k,v])=>v.t==='d'?k+'/':k).join('  ')||'(empty)'):P('ls: no such directory')},
    cd:a=>{const p=abs(a[0]||VFS.home()),n=VFS.get(p);n&&n.t==='d'?cwd=p:P('cd: not a directory')},
    mkdir:a=>a[0]?VFS.mkdir(abs(a[0])):P('mkdir: missing name'),rm:a=>VFS.get(abs(a[0]))?VFS.rm(abs(a[0])):P('rm: not found'),
    cat:a=>{const n=VFS.get(abs(a[0]));n&&n.t==='f'?P(String(n.d).slice(0,4000)):P('cat: not a file')},
    touch:a=>a[0]&&VFS.write(abs(a[0]),''),cp:a=>{const s=VFS.get(abs(a[0]));if(!s||!a[1])return P('usage: cp src dst');const d=abs(a[1]),i=d.lastIndexOf('/');VFS.mkdir(d.slice(0,i),1);VFS.get(d.slice(0,i)).c[d.slice(i+1)]=structuredClone(s);VFS.save()},mv:a=>{C.cp(a);C.rm(a)},open:a=>OS.open(abs(a[0])),run:a=>OS.apps[a[0]]?OS.launch(a[0]):P('no such app'),apps:()=>P(Object.keys(OS.apps).join(' ')),theme:a=>{OS.prefs.theme=a[0]||'dark';OS.applyPrefs()},neofetch:()=>P(`${OS.user.name}@webos | ${navigator.hardwareConcurrency||4} cores | ${WMS.list.length} windows | theme ${OS.prefs.theme}`),clear:()=>out.textContent='',reboot:()=>location.reload()};
  inp.onkeydown=e=>{if(e.key!=='Enter')return;const l=inp.value.trim();inp.value='';P('$ '+l);const[c,...a]=l.split(/\s+/);if(c)(C[c]||(()=>P(c+': command not found')))(a)};
  body.onclick=()=>inp.focus();const win=WMS.create({title:'Terminal',icon:'⌨️',appId:'terminal',args,body});setTimeout(()=>inp.focus());return win}};

/* ARCADE: lists .html files in the user's Games folder with generated cover art. */
OS.apps.arcade={name:'Library',icon:'🕹️',cat:'Games',open(args){
  const body=col();body.innerHTML='<div class="bar2"><b>Game Library</b><span style="flex:1"></span><button data-i>＋ Install game (.html)</button><input type="file" accept=".html,.htm" multiple hidden></div><div class="cards"></div>';
  const cards=$('.cards',body),fi=$('input',body);
  const render=()=>{cards.innerHTML='';const dir=VFS.home()+'/Games',g=VFS.ls(dir).filter(([k,v])=>v.t==='f'&&/\.html?$/i.test(k));
    if(!g.length)cards.innerHTML='<p style="opacity:.7">No games yet. Install a .html file or drop one on the desktop.</p>';
    g.forEach(([k])=>{const h=Math.abs([...k].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%360,
      c=el('div','card',`<div class="cover" style="background:linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h+60)%360} 70% 30%))">${esc(k[0].toUpperCase())}</div><p>${esc(k.replace(/\.html?$/i,''))}</p><div><button>▶ Play</button><button title="Play with browser storage enabled (less isolated)">🔓</button></div>`),bs=$$('button',c);
      bs[0].onclick=()=>OS.launch('game',{path:dir+'/'+k});bs[1].onclick=()=>OS.launch('game',{path:dir+'/'+k,trusted:1});cards.append(c)})};
  $('[data-i]',body).onclick=()=>fi.click();fi.onchange=()=>OS.importFiles([...fi.files],render);
  const win=WMS.create({title:'Library',icon:'🕹️',appId:'arcade',args,body,w:600,h:440});render();return win}};

/* GAME RUNNER: runs a stored .html in a sandboxed iframe (srcdoc). Without allow-same-origin the game cannot touch OS storage.
   A tiny shim injected into <head> exposes webOS.saveData(id,data), which postMessages up to the OS (see listener below). */
OS.apps.game={name:'Game',icon:'🕹️',cat:null,open(args){
  const n=VFS.get(args.path);if(!n||n.t!=='f'){OS.alert('Error','Game file not found.');return}
  const id=args.path.split('/').pop().replace(/\.\w+$/,''),
    shim=`<script>window.webOS={saveData:function(i,d){parent.postMessage({webOS:'save',id:i||${JSON.stringify(id)},d:d},'*')}};<\/script>`;
  const f=el('iframe','game');f.setAttribute('sandbox','allow-scripts allow-forms allow-pointer-lock allow-popups'+(args.trusted?' allow-same-origin':''));
  f.setAttribute('allow','fullscreen; autoplay; gamepad');f.srcdoc=/<head[^>]*>/i.test(n.d)?n.d.replace(/<head[^>]*>/i,m=>m+shim):shim+n.d; // inject after <head> so the doctype stays first
  return WMS.create({title:id,icon:'🕹️',appId:'game',args,body:f,w:820,h:540,onFocus:()=>setTimeout(()=>f.focus())})}};
addEventListener('message',e=>{const m=e.data;if(!m||m.webOS!=='save'||!$$('iframe.game').some(f=>f.contentWindow===e.source))return; // only accept messages from our own game frames
  VFS.write(VFS.home()+'/Documents/saves/'+String(m.id).replace(/[^\w-]/g,'_')+'.json',JSON.stringify(m.d))});

OS.apps.viewer={name:'Photos',icon:'🖼️',cat:null,open(a){const n=VFS.get(a.path),i=el('img');i.src=n.d;i.style.cssText='max-width:100%;max-height:100%;margin:auto';
  return WMS.create({title:a.path.split('/').pop(),icon:'🖼️',appId:'viewer',args:a,body:i})}};

const WALLS={Aurora:'linear-gradient(135deg,#1b2b6b,#5b2a86 60%,#d04a8a)',Ocean:'linear-gradient(160deg,#032b43,#136f63 70%,#3dccc7)',Ember:'linear-gradient(135deg,#2b0a0a,#a8321a 60%,#ffb347)'};
OS.apps.settings={name:'Settings',icon:'⚙️',cat:'System',open(a){const b=el('div','pad'),P=OS.prefs;
  b.innerHTML=`<label>Theme <select data-t>${['dark','light','cyberpunk'].map(t=>`<option ${P.theme===t?'selected':''}>${t}</option>`).join('')}</select></label>
  <label>Accent <input type="color" data-a value="${P.accent||'#6aa8ff'}"></label>
  <div>Wallpaper ${Object.keys(WALLS).map(k=>`<button data-w="${k}">${k}</button>`).join(' ')} <button data-u>Upload image</button><input type="file" accept="image/*" hidden></div>
  <div>New user <input data-un placeholder="Name"> <input data-up type="password" placeholder="Password (optional)"> <button data-add>Add user</button></div>`;
  $('[data-t]',b).onchange=e=>{P.theme=e.target.value;OS.applyPrefs()};$('[data-a]',b).oninput=e=>{P.accent=e.target.value;OS.applyPrefs()};
  b.onclick=e=>{const w=e.target.dataset.w;if(w){P.wall=WALLS[w];OS.applyPrefs()}};
  const fi=$('input[type=file]',b);$('[data-u]',b).onclick=()=>fi.click();fi.onchange=()=>{const r=new FileReader();r.onload=()=>{P.wall=r.result;OS.applyPrefs()};r.readAsDataURL(fi.files[0])};
  $('[data-add]',b).onclick=()=>{const n=$('[data-un]',b).value.trim();if(!n)return;const u=OS.db.get('users',[{name:'Admin',pw:'',av:'🧑‍💻'}]);
    if(u.some(x=>x.name===n))return OS.alert('Name taken','A user with that name already exists.');u.push({name:n,pw:$('[data-up]',b).value,av:'🙂'});OS.db.set('users',u);OS.alert('User added','Reload the page to see the new profile on the login screen.')};
  return WMS.create({title:'Settings',icon:'⚙️',appId:'settings',args:a,body:b,w:520,h:360})}};

OS.apps.taskmgr={name:'Task Manager',icon:'📊',cat:'System',open(a){const b=el('div','pad');
  /* "CPU/RAM" are simulated from the DOM size of each window, as the brief allows. */
  const t=()=>{b.innerHTML=`<table><tr><th>Process<th>CPU<th>RAM<th></tr>${WMS.list.map(w=>{const k=w.el.getElementsByTagName('*').length;return `<tr><td>${w.icon||''} ${esc(w.title)}</td><td>${(k/40+Math.random()*2).toFixed(1)}%</td><td>${(8+k*.02).toFixed(1)} MB</td><td><button data-k="${w.id}">End</button></td></tr>`}).join('')}</table><p>${WMS.list.length} processes, ${document.getElementsByTagName('*').length} DOM nodes</p>`};
  b.onclick=e=>{const w=WMS.list.find(x=>x.id===e.target.dataset.k);w&&WMS.close(w)};t();const iv=setInterval(t,1000);
  return WMS.create({title:'Task Manager',icon:'📊',appId:'taskmgr',args:a,body:b,w:480,h:340,onClose:()=>clearInterval(iv)})}};
