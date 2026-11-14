const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ld=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const pad=n=>String(n).padStart(2,"0"),dk=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const CUR=["$","ETB"],FXK="tj_fx_v1";
let allTrades=ld("tj_trades_v1",[]),allFlows=ld("tj_flows_v1",[]),trades=[],flows=[],set=Object.assign({bal:1000,cur:"$",risk:1,unit:"R",maxT:2,theme:"",lang:"en",snd:true,tg:{v:0,u:"%"}},ld("tj_set_v1",{}));
let lists=Object.assign({pairs:["EURUSD","GBPUSD","USDJPY","XAUUSD","AUDUSD","USDCAD","NZDUSD","USDCHF"],sess:["London","New York","Asia","Outside killzone"]},ld("tj_lists_v1",{}));lists.sess=["Asia","London","New York"];if(!lists.models)lists.models=["Sweep + CHoCH + FVG","Sweep + CHoCH + OB","Rejection candle","Break & Retest","Other"];
let tab="home",rng=0,view=new Date(),sel=dk(new Date()),flt="all",cp,dirty=false;view.setDate(1);
const AK=["bal","cur","risk","maxT","tg"],COL=["#d4f53c","#ffffff","#ffb86b","#7aa7ff","#ff8fa3"];
let AC=ld("tj_acc_v1",null);
if(!AC||!AC.list||!AC.list.length)AC={list:[{id:"a1",name:"Main account",type:"Live",avatar:"",color:COL[0],bal:set.bal,cur:set.cur,risk:set.risk,maxT:set.maxT,tg:set.tg}],active:"a1"};
AC.list.forEach(a=>{if(!CUR.includes(a.cur))a.cur="$"});
allTrades.forEach(t=>{if(!t.acc)t.acc=AC.list[0].id});allFlows.forEach(f=>{if(!f.acc)f.acc=AC.list[0].id});
const accA=()=>AC.list.find(a=>a.id===AC.active)||AC.list[0];
function loadAcc(){const a=accA();AC.active=a.id;AK.forEach(k=>{if(a[k]!==undefined)set[k]=a[k]})}
loadAcc();
function scope(){const a=accA();trades=allTrades.filter(t=>t.acc===a.id);flows=allFlows.filter(f=>f.acc===a.id)}
let CU=null;
const saveAll=()=>{const a=accA();AK.forEach(k=>a[k]=set[k]);sv("tj_trades_v1",allTrades);sv("tj_flows_v1",allFlows);sv("tj_set_v1",{unit:set.unit,theme:set.theme,lang:set.lang,snd:set.snd,sesAl:set.sesAl,newsAl:set.newsAl,newsLead:set.newsLead});sv("tj_acc_v1",AC);markDirty()};
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
const nf=v=>Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmc=(v,c,sg)=>{const s=v<0?"-":(sg&&v>0?"+":"");return c==="ETB"?`${s}${nf(v)} ETB`:`${s}${c}${nf(v)}`};
const money=(v,sg)=>fmc(v,set.cur,sg),fm=(v,c)=>fmc(v,c,false);
const fr=v=>(v>0?"+":"")+(Math.round(v*100)/100)+"R";
const cls=v=>v>0?"pos":v<0?"neg":"";
const r2=v=>Math.round(v*100)/100;
const IC={home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',jr:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',mo:'<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',add:'<path d="M12 5v14M5 12h14"/>'};
if(set.theme)document.documentElement.dataset.theme=set.theme;
function toast(m){m=tx(m);snd("ok");const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),1900)}

/* ---------- image store (IndexedDB) ---------- */
const IDB=new Promise(res=>{try{const r=indexedDB.open("tj_img",1);r.onupgradeneeded=()=>r.result.createObjectStore("i",{keyPath:"id"});r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});
const idb=(mode,fn)=>IDB.then(db=>db?new Promise(r=>{const t=db.transaction("i",mode),q=fn(t.objectStore("i"));t.oncomplete=()=>r(q&&q.result);t.onerror=()=>r(null)}):null);
const idbPut=(id,blob)=>idb("readwrite",s=>s.put({id,blob})),idbDel=id=>idb("readwrite",s=>s.delete(id)),idbGet=id=>idb("readonly",s=>s.get(id)).then(r=>r&&r.blob);
function shrink(file,max=1280){return new Promise(res=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(u);res(b)},"image/jpeg",.78)};im.onerror=()=>res(null);im.src=u})}

/* ---------- FX + lot size ---------- */
const fxc=()=>ld(FXK,null);
async function getRate(force){
  const c=fxc(),now=Date.now();
  if(c&&c.ts&&now-c.ts<36e5&&!force)return c;
  try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),7000);const r=await fetch("https://open.er-api.com/v6/latest/USD",{signal:ctl.signal});clearTimeout(to);const j=await r.json(),rate=j&&j.rates&&j.rates.ETB;if(rate>0){const o={rate,date:dk(new Date()),ts:now};sv(FXK,o);return o}}catch(e){}
  return c?Object.assign({},c,{stale:true}):null;
}
const toUSD=v=>set.cur==="$"?v:(fxc()?v/fxc().rate:null);
function pipInfo(pair,entry){
  const p=String(pair).toUpperCase();
  if(/^XAU/.test(p))return{pip:.1,val:10};
  const base=p.slice(0,3),quote=p.slice(3,6),pip=quote==="JPY"?.01:.0001,q=100000*pip;
  if(quote==="USD")return{pip,val:q};
  if(base==="USD"&&entry>0)return{pip,val:q/entry};
  const U={JPY:1/150,CAD:1/1.38,CHF:1.13,GBP:1.3,EUR:1.08,AUD:.65,NZD:.6};return U[quote]?{pip,val:q*U[quote],approx:true}:{pip,val:null};
}
function lotCalc(pair,e,s,riskAcc,ov){
  if(!(e>0&&s>0&&riskAcc>0)||e===s)return{err:"Enter Entry, Stop loss and Risk amount."};
  const info=pipInfo(pair,e),val=ov>0?ov:info.val,ru=toUSD(riskAcc);
  if(ru==null)return{err:"An ETB → $ rate is needed. Open the app once while online."};
  if(val==null)return{err:"Enter the pip value ($ per 1 lot) for this pair."};
  const pips=Math.abs(e-s)/info.pip,lot=ru/(pips*val);
  return{lot:Math.floor(lot*100)/100,pips,val};
}

/* ---------- data ---------- */
function compute(){
  const ev=[...trades.map(t=>({k:1,d:t.date,id:t.id,t})),...flows.map(f=>({k:0,d:f.date,id:f.id,f}))].sort((a,b)=>a.d.localeCompare(b.d)||a.k-b.k||a.id-b.id);
  let b=+set.bal||0;const pts=[{d:ev.length?ev[0].d:dk(new Date()),b}],pnl={},rk={};
  ev.forEach(e=>{if(e.k===0)b+=e.f.amt;else{rk[e.id]=b*((e.t.risk??set.risk)/100);const p=rk[e.id]*e.t.r;pnl[e.id]=p;b+=p}pts.push({d:e.d,b})});
  return{bal:b,pts,pnl,rk};
}
function byDay(){const m={};trades.forEach(t=>{const o=m[t.date]=m[t.date]||{r:0,p:0,n:0};o.r+=t.r;o.p+=cp.pnl[t.id]||0;o.n++});return m}
function balOf(a){const ev=[...allTrades.filter(t=>t.acc===a.id).map(t=>({k:1,d:t.date,id:t.id,t})),...allFlows.filter(f=>f.acc===a.id).map(f=>({k:0,d:f.date,id:f.id,f}))].sort((x,y)=>x.d.localeCompare(y.d)||x.k-y.k||x.id-y.id);let b=+a.bal||0;ev.forEach(e=>{if(e.k===0)b+=e.f.amt;else b+=b*((e.t.risk??a.risk)/100)*e.t.r});return b}
function countTo(el,to,fmt){
  const from=el._v==null?0:el._v;el._v=to;
  if(reduce||from===to){el.textContent=fmt(to);return}
  const t0=performance.now(),d=700;cancelAnimationFrame(el._r);
  const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)el._r=requestAnimationFrame(step)};
  el._r=requestAnimationFrame(step);
}

/* ---------- UI helpers ---------- */
const svg=(p,c)=>`<svg class="svg ${c||""}" viewBox="0 0 24 24">${p}</svg>`;
function av(a,s){s=s||38;const st=`width:${s}px;height:${s}px;font-size:${Math.round(s*.38)}px`;return a.avatar&&/^data:image\//.test(a.avatar)?`<img class="av" style="${st}" src="${esc(a.avatar)}" alt="">`:`<span class="av" style="${st};background:${esc(a.color||COL[0])}">${esc((a.name||"?").trim().slice(0,2).toUpperCase())}</span>`}
function hdr(){const a=accA();$("#acav").innerHTML=av(a);$("#acn").textContent=a.name;$("#hi").textContent=a.type}
function nav(){
  $("#nav").innerHTML=[["home","Home"],["cal","Calendar"],["add",""],["jr","Journal"],["mo","More"]].map(([k,l])=>k==="add"?`<button class="fab" data-a="add" aria-label="Add trade">${svg(IC.add)}</button>`:`<button data-t="${k}" class="${tab===k?"on":""}" aria-label="${l}">${svg(IC[k])}<span>${l}</span></button>`).join("");
  $$("[data-t]").forEach(b=>b.onclick=()=>goTab(b.dataset.t));$("[data-a]").onclick=()=>openTrade();
}
function goTab(t){
  if(tab==="mo"&&dirty&&t!=="mo"){if(confirm(tx("Save your changes?\nOK = Save · Cancel = Discard")))saveSettings();else dirty=false}
  tab=t;window.scrollTo(0,0);render();enter();
}
const open=h=>{if($("#sh").style.display!=="block")snd("open");$("#sh").innerHTML=h;$("#sh").style.display="block";$("#bk").style.display="block"};
const close=()=>{$("#sh").style.display="none";$("#bk").style.display="none"};
$("#bk").onclick=close;

/* ---------- Home ---------- */
const lotOf=t=>{if(t.lot>0)return(+t.lot).toFixed(2)+" lot";if(!(t.entry>0&&t.sl>0))return"";const c=lotCalc(t.pair,t.entry,t.sl,cp.rk[t.id],0);return c.err||!(c.lot>0)?"":c.lot.toFixed(2)+" lot"};
const row=t=>{const r=t.r,mny=cp.pnl[t.id]||0,main=fr(r),oth=money(mny,1),k=r>0?"w":r<0?"l":"",lt=lotOf(t);
  return`<div class="pr" data-e="${t.id}"><span class="pbd ${t.dir==="buy"?"w":"l"}">${t.dir==="buy"?"B":"S"}</span><div class="pm"><b>${esc(t.pair)}</b>${t.rules?"":'<span class="badge b">rules ✗</span>'}${t.shot?`<a class="lk" href="${esc(t.shot)}" target="_blank" rel="noopener noreferrer">📎</a>`:""}${t.imgs&&t.imgs.length?`<button class="imgbtn" data-v="${t.id}">🖼 ${t.imgs.length}</button>`:""}<div class="ps">${t.dir==="buy"?"Buy":"Sell"}</div>${lt?`<div class="ps lt">${lt}</div>`:""}${t.note?`<div class="ps pn">${esc(t.note)}</div>`:""}</div><div class="pmid ${cls(mny)}">${oth}</div><div class="pv"><b class="pvm ${cls(r)}">${main}</b><span class="tg ${k}">${r>0?"You earn":r<0?"Just a loss":"Break even"}</span></div></div>`};
function bindRows(root){$$(`${root} [data-e]`).forEach(e=>e.onclick=ev=>{const v=ev.target.closest(".imgbtn");if(v){openViewer(+v.dataset.v);return}if(ev.target.closest("a"))return;openTrade(+e.dataset.e)})}
function home(){
  const D=byDay(),now=new Date(),mk=dk(now).slice(0,7);
  countTo($("#bal"),cp.bal,v=>money(v));balAlt();
  const mp=trades.filter(t=>t.date.startsWith(mk)).reduce((a,t)=>a+(cp.pnl[t.id]||0),0),base=cp.bal-mp;
  $("#chg").innerHTML=`<span class="${cls(mp)}">${money(mp,1)} (${base?(mp/base*100).toFixed(2):"0.00"}%)</span> <span class="sub">this month</span>`;
  const mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const vals=[...Array(7)].map((_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const o=D[dk(d)];return{v:o?(set.unit==="R"?o.r:o.p):0,has:!!o,t:dk(d)===dk(now)}});
  const mx=Math.max(...vals.map(x=>Math.abs(x.v)),.0001);
  $("#bars").innerHTML=vals.map((x,i)=>`<div class="c ${x.t?"t":""}"><i class="${!x.has?"z":x.v<0?"n":""}" style="height:${x.has?Math.max(8,Math.abs(x.v)/mx*50):5}px;animation-delay:${i*.05}s"></i><span>${"MTWTFSS"[i]}</span></div>`).join("");
  $$("#rng .chip").forEach(b=>b.classList.toggle("on",+b.dataset.r===rng));
  chart();tgt();
  const td=dk(now),tt=trades.filter(t=>t.date===td),tl=tt.filter(t=>t.r<0).length,stop=tt.length>=set.maxT||tl>=2;
  $("#today").innerHTML=`<div class="row sp"><h2>Today</h2><span class="sub">${tt.length}/${set.maxT} trades · ${tl} loss</span></div><div class="alert ${stop?"":"ok"}" style="margin-top:8px">${stop?"Done for today. Don't take more trades.":tt.length?"You're within your rules. No setup, no trade.":"No trades yet. Don't enter before your checklist."}</div>`;
  const w=trades.filter(t=>t.r>0),l=trades.filter(t=>t.r<0),n=trades.length,wr=n?w.length/n:0,totR=trades.reduce((a,t)=>a+t.r,0);
  const aw=w.length?w.reduce((a,t)=>a+t.r,0)/w.length:0,al=l.length?-l.reduce((a,t)=>a+t.r,0)/l.length:0;
  const ex=n?wr*aw-(1-wr)*al:0,gl=-l.reduce((a,t)=>a+t.r,0),pf=gl?w.reduce((a,t)=>a+t.r,0)/gl:null;
  const rp=n?trades.filter(t=>t.rules).length/n:0,gr=trades.reduce((a,t)=>a*(1+((t.risk??set.risk)/100)*t.r),1)-1;
  let pk=0,dd=0;cp.pts.forEach(p=>{pk=Math.max(pk,p.b);if(pk)dd=Math.max(dd,(pk-p.b)/pk)});
  const ring=(p,c)=>`<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--line)" stroke-width="5"/><circle class="ring" cx="20" cy="20" r="16" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${p*100.5} 100.5" transform="rotate(-90 20 20)"/></svg>`;
  const A="var(--lime)";
  $("#stats").innerHTML=[
   [`${Math.round(wr*100)}%`,"Win rate",ring(wr,A)],[fr(totR),"Total RR",""],
   [n?fr(ex):"-","Expectancy/trade",""],[`<span class="pos">${w.length}</span> / <span class="neg">${l.length}</span>`,"Total win / lose trades",""],
   [`<span class="${cls(gr)}">${gr>0?"+":""}${(gr*100).toFixed(2)}%</span>`,"Account growth",ring(Math.min(1,Math.abs(gr)/.25),gr<0?"var(--neg)":A)],[`${(dd*100).toFixed(1)}%`,"Max drawdown",""],
   [al?(aw/al).toFixed(2):"-","Avg win / loss",""],[`${n}`,"Total Trades",""]
  ].map(([v,l,x])=>`<div class="st"><div><b>${v}</b><span class="sub">${l}</span></div>${x}</div>`).join("");
  const rc=[...trades].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,3);
  $("#rec").innerHTML=`<div class="row sp" style="margin-bottom:4px"><h2>Recent Trades</h2><button class="chip" id="seeall">See all</button></div>`+(rc.length?rc.map(row).join(""):`<div class="empty">No trades yet. Tap +.</div>`);
  $("#seeall").onclick=()=>goTab("jr");bindRows("#rec");
  const grp=k=>{const m={};trades.forEach(t=>{m[t[k]]=(m[t[k]]||0)+t.r});return Object.entries(m).sort((a,b)=>b[1]-a[1])};
  const S=grp("sess"),M=grp("model"),E=grp("emo"),bc=trades.filter(t=>!t.rules).reduce((a,t)=>a+t.r,0);
  $("#ins").innerHTML=n<3?`<div class="empty">Insights appear after 3 trades.</div>`:[
   ["Best session",S[0]?`${esc(S[0][0])} <b class="${cls(S[0][1])}">${fr(S[0][1])}</b>`:"-"],
   ["Best entry model",M[0]?`${esc(M[0][0])} <b class="${cls(M[0][1])}">${fr(M[0][1])}</b>`:"-"],
   ["Costliest emotion",E.length?`${esc(E[E.length-1][0])} <b class="${cls(E[E.length-1][1])}">${fr(E[E.length-1][1])}</b>`:"-"],
   ["R from rule-breaking trades",`<b class="${cls(bc)}">${fr(bc)}</b>`]
  ].map(([a,b])=>`<div class="ins"><span class="sub" style="font-size:12px">${a}</span><span>${b}</span></div>`).join("");
}
function smooth(p){let d=`M${p[0][0]},${p[0][1]}`;for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c,t=.17;d+=`C${b[0]+(c[0]-a[0])*t},${b[1]+(c[1]-a[1])*t} ${c[0]-(e[0]-b[0])*t},${c[1]-(e[1]-b[1])*t} ${c[0]},${c[1]}`}return d}
function chart(){
  const el=$("#chart");let pts=cp.pts;
  if(rng){const c=new Date();c.setDate(c.getDate()-rng);const ck=dk(c),i=pts.findIndex(p=>p.d>=ck);pts=i<0?pts.slice(-1):pts.slice(Math.max(0,i-1))}
  if(pts.length<2){el.innerHTML='<div class="empty">The chart appears once you add a trade or deposit.</div><div id="tip"></div>';return}
  const W=el.clientWidth||320,H=150,pd=10,mn=Math.min(...pts.map(p=>p.b)),mx=Math.max(...pts.map(p=>p.b)),rg=(mx-mn)||1;
  const X=i=>pd+i*(W-2*pd)/(pts.length-1),Y=v=>H-18-(v-mn)/rg*(H-44),P=pts.map((p,i)=>[X(i),Y(p.b)]),ln=smooth(P);
  const up=pts[pts.length-1].b>=pts[0].b,col=up?"var(--lime)":"var(--neg)";
  el.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".5"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
  ${[0,1,2].map(i=>`<line x1="0" x2="${W}" y1="${22+i*(H-44)/2}" y2="${22+i*(H-44)/2}" stroke="var(--line)" stroke-dasharray="2 5"/>`).join("")}
  <path class="chart-area" d="${ln}L${P[P.length-1][0]},${H}L${P[0][0]},${H}Z" fill="url(#g)"/><path class="chart-line" pathLength="1" d="${ln}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>
  <line id="xl" y1="6" y2="${H}" stroke="${col}" stroke-opacity=".5" visibility="hidden"/><circle id="xd" r="5" fill="${col}" stroke="var(--bg)" stroke-width="2.5" cx="${P[P.length-1][0]}" cy="${P[P.length-1][1]}"/></svg><div id="tip"></div>`;
  const tip=$("#tip"),sh=i=>{const x=P[i][0];$("#xd").setAttribute("cx",x);$("#xd").setAttribute("cy",P[i][1]);$("#xl").setAttribute("x1",x);$("#xl").setAttribute("x2",x);$("#xl").setAttribute("visibility","visible");tip.style.display="block";tip.textContent=pts[i].d+"  "+money(pts[i].b);tip.style.left=Math.min(Math.max(x-50,0),W-130)+"px"};
  const mv=e=>{const r=el.getBoundingClientRect();sh(Math.max(0,Math.min(pts.length-1,Math.round((e.clientX-r.left-pd)/((W-2*pd)/(pts.length-1))))))};
  el.onpointermove=mv;el.onpointerdown=mv;el.onpointerleave=()=>{tip.style.display="none"};
}
function tgt(){
  const now=new Date(),y=now.getFullYear(),mo=now.getMonth(),mk=y+"-"+pad(mo+1),dim=new Date(y,mo+1,0).getDate(),dl=dim-now.getDate();
  const mt=trades.filter(t=>t.date.startsWith(mk)),mr=mt.reduce((a,t)=>a+t.r,0),mp=mt.reduce((a,t)=>a+(cp.pnl[t.id]||0),0);
  let sb=+set.bal||0;cp.pts.forEach(p=>{if(p.d<mk+"-01")sb=p.b});
  const tg=set.tg||{v:0,u:"%"},u=tg.u,el=$("#tgt");
  if(!(tg.v>0)){el.innerHTML='<div class="row sp"><div><h2>Monthly target</h2><div class="sub">Set a goal for this month and track your progress here.</div></div><button class="pill l" id="tset">Set target</button></div>';$("#tset").onclick=openTarget;return}
  const cur=u==="%"?(sb?mp/sb*100:0):u==="R"?mr:mp;
  const f=(v,sg)=>u==="%"?(sg&&v>0?"+":"")+v.toFixed(2)+"%":u==="R"?(sg&&v>0?"+":"")+(Math.round(v*100)/100)+"R":money(v,sg);
  const pct=Math.max(0,cur/tg.v*100),exp=now.getDate()/dim*100,left=tg.v-cur;
  const done=pct>=100,ahead=pct>=exp,st=done?["Target reached","ok"]:ahead?["Ahead of pace","ok"]:["Behind pace",""];
  el.innerHTML=`<div class="row sp"><h2>Monthly target</h2></div>
  <div class="row sp" style="margin-top:8px;align-items:flex-end"><div><b style="font-size:22px;font-weight:700" class="${cls(cur)}">${f(cur,1)}</b> <span class="sub">of ${f(tg.v)}</span></div><span class="badge ${st[1]?"":"b"}" style="font-size:11px;padding:3px 10px">${st[0]}</span></div>
  <div class="pb"><i style="width:${Math.min(100,pct)}%"></i></div>
  <div class="row sp sub"><span>${Math.round(pct)}% done</span><span>${dl} day${dl===1?"":"s"} left</span></div>
  ${!done&&dl>0?`<div class="note" style="margin-top:10px">To hit your goal you need ≈ <b>${f(left/dl)}</b> per day from here. Never raise risk to chase a goal — just follow your rules.</div>`:""}`;
  
}

/* ---------- Calendar / Journal ---------- */
function calr(){
  const y=view.getFullYear(),mo=view.getMonth(),D=byDay(),u=set.unit;
  $("#mt").textContent=view.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  $$("[data-u]").forEach(b=>{b.classList.toggle("on",b.dataset.u===u);if(b.dataset.u==="$")b.textContent=set.cur});
  const mk=y+"-"+pad(mo+1),mt=trades.filter(t=>t.date.startsWith(mk)),mr=mt.reduce((a,t)=>a+t.r,0),mp=mt.reduce((a,t)=>a+(cp.pnl[t.id]||0),0);
  $("#msum").innerHTML=`${mt.length} trades · <b class="${cls(mr)}">${fr(mr)}</b> · <b class="${cls(mp)}">${money(mp,1)}</b>`;
  const off=(new Date(y,mo,1).getDay()+6)%7,st=new Date(y,mo,1-off),td=dk(new Date());
  const f=o=>u==="R"?(o.r>0?"+":"")+(Math.round(o.r*10)/10):(o.p>0?"+":o.p<0?"-":"")+Math.abs(Math.round(o.p));
  let h=["M","T","W","T","F","S","S","Wk"].map(x=>`<div class="dh">${x}</div>`).join("");
  for(let w=0;w<6;w++){let ws=0,wn=0,c="";
    for(let d=0;d<7;d++){const dt=new Date(st.getFullYear(),st.getMonth(),st.getDate()+w*7+d),k=dk(dt),o=D[k],inM=dt.getMonth()===mo;
      if(inM&&o){ws+=u==="R"?o.r:o.p;wn+=o.n}
      c+=`<button class="dy ${inM?"":"o"} ${o?(o.r>0?"w":o.r<0?"l":""):""} ${k===sel?"s":""} ${k===td?"td":""}" data-d="${k}"><span class="n">${dt.getDate()}</span>${o?`<span class="v ${cls(o.r)}">${f(o)}</span>`:"<span></span>"}</button>`}
    if(w===5&&new Date(st.getFullYear(),st.getMonth(),st.getDate()+35).getMonth()!==mo)continue;
    h+=c+`<div class="wk ${cls(ws)}">${wn?(u==="R"?fr(ws).replace("R",""):(ws>0?"+":ws<0?"-":"")+Math.abs(Math.round(ws))):"-"}<span class="sub" style="font-size:9px">${wn?wn+"t":""}</span></div>`}
  wkSummary(mt,off,mo,y,u);$("#cg").innerHTML=h;$$(".dy").forEach(b=>b.onclick=()=>{sel=b.dataset.d;const d=new Date(sel+"T00:00");if(d.getMonth()!==view.getMonth())view=new Date(d.getFullYear(),d.getMonth(),1);render();openDay()});
}
function jr(){
  let L=[...trades].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  if(flt==="w")L=L.filter(t=>t.r>0);if(flt==="l")L=L.filter(t=>t.r<0);if(flt==="b")L=L.filter(t=>!t.rules);
  $$("#flt .chip").forEach(b=>b.classList.toggle("on",b.dataset.f===flt));
  const DG=[...new Set(L.map(t=>t.date))];
  $("#jl").innerHTML=L.length?DG.map(d=>{const it=L.filter(t=>t.date===d),r=it.reduce((a,t)=>a+t.r,0),p=it.reduce((a,t)=>a+(cp.pnl[t.id]||0),0);
    return`<div class="dgrp"><div class="row sp dgh"><b>${new Date(d+"T00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"})}</b><span class="sub"><b class="${cls(r)}">${fr(r)}</b> · ${money(p,1)} · ${it.length} ${tx("trades")}</span></div>${it.map(row).join("")}</div>`}).join(""):`<div class="empty">No trades here. Tap +.</div>`;
  bindRows("#jl");
}
function openDay(){
  const L=trades.filter(t=>t.date===sel),o=byDay()[sel];
  open(`<div class="row sp" style="margin-bottom:8px"><div><h1>${new Date(sel+"T00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"})}</h1><div class="sub">${o?`<b class="${cls(o.r)}">${fr(o.r)}</b> · ${money(o.p,1)}`:"No trades"}</div></div><button class="pill l" id="da">+ Trade</button></div>${L.length?L.map(row).join(""):`<div class="empty">No trades on this day.</div>`}`);
  $("#da").onclick=()=>openTrade();bindRows("#sh");
}
let vu=[];
function closeVw(){const v=$("#vw");v.style.display="none";v.innerHTML="";vu.forEach(u=>URL.revokeObjectURL(u));vu=[]}
const imgName=(b,i)=>`trade-${Date.now()}-${i+1}.${/png/.test(b.type)?"png":"jpg"}`;
function saveBlob(b,i){const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=imgName(b,i);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast("Saved ✓")}
function showBlobs(bl,at){
  const v=$("#vw"),cs=!!(navigator.canShare&&window.File&&navigator.canShare({files:[new File([""],"a.jpg",{type:"image/jpeg"})]}));
  vu=bl.map(b=>URL.createObjectURL(b));
  v.innerHTML=`<button class="chip" id="vc">✕ Close</button>`+(bl.length?vu.map((u,i)=>`<figure class="vf"><img src="${u}" alt=""><div class="row" style="justify-content:center;gap:8px"><button class="pill l" data-sv="${i}">⬇ Save</button>${cs?`<button class="pill o" data-sr="${i}">Share</button>`:""}</div></figure>`).join(""):'<div class="empty">Image not found.</div>');
  v.style.display="block";v.scrollTop=0;$("#vc").onclick=closeVw;
  $$("#vw [data-sv]").forEach(b=>b.onclick=()=>saveBlob(bl[+b.dataset.sv],+b.dataset.sv));
  $$("#vw [data-sr]").forEach(b=>b.onclick=()=>{const x=bl[+b.dataset.sr];navigator.share({files:[new File([x],imgName(x,+b.dataset.sr),{type:x.type})]}).catch(()=>{})});
  const fg=$$("#vw figure")[at];fg&&fg.scrollIntoView();
}
async function openViewer(id){const t=allTrades.find(x=>x.id===id);if(!t||!t.imgs)return;const bl=[];for(const k of t.imgs){const b=await idbGet(k);if(b)bl.push(b)}showBlobs(bl,0)}

/* ---------- More ---------- */
function profUI(){const a=accA();$("#prof").innerHTML=`<div class="row sp"><div class="row" style="gap:12px">${av(a,52)}<div><h2 style="font-size:15px">${esc(a.name)}</h2><div class="sub">${esc(a.type)} · ${esc(a.cur)}</div></div></div><button class="chip" id="pe">Edit profile</button></div><button class="pill o" id="pa" style="width:100%;margin-top:12px">Switch / Add account (${AC.list.length})</button>`;$("#pe").onclick=()=>openAcc(a.id);$("#pa").onclick=openAccounts}
function fillSettings(){$("#sb").value=set.bal;$("#sc").value=set.cur;$("#sr").value=set.risk;$("#sm").value=set.maxT;dirty=false;$("#sbar").hidden=true}
function chkDirty(){dirty=parseFloat($("#sb").value)!==+set.bal||parseFloat($("#sr").value)!==+set.risk||parseFloat($("#sm").value)!==+set.maxT;$("#sbar").hidden=!dirty}
function saveSettings(){
  const b=parseFloat($("#sb").value),r=parseFloat($("#sr").value),m=parseFloat($("#sm").value);
  if(!(b>=0)||!(r>0)||!(m>=1)){alert(tx("Please enter valid numbers."));return false}
  set.bal=b;set.risk=r;set.maxT=Math.round(m);saveAll();dirty=false;render();toast("Saved ✓");return true;
}
function more(){
  profUI();fillSettings();
  $$("[data-th]").forEach(b=>{b.classList.toggle("l",(set.theme||"")===b.dataset.th);b.classList.toggle("o",(set.theme||"")!==b.dataset.th)});
  const F=[...flows].sort((a,b)=>b.date.localeCompare(a.date));
  $("#fl").innerHTML=F.length?F.map(f=>`<div class="ins"><span>${f.date} · ${f.amt>0?"Deposit":"Withdraw"}</span><span><b class="${cls(f.amt)}">${money(f.amt,1)}</b> <button class="chip" data-xf="${f.id}">✕</button></span></div>`).join(""):`<div class="empty" style="padding:10px">Nothing yet.</div>`;
  $$("[data-xf]").forEach(b=>b.onclick=()=>{allFlows=allFlows.filter(f=>f.id!==+b.dataset.xf);saveAll();render()});
  calcInit();
}
function calcInit(){
  const P=$("#cp_pair"),keep=P.value;P.innerHTML=lists.pairs.map(p=>`<option>${esc(p)}</option>`).join("");if(lists.pairs.includes(keep))P.value=keep;
  const pv=$("#cp_pv"),pw=$("#cp_pvw"),pp=$("#cp_pips");$("#cp_cur").textContent=set.cur;
  const run=()=>{const o=$("#cp_out"),e=parseFloat($("#cp_entry").value),s=parseFloat($("#cp_sl").value),r=parseFloat($("#cp_risk").value),info=pipInfo(P.value,e),need=!(info.val>0);
    const pips=e>0&&s>0&&e!==s?Math.abs(e-s)/info.pip:null;pp.value=pips!=null?+pips.toFixed(1):"";pw.style.display=need&&e>0?"":"none";
    const ov=need?parseFloat(pv.value):0,c=lotCalc(P.value,e,s,r,ov);
    o.innerHTML=c.err?`<div class="sub">${c.err}</div>`:`<div class="sub">Lot size</div><div class="big">${c.lot.toFixed(2)}</div><div class="sub">SL ${c.pips.toFixed(1)} pips · pip value ≈ $${c.val.toFixed(2)}/lot · risk ${money(r)}</div>`};
  ["#cp_entry","#cp_sl","#cp_risk","#cp_pv"].forEach(i=>$(i).oninput=run);P.onchange=run;
  $("#cp_add").onclick=async()=>{const v=await addItem("pairs");if(v){calcInit();$("#cp_pair").value=v;run()}};
  getRate().then(run);run();
}
async function addItem(kind){const lb={pairs:["New pair","e.g. EURJPY, BTCUSD"],models:["New entry model","e.g. Order block + SMT"]}[kind],n=((await askText(lb[0],lb[1]))||"").trim();if(!n)return null;const v=kind==="pairs"?n.toUpperCase().replace(/[^A-Z0-9]/g,""):n.slice(0,30);if(!v)return null;const L=lists[kind];if(!L.includes(v)){if(kind==="models"&&L.includes("Other"))L.splice(L.indexOf("Other"),0,v);else L.push(v);sv("tj_lists_v1",lists);markDirty()}return v}

/* ---------- Currency conversion ---------- */
async function openConvert(to){
  const a=accA(),from=a.cur,hd=`<div class="row sp" style="margin-bottom:10px"><h1>${esc(from)} → ${esc(to)}</h1><button class="chip" id="cl">Close</button></div>`,bk=()=>{close();render()};
  open(hd+`<div class="empty">Fetching today's exchange rate…</div>`);$("#cl").onclick=bk;
  const fx=await getRate(true);
  if(!fx){open(hd+`<div class="note">No internet connection and no saved rate. Connect to the internet and try again. The rate updates automatically.</div>`);$("#cl").onclick=bk;return}
  const r=fx.rate,k=to==="ETB"?r:1/r,bal=balOf(a);
  open(hd+`<div class="note">1 USD = <b>${r.toFixed(2)} ETB</b><div class="sub">${fx.stale?"Offline: using the last saved rate":"Live bank rate · updated just now"}</div></div>
  <div class="note" style="margin-top:8px">Balance: <b>${fm(bal,from)}</b> → <b class="pos">${fm(bal*k,to)}</b><br>Starting balance: ${fm(a.bal,from)} → ${fm(a.bal*k,to)}</div>
  <div class="row" style="margin-top:12px"><button class="pill l" id="cv_ok" style="flex:1">Convert</button><button class="pill o" id="cv_no" style="flex:1">Cancel</button></div>`);
  $("#cl").onclick=$("#cv_no").onclick=bk;
  $("#cv_ok").onclick=()=>{a.bal=r2((+a.bal||0)*k);allFlows.forEach(f=>{if(f.acc===a.id)f.amt=r2(f.amt*k)});if(a.tg&&a.tg.u==="$")a.tg.v=r2(a.tg.v*k);a.cur=to;loadAcc();saveAll();close();render();toast(`Converted to ${to} ✓`)};
}

/* ---------- Accounts ---------- */
function openAccounts(){
  open(`<div class="row sp" style="margin-bottom:6px"><h1>Accounts</h1><button class="chip" id="cl">Close</button></div>${AC.list.map(a=>`<div class="tr" data-s="${a.id}"><div class="row" style="gap:12px">${av(a,42)}<div><b>${esc(a.name)}</b>${a.id===AC.active?'<span class="badge">active</span>':""}<div class="sub">${esc(a.type)}</div></div></div><div style="text-align:right"><b>${fm(balOf(a),a.cur)}</b></div></div>`).join("")}<button class="pill l" id="addacc" style="width:100%;margin-top:14px">+ Add account</button>`);
  $("#cl").onclick=close;$("#addacc").onclick=()=>openAcc();
  $$("#sh [data-s]").forEach(r=>r.onclick=()=>{AC.active=r.dataset.s;loadAcc();saveAll();close();render()});
}
function openAcc(id){
  const a=id?AC.list.find(x=>x.id===id):null,isNew=!a;let pend=a?a.avatar||"":"",col=a?a.color:COL[AC.list.length%COL.length];
  const sl=(n,arr,v)=>`<select name="${n}">${arr.map(x=>`<option ${x===v?"selected":""}>${x}</option>`).join("")}</select>`;
  open(`<div class="row sp" style="margin-bottom:10px"><h1>${isNew?"New account":"Edit profile"}</h1><button class="chip" id="cl">Close</button></div>
  <form id="f4"><div class="full row" style="gap:14px"><span id="pva"></span><div class="row" style="flex-wrap:wrap"><label class="pill o" style="cursor:pointer;flex-direction:row;color:var(--ink);font-size:12px">Photo<input type="file" id="af" accept="image/*" hidden></label><button type="button" class="chip" id="arm">Remove</button></div></div>
  <div class="full row" id="sws">${COL.map(c=>`<button type="button" class="sw ${c===col?"on":""}" data-c="${c}" style="background:${c}" aria-label="color"></button>`).join("")}</div>
  <label class="full">Account name<input name="name" required maxlength="24" value="${esc(a?a.name:"")}" placeholder="e.g. Prop firm 50K"></label>
  <label>Type${sl("type",["Live","Demo","Prop firm"],a?a.type:"Live")}</label>
  ${isNew?`<label>Currency${sl("cur",CUR,"$")}</label>`:`<label>Currency<input value="${esc(a.cur)}" disabled></label>`}
  <label>Starting balance<input name="bal" type="number" step="any" min="0" inputmode="decimal" value="${a?a.bal:1000}" required></label><label>Default risk %<input name="risk" type="number" step="any" inputmode="decimal" value="${a?a.risk:1}"></label>
  <label>Max trades / day<input name="maxT" type="number" inputmode="numeric" value="${a?a.maxT:2}"></label><div></div>
  ${isNew?"":`<div class="note full">To change currency use More → Account settings. Your balance converts at today's rate.</div>`}
  <div class="full row"><button class="pill l" type="submit" style="flex:1">Save</button>${!isNew&&AC.list.length>1?'<button class="pill d" type="button" id="adl">Delete</button>':""}</div></form>`);
  const F=$("#f4"),pv=()=>{$("#pva").innerHTML=av({avatar:pend,color:col,name:F.name.value||"?"},64)};pv();F.name.oninput=pv;
  $$("#sws .sw").forEach(b=>b.onclick=()=>{col=b.dataset.c;$$("#sws .sw").forEach(x=>x.classList.toggle("on",x===b));pv()});
  $("#arm").onclick=()=>{pend="";pv()};
  $("#af").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const z=160,c=document.createElement("canvas");c.width=c.height=z;const m=Math.min(im.width,im.height);c.getContext("2d").drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);pend=c.toDataURL("image/jpeg",.82);pv()};im.src=r.result};r.readAsDataURL(f)};
  $("#cl").onclick=close;
  if(!isNew&&AC.list.length>1)$("#adl").onclick=()=>{if(confirm(tx("Delete this account and all its trades?"))){allTrades.filter(t=>t.acc===id).forEach(t=>(t.imgs||[]).forEach(idbDel));allTrades=allTrades.filter(t=>t.acc!==id);allFlows=allFlows.filter(f=>f.acc!==id);AC.list=AC.list.filter(x=>x.id!==id);AC.active=AC.list[0].id;loadAcc();saveAll();close();render()}};
  F.onsubmit=e=>{e.preventDefault();const n=x=>parseFloat(F[x].value),o={name:F.name.value.trim(),type:F.type.value,bal:n("bal")>=0?n("bal"):0,risk:n("risk")>0?n("risk"):1,maxT:n("maxT")>0?n("maxT"):2,avatar:pend,color:col};
    if(isNew){AC.list.push(Object.assign({id:"a"+Date.now(),tg:{v:0,u:"%"},cur:F.cur.value},o));AC.active=AC.list[AC.list.length-1].id}else Object.assign(a,o);
    loadAcc();saveAll();close();render()};
}

/* ---------- Trade form ---------- */
const opts=(arr,v)=>(arr.includes(v)||!v?arr:[...arr,v]).map(x=>`<option ${x===v?"selected":""}>${esc(x)}</option>`).join("");
function safeUrl(u){u=(u||"").trim();if(!u)return"";if(!/^https?:\/\//i.test(u))u="https://"+u;try{const x=new URL(u);return/^https?:$/.test(x.protocol)?x.href:""}catch(e){return""}}
function openTrade(id){
  const t=id?trades.find(x=>x.id===id):null,o=(k,d)=>t&&t[k]!=null?t[k]:d;
  const sl=(n,arr,v)=>`<select name="${n}">${arr.map(a=>`<option ${a===v?"selected":""}>${a}</option>`).join("")}</select>`;
  let imgs=[...(t&&t.imgs||[])];const orig=[...imgs],fresh={};
  open(`<div class="row sp" style="margin-bottom:10px"><h1>${t?"Edit trade":"New trade"}</h1><button class="chip" id="cl">Close</button></div>
  <form id="f"><label>Date<input type="date" name="date" value="${o("date",sel)}" required></label><label>Direction${sl("dir",["buy","sell"],o("dir","buy"))}</label>
  <label>Pair<div class="sel"><select name="pair">${opts(lists.pairs,o("pair","EURUSD"))}</select><button type="button" class="plus" data-add="pairs" aria-label="Add pair">+</button></div></label>
  <label>Session<div class="sel"><select name="sess">${opts(lists.sess,o("sess","London"))}</select></div></label>
  <label class="full">Entry model<div class="sel"><select name="model">${opts(lists.models,o("model","Sweep + CHoCH + FVG"))}</select><button type="button" class="plus" data-add="models" aria-label="Add entry model">+</button></div></label>
  <label>Entry<input name="entry" type="number" step="any" inputmode="decimal" value="${o("entry","")}"></label><label>Stop loss<input name="sl" type="number" step="any" inputmode="decimal" value="${o("sl","")}"></label>
  <label>Take profit<input name="tp" type="number" step="any" inputmode="decimal" value="${o("tp","")}"></label><label>Exit<input name="exit" type="number" step="any" inputmode="decimal" value="${o("exit","")}"></label>
  <label>Result (R) · auto<input name="r" type="number" step="any" readonly tabindex="-1" placeholder="Auto" value="${o("r","")}"></label><label>Risk %<input name="risk" type="number" step="any" inputmode="decimal" value="${o("risk",set.risk)}"></label>
  <label class="full">Risk amount (${esc(set.cur)})<input name="ramt" type="number" step="any" inputmode="decimal" value="${r2((+o("risk",set.risk)||0)/100*cp.bal)}"></label>
  <div class="note full" id="lot">Fill Entry and SL to see a lot size suggestion.</div>
  <label class="full">Lot size<input name="lot" type="number" step="any" min="0" inputmode="decimal" placeholder="Auto, or type your lot" value="${o("lot","")}"></label>
  <label class="full">Emotion${sl("emo",["Calm","FOMO","Fear","Revenge","Greed"],o("emo","Calm"))}</label>
  <label class="tog full"><input type="checkbox" name="rules" ${t?(t.rules?"checked":""):"checked"}> I followed all my rules</label>
  <label class="full">Note<textarea name="note" rows="2">${esc(o("note",""))}</textarea></label>
  <div class="full"><div class="sub" style="margin-bottom:6px">Screenshots (max 4)</div><div class="row" id="thumbs" style="flex-wrap:wrap"></div><label class="pill o" style="cursor:pointer;flex-direction:row;color:var(--ink);font-size:12px;margin-top:6px;width:max-content">+ Add image<input type="file" id="ti" accept="image/*" multiple hidden></label></div>
  <label class="full">Screenshot link (optional)<input name="shot" type="text" inputmode="url" placeholder="https://www.tradingview.com/x/..." value="${esc(o("shot",""))}"></label>
  <div class="full row"><button class="pill l" type="submit" style="flex:1">Save trade</button>${t?`<button class="pill d" type="button" id="dl">Delete</button>`:""}</div></form>`);
  const F=$("#f");let touched=false;if(t&&t.lot>0)F.lot.dataset.m="1";F.lot.addEventListener("input",()=>{F.lot.dataset.m=F.lot.value===""?"":"1";au()});
  const au=()=>{const e=parseFloat(F.entry.value),s=parseFloat(F.sl.value),x=parseFloat(F.exit.value);
    if(isFinite(e)&&isFinite(s)&&e!==s){F.r.value=isFinite(x)?r2((F.dir.value==="buy"?x-e:e-x)/Math.abs(e-s)):((!t||touched)?"":F.r.value);
      const rk=(parseFloat(F.risk.value)||0)/100*cp.bal,c=lotCalc(F.pair.value,e,s,rk,0),pips=Math.abs(e-s)/pipInfo(F.pair.value,e).pip;
      if(!c.err&&F.lot.dataset.m!=="1"&&(!t||touched))F.lot.value=c.lot.toFixed(2);$("#lot").textContent=c.err?`SL ${pips.toFixed(1)} pips · risk ${money(rk)}`:`SL ${c.pips.toFixed(1)} pips · risk ${money(rk)} · ≈ ${c.lot.toFixed(2)} lot`}else if(!t||touched)F.r.value=""};
  ["entry","sl","exit","dir","pair","risk"].forEach(n=>F[n].addEventListener("input",()=>{if(!/^(pair|risk)$/.test(n))touched=true;au()}));au();getRate().then(au);
  F.risk.addEventListener("input",()=>{const p=parseFloat(F.risk.value);F.ramt.value=isFinite(p)&&cp.bal>0?r2(p/100*cp.bal):""});
  F.ramt.addEventListener("input",()=>{const m=parseFloat(F.ramt.value);F.risk.value=isFinite(m)&&cp.bal>0?+(m/cp.bal*100).toFixed(3):"";au()});
  $$("#f [data-add]").forEach(b=>b.onclick=async()=>{const k=b.dataset.add,v=await addItem(k);if(!v)return;const s=F[k==="pairs"?"pair":"model"];s.innerHTML=opts(lists[k],v);s.value=v;au()});
  const th=async()=>{let h="";const bl=[];for(const k of imgs){const b=fresh[k]||await idbGet(k);if(b)bl.push(b),h+=`<div class="th"><img src="${URL.createObjectURL(b)}" alt=""><button type="button" data-rm="${k}">✕</button></div>`}$("#thumbs").innerHTML=h;$$("#thumbs .th img").forEach((im,i)=>im.onclick=()=>showBlobs(bl,i));$$("#thumbs [data-rm]").forEach(x=>x.onclick=()=>{imgs=imgs.filter(i=>i!==x.dataset.rm);delete fresh[x.dataset.rm];th()})};
  th();
  $("#ti").onchange=async e=>{for(const f of [...e.target.files]){if(imgs.length>=4){toast("Max 4 images");break}const b=await shrink(f);if(b){const k="i"+Date.now()+Math.random().toString(36).slice(2,6);fresh[k]=b;imgs.push(k)}}e.target.value="";th()};
  $("#cl").onclick=close;
  if(t)$("#dl").onclick=()=>{if(confirm(tx("Delete this trade?"))){(t.imgs||[]).forEach(idbDel);allTrades=allTrades.filter(x=>x.id!==id);saveAll();close();render()}};
  F.onsubmit=async ev=>{ev.preventDefault();const v=n=>F[n].value,nm=n=>v(n)===""?null:parseFloat(v(n));
    if(nm("r")===null){alert(tx("Enter Entry, Stop loss and Exit. Result (R) is calculated automatically."));return}
    if(!t&&trades.filter(x=>x.date===v("date")).length>=set.maxT&&!confirm(tx("You've reached the max trades for this day. Add anyway?")))return;
    for(const k of imgs)if(fresh[k])await idbPut(k,fresh[k]);
    for(const k of orig)if(!imgs.includes(k))await idbDel(k);
    const n={id:id||Date.now(),date:v("date"),pair:v("pair"),dir:v("dir"),model:v("model"),sess:v("sess"),entry:nm("entry"),sl:nm("sl"),tp:nm("tp"),exit:nm("exit"),r:nm("r"),risk:nm("risk"),lot:nm("lot"),emo:v("emo"),rules:F.rules.checked,note:v("note").trim(),shot:safeUrl(v("shot")),imgs};
    n.acc=t?t.acc:accA().id;allTrades=id?allTrades.map(x=>x.id===id?n:x):[...allTrades,n];sel=n.date;saveAll();close();render();toast("Trade saved ✓")};
}

/* ---------- Target / Flow ---------- */
function openTarget(){
  const tg=set.tg||{v:0,u:"%"};
  open(`<div class="row sp" style="margin-bottom:10px"><h1>Monthly target</h1><button class="chip" id="cl">Close</button></div>
  <form id="f3"><label>Target<input name="v" type="number" step="any" min="0" inputmode="decimal" value="${tg.v||""}" placeholder="e.g. 5" required></label>
  <label>Unit<select name="u"><option value="%" ${tg.u==="%"?"selected":""}>% of month-start balance</option><option value="R" ${tg.u==="R"?"selected":""}>R (total)</option><option value="$" ${tg.u==="$"?"selected":""}>${esc(set.cur)} profit</option></select></label>
  <div class="note full">Set a realistic goal. A goal that's too big can push you to take risks outside your rules. Keep an R goal in line with your win rate and number of trades.</div>
  <div class="full row"><button class="pill l" type="submit" style="flex:1">Save target</button>${tg.v>0?'<button class="pill d" type="button" id="trm">Remove</button>':""}</div></form>`);
  $("#cl").onclick=close;if(tg.v>0)$("#trm").onclick=()=>{set.tg={v:0,u:"%"};saveAll();close();render()};
  $("#f3").onsubmit=e=>{e.preventDefault();const v=parseFloat(e.target.v.value);if(!(v>0))return;set.tg={v,u:e.target.u.value};saveAll();close();render()};
}
function openFlow(sg){
  open(`<div class="row sp" style="margin-bottom:10px"><h1>${sg>0?"Deposit":"Withdraw"}</h1><button class="chip" id="cl">Close</button></div><form id="f2"><label>Amount (${esc(set.cur)})<input name="a" type="number" step="any" min="0" inputmode="decimal" required></label><label>Date<input type="date" name="d" value="${dk(new Date())}" required></label><button class="pill l full" type="submit">Save</button></form>`);
  $("#cl").onclick=close;$("#f2").onsubmit=e=>{e.preventDefault();const a=parseFloat(e.target.a.value);if(!(a>0))return;allFlows.push({id:Date.now(),acc:accA().id,date:e.target.d.value,amt:sg*a});saveAll();close();render()};
}

/* ---------- wiring ---------- */
function render(){scope();cp=compute();nav();hdr();try{paintAds()}catch(e){}$$("[data-tab]").forEach(m=>m.hidden=m.id!==tab);({home,cal:calr,jr,mo:more})[tab]()}
$$("[data-flow]").forEach(b=>b.onclick=()=>openFlow(+b.dataset.flow));
$$("#rng .chip").forEach(b=>b.onclick=()=>{rng=+b.dataset.r;render()});
$$("#flt .chip").forEach(b=>b.onclick=()=>{flt=b.dataset.f;render()});
$$("[data-u]").forEach(b=>b.onclick=()=>{set.unit=b.dataset.u;saveAll();render()});
$$("[data-th]").forEach(b=>b.onclick=()=>{set.theme=b.dataset.th;if(set.theme)document.documentElement.dataset.theme=set.theme;else delete document.documentElement.dataset.theme;saveAll();render()});
$("#acb").onclick=openAccounts;
$("#qa-add").onclick=()=>openTrade();
$("#qa-tgt").onclick=openTarget;
$("#qa-lot").onclick=()=>{goTab("mo");setTimeout(()=>$("#calc").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"}),80)};
$("#pv").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
$("#nx").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
["#sb","#sr","#sm"].forEach(i=>$(i).addEventListener("input",chkDirty));
$("#ssave").onclick=saveSettings;$("#scan").onclick=()=>{fillSettings()};
$("#sc").onchange=e=>{const to=e.target.value;if(to!==set.cur)openConvert(to)};
addEventListener("resize",()=>{if(tab==="home")chart()});
if("serviceWorker"in navigator&&/^https?:$/.test(location.protocol)){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}


/* ================= v8: language ================= */
const AM={"Save your changes?\nOK = Save · Cancel = Discard": "ለውጦቹን ልቆጥብ?\nOK = Save · Cancel = ተው", "Enter Entry, Stop loss and Risk amount.": "Entry፣ Stop loss እና risk አስገባ።", "An ETB → $ rate is needed. Open the app once while online.": "ETB → $ ምንዛሬ ያስፈልጋል። ኢንተርኔት ላይ ሆነህ አንድ ጊዜ ክፈት ወይም Currency ቀይር።", "Enter the pip value ($ per 1 lot) for this pair.": "ለዚህ pair pip value ($ በ 1 lot) አስገባ።", "Done for today. Don't take more trades.": "ለዛሬ ተጠናቀቀ። ተጨማሪ trade አትግባ።", "You're within your rules. No setup, no trade.": "በህግህ ውስጥ ነህ። Setup ከሌለ አትግባ።", "No trades yet. Don't enter before your checklist.": "ገና trade የለም። Checklist ሳትሞላ አትግባ።", "No trades yet. Tap +.": "ገና trade የለም። + ተጫን።", "Insights appear after 3 trades.": "ቢያንስ 3 trades ሲኖርህ insights ይታያሉ።", "The chart appears once you add a trade or deposit.": "Trade ወይም deposit ሲጨምር ግራፉ ይታያል።", "Set a goal for this month and track your progress here.": "ለዚህ ወር ግብ አስቀምጥ፣ እድገትህን እዚህ ታያለህ።", "No trades here. Tap +.": "እዚህ trade የለም። + ተጫን።", "No trades on this day.": "በዚህ ቀን trade የለም።", "Image not found.": "ምስሉ አልተገኘም።", "Nothing yet.": "ምንም የለም።", "To change currency use More → Account settings. Your balance converts at today's rate.": "Currency ለመቀየር More → Account settings ተጠቀም፣ ባላንስህ በዛሬ ምንዛሬ ይቀየራል።", "Fill Entry and SL to see a lot size suggestion.": "Entry እና SL ሲሞሉ የ lot size ምክር ይታያል።", "I followed all my rules": "ሁሉንም ህግ ተከትያለሁ", "Max 4 images": "ከፍተኛ 4 ምስሎች", "Set a realistic goal. A goal that's too big can push you to take risks outside your rules. Keep an R goal in line with your win rate and number of trades.": "ተግባራዊ ግብ አስቀምጥ። በጣም ትልቅ ግብ ከህግ ውጭ risk እንድትወስድ ሊገፋፋህ ይችላል። የ R ግብ ከ win rate እና trades ብዛትህ ጋር ይመጣጠን።", "Please enter valid numbers.": "ቁጥሮቹን በትክክል አስገባ።", "Delete this account and all its trades?": "ይህን account እና ሁሉንም trades ልሰርዘው?", "You've reached the max trades for this day. Add anyway?": "በዚህ ቀን ከፍተኛው trades ደርሷል። ግን ልጨምር?", "Delete this trade?": "ይህን trade ልሰርዘው?", "Enter Entry, Stop loss and Exit. Result (R) is calculated automatically.": "Result (R) አስገባ ወይም Entry/SL/Exit ሙላ።", "To hit your goal you need ≈": "ግቡን ለመምታት ከዚህ በኋላ በቀን ≈", "per day from here. Never raise risk to chase a goal — just follow your rules.": "በቀን ያስፈልጋል። ግብ ለማሳደድ risk አትጨምር፣ ህግህን ብቻ ተከተል።", "Home": "መነሻ", "Calendar": "ቀን መቁጠሪያ", "Journal": "መዝገብ", "More": "ተጨማሪ", "Account balance": "የአካውንት ቀሪ ሂሳብ", "Deposit": "ገቢ", "Withdraw": "ወጪ", "New": "አዲስ", "Trade": "ትሬድ", "Lot": "ሎት", "Size": "መጠን", "Monthly": "ወርሃዊ", "Target": "ግብ", "Equity curve": "የሂሳብ እድገት", "All": "ሁሉም", "this month": "በዚህ ወር", "Today": "ዛሬ", "Recent Trades": "የቅርብ ጊዜ ትሬዶች", "See all": "ሁሉንም ተመልከት", "Insights": "ግንዛቤዎች", "Monthly target": "ወርሃዊ ግብ", "Set target": "ግብ አስቀምጥ", "Win rate": "የማሸነፍ መጠን", "Total RR": "ጠቅላላ RR", "Account growth": "የአካውንት እድገት", "Max drawdown": "ከፍተኛ drawdown", "Avg win / loss": "አማካይ ድል / ኪሳራ", "Total Trades": "ጠቅላላ ትሬዶች", "Best session": "ምርጥ ሴሽን", "Best entry model": "ምርጥ entry model", "Costliest emotion": "ብዙ ያስከፈለ ስሜት", "R from rule-breaking trades": "ህግ ከጣሱ ትሬዶች የተገኘ R", "Target reached": "ግቡ ተሳክቷል", "Ahead of pace": "ከፍጥነቱ ቀድመሃል", "Behind pace": "ከፍጥነቱ ወደ ኋላ ቀርተሃል", "Weekly summary": "ሳምንታዊ ማጠቃለያ", "Week": "ሳምንት", "trades": "ትሬዶች", "win rate": "ማሸነፍ", "Wins": "ድሎች", "Losses": "ኪሳራዎች", "Rules broken": "ህግ የተጣሰባቸው", "Edit profile": "መገለጫ አርትዕ", "Account settings": "የአካውንት ቅንብር", "Starting balance": "የመነሻ ሂሳብ", "Currency": "ምንዛሬ", "Default risk %": "መደበኛ risk %", "Max trades / day": "ከፍተኛ ትሬድ / ቀን", "Save": "አስቀምጥ", "Cancel": "ተው", "Lot size calculator": "የ Lot size ማስሊያ", "Deposits & withdrawals": "ገቢዎችና ወጪዎች", "Risk amount": "የ risk መጠን", "Settings": "ቅንብሮች", "‹ Back": "‹ ተመለስ", "Back": "ተመለስ", "Appearance": "መልክ", "Dark": "ጨለማ", "Light": "ብርሃን", "Language": "ቋንቋ", "Security": "ደህንነት", "Change passcode": "የይለፍ ቁጥር ቀይር", "Biometric unlock": "በአሻራ ክፈት", "Fingerprint / Face ID": "የጣት አሻራ / Face ID", "Not supported on this device": "ይህ መሣሪያ አይደግፍም", "Sound": "ድምፅ", "App sound": "የ App ድምፅ", "Create passcode": "የይለፍ ቁጥር ፍጠር", "Choose a 6-digit passcode to protect your journal": "መዝገብህን ለመጠበቅ ባለ 6 አሃዝ ቁጥር ምረጥ", "Confirm passcode": "የይለፍ ቁጥሩን አረጋግጥ", "Passcodes don't match": "ቁጥሮቹ አይመሳሰሉም", "Enter passcode": "የይለፍ ቁጥር አስገባ", "Wrong passcode": "የተሳሳተ ቁጥር", "Forgot passcode?": "የይለፍ ቁጥር ረሳሁ?", "Current passcode": "አሁን ያለው ቁጥር", "New passcode": "አዲስ ቁጥር", "Passcode updated ✓": "የይለፍ ቁጥር ተቀይሯል ✓", "Biometric enabled ✓": "የአሻራ መክፈቻ ተከፍቷል ✓", "Biometric setup failed": "የአሻራ ማዋቀር አልተሳካም", "Reset the app? All journal data on this device will be erased.": "App ይጥፋ? በዚህ መሣሪያ ላይ ያለ ሁሉም ዳታ ይሰረዛል።", "New trade": "አዲስ ትሬድ", "Edit trade": "ትሬድ አርትዕ", "Close": "ዝጋ", "Date": "ቀን", "Direction": "አቅጣጫ", "Session": "ሴሽን", "Result (R) · auto": "ውጤት (R) · በራስ-ሰር", "Emotion": "ስሜት", "Note": "ማስታወሻ", "Screenshots (max 4)": "ስክሪንሾቶች (ከፍተኛ 4)", "+ Add image": "+ ምስል ጨምር", "Save trade": "ትሬድ አስቀምጥ", "Delete": "ሰርዝ", "Add": "ጨምር", "New pair": "አዲስ pair", "New entry model": "አዲስ entry model", "Saved ✓": "ተቀምጧል ✓", "Trade saved ✓": "ትሬድ ተቀምጧል ✓", "Convert": "ቀይር", "Change currency": "ምንዛሬ ቀይር", "Fetching today's exchange rate…": "የዛሬውን ምንዛሬ በማምጣት ላይ…", "Live bank rate · updated just now": "ወቅታዊ የባንክ ምንዛሬ · አሁን ተዘምኗል", "Offline: using the last saved rate": "ኢንተርኔት የለም፣ የመጨረሻው ምንዛሬ ጥቅም ላይ ውሏል", "No internet connection and no saved rate. Connect to the internet and try again. The rate updates automatically.": "ኢንተርኔት የለም፣ የተቀመጠ ምንዛሬም የለም። ኢንተርኔት ያገናኙ እና ድጋሚ ይሞክሩ። ምንዛሬው በራሱ ይዘምናል።", "Expectancy & losing streaks": "Expectancy እና ተከታታይ ኪሳራዎች", "Expectancy / trade": "Expectancy / ትሬድ", "Add at least 5 trades to see expected losing streaks.": "ተከታታይ ኪሳራዎችን ለማየት ቢያንስ 5 ትሬዶች ይጨምሩ።", "Typical losing streak (next 100 trades)": "የተለመደ ተከታታይ ኪሳራ (በቀጣይ 100 ትሬድ)", "Plan for (95% sure)": "ማቀድ ያለብህ (95% እርግጠኛ)", "Streak loss at that point": "በዚያ ጊዜ የሚደርስ ኪሳራ", "Longest / current streak": "ረጅሙ / አሁን ያለው ተከታታይ", "Trades to recover at current expectancy": "ለማገገም የሚያስፈልግ ትሬድ", "Negative expectancy: more trades will lose money over time. Review your setups.": "Expectancy አሉታዊ ነው፦ ብዙ ትሬድ በጊዜ ሂደት ገንዘብ ያስከስራል። Setupህን ገምግም።", "Enter the pair, entry, stop loss and the amount you're willing to risk.": "Pair፣ Entry፣ Stop loss እና ልትከስር የምትፈልገውን መጠን አስገባ።"};
AM["Total win / lose trades"]="ጠቅላላ ያሸነፉ / የከሰሩ ትሬዶች";
const tx=k=>(set.lang==="am"&&AM[k])||k;
const ORG=new WeakMap();let obs,obsP=0;
function applyLang(root){
  obs&&obs.disconnect();const am=set.lang==="am",w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){const p=n.parentNode&&n.parentNode.nodeName;if(/^(OPTION|SCRIPT|STYLE|TEXTAREA)$/.test(p))continue;
    const rec=ORG.get(n),src=rec&&n.nodeValue===rec.v?rec.o:n.nodeValue,key=src.trim(),out=am&&key&&AM[key]?src.replace(key,AM[key]):src;
    if(out!==src||rec){n.nodeValue=out;ORG.set(n,{o:src,v:out})}}
  obs&&obs.observe(document.body,{childList:true,subtree:true,characterData:true});
}
obs=new MutationObserver(()=>{if(set.lang==="am"&&!obsP){obsP=1;requestAnimationFrame(()=>{obsP=0;applyLang()})}});
document.documentElement.lang=set.lang==="am"?"am":"en";

/* ================= sound (Web Audio, soft Apple-like) ================= */
let AX,MG;
function ax(){if(!AX){try{AX=new(window.AudioContext||window.webkitAudioContext)();MG=AX.createGain();MG.gain.value=.55;const f=AX.createBiquadFilter();f.type="lowpass";f.frequency.value=4200;const d=AX.createDelay();d.delayTime.value=.085;const fb=AX.createGain();fb.gain.value=.24;MG.connect(f);f.connect(AX.destination);f.connect(d);d.connect(fb);fb.connect(d);d.connect(AX.destination)}catch(e){AX=null}}if(AX&&AX.state==="suspended")AX.resume();return AX}
function tone(f,t0,dur,vol,type){const o=AX.createOscillator(),g=AX.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t0);g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(MG);o.start(t0);o.stop(t0+dur+.05)}
const SND={tap:[[1480,0,.07,.1]],key:[[1120,0,.055,.13]],open:[[660,0,.18,.08],[990,.05,.22,.07]],ok:[[880,0,.2,.1],[1320,.09,.32,.09]],err:[[220,0,.2,.17],[175,.09,.24,.13]],unlock:[[784,0,.22,.09],[1175,.08,.22,.09],[1568,.16,.45,.08]],tab:[[1250,0,.06,.09]]};
function snd(k){if(set.snd===false||!SND[k])return;const a=ax();if(!a)return;const t=a.currentTime;SND[k].forEach(([f,o,d,v])=>tone(f,t+o,d,v))}
document.addEventListener("pointerdown",e=>{const el=e.target.closest&&e.target.closest(".k");if(el&&!el.disabled)snd("key")},true);
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("button,.dy,.tr,.pr");if(el&&!el.disabled&&!el.classList.contains("k"))snd("tap")},true);

/* ================= passcode + biometric ================= */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function hashPin(p,s){try{return hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s+":"+p)))}catch(e){let h=5381;for(const c of s+p)h=(h*33^c.charCodeAt(0))>>>0;return"x"+h}}
const newSalt=()=>hex(crypto.getRandomValues(new Uint8Array(8)).buffer);
const bioOK=!!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext);
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),unb=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
async function bioReg(){try{const c=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:"Trade Journal"},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:"journal",displayName:"Journal"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required"},timeout:60000}});sv("tj_bio",{id:b64(c.rawId)});return true}catch(e){return false}}
async function bioAuth(){const b=ld("tj_bio",null);if(!b||!bioOK)return false;try{await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:"public-key",id:unb(b.id),transports:["internal"]}],userVerification:"required",timeout:60000}});return true}catch(e){return false}}
const FP='<svg class="svg" viewBox="0 0 24 24" style="width:30px;height:30px"><path d="M12 11v3a6 6 0 0 1-1 3M8 13a4 4 0 0 1 8 0c0 2 0 4-1.5 6M5 12a7 7 0 0 1 14 0c0 2.5-.3 4.5-1 6M3 9.5A10 10 0 0 1 12 4a10 10 0 0 1 9 5.5M9 20c1-1.5 1.3-3 1.4-4.5"/></svg>';
function lockHide(){const L=$("#lock");L.classList.remove("on");L.innerHTML=""}
function wipe(){try{localStorage.clear();indexedDB.deleteDatabase("tj_img");indexedDB.deleteDatabase("firebaseLocalStorageDb");caches.keys().then(k=>k.forEach(x=>caches.delete(x)))}catch(e){}setTimeout(()=>location.reload(),300)}
function askPin(o,check){return new Promise(res=>{
  const L=$("#lock");let v="",busy=false;
  L.innerHTML=`<div class="lk-in"><img class="lk-logo" src="icon-192.png" alt=""><div class="lk-name">My Trading Journal</div><h1>${o.title}</h1><div class="sub" id="ls">${o.sub||"&nbsp;"}</div><div class="dots" id="dots">${"<i></i>".repeat(6)}</div><div class="kp">${[1,2,3,4,5,6,7,8,9,"b",0,"x"].map(k=>k==="b"?`<button class="k fn" data-k="b" ${o.bio?"":"disabled"}>${o.bio?FP:""}</button>`:k==="x"?`<button class="k fn" data-k="x" aria-label="Delete">⌫</button>`:`<button class="k" data-k="${k}">${k}</button>`).join("")}</div><div class="row lk-foot">${o.cancel?'<button class="chip" id="lcan">Back</button>':""}${o.forgot?'<button class="chip" id="lfg">Forgot passcode?</button>':""}</div></div>`;
  L.classList.add("on");applyLang(L);
  const D=[...L.querySelectorAll(".dots i")],ls=$("#ls"),s0=ls.innerHTML,draw=()=>D.forEach((d,i)=>d.classList.toggle("f",i<v.length));
  const done=async()=>{busy=true;const r=check?await check(v):true;if(r===true){res(v);return}
    snd("err");ls.textContent=tx(r);ls.classList.add("neg");const dd=$("#dots");dd.classList.remove("sk");void dd.offsetWidth;dd.classList.add("sk");navigator.vibrate&&navigator.vibrate(120);
    setTimeout(()=>{v="";draw();busy=false;const q=$("#dots");q&&q.classList.remove("sk")},450)};
  const tryBio=async()=>{if(await bioAuth())res("__bio")};
  L.querySelectorAll(".k").forEach(b=>b.onclick=()=>{if(busy)return;const k=b.dataset.k;
    if(k==="x")v=v.slice(0,-1);else if(k==="b"){tryBio();return}else if(v.length<6){v+=k;ls.innerHTML=s0;ls.classList.remove("neg");$("#dots").classList.remove("sk")}
    draw();if(v.length===6)setTimeout(done,140)});
  if(o.cancel)$("#lcan").onclick=()=>res(null);
  if(o.forgot)$("#lfg").onclick=()=>{if(confirm(tx("Reset the app? All journal data on this device will be erased.")))wipe()};
  if(o.bio)setTimeout(tryBio,400);
})}
async function setupPin(){for(;;){
  const a=await askPin({title:"Create passcode",sub:"Choose a 6-digit passcode to protect your journal"});
  const b=await askPin({title:"Confirm passcode",cancel:true},v=>v===a||"Passcodes don't match");
  if(b!==null){const s=newSalt();sv("tj_pin",{s,h:await hashPin(b,s)});return}}}
async function unlockFlow(){
  const P=ld("tj_pin",null),bo=bioOK&&!!ld("tj_bio",null);
  await askPin({title:"Enter passcode",bio:bo,forgot:true},async v=>{
    const K=ld("tj_lk",{n:0,u:0}),w=K.u-Date.now();if(w>0)return`Try again in ${Math.ceil(w/1000)}s`;
    if(await hashPin(v,P.s)===P.h){sv("tj_lk",{n:0,u:0});return true}
    K.n++;if(K.n>=5){K.u=Date.now()+30000;K.n=0}sv("tj_lk",K);return"Wrong passcode"});
}
async function changePin(){
  const P=ld("tj_pin",null),c=await askPin({title:"Current passcode",cancel:true},async v=>(await hashPin(v,P.s))===P.h||"Wrong passcode");
  if(c===null){lockHide();return}
  for(;;){const a=await askPin({title:"New passcode",cancel:true});if(a===null){lockHide();return}
    const b=await askPin({title:"Confirm passcode",cancel:true},v=>v===a||"Passcodes don't match");
    if(b!==null){const s=newSalt();sv("tj_pin",{s,h:await hashPin(b,s)});lockHide();toast("Passcode updated ✓");return}}}
let hid=0;
document.addEventListener("visibilitychange",()=>{if(document.hidden){hid=Date.now();return}
  if(hid&&Date.now()-hid>6e5&&ld("tj_pin",null)&&!$("#lock").classList.contains("on")){unlockFlow().then(()=>{lockHide();snd("unlock")})}});
async function boot(){if(!ld("tj_pin",null)){await authGate();await setupPin()}else{await unlockFlow();lockHide();await authGate()}lockHide();snd("unlock");render();enter();applyLang();startSync()}

/* ================= dialogs / settings ================= */
function askText(title,ph){return new Promise(res=>{
  const d=$("#dlg");d.innerHTML=`<div class="dlg-b"><h1>${title}</h1><input id="dt" maxlength="30" placeholder="${esc(ph)}" autocomplete="off"><div class="row"><button class="pill o" id="dn" style="flex:1">Cancel</button><button class="pill l" id="dy" style="flex:1">Add</button></div></div>`;
  d.classList.add("on");applyLang(d);const fin=v=>{d.classList.remove("on");d.innerHTML="";res(v)};
  setTimeout(()=>$("#dt")&&$("#dt").focus(),120);$("#dn").onclick=()=>fin(null);$("#dy").onclick=()=>fin($("#dt").value);
  $("#dt").onkeydown=e=>{if(e.key==="Enter")fin($("#dt").value)};d.onclick=e=>{if(e.target===d)fin(null)}})}
function openSettings(){
  const S=$("#stg"),bo=!!ld("tj_bio",null),th=set.theme||"",am=set.lang==="am",acc=FB_ON?accCard():`<section class="card"><h2 style="margin-bottom:6px">Account</h2><div class="sub">Accounts are not set up yet. Add your Firebase keys in config.js to enable Sign in / Sign out.</div></section>`;
  S.innerHTML=`<div class="stg-in"><div class="row sp" style="margin-bottom:14px"><button class="chip" id="sbk">‹ Back</button><h1>Settings</h1><span style="width:62px"></span></div>
  ${acc}
  <section class="card"><h2 style="margin-bottom:10px">Appearance</h2><div class="row"><button class="pill ${th===""?"l":"o"}" data-th="" style="flex:1">Dark</button><button class="pill ${th==="light"?"l":"o"}" data-th="light" style="flex:1">Light</button></div></section>
  <section class="card"><h2 style="margin-bottom:10px">Language</h2><div class="row"><button class="pill ${am?"o":"l"}" data-lg="en" style="flex:1">English</button><button class="pill ${am?"l":"o"}" data-lg="am" style="flex:1">አማርኛ</button></div></section>
  <section class="card"><h2 style="margin-bottom:4px">Security</h2><button class="srow" id="spin"><span>Change passcode</span><span>›</span></button><label class="srow"><span>Biometric unlock<small class="sub" style="display:block">${bioOK?"Fingerprint / Face ID":"Not supported on this device"}</small></span><input type="checkbox" class="ios" id="sbio" ${bo?"checked":""} ${bioOK?"":"disabled"}></label></section>
  <section class="card"><h2 style="margin-bottom:4px">Sound</h2><label class="srow"><span>App sound</span><input type="checkbox" class="ios" id="ssnd" ${set.snd!==false?"checked":""}></label></section>
  <section class="card"><h2 style="margin-bottom:10px">Notice</h2><div class="warn"><span>⚠</span><span>Photos you attach to trades are stored only on this phone. They are not synced to your account. If you clear the app data or uninstall the app, they will be lost.</span></div></section>
  <section class="card"><h2 style="margin-bottom:6px">Contact</h2><div class="sub" style="margin-bottom:6px">Have feedback or suggestions? Email us:</div><a class="mail" href="mailto:Yt7group@gmail.com">Yt7group@gmail.com</a></section>
  <div class="credit">Created by YT7</div></div>`;
  S.classList.add("on");applyLang(S);
  $("#sbk").onclick=()=>S.classList.remove("on");
  $$("#stg [data-th]").forEach(b=>b.onclick=()=>{set.theme=b.dataset.th;if(set.theme)document.documentElement.dataset.theme=set.theme;else delete document.documentElement.dataset.theme;saveAll();openSettings()});
  $$("#stg [data-lg]").forEach(b=>b.onclick=()=>{set.lang=b.dataset.lg;document.documentElement.lang=set.lang;saveAll();applyLang();render();openSettings()});
  $("#spin").onclick=changePin;
  $("#sbio").onchange=async e=>{if(e.target.checked){if(await bioReg())toast("Biometric enabled ✓");else{e.target.checked=false;toast("Biometric setup failed")}}else localStorage.removeItem("tj_bio")};
  accBind();
  $("#ssnd").onchange=e=>{set.snd=e.target.checked;saveAll();if(set.snd)snd("ok")};
}

/* ================= new views ================= */
function enter(){const m=$("#"+tab);if(!m)return;m.classList.remove("enter");void m.offsetWidth;m.classList.add("enter")}
async function balAlt(){const el=$("#balalt");if(!el)return;const fx=await getRate();if(!fx){el.textContent="";return}
  const o=set.cur==="$"?"ETB":"$",v=set.cur==="$"?cp.bal*fx.rate:cp.bal/fx.rate;
  el.innerHTML=`≈ ${fmc(v,o)} <span class="sub">· 1 USD = ${fx.rate.toFixed(2)} ETB${fx.stale?" · offline":""}</span>`}
const refreshFx=()=>getRate().then(()=>{if(tab==="home"&&!$("#lock").classList.contains("on")&&cp)balAlt()});
addEventListener("online",refreshFx);setInterval(refreshFx,6e5);
function wkSummary(mt,off,mo,y,u){
  const dim=new Date(y,mo+1,0).getDate(),W=[0,1,2,3].map(()=>({n:0,w:0,r:0,p:0}));
  mt.forEach(x=>{const o=W[Math.min(3,Math.floor((+x.date.slice(8)-1)/7))];o.n++;o.r+=x.r;o.p+=cp.pnl[x.id]||0;if(x.r>0)o.w++});
  const mn=new Date(y,mo,1).toLocaleDateString("en-GB",{month:"short"});
  $("#wkc").innerHTML=`<div class="uh">Weekly summary</div>`+W.map((o,i)=>{const a=i*7+1,b=i===3?dim:i*7+7,v=u==="R"?o.r:o.p,k=!o.n?"":v>0?"w":v<0?"l":"";
    return`<div class="pr"><span class="pbd ${k}">W${i+1}</span><div class="pm"><b>${tx("Week")} ${i+1}</b><div class="ps">${a}–${b} ${mn} · ${o.n} ${tx("trades")} · ${o.n?Math.round(o.w/o.n*100):0}% ${tx("win rate")}</div></div><div class="pv"><b class="${o.n?cls(v):""}">${o.n?(u==="R"?fr(o.r):money(o.p,1)):"–"}</b><span class="tg ${k||"l2"}">${!o.n?"No trades":v>0?"Profit":v<0?"Loss":"Break even"}</span></div></div>`}).join("")}
$("#gear").onclick=openSettings;$("#curswap").onclick=()=>openConvert(set.cur==="$"?"ETB":"$");
if("serviceWorker"in navigator&&/^https?:$/.test(location.protocol)){}

/* ================= v10: sessions, news, alerts ================= */
let winT=0;
function closeWin(){clearInterval(winT);$("#win").classList.remove("on")}
function openWin(title,inner){const w=$("#win");clearInterval(winT);w.innerHTML=`<div class="stg-in"><div class="row sp" style="margin-bottom:14px"><button class="chip" id="wbk">‹ Back</button><h1>${title}</h1><span style="width:62px"></span></div>${inner}</div>`;w.classList.add("on");w.scrollTop=0;$("#wbk").onclick=closeWin;applyLang(w)}
const SES=[{n:"Sydney",tz:"Australia/Sydney",o:7,c:16,col:"#7cc4ff"},{n:"Tokyo",tz:"Asia/Tokyo",o:9,c:18,col:"#ff9db5"},{n:"London",tz:"Europe/London",o:8,c:17,col:"#ffd66b"},{n:"New York",tz:"America/New_York",o:8,c:17,col:"#d4f53c"}];
const lp=(d,tz)=>{const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",weekday:"short",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}).formatToParts(d).map(x=>[x.type,x.value]));return{y:+p.year,m:+p.month,d:+p.day,wd:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday),off:Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-Math.floor(d/1e3)*1e3}};
const sIv=(S,now)=>{const o=[],seen={};for(let k=-1;k<=2;k++){const p=lp(new Date(now+k*864e5),S.tz),id=p.y+"-"+p.m+"-"+p.d;if(p.wd===0||p.wd===6||seen[id])continue;seen[id]=1;const mk=h=>{const g=Date.UTC(p.y,p.m-1,p.d,h);return g-lp(new Date(g),S.tz).off};o.push([mk(S.o),mk(S.c)])}return o.sort((a,b)=>a[0]-b[0])};
const hms=ms=>{const x=Math.max(0,Math.floor(ms/1e3));return[Math.floor(x/3600),Math.floor(x%3600/60),x%60].map(v=>String(v).padStart(2,"0")).join(":")};
const tm=ms=>new Date(ms).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
async function askNotif(){try{if(!("Notification"in window)){toast("Notifications are not supported here");return false}if(Notification.permission==="granted")return true;return(await Notification.requestPermission())==="granted"}catch(e){return false}}
function sesDyn(){
  const now=Date.now(),ds=new Date(now);ds.setHours(0,0,0,0);const d0=ds.getTime(),d1=d0+864e5,pc=v=>(v-d0)/864e5*100,IV=SES.map(S=>sIv(S,now));
  const rows=SES.map((S,i)=>{const iv=IV[i],cur=iv.find(([a,b])=>now>=a&&now<b),nx=iv.find(([a])=>a>now),on=!!cur,rg=cur||nx||iv[0];
    return`<div class="pr"><span class="pbd" style="color:${S.col};border-color:${S.col}">${S.n[0]}</span><div class="pm"><b>${S.n}</b><div class="ps">${rg?tm(rg[0])+" – "+tm(rg[1]):"–"} · local</div></div><div class="pv"><b class="${on?"pos":""}" style="font-size:12px">${on?tx("Closes in")+" "+hms(cur[1]-now):nx?tx("Opens in")+" "+hms(nx[0]-now):""}</b><span class="tg ${on?"w":"l2"}">${on?"Open":"Closed"}</span></div></div>`}).join("");
  const seg=(a,b,c)=>{const s=Math.max(a,d0),e=Math.min(b,d1);return e>s?`<i style="left:${pc(s)}%;width:${pc(e)-pc(s)}%;background:${c}"></i>`:""};
  const ov=[];IV[2].forEach(([a,b])=>IV[3].forEach(([c,d])=>{const x=Math.max(a,c),y=Math.min(b,d);if(y>x)ov.push([x,y])}));
  const oc=ov.find(([a,b])=>now>=a&&now<b),on_=ov.find(([a])=>a>now);
  const tl=SES.map((S,i)=>`<div class="tlr"><span>${S.n}</span><div class="trk">${IV[i].map(([a,b])=>seg(a,b,S.col)).join("")}</div></div>`).join("")+`<div class="tlr"><span>Overlap</span><div class="trk">${ov.map(([a,b])=>seg(a,b,"#fff")).join("")}</div></div>`;
  $("#sdyn").innerHTML=`<div class="uh">Sessions</div>${rows}<div class="uh">Today (local time)</div><div class="card tlw">${tl}<div class="tick"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div><div class="nowl" style="left:calc(78px + (100% - 78px - 0px)*${pc(now)/100})"></div></div>
  <div class="card"><b>London × New York overlap</b><div class="sub" style="margin-top:4px">${oc?`<span class="pos">Active now</span> · ends in ${hms(oc[1]-now)} (${tm(oc[0])}–${tm(oc[1])})`:on_?`Starts in ${hms(on_[0]-now)} · ${tm(on_[0])}–${tm(on_[1])}`:"–"}</div><div class="sub" style="margin-top:4px">Highest volatility of the day.</div></div>`;
  $("#sclk").textContent=new Date(now).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function openSessions(){
  openWin("Market sessions",`<div class="card" style="text-align:center"><div class="bal" id="sclk" style="font-size:34px"></div><div class="sub">${Intl.DateTimeFormat().resolvedOptions().timeZone}</div></div><div id="sdyn"></div>
  <div class="card"><label class="srow" style="border:0"><span>Session alerts<small class="sub" style="display:block">5 min before each session and the overlap</small></span><input type="checkbox" class="ios" id="sal" ${set.sesAl?"checked":""}></label><div class="sub" style="font-size:11px;margin-top:6px">Alerts work while the app is open or running in the background. They can't wake a fully closed app.</div></div>`);
  $("#sal").onchange=async e=>{set.sesAl=e.target.checked;saveAll();if(set.sesAl){const ok=await askNotif();toast(ok?"Alerts on ✓":"Alerts on (in-app only)")}};
  sesDyn();winT=setInterval(sesDyn,1000);
}
const NEWS_URLS=["https://nfs.faireconomy.media/ff_calendar_thisweek.json","https://nfs.faireconomy.media/ff_calendar_nextweek.json"];
let newsTry=0;
async function loadNews(force){const c=ld("tj_news",null);if(c&&!force&&Date.now()-c.ts<108e5&&(c.list.some(e=>e.t>Date.now())||Date.now()-c.ts<18e5))return{list:c.list,ts:c.ts};
  const list=[];let ok=false;newsTry=Date.now();
  for(const u of NEWS_URLS){try{const r=await fetch(u);if(!r.ok)continue;const j=await r.json();ok=true;j.forEach(e=>{const t=Date.parse(e.date);if(t)list.push({t,title:e.title,cur:e.country,imp:e.impact,fc:e.forecast||"",pv:e.previous||""})})}catch(e){}}
  if(ok){list.sort((a,b)=>a.t-b.t);sv("tj_news",{ts:Date.now(),list});return{list,ts:Date.now()}}
  return c?{list:c.list,ts:c.ts,stale:true}:null}
let nflt="High";
function newsList(R){
  const el=$("#nlist");if(!el)return;if(!R){el.innerHTML=`<div class="empty">Can't load the calendar. Check your internet connection and tap Refresh.</div>`;return}
  const now=Date.now(),ok=e=>nflt==="All"||(nflt==="High"?e.imp==="High":e.imp==="High"||e.imp==="Medium"),L0=R.list.filter(e=>e.t>now-72e5&&ok(e)).slice(0,80),fb=!L0.length,L=fb?R.list.filter(ok).slice(-40):L0;
  let last="";const col={High:"l",Medium:"m",Low:"l2",Holiday:"l2"};
  el.innerHTML=(fb&&L.length?`<div class="sub" style="text-align:center;margin-bottom:8px">No upcoming events yet. Next week's calendar is usually published over the weekend. Showing last week's events.</div>`:"")+(R.stale?`<div class="sub" style="text-align:center;margin-bottom:6px">Offline: showing saved data</div>`:"")+(L.length?L.map(e=>{const d=new Date(e.t).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}),h=d!==last?`<div class="uh">${d}</div>`:"";last=d;const df=e.t-now;
    return h+`<div class="pr ${df<0?"past":""}"><span class="pbd ${col[e.imp]||"l2"}" style="font-size:10px">${esc(e.cur)}</span><div class="pm"><b style="white-space:normal">${esc(e.title)}</b><div class="ps">${tm(e.t)}${e.fc?" · F "+esc(e.fc):""}${e.pv?" · P "+esc(e.pv):""}</div></div><div class="pv"><b style="font-size:12px">${df<0?"Passed":df<864e5?hms(df):Math.floor(df/864e5)+"d"}</b><span class="tg ${col[e.imp]||"l2"}">${e.imp}</span></div></div>`}).join(""):`<div class="empty">No events for this filter.</div>`)}
async function openNews(){
  openWin("Economic calendar",`<div class="row" style="margin-bottom:10px">${["High","Medium","All"].map(f=>`<button class="pill ${nflt===f?"l":"o"}" data-nf="${f}" style="flex:1">${f==="Medium"?"Medium+":f}</button>`).join("")}<button class="chip" id="nrf">↻</button></div><div id="nlist"><div class="empty">Loading…</div></div>
  <div class="card" style="margin-top:12px"><label class="srow" style="border:0"><span>High-impact news alerts<small class="sub" style="display:block">Red-folder news such as NFP and rate decisions</small></span><input type="checkbox" class="ios" id="nal" ${set.newsAl?"checked":""}></label>
  <div class="row" style="margin-top:8px"><button class="pill ${(set.newsLead||15)===15?"l":"o"}" data-nl="15" style="flex:1">15 min before</button><button class="pill ${set.newsLead===30?"l":"o"}" data-nl="30" style="flex:1">30 min before</button></div>
  <div class="sub" style="font-size:11px;margin-top:8px">Times are in your local time. Alerts work while the app is open or running in the background. They can't wake a fully closed app.</div></div>`);
  let R=null;const go=async f=>{R=await loadNews(f);newsList(R)};
  $$("#win [data-nf]").forEach(b=>b.onclick=()=>{nflt=b.dataset.nf;$$("#win [data-nf]").forEach(x=>x.className="pill "+(x===b?"l":"o"));newsList(R)});
  $$("#win [data-nl]").forEach(b=>b.onclick=()=>{set.newsLead=+b.dataset.nl;saveAll();$$("#win [data-nl]").forEach(x=>x.className="pill "+(x===b?"l":"o"))});
  $("#nrf").onclick=()=>go(true);
  $("#nal").onchange=async e=>{set.newsAl=e.target.checked;saveAll();if(set.newsAl){const ok=await askNotif();toast(ok?"Alerts on ✓":"Alerts on (in-app only)");loadNews().catch(()=>{})}};
  await go(false);winT=setInterval(()=>newsList(R),30000);
}
function notify(title,body,key){const nt=ld("tj_nt",{});if(nt[key])return;nt[key]=Date.now();Object.keys(nt).forEach(k=>{if(Date.now()-nt[k]>1728e5)delete nt[k]});sv("tj_nt",nt);
  snd("ok");if(!document.hidden)toast(title+" · "+body);
  try{if("Notification"in window&&Notification.permission==="granted"){if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,icon:"icon-192.png",tag:key,vibrate:[120,60,120]})).catch(()=>{new Notification(title,{body})});else new Notification(title,{body})}}catch(e){}}
function tickAlerts(){if($("#lock").classList.contains("on"))return;const now=Date.now();
  if(set.sesAl){SES.forEach(S=>sIv(S,now).forEach(([a])=>{const d=a-now;if(d>0&&d<=3e5)notify(S.n+" session","Opens in "+Math.ceil(d/6e4)+" min","s"+S.n+a)}));
    sIv(SES[2],now).forEach(([a,b])=>sIv(SES[3],now).forEach(([c,d])=>{const x=Math.max(a,c);if(Math.min(b,d)>x&&x-now>0&&x-now<=3e5)notify("London × New York overlap","High volatility starts in "+Math.ceil((x-now)/6e4)+" min","o"+x)}))}
  if(set.newsAl){if(Date.now()-newsTry>6e5)loadNews().catch(()=>{});const c=ld("tj_news",null);if(c){const lead=(set.newsLead||15)*6e4;c.list.forEach(e=>{const d=e.t-now;if(e.imp==="High"&&d>0&&d<=lead)notify("⚠ High-impact news",e.cur+" "+e.title+" in "+Math.ceil(d/6e4)+" min","n"+e.t+e.title)})}}}
setInterval(tickAlerts,2e4);
$("#tl-ses").onclick=openSessions;$("#tl-news").onclick=openNews;
Object.assign(AM,{"Trading tools":"የትሬዲንግ መሳሪያዎች","Market sessions":"የገበያ ክፍለ ጊዜዎች","Economic calendar":"የኢኮኖሚ ዜና ቀን መቁጠሪያ","Open / close times and overlap in your local time":"የመክፈቻ/መዝጊያ ሰዓት በራስዎ የሰዓት ዞን","High-impact news alerts":"ከፍተኛ ተጽዕኖ ያላቸው ዜናዎች ማሳወቂያ","Session alerts":"የክፍለ ጊዜ ማሳወቂያ","Sessions":"ክፍለ ጊዜዎች","Today (local time)":"ዛሬ (በአካባቢ ሰዓት)","Open":"ክፍት","Closed":"ዝግ","Opens in":"ይከፈታል በ","Closes in":"ይዘጋል በ","Active now":"አሁን ንቁ","Highest volatility of the day.":"የቀኑ ከፍተኛ እንቅስቃሴ።","Passed":"አልፏል","Risk amount":"የ risk መጠን","Profit":"ትርፍ","Loss":"ኪሳራ","Break even":"እኩል","No trades":"ትሬድ የለም","You earn":"አትርፈሃል","Just a loss":"ትንሽዬ ኪሳራ","⬇ Save":"⬇ አስቀምጥ","✕ Close":"✕ ዝጋ","Share":"አጋራ","Alerts on ✓":"ማሳወቂያ በርቷል ✓","Press back again to exit":"ለመውጣት ድጋሚ ተመለስን ይጫኑ","15 min before":"15 ደቂቃ በፊት","30 min before":"30 ደቂቃ በፊት"});

/* ================= back button + keyboard ================= */
function topLayer(){if($("#lock").classList.contains("on")||$("#auth").classList.contains("on"))return"lock";if($("#dlg").classList.contains("on"))return"dlg";if($("#vw").style.display==="block")return"vw";if($("#win").classList.contains("on"))return"win";if($("#stg").classList.contains("on"))return"stg";if($("#sh").style.display==="block")return"sh";return tab!=="home"?"tab":"home"}
let armed=0;
try{history.replaceState({b:0},"");history.pushState({b:1},"")}catch(e){}
addEventListener("popstate",()=>{const L=topLayer();
  if(L==="home"&&armed){armed=0;history.back();return}
  try{history.pushState({b:1},"")}catch(e){}
  if(L==="lock")return;
  if(L==="dlg"){const d=$("#dn");d&&d.click()}
  else if(L==="vw")closeVw();else if(L==="win")closeWin();else if(L==="stg")$("#stg").classList.remove("on");
  else if(L==="sh"){close()}else if(L==="tab")goTab("home");
  else{armed=1;toast("Press back again to exit");setTimeout(()=>armed=0,2200)}});
if(window.visualViewport){const kb=()=>{const v=visualViewport,k=Math.max(0,Math.round(innerHeight-v.height-v.offsetTop));document.documentElement.style.setProperty("--kb",k+"px")};visualViewport.addEventListener("resize",kb);visualViewport.addEventListener("scroll",kb)}
document.addEventListener("focusin",e=>{const el=e.target;if(el.matches&&el.matches("input:not([type=checkbox]):not([type=file]),textarea,select"))setTimeout(()=>el.scrollIntoView({block:"center",behavior:"smooth"}),320)});
/* ================= v12: accounts (username + password) + cloud sync + biometric ================= */
const FBC=window.TJ_FIREBASE||{},FB_ON=!!(FBC.apiKey||FBC.preview),SYNCK=["tj_trades_v1","tj_flows_v1","tj_set_v1","tj_acc_v1","tj_lists_v1"],EMD="@tjournal.app";
const uname=s=>String(s||"").trim().toLowerCase(),uok=u=>/^[a-z0-9_.]{3,20}$/.test(u);
const wt=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(Object.assign(new Error("timeout"),{code:"auth/network-request-failed"})),ms))]);
const syn=()=>ld("tj_sync",{t:0,dirty:false});
function realCloud(){
  let F=null;
  const init=async()=>{if(F)return F;const B="https://www.gstatic.com/firebasejs/10.14.1/",[a,au,fs]=await wt(Promise.all([import(B+"firebase-app.js"),import(B+"firebase-auth.js"),import(B+"firebase-firestore.js")]),8000);const app=a.initializeApp(FBC);F={au,fs,auth:au.getAuth(app),db:fs.getFirestore(app)};return F};
  const me=u=>u?{uid:u.uid,username:(u.email||"").split("@")[0]}:null;
  return{
    async user(){try{const f=await init();await wt(f.auth.authStateReady(),6000);return me(f.auth.currentUser)}catch(e){return ld("tj_cu",null)}},
    async signUp(u,p){const f=await init(),c=await f.au.createUserWithEmailAndPassword(f.auth,u+EMD,p);return me(c.user)},
    async signIn(u,p){const f=await init(),c=await f.au.signInWithEmailAndPassword(f.auth,u+EMD,p);return me(c.user)},
    async signOut(){const f=await init();await f.au.signOut(f.auth)},
    async touch(id,name){const f=await init(),r=f.fs.doc(f.db,"users",id),s=await f.fs.getDoc(r),d=s.exists()?s.data():{};await f.fs.setDoc(r,{username:name,lastSeen:Date.now(),createdAt:d.createdAt||Date.now()},{merge:true});return d.dataT||0},
    async pull(id){const f=await init(),m=await f.fs.getDoc(f.fs.doc(f.db,"users",id)),t=m.exists()&&m.data().dataT||0;if(!t)return null;const q=await f.fs.getDocs(f.fs.collection(f.db,"users",id,"data")),data={};q.forEach(x=>data[x.id]=x.data().v);return{t,data}},
    async push(id,data,t){const f=await init(),b=f.fs.writeBatch(f.db);Object.entries(data).forEach(([k,v])=>b.set(f.fs.doc(f.db,"users",id,"data",k),{v}));b.set(f.fs.doc(f.db,"users",id),{dataT:t,lastSeen:Date.now()},{merge:true});await b.commit()}
  };
}
function mockCloud(){
  const U=()=>ld("tj_mock_users",{}),er=c=>Object.assign(new Error(c),{code:c}),mk=(u,id)=>{const s={uid:id,username:u};sv("tj_mock_sess",s);return s};
  return{
    async user(){return ld("tj_mock_sess",null)},
    async signUp(u,p){const m=U();if(m[u])throw er("auth/email-already-in-use");m[u]={h:await hashPin(p,u),id:"m"+Date.now()};sv("tj_mock_users",m);return mk(u,m[u].id)},
    async signIn(u,p){const m=U();if(!m[u]||m[u].h!==await hashPin(p,u))throw er("auth/invalid-credential");return mk(u,m[u].id)},
    async signOut(){localStorage.removeItem("tj_mock_sess")},
    async touch(id){const m=ld("tj_mock_cloud_"+id,null);return m?m.t:0},
    async pull(id){return ld("tj_mock_cloud_"+id,null)},
    async push(id,data,t){sv("tj_mock_cloud_"+id,{t,data})}
  };
}
const CLOUD=FB_ON?(FBC.preview?mockCloud():realCloud()):null;
function markDirty(){if(!CU||!CLOUD)return;const s=syn();s.dirty=true;sv("tj_sync",s);clearTimeout(markDirty.t);markDirty.t=setTimeout(pushNow,3000)}
async function pushNow(){if(!CU||!CLOUD)return false;try{const t=Date.now(),d={};SYNCK.forEach(k=>d[k]=localStorage.getItem(k)||"");await CLOUD.push(CU.uid,d,t);sv("tj_sync",{t,dirty:false});return true}catch(e){return false}}
function applyCloud(r){SYNCK.forEach(k=>{if(r.data[k])localStorage.setItem(k,r.data[k])});sv("tj_sync",{t:r.t,dirty:false})}
async function startSync(force){
  if(!CU||!CLOUD)return false;
  try{
    const ct=await CLOUD.touch(CU.uid,CU.username),s=syn();
    if(ct>s.t){
      if(s.dirty&&!confirm(tx("Newer data from another phone was found.\nOK = use it (unsynced changes on this phone are lost)\nCancel = keep this phone's data"))){await pushNow();return true}
      const r=await CLOUD.pull(CU.uid);if(r){applyCloud(r);location.reload();return true}
    }
    if(s.dirty||force)return await pushNow();
    return true;
  }catch(e){return false}
}
async function afterAuth(){
  const ct=await CLOUD.touch(CU.uid,CU.username),hasLocal=allTrades.length>0||allFlows.length>0;
  if(ct>0){
    const r=await CLOUD.pull(CU.uid);
    if(r&&(!hasLocal||confirm(tx("This account already has saved data.\nOK = load the account's data (replaces this phone's journal)\nCancel = keep this phone's data (replaces the account's data)")))){applyCloud(r);location.reload();return new Promise(()=>{})}
  }
  await pushNow();
}
const AERR={"auth/email-already-in-use":"That username is taken. Try another.","auth/invalid-credential":"Wrong username or password.","auth/wrong-password":"Wrong username or password.","auth/user-not-found":"Wrong username or password.","auth/invalid-login-credentials":"Wrong username or password.","auth/weak-password":"Password must be at least 6 characters.","auth/network-request-failed":"No internet connection. Try again.","auth/too-many-requests":"Too many attempts. Try again later.","auth/operation-not-allowed":"Email/Password sign-in isn't enabled in Firebase yet."};
const errText=e=>AERR[e&&e.code]||"Something went wrong. Try again.";
function authScreen(canCancel){return new Promise(res=>{
  const A=$("#auth");let mode="in",busy=false;const up=()=>mode==="up",hide=()=>{A.classList.remove("on");A.innerHTML=""};
  const draw=()=>{
    A.innerHTML=`<div class="lk-in"><img class="lk-logo" src="icon-192.png" alt=""><div class="lk-name">My Trading Journal</div><h1>${up()?"Create account":"Sign in"}</h1><div class="sub">Use your account to open your journal on any phone.</div>
    <div class="auf"><input id="au" autocapitalize="none" autocorrect="off" autocomplete="username" spellcheck="false" maxlength="20" placeholder="${esc(tx("Username (3–20 letters, numbers, . or _)"))}"><input id="ap" type="password" autocomplete="${up()?"new-password":"current-password"}" placeholder="${esc(tx("Password (at least 6 characters)"))}">${up()?`<input id="ap2" type="password" autocomplete="new-password" placeholder="${esc(tx("Confirm password (type it again)"))}">`:""}<div class="sub" id="aer" style="min-height:18px;text-align:center">&nbsp;</div><button class="pill l" id="ago" type="button">${up()?"Create account":"Sign in"}</button></div>
    <div class="row lk-foot" style="flex-wrap:wrap"><button class="chip" id="asw" type="button">${up()?"I have an account":"Create account"}</button>${canCancel?'<button class="chip" id="acn" type="button">Back</button>':(FBC.require?"":'<button class="chip" id="ask" type="button">Skip for now</button>')}</div>
    <div class="sub" style="margin-top:12px;font-size:11px">No email needed. If you forget your password it can't be recovered.</div>${FBC.preview?'<div class="sub" style="margin-top:6px;font-size:11px">Preview mode: accounts are simulated on this device only.</div>':""}</div>`;
    A.classList.add("on");applyLang(A);
    const er=m=>{const e=$("#aer");e.textContent=m?tx(m):" ";e.classList.toggle("neg",!!m)};
    const go=async()=>{if(busy)return;const u=uname($("#au").value),p=$("#ap").value;
      if(!uok(u))return er("Username: 3–20 letters, numbers, . or _");
      if(p.length<6)return er("Password must be at least 6 characters.");
      if(up()&&p!==$("#ap2").value)return er("Passwords don't match");
      busy=true;er("");const b=$("#ago");b.textContent=tx("Working…");
      try{CU=up()?await CLOUD.signUp(u,p):await CLOUD.signIn(u,p)}catch(e){er(errText(e));busy=false;b.textContent=tx(up()?"Create account":"Sign in");return}
      sv("tj_cu",CU);sv("tj_skip",false);
      try{await afterAuth()}catch(e){}
      hide();res(true)};
    $("#ago").onclick=go;A.querySelectorAll("input").forEach(i=>i.onkeydown=e=>{if(e.key==="Enter")go()});
    $("#asw").onclick=()=>{mode=up()?"in":"up";draw()};
    if($("#acn"))$("#acn").onclick=()=>{hide();res(false)};
    if($("#ask"))$("#ask").onclick=()=>{sv("tj_skip",true);hide();res(false)};
  };
  draw();
})}
async function authGate(){
  if(!CLOUD)return;
  try{CU=await CLOUD.user()}catch(e){CU=null}
  if(CU){sv("tj_cu",CU);return}
  localStorage.removeItem("tj_cu");
  if(ld("tj_skip",false)&&!FBC.require)return;
  await authScreen(false);
}
function accCard(){const s=syn();return`<section class="card"><h2 style="margin-bottom:6px">Account</h2>`+(CU?`<div class="sub" style="margin-bottom:10px"><span>Signed in as</span> <b>${esc(CU.username)}</b>${s.t?`<br><span>Last synced</span> ${esc(new Date(s.t).toLocaleString())}`:""}${s.dirty?`<br><span>Changes waiting to sync</span>`:""}</div><div class="row"><button class="pill o" id="async" style="flex:1">Sync now</button><button class="pill d" id="aout" style="flex:1">Sign out</button></div>`:`<div class="sub" style="margin-bottom:10px">Sign in to open your journal on any phone.</div><button class="pill l" id="ain" style="width:100%">Sign in / Create account</button>`)+`</section>`}
function accBind(){
  if($("#async"))$("#async").onclick=async()=>{toast("Syncing…");const ok=await startSync(true);if(ok)toast("Synced ✓");else toast("Sync failed. Check your connection.");openSettings()};
  if($("#aout"))$("#aout").onclick=async()=>{if(!confirm(tx("Sign out? Your journal stays on this phone.")))return;await pushNow();try{await CLOUD.signOut()}catch(e){}CU=null;localStorage.removeItem("tj_cu");localStorage.removeItem("tj_sync");sv("tj_skip",true);openSettings()};
  if($("#ain"))$("#ain").onclick=async()=>{await authScreen(true);openSettings()};
}
addEventListener("online",()=>{if(CU&&syn().dirty)pushNow()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&CU&&syn().dirty)pushNow()});
Object.assign(AM,{"Account":"አካውንት","Sign in":"ግባ","Create account":"አካውንት ፍጠር","I have an account":"አካውንት አለኝ","Username":"የተጠቃሚ ስም","Password":"ፓስወርድ","Confirm password":"ፓስወርዱን አረጋግጥ","Skip for now":"አሁን ዝለል","Use your account to open your journal on any phone.":"መዝገብህን በማንኛውም ስልክ ለመክፈት አካውንትህን ተጠቀም።","No email needed. If you forget your password it can't be recovered.":"ኢሜል አያስፈልግም። ፓስወርድ ከረሳህ ማስመለስ አይቻልም።","Preview mode: accounts are simulated on this device only.":"የሙከራ ሁነታ፦ አካውንቶች በዚህ መሣሪያ ላይ ብቻ የሚመስሉ ናቸው።","Username: 3–20 letters, numbers, . or _":"የተጠቃሚ ስም፦ ከ3–20 ፊደል፣ ቁጥር፣ . ወይም _","Password must be at least 6 characters.":"ፓስወርድ ቢያንስ 6 ቁምፊ መሆን አለበት።","Passwords don't match":"ፓስወርዶቹ አይመሳሰሉም","Working…":"በመስራት ላይ…","That username is taken. Try another.":"ይህ የተጠቃሚ ስም ተይዟል። ሌላ ሞክር።","Wrong username or password.":"የተሳሳተ የተጠቃሚ ስም ወይም ፓስወርድ።","No internet connection. Try again.":"ኢንተርኔት የለም። ድጋሚ ሞክር።","Too many attempts. Try again later.":"ብዙ ሙከራ ተደርጓል። ቆይተህ ሞክር።","Email/Password sign-in isn't enabled in Firebase yet.":"Email/Password በ Firebase ላይ ገና አልበራም።","Something went wrong. Try again.":"የሆነ ችግር ተፈጥሯል። ድጋሚ ሞክር።","Signed in as":"የገባህበት ስም","Last synced":"መጨረሻ የተመሳሰለው","Changes waiting to sync":"ለማመሳሰል የሚጠብቁ ለውጦች","Sync now":"አሁን አመሳስል","Sign out":"ውጣ","Sign in to open your journal on any phone.":"መዝገብህን በማንኛውም ስልክ ለመክፈት ግባ።","Sign in / Create account":"ግባ / አካውንት ፍጠር","Syncing…":"በማመሳሰል ላይ…","Synced ✓":"ተመሳስሏል ✓","Sync failed. Check your connection.":"ማመሳሰል አልተሳካም። ግንኙነትህን ፈትሽ።","Sign out? Your journal stays on this phone.":"ልውጣ? መዝገብህ በዚህ ስልክ ላይ ይቆያል።","This account already has saved data.\nOK = load the account's data (replaces this phone's journal)\nCancel = keep this phone's data (replaces the account's data)":"ይህ አካውንት ቀድሞ የተቀመጠ ዳታ አለው።\nOK = የአካውንቱን ዳታ ጫን (የዚህ ስልክ መዝገብ ይተካል)\nCancel = የዚህን ስልክ ዳታ አቆይ (የአካውንቱ ዳታ ይተካል)","Newer data from another phone was found.\nOK = use it (unsynced changes on this phone are lost)\nCancel = keep this phone's data":"ከሌላ ስልክ አዲስ ዳታ ተገኝቷል።\nOK = ተጠቀምበት (በዚህ ስልክ ያልተመሳሰሉ ለውጦች ይጠፋሉ)\nCancel = የዚህን ስልክ ዳታ አቆይ"});

/* ---------- Ads (edit ads.json on GitHub) ---------- */
var AD=ld("tj_ads_v1",[]);
function adUrl(u){u=String(u||"").trim();return/^(https?:\/\/[^\s"'<>]+|[\w\-.\/]+)$/.test(u)?u:""}
function adsActive(){const n=Date.now();return(Array.isArray(AD)?AD:[]).filter(a=>a&&(a.title||a.text||a.image)&&!(a.until&&Date.parse(a.until+"T23:59:59")<n)).sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||String(b.date||"").localeCompare(String(a.date||"")))}
function adIcon(a){const i=String(a.icon||"📢").trim();return/^(https?:\/\/|[\w\-.\/]+\.(png|jpe?g|webp|gif|svg))/i.test(i)&&adUrl(i)?`<img src="${esc(i)}" alt="">`:esc(i)}
function paintAds(){const b=$("#adstrip");if(!b)return;const L=adsActive(),f=L[0];
  b.innerHTML=`<span class="adi">${f?adIcon(f):"📢"}</span><span class="adt"><b>${esc(f?(f.title||tx("Ads")):tx("Ads"))}</b>${f&&f.text?`<small>${esc(f.text)}</small>`:""}</span><span class="adg ${f?"on":""}">${f?esc(L.length+" "+tx("ads")):esc(tx("No ads"))}</span>`}
function openAds(){const L=adsActive();
  openWin(tx("Ads"),L.length?L.map(a=>{const im=adUrl(a.image),lk=adUrl(a.link);return`<section class="card ad"><div class="adh"><span class="adi">${adIcon(a)}</span><div><b>${esc(a.title||"")}</b>${a.date?`<div class="sub">${esc(a.date)}</div>`:""}</div></div>${im?`<img class="adimg" src="${esc(im)}" alt="" loading="lazy">`:""}${a.text?`<div class="adx">${esc(a.text)}</div>`:""}${lk?`<a class="pill l adlk" href="${esc(lk)}" target="_blank" rel="noopener noreferrer">${esc(a.linkText||tx("Open link"))}</a>`:""}</section>`}).join(""):`<div class="empty">${esc(tx("No ads"))}</div>`)}
async function loadAds(){
  try{const r=await fetch("ads.json?t="+Date.now(),{cache:"no-store"});if(r.ok){const j=await r.json();AD=Array.isArray(j)?j:(j.ads||[]);sv("tj_ads_v1",AD)}}catch(e){}
  if(!adsActive().length&&window.TJ_ADS_INLINE)AD=window.TJ_ADS_INLINE;
  paintAds()}
$("#adstrip").onclick=openAds;loadAds();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAds()});setInterval(loadAds,6e5);
Object.assign(AM,{"Accounts are not set up yet. Add your Firebase keys in config.js to enable Sign in / Sign out.":"አካውንት ገና አልተዋቀረም። Sign in / Sign out ለማብራት የ Firebase ቁልፎችን በ config.js ውስጥ ያስገቡ።","Ads":"ማስታወቂያ","ads":"ማስታወቂያዎች","No ads":"ማስታወቂያ የለም","Open link":"ክፈት","Notice":"ማሳሰቢያ","Photos you attach to trades are stored only on this phone. They are not synced to your account. If you clear the app data or uninstall the app, they will be lost.":"ከትሬዶች ጋር የሚያያይዟቸው ፎቶዎች የሚቀመጡት በዚህ ስልክ ላይ ብቻ ነው። ከአካውንትዎ ጋር አይመሳሰሉም። የ App ዳታውን ካጸዱ ወይም App ን ካጠፉት ፎቶዎቹ ይጠፋሉ።","Contact":"አግኙን","Have feedback or suggestions? Email us:":"አስተያየት ወይም ሃሳብ አለዎት? በኢሜል ይላኩልን፦","Lot size":"የሎት መጠን","Username (3–20 letters, numbers, . or _)":"የተጠቃሚ ስም (3–20 ፊደል፣ ቁጥር፣ . ወይም _)","Password (at least 6 characters)":"ፓስወርድ (ቢያንስ 6 ቁምፊ)","Confirm password (type it again)":"ፓስወርዱን አረጋግጥ (በድጋሚ ጻፍ)","No upcoming events yet. Next week's calendar is usually published over the weekend. Showing last week's events.":"ገና የሚመጡ ዜናዎች የሉም። የሚቀጥለው ሳምንት ካላንደር አብዛኛውን ጊዜ ቅዳሜና እሁድ ይለቀቃል። የባለፈው ሳምንት ዜናዎች እየታዩ ነው።"});

boot();
