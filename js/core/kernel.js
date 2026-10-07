'use strict';
/* KERNEL: helpers, storage, virtual file system (VFS), sounds, boot, login.
   Storage is a thin localStorage wrapper (db.get/set). To move to IndexedDB later, only OS.db needs replacing. */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* Avatares: imagens (assets/avatars). Valores antigos em emoji sao convertidos. */
const AVATARS=['user','guest','fish','flower','leaf','bubble'],AV_LEGACY={'🧑‍💻':'user','👤':'guest'};
const avKey=a=>AVATARS.includes(a)?a:(AV_LEGACY[a]||AVATARS[2+[...String(a||'')].reduce((s,c)=>s+c.codePointAt(0),0)%4]);
const avHTML=a=>`<img class="avimg" alt="" src="assets/avatars/${avKey(a)}.svg">`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ext=p=>p.includes('.')?p.split('.').pop().toLowerCase():'';
const fileIcon=(n,v)=>v.t==='d'?'📁':({html:'🎮',htm:'🎮',txt:'📄',md:'📄',js:'📜',css:'🎨',json:'🧾',png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',webp:'🖼️',mp3:'🎵',wav:'🎵'}[ext(n)]||'📄');

const OS={user:null,vol:.5,apps:{},prefs:null,gameFocus:false,
  db:{get(k,d){try{const v=localStorage.getItem('webos.'+k);return v==null?d:JSON.parse(v)}catch{return d}},
      set(k,v){try{localStorage.setItem('webos.'+k,JSON.stringify(v))}catch(e){OS.alert('Storage full','Could not save. Browsers cap localStorage at about 5 MB. Delete some files.')}}}};

/* VFS: one JSON tree. Folder = {t:'d',c:{name:node}}, file = {t:'f',d:data,m:modified}. Paths look like C:/Users/Admin/Documents/a.txt */
const VFS={root:null,
  init(){this.root=OS.db.get('vfs');if(this.root)return;this.root={t:'d',c:{}};
    ['C:/Users/Admin/Desktop','C:/Users/Admin/Documents','C:/Users/Admin/Pictures','C:/Users/Admin/Music','C:/Users/Admin/Games','C:/System32'].forEach(p=>this.mkdir(p,1));
    this.write('C:/Users/Admin/Documents/readme.txt','Welcome to WebOS.\nDrop files on the desktop to import them.\nHTML games go to the Games folder and show up in Arcade.',1);this.save()},
  save(){clearTimeout(this._t);this._t=setTimeout(()=>OS.db.set('vfs',this.root),300)},
  parts:p=>p.split('/').filter(Boolean),
  get(p){let n=this.root;for(const s of this.parts(p)){if(!n||n.t!=='d')return null;n=n.c[s]}return n||null},
  mkdir(p,q){let n=this.root;for(const s of this.parts(p))n=n.c[s]??={t:'d',c:{}};if(!q)this.save()},
  write(p,d,q){const a=this.parts(p),f=a.pop();this.mkdir(a.join('/'),1);this.get(a.join('/')).c[f]={t:'f',d,m:Date.now()};if(!q)this.save()},
  rm(p){const a=this.parts(p),f=a.pop(),d=this.get(a.join('/'));if(d)delete d.c[f];this.save()},
  ls(p){const n=this.get(p);return n&&n.t==='d'?Object.entries(n.c).sort((a,b)=>(a[1].t===b[1].t?0:a[1].t<b[1].t?-1:1)||a[0].localeCompare(b[0])):[]},
  home:()=>'C:/Users/'+OS.user.name,
  ensureHome(){['Desktop','Documents','Pictures','Music','Games'].forEach(d=>this.mkdir(this.home()+'/'+d,1));this.save()}};

/* System sounds, synthesised with Web Audio (no audio files needed). */
const Snd={ctx:null,
  beep(f=600,d=.08,t='sine'){if(OS.mute)return;try{this.ctx??=new AudioContext();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=t;o.frequency.value=f;g.gain.value=OS.vol*.15;o.connect(g).connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(1e-4,this.ctx.currentTime+d);o.stop(this.ctx.currentTime+d)}catch{}},
  click(){this.beep(900,.04)},error(){this.beep(180,.25,'square')},start(){[392,523,659].forEach((f,i)=>setTimeout(()=>this.beep(f,.25),i*140))}};

OS.applyPrefs=()=>{const p=OS.prefs,r=document.documentElement,s=r.style,D=$('#desktop');
  r.dataset.theme=p.theme;p.accent?s.setProperty('--accent',p.accent):s.removeProperty('--accent');
  s.setProperty('--font',FONTS[p.font]||FONTS.system);s.setProperty('--r',p.radius+'px');s.setProperty('--ga',p.opacity);s.setProperty('--blur',(p.perf?0:p.blur)+'px');
  s.setProperty('--bar',p.tbSize+'px');s.setProperty('--icosz',p.icoSize+'px');s.cursor=CUR[p.cursor]||'auto';
  D.classList.toggle('tb-top',p.tbPos==='top');D.classList.toggle('tb-left',p.tbAlign==='left');D.classList.toggle('dock',!!p.dock);
  D.classList.toggle('noanim',!p.anim||p.perf);D.classList.toggle('perf',!!p.perf);D.classList.toggle('wall-anim',!!p.wallAnim&&!p.perf);
  $('#widget').hidden=!p.widget;D.style.setProperty('--wall',p.wall.startsWith('data:')?`url(${p.wall})`:p.wall);OS.mute=!p.sound;
  clearTimeout(OS._pt);OS._pt=setTimeout(()=>OS.db.set('prefs:'+OS.user.name,p),300)}; // debounced so sliders stay smooth

/* Boot: fake BIOS log -> splash with animated logo -> login */
async function boot(){VFS.init();const b=$('#boot');b.innerHTML='<pre></pre>';
  for(const l of ['WebBIOS v2030.1','CPU: '+(navigator.hardwareConcurrency||4)+' cores ... OK','Memory test: 16384 MB ... OK','Mounting C:/ ... OK','Loading kernel modules ... OK']){$('pre',b).textContent+=l+'\n';await sleep(220)}
  b.innerHTML='<div class="logo"></div><h1>WebOS</h1><div class="bar"><i></i></div>';await sleep(1500);b.hidden=true;showLogin()}

/* Login: profiles live in localStorage. Passwords are stored in plain text, so treat this as a demo lock screen, not security. */
function showLogin(){const users=OS.db.get('users',[{name:'Admin',pw:'',av:'🧑‍💻'}]),L=$('#login');L.hidden=false;
  L.innerHTML='<h2>Welcome</h2><div class="users"></div><div class="pwbox"></div><div class="lerr"></div>';
  [...users,{name:'Guest',pw:'',av:'👤',guest:1}].forEach(u=>{const b=el('button','user',`<span>${u.av}</span>${esc(u.name)}`);
    b.onclick=()=>{Snd.click();if(!u.pw)return login(u);const i=el('input');i.type='password';i.placeholder='Password for '+u.name;
      i.onkeydown=e=>{if(e.key!=='Enter')return;if(i.value===u.pw)login(u);else{$('.lerr',L).textContent='Wrong password';Snd.error()}};
      $('.pwbox',L).replaceChildren(i);i.focus()};$('.users',L).append(b)})}
function login(u){OS.user=u;VFS.ensureHome();$('#login').hidden=true;$('#desktop').hidden=false;Snd.start();Desktop.init()}
addEventListener('pagehide',()=>{if(VFS.root){clearTimeout(VFS._t);OS.db.set('vfs',VFS.root)}if(OS.user&&OS.prefs)OS.db.set('prefs:'+OS.user.name,OS.prefs)});
