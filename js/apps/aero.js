'use strict';
/* AERO: Frutiger Aero / Windows 7. Icones, lista de apps, menu Iniciar, papeis de parede e migracao do tema. */
const ICON=n=>`<img class="ic" src="assets/icons/${n}.png" alt="">`;
const AERO_ICONS={explorer:'files',notepad:'notepad',calc:'calc',calendar:'calendar',camera:'camera',terminal:'terminal',settings:'settings',taskmgr:'taskmgr',sysinfo:'about',geochat:'games',game:'games',trash:'trash',music:'music',browser:'browser',paint:'paint',clock:'clock',video:'video',ai:'assistant'};
/* Apps removidos a pedido: Notes, Conversor, Clima, Snake, PDF, Biblioteca antiga (a Loja a substitui). */
['notes','convert','weather','snake','pdf','arcade'].forEach(id=>delete OS.apps[id]);delete ASSOC.pdf;
for(const[id,f]of Object.entries(AERO_ICONS))if(OS.apps[id])OS.apps[id].icon=ICON(f);
const MOBILE_ICON={camera:ICON('camera-lens'),ai:ICON('assistant-logo')}; // sem azulejo proprio, para ficarem bem no azulejo de vidro do celular
DEFAPPS.length=0;DEFAPPS.push('explorer','browser','store','geochat','unity','music','video','camera','calc','calendar','clock','ai','paint','notepad','terminal','settings','taskmgr','sysinfo','trash');

/* Papeis de parede: CSS puro (sem arquivos). Para usar suas imagens: coloque em assets/wallpapers/ e liste o nome do arquivo abaixo. */
const WALLPAPER_FILES=[['wp25','Windows 7'],['wp01','Cidade Aqua'],['wp02','Sonic Aero'],['wp03','Ceu Xadrez'],['wp04','Gato Bliss'],['wp05','Hollow Knight'],['wp06','Minecraft Steve'],['wp07','Spider-Man Colagem'],['wp08','Estrela Cromada'],['wp09','Fumaca'],['wp10','Topografia'],['wp11','Buraco Negro'],['wp12','Mario no Banco'],['wp13','Casa Vermelha'],['wp14','Sonic Azul'],['wp15','Bliss Meme'],['wp16','Gato no Mar'],['wp17','Windows Escuro'],['wp18','Spider-Man Logo'],['wp19','Adventure Time'],['wp20','Windows 7 Gato'],['wp21','Costa ao Entardecer'],['wp22','Cachoeira'],['wp23','Arco de Pedra'],['wp24','Lavanda'],['wp26','The Wave']]; // [arquivo em assets/wallpapers/ (.jpg + thumbs/), nome]. Para adicionar: coloque wpNN.jpg e thumbs/wpNN.jpg e inclua aqui.
const AERO_WALLS={
 'Aero Azul':'radial-gradient(ellipse 60% 45% at 72% 22%,rgba(255,255,255,.8),transparent 62%),radial-gradient(ellipse 80% 55% at 18% 95%,rgba(0,55,140,.75),transparent 62%),linear-gradient(160deg,#6ec8ff 0,#2a82d8 45%,#0b3d92 100%)',
 'Bolhas':'radial-gradient(circle at 18% 28%,transparent 0 5%,rgba(255,255,255,.65) 5.4%,transparent 6.6%),radial-gradient(circle at 74% 62%,transparent 0 8%,rgba(255,255,255,.55) 8.4%,transparent 9.8%),radial-gradient(circle at 48% 80%,transparent 0 3%,rgba(255,255,255,.7) 3.4%,transparent 4.4%),radial-gradient(circle at 86% 20%,transparent 0 4%,rgba(255,255,255,.6) 4.4%,transparent 5.4%),radial-gradient(ellipse 70% 50% at 50% 0,rgba(255,255,255,.7),transparent 60%),linear-gradient(180deg,#c4efff,#4cc4ea 55%,#1a8fd2)',
 'Natureza':'radial-gradient(ellipse 70% 34% at 28% 106%,#3c9a2c 0 98%,transparent 100%),radial-gradient(ellipse 80% 38% at 82% 110%,#5cbc40 0 98%,transparent 100%),radial-gradient(ellipse 55% 30% at 50% 0,rgba(255,255,255,.8),transparent),linear-gradient(180deg,#58b6f4,#bde8ff 62%,#eafaff)',
 'Aurora Aero':'radial-gradient(ellipse 70% 50% at 28% 20%,rgba(196,255,232,.85),transparent 60%),radial-gradient(ellipse 60% 50% at 82% 72%,rgba(70,205,255,.65),transparent 60%),linear-gradient(135deg,#0b6fb8,#18b6a6 50%,#2fd08a)',
 'Por do Sol':'radial-gradient(ellipse 80% 40% at 50% 100%,rgba(255,200,120,.8),transparent 70%),linear-gradient(180deg,#2a5fb8,#7aa8e8 42%,#ffd9a0 78%,#ff9d6a)'};
const WALLTHUMB={};
{const old={...WALLS},img={};WALLPAPER_FILES.forEach(([f,n])=>{img[n]=`url("assets/wallpapers/${f}.jpg")`;WALLTHUMB[n]=`url("assets/wallpapers/thumbs/${f}.jpg")`});
 const nm=Object.keys(img),pick=a=>Object.fromEntries(a.map(n=>[n,img[n]]));Object.keys(WALLS).forEach(k=>delete WALLS[k]);Object.assign(WALLS,pick(nm.slice(0,3)),AERO_WALLS,pick(nm.slice(3)),old)}
Object.assign(PREF_DEF,{theme:'aero',wall:WALLS['Windows 7'],icoSize:48,fontSize:12});

/* Migracao unica: quem ja usava o sistema recebe o visual Aero, os novos icones e a Loja. */
const _ae=OS.applyPrefs;OS.applyPrefs=()=>{const P=OS.prefs;
  if(!P.aero){P.aero=1;P.theme='aero';P.wall=WALLS['Aero Azul'];P.icoSize=48;P.dapps=DEFAPPS.slice();P.pins=['app:explorer','app:browser','app:store'];P.pos={}}
  if(!P.aero2){P.aero2=1;if(P.wall===AERO_WALLS['Aero Azul'])P.wall=WALLS['Cidade Aqua']}
  if(!P.aero3){P.aero3=1;P.fontSize=12;if(P.wall===WALLS['Cidade Aqua']||P.wall===AERO_WALLS['Aero Azul'])P.wall=WALLS['Windows 7']}
  P.dapps=(P.dapps||[]).filter(id=>OS.apps[id]);P.pins=(P.pins||[]).filter(k=>k.startsWith('C:')||OS.apps[k.slice(4)]);_ae();
  /* url() inside a CSS variable resolves against the stylesheet (css/), not the page: make image wallpapers absolute at apply time. */
  if(/^url\("(?!data:)/.test(P.wall))$('#desktop').style.setProperty('--wall',P.wall.replace(/url\("([^"]+)"\)/,(m,u)=>`url("${new URL(u,document.baseURI).href}")`))};

/* Menu Iniciar estilo Windows 7: programas a esquerda, atalhos a direita, busca embaixo. */
Desktop.start=function(){const S=$('#start');
  S.innerHTML='<div class="sm-l"><div class="sm-progs"></div><div class="sm-search"><input placeholder="Pesquisar programas e arquivos"></div></div><div class="sm-r"><div class="sm-user"></div><div class="sm-links"></div><div class="sm-pw"><button data-o>Desligar</button><button data-l title="Bloquear">🔒</button></div></div>';
  const q=s=>$(s,S),L=q('.sm-progs'),inp=q('input'),H=VFS.home(),go=f=>()=>{S.hidden=true;f()};
  q('.sm-user').innerHTML=`${avHTML(OS.user.av)}${esc(OS.user.name)}`;
  [['files','Documents',()=>OS.launch('explorer',{path:H+'/Documents'})],['files','Pictures',()=>OS.launch('explorer',{path:H+'/Pictures'})],['music','Music',()=>OS.launch('explorer',{path:H+'/Music'})],['steam','Game Store',()=>OS.launch('store')],['files','Files',()=>OS.launch('explorer')],['settings','Settings',()=>OS.launch('settings')],['taskmgr','Task Manager',()=>OS.launch('taskmgr')],['trash','Trash',()=>OS.launch('trash')]]
    .forEach(([i,n,f])=>{const r=el('div','lnk',ICON(i)+'<span>'+n+'</span>');r.onclick=go(f);q('.sm-links').append(r)});
  const render=t=>{t=(t||'').toLowerCase();L.innerHTML='';
    Object.entries(OS.apps).filter(([k,a])=>a.cat&&a.name.toLowerCase().includes(t)).sort((x,y)=>x[1].name.localeCompare(y[1].name)).forEach(([k,a])=>{const P=OS.prefs,r=el('div','pr',`${(P.ic||{})['app:'+k]||a.icon}<span>${esc((P.ren||{})['app:'+k]||a.name)}</span>`);r.onclick=go(()=>OS.launch(k));r.oncontextmenu=e=>Ctx.app(e,k,()=>{});L.append(r)});
    if(t){const f=[];(function walk(p){VFS.ls(p).forEach(([n,v])=>{const fp=p+'/'+n;if(n.toLowerCase().includes(t))f.push(fp);if(v.t==='d'&&f.length<12)walk(fp)})})('C:');f.slice(0,12).forEach(p=>{const r=el('div','pr','<span>📄 '+esc(p)+'</span>');r.onclick=go(()=>OS.open(p));L.append(r)})}};
  render();inp.oninput=()=>render(inp.value);
  q('[data-o]').onclick=()=>{WMS.save();location.reload()};q('[data-l]').onclick=go(()=>OS.lock?OS.lock():location.reload());
  $('#startbtn').onclick=()=>{Snd.click();S.hidden=!S.hidden;if(!S.hidden){render(inp.value);inp.focus()}};
  addEventListener('pointerdown',e=>{if(!e.target.closest('#start,#startbtn'))S.hidden=true},true)};
