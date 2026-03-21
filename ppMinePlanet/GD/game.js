// ════════════════════════════════════════════════════════════════════════════
// ── GAME DISTRIBUTION SDK INTEGRATION
// ════════════════════════════════════════════════════════════════════════════
var GD_SDK_LOADED = false;
const USE_ADS = true; // GameDistribution handles real ads; simulation is fallback
var gdsdkRewardCallback = null;
var gdsdkInterstitialCallback = null;

window['GD_OPTIONS'] = {
  gameId: 'YOUR_GAME_ID_HERE', // Replace with your GameDistribution game ID
  onEvent: function(event) {
    switch (event.name) {
      case 'SDK_GAME_START':
        // Resume game audio/logic after ad
        break;
      case 'SDK_GAME_PAUSE':
        // Pause game audio/logic during ad
        break;
      case 'SDK_READY':
        GD_SDK_LOADED = true;
        break;
      case 'SDK_REWARDED_WATCH_COMPLETE':
        if (gdsdkRewardCallback) { gdsdkRewardCallback(); gdsdkRewardCallback = null; }
        break;
      case 'SDK_REWARDED_WATCH_INCOMPLETE':
      case 'SDK_ERROR':
        // Fallback: still call reward if ad fails (graceful degradation)
        if (gdsdkRewardCallback) { gdsdkRewardCallback(); gdsdkRewardCallback = null; }
        break;
      case 'SDK_INTERSTITIAL_CLOSE':
      case 'SDK_INTERSTITIAL_DISMISSED':
        if (gdsdkInterstitialCallback) { gdsdkInterstitialCallback(); gdsdkInterstitialCallback = null; }
        break;
    }
  }
};

// Show a rewarded ad via GD SDK (falls back to simulation if SDK not loaded)
function showRewardedAd(callback) {
  gdsdkRewardCallback = callback;
  if (GD_SDK_LOADED && typeof gdsdk !== 'undefined') {
    try {
      gdsdk.showAd(gdsdk.AdType.Rewarded);
      return;
    } catch(e) {}
  }
  // Fallback simulation
  showAdSimulation(callback, true);
}

// Show an interstitial ad via GD SDK
function showInterstitialAd(callback) {
  gdsdkInterstitialCallback = callback;
  if (GD_SDK_LOADED && typeof gdsdk !== 'undefined') {
    try {
      gdsdk.showAd(gdsdk.AdType.Interstitial);
      return;
    } catch(e) {}
  }
  // Fallback simulation — fire immediately
  if (callback) { setTimeout(callback, 200); gdsdkInterstitialCallback = null; }
}

// ════════════════════════════════════════════════════════════════════════════
// ── THEME
// ════════════════════════════════════════════════════════════════════════════
const THEME_KEY = 'mineplanet-theme';
let isDark = localStorage.getItem(THEME_KEY) !== 'light';
function toggleTheme(){
  isDark=!isDark;document.body.classList.toggle('light',!isDark);
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}
if (!isDark) {document.body.classList.add('light');} else {document.body.classList.remove('light');}

// ── STARS ──
(()=>{
  const c=document.getElementById('stars');c.width=innerWidth;c.height=innerHeight;
  const x=c.getContext('2d');
  for(let i=0;i<380;i++){x.beginPath();x.arc(Math.random()*c.width,Math.random()*c.height,Math.random()*1.5,0,Math.PI*2);x.fillStyle=`rgba(255,255,255,${.1+Math.random()*.8})`;x.fill();}
  for(let i=0;i<6;i++){const g=x.createRadialGradient(Math.random()*c.width,Math.random()*c.height,0,Math.random()*c.width,Math.random()*c.height,300+Math.random()*400);g.addColorStop(0,`hsla(${Math.random()*360},80%,50%,.05)`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);}
})();

// ── PARTICLES ──
const pc=document.getElementById('pc');pc.width=innerWidth;pc.height=innerHeight;
const pctx=pc.getContext('2d');let parts=[];
function spawnBurst(sx,sy,color,n=14){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=50+Math.random()*110;parts.push({x:sx,y:sy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,color,sz:3+Math.random()*5,life:.5+Math.random()*.4,t:0});}}
function tickParts(dt){pctx.clearRect(0,0,pc.width,pc.height);parts=parts.filter(p=>{p.t+=dt;if(p.t>=p.life)return false;const pct=p.t/p.life;pctx.globalAlpha=(1-pct)*.9;pctx.fillStyle=p.color;const s=p.sz*(1-pct*.5);pctx.fillRect(p.x+p.vx*p.t-s/2,p.y+p.vy*p.t+60*p.t*p.t-s/2,s,s);return true;});pctx.globalAlpha=1;}

// ── CANVAS ──
const canvas=document.getElementById('gc');const ctx=canvas.getContext('2d');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;pc.width=innerWidth;pc.height=innerHeight;}
resize();window.addEventListener('resize',()=>{resize();drawAll();});

// ── HEX MATH ──
function hexToPixel(q,r,sz){return{x:sz*(Math.sqrt(3)*q+Math.sqrt(3)/2*r),y:sz*(1.5*r)};}
function pixelToHex(px,py,sz){const q=(Math.sqrt(3)/3*px-1/3*py)/sz;const r=(2/3*py)/sz;return axialRound(q,r);}
function axialRound(fq,fr){const fs=-fq-fr;let rq=Math.round(fq),rr=Math.round(fr),rs=Math.round(fs);const dq=Math.abs(rq-fq),dr=Math.abs(rr-fr),ds=Math.abs(rs-fs);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;return{q:rq,r:rr};}
function hexDisk(R){const l=[];for(let q=-R;q<=R;q++){const r1=Math.max(-R,-q-R),r2=Math.min(R,-q+R);for(let r=r1;r<=r2;r++)l.push({q,r});}return l;}
function hexNeighbors(q,r){return[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(([dq,dr])=>({q:q+dq,r:r+dr}));}
function hexDist(q,r){return Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));}

// ── GAME STATE ──
let level=1,score=0,maxHp=12,hp=12;
let cells=[],sel=null;
let inventory={wood:0,stone:0,iron:0,crystal:0,fish:0};
let objective={};
let camX=0,camY=0,camZ=1;
let hexSize=32;
let playerName='UNKNOWN';
let playerAvatar='🌍';
let matchHistory=[];
let historyOpen=false;
let gameAbandoned=false;
let bombsHit=0;

function lvlCfg(lv){
  return{
    radius:Math.min(5+Math.floor(lv/2),11),
    mineRatio:Math.min(0.06+lv*.022,.22),
    waterRatio:Math.max(.28-lv*.01,.15),
    woodNeed:Math.min(1+Math.floor(lv/2),5),
    stoneNeed:Math.min(1+Math.floor(lv/2),5),
    ironNeed:Math.min(1+Math.floor(lv/2),4),
    fishNeed:Math.min(1+Math.floor(lv/2),5),
    coalNeed:lv>=2?Math.min(Math.floor((lv-1)/2)+1,3):0,
    crabNeed:lv>=2?Math.min(Math.floor((lv-1)/2)+1,3):0,
    goldNeed:lv>=3?Math.min(Math.floor((lv-2)/2)+1,3):0,
    coralNeed:lv>=3?Math.min(Math.floor((lv-2)/2)+1,3):0,
    crystalNeed:lv>=4?Math.min(Math.floor((lv-3)/2)+1,3):0,
    herbsNeed:lv>=5?Math.min(Math.floor((lv-4)/2)+1,2):0,
    pearlNeed:lv>=5?Math.min(Math.floor((lv-4)/2)+1,2):0,
    mushroomNeed:lv>=6?Math.min(Math.floor((lv-5)/2)+1,2):0,
    octopusNeed:lv>=7?Math.min(Math.floor((lv-6)/2)+1,2):0,
  };
}

// ── COLORS ──
const DARK={landHidden:'#0e2018',landHiddenBorder:'#1c3828',waterHidden:'#061828',waterHiddenBorder:'#0d3060',revealedLandBorder:'#00ff88',revealedWaterBorder:'#00aaff'};
const LIGHT={landHidden:'#b8d8c0',landHiddenBorder:'#7aaa88',waterHidden:'#8ab8d8',waterHiddenBorder:'#4488bb',revealedLandBorder:'#008844',revealedWaterBorder:'#0066aa'};
function TC(){return isDark?DARK:LIGHT;}

const ICFG={
  empty:{i:'',s:.60,g:null},wood:{i:'🌲',s:.62,g:null},stone:{i:'🪨',s:.62,g:null},iron:{i:'⚙️',s:.60,g:'#66aaff'},
  crystal:{i:'💎',s:.60,g:'#aa88ff'},gold:{i:'🪙',s:.62,g:'#ffdd00'},coal:{i:'🪵',s:.60,g:'#886644'},
  herbs:{i:'🌿',s:.62,g:'#44ff88'},mushroom:{i:'🍄',s:.62,g:'#ff8844'},water:{i:'',s:.55,g:null},
  fish:{i:'🐠',s:.72,g:'#00ddff'},coral:{i:'🪸',s:.62,g:'#ff6688'},pearl:{i:'🫧',s:.58,g:'#aaddff'},
  crab:{i:'🦀',s:.64,g:'#ff5522'},octopus:{i:'🐙',s:.64,g:'#cc44ff'},portal:{i:'🌀',s:.60,g:'#bb44ff'},
  mine:{i:'💣',s:.58,g:'#ff3355'},waterMine:{i:'💣',s:.58,g:'#ff3355'},medkit:{i:'🩺',s:.58,g:'#ff4466'},
  bomb:{i:'💥',s:.62,g:'#ff8800'},map:{i:'🗺️',s:.58,g:'#44ffff'},potion:{i:'🧪',s:.60,g:'#aa44ff'},
  lantern:{i:'🔦',s:.58,g:'#ffee44'},
};

const NUM_COLORS_DARK=['#00ff88','#44ff55','#aaff44','#ffff33','#ffbb00','#ff7700','#ff2255','#ee00ff','#aaaaff'];
const NUM_COLORS_LIGT=['#00cc77','#3ac94d','#8ecc39','#d4c92a','#ffa500','#ff6200','#e6194b','#c71585','#7a7aff'];
const RES_ICONS={wood:'🌲',stone:'🪨',iron:'⚙️',crystal:'💎',fish:'🐠',gold:'🪙',coal:'🪵',herbs:'🌿',mushroom:'🍄',coral:'🪸',pearl:'🫧',crab:'🦀',octopus:'🐙'};
const COLLECT_TYPES=['wood','stone','iron','crystal','fish','gold','coal','herbs','mushroom','coral','pearl','crab','octopus','portal'];
const SPECIAL_COLLECT=['medkit','bomb','map','potion','lantern'];
const WATER_TYPES=['water','fish','waterMine','coral','pearl','crab','octopus'];
const SPECIAL_REVEAL=[];

// ── BUILD PLANET ──
function buildPlanet(){
  gameAbandoned=false;bombsHit=0;updateQuitBtn();
  const cfg=lvlCfg(level);const R=cfg.radius;
  hexSize=Math.max(22,Math.min(42,Math.floor(210/(R+1))));cells=[];
  hexDisk(R).forEach(({q,r})=>{
    const d=hexDist(q,r);const rng=Math.random();const ef=d/R;
    const wc=cfg.waterRatio*(0.5+ef)+(Math.abs(r)>R*.6?.5:0)+(d===R?.4:0);
    let type='empty';
    if(rng<Math.min(wc,.9))type='water';
    else if(rng<wc+cfg.mineRatio)type='mine';
    else if(rng<wc+cfg.mineRatio+.09)type='wood';
    else if(rng<wc+cfg.mineRatio+.16)type='stone';
    else if(rng<wc+cfg.mineRatio+.21)type='iron';
    else if(rng<wc+cfg.mineRatio+.25)type='coal';
    else if(cfg.goldNeed>0&&rng<wc+cfg.mineRatio+.28)type='gold';
    else if(cfg.crystalNeed>0&&rng<wc+cfg.mineRatio+.31)type='crystal';
    else if(cfg.herbsNeed>0&&rng<wc+cfg.mineRatio+.33)type='herbs';
    else if(cfg.mushroomNeed>0&&rng<wc+cfg.mineRatio+.35)type='mushroom';
    const p=hexToPixel(q,r,hexSize);
    cells.push({q,r,type,revealed:false,flagged:false,adjacent:0,px:p.x,py:p.y,dist:d});
  });
  cells.filter(c=>c.type==='water').forEach(c=>{
    const rw=Math.random();
    if(rw<.30)c.type='fish';
    else if(rw<.42&&cfg.coralNeed>0)c.type='coral';
    else if(rw<.50&&cfg.crabNeed>0)c.type='crab';
    else if(rw<.55&&cfg.pearlNeed>0)c.type='pearl';
    else if(rw<.58&&cfg.octopusNeed>0)c.type='octopus';
  });
  cells.filter(c=>WATER_TYPES.includes(c.type)).forEach(c=>{if(Math.random()<.15)c.type='waterMine';});
  const landNeeds=[
    {key:'wood',need:cfg.woodNeed},{key:'stone',need:cfg.stoneNeed},{key:'iron',need:cfg.ironNeed},{key:'coal',need:cfg.coalNeed},
    ...(cfg.goldNeed>0?[{key:'gold',need:cfg.goldNeed}]:[]),
    ...(cfg.crystalNeed>0?[{key:'crystal',need:cfg.crystalNeed}]:[]),
    ...(cfg.herbsNeed>0?[{key:'herbs',need:cfg.herbsNeed}]:[]),
    ...(cfg.mushroomNeed>0?[{key:'mushroom',need:cfg.mushroomNeed}]:[]),
  ];
  landNeeds.forEach(({key,need})=>{
    if(!need)return;const have=cells.filter(c=>c.type===key).length;
    if(have<need){let pool=cells.filter(c=>c.type==='empty'&&c.dist<R-1);for(let i=have;i<need&&pool.length;i++){const idx=Math.floor(Math.random()*pool.length);pool[idx].type=key;pool.splice(idx,1);}}
  });
  const waterNeeds=[
    {key:'fish',need:cfg.fishNeed},
    ...(cfg.coralNeed>0?[{key:'coral',need:cfg.coralNeed}]:[]),
    ...(cfg.crabNeed>0?[{key:'crab',need:cfg.crabNeed}]:[]),
    ...(cfg.pearlNeed>0?[{key:'pearl',need:cfg.pearlNeed}]:[]),
    ...(cfg.octopusNeed>0?[{key:'octopus',need:cfg.octopusNeed}]:[]),
  ];
  waterNeeds.forEach(({key,need})=>{
    if(!need)return;const have=cells.filter(c=>c.type===key).length;
    if(have<need){
      let pool=cells.filter(c=>WATER_TYPES.includes(c.type)&&c.type!=='waterMine');
      for(let i=have;i<need&&pool.length;i++){const idx=Math.floor(Math.random()*pool.length);pool[idx].type=key;pool.splice(idx,1);}
    }
  });
  // Special items
  const specials=['medkit','bomb','map','potion','lantern'];
  let emptyPool=cells.filter(c=>c.type==='empty'&&c.dist<R-1);
  specials.forEach(s=>{if(emptyPool.length){const idx=Math.floor(Math.random()*emptyPool.length);emptyPool[idx].type=s;emptyPool.splice(idx,1);}});
  // Portal
  const outerRing=cells.filter(c=>c.dist===R&&(c.type==='empty'||c.type==='stone'));
  const portalCell=outerRing[Math.floor(Math.random()*outerRing.length)]||cells.find(c=>c.type==='empty');
  if(portalCell)portalCell.type='portal';
  // Adjacency
  cells.forEach(c=>{c.adjacent=hexNeighbors(c.q,c.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;});
  // Objective
  const cfg2=lvlCfg(level);
  objective={};inventory={};
  if(cfg2.woodNeed)objective.wood=cfg2.woodNeed;if(cfg2.stoneNeed)objective.stone=cfg2.stoneNeed;
  if(cfg2.ironNeed)objective.iron=cfg2.ironNeed;if(cfg2.fishNeed)objective.fish=cfg2.fishNeed;
  if(cfg2.coalNeed)objective.coal=cfg2.coalNeed;if(cfg2.goldNeed)objective.gold=cfg2.goldNeed;
  if(cfg2.crystalNeed)objective.crystal=cfg2.crystalNeed;if(cfg2.herbsNeed)objective.herbs=cfg2.herbsNeed;
  if(cfg2.pearlNeed)objective.pearl=cfg2.pearlNeed;if(cfg2.mushroomNeed)objective.mushroom=cfg2.mushroomNeed;
  if(cfg2.coralNeed)objective.coral=cfg2.coralNeed;if(cfg2.crabNeed)objective.crab=cfg2.crabNeed;
  if(cfg2.octopusNeed)objective.octopus=cfg2.octopusNeed;
  sel=null;camX=0;camY=0;camZ=1;
  updateUI();drawAll();
}

function findCell(q,r){return cells.find(c=>c.q===q&&c.r===r)||null;}

// ── WORLD / SCREEN ──
function worldToScreen(wx,wy){return{x:(wx+camX)*camZ+canvas.width/2,y:(wy+camY)*camZ+canvas.height/2};}
function screenToWorld(sx,sy){return{x:(sx-canvas.width/2)/camZ-camX,y:(sy-canvas.height/2)/camZ-camY};}

// ── DRAW ──
let portalPhase=0;
const GAP=.08;
function lighten(hex,f){let c=parseInt(hex.slice(1),16);let r=Math.min(255,((c>>16)&255)+Math.round(255*f));let g=Math.min(255,((c>>8)&255)+Math.round(255*f));let b=Math.min(255,(c&255)+Math.round(255*f));return`rgb(${r},${g},${b})`;}

function hexPath(sx,sy,sz,gap){
  ctx.beginPath();
  for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;ctx.lineTo(sx+Math.cos(a)*sz*(1-gap),sy+Math.sin(a)*sz*(1-gap));}
  ctx.closePath();
}

function drawAll(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  cells.forEach(c=>{
    const sp=worldToScreen(c.px,c.py);
    const sz=hexSize*camZ;
    if(sp.x<-sz||sp.x>canvas.width+sz||sp.y<-sz||sp.y>canvas.height+sz)return;
    drawHex(c,sp.x,sp.y,sz);
  });
  ctx.restore();
}

function drawHex(c,sx,sy,sz){
  const tc=TC();const isWater=WATER_TYPES.includes(c.type)||c.type==='waterMine';const isSel=c===sel;
  const fillH=isWater?tc.waterHidden:tc.landHidden;
  let borderH;
  if(c.revealed){
    borderH=isSel?(isWater?(isDark?'#00e5ff':'#0066aa'):(isDark?'#00ff88':'#008844')):(isWater?tc.revealedWaterBorder:tc.revealedLandBorder);
  } else {
    borderH=isSel?(isWater?(isDark?'#00e5ff':'#0066aa'):(isDark?'#00ff88':'#008844')):(isWater?tc.waterHiddenBorder:tc.landHiddenBorder);
  }
  if(isWater&&c.revealed){const grad=ctx.createRadialGradient(sx,sy,0,sx,sy,sz);grad.addColorStop(0,lighten(fillH,.30));grad.addColorStop(1,fillH);hexPath(sx,sy,sz,GAP);ctx.fillStyle=grad;ctx.fill();}
  else{const grad=ctx.createRadialGradient(sx,sy-sz*.1,0,sx,sy,sz);grad.addColorStop(0,lighten(fillH,.14));grad.addColorStop(1,fillH);hexPath(sx,sy,sz,GAP);ctx.fillStyle=grad;ctx.fill();}
  if(isWater&&!c.revealed){hexPath(sx,sy,sz,GAP);ctx.fillStyle=`rgba(20,80,200,${.06+.05*Math.sin(portalPhase*1.5+c.q*.8+c.r*.5)})`;ctx.fill();}
  hexPath(sx,sy,sz,GAP);ctx.strokeStyle=borderH;ctx.lineWidth=isSel?3.5:(c.revealed?3.0:1.2);ctx.stroke();
  if(c.revealed&&!isSel){hexPath(sx,sy,sz*1.05,GAP);ctx.strokeStyle=isWater?'rgba(0,160,255,.40)':'rgba(0,255,136,.32)';ctx.lineWidth=5;ctx.stroke();}
  if(isSel){hexPath(sx,sy,sz*1.08,GAP);ctx.strokeStyle=isWater?(isDark?'rgba(0,229,255,.55)':'rgba(0,100,180,.5)'):(isDark?'rgba(0,255,136,.55)':'rgba(0,120,60,.5)');ctx.lineWidth=9;ctx.stroke();}
  if(c.type==='portal'&&c.revealed){
    const p=Math.sin(portalPhase)*.5+.5;const p2=Math.sin(portalPhase*1.7+1)*.5+.5;
    hexPath(sx,sy,sz,GAP);ctx.fillStyle=`rgba(120,20,220,${.18+.22*p})`;ctx.fill();
    hexPath(sx,sy,sz*1.18,GAP);ctx.strokeStyle=`rgba(200,80,255,${.15+.35*p2})`;ctx.lineWidth=6+4*p2;ctx.stroke();
    hexPath(sx,sy,sz,GAP);ctx.strokeStyle=`rgba(220,100,255,${.6+.4*p})`;ctx.lineWidth=3.5;ctx.stroke();
    const grad=ctx.createRadialGradient(sx,sy,0,sx,sy,sz*.5);grad.addColorStop(0,`rgba(200,100,255,${.25*p})`);grad.addColorStop(1,'rgba(100,20,200,0)');
    hexPath(sx,sy,sz,GAP);ctx.fillStyle=grad;ctx.fill();ctx.shadowColor='#cc44ff';ctx.shadowBlur=20+18*p;
  }
  if(!c.revealed&&!isWater){for(let dd=-1;dd<=1;dd++)for(let dr=-1;dr<=1;dr++){if(!dd&&!dr)continue;ctx.beginPath();ctx.arc(sx+dd*sz*.27,sy+dr*sz*.19,1.2,0,Math.PI*2);ctx.fillStyle=isDark?'rgba(0,255,100,.055)':'rgba(0,80,40,.07)';ctx.fill();}}
  if(c.revealed){
    const cfg=ICFG[c.type]||ICFG.empty;
    if(cfg.i){const fs=Math.max(22,sz*cfg.s);ctx.font=`${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';if(cfg.g){ctx.shadowColor=cfg.g;ctx.shadowBlur=18;}ctx.fillText(cfg.i,sx,sy+sz*.02);ctx.shadowBlur=0;}
    if(c.adjacent>0&&c.type!=='mine'&&c.type!=='waterMine'){
      const col=(isDark?NUM_COLORS_DARK:NUM_COLORS_LIGT)[c.adjacent-1]||'#fff';
      const fs=Math.max(22,Math.min(sz*.28,18));ctx.font=`bold ${fs}px "Georgia"`;
      const ns=String(c.adjacent),tw=ctx.measureText(ns).width;const bx=sx+(cfg.i?sz*.3:0),by=sy-(cfg.i?sz*.28:0);
      ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ns,bx,by);ctx.shadowBlur=0;
    }
  }
  if(c.flagged){const fsize=Math.max(13,sz*.52);ctx.font=`${fsize}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#ff3355';ctx.shadowBlur=14;ctx.fillStyle='rgba(255,30,60,.9)';ctx.fillText('🚩',sx,sy);ctx.shadowBlur=0;}
}

function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

// ── INPUT ──
let ptrs={},pinchDist=null,panStart=null,panCam=null,tapPt=null,moved=false;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs[e.pointerId]={x:e.clientX,y:e.clientY};tapPt={x:e.clientX,y:e.clientY};moved=false;if(Object.keys(ptrs).length===1){panStart={x:e.clientX,y:e.clientY};panCam={x:camX,y:camY};}});
canvas.addEventListener('pointermove',e=>{if(!ptrs[e.pointerId])return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};const arr=Object.values(ptrs);if(arr.length===2){const dx=arr[0].x-arr[1].x,dy=arr[0].y-arr[1].y,d=Math.sqrt(dx*dx+dy*dy);if(pinchDist)camZ=Math.max(.25,Math.min(4,camZ*(d/pinchDist)));pinchDist=d;moved=true;}else if(arr.length===1&&panStart){const dx=e.clientX-panStart.x,dy=e.clientY-panStart.y;if(Math.abs(dx)+Math.abs(dy)>8)moved=true;if(moved){camX=panCam.x+dx/camZ;camY=panCam.y+dy/camZ;}}});
canvas.addEventListener('pointerup',e=>{if(!moved&&tapPt){const dx=e.clientX-tapPt.x,dy=e.clientY-tapPt.y;if(Math.abs(dx)+Math.abs(dy)<12)handleTap(e.clientX,e.clientY);}delete ptrs[e.pointerId];if(Object.keys(ptrs).length<2)pinchDist=null;if(!Object.keys(ptrs).length)panStart=null;});
canvas.addEventListener('wheel',e=>{camZ=Math.max(.25,Math.min(4,camZ*(e.deltaY<0?1.12:.89)));e.preventDefault();},{passive:false});

function handleTap(sx,sy){
  if(gameAbandoned)return;
  const w=screenToWorld(sx,sy);const {q,r}=pixelToHex(w.x,w.y,hexSize);
  const c=findCell(q,r);if(!c)return;
  sel=c;updateCellInfo(c);updateActionBtns(c);drawAll();
}
function zoom(f){camZ=Math.max(.25,Math.min(4,camZ*f));}
function resetView(){camX=0;camY=0;camZ=1;}

// ── ACTIONS ──
function doReveal(){
  if(gameAbandoned||!sel||sel.revealed||sel.flagged)return;
  sel.revealed=true;
  const sp=worldToScreen(sel.px,sel.py);
  if(sel.type==='mine'||sel.type==='waterMine'){
    const dmg=Math.max(2,3+Math.floor(level/3));hp-=dmg;shakeT=450;bombsHit++;
    flashFn('#ff1133','.3');spawnBurst(sp.x,sp.y,'#ff3355',20);spawnBurst(sp.x,sp.y,'#ff8800',8);
    toast(`💥 MINE! −${dmg} HP`);updateHpUI();updateMinesUI();if(hp<=0){gameOver();return;}
  } else if(sel.type==='medkit'){spawnBurst(sp.x,sp.y,'#ff4444',8);toast(`🩺 MEDKIT found! Press ⛏ COLLECT to use it`);
  } else if(sel.type==='bomb'){spawnBurst(sp.x,sp.y,'#ff8800',10);toast(`💥 BOMB found! Press ⛏ COLLECT to detonate`);
  } else if(sel.type==='map'){spawnBurst(sp.x,sp.y,'#44ffff',10);toast(`🗺️ MAP found! Press ⛏ COLLECT to reveal terrain`);
  } else if(sel.type==='potion'){spawnBurst(sp.x,sp.y,'#aa44ff',10);toast(`🧪 POTION found! Press ⛏ COLLECT to drink`);
  } else if(sel.type==='lantern'){spawnBurst(sp.x,sp.y,'#ffee44',10);toast(`🔦 LANTERN found! Press ⛏ COLLECT to illuminate`);
  } else if(sel.type==='portal'){spawnBurst(sp.x,sp.y,'#aa44ff',18);toast('🌀 PORTAL FOUND! Collect resources then use COLLECT here');
  } else if(WATER_TYPES.includes(sel.type)){spawnBurst(sp.x,sp.y,'#0088ff',8);if(sel.adjacent===0)floodFill(sel.q,sel.r);
  } else {spawnBurst(sp.x,sp.y,isDark?'#00ff88':'#008844',8);if(sel.adjacent===0)floodFill(sel.q,sel.r);}
  score+=5;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);updateMinesUI();drawAll();
}

function floodFill(q,r){
  const queue=[{q,r}],seen=new Set([`${q},${r}`]);
  while(queue.length){
    const {q:cq,r:cr}=queue.shift();
    hexNeighbors(cq,cr).forEach(({q:nq,r:nr})=>{
      const k=`${nq},${nr}`;if(seen.has(k))return;seen.add(k);
      const nc=findCell(nq,nr);
      if(!nc||nc.revealed||nc.flagged||nc.type==='mine'||nc.type==='waterMine')return;
      nc.revealed=true;if(nc.adjacent===0)queue.push({q:nq,r:nr});
    });
  }
}

function doCollect(){
  if(gameAbandoned||!sel||!sel.revealed)return;
  const isSpecial=SPECIAL_COLLECT.includes(sel.type);
  if(!COLLECT_TYPES.includes(sel.type)&&!isSpecial){toast('⚠ NOTHING TO COLLECT');return;}
  if(sel.type==='medkit'){
    const heal=Math.min(4+Math.floor(level/2),8);hp=Math.min(hp+heal,maxHp);
    const sp=worldToScreen(sel.px,sel.py);spawnBurst(sp.x,sp.y,'#ff4444',12);spawnBurst(sp.x,sp.y,'#ffffff',8);
    toast(`🩺 MEDKIT! +${heal} HP`);updateHpUI();flashFn('#ff0044','.1');
    sel.type='empty';sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
    score+=10*level;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);drawAll();return;
  }
  if(sel.type==='bomb'){
    const sp=worldToScreen(sel.px,sel.py);spawnBurst(sp.x,sp.y,'#ff8800',22);flashFn('#ff8800','.2');
    let revealed=0;
    hexNeighbors(sel.q,sel.r).forEach(({q,r})=>{
      const nc=findCell(q,r);if(nc&&!nc.revealed&&!nc.flagged){nc.revealed=true;revealed++;if(nc.type==='mine'||nc.type==='waterMine'){bombsHit++;const dmg=Math.max(1,Math.floor((3+Math.floor(level/3))/2));hp-=dmg;toast(`💥 BOMB HIT MINE! −${dmg} HP`);updateHpUI();if(hp<=0){sel.type='empty';gameOver();return;}}}
    });
    sel.type='empty';sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
    toast(`💥 BOMB! ${revealed} cells revealed`);shakeT=250;score+=10*level;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);updateMinesUI();drawAll();return;
  }
  if(sel.type==='map'){
    const sp=worldToScreen(sel.px,sel.py);spawnBurst(sp.x,sp.y,'#44ffff',18);flashFn('#44ffff','.1');
    const hidden=cells.filter(c=>!c.revealed&&!c.flagged&&!WATER_TYPES.includes(c.type)&&c.type!=='mine');
    const toReveal=hidden.sort(()=>Math.random()-.5).slice(0,6+level);toReveal.forEach(c=>c.revealed=true);
    sel.type='empty';sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
    toast(`🗺️ MAP! ${toReveal.length} terrain cells revealed`);score+=10*level;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);drawAll();return;
  }
  if(sel.type==='potion'){
    const sp=worldToScreen(sel.px,sel.py);const lucky=Math.random()<.6;
    if(lucky){const heal=Math.min(3+Math.floor(level/2),6);hp=Math.min(hp+heal,maxHp);spawnBurst(sp.x,sp.y,'#aa44ff',14);spawnBurst(sp.x,sp.y,'#44ff88',8);toast(`🧪 LUCKY POTION! +${heal} HP`);flashFn('#aa44ff','.1');}
    else{const dmg=Math.max(1,2+Math.floor(level/4));hp-=dmg;spawnBurst(sp.x,sp.y,'#aa44ff',14);spawnBurst(sp.x,sp.y,'#ff3355',8);toast(`🧪 BAD POTION! −${dmg} HP`);flashFn('#aa44ff','.15');shakeT=200;}
    sel.type='empty';sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
    updateHpUI();if(hp<=0){gameOver();return;}score+=10*level;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);drawAll();return;
  }
  if(sel.type==='lantern'){
    const sp=worldToScreen(sel.px,sel.py);spawnBurst(sp.x,sp.y,'#ffee44',16);flashFn('#ffee44','.08');
    let revealed=0;hexNeighbors(sel.q,sel.r).forEach(({q,r})=>{const nc=findCell(q,r);if(nc&&!nc.revealed&&!nc.flagged){nc.revealed=true;revealed++;}});
    sel.type='empty';sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
    toast(`🔦 LANTERN! ${revealed} cells illuminated safely`);score+=10*level;updateScoreUI();updateCellInfo(sel);updateActionBtns(sel);drawAll();return;
  }
  if(sel.type==='portal'){
    if(!objDone()){toast('⚠ COLLECT ALL RESOURCES FIRST!');return;}
    score+=200*level;updateScoreUI();
    const sp=worldToScreen(sel.px,sel.py);spawnBurst(sp.x,sp.y,'#aa44ff',28);flashFn('#aa44ff','.18');
    setTimeout(()=>showWinScreen(),800);return;
  }
  // Normal resource collect
  inventory[sel.type]=(inventory[sel.type]||0)+1;
  const sp=worldToScreen(sel.px,sel.py);
  const cols={wood:'#44ff44',stone:'#aaaaaa',iron:'#4488ff',crystal:'#aa44ff',fish:'#44ccff',gold:'#ffdd00',coal:'#886644',herbs:'#44ff88',mushroom:'#ff8844',coral:'#ff6688',pearl:'#aaddff',crab:'#ff5522',octopus:'#cc44ff'};
  spawnBurst(sp.x,sp.y,cols[sel.type]||'#ffaa00',14);flashFn(isDark?'#ffaa00':'#bb6600','.07');
  toast(`✓ +1 ${sel.type.toUpperCase()}`);score+=20*level;
  sel.type=WATER_TYPES.includes(sel.type)?'water':'empty';
  sel.adjacent=hexNeighbors(sel.q,sel.r).map(n=>findCell(n.q,n.r)).filter(n=>n&&(n.type==='mine'||n.type==='waterMine')).length;
  updateScoreUI();updateResUI();updateCellInfo(sel);updateActionBtns(sel);drawAll();
}

function doFlag(){
  if(gameAbandoned||!sel||sel.revealed)return;
  sel.flagged=!sel.flagged;toast(sel.flagged?'🚩 FLAGGED':'🚩 REMOVED');
  updateCellInfo(sel);updateActionBtns(sel);updateMinesUI();drawAll();
}

// ── COINS EARNED IN LEVEL (computed at win time) ──
function calcLevelCoins(){
  // Rough estimate: score this level mapped to coins
  return Math.max(10, Math.floor(score / 20) + level * 5);
}
let _lastLevelCoins = 0;

// ── WIN SCREEN WITH AD OFFER ──
function showWinScreen(){
  saveToHistory('✅ WIN LVL '+level);
  stopArcadeTimer();
  _lastLevelCoins = calcLevelCoins();
  const scr = document.getElementById('sc-level');
  document.getElementById('sc-score').textContent = 'SCORE: '+score;
  document.getElementById('sc-next').textContent = 'NEXT: LVL '+(level+1);
  const cfg=lvlCfg(level+1);
  document.getElementById('sc-diff').textContent=`MINES: ${Math.round(cfg.mineRatio*100)}%  GRID: R${cfg.radius}`;
  // Update ad offer texts
  const coinsEl = document.getElementById('win-coins-earned');
  const offerEl = document.getElementById('win-double-offer-text');
  const btnEl   = document.getElementById('win-double-btn');
  if(coinsEl) coinsEl.textContent = T('win_coins_earned') + ' ' + _lastLevelCoins + ' 🪙';
  if(offerEl) offerEl.textContent = T('win_double_offer');
  if(btnEl)   btnEl.textContent   = T('win_double_btn');
  // Show/hide ad button based on USE_ADS
  const adWrap = document.getElementById('win-ad-wrap');
  if(adWrap) adWrap.style.display = USE_ADS ? '' : 'none';
  scr.classList.add('show');
}

function winWatchAdDouble(){
  showRewardedAd(()=>{
    addCoins(_lastLevelCoins); // double = give again
    toast('🪙 COINS DOUBLED! +' + _lastLevelCoins);
    document.getElementById('win-ad-wrap').style.display = 'none';
    spawnBurst(canvas.width/2, canvas.height/2, '#ffaa00', 24);
  });
}

// ── GAME OVER SCREEN WITH AD RETRY OFFER ──
function gameOver(){
  saveToHistory('💀 GAME OVER');
  stopArcadeTimer();
  cells.forEach(c=>{c.revealed=true;c.flagged=false;});
  sel=null;gameAbandoned=true;
  updateQuitBtn();updateActionBtns(null);drawAll();
  // Update go screen
  document.getElementById('go-score').textContent='SCORE: '+score;
  const retryOfferEl = document.getElementById('go-retry-offer-text');
  const retryBtnEl   = document.getElementById('go-retry-btn');
  if(retryOfferEl) retryOfferEl.textContent = T('go_retry_offer');
  if(retryBtnEl)   retryBtnEl.textContent   = T('go_retry_btn');
  const adWrap = document.getElementById('go-ad-wrap');
  if(adWrap) adWrap.style.display = USE_ADS ? '' : 'none';
  document.getElementById('sc-over').classList.add('show');
}

function goWatchAdRetry(){
  showRewardedAd(()=>{
    // Retry: restore HP and rebuild same level
    document.getElementById('sc-over').classList.remove('show');
    hp = maxHp; gameAbandoned = false;
    updateHpUI(); updateQuitBtn();
    buildPlanet();
    toast('🔄 LEVEL RETRY! Good luck!');
  });
}

function checkWin(){}
function endGameFromWin(){
  saveToHistory('🏁 GAME ENDED @ LVL '+level);
  document.getElementById('sc-level').classList.remove('show');
  gameAbandoned=true;updateQuitBtn();updateActionBtns(null);
  toast('🏁 GAME ENDED — score saved to history');
}
function nextLevel(){
  document.getElementById('sc-level').classList.remove('show');
  level++;maxHp=Math.min(maxHp+2,28);hp=maxHp;
  document.getElementById('lv-num').textContent=level;
  updateHpUI();buildPlanet();
  showInterstitialAd(null); // interstitial between levels
}
function restartGame(){
  level=1;score=0;maxHp=12;hp=12;bombsHit=0;
  document.getElementById('lv-num').textContent=level;
  document.getElementById('sc-over').classList.remove('show');
  document.getElementById('sc-level').classList.remove('show');
  buildPlanet();
}
function backToStart(){
  document.getElementById('sc-over').classList.remove('show');
  document.getElementById('sc-level').classList.remove('show');
  document.getElementById('start-screen').classList.remove('hidden');
  document.getElementById('topbar').style.display='none';
  document.getElementById('left-panel').style.display='none';
  document.getElementById('right-panel').style.display='none';
  document.getElementById('bottombar').style.display='none';
  document.getElementById('gc').style.display='none';
  document.getElementById('pc').style.display='none';
}

// ── UI LABELS ──
const REVEALED_LABEL={
  empty:'EMPTY FIELD',mine:'💣 MINE',wood:'🌲 FOREST',stone:'🪨 ROCK',iron:'⚙️ IRON',crystal:'💎 CRYSTAL',portal:'🌀 PORTAL',
  fish:'🐠 FISH',medkit:'🩺 MEDKIT',water:'🌊 WATER',waterMine:'💣 MINE',gold:'🪙 GOLD',coal:'🪵 COAL',
  herbs:'🌿 HERBS',mushroom:'🍄 MUSHROOM',coral:'🪸 CORAL',pearl:'🫧 PEARL',crab:'🦀 CRAB',octopus:'🐙 OCTOPUS',
  bomb:'💥 BOMB',map:'🗺️ MAP',potion:'🧪 POTION',lantern:'🔦 LANTERN'
};
function updateCellInfo(c){
  const el=document.getElementById('cell-info');
  if(!c){el.textContent='— tap a cell —';return;}
  let t;
  if(!c.revealed){t=WATER_TYPES.includes(c.type)?'UNEXPLORED WATER — press 🔍':'UNEXPLORED TERRAIN — press 🔍';}
  else{
    t=REVEALED_LABEL[c.type]||'?';
    if(c.adjacent>0&&c.type!=='mine'&&c.type!=='waterMine')t+=` [${c.adjacent} nearby mines]`;
    if(c.type==='portal'&&!objDone())t+=' — collect resources first!';
    if(c.type==='portal'&&objDone())t+=' — press ⛏ COLLECT to exit!';
    if(c.type==='bomb')t+=' — press ⛏ COLLECT to detonate neighbors!';
    if(c.type==='map')t+=' — press ⛏ COLLECT to reveal terrain!';
    if(c.type==='potion')t+=' — press ⛏ COLLECT to drink (60% lucky)!';
    if(c.type==='lantern')t+=' — press ⛏ COLLECT to illuminate safely!';
    if(c.type==='medkit')t+=' — press ⛏ COLLECT to restore HP!';
  }
  if(c.flagged)t+=' 🚩';el.textContent=t;
}
function objDone(){return Object.keys(objective).every(k=>(inventory[k]||0)>=(objective[k]||0));}
function updateActionBtns(c){
  if(gameAbandoned){['b-reveal','b-collect','b-flag'].forEach(id=>document.getElementById(id).classList.add('off'));return;}
  document.getElementById('b-reveal').classList.toggle('off',!c||c.revealed||c.flagged);
  document.getElementById('b-collect').classList.toggle('off',!c||!c.revealed||(![...COLLECT_TYPES,...SPECIAL_COLLECT].includes(c.type)));
  document.getElementById('b-flag').classList.toggle('off',!c||c.revealed);
  renderInvBar();
}
function updateHpUI(){document.getElementById('hp-num').textContent=hp;document.getElementById('hp-fill').style.width=(Math.max(0,hp)/maxHp*100)+'%';}
function updateScoreUI(){document.getElementById('score-num').textContent=score;}
function updateMinesUI(){
  const total=cells.filter(c=>c.type==='mine'||c.type==='waterMine').length;
  const flagged=cells.filter(c=>c.flagged).length;
  document.getElementById('mines-val').textContent=total;
  document.getElementById('flags-val').textContent=`🚩 ${flagged}`;
  document.getElementById('bombs-hit-val').textContent=`💥 ${bombsHit}`;
  const safe=cells.filter(c=>!c.revealed&&!WATER_TYPES.includes(c.type)&&c.type!=='mine').length;
  document.getElementById('safe-val').textContent=safe;
}
function updateResUI(){
  document.getElementById('res-list').innerHTML=Object.entries(objective).map(([k,need])=>{
    const have=inventory[k]||0,done=have>=need;const onBoard=cells.filter(c=>c.type===k).length;
    return`<div class="res-row${done?' done':''}"><span>${RES_ICONS[k]||k} ${k}</span>&nbsp;&nbsp;<span class="res-num">${have}/${need} <span>(${onBoard})</span></span></div>`;
  }).join('');
}
function updateUI(){updateHpUI();updateScoreUI();updateMinesUI();updateResUI();updateCellInfo(sel);}

function updateQuitBtn(){
  const btn=document.getElementById('b-quit');const menuBtn=document.getElementById('b-menu');
  if(gameAbandoned){btn.textContent='▶ NEW GAME';btn.classList.remove('red');btn.classList.add('green');if(menuBtn)menuBtn.style.display='';}
  else{btn.textContent='🏳 QUIT';btn.classList.remove('green');btn.classList.add('red');if(menuBtn)menuBtn.style.display='none';}
}
function onQuitOrStart(){
  if(gameAbandoned){level=1;score=0;maxHp=12;hp=12;bombsHit=0;document.getElementById('lv-num').textContent=level;buildPlanet();}
  else{openPopup('popup-quit');}
}
function doAbandon(){
  closePopup('popup-quit');cells.forEach(c=>{c.revealed=true;c.flagged=false;});
  sel=null;gameAbandoned=true;updateQuitBtn();updateActionBtns(null);
  saveToHistory('🏳 GAME QUIT');drawAll();toast('🏳 GAME ABANDONED — all cells revealed');
}

// ── CUSTOM POPUPS ──
function openPopup(id){document.getElementById(id).classList.add('show');}
function closePopup(id){document.getElementById(id).classList.remove('show');}
document.querySelectorAll('.popup-overlay').forEach(el=>{el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('show');});});

// ── TOAST & FLASH ──
let toastT;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.style.opacity='1';clearTimeout(toastT);toastT=setTimeout(()=>el.style.opacity='0',1900);}
function flashFn(col,op){const el=document.getElementById('flash');el.style.background=col;el.style.opacity=op||'.2';setTimeout(()=>el.style.opacity='0',140);}

// ── HISTORY ──
function saveToHistory(result){
  const now=new Date();
  const dateStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  matchHistory.unshift({date:dateStr,player:playerName||'UNKNOWN',avatar:playerAvatar,score,level,result});
  if(matchHistory.length>50)matchHistory.pop();
  try{localStorage.setItem('mineplanet-history',JSON.stringify(matchHistory));}catch(e){}
  renderHistory();renderHistoryOverlay();
}
function renderHistory(){
  const empty=document.getElementById('history-empty');const table=document.getElementById('history-table');const tbody=document.getElementById('history-body');
  if(!matchHistory.length){empty.style.display='block';table.style.display='none';return;}
  empty.style.display='none';table.style.display='table';
  tbody.innerHTML=matchHistory.map((m,i)=>`<tr><td>${i+1}</td><td>${m.date}</td><td class="name-cell">${m.avatar||'🌍'} ${m.player}</td><td class="score-cell">${m.score}</td><td>${m.level}</td><td style="color:var(--red)">${m.result}</td></tr>`).join('');
}
function toggleHistory(){
  historyOpen=!historyOpen;document.getElementById('history-panel').classList.toggle('open',historyOpen);
  const bb=document.getElementById('bottombar');
  if(historyOpen){renderHistory();setTimeout(()=>{bb.style.bottom=document.getElementById('history-panel').offsetHeight+'px';},20);}
  else{bb.style.bottom='0';}
}
function openHistoryOverlay(){renderHistoryOverlay();document.getElementById('history-overlay').classList.remove('hidden');}
function closeHistoryOverlay(){document.getElementById('history-overlay').classList.add('hidden');}
function renderHistoryOverlay(){
  const empty=document.getElementById('history-overlay-empty');const table=document.getElementById('history-overlay-table');const tbody=document.getElementById('history-overlay-body-rows');
  if(!matchHistory.length){empty.style.display='block';table.style.display='none';return;}
  empty.style.display='none';table.style.display='table';
  tbody.innerHTML=matchHistory.map((m,i)=>`<tr><td>${i+1}</td><td>${m.date}</td><td class="name-cell">${m.avatar||'🌍'} ${m.player}</td><td class="score-cell">${m.score}</td><td>${m.level}</td><td style="color:var(--red)">${m.result}</td></tr>`).join('');
}
function doClearHistoryOverlay(){openPopup('popup-clear');}
function clearHistory(){openPopup('popup-clear');}
function doClearHistory(){closePopup('popup-clear');matchHistory=[];try{window.storage&&window.storage.delete('mineplanet-history');}catch(e){}renderHistory();renderHistoryOverlay();}
async function loadHistory(){
  try{
    const v=localStorage.getItem('mineplanet-history');
    if(v)matchHistory=JSON.parse(v);
  }catch(e){}
  renderHistory();
}

// ── KEYBOARD ──
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='r')doReveal();if(k==='c')doCollect();if(k==='f')doFlag();
  if(k==='+'||k==='=')zoom(1.15);if(k==='-')zoom(.87);if(k==='0'||k==='escape')resetView();
  if(k==='arrowleft')camX+=50/camZ;if(k==='arrowright')camX-=50/camZ;
  if(k==='arrowup')camY+=50/camZ;if(k==='arrowdown')camY-=50/camZ;
});

// ── RENDER LOOP ──
let shakeT=0,lastT=0;
function loop(t){
  requestAnimationFrame(loop);const dt=Math.min((t-lastT)/1000,.05);lastT=t;
  portalPhase+=dt*2.2;
  if(shakeT>0){shakeT-=dt*1000;const s=(shakeT/450)*.014;camX+=(Math.random()-.5)*s;camY+=(Math.random()-.5)*s;}
  tickParts(dt);drawAll();
}

// ── START ──
loadHistory();

// ── AVATARS ──
const AVATARS={astroM:{i:'👨‍🚀',l:'Commander'},astroF:{i:'👩‍🚀',l:'Captain'},robot:{i:'🤖',l:'Robot'},alien:{i:'👽',l:'Alien'},dragon:{i:'🐲',l:'Dragon'},devil:{i:'😈',l:'Devil'},angel:{i:'😇',l:'Angel'},wizard:{i:'🧙',l:'Wizard'},ninja:{i:'🥷',l:'Ninja'},cat:{i:'🐱',l:'Cat'}};
let selectedAvatarKey=null;
(()=>{
  const grid=document.getElementById('avatar-grid');
  Object.entries(AVATARS).forEach(([key,av])=>{
    const b=document.createElement('button');b.className='avbtn';b.dataset.key=key;
    b.innerHTML=`<span class="ae">${av.i}</span><span class="al">${av.l}</span>`;
    b.addEventListener('click',()=>{document.querySelectorAll('.avbtn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedAvatarKey=key;});
    grid.appendChild(b);
  });
})();

function showGameUI(){['topbar','left-panel','right-panel','bottombar','gc','pc'].forEach(id=>document.getElementById(id).style.display='');}
function hideGameUI(){['topbar','left-panel','right-panel','bottombar','gc','pc'].forEach(id=>document.getElementById(id).style.display='none');}

document.getElementById('start-play-btn').addEventListener('click',()=>{
  const name=document.getElementById('start-name').value.trim();
  if(!name){toast('✏️ Enter your name!');return;}
  if(!selectedAvatarKey){toast('👆 Choose your avatar!');return;}
  playerName=name;playerAvatar=AVATARS[selectedAvatarKey].i;
  document.getElementById('player-name-hud').textContent=playerName;
  document.getElementById('player-avatar-hud').textContent=playerAvatar;
  document.getElementById('start-screen').classList.add('hidden');
  showGameUI();level=1;score=0;maxHp=12;hp=12;bombsHit=0;
  document.getElementById('lv-num').textContent=level;buildPlanet();
});
document.getElementById('start-hist-btn').addEventListener('click',()=>openHistoryOverlay());
document.getElementById('start-help-btn').addEventListener('click',()=>openPopup('popup-help'));

hideGameUI();
requestAnimationFrame(loop);

// ════════════════════════════════════════════════════════════════════════════
// ── AD SIMULATION (fallback)
// ════════════════════════════════════════════════════════════════════════════
let adCallback = null; let adTimer = null;
const AD_EMOJIS = ['🎮','🏆','⭐','🎯','🚀','💡','🎁','🌟'];

function showAdSimulation(callback, isRewarded) {
  adCallback = callback;
  document.getElementById('ad-content').textContent = AD_EMOJIS[Math.floor(Math.random()*AD_EMOJIS.length)];
  document.getElementById('ad-skip-btn').style.display = 'none';
  document.getElementById('ad-overlay').classList.add('show');
  let t = isRewarded ? 5 : 3;
  document.getElementById('ad-countdown').textContent = 'Skip in ' + t + 's...';
  adTimer = setInterval(() => {
    t--;
    if (t <= 0) {clearInterval(adTimer);document.getElementById('ad-countdown').textContent='';document.getElementById('ad-skip-btn').style.display='block';}
    else document.getElementById('ad-countdown').textContent = 'Skip in ' + t + 's...';
  }, 1000);
}
function adSkip() {
  clearInterval(adTimer);document.getElementById('ad-overlay').classList.remove('show');
  if (adCallback) { adCallback(); adCallback = null; }
}

// ════════════════════════════════════════════════════════════════════════════
// ── DEBUG MODE
// ════════════════════════════════════════════════════════════════════════════
let debugMode = false;
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();debugMode = !debugMode;
    document.getElementById('debug-badge').style.display = debugMode ? 'block' : 'none';
    toast(debugMode ? '⚡ DEBUG ON — infinite resources' : '⚡ DEBUG OFF');
    if (debugMode) {Object.keys(objective).forEach(k => { inventory[k] = (objective[k] || 0) + 99; });coins += 9999; updateCoinsUI();updateResUI();}
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── COINS SYSTEM
// ════════════════════════════════════════════════════════════════════════════
let coins = 0;
const COINS_KEY = 'mineplanet-coins';
async function loadCoins() {
  try{if(window.storage){const r=await window.storage.get(COINS_KEY);if(r&&r.value)coins=parseInt(r.value)||0;}}catch(e){try{const v=localStorage.getItem(COINS_KEY);if(v)coins=parseInt(v)||0;}catch(e2){}}
  updateCoinsUI();
}
function saveCoins(){try{window.storage&&window.storage.set(COINS_KEY,String(coins));}catch(e){}try{localStorage.setItem(COINS_KEY,String(coins));}catch(e){}}
function addCoins(n){coins+=n;saveCoins();updateCoinsUI();}
function updateCoinsUI(){const el=document.getElementById('coins-num');if(el)el.textContent=coins;const el2=document.getElementById('shop-coins-val');if(el2)el2.textContent=coins;}

let _lastCoinScore=0;
const _origUpdateScoreUI=updateScoreUI;
window.updateScoreUI=function(){const delta=score-_lastCoinScore;if(delta===5)addCoins(1);else if(delta>=20)addCoins(Math.ceil(delta/20)*3);_lastCoinScore=score;_origUpdateScoreUI();};

const _origUpdateHpUI=updateHpUI;
window.updateHpUI=function(){if(invincible&&hp<1)hp=1;_origUpdateHpUI();};

// ════════════════════════════════════════════════════════════════════════════
// ── SHOP SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const SHOP_KEY='mineplanet-shop-prices';
const SHOP_DEFAULT_PRICES={map:80,lantern:60,medkit:50,invincible:200,slowtime:120,ai:350};
let shopPrices={...SHOP_DEFAULT_PRICES};
let invincible=false;

async function loadShopPrices(){
  try{if(window.storage){const r=await window.storage.get(SHOP_KEY);if(r&&r.value)shopPrices=JSON.parse(r.value);}}catch(e){try{const v=localStorage.getItem(SHOP_KEY);if(v)shopPrices=JSON.parse(v);}catch(e2){}}
}
function saveShopPrices(){try{window.storage&&window.storage.set(SHOP_KEY,JSON.stringify(shopPrices));}catch(e){}try{localStorage.setItem(SHOP_KEY,JSON.stringify(shopPrices));}catch(e){}}
function openShop(){
  updateCoinsUI();refreshShopPrices();
  const st=document.getElementById('shop-slowtime-item');if(st)st.style.display=arcadeMode?'':'none';
  document.querySelectorAll('.shop-ads-btn').forEach(b=>b.classList.toggle('hidden',!USE_ADS));
  document.getElementById('shop-overlay').classList.add('show');
}
function closeShop(){document.getElementById('shop-overlay').classList.remove('show');}
function refreshShopPrices(){Object.keys(shopPrices).forEach(key=>{const el=document.getElementById('price-'+key);if(el)el.textContent='🪙 '+shopPrices[key];});}
function shopBuy(key){
  const price=shopPrices[key];if(coins<price){toast('🪙 Not enough coins ('+price+' needed)');return;}
  coins-=price;shopPrices[key]=Math.round(shopPrices[key]*1.5);
  saveCoins();saveShopPrices();updateCoinsUI();refreshShopPrices();applyShopItem(key);
}
function shopWatchAd(key){if(!USE_ADS)return;showRewardedAd(()=>applyShopItem(key));}

let shopInventory={map:0,lantern:0,medkit:0,invincible:0,slowtime:0,ai:0};
const INV_KEY='mineplanet-shopinv';
async function loadShopInventory(){
  try{if(window.storage){const r=await window.storage.get(INV_KEY);if(r&&r.value)shopInventory=JSON.parse(r.value);}}catch(e){try{const v=localStorage.getItem(INV_KEY);if(v)shopInventory=JSON.parse(v);}catch(e2){}}
  renderInvBar();
}
function saveShopInventory(){try{window.storage&&window.storage.set(INV_KEY,JSON.stringify(shopInventory));}catch(e){}try{localStorage.setItem(INV_KEY,JSON.stringify(shopInventory));}catch(e){}}

const INV_CFG={
  map:{icon:'🗺️',label:'MAP',cls:'inv-btn-map',needsCell:false},
  lantern:{icon:'🔦',label:'LANTERN',cls:'inv-btn-lantern',needsCell:true},
  medkit:{icon:'🩺',label:'MEDKIT',cls:'inv-btn-medkit',needsCell:false},
  invincible:{icon:'🛡️',label:'INVNC.',cls:'inv-btn-invincible',needsCell:false},
  slowtime:{icon:'⏳',label:'SLOW',cls:'inv-btn-slowtime',needsCell:false},
  ai:{icon:'🤖',label:'AI',cls:'inv-btn-ai',needsCell:false},
};

function stockItem(key){shopInventory[key]=(shopInventory[key]||0)+1;saveShopInventory();renderInvBar();toast(INV_CFG[key].icon+' '+INV_CFG[key].label+' added to inventory! Use it from the action bar.');}

function renderInvBar(){
  const bar=document.getElementById('shop-inv-bar');if(!bar)return;
  const hasAny=Object.values(shopInventory).some(v=>v>0);bar.classList.toggle('empty',!hasAny);
  bar.innerHTML=Object.entries(INV_CFG).map(([key,cfg])=>{
    const qty=shopInventory[key]||0;if(qty===0)return'';
    const needsCellAndMissing=cfg.needsCell&&!sel;const needsArcade=key==='slowtime'&&!arcadeMode;
    const isOff=gameAbandoned||needsCellAndMissing||needsArcade;
    const offCls=isOff?' off':'';const needsCls=cfg.needsCell?' needs-cell':'';
    return`<div class="inv-item"><button class="${cfg.cls}${offCls}${needsCls}" onclick="useInvItem('${key}')" title="${cfg.label}">${cfg.icon} ${cfg.label}</button><div class="inv-badge">${qty}</div></div>`;
  }).join('');
}

function useInvItem(key){
  if(!shopInventory[key]||shopInventory[key]<=0)return;
  if(key==='map'){if(!cells.length){toast('🗺️ Start a game first!');return;}const hidden=cells.filter(c=>!c.revealed&&!c.flagged&&!WATER_TYPES.includes(c.type)&&c.type!=='mine');const toReveal=hidden.sort(()=>Math.random()-.5).slice(0,6+level);toReveal.forEach(c=>c.revealed=true);toast('🗺️ MAP used! '+toReveal.length+' cells revealed');drawAll();updateUI();
  }else if(key==='lantern'){if(!sel){toast('🔦 Select a cell first!');return;}let revealed=0;hexNeighbors(sel.q,sel.r).forEach(({q,r})=>{const nc=findCell(q,r);if(nc&&!nc.revealed&&!nc.flagged){nc.revealed=true;revealed++;}});spawnBurst(canvas.width/2,canvas.height/2,'#ffee44',12);toast('🔦 LANTERN used! '+revealed+' cells lit safely');drawAll();updateUI();
  }else if(key==='medkit'){const heal=Math.min(4+Math.floor(level/2),8);hp=Math.min(hp+heal,maxHp);updateHpUI();spawnBurst(canvas.width/2,canvas.height/2,'#ff4466',12);toast('🩺 MEDKIT used! +'+heal+' HP');
  }else if(key==='invincible'){invincible=true;document.getElementById('invinc-badge').style.display='block';toast('🛡️ INVINCIBILITY active for this match!');
  }else if(key==='slowtime'){if(!arcadeMode){toast('⏳ Only available in Arcade mode!');return;}arcadeTimeLeft=Math.min(arcadeTimeLeft*2,arcadeTotalTime);toast('⏳ TIME DOUBLED!');
  }else if(key==='ai'){startAIResolver();}
  shopInventory[key]--;saveShopInventory();renderInvBar();
}

function applyShopItem(key){closeShop();stockItem(key);}
function shopReset(){
  shopPrices={...SHOP_DEFAULT_PRICES};shopInventory={map:0,lantern:0,medkit:0,invincible:0,slowtime:0,ai:0};coins=50;
  saveShopPrices();saveShopInventory();saveCoins();updateCoinsUI();refreshShopPrices();renderInvBar();
  toast('↺ Shop reset — wallet: 🪙 50, inventory cleared');
}

// ════════════════════════════════════════════════════════════════════════════
// ── ARCADE MODE
// ════════════════════════════════════════════════════════════════════════════
let arcadeMode=false,arcadeTimeLeft=0,arcadeTotalTime=0,arcadeRunning=false;
let arcadeInterval=null;
function toggleArcadeMode(){
  arcadeMode=!arcadeMode;const btn=document.getElementById('arcade-toggle-btn');
  if(btn)btn.textContent='⏱ ARCADE: '+(arcadeMode?'ON':'OFF');
  toast(arcadeMode?'⏱ ARCADE MODE ON':'⏱ ARCADE MODE OFF');
}
function startArcadeTimer(){
  if(!arcadeMode)return;clearInterval(arcadeInterval);
  const cfg=lvlCfg(level);
  const totalRes=(cfg.woodNeed||0)+(cfg.stoneNeed||0)+(cfg.ironNeed||0)+(cfg.fishNeed||0)+(cfg.coalNeed||0)+(cfg.goldNeed||0)+(cfg.crystalNeed||0)+(cfg.herbsNeed||0)+(cfg.mushroomNeed||0)+(cfg.coralNeed||0)+(cfg.pearlNeed||0)+(cfg.crabNeed||0)+(cfg.octopusNeed||0);
  arcadeTotalTime=30*cfg.radius+15*totalRes;arcadeTimeLeft=arcadeTotalTime;arcadeRunning=true;
  document.getElementById('arcade-timer-wrap').style.display='flex';updateArcadeTimerUI();
  arcadeInterval=setInterval(()=>{if(!arcadeRunning||gameAbandoned)return;arcadeTimeLeft--;updateArcadeTimerUI();if(arcadeTimeLeft<=0){clearInterval(arcadeInterval);arcadeRunning=false;toast('⏱ TIME UP!');setTimeout(()=>gameOver(),800);}},1000);
}
function stopArcadeTimer(){clearInterval(arcadeInterval);arcadeRunning=false;document.getElementById('arcade-timer-wrap').style.display='none';}
function updateArcadeTimerUI(){
  const m=Math.floor(arcadeTimeLeft/60),s=arcadeTimeLeft%60;
  document.getElementById('arcade-timer-txt').textContent=m+':'+String(s).padStart(2,'0');
  const pct=Math.max(0,arcadeTimeLeft/arcadeTotalTime*100);const fill=document.getElementById('arcade-timer-fill');
  fill.style.width=pct+'%';fill.style.background=pct>50?'var(--glow)':pct>25?'var(--amber)':'var(--red)';
  document.getElementById('arcade-timer-txt').style.color=pct>25?'var(--glow)':'var(--red)';
}

// Patch buildPlanet for arcade + invincibility reset
const _origBuildPlanet=buildPlanet;
window.buildPlanet=function(){
  invincible=false;document.getElementById('invinc-badge').style.display='none';_lastCoinScore=score;
  _origBuildPlanet();if(arcadeMode)startArcadeTimer();renderInvBar();
};
const _origNextLevel=nextLevel;
window.nextLevel=function(){stopArcadeTimer();_origNextLevel();};
const _origGameOver=gameOver;
window.gameOver=function(){_origGameOver();};
document.getElementById('start-play-btn').addEventListener('click',()=>{stopArcadeTimer();_lastCoinScore=0;setTimeout(renderInvBar,100);},true);

// ════════════════════════════════════════════════════════════════════════════
// ── AI RESOLVER — reveals board step by step WITHOUT collecting resources
// ════════════════════════════════════════════════════════════════════════════
let aiRunning=false;
function startAIResolver(){
  if(aiRunning||gameAbandoned)return;
  aiRunning=true;
  document.getElementById('ai-overlay').classList.add('show');
  stopArcadeTimer();
  setTimeout(runAIStep,300);
}
function runAIStep(){
  if(!aiRunning)return;
  // Only REVEAL cells — do NOT collect resources. AI shows the board, player still collects manually.
  const toReveal=cells.filter(c=>!c.revealed&&!c.flagged&&c.type!=='mine'&&c.type!=='waterMine');
  if(toReveal.length){
    const batch=toReveal.sort(()=>Math.random()-.5).slice(0,4);
    batch.forEach(c=>{
      c.revealed=true;
      score+=5;
    });
    updateScoreUI();drawAll();updateMinesUI();
    setTimeout(runAIStep,100);return;
  }
  // Also reveal mines (for full board view)
  const minesHidden=cells.filter(c=>!c.revealed&&(c.type==='mine'||c.type==='waterMine'));
  if(minesHidden.length){
    minesHidden.forEach(c=>c.revealed=true);
    drawAll();
  }
  // Done — show win screen only if objectives met; otherwise just show the board
  if(objDone()){
    score+=200*level;updateScoreUI();
    spawnBurst(canvas.width/2,canvas.height/2,'#aa44ff',32);flashFn('#aa44ff','.2');
    setTimeout(()=>{
      aiRunning=false;document.getElementById('ai-overlay').classList.remove('show');
      showWinScreen();saveToHistory('🤖 AI WIN LVL '+level);
    },600);
  } else {
    aiRunning=false;document.getElementById('ai-overlay').classList.remove('show');
    toast('🤖 BOARD REVEALED — collect resources to complete the level!');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── INIT
// ════════════════════════════════════════════════════════════════════════════
loadCoins();
loadShopPrices();
loadShopInventory();
