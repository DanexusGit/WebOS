'use strict';
/* STORE: loja de jogos HTML dentro do WebOS (estilo Steam).
   Catalogo ao vivo do gn-math; se falhar, usa a lista UGS (arquivo anexado). "Instalar" = adicionar a Biblioteca e guardar o HTML no cache do navegador. Nada e baixado para o seu PC. */
const GN={zones:'https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json',cover:'https://cdn.jsdelivr.net/gh/gn-math/covers@main',html:'https://cdn.jsdelivr.net/gh/gn-math/html@main'};
const UGS={list:'https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js',html:'https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/'};
const Store={cat:null,src:'',lib:null,
  getLib(){return Store.lib||(Store.lib=OS.db.get('store:lib:'+OS.user.name,{}))},saveLib(){OS.db.set('store:lib:'+OS.user.name,Store.lib)},
  async catalog(force){if(!force&&Store.cat)return Store.cat;let list=[];
    try{const z=await(await fetch(GN.zones)).json();                      // 1) gn-math
      list=z.map(x=>{const u=String(x.url||'').replace('{HTML_URL}',GN.html);return{id:'gn:'+x.id,name:String(x.name||'').trim(),url:u,cover:String(x.cover||'').replace('{COVER_URL}',GN.cover),by:x.author||'gn-math'}}).filter(g=>g.name&&/jsdelivr/.test(g.url));
      if(list.length<20)throw 0;Store.src='gn-math'}
    catch{const t=await(await fetch(UGS.list)).text();                     // 2) UGS (alternativa)
      const m=t.match(/let\s+files\s*=\s*\[([\s\S]*?)\];/);if(!m)throw new Error('catalog');const seen=new Set(),pretty=f=>{const s=f.replace(/^cl/,'').replace(/\.html?$/i,'').replace(/[_\-]+/g,' ').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/\s+/g,' ').trim();return s?s[0].toUpperCase()+s.slice(1):f};
      list=[...m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x=>x[1]).filter(f=>/^cl./.test(f)&&!/[?\uFFFD]|singlefile/i.test(f)).filter(f=>{const k=f.toLowerCase();return seen.has(k)?0:seen.add(k)})
        .map(f=>({id:'ugs:'+f,name:pretty(f),url:UGS.html+encodeURIComponent(f.includes('.')&&f.lastIndexOf('.')>0?f:f+'.html'),cover:'',by:'UGS'}));Store.src='UGS (alternativa)'}
    return Store.cat=list.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))},
  async html(url){try{if(window.caches){const m=await(await caches.open('webos-store')).match(url);if(m)return await m.text()}}catch{}
    const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);return await r.text()},
  async install(g){const r=await fetch(g.url);if(!r.ok)throw new Error('HTTP '+r.status);const t=await r.text();
    try{if(window.caches)await(await caches.open('webos-store')).put(g.url,new Response(t,{headers:{'content-type':'text/html'}}))}catch{}   // offline cache (best effort)
    Store.getLib()[g.id]={id:g.id,name:g.name,url:g.url,cover:g.cover,by:g.by,size:t.length,t:Date.now()};Store.saveLib();OS.notify(g.name+' instalado')},
  async uninstall(g){delete Store.getLib()[g.id];Store.saveLib();try{if(window.caches)await(await caches.open('webos-store')).delete(g.url)}catch{}},
  launch(g,isolated){OS.launch('game',{url:g.url,title:g.name,isolated:!!isolated})},
  /* Runs a store game in a sandboxed iframe (srcdoc). Default keeps storage (many games need localStorage/IndexedDB); "isolated" removes it. */
  play(a){const f=el('iframe','game');f.setAttribute('sandbox','allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads'+(a.isolated?'':' allow-same-origin'));f.setAttribute('allow','fullscreen; autoplay; gamepad; clipboard-write');
    const win=WMS.create({title:a.title||'Game',icon:ICON('games'),appId:'game',args:a,body:f,w:900,h:600,onFocus:()=>setTimeout(()=>f.focus())}),msg=t=>`<body style="margin:0;display:grid;place-items:center;height:100vh;font:16px system-ui;background:#16202d;color:#c7d5e0;text-align:center;padding:20px">${t}</body>`;
    f.srcdoc=msg('Carregando '+esc(a.title||'')+'…');
    Store.html(a.url).then(t=>{const sh=`<base href="${esc(a.url.slice(0,a.url.lastIndexOf('/')+1))}"><script>window.webOS={saveData:function(i,d){parent.postMessage({webOS:'save',id:i||${JSON.stringify(a.title||'game')},d:d},'*')}};<\/script>`;
      f.srcdoc=/<head[^>]*>/i.test(t)?t.replace(/<head[^>]*>/i,m=>m+sh):sh+t}).catch(()=>f.srcdoc=msg('Não foi possível carregar o jogo.<br>Verifique a internet ou instale-o enquanto estiver online.'));return win}};
{const g=OS.apps.game.open;OS.apps.game.open=a=>a.url?Store.play(a):g(a)}   // the old runner now also plays store games

const hue=s=>Math.abs([...s].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%360;
const covr=(g,big)=>{const h=hue(g.name),d=el('div','stc-c'+(big?' big':''));d.style.background=`linear-gradient(135deg,hsl(${h} 60% 42%),hsl(${(h+50)%360} 60% 24%))`;d.textContent=(g.name.match(/[A-Za-z0-9]/)||['?'])[0].toUpperCase();
  if(g.cover){const i=el('img');i.loading='lazy';i.alt='';i.src=g.cover;i.onerror=()=>i.remove();d.append(i)}return d};
OS.apps.store={name:'Game Store',icon:ICON('steam'),cat:'Games',open(a){const b=col();b.classList.add('st');
  b.innerHTML='<div class="st-nav"><button data-t="store" class="on">LOJA</button><button data-t="lib">BIBLIOTECA</button><span class="st-src"></span><span style="flex:1"></span><input class="st-q" placeholder="Pesquisar jogos"><button data-r title="Atualizar catálogo">⟳</button></div><div class="st-az"></div><div class="st-main"><div class="st-feat"></div><div class="st-info"></div><div class="st-grid"></div></div>';
  let tab='store',letter='',query='',list=[],shown=0,cat=[],tm;const q=s=>$(s,b),grid=q('.st-grid'),main=q('.st-main'),feat=q('.st-feat'),info=q('.st-info');
  const btns=(g,box)=>{box.innerHTML='';const inst=!!Store.getLib()[g.id];
    if(!inst){const i=el('button','btn-g','⬇ Instalar');i.onclick=async e=>{e.stopPropagation();i.disabled=true;i.textContent='Instalando…';try{await Store.install(g);btns(g,box);if(tab==='lib')render()}catch{i.disabled=false;i.textContent='⬇ Instalar';OS.alert('Falha ao instalar','Não foi possível baixar '+g.name+'. Verifique a internet.')}};box.append(i)}
    else{const p=el('button','btn-b','▶ Jogar'),u=el('button',null,'🗑');u.title='Desinstalar';p.onclick=e=>{e.stopPropagation();Store.launch(g)};u.onclick=async e=>{e.stopPropagation();if(await OS.confirm('Desinstalar','Remover '+g.name+' da biblioteca?')){await Store.uninstall(g);btns(g,box);if(tab==='lib')render()}};box.append(p,u)}};
  const card=g=>{const c=el('div','stc');c.append(covr(g),el('div','stc-n',esc(g.name)));const box=el('div','stc-b');btns(g,box);c.append(box);c.ondblclick=()=>Store.launch(g);
    c.oncontextmenu=e=>Ctx.show(e,[['Jogar',()=>Store.launch(g)],['Jogar isolado (sem armazenamento)',()=>Store.launch(g,1)],Store.getLib()[g.id]?['Desinstalar',async()=>{await Store.uninstall(g);btns(g,box);if(tab==='lib')render()}]:['Instalar',()=>$('.btn-g',box).click()]]);return c};
  const more=()=>{list.slice(shown,shown+60).forEach(g=>grid.append(card(g)));shown+=60};
  const render=()=>{const lib=Store.getLib(),t=query.toLowerCase(),src=tab==='lib'?Object.values(lib).sort((x,y)=>y.t-x.t):cat;
    list=src.filter(g=>(!t||g.name.toLowerCase().includes(t))&&(!letter||(letter==='#'?/^[^A-Za-z]/.test(g.name):g.name.toUpperCase().startsWith(letter))));grid.innerHTML='';shown=0;more();main.scrollTop=0;
    info.textContent=list.length+(tab==='store'?' jogos no catálogo':' jogos na sua biblioteca');
    const c=cat.filter(g=>g.cover),pick=(c.length?c:cat)[(new Date().getDate()*7)%Math.max(1,(c.length?c:cat).length)];feat.hidden=!(tab==='store'&&!t&&!letter&&pick);
    if(!feat.hidden){feat.innerHTML='';const box=el('div','stc-b');btns(pick,box);const d=el('div','st-ft',`<small>EM DESTAQUE</small><h2>${esc(pick.name)}</h2><p>Jogo HTML disponível para instalar no WebOS. ${esc(pick.by||'')}</p>`);d.append(box);feat.append(covr(pick,1),d)}};
  ['Todos','#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].forEach(l=>{const x=el('button',l==='Todos'?'on':null,l);x.onclick=()=>{letter=l==='Todos'?'':l;$$('.st-az button',b).forEach(y=>y.classList.toggle('on',y===x));render()};q('.st-az').append(x)});
  $$('.st-nav [data-t]',b).forEach(x=>x.onclick=()=>{tab=x.dataset.t;$$('.st-nav [data-t]',b).forEach(y=>y.classList.toggle('on',y===x));render()});
  q('.st-q').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{query=e.target.value;render()},200)};main.onscroll=()=>{if(shown<list.length&&main.scrollTop+main.clientHeight>main.scrollHeight-400)more()};
  const load=force=>{info.textContent='Conectando ao gn-math…';if(force)Store.cat=null;Store.catalog(force).then(c=>{cat=c;q('.st-src').textContent='Fonte: '+Store.src;render()}).catch(()=>{info.textContent='Sem conexão com o catálogo. A sua biblioteca instalada continua disponível.'})};
  q('[data-r]').onclick=()=>load(true);load();return WMS.create({title:'Game Store',icon:ICON('steam'),appId:'store',args:a,body:b,w:880,h:580})}};
