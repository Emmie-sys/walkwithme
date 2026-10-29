(()=>{'use strict';
const KEY='wwm-demo-v1',$=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const fmt=t=>new Date(t).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const PL=[{id:'gate',n:'Main Gate',x:12,y:82},{id:'lib',n:'Library',x:42,y:42},{id:'lh',n:'Lecture Hall 1',x:66,y:18},{id:'hostel',n:'Student Hostel A',x:82,y:66},{id:'cafe',n:'Cafeteria',x:28,y:68},{id:'lodge',n:'Off-campus Lodge',x:90,y:90},{id:'shops',n:'Trading Centre Shops',x:10,y:24}];
const pl=id=>PL.find(p=>p.id===id);
const IC={home:'M3 11l9-8 9 8v10h-6v-6H9v6H3z',walk:'M12 2a2 2 0 100 4 2 2 0 000-4zM9 22l2-7-2-3 1-5 4 1 2 4M7 11l3-4',friends:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 010 7M22 21c0-3-2-5-4-5.5',bell:'M6 16V10a6 6 0 1112 0v6l2 2H4zM10 21h4',me:'M12 12a5 5 0 100-10 5 5 0 000 10zM4 22c0-5 4-8 8-8s8 3 8 8'};
const ic=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]}"/></svg>`;
const seed=()=>({user:null,users:[{email:'amina@demo.gu.ac.ug',pw:'Walk1234',name:'Amina Akello',sid:'DEMO-0001'}],
friends:[{id:'f1',name:'Brian Okello',av:'Free to walk'},{id:'f2',name:'Grace Atim',av:'Free to walk'},{id:'f3',name:'Peter Ocen',av:'Busy'},{id:'f4',name:'Sarah Lamunu',av:'Offline'}],
requests:[{id:'r1',name:'Joan Adong'}],invites:[{id:'i1',from:'f1',fromTo:'lib',to:'hostel',mins:12,people:['f2']}],
session:null,history:[{id:'h1',from:'lib',to:'hostel',t:Date.now()-864e5,mins:11,people:['f1'],out:'Completed'},{id:'h2',from:'gate',to:'cafe',t:Date.now()-2*864e5,mins:6,people:[],out:'Cancelled'}],
notes:[{id:'n1',t:Date.now()-36e5,text:'Brian Okello invited you to walk to Student Hostel A.',read:false},{id:'n2',t:Date.now()-72e5,text:'Reminder: tell a friend when you start a late walk.',read:true}],
set:{share:false,approx:true,notif:true,invites:'friends'},emg:{on:false,log:[]},tab:'home',sub:'map',z:1,sd:{}});
let S;const load=()=>{try{const d=JSON.parse(localStorage.getItem(KEY));S=d&&d.users&&d.set?d:seed()}catch(e){S=seed()}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2600)};
const note=text=>{if(S.set.notif)S.notes.unshift({id:'n'+Date.now()+Math.random(),t:Date.now(),text,read:false})};
const fr=id=>S.friends.find(f=>f.id===id);const nm=id=>id==='me'?'You':(fr(id)||{name:'Unknown'}).name;
const unread=()=>S.notes.filter(n=>!n.read).length;
function dlg(html){const d=$('#dlg');d.innerHTML=html;if(!d.open)d.showModal()}
const confirmD=(title,body,act,label,cls='pri')=>dlg(`<h2>${title}</h2><p>${body}</p><div class="row" style="margin-top:16px"><button data-a="close" class="grow">Cancel</button><button class="grow ${cls}" data-a="${act}">${label}</button></div>`);
/* ---------- map (local fallback, no network) ---------- */
const route=s=>{const a=pl(s.from),b=pl(s.to);return[[a.x,a.y],[a.x,b.y],[b.x,b.y]]};
const at=(pts,t)=>{const l=[Math.abs(pts[1][1]-pts[0][1]),Math.abs(pts[2][0]-pts[1][0])],T=l[0]+l[1]||1;let d=Math.max(0,Math.min(1,t))*T;
 if(d<=l[0]||!l[1])return[pts[0][0],pts[0][1]+(pts[1][1]-pts[0][1])*(l[0]?d/l[0]:0)];d-=l[0];return[pts[1][0]+(pts[2][0]-pts[1][0])*(d/l[1]),pts[1][1]]};
function mapSVG(s){const pts=route(s),me=at(pts,s.prog),z=S.z,w=100/z,cx=z>1?Math.max(0,Math.min(100-w,me[0]-w/2)):0,cy=z>1?Math.max(0,Math.min(100-w,me[1]-w/2)):0;
 const roads=PL.map(p=>`<path d="M${p.x} ${p.y}H50V${PL[1].y}" stroke="#fff" stroke-width="2.4" fill="none"/>`).join('');
 const bl=PL.map(p=>`<rect x="${p.x-3}" y="${p.y-3}" width="6" height="6" rx="1" fill="#CFDAD4"/><text x="${p.x}" y="${p.y+8}" font-size="3" text-anchor="middle" fill="#46534D">${esc(p.n)}</text>`).join('');
 const people=s.people.filter(id=>s.sd[id]!==false).map((id,i)=>{const p=at(pts,s.prog-0.08*(i+1));return S.set.approx?`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#0B5D4B22" stroke="#0B5D4B" stroke-dasharray="1.5 1" stroke-width=".5"/><text x="${p[0]}" y="${p[1]+1.2}" font-size="3.2" text-anchor="middle" fill="#0B5D4B">${esc(ini(nm(id)))}</text>`:`<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#fff" stroke="#0B5D4B" stroke-width=".8"/><text x="${p[0]}" y="${p[1]+1}" font-size="2.6" text-anchor="middle">${esc(ini(nm(id)))}</text>`}).join('');
 const youEl=s.sharing?`<circle cx="${me[0]}" cy="${me[1]}" r="3" fill="#0B5D4B" stroke="#fff" stroke-width=".8"/>`:`<circle cx="${me[0]}" cy="${me[1]}" r="3" fill="#8a948f" stroke="#fff" stroke-width=".8"/>`;
 return`<svg class="map" viewBox="${cx} ${cy} ${w} ${w}" role="img" aria-label="Illustrative campus map with simulated positions"><rect width="100" height="100" fill="#EAF0EC"/>${roads}${bl}<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#0B5D4B" stroke-width="1.6" stroke-dasharray="3 1.5" stroke-linecap="round"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="2" fill="#fff" stroke="#0B5D4B"/><path d="M${pts[2][0]} ${pts[2][1]}l-2-5a2.6 2.6 0 115 0z" fill="#F2B544" stroke="#7A5200" stroke-width=".4"/>${people}${youEl}</svg><p class="mut">Illustrative map. Positions are simulated${S.set.approx?' and shown as approximate areas':''}.</p>`}
/* ---------- views ---------- */
const bar=t=>`<header class="bar"><div class="row"><img src="assets/logo.svg" width="32" height="32" alt=""><strong>${t}</strong></div>${S.user?`<button class="sos" data-a="sos" aria-label="Emergency assistance (simulated)">SOS</button>`:''}</header>`;
function welcome(){const m=S.sub==='reg';return bar('Walk with Me').replace(/<button.*<\/button>/,'')+`<main><h1>Walk together, even when apart.</h1><p class="mut">Create a walking session, invite trusted friends, and share an approximate position only while you walk.</p>
<div class="card"><h3>Safety</h3><p class="mut">Coordinate journeys and ask friends to check in.</p><h3 style="margin-top:10px">Connection</h3><p class="mut">Walk with friends on a shared map.</p><h3 style="margin-top:10px">Privacy</h3><p class="mut">Sharing is off by default and stops when the walk ends.</p></div>
<div class="seg" role="tablist"><button role="tab" aria-selected="${!m}" data-a="auth" data-v="in">Sign in</button><button role="tab" aria-selected="${m}" data-a="auth" data-v="reg">Create account</button></div>
<form data-f="${m?'reg':'in'}" novalidate>${m?`<label for="nm">Full name</label><input id="nm" name="name" autocomplete="name"><label for="sid">Student ID</label><input id="sid" name="sid">`:''}
<label for="em">University email</label><input id="em" name="email" type="email" autocomplete="email" ${m?'':'value="amina@demo.gu.ac.ug"'}>
<label for="pw">Password</label><input id="pw" name="pw" type="password" autocomplete="${m?'new-password':'current-password'}" ${m?'':'value="Walk1234"'}>
${m?`<label for="pc">Confirm password</label><input id="pc" name="pc" type="password">`:''}
<label class="row"><input type="checkbox" data-a="showpw" style="width:20px;min-height:0"> Show password</label><div class="err" id="ferr" role="alert"></div>
<button class="pri big" style="margin-top:12px">${m?'Create account':'Sign in'}</button></form>
<p class="mut" style="margin-top:12px">Demo only: no real verification happens. Demo account is pre-filled.</p></main>`}
function shell(inner){const T=[['home','Home','home'],['walk','Walk','walk'],['friends','Friends','friends'],['act','Activity','bell'],['me','Profile','me']];
 return bar('Walk with Me')+`<main>${inner}</main><nav class="tabs" aria-label="Main">${T.map(t=>`<button data-a="tab" data-v="${t[0]}" ${S.tab===t[0]?'aria-current="page"':''}>${ic(t[2])}${t[1]}${t[0]==='act'&&unread()?`<span class="badge">${unread()}</span>`:''}</button>`).join('')}</nav>`}
const person=(f,extra='')=>`<div class="row"><div class="av">${esc(ini(f.name))}</div><div class="grow"><strong>${esc(f.name)}</strong><div class="mut">${esc(f.av)}</div></div>${extra}</div>`;
function home(){const s=S.session;return`<h1>Hi, ${esc(S.user.name.split(' ')[0])}</h1>
${s?`<div class="hero"><h3>Walk in progress</h3><p>To ${esc(pl(s.to).n)} · ${Math.round((1-s.prog)*12)} min left</p><button class="big" data-a="tab" data-v="walk">Open walk</button></div>`:`<div class="hero"><h3>Heading somewhere?</h3><p>Start a walk and invite friends to follow along.</p><button class="big" data-a="tab" data-v="walk">Start a walk</button></div>`}
<div class="row"><button class="grow" data-a="tab" data-v="act" data-s="inv">Join a friend's walk (${S.invites.length})</button></div>
<h2>Free to walk</h2>${S.friends.filter(f=>f.av==='Free to walk').map(f=>`<div class="card">${person(f,`<button class="sm" data-a="inviteTo" data-v="${f.id}">Invite</button>`)}</div>`).join('')||'<div class="empty">No friends are free right now.</div>'}
<h2>Recent walks</h2>${S.history.slice(0,2).map(hrow).join('')||'<div class="empty">No walks yet.</div>'}
<div class="card"><strong>Safety reminders</strong><p class="mut">Share your walk with a friend before leaving. Stay on lit paths. This prototype cannot contact real help.</p></div>`}
const hrow=h=>`<div class="card"><div class="row sp"><strong>${esc(pl(h.from).n)} to ${esc(pl(h.to).n)}</strong><span class="tag ${h.out==='Completed'?'':'w'}">${h.out}</span></div><p class="mut">${fmt(h.t)} · ${h.mins} min · ${h.people.length?h.people.map(nm).map(esc).join(', '):'Walked solo'}</p></div>`;
function walk(){return S.session?active():create()}
function create(){const d=S.sd;return`<h1>New walk</h1><form data-f="start"><label for="fr">Start</label><select id="fr" name="from">${PL.map(p=>`<option value="${p.id}" ${p.id==='lib'?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
<label for="to">Destination</label><input id="to" name="to" list="dl" placeholder="Search landmarks" value="${esc(d.q||'')}"><datalist id="dl">${PL.map(p=>`<option value="${esc(p.n)}">`).join('')}</datalist>
<div style="margin-top:8px">${PL.slice(1,6).map(p=>`<button type="button" class="chip" data-a="dest" data-v="${esc(p.n)}">${esc(p.n)}</button>`).join('')}</div>
<label>Invite friends (optional)</label>${S.friends.map(f=>`<label class="chip"><input type="checkbox" name="inv" value="${f.id}" ${(d.pre||[]).includes(f.id)?'checked':''}>${esc(f.name)}</label>`).join('')}
<label class="row"><input type="checkbox" name="share" ${S.set.share?'checked':''} style="width:20px;min-height:0">Share my approximate position with invited friends during this walk</label>
<div class="card mut">Visible to: only friends you pick. Sharing stops when the walk ends. Sharing is a simulation in this prototype.</div>
<div class="err" id="ferr" role="alert"></div><button class="pri big">Start walk</button></form>`}
function active(){const s=S.session,mins=Math.max(1,Math.round((1-s.prog)*12)),tab=S.sub==='chat'?'chat':'map';
 const body=tab==='map'?mapSVG(s)+`<div class="row wrap"><button class="sm" data-a="zoom" data-v="1">Zoom in</button><button class="sm" data-a="zoom" data-v="-1">Zoom out</button><button class="sm" data-a="recenter">Recenter</button></div>`:chat(s);
 return`<div class="row sp"><h1>To ${esc(pl(s.to).n)}</h1><span class="tag">${s.sharing?'Sharing on':'Sharing off'}</span></div><p class="mut">${mins} min left · started ${fmt(s.start)} · simulated progress</p>
<div class="seg"><button data-a="sub" data-v="map" aria-selected="${tab==='map'}">Map</button><button data-a="sub" data-v="chat" aria-selected="${tab==='chat'}">Chat</button></div>${body}
<h2>Participants</h2><div class="card">${[['me',true]].concat(s.people.map(id=>[id,s.sd[id]!==false])).map(([id,on])=>`<div class="row" style="margin:6px 0"><div class="av">${esc(ini(nm(id)==='You'?S.user.name:nm(id)))}</div><div class="grow">${esc(id==='me'?S.user.name+' (you)':nm(id))}</div><span class="tag ${on?'':'w'}">${id==='me'?(s.sharing?'Sharing':'Paused'):on?'Joined':'Left'}</span></div>`).join('')}</div>
<div class="row wrap"><button class="sm" data-a="shareT">${s.sharing?'Stop sharing':'Resume sharing'}</button><button class="sm" data-a="addFriend">Invite another</button><button class="sm" data-a="report">Report a problem</button></div>
<button class="danger big" style="margin-top:14px" data-a="endAsk">End walk</button>`}
function chat(s){return`<div class="chat card">${s.msgs.length?s.msgs.map(m=>`<div class="msg ${m.me?'me':''}"><div class="mut">${esc(m.me?'You':nm(m.by))} · ${new Date(m.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>${esc(m.text)}</div>`).join(''):'<div class="empty">No messages yet. Say hi.</div>'}</div>
<form data-f="msg" class="row"><label for="mt" class="mut" style="position:absolute;left:-999px">Message</label><input id="mt" name="text" maxlength="200" placeholder="Message" autocomplete="off"><button class="pri">Send</button></form><p class="mut">Messages stay in this browser. Real chat needs a backend.</p>`}
function friends(){const q=(S.sd.fq||'').toLowerCase(),l=S.friends.filter(f=>f.name.toLowerCase().includes(q));
 return`<h1>Friends</h1>${S.requests.length?`<h2>Requests</h2>${S.requests.map(r=>`<div class="card">${person({name:r.name,av:'Wants to connect'},`<button class="sm pri" data-a="reqY" data-v="${r.id}">Accept</button><button class="sm" data-a="reqN" data-v="${r.id}">Decline</button>`)}</div>`).join('')}`:''}
<label for="fq">Search friends</label><input id="fq" data-s="fq" value="${esc(S.sd.fq||'')}" placeholder="Name"><p class="mut">Status shows availability only, never location.</p>
${l.length?l.map(f=>`<div class="card">${person(f,`<button class="sm" data-a="inviteTo" data-v="${f.id}">Walk</button><button class="sm" data-a="rmAsk" data-v="${f.id}" aria-label="Remove ${esc(f.name)}">Remove</button>`)}</div>`).join(''):'<div class="empty">No friends match.</div>'}`}
function act(){const t=S.sub==='inv'?'inv':S.sub==='hist'?'hist':'note';
 const b=t==='inv'?(S.invites.length?S.invites.map(i=>`<div class="card"><div class="row"><div class="av">${esc(ini(nm(i.from)))}</div><div class="grow"><strong>${esc(nm(i.from))}</strong> invited you<div class="mut">${esc(pl(i.fromTo).n)} to ${esc(pl(i.to).n)} · about ${i.mins} min · with ${i.people.map(nm).map(esc).join(', ')||'no one else'}</div></div></div><p class="mut">If you join, only your approximate position is shared during this walk.</p><div class="row" style="margin-top:8px"><button class="pri grow" data-a="invY" data-v="${i.id}">Accept</button><button class="grow" data-a="invN" data-v="${i.id}">Decline</button></div></div>`).join(''):'<div class="empty">No pending invitations.</div>')
 :t==='hist'?(S.history.map(hrow).join('')||'<div class="empty">Completed walks appear here.</div>')
 :`<div class="row sp"><span class="mut">${unread()} unread</span><button class="ghost" data-a="readAll">Mark all read</button></div>${S.notes.map(n=>`<div class="card ${n.read?'':'unread'}"><p>${esc(n.text)}</p><div class="row sp"><span class="mut">${fmt(n.t)}</span>${n.read?'':`<button class="sm" data-a="read" data-v="${n.id}">Mark read</button>`}</div></div>`).join('')||'<div class="empty">All caught up.</div>'}`;
 return`<h1>Activity</h1><div class="seg"><button data-a="sub" data-v="note" aria-selected="${t==='note'}">Alerts</button><button data-a="sub" data-v="inv" aria-selected="${t==='inv'}">Invites</button><button data-a="sub" data-v="hist" aria-selected="${t==='hist'}">History</button></div>${b}`}
const sw=(k,l,d)=>`<label class="sw"><span>${l}<div class="mut">${d}</div></span><input type="checkbox" data-k="${k}" ${S.set[k]?'checked':''}></label>`;
function me(){return`<h1>Profile</h1><div class="card">${person({name:S.user.name,av:S.user.email+' · '+(S.user.sid||'No student ID')})}</div>
<h2>Privacy centre</h2><div class="card">${sw('share','Share my position when I start walks','Off by default. You can still choose per walk.')}${sw('approx','Show approximate areas, not exact points','Applies to everyone on the map.')}${sw('notif','Notifications','Create alerts for invites and walk events.')}
<label for="inv">Who can invite me</label><select id="inv" data-k="invites"><option value="friends" ${S.set.invites==='friends'?'selected':''}>Friends only</option><option value="none" ${S.set.invites==='none'?'selected':''}>No one</option></select></div>
<p class="mut">Stored in this browser only: your profile, settings, friends, walks and messages. Clearing it does not affect any server, because there is none.</p>
<div class="card"><strong>Emergency log (simulated)</strong>${S.emg.log.length?S.emg.log.map(l=>`<p class="mut">${fmt(l.t)} · ${esc(l.text)}</p>`).join(''):'<p class="mut">No incidents.</p>'}</div>
<button class="big" data-a="resetAsk">Clear demo data</button><button class="big" style="margin-top:10px" data-a="out">Sign out</button>`}
function render(){const a=$('#app');if(!S.user){a.innerHTML=welcome();return}
 const V={home,walk,friends,act,me};a.innerHTML=shell((S.emg.on?`<div class="alert" role="alert"><strong>Simulated alert active</strong><p>Nobody real was contacted. In a real product, ${S.session&&S.session.people.length?S.session.people.map(nm).map(esc).join(', '):'your trusted contacts'} would be notified.</p><div class="row"><button class="grow" data-a="safe">I'm safe</button><button class="grow" data-a="cancelAlert">Cancel false alarm</button></div></div>`:'')+V[S.tab]());save()}
/* ---------- actions ---------- */
function startWalk(f){const to=PL.find(p=>p.n.toLowerCase()===f.to.trim().toLowerCase()),fe=$('#ferr');
 if(!to){fe.textContent='Choose a destination from the list.';return}if(to.id===f.from){fe.textContent='Start and destination must differ.';return}
 S.session={from:f.from,to:to.id,people:f.inv,start:Date.now(),prog:0,sharing:f.share,sd:{},msgs:[{by:f.inv[0]||'f1',t:Date.now(),text:f.inv.length?'I am following your walk.':'Tip: invite a friend any time.'}]};S.sd={};S.sub='map';
 note(`Walk started to ${to.n}${f.inv.length?' with '+f.inv.map(nm).join(', '):''}.`);f.inv.forEach(id=>note(`${nm(id)} accepted your invitation (simulated).`));tick.start();render();toast('Walk started')}
function endWalk(out){const s=S.session;if(!s)return;S.history.unshift({id:'h'+Date.now(),from:s.from,to:s.to,t:s.start,mins:Math.max(1,Math.round((Date.now()-s.start)/6e4)),people:s.people,out});note(`Walk ${out.toLowerCase()}. Sharing stopped.`);S.session=null;S.emg.on=false;tick.stop();render();toast('Walk ended. Sharing stopped.')}
const tick={h:0,start(){clearInterval(this.h);this.h=setInterval(()=>{const s=S.session;if(!s){this.stop();return}s.prog=Math.min(1,s.prog+.03);if(s.prog>=1){endWalk('Completed');return}if(S.tab==='walk'&&S.sub==='map'&&!$('#dlg').open&&!document.activeElement.closest('form'))render()},2500)},stop(){clearInterval(this.h)}};
const A={close:()=>$('#dlg').close(),
auth:v=>{S.sub=v;render()},showpw:(e)=>document.querySelectorAll('input[name=pw],input[name=pc]').forEach(i=>i.type=e.checked?'text':'password'),
tab:(v,e)=>{S.tab=v;if(e.dataset.s)S.sub=e.dataset.s;else if(v==='act')S.sub='note';else S.sub='map';render();scrollTo(0,0)},
sub:v=>{S.sub=v;render()},dest:v=>{S.sd.q=v;S.tab='walk';readForm();render()},
inviteTo:v=>{S.sd={pre:[v]};S.tab='walk';render()},zoom:v=>{S.z=Math.max(1,Math.min(3,S.z+ +v));render()},recenter:()=>{S.z=1;render()},
shareT:()=>{const s=S.session;s.sharing=!s.sharing;note('Location sharing '+(s.sharing?'resumed':'stopped')+' for this walk.');render();toast(s.sharing?'Sharing resumed':'Sharing stopped')},
addFriend:()=>{const o=S.friends.filter(f=>!S.session.people.includes(f.id));if(!o.length){toast('Everyone is already invited');return}dlg(`<h2>Invite another friend</h2>${o.map(f=>`<button class="big" style="margin:4px 0" data-a="addF" data-v="${f.id}">${esc(f.name)}</button>`).join('')}<button class="big ghost" data-a="close">Cancel</button>`)},
addF:v=>{S.session.people.push(v);note(`${nm(v)} joined your session (simulated).`);A.close();render();toast('Invitation sent (simulated)')},
report:()=>dlg(`<h2>Report a problem</h2><p>This prototype stores the report locally only. It is not sent to anyone.</p><div class="row"><button class="grow" data-a="close">Cancel</button><button class="grow pri" data-a="repOk">Save report</button></div>`),
repOk:()=>{S.emg.log.unshift({t:Date.now(),text:'Problem reported (local only)'});A.close();render();toast('Saved locally')},
endAsk:()=>confirmD('End this walk?','Position sharing for this session will stop.','endOk','End walk','danger'),endOk:()=>{A.close();endWalk(S.session.prog>=.9?'Completed':'Cancelled')},
sos:()=>dlg(`<h2>Emergency assistance</h2><p><strong>Simulation only.</strong> This prototype does not contact security, police or anyone else. It shows how an alert would look.</p><p>${S.session&&S.session.people.length?'Session participants who would be notified: '+S.session.people.map(nm).map(esc).join(', '):'No session participants would be notified. Start a walk with friends first.'}</p><div class="row" style="margin-top:14px"><button class="grow" data-a="close">Close</button><button class="grow danger" data-a="sosOk">Send simulated alert</button></div><button class="big" style="margin-top:10px" data-a="checkin">Safety check-in: I'm OK</button>`),
sosOk:()=>{S.emg.on=true;S.emg.log.unshift({t:Date.now(),text:'Simulated alert raised'});note('Simulated emergency alert raised.');A.close();render()},
checkin:()=>{S.emg.log.unshift({t:Date.now(),text:'Safety check-in sent (simulated)'});note('Safety check-in recorded.');A.close();render();toast('Check-in recorded')},
cancelAlert:()=>{S.emg.on=false;S.emg.log.unshift({t:Date.now(),text:'False alarm cancelled'});render();toast('Alert cancelled')},safe:()=>{S.emg.on=false;S.emg.log.unshift({t:Date.now(),text:'Marked safe'});note('You marked yourself safe.');render();toast('Marked safe')},
invY:v=>{const i=S.invites.find(x=>x.id===v);if(!i)return;S.invites=S.invites.filter(x=>x.id!==v);if(S.session){toast('Finish your current walk first');S.invites.push(i);return}
 S.session={from:i.fromTo,to:i.to,people:[i.from,...i.people],start:Date.now(),prog:0,sharing:S.set.share,sd:{},msgs:[{by:i.from,t:Date.now(),text:'Glad you joined!'}]};note(`You joined ${nm(i.from)}'s walk.`);S.tab='walk';S.sub='map';tick.start();render();toast('Joined. You are now participating.')},
invN:v=>{S.invites=S.invites.filter(x=>x.id!==v);note('You declined an invitation.');render();toast('Invitation declined')},
reqY:v=>{const r=S.requests.find(x=>x.id===v);S.requests=S.requests.filter(x=>x.id!==v);if(r)S.friends.push({id:'f'+Date.now(),name:r.name,av:'Free to walk'});render();toast('Friend added')},reqN:v=>{S.requests=S.requests.filter(x=>x.id!==v);render()},
rmAsk:v=>confirmD('Remove friend?',`${esc(nm(v))} will no longer be invited to your walks.`,'rmOk','Remove','danger')||($('#dlg').dataset.v=v),
rmOk:()=>{const v=$('#dlg').dataset.v;S.friends=S.friends.filter(f=>f.id!==v);A.close();render();toast('Friend removed')},
read:v=>{const n=S.notes.find(x=>x.id===v);if(n)n.read=true;render()},readAll:()=>{S.notes.forEach(n=>n.read=true);render()},
out:()=>{S.user=null;S.sub='in';tick.stop();render()},resetAsk:()=>confirmD('Clear demo data?','This resets this browser\'s prototype data. No server data exists.','resetOk','Clear data','danger'),
resetOk:()=>{try{localStorage.removeItem(KEY)}catch(e){}tick.stop();S=seed();A.close();render();toast('Demo data cleared')}};
function readForm(){const f=document.querySelector('form[data-f=start]');if(!f)return;const d=new FormData(f);S.sd.pre=d.getAll('inv');S.sd.q=d.get('to')||S.sd.q}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const fn=A[t.dataset.a];if(!fn)return;
 if(t.dataset.a==='rmAsk'){fn(t.dataset.v);$('#dlg').dataset.v=t.dataset.v;return}fn(t.dataset.v,t)});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.s){S.sd[t.dataset.s]=t.value;const p=t.selectionStart;render();const n=document.querySelector(`[data-s=${t.dataset.s}]`);n.focus();n.setSelectionRange(p,p)}});
document.addEventListener('change',e=>{const t=e.target,k=t.dataset.k;if(!k)return;S.set[k]=t.type==='checkbox'?t.checked:t.value;if(k==='share'||k==='approx')note('Location-sharing preference changed.');render();toast('Setting saved')});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),k=f.dataset.f,err=$('#ferr');
 if(k==='in'){const u=S.users.find(x=>x.email===d.email.trim().toLowerCase()&&x.pw===d.pw);if(!u){err.textContent='Email or password is not right. Try the demo account.';return}S.user=u;S.tab='home';render();toast('Signed in (demo)')}
 if(k==='reg'){const em=(d.email||'').trim().toLowerCase();if(d.name.trim().length<2)return void(err.textContent='Enter your full name.');if(!/^\S+@\S+\.\S+$/.test(em))return void(err.textContent='Enter a valid university email.');
  if(!d.sid.trim())return void(err.textContent='Enter your student ID.');if(d.pw.length<8)return void(err.textContent='Password needs at least 8 characters.');if(d.pw!==d.pc)return void(err.textContent='Passwords do not match.');if(S.users.some(u=>u.email===em))return void(err.textContent='That email already has an account.');
  const u={email:em,pw:d.pw,name:d.name.trim(),sid:d.sid.trim()};S.users.push(u);S.user=u;S.tab='home';render();toast('Account created (demo, not verified)')}
 if(k==='start')startWalk({from:d.from,to:d.to||'',inv:new FormData(f).getAll('inv'),share:!!d.share});
 if(k==='msg'){const t=(d.text||'').trim();if(!t){toast('Type a message first');return}S.session.msgs.push({me:true,by:'me',t:Date.now(),text:t});render();const i=$('#mt');i&&i.focus()}});
load();if(S.session)tick.start();render();
})();
