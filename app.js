'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ic=(n,s='')=>`<svg class="ic" style="${s}"><use href="#i-${n}"/></svg>`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const PV='::preview',base=p=>p.replace(/\/$/,'').split('/').pop(),ext=p=>p.includes('.')?p.split('.').pop().toLowerCase():'';
const parentOf=p=>p.replace(/[^/]*\/?$/,''),BIN=/\.(png|jpe?g|gif|webp|ico|bmp|pdf|woff2?|ttf|otf|mp[34]|webm|exe|dll)$/i;
const LANG={html:'xml',htm:'xml',xml:'xml',svg:'xml',js:'javascript',mjs:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',css:'css',json:'json',md:'markdown',py:'python',java:'java',c:'c',cpp:'cpp',cs:'csharp',go:'go',rs:'rust',php:'php',rb:'ruby',sh:'bash',sql:'sql',yml:'yaml',yaml:'yaml'};
const FC={html:'#e44d26',htm:'#e44d26',css:'#42a5f5',js:'#e8d44d',mjs:'#e8d44d',jsx:'#61dafb',ts:'#3178c6',tsx:'#3178c6',json:'#cbcb41',md:'#519aba',py:'#4b8bbe',svg:'#ffb13b'};
const S={fs:{},open:[],active:null,exp:[''],view:'explorer',side:true,panel:false,sw:260,ph:200,fz:14,live:true};
try{Object.assign(S,JSON.parse(localStorage.getItem('lumen.v1')||'{}'))}catch(e){}
let fs=S.fs,exp=new Set(S.exp),sel='',cur='',edit=null,last=null,dirty=true,t1,t2,tt,errs=0,qItems=[],qIdx=0;
S.open=S.open.filter(p=>p===PV||p in fs);if(!S.open.includes(S.active))S.active=S.open[0]||null;
const ta=$('#ta'),fi=p=>ic('file','color:'+(FC[ext(p)]||'#9aa5b1'));
const lh=()=>Math.round(S.fz*1.45);
function save(){S.exp=[...exp];try{localStorage.setItem('lumen.v1',JSON.stringify(S))}catch(e){}}
function toast(m,fn){const t=$('#toast');t.innerHTML=esc(m)+(fn?'<button>Undo</button>':'');t.hidden=false;if(fn)t.querySelector('button').onclick=()=>{fn();t.hidden=true};clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,4500)}
function dirs(p){const a=p.split('/');a.pop();let c='';a.forEach(d=>{c+=d+'/';if(!(c in fs))fs[c]=null;exp.add(c)})}
const key=p=>{const f=p.endsWith('/'),a=p.replace(/\/$/,'').split('/');return a.map((s,i)=>(i<a.length-1||f?'0':'1')+s.toLowerCase()).join('/')};
/* ---------- explorer ---------- */
function tree(){
 const t=$('#tree'),keys=Object.keys(fs).sort((a,b)=>key(a)<key(b)?-1:1);let h='';
 const inp=(d,ty)=>`<div class="row" style="padding-left:${8+d*12}px">${ty==='folder'?ic('chev'):fi('x')}<input class="ri" id="ri"></div>`;
 if(!keys.length&&!edit){t.innerHTML=`<div class="empty">Your workspace is empty.<br>Create a file or upload some to get started.<button class="btn" data-c="newfile">New File</button><button class="btn" data-c="upload" style="background:#3a3d41">Upload Files</button></div>`;return}
 if(edit&&edit.t!=='rename'&&cur==='')h+=inp(0,edit.t);
 for(const p of keys){
  const f=p.endsWith('/'),a=p.replace(/\/$/,'').split('/'),d=a.length-1;let c='',hide=0;
  for(let i=0;i<d;i++){c+=a[i]+'/';if(!exp.has(c))hide=1}
  if(hide)continue;
  const ren=edit&&edit.t==='rename'&&edit.p===p;
  h+=`<div class="row${p===S.active?' act':''}${p===sel?' sel':''}" data-p="${esc(p)}" style="padding-left:${8+d*12}px">${f?ic(exp.has(p)?'chevd':'chev'):fi(p)}${ren?`<input class="ri" id="ri" value="${esc(base(p))}">`:`<span>${esc(a[d])}</span>`}</div>`;
  if(f&&edit&&edit.t!=='rename'&&cur===p&&exp.has(p))h+=inp(d+1,edit.t)}
 t.innerHTML=h;const r=$('#ri');
 if(r){r.focus();if(edit.t==='rename'){const n=r.value.lastIndexOf('.');r.setSelectionRange(0,n>0?n:r.value.length)}
  r.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')commit(r.value.trim());else if(e.key==='Escape'){edit=null;tree()}};
  r.onblur=()=>{if(edit){edit=null;tree()}}}}
function commit(v){const e=edit;edit=null;if(!v){tree();return}v=v.replace(/^\/+/,'');
 if(e.t==='rename')return rename(e.p,parentOf(e.p)+v);
 if(e.t==='folder'){const p=(cur+v).replace(/\/?$/,'/');dirs(p);fs[p]=null;exp.add(p);cur=p}
 else{const p=cur+v;if(p.endsWith('/'))return tree();if(!(p in fs)){dirs(p);fs[p]=''}return openFile(p)}
 tree();save()}
function newItem(t){if(!S.side||S.view!=='explorer')setView('explorer',1);if(cur)exp.add(cur);edit={t};tree()}
function rename(p,np){const f=p.endsWith('/');if(f)np=np.replace(/\/?$/,'/');if(np===p||np in fs)return tree();
 Object.keys(fs).filter(k=>k===p||(f&&k.startsWith(p))).forEach(o=>{const n=np+o.slice(p.length);fs[n]=fs[o];delete fs[o];S.open=S.open.map(x=>x===o?n:x);if(S.active===o)S.active=n;if(exp.delete(o))exp.add(n)});
 dirs(np);if(sel===p)sel=np;dirty=true;show()}
function del(p){const f=p.endsWith('/'),snap={};Object.keys(fs).filter(k=>k===p||(f&&k.startsWith(p))).forEach(k=>{snap[k]=fs[k];delete fs[k]});
 S.open=S.open.filter(x=>x===PV||x in fs);if(!(S.active in fs)&&S.active!==PV)S.active=S.open[S.open.length-1]||null;sel='';dirty=true;show();
 toast('Deleted '+base(p),()=>{Object.assign(fs,snap);dirs(p);show()})}
$('#tree').onclick=e=>{const r=e.target.closest('.row');if(!r){sel='';cur='';tree();return}if(e.target.id==='ri')return;
 const p=r.dataset.p;sel=p;if(!p)return;
 if(p.endsWith('/')){exp.has(p)?exp.delete(p):exp.add(p);cur=p;tree();save()}else{cur=parentOf(p);openFile(p)}};
$('#tree').oncontextmenu=e=>{e.preventDefault();const r=e.target.closest('.row'),p=r?r.dataset.p:'';
 sel=p;cur=p?(p.endsWith('/')?p:parentOf(p)):'';tree();
 ctx(e.clientX,e.clientY,[['New File',()=>newItem('file')],['New Folder',()=>newItem('folder')],...(p?[['Rename  (F2)',()=>{edit={t:'rename',p};tree()}],['Delete',()=>del(p)]]:[])])};
function ctx(x,y,items){const c=$('#ctx');c.innerHTML='';items.forEach(([l,f])=>{const d=document.createElement('div');d.textContent=l;d.onclick=()=>{c.hidden=true;f()};c.appendChild(d)});
 c.hidden=false;c.style.left=Math.min(x,innerWidth-190)+'px';c.style.top=Math.min(y,innerHeight-items.length*28-10)+'px'}
document.addEventListener('mousedown',e=>{if(!e.target.closest('#ctx'))$('#ctx').hidden=true});
$('#tree').onkeydown=e=>{if(e.key==='F2'&&sel){edit={t:'rename',p:sel};tree()}else if(e.key==='Delete'&&sel)del(sel)};
/* ---------- tabs / editor ---------- */
function openFile(p){if(!S.open.includes(p))S.open.push(p);S.active=p;show()}
function closeTab(p){const i=S.open.indexOf(p);if(i<0)return;S.open.splice(i,1);if(S.active===p)S.active=S.open[Math.min(i,S.open.length-1)]||null;show()}
function tabs(){$('#tabl').innerHTML=S.open.map(p=>`<div class="tab${p===S.active?' on':''}" data-p="${esc(p)}">${p===PV?ic('globe','color:#4fc1ff'):fi(p)}<span>${p===PV?'Preview':esc(base(p))}</span><b class="x">${ic('close')}</b></div>`).join('')}
$('#tabl').onclick=e=>{const t=e.target.closest('.tab');if(!t)return;const p=t.dataset.p;if(e.target.closest('.x'))closeTab(p);else{S.active=p;show()}};
$('#tabl').onauxclick=e=>{const t=e.target.closest('.tab');if(t&&e.button===1)closeTab(t.dataset.p)};
function crumb(){const a=S.active,c=$('#crumb');c.innerHTML=!a?'':a===PV?'Preview':a.split('/').map(esc).join(ic('chev'))}
function hl(){const p=S.active,c=fs[p],l=LANG[ext(p)];let h;
 try{h=l&&window.hljs&&hljs.getLanguage(l)?hljs.highlight(c,{language:l}).value:esc(c)}catch(e){h=esc(c)}
 $('#hl').innerHTML=h+'\n ';const n=c.split('\n').length;$('#gut').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');
 $('#lang').textContent=l?l[0].toUpperCase()+l.slice(1):'Plain Text'}
function pos(){const v=ta.value.slice(0,ta.selectionStart).split('\n');$('#pos').textContent=`Ln ${v.length}, Col ${v[v.length-1].length+1}`;
 $('#cl').style.top=(8+(v.length-1)*lh()-ta.scrollTop)+'px'}
function sync(){$('#hl').scrollTop=ta.scrollTop;$('#hl').scrollLeft=ta.scrollLeft;$('#gut').scrollTop=ta.scrollTop;pos()}
function show(){const a=S.active,pv=a===PV;if(a&&!pv)last=a;
 acHide();tabs();tree();crumb();$('#welcome').hidden=!!a;$('#editor').hidden=!a||pv;$('#preview').hidden=!pv;
 $('#pos').hidden=$('#sp').hidden=$('#lang').hidden=!a||pv;
 if(a&&!pv){ta.value=fs[a];hl();pos();ta.focus()}
 if(pv&&dirty)build();save()}
ta.oninput=e=>{acUpdate(e);fs[S.active]=ta.value;hl();pos();dirty=true;clearTimeout(t1);t1=setTimeout(save,300);
 if(S.live&&S.open.includes(PV)){clearTimeout(t2);t2=setTimeout(()=>{if(S.active===PV)build()},800)}};
ta.onscroll=sync;ta.onkeyup=ta.onclick=pos;
const PAIR={'(':')','[':']','{':'}','"':'"',"'":"'",'`':'`'};
function comment(){const v=ta.value,x=ext(S.active),s=ta.selectionStart,en=ta.selectionEnd,ls=v.lastIndexOf('\n',s-1)+1,i=v.indexOf('\n',en),le=i<0?v.length:i;
 const pre=/^(html?|xml|svg|md)$/.test(x)?['<!--',' -->']:x==='css'?['/*',' */']:/^(py|rb|sh|ya?ml)$/.test(x)?['#','']:['//',''];
 const L=v.slice(ls,le).split('\n'),all=L.every(l=>!l.trim()||l.trimStart().startsWith(pre[0]));
 const out=L.map(l=>{if(!l.trim())return l;const k=l.search(/\S/);
  if(all){let t=l.slice(k+pre[0].length).replace(/^ /,'');if(pre[1])t=t.replace(/ ?(-->|\*\/)\s*$/,'');return l.slice(0,k)+t}
  return l.slice(0,k)+pre[0]+' '+l.slice(k)+pre[1]}).join('\n');
 ta.setRangeText(out,ls,le,'select');ta.setSelectionRange(ls,ls+out.length);ta.dispatchEvent(new Event('input'))}
ta.onkeydown=e=>{
 const v=ta.value,s=ta.selectionStart,en=ta.selectionEnd,m=e.ctrlKey||e.metaKey,ins=(t,a,b,md)=>{ta.setRangeText(t,a,b,md||'end');ta.dispatchEvent(new Event('input'))};
 if(ac.on){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();ac.i=(ac.i+(e.key==='ArrowDown'?1:ac.items.length-1))%ac.items.length;return acDraw()}
  if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();return acAccept()}acHide()}
 if(m&&e.key==='/'){e.preventDefault();return comment()}
 if(m||e.altKey)return;
 if(e.key==='Tab'){e.preventDefault();
  if(e.shiftKey||v.slice(s,en).includes('\n')){const ls=v.lastIndexOf('\n',s-1)+1,blk=v.slice(ls,en),out=e.shiftKey?blk.replace(/^ {1,2}/gm,''):blk.replace(/^/gm,'  ');
   ta.setRangeText(out,ls,en,'select');ta.setSelectionRange(ls,ls+out.length);ta.dispatchEvent(new Event('input'))}
  else ins('  ',s,en)}
 else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const ls=v.lastIndexOf('\n',s-1)+1,pre=v.slice(ls,s),ind=pre.match(/^\s*/)[0],p=v[s-1],n=v[en];
  if(p&&n&&'{[('.indexOf(p)>=0&&'}])'.indexOf(n)===('{[('.indexOf(p))){ins('\n'+ind+'  \n'+ind,s,en);const c=s+ind.length+3;ta.setSelectionRange(c,c)}
  else ins('\n'+ind+(/[{[(]\s*$/.test(pre)?'  ':''),s,en)}
 else if(PAIR[e.key]){const c=PAIR[e.key],q='"\'`'.includes(e.key);
  if(s!==en){e.preventDefault();ins(e.key+v.slice(s,en)+c,s,en,'select');ta.setSelectionRange(s+1,en+1)}
  else if(q&&v[s]===e.key){e.preventDefault();ta.setSelectionRange(s+1,s+1)}
  else if(!/\w/.test(v[s]||'')&&!(q&&/\w/.test(v[s-1]||''))){e.preventDefault();ins(e.key+c,s,en);ta.setSelectionRange(s+1,s+1)}}
 else if(e.key==='>'&&/^(html?|xml|svg|jsx|tsx)$/.test(ext(S.active))){const mm=v.slice(0,s).match(/<([a-zA-Z][\w-]*)(\s[^<>]*)?$/);
  if(mm&&!VOID.test(mm[1])&&!/\/$/.test(mm[2]||'')){e.preventDefault();ins('></'+mm[1]+'>',s,en);ta.setSelectionRange(s+1,s+1)}}
 else if(')]}'.includes(e.key)&&e.key.length===1&&v[s]===e.key&&s===en){e.preventDefault();ta.setSelectionRange(s+1,s+1)}
 else if(e.key==='Backspace'&&s===en&&PAIR[v[s-1]]===v[s]&&s>0){e.preventDefault();ins('',s-1,s+1)}};
/* ---------- preview ---------- */
const BR=`<script>(function(){const p=(t,a)=>parent.postMessage({lumen:1,t,m:a.map(x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch(e){return String(x)}}).join(' ')},'*');['log','warn','error','info'].forEach(k=>{const o=console[k];console[k]=(...a)=>{p(k,a);o.apply(console,a)}});addEventListener('error',e=>p('error',[e.message+' (line '+e.lineno+')']));addEventListener('unhandledrejection',e=>p('error',['Unhandled: '+e.reason]))})()<\/script>`;
let pvHtml='';
function build(){dirty=false;const isH=p=>p&&/\.html?$/.test(p);
 let en=isH(last)?last:('index.html' in fs?'index.html':Object.keys(fs).find(isH)),h;
 if(en)h=fs[en];else if(last&&/\.m?js$/.test(last)){en=last;h=`<body><script src="${base(last)}"><\/script></body>`}
 else{en='';h='<body style="font:15px system-ui;color:#888;display:grid;place-items:center;height:90vh;margin:0">Create an index.html (or open a .js file) to preview it.</body>'}
 const rs=r=>{try{return new URL(r,'http://x/'+en).pathname.slice(1)}catch(e){return r}};
 h=h.replace(/<link[^>]*>/gi,m=>{const r=/href=["']([^"']+)["']/i.exec(m),f=r&&fs[rs(r[1])];return r&&/stylesheet/i.test(m)&&typeof f==='string'?`<style>${f}</style>`:m})
  .replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,(m,a,s,b)=>{const f=fs[rs(s)];return typeof f==='string'?`<script${a}${b}>${f.replace(/<\/script/gi,'<\\/script')}<\/script>`:m});
 h=/<head[^>]*>/i.test(h)?h.replace(/<head[^>]*>/i,m=>m+BR):BR+h;pvHtml=h;
 $('#addr').textContent='preview://'+(en||'');clearCon();$('#fr').srcdoc=h}
function openPreview(){if(!S.open.includes(PV))S.open.push(PV);S.active=PV;dirty=true;show()}
function clearCon(){$('#con').innerHTML='';errs=0;$('#ecount').textContent=''}
addEventListener('message',e=>{const d=e.data;if(d&&d.lumen&&e.source===$('#fr').contentWindow){const x=document.createElement('div');x.className=d.t;x.textContent=d.m;$('#con').appendChild(x);$('#con').scrollTop=1e9;
 if(d.t==='error'){errs++;$('#ecount').textContent=errs;if(!S.panel){S.panel=true;layout()}}}});
/* ---------- language runners (loaded from CDNs, executed in the sandboxed iframe) ---------- */
const sj=s=>JSON.stringify(s).replace(/</g,'\\u003c'),RUNX=/^(py|ts|lua|sql|js)$/;
const RUN={
 py:'<script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"><\/script><script>(async()=>{console.info("Loading Python runtime (first run downloads ~10 MB)...");try{const py=await loadPyodide();py.setStdout({batched:s=>console.log(s)});py.setStderr({batched:s=>console.error(s)});py.setStdin({stdin:()=>prompt("input()")});await py.loadPackagesFromImports(CODE);await py.runPythonAsync(CODE);console.info("Finished.")}catch(e){console.error(String(e.message||e))}})()<\/script>',
 ts:'<script src="https://cdn.jsdelivr.net/npm/typescript@5.5.4/lib/typescript.js"><\/script><script>try{var exports={},module={exports};(0,eval)(ts.transpileModule(CODE,{compilerOptions:{target:99,module:1}}).outputText)}catch(e){console.error(String(e))}<\/script>',
 lua:'<script src="https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js"><\/script><script>try{fengari.load(CODE)()}catch(e){console.error(String(e))}<\/script>',
 sql:'<script src="https://cdn.jsdelivr.net/npm/alasql@4.5.2/dist/alasql.min.js"><\/script><script>try{const n=alasql.parse(CODE).statements.length,r=alasql(CODE);(n>1?r:[r]).forEach(x=>console.log(typeof x==="object"?JSON.stringify(x,null,2):String(x)))}catch(e){console.error(String(e))}<\/script>'};
function runCode(p){const x=ext(p),c=fs[p];clearCon();S.panel=true;layout();dirty=true;
 const b=x==='js'?`<script>${c.replace(/<\/script/gi,'<\\/script')}<\/script>`:`<script>const CODE=${sj(c)}<\/script>`+RUN[x];
 const d=document.createElement('div');d.className='info';d.textContent='Running '+p+' ...';$('#con').appendChild(d);
 pvHtml=BR+b;$('#fr').srcdoc=pvHtml}
function runActive(){const p=S.active&&S.active!==PV?S.active:last,x=p?ext(p):'',web=Object.keys(fs).some(k=>/\.html?$/.test(k));
 if(p&&RUNX.test(x)&&!(x==='js'&&web))runCode(p);else openPreview()}
/* ---------- autocomplete ---------- */
const TAGS='a abbr article aside audio b blockquote body br button canvas code div em footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input label li link main meta nav ol option p pre script section select small span strong style svg table tbody td textarea th thead title tr ul video'.split(' ');
const VOID=/^(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)$/i;
const SP={a:'<a href="$0"></a>',img:'<img src="$0" alt="">',link:'<link rel="stylesheet" href="$0">',input:'<input type="$0">',script:'<script>\n  $0\n</script>'};
const CSSP='align-items animation background background-color border border-radius box-shadow color cursor display flex flex-direction flex-wrap font-family font-size font-weight gap grid grid-template-columns height justify-content left letter-spacing line-height margin margin-bottom margin-left margin-right margin-top max-width min-height min-width opacity overflow padding padding-bottom padding-left padding-right padding-top position right text-align text-decoration top transform transition width z-index'.split(' ');
const JSK='async await break case catch class const continue default else export extends false finally for function if import let new null return static super switch this throw true try typeof undefined var while yield console.log console.error document.getElementById document.querySelector document.querySelectorAll addEventListener setTimeout setInterval fetch JSON.stringify JSON.parse Math.floor Math.random Array.from Object.keys Object.entries Promise.all'.split(' ');
const KW={js:JSK,py:'and as assert break class continue def del elif else except finally for from global if import in is lambda not or pass raise return try while with yield True False None print input len range enumerate zip map filter sorted sum min max open int str float list dict set tuple isinstance'.split(' '),
 lua:'and break do else elseif end false for function if in local nil not or repeat return then true until while print'.split(' '),sql:'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ORDER BY GROUP HAVING JOIN LEFT INNER ON LIMIT AND OR NOT NULL AS DISTINCT COUNT SUM AVG'.split(' ')};
KW.ts=KW.jsx=KW.tsx=KW.mjs=JSK;
const SN={js:[['log','console.log($0);'],['fn','function $0() {\n  \n}'],['for','for (let i = 0; i < $0; i++) {\n  \n}'],['qs','document.querySelector(\'$0\')']],
 py:[['def','def $0():\n    '],['for','for i in range($0):\n    '],['main','if __name__ == "__main__":\n    $0'],['class','class $0:\n    def __init__(self):\n        ']]};
SN.ts=SN.jsx=SN.tsx=SN.mjs=SN.js;
const BOILER='<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  $0\n</body>\n</html>';
const ac={on:0,items:[],i:0,len:0};
$('#cw').insertAdjacentHTML('beforeend','<span id="mz">0000000000</span><div id="ac" hidden></div>');
function acUpdate(e){if(!e||e.inputType!=='insertText'||!S.active||S.active===PV)return acHide();
 const x=ext(S.active),v=ta.value,s=ta.selectionStart,b=v.slice(0,s),mk=/^(html?|xml|svg|jsx|tsx)$/.test(x);let it=[],len=0,m;
 if(mk&&(m=b.match(/<([a-zA-Z][\w-]*)$/))){const p=m[1].toLowerCase();len=p.length+1;it=TAGS.filter(t=>t.startsWith(p)).map(t=>({l:t,k:'tag',t:SP[t]||(VOID.test(t)?`<${t}>`:`<${t}>$0</${t}>`)}))}
 else if(mk&&/(^|\n)[ \t]*!$/.test(b)){len=1;it=[{l:'! html5 boilerplate',k:'snippet',t:BOILER}]}
 else{m=b.match(x==='css'?/[\w-]+$/:/[\w$.]+$/);if(!m||m[0].length<2)return acHide();const p=m[0].toLowerCase();len=m[0].length;
  const sn=(SN[x]||[]).map(([l,t])=>({l,k:'snippet',t})),kw=(KW[x]||[]).filter(l=>!sn.some(q=>q.l===l)).map(l=>({l,k:'keyword',t:l}));
  const base=x==='css'?CSSP.map(l=>({l,k:'property',t:l+': $0;'})):mk?[]:[...sn,...kw],seen=new Set(base.map(i=>i.l));
  (v.match(/[A-Za-z_$][\w$]{2,}/g)||[]).forEach(w=>{if(!seen.has(w)){seen.add(w);base.push({l:w,k:'word',t:w})}});
  it=base.filter(i=>i.l.toLowerCase().startsWith(p)&&i.l.toLowerCase()!==p)}
 ac.items=it.slice(0,8);ac.len=len;ac.i=0;if(!ac.items.length)return acHide();ac.on=1;acDraw()}
function acDraw(){const a=$('#ac'),cw=$('#cw');a.hidden=false;
 a.innerHTML=ac.items.map((i,n)=>`<div class="ar${n===ac.i?' on':''}" data-i="${n}"><span>${esc(i.l)}</span><small>${i.k}</small></div>`).join('');
 const v=ta.value.slice(0,ta.selectionStart).split('\n'),w=$('#mz').getBoundingClientRect().width/10;
 let l=14+(v[v.length-1].length-ac.len)*w-ta.scrollLeft,t=8+v.length*lh()-ta.scrollTop;
 l=Math.max(4,Math.min(l,cw.clientWidth-250));if(t+a.offsetHeight>cw.clientHeight)t-=a.offsetHeight+lh();a.style.left=l+'px';a.style.top=t+'px'}
function acHide(){ac.on=0;$('#ac').hidden=true}
function acAccept(){const it=ac.items[ac.i],s=ta.selectionStart,a=s-ac.len,v=ta.value,ind=v.slice(v.lastIndexOf('\n',s-1)+1).match(/^\s*/)[0];
 let t=it.t.replace(/\n/g,'\n'+ind);const c=t.indexOf('$0');t=t.replace('$0','');
 ta.setRangeText(t,a,s,'end');ta.dispatchEvent(new Event('input'));if(c>=0)ta.setSelectionRange(a+c,a+c);acHide();pos()}
$('#ac').onmousedown=e=>{e.preventDefault();const r=e.target.closest('.ar');if(r){ac.i=+r.dataset.i;acAccept()}};
['click','blur'].forEach(ev=>ta.addEventListener(ev,acHide));
/* ---------- search ---------- */
$('#sq').oninput=()=>{const q=$('#sq').value.toLowerCase();let h='';
 if(q)for(const p of Object.keys(fs).sort()){if(typeof fs[p]!=='string')continue;const hits=[];
  fs[p].split('\n').forEach((l,i)=>{const k=l.toLowerCase().indexOf(q);if(k>=0&&hits.length<50)hits.push(`<div class="rl" data-p="${esc(p)}" data-l="${i}" data-k="${k}">${esc(l.slice(Math.max(0,k-20),k))}<mark>${esc(l.substr(k,q.length))}</mark>${esc(l.slice(k+q.length,k+q.length+60))}</div>`)});
  if(hits.length)h+=`<div class="rf">${fi(p)}${esc(p)}</div>`+hits.join('')}
 $('#sres').innerHTML=h||(q?'<div class="empty">No results found.</div>':'')};
$('#sres').onclick=e=>{const r=e.target.closest('.rl');if(!r)return;openFile(r.dataset.p);const L=fs[r.dataset.p].split('\n'),i=+r.dataset.l;
 const o=L.slice(0,i).reduce((a,l)=>a+l.length+1,0)+ +r.dataset.k;ta.setSelectionRange(o,o+$('#sq').value.length);ta.scrollTop=Math.max(0,i*lh()-120);sync();ta.focus()};
/* ---------- files in / out ---------- */
function dl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click()}
async function exportZip(){if(!window.JSZip)return toast('JSZip failed to load (offline?)');const z=new JSZip();let n=0;for(const p in fs)if(typeof fs[p]==='string'){z.file(p,fs[p]);n++}
 if(!n)return toast('Workspace is empty');dl(await z.generateAsync({type:'blob'}),'lumen-workspace.zip')}
async function addFiles(list){let n=0;for(const f of list){try{
 if(/\.zip$/i.test(f.name)&&window.JSZip){const z=await JSZip.loadAsync(f);for(const [rp,en] of Object.entries(z.files))if(!en.dir&&!BIN.test(rp)&&!rp.startsWith('__MACOSX')){dirs(rp);fs[rp]=await en.async('string');n++}}
 else if(!BIN.test(f.name)){const k=cur+f.name;dirs(k);fs[k]=await f.text();n++}}catch(e){}}
 dirty=true;toast(n+' file(s) added');show()}
$('#up').onchange=e=>{addFiles(e.target.files);e.target.value=''};
addEventListener('dragover',e=>e.preventDefault());addEventListener('drop',e=>{e.preventDefault();if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files)});
/* ---------- layout ---------- */
function layout(){const r=document.documentElement.style;r.setProperty('--sw',S.sw+'px');r.setProperty('--ph',S.ph+'px');r.setProperty('--fz',S.fz+'px');r.setProperty('--lh',lh()+'px');
 $('#side').hidden=$('#sash1').hidden=!S.side;$('#panel').hidden=$('#sash2').hidden=!S.panel;
 $$('#act [data-v]').forEach(b=>b.classList.toggle('on',S.side&&b.dataset.v===S.view));$$('.v').forEach(v=>v.hidden=v.id!=='v-'+S.view);
 $('#t-side').classList.toggle('on',S.side);$('#t-panel').classList.toggle('on',S.panel);$('#fzv').textContent=S.fz;$('#live').checked=S.live;save()}
function setView(v,force){if(S.side&&S.view===v&&!force)S.side=false;else{S.side=true;S.view=v}layout();if(v==='search'&&S.side)$('#sq').focus()}
$$('#act [data-v]').forEach(b=>b.onclick=()=>setView(b.dataset.v));
function drag(id,fn){$(id).onmousedown=e=>{e.preventDefault();document.body.classList.add('drag');const up=()=>{removeEventListener('mousemove',fn);removeEventListener('mouseup',up);document.body.classList.remove('drag');save()};addEventListener('mousemove',fn);addEventListener('mouseup',up)}}
drag('#sash1',e=>{S.sw=Math.max(170,Math.min(640,e.clientX-48));layout()});
drag('#sash2',e=>{const r=$('#main').getBoundingClientRect();S.ph=Math.max(80,Math.min(r.height-140,r.bottom-e.clientY));layout()});
function zoom(d){S.fz=Math.max(10,Math.min(30,S.fz+d));layout();if(S.active&&S.active!==PV){pos()}}
$('#fzm').onclick=()=>zoom(-1);$('#fzp').onclick=()=>zoom(1);$('#live').onchange=e=>{S.live=e.target.checked;save()};
$('#wipe').onclick=()=>{const b=$('#wipe');if(b.dataset.s){S.fs=fs={};S.open=[];S.active=null;exp=new Set(['']);sel=cur='';dirty=true;show();toast('Workspace deleted');b.textContent='Delete entire workspace';delete b.dataset.s}
 else{b.textContent='Click again to confirm';b.dataset.s=1;setTimeout(()=>{b.textContent='Delete entire workspace';delete b.dataset.s},3000)}};
/* ---------- command palette / quick open ---------- */
const CMD={
 newfile:['New File','Alt+N',()=>newItem('file')],newfolder:['New Folder','',()=>newItem('folder')],upload:['Upload Files or ZIP...','',()=>$('#up').click()],
 run:['Run (HTML preview, Python, TS, Lua, SQL, JS)','Ctrl+Enter',runActive],refresh:['Refresh Preview','',()=>{dirty=true;if(S.active===PV)build();else openPreview()}],
 popout:['Open Preview in New Browser Tab','',()=>{if(S.active!==PV)openPreview();else{build()}window.open(URL.createObjectURL(new Blob([pvHtml],{type:'text/html'})))}],
 closetab:['Close Active Editor','Alt+W',()=>S.active&&closeTab(S.active)],closeall:['Close All Editors','',()=>{S.open=[];S.active=null;show()}],
 side:['Toggle Sidebar','Ctrl+B',()=>{S.side=!S.side;layout()}],panel:['Toggle Console','Ctrl+J',()=>{S.panel=!S.panel;layout()}],
 explorer:['Show Explorer','Ctrl+Shift+E',()=>setView('explorer',1)],search:['Search in Files','Ctrl+Shift+F',()=>setView('search',1)],settings:['Open Settings','',()=>setView('settings',1)],
 zoomin:['Zoom In Editor','Ctrl+=',()=>zoom(1)],zoomout:['Zoom Out Editor','Ctrl+-',()=>zoom(-1)],zip:['Download Workspace as ZIP','',exportZip],
 dlfile:['Download Active File','',()=>{const p=S.active;if(p&&p!==PV)dl(new Blob([fs[p]]),base(p))}],clearcon:['Clear Console','',clearCon],
 quick:['Go to File...','Ctrl+P',()=>qp('')],palette:['Show All Commands','Ctrl+Shift+P',()=>qp('>')]};
document.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b&&CMD[b.dataset.c])CMD[b.dataset.c][2]()});
const fz=(q,s)=>{q=q.toLowerCase();s=s.toLowerCase();let i=0;for(const c of s)if(c===q[i])i++;return i>=q.length};
function qp(v){$('#qp').hidden=false;const i=$('#qi');i.value=v;i.focus();qlist()}
function qlist(){const v=$('#qi').value;
 qItems=v.startsWith('>')?Object.values(CMD).filter(c=>fz(v.slice(1).trim(),c[0])).map(c=>({l:c[0],h:c[1],f:c[2]}))
  :Object.keys(fs).filter(p=>typeof fs[p]==='string'&&fz(v.trim(),p)).map(p=>({l:base(p),h:p,f:()=>openFile(p)}));
 qIdx=0;qdraw()}
function qdraw(){$('#ql').innerHTML=qItems.map((x,i)=>`<div class="qr${i===qIdx?' on':''}" data-i="${i}"><span>${esc(x.l)}</span><small>${esc(x.h)}</small></div>`).join('')||'<div class="qr"><small>No matching results</small></div>'}
function qrun(i){const x=qItems[i];$('#qp').hidden=true;if(x)x.f()}
$('#qi').oninput=qlist;$('#ql').onclick=e=>{const r=e.target.closest('.qr[data-i]');if(r)qrun(+r.dataset.i)};
$('#qi').onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();qIdx=(qIdx+(e.key==='ArrowDown'?1:-1)+qItems.length)%Math.max(1,qItems.length);qdraw();const o=$('#ql .on');o&&o.scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter')qrun(qIdx);else if(e.key==='Escape')$('#qp').hidden=true};
$('#qp').onmousedown=e=>{if(e.target.id==='qp')$('#qp').hidden=true};
addEventListener('keydown',e=>{const m=e.ctrlKey||e.metaKey,k=e.key.toLowerCase(),x=c=>{e.preventDefault();CMD[c][2]()};
 if(m&&e.shiftKey&&k==='p')x('palette');else if(m&&!e.shiftKey&&k==='p')x('quick');
 else if(m&&e.shiftKey&&k==='f')x('search');else if(m&&e.shiftKey&&k==='e')x('explorer');
 else if(m&&k==='b')x('side');else if(m&&k==='j')x('panel');
 else if(m&&k==='s'){e.preventDefault();save();toast('Saved to browser storage')}
 else if((m&&e.key==='Enter')||e.key==='F5')x('run');
 else if(e.altKey&&k==='n')x('newfile');else if(e.altKey&&k==='w')x('closetab');
 else if(m&&(e.key==='='||e.key==='+'))x('zoomin');else if(m&&e.key==='-')x('zoomout')});
layout();show();
