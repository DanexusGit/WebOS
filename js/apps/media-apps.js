'use strict';
/* APPS 2: GeoChat bundle, browser, music, calculator, assistant, calendar, clock, paint, trash, notifications. */
OS.notify=m=>{const t=el('div','toast',esc(m));document.body.append(t);Snd.beep(800,.08);setTimeout(()=>t.remove(),3500)};

/* The uploaded file, embedded whole via bundle.js. allow-same-origin lets it use localStorage/MQTT; that also means it shares storage with the OS, so only embed code you trust. */
OS.apps.geochat={name:'GeoChat + Games',icon:'💬',cat:'Games',open(a){const f=el('iframe','game');
  f.setAttribute('sandbox','allow-scripts allow-forms allow-pointer-lock allow-popups allow-same-origin allow-modals');f.setAttribute('allow','fullscreen; autoplay; gamepad; clipboard-write');f.srcdoc=BUNDLE.geochat;
  return WMS.create({title:'GeoChat + UGS Games',icon:'💬',appId:'geochat',args:a,body:f,w:960,h:600,onFocus:()=>setTimeout(()=>f.focus())})}};

OS.apps.browser={name:'Browser',icon:'🌐',cat:'Productivity',open(a){const b=col(),H=[];let hi=-1;
  b.innerHTML='<div class="bar2"><button data-b>◀</button><button data-f>▶</button><button data-r>⟳</button><input style="flex:1" placeholder="Type a URL or search"><button data-x title="Open in a real tab">↗</button></div><div class="bar2" data-k></div><iframe style="flex:1;border:0;background:#fff" sandbox="allow-scripts allow-forms allow-popups allow-same-origin"></iframe><small style="padding:4px;opacity:.7">Many sites refuse to be embedded. Use ↗ to open them in a real tab.</small>';
  const u=$('input',b),f=$('iframe',b),norm=v=>/^https?:\/\//.test(v)?v:/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)?'https://'+v:'https://en.wikipedia.org/w/index.php?search='+encodeURIComponent(v);
  const win=WMS.create({title:'Browser',icon:'🌐',appId:'browser',args:a,body:b,w:820,h:540});
  const go=(v,push=true)=>{const url=norm(v.trim());if(push){H.splice(hi+1);H.push(url);hi=H.length-1}u.value=url;f.src=url;win.args.url=url};
  [['Wikipedia','https://en.wikipedia.org'],['MDN','https://developer.mozilla.org'],['OpenStreetMap','https://www.openstreetmap.org'],['Internet Archive','https://archive.org']].forEach(([n,l])=>{const x=el('button',null,n);x.onclick=()=>go(l);$('[data-k]',b).append(x)});
  u.onkeydown=e=>{if(e.key==='Enter')go(u.value)};$('[data-b]',b).onclick=()=>hi>0&&go(H[--hi],false);$('[data-f]',b).onclick=()=>hi<H.length-1&&go(H[++hi],false);
  $('[data-r]',b).onclick=()=>f.src=f.src;$('[data-x]',b).onclick=()=>window.open(u.value,'_blank');go(a.url||'https://en.wikipedia.org');return win}};

OS.apps.music={name:'Music',icon:'🎵',cat:'Media',open(a){const b=col(),au=new Audio();let list=[],i=0,an,live=true;
  b.innerHTML='<div class="bar2"><button data-p>⏮</button><button data-pl>▶</button><button data-n>⏭</button><input type="range" data-t value="0" min="0" max="100" style="flex:1"><input type="range" data-v min="0" max="1" step=".05" value=".7" style="width:70px"><button data-i>＋</button><input type="file" accept="audio/*" multiple hidden></div><canvas style="flex:1;min-height:60px;width:100%"></canvas><div data-l class="pad" style="max-height:130px"></div>';
  const q=s=>$(s,b),L=q('[data-l]'),T=q('[data-t]'),cv=q('canvas');
  const load=()=>{list=VFS.ls(VFS.home()+'/Music').filter(([k,v])=>v.t==='f'&&String(v.d).startsWith('data:audio'));L.innerHTML=list.length?'':'No tracks yet. Click ＋ or drop mp3 files on the desktop.';
    list.forEach(([k],n)=>{const r=el('div',null,(n===i&&!au.paused?'▶ ':'🎵 ')+esc(k));r.style.cursor='pointer';r.onclick=()=>play(n);L.append(r)})};
  const play=async n=>{if(!list.length||n<0)return;i=(n+list.length)%list.length;au.src=URL.createObjectURL(await(await fetch(list[i][1].d)).blob());au.play();viz();load()};
  const viz=()=>{if(an)return;const ac=new AudioContext();an=ac.createAnalyser();ac.createMediaElementSource(au).connect(an);an.connect(ac.destination);const g=cv.getContext('2d'),d=new Uint8Array(an.frequencyBinCount);
    (function draw(){if(!live)return;requestAnimationFrame(draw);an.getByteFrequencyData(d);if(cv.width!==cv.clientWidth)cv.width=cv.clientWidth;if(cv.height!==cv.clientHeight)cv.height=cv.clientHeight;g.clearRect(0,0,cv.width,cv.height);g.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent')||'#6aa8ff';
      const w=cv.width/48;for(let k=0;k<48;k++){const h=d[k*2]/255*cv.height;g.fillRect(k*w+1,cv.height-h,w-2,h)}})()};
  q('[data-pl]').onclick=()=>au.src?(au.paused?au.play():au.pause()):play(0);q('[data-n]').onclick=()=>play(i+1);q('[data-p]').onclick=()=>play(i-1);
  au.onplay=()=>q('[data-pl]').textContent='⏸';au.onpause=()=>q('[data-pl]').textContent='▶';au.onended=()=>play(i+1);
  au.ontimeupdate=()=>T.value=au.duration?au.currentTime/au.duration*100:0;T.oninput=()=>au.duration&&(au.currentTime=T.value/100*au.duration);q('[data-v]').oninput=e=>au.volume=e.target.value;au.volume=.7;
  const fi=q('input[type=file]');q('[data-i]').onclick=()=>fi.click();fi.onchange=()=>OS.importFiles([...fi.files],load);load();
  if(a.path){const n=list.findIndex(([k])=>k===a.path.split('/').pop());n>=0&&play(n)}
  return WMS.create({title:'Music',icon:'🎵',appId:'music',args:a,body:b,w:520,h:400,onClose:()=>{live=false;au.pause()}})}};

OS.apps.calc={name:'Calculator',icon:'🧮',cat:'Productivity',open(a){const b=el('div','pad');let mem=0;
  b.innerHTML='<input readonly style="font-size:22px;text-align:right"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px"></div><div style="max-height:80px;overflow:auto;font:12px monospace;user-select:text"></div>';
  const [d,g,h]=b.children,F={sin:x=>Math.sin(x*Math.PI/180),cos:x=>Math.cos(x*Math.PI/180),tan:x=>Math.tan(x*Math.PI/180),log:Math.log10,ln:Math.log}; // trig in degrees
  const ev=()=>{const s=d.value;if(!/^[\d+\-*/().^πsincotalgn√\s]*$/.test(s))return NaN; // whitelist before evaluating
    try{return Function('F','return '+s.replace(/π/g,'Math.PI').replace(/√/g,'Math.sqrt').replace(/\^/g,'**').replace(/sin|cos|tan|log|ln/g,m=>'F.'+m))(F)}catch{return NaN}};
  'MC MR M+ ( ) sin cos tan log ln 7 8 9 / C 4 5 6 * ⌫ 1 2 3 - √ 0 . π + ^ ='.split(' ').forEach(k=>{const x=el('button',null,k);x.onclick=()=>{
    if(k==='C')d.value='';else if(k==='⌫')d.value=d.value.slice(0,-1);else if(k==='MC')mem=0;else if(k==='MR')d.value+=mem;else if(k==='M+')mem+=+ev()||0;
    else if(k==='='){const r=ev();h.innerHTML=esc(d.value+' = '+r)+'<br>'+h.innerHTML;d.value=String(r)}else d.value+=/^(sin|cos|tan|log|ln|√)$/.test(k)?k+'(':k};g.append(x)});
  return WMS.create({title:'Calculator',icon:'🧮',appId:'calc',args:a,body:b,w:340,h:440})}};

OS.apps.ai={name:'Assistant',icon:'🤖',cat:'Productivity',open(a){const b=col();
  b.innerHTML='<div class="pad" style="flex:1;user-select:text"></div><div class="bar2"><input style="flex:1" placeholder="Ask the OS help desk"><button>Send</button></div>';
  const M=$('.pad',b),inp=$('input',b),say=(w,t)=>{const d=el('div',null,'<b>'+w+':</b> '+esc(t));M.append(d);M.scrollTop=M.scrollHeight;return d};
  const KB=[[/wallpaper|theme|accent|color/,'Open Settings to change theme, accent colour and wallpaper.'],[/game|play|arcade|minecraft/,'Games has its own library. Drop other .html games on the desktop to play them from Arcade.'],[/file|folder|delete|trash|rename/,'Use Files. Right-click for rename or delete. Deleted items go to Trash.'],[/music|mp3|song/,'Drop .mp3 files on the desktop, then open Music.'],[/snap|window|maxim/,'Drag a window to the left or right edge to snap it, or to the top to maximise.'],[/hello|^hi/,'Hello! Ask me about files, games, themes or windows.']];
  const send=()=>{const q=inp.value.trim();if(!q)return;inp.value='';say('You',q);const t=say('Assistant','typing…');
    setTimeout(()=>t.innerHTML='<b>Assistant:</b> '+esc((KB.find(([r])=>r.test(q.toLowerCase()))||[0,'I only know the basics: files, games, themes, windows and music.'])[1]),600+Math.random()*600)};
  inp.onkeydown=e=>{if(e.key==='Enter')send()};$('button',b).onclick=send;say('Assistant','Hi, I am the WebOS help desk. This is a built-in mock; a real model API is not connected.');
  return WMS.create({title:'Assistant',icon:'🤖',appId:'ai',args:a,body:b,w:420,h:440})}};

OS.apps.calendar={name:'Calendar',icon:'📅',cat:'Productivity',open(a){const b=el('div','pad'),d=new Date();d.setDate(1);const key='todos:'+OS.user.name;
  const draw=()=>{const T=OS.db.get(key,{}),y=d.getFullYear(),m=d.getMonth(),n=new Date(y,m+1,0).getDate();
    let h=`<div class="bar2"><button data-p>◀</button><b style="flex:1;text-align:center">${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><button data-n>▶</button></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`+'SMTWTFS'.split('').map(x=>`<i style="text-align:center;opacity:.6">${x}</i>`).join('')+'<span></span>'.repeat(d.getDay());
    for(let i=1;i<=n;i++){const k=`${y}-${m+1}-${i}`,t=T[k]||[];h+=`<button data-d="${k}" style="min-height:48px;text-align:left;font-size:12px">${i}${t.length?'<br>📌'+t.length:''}</button>`}b.innerHTML=h+'</div>'};
  b.onclick=async e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.p!==undefined){d.setMonth(d.getMonth()-1);draw()}else if(t.dataset.n!==undefined){d.setMonth(d.getMonth()+1);draw()}
    else if(t.dataset.d){const T=OS.db.get(key,{}),k=t.dataset.d,v=await OS.prompt('Tasks for '+k,'Separate tasks with semicolons.',(T[k]||[]).join('; '));if(v!==null){T[k]=v.split(';').map(s=>s.trim()).filter(Boolean);OS.db.set(key,T);draw()}}};
  draw();return WMS.create({title:'Calendar',icon:'📅',appId:'calendar',args:a,body:b,w:500,h:440})}};

OS.apps.clock={name:'Clock',icon:'⏱️',cat:'Productivity',open(a){const b=el('div','pad'),Z=['local','America/New_York','Europe/London','Asia/Tokyo','Australia/Sydney'];let run=0,acc=0,t0=0,cd=0;
  b.innerHTML='<div data-w></div><div><b data-s style="font-size:24px">0.0 s</b> <button data-a>Start/Stop</button> <button data-z>Reset</button></div><div><input data-c type="number" value="60" style="width:80px"> s <button data-g>Start timer</button> <b data-cd></b></div>';
  const q=s=>$(s,b);q('[data-a]').onclick=()=>{if(run)acc+=Date.now()-t0;else t0=Date.now();run=!run};q('[data-z]').onclick=()=>{run=0;acc=0};q('[data-g]').onclick=()=>cd=Date.now()+q('[data-c]').value*1000;
  const iv=setInterval(()=>{q('[data-w]').innerHTML=Z.map(z=>`${z==='local'?'Local':z.split('/')[1].replace('_',' ')}: <b>${new Date().toLocaleTimeString([],z==='local'?{}:{timeZone:z})}</b>`).join('<br>');
    q('[data-s]').textContent=((acc+(run?Date.now()-t0:0))/1000).toFixed(1)+' s';
    if(cd){const r=Math.ceil((cd-Date.now())/1000);q('[data-cd]').textContent=r>0?r+' s':'';if(r<=0){cd=0;Snd.error();OS.notify('Timer finished')}}},100);
  return WMS.create({title:'Clock',icon:'⏱️',appId:'clock',args:a,body:b,w:380,h:340,onClose:()=>clearInterval(iv)})}};

OS.apps.paint={name:'Paint',icon:'🎨',cat:'Media',open(a){const b=col();
  b.innerHTML='<div class="bar2"><input type="color" value="#ffffff"><input type="range" min="1" max="30" value="4"><button data-c>Clear</button><button data-s>Save to Pictures</button></div><canvas width="900" height="560" style="flex:1;min-height:0;width:100%;background:#111;touch-action:none"></canvas>';
  const cv=$('canvas',b),g=cv.getContext('2d'),[c,w]=$$('input',b);let p=null;g.lineCap='round';
  const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
  cv.onpointerdown=e=>{p=pt(e);cv.setPointerCapture(e.pointerId)};cv.onpointerup=()=>p=null;
  cv.onpointermove=e=>{if(!p)return;const q=pt(e);g.strokeStyle=c.value;g.lineWidth=w.value;g.beginPath();g.moveTo(...p);g.lineTo(...q);g.stroke();p=q};
  $('[data-c]',b).onclick=()=>g.clearRect(0,0,cv.width,cv.height);
  $('[data-s]',b).onclick=async()=>{const n=await OS.prompt('Save drawing','File name:','drawing.png');if(n){VFS.write(VFS.home()+'/Pictures/'+n,cv.toDataURL());OS.notify('Saved '+n)}};
  return WMS.create({title:'Paint',icon:'🎨',appId:'paint',args:a,body:b,w:700,h:500})}};

OS.apps.trash={name:'Trash',icon:'🗑️',cat:'System',open(a){VFS.mkdir('C:/Trash');return OS.launch('explorer',{path:'C:/Trash'})}};
