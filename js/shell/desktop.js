'use strict';
/* DESKTOP SHELL: context menus, icons (grid + drag + lasso), taskbar, start menu, tray, shortcuts. */
const Ctx={
  show(e,items){e.preventDefault&&e.preventDefault();const m=$('#ctx');m.innerHTML='';
    items.forEach(([l,f])=>{const d=el('div',null,esc(l));d.onclick=()=>{m.hidden=true;f()};m.append(d)});
    m.hidden=false;m.style.left=Math.min(e.clientX,innerWidth-190)+'px';m.style.top=Math.min(e.clientY,innerHeight-items.length*34-60)+'px'},
  file(e,p,done){e.preventDefault();e.stopPropagation();const n=VFS.get(p),name=p.split('/').pop(),dir=p.slice(0,p.lastIndexOf('/'));
    Ctx.show(e,[['Open',()=>OS.open(p)],['Open with Editor',()=>OS.open(p,'notepad')],['Open with Arcade',()=>OS.open(p,'game')],
      ['Copy',()=>OS.clip={p,cut:0}],['Cut',()=>OS.clip={p,cut:1}],['Rename',async()=>{const v=await OS.prompt('Rename','New name:',name);if(v&&v!==name){const d=VFS.get(dir);d.c[v]=n;delete d.c[name];VFS.save();done()}}],
      ['Delete',async()=>{if(await OS.confirm('Delete file','Delete '+name+'?')){if(!p.startsWith('C:/Trash')){VFS.mkdir('C:/Trash',1);VFS.get('C:/Trash').c[name]=n}VFS.rm(p);Snd.beep(300,.1);done()}}],
      ['Properties',()=>OS.alert(name,`Type: ${n.t==='d'?'Folder':ext(name)||'file'}\nSize: ${n.t==='d'?Object.keys(n.c).length+' items':String(n.d).length+' chars'}\nPath: ${p}`)]])},
  bg(e,dir,done){e.preventDefault();e.stopPropagation();
    Ctx.show(e,[['Sort by name',()=>{OS.prefs.pos={};OS.applyPrefs();Desktop.icons()}],['Refresh',done],['Paste',()=>OS.paste(dir,done)],
      ['New Folder',async()=>{const v=await OS.prompt('New folder','Name:','New folder');if(v){VFS.mkdir(dir+'/'+v);done()}}],
      ['New Text File',async()=>{const v=await OS.prompt('New file','Name:','new.txt');if(v){VFS.write(dir+'/'+v,'');done()}}],
      ['Personalize',()=>OS.launch('settings')]])}};
addEventListener('pointerdown',e=>{if(!e.target.closest('#ctx'))$('#ctx').hidden=true},true);
addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea'))e.preventDefault()});

const Desktop={
  init(){OS.prefs=Object.assign({},PREF_DEF,OS.db.get('prefs:'+OS.user.name,{}));OS.prefs.pos??={};OS.applyPrefs();
    Desktop.icons();Desktop.lasso();Desktop.start();Desktop.tray();WMS.restore();Desktop.tasks()},
  /* Icons snap to a 92x100 grid. Positions are remembered per user in prefs.pos. */
  icons(){const box=$('#icons'),P=OS.prefs,H=VFS.home()+'/Desktop';box.innerHTML='';
    const items=[...(P.dapps||(P.dapps=DEFAPPS.slice())).filter(i=>OS.apps[i]).map(id=>({k:'app:'+id,label:OS.apps[id].name,icon:OS.apps[id].icon,open:()=>OS.launch(id)})),
      ...VFS.ls(H).map(([n,v])=>({k:'f:'+n,label:n,icon:fileIcon(n,v),open:()=>OS.open(H+'/'+n),path:H+'/'+n}))];
    items.splice(0,items.length,...items.map(i=>({...i,label:(P.ren||{})[i.k]||i.label,icon:(P.ic||{})[i.k]||i.icon})));const rows=Math.max(1,Math.floor((innerHeight-56)/100));
    items.forEach((it,i)=>{const d=el('div','ico',`<b>${it.icon}</b><span>${esc(it.label)}</span>`),pos=P.pos[it.k]||[Math.floor(i/rows)*92+8,i%rows*100+8];
      d.style.left=pos[0]+'px';d.style.top=pos[1]+'px';d.ondblclick=it.open;d.oncontextmenu=it.path?e=>Ctx.file(e,it.path,Desktop.icons):e=>Ctx.app(e,it.k.slice(4),Desktop.icons);
      d.onpointerdown=e=>{if(e.button)return;e.stopPropagation();if(!e.ctrlKey&&!d.classList.contains('sel'))$$('.ico.sel').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');
        const sx=e.clientX,sy=e.clientY,ox=d.offsetLeft,oy=d.offsetTop;let moved=false;d.setPointerCapture(e.pointerId);
        d.onpointermove=m=>{moved=true;d.style.left=ox+m.clientX-sx+'px';d.style.top=oy+m.clientY-sy+'px'};
        d.onpointerup=ev=>{d.onpointermove=d.onpointerup=null;if(!moved)return;if(document.elementFromPoint(ev.clientX,ev.clientY)?.closest('#taskbar')){OS.pin(it.path||it.k);d.style.left=ox+'px';d.style.top=oy+'px';return}const x=Math.round((d.offsetLeft-8)/92)*92+8,y=Math.round((d.offsetTop-8)/100)*100+8;
          d.style.left=x+'px';d.style.top=y+'px';P.pos[it.k]=[x,y];OS.applyPrefs()}};box.append(d)})},
  /* Lasso: drag on empty desktop; icons whose boxes intersect the rectangle get .sel */
  lasso(){const D=$('#desktop'),L=$('#lasso'),bgHit=e=>e.target===D||e.target.id==='icons';
    D.onpointerdown=e=>{if(!bgHit(e)||e.button)return;$$('.ico.sel').forEach(x=>x.classList.remove('sel'));const sx=e.clientX,sy=e.clientY;L.style.display='block';
      const mv=m=>{const x=Math.min(sx,m.clientX),y=Math.min(sy,m.clientY),w=Math.abs(m.clientX-sx),h=Math.abs(m.clientY-sy);Object.assign(L.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
        $$('.ico').forEach(i=>{const r=i.getBoundingClientRect();i.classList.toggle('sel',r.left<x+w&&r.right>x&&r.top<y+h&&r.bottom>y)})};
      const up=()=>{L.style.display='none';removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};addEventListener('pointermove',mv);addEventListener('pointerup',up)};
    D.oncontextmenu=e=>{if(bgHit(e))Ctx.bg(e,VFS.home()+'/Desktop',Desktop.icons)};
    D.ondragover=e=>e.preventDefault();D.ondrop=e=>{e.preventDefault();const s=e.dataTransfer.getData('text/webos');if(s){OS.clip={p:s,cut:1};OS.paste(VFS.home()+'/Desktop',Desktop.icons)}else OS.importFiles([...e.dataTransfer.files],Desktop.icons)}},
  tasks(){const T=$('#tasks');if(!T)return;T.innerHTML='';
    WMS.list.forEach(w=>{const b=el('button','task'+(WMS.cur===w&&!w.min?' on':''),w.icon||'🗔');
      b.onclick=()=>WMS.cur!==w||w.min?WMS.focus(w):WMS.minimize(w);b.onmouseenter=()=>Desktop.tip(b,w);b.onmouseleave=()=>$('#tip').hidden=true;T.append(b)})},
  tip(b,w){const t=$('#tip'),c=w.el.cloneNode(true);c.classList.remove('min','focus');$$('iframe,canvas,audio,video',c).forEach(x=>x.remove());t.replaceChildren(c);t.hidden=false;const r=b.getBoundingClientRect();t.style.left=Math.min(r.left,innerWidth-200)+'px';t.style.top=r.top-146+'px'},
  start(){const S=$('#start');S.innerHTML='<input placeholder="Search apps and files"><div class="res"></div>';const R=$('.res',S),inp=$('input',S);
    const render=q=>{q=(q||'').toLowerCase();R.innerHTML='';const cats={};
      Object.entries(OS.apps).filter(([k,a])=>a.cat&&a.name.toLowerCase().includes(q)).forEach(e=>(cats[e[1].cat]??=[]).push(e));
      for(const c of ['Productivity','Media','Games','System']){if(!cats[c])continue;const g=el('div','apps');
        cats[c].forEach(([k,a])=>{const b=el('button',null,`<b>${a.icon}</b>${esc(a.name)}`);b.onclick=()=>{S.hidden=true;OS.launch(k)};b.oncontextmenu=e=>Ctx.app(e,k,()=>{});g.append(b)});R.append(el('h4',null,c),g)}
      if(q){const f=[];(function walk(p){VFS.ls(p).forEach(([n,v])=>{const fp=p+'/'+n;if(n.toLowerCase().includes(q))f.push(fp);if(v.t==='d'&&f.length<12)walk(fp)})})('C:');
        if(f.length){R.append(el('h4',null,'Files'));f.slice(0,12).forEach(p=>{const d=el('div',null,esc(p));d.style.cssText='padding:4px;cursor:pointer';d.onclick=()=>{S.hidden=true;OS.open(p)};R.append(d)})}}};
    render();inp.oninput=()=>render(inp.value);
    $('#startbtn').onclick=()=>{Snd.click();S.hidden=!S.hidden;if(!S.hidden){render(inp.value);inp.focus()}};
    addEventListener('pointerdown',e=>{if(!e.target.closest('#start,#startbtn'))S.hidden=true},true)},
  cal(d){const y=d.getFullYear(),m=d.getMonth();let s='Su Mo Tu We Th Fr Sa\n'+'   '.repeat(new Date(y,m,1).getDay());
    for(let i=1;i<=new Date(y,m+1,0).getDate();i++){s+=String(i).padStart(2)+' ';if(new Date(y,m,i).getDay()===6)s+='\n'}return s},
  tray(){const c=$('#clock'),tick=()=>{const d=new Date();const t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:OS.prefs.secs?'2-digit':undefined,hour12:OS.prefs.clock24?false:undefined});if(Desktop._t===t)return;Desktop._t=t;c.innerHTML=t+'<br>'+d.toLocaleDateString();$('#widget').innerHTML='<b>'+t+'</b><br>'+d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})};tick();setInterval(tick,1000);
    c.onclick=()=>{const d=new Date();OS.alert(d.toLocaleDateString(undefined,{month:'long',year:'numeric'}),Desktop.cal(d))};
    const net=()=>$('#net').textContent=navigator.onLine?'📶':'🚫';net();addEventListener('online',net);addEventListener('offline',net);
    navigator.getBattery?.().then(b=>{const u=()=>$('#bat').textContent='🔋'+Math.round(b.level*100)+'%';u();b.onlevelchange=u});
    $('#lockbtn').onclick=()=>OS.lock();$('#vol').oninput=e=>{OS.vol=+e.target.value;Snd.click()}}};

/* Global shortcuts are skipped while a game window has focus, so games keep WASD, arrows and Space. */
addEventListener('keydown',e=>{if(OS.gameFocus)return;
  if(e.altKey&&e.code==='Space'){e.preventDefault();$('#startbtn').click()}
  if(e.altKey&&e.key==='t')OS.launch('terminal');if((e.ctrlKey&&e.key==='k')||(e.altKey&&e.key==='s')){e.preventDefault();$('#startbtn').click()}if(e.altKey&&e.key==='w'&&WMS.list.length)WMS.focus(WMS.list[(WMS.list.indexOf(WMS.cur)+1)%WMS.list.length]);
  if(['Space','ArrowUp','ArrowDown'].includes(e.code)&&e.target===document.body)e.preventDefault()});
boot();
