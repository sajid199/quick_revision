/* MSMP Workflow Configuration Simulator */
/* ---------- constants ---------- */
const STEPS=['Process Global Settings','Maintain Rules','Maintain Agents','Variables & Templates','Maintain Paths','Maint Route Mapping','Generate Versions'];
const SHORT=['Process Global Settings','Rules','Agents','Variables & Templates','Paths','Route Mapping','Generate Versions'];
const REQ_TYPES=['New Account','Change Account','Delete Account','Lock Account','Unlock Account','Change Password'];
const PROC_TYPES=['Access Request','Firefighter Log Review','User Access Review','Role Maintenance'];
const ATTRS=['Request Type','Target System','Risk Level','Role Criticality','Requester Department'];
const ATTRKEY={'Request Type':'reqType','Target System':'system','Risk Level':'risk','Role Criticality':'crit','Requester Department':'dept'};
const AGENT_TYPES=['Rule-based','Specific User','Role','Group'];
const RULE_TYPES=['Initiator Rule','Routing Rule','Agent Rule'];
const RULE_GUIDE=[
 {n:'Initiator Rule',tag:'Starts the workflow',what:'Checks the request when it is submitted and decides which MSMP process and path it should start with.',use:'Use it when different kinds of requests need different workflows, for example New Account vs Change Account, or a request for a critical system.',ret:'A process / path selection (in the simulator: a result like HIGH_RISK or STANDARD).',ex:'If Risk Level = High, return HIGH_RISK. Otherwise return STANDARD.',sim:'Yes. Its result is matched in Step 6 Route Mapping.'},
 {n:'Routing Rule',tag:'Chooses the approval path',what:'Looks at values of the request (risk, system, role criticality, department) and decides which path the request follows after it starts.',use:'Use it to give high risk requests more approval stages and low risk requests fewer. This is the rule you map to a path in Step 6.',ret:'A routing result that Route Mapping converts into a path.',ex:'If Role Criticality = Critical, return HIGH_RISK, so the request goes to the path with a Security stage.',sim:'Yes. Works like the Initiator Rule in this simulator.'},
 {n:'Agent Rule',tag:'Finds the approver',what:'Finds the person who must approve a stage when you do not want to hard code a user. The agent type in Step 3 points to this rule.',use:'Use it for dynamic approvers: line manager, role owner, risk owner, or the owner of the target system. Nobody has to edit the workflow when people change jobs.',ret:'One or more users (or a role / group) who get the work item.',ex:'Role owner rule: read the owner of the requested role and send the work item to that person.',sim:'Shown as text on the agent in Step 3 (e.g. Rule: Role owner). It is not calculated.'},
 {n:'Notification Rule',tag:'Decides who gets the email',what:'Decides whether an email is sent and to whom, based on the request. Templates (Step 4) decide the text. The rule decides the receiver.',use:'Use it when only some requests should notify extra people, for example copy the security team only on high risk requests.',ret:'A list of recipients or a yes / no for sending.',ex:'If Risk Level = High, also send the approval mail to the Security Team.',sim:'Explained only. Not calculated here.'},
 {n:'Escalation / Reminder logic',tag:'Handles delay',what:'Not a separate rule type in this simulator, but part of every path stage: after N days send a reminder, after M days move the work to another agent.',use:'Use it so that a request does not stay stuck when an approver is on leave or busy.',ret:'Reminder mail and escalation to the Escalate to agent.',ex:'Remind after 2 days, escalate to Z_SEC_TEAM after 5 days.',sim:'Set in Step 5. Test it with the No response button in Step 7.'}
];
function ruleGuideHtml(){return '<p>Rules are IF-THEN logic. These are the kinds of rules you meet in MSMP and what each one is used for. Names can differ a little by release.</p>'+RULE_GUIDE.map(r=>`<div class="rg"><div class="rgh"><b>${esc(r.n)}</b><span class="rec">${esc(r.tag)}</span></div><p><b>What it does:</b> ${esc(r.what)}</p><p><b>Used for:</b> ${esc(r.use)}</p><p><b>Returns:</b> ${esc(r.ret)}</p><p><b>Example:</b> ${esc(r.ex)}</p><p><small><b>In this simulator:</b> ${esc(r.sim)}</small></p></div>`).join('')+'<div class="tip">In the real system the logic of every rule is built in BRFplus (a decision table or formula) and linked in MSMP. Always give each rule a default result.</div>'}
const LINKS=[
 ['MSMP Workflow Notes','https://sajid199.github.io/msmp/','Read this for the topic of every step on this page.',1],
 ['SAP Security Notes (main site)','https://shreedharsir.netlify.app/','Shreedhar sir: PFCG, SU24/SU25, roles, troubleshooting.'],
 ['GRC Access Control Interview Questions','https://shreedharsir.netlify.app/sap-grc-ac-interviewquestion','Interview practice for ARA, EAM, ARM and MSMP.'],
 ['GRC Learning Notes','https://sajid199.github.io/GRC-Learning-Notes/','Wider GRC Access Control notes.'],
 ['Practice Questions','https://shreedharsir.netlify.app/another','Test yourself after the steps.'],
 ['SAP Security Mastery','https://shreedharsir.netlify.app/questions','More questions and answers.']
];
const VARS=[
 ['&REQUEST_NO&','Access request number','0000001234'],
 ['&REQUESTOR&','Person who raised the request','Ravi Kumar'],
 ['&REQ_TYPE&','Request type','New Account'],
 ['&SYSTEM&','Target system','S4P'],
 ['&APPROVER&','Current approver','Anita Sharma'],
 ['&STAGE&','Current stage name','Line Manager Approval'],
 ['&RISK_LEVEL&','Risk level found by risk analysis','High'],
 ['&REQ_DATE&','Request date','16.10.2026'],
 ['&COMMENTS&','Comment typed by approver','Please check role access']
];
const INFO={
1:{what:'This is the starting point. You tell the system which process you are building, for example <b>Access Request approval</b>, and set the basic settings for it.',
 why:'Every MSMP workflow lives under one Process ID. If this step is wrong or incomplete, the next 6 steps will not work or will not be picked up by ARM.',
 how:['Go to <b>SPRO &rarr; GRC &rarr; Access Control &rarr; Workflow for Access Control &rarr; Maintain MSMP Workflows</b>.','Do not change the standard process <b>SAP_GRAC_ACCESS_REQUEST</b>. Copy it to your own Z/Y name.','Enter Process ID and a clear description.','Choose the process type.','Tick the request types this workflow will handle (New Account, Change Account and so on).','Set default reminder and escalation days, then click <b>Next</b>.'],
 ex:'Process ID <b>Z_GRAC_ACCESS_REQUEST</b>, copied from SAP_GRAC_ACCESS_REQUEST, handling New Account and Change Account.',
 bad:['Editing the standard SAP process directly.','Forgetting to tick a request type, so that request type never uses your workflow.']},
2:{what:'Rules are <b>IF-THEN logic</b>. A rule looks at a value of the request (for example Risk Level) and returns a result (for example HIGH_RISK).',
 why:'The system needs rules to decide <b>which path</b> a request should follow, and sometimes <b>who the approver</b> should be. Without rules every request would follow the same route.',
 how:['Click <b>Add</b> and give the rule a name.','Choose the rule type. Initiator Rule picks a path. Agent Rule finds an approver.','Choose the attribute the rule checks (Risk Level, Target System and so on).','Add cases: if attribute = value, then return this result.','Set a default result for everything that does not match.','In the real system the logic is built in <b>BRFplus</b> and linked here. In this simulator you type the cases directly.'],
 ex:'Rule <b>Z_RULE_RISK_ROUTE</b>: if Risk Level = High, return HIGH_RISK. Otherwise return STANDARD.',
 bad:['No default result, so some requests match nothing.','Spelling the result differently here and in Route Mapping (Step 6).']},
3:{what:'An <b>agent</b> is an approver. Here you define <b>who</b> can approve at a stage.',
 why:'Paths (Step 5) only say "approval needed at this stage". The Agent tells the system which person, role or rule gives that approval.',
 how:['Click <b>Add</b> and enter an Agent ID.','Choose the agent type: <b>Rule-based</b> (found dynamically, like line manager or role owner), <b>Specific User</b> (one fixed person), <b>Role</b> or <b>Group</b>.','Enter the value (rule name, user ID, role or group).','Tick Allow Delegation if the approver may pass the work item to someone else.'],
 ex:'<b>Z_ROLE_OWNER</b> = Rule-based agent that finds the owner of the requested role. <b>Z_SEC_TEAM</b> = Specific user for security approval.',
 bad:['Using a person as a Specific User for every stage. When they go on leave, requests get stuck.','Agent ID typed differently in the path stage.']},
4:{what:'Here you create <b>notification templates</b> (the emails that are sent) and see the <b>variables</b> you can put inside them, like request number and requester name.',
 why:'Approvers and requesters need to know what is waiting for them. Templates are also needed in Step 5, where each stage chooses which email to send.',
 how:['Under <b>Notification Templates</b> click <b>Add</b>.','Enter a Template ID, recipient type and a subject.','Write the email body. Click a variable chip to insert it at the cursor.','Check the preview on the right side.','Create at least: approval pending, request approved, request rejected.'],
 ex:'Subject: <b>Approval needed for request &amp;REQUEST_NO&amp;</b>. Body: Dear &amp;APPROVER&amp;, &amp;REQUESTOR&amp; has requested &amp;REQ_TYPE&amp;...',
 bad:['Email will not be delivered if SMTP/SOST and the GRC notification settings are not done. Templates alone are not enough.','Typing variable names by hand with spelling mistakes. Use the list.']},
5:{what:'This is the <b>most important step</b>. A path is an approval route made of <b>stages</b> (Stage 1, Stage 2, ...). Each stage says who approves, what email is sent, and when to remind or escalate.',
 why:'This is the actual approval flow the business will see. Different risk levels can have different paths.',
 how:['Click <b>Add</b> to create a path (for example a standard path and a high-risk path).','Select the path and click <b>Add Stage</b>.','For each stage choose the <b>Agent</b> from Step 3.','Choose the <b>notification</b> to send when the stage starts and when it is rejected.','Set <b>reminder days</b> and <b>escalation days</b>, and who the request escalates to.','Use Move Up / Move Down to set the order. Tick Mandatory if the stage cannot be skipped.'],
 ex:'<b>Z_STANDARD</b>: Stage 1 Line Manager &rarr; Stage 2 Role Owner. <b>Z_HIGH_RISK</b>: the same two stages plus Stage 3 Security Team.',
 bad:['A stage with no agent. The request will get stuck.','Reminder days bigger than escalation days.']},
6:{what:'Route Mapping <b>connects rules to paths</b>. It says: "when the rule returns this result, use this path".',
 why:'Rules (Step 2) only return a value. Paths (Step 5) only describe a flow. Route mapping is the glue between them.',
 how:['Click <b>Add</b>.','Pick the rule.','Pick one of the results that rule can return.','Pick the path to use for that result.','Set the <b>Default Path</b>. It is used when nothing matches.'],
 ex:'Z_RULE_RISK_ROUTE returns HIGH_RISK &rarr; path Z_HIGH_RISK. Returns STANDARD &rarr; path Z_STANDARD.',
 bad:['No default path.','Result value in the mapping does not exist in the rule.']},
7:{what:'Final step. The system <b>generates a version</b> of everything you configured and you <b>activate</b> it. Only an active version is used by real requests.',
 why:'Changes in Steps 1 to 6 do nothing until a new version is generated and activated. This is a very common reason for "my change is not working".',
 how:['Click <b>Validate</b> to check for errors.','Click <b>Generate Version</b>.','Select the new version and click <b>Activate</b>.','Make sure the process is linked to your request types in the ARM configuration (Maintain Configuration Settings).','Submit a test access request and check that approvers receive work items.'],
 ex:'You change an escalation from 5 to 3 days. You must generate Version 2 and activate it. Version 1 keeps running until then.',
 bad:['Forgetting to activate the new version.','Testing with a user who is also the approver.']}
};

/* ---------- state ---------- */
function blankState(){return{step:1,learn:true,infoOpen:true,sel:{},msgs:[],
 process:{id:'',desc:'',type:'Access Request',base:'SAP_GRAC_ACCESS_REQUEST',req:{},notifyInit:false,escOn:false,remind:2,escal:5},
 rules:[],agents:[],templates:[],paths:[],routes:[],defaultPath:'',versions:[],
 sim:{input:{reqType:'New Account',system:'S4P',risk:'High',crit:'Normal',dept:'Finance'},run:null}}}
function sampleState(){const s=blankState();
 s.process={id:'Z_GRAC_ACCESS_REQUEST',desc:'Access Request Approval Workflow',type:'Access Request',base:'SAP_GRAC_ACCESS_REQUEST',req:{'New Account':true,'Change Account':true},notifyInit:true,escOn:true,remind:2,escal:5};
 s.rules=[
  {name:'Z_RULE_RISK_ROUTE',desc:'Choose path by risk level',type:'Initiator Rule',attr:'Risk Level',cases:[{op:'=',val:'High',res:'HIGH_RISK'}],def:'STANDARD'},
  {name:'Z_RULE_CRIT_ROLE',desc:'Choose path by role criticality',type:'Initiator Rule',attr:'Role Criticality',cases:[{op:'=',val:'Critical',res:'HIGH_RISK'}],def:'STANDARD'}];
 s.agents=[
  {id:'Z_LINE_MGR',desc:'Line manager of requester',type:'Rule-based',value:'Rule: Manager from user master',deleg:true},
  {id:'Z_ROLE_OWNER',desc:'Owner of requested role',type:'Rule-based',value:'Rule: Role owner',deleg:true},
  {id:'Z_SEC_TEAM',desc:'Security team approver',type:'Specific User',value:'SAJID.AHMAD',deleg:false}];
 s.templates=[
  {id:'Z_APPROVAL_PENDING',recip:'Approver',subject:'Approval needed for request &REQUEST_NO&',body:'Dear &APPROVER&,\n\n&REQUESTOR& has raised a &REQ_TYPE& request for system &SYSTEM& on &REQ_DATE&.\nRisk level: &RISK_LEVEL&.\nStage: &STAGE&.\n\nPlease approve or reject in your inbox.'},
  {id:'Z_REQ_APPROVED',recip:'Requester',subject:'Request &REQUEST_NO& approved',body:'Dear &REQUESTOR&,\n\nYour &REQ_TYPE& request &REQUEST_NO& is fully approved.'},
  {id:'Z_REQ_REJECTED',recip:'Requester',subject:'Request &REQUEST_NO& rejected',body:'Dear &REQUESTOR&,\n\nYour request &REQUEST_NO& was rejected at stage &STAGE&.\nComment: &COMMENTS&'}];
 const st1=(n,a)=>({name:n,agent:a,tpl:'Z_APPROVAL_PENDING',rej:'Z_REQ_REJECTED',remind:2,escal:5,escTo:'Z_SEC_TEAM',mand:true});
 s.paths=[
  {id:'Z_STANDARD',desc:'Standard approval',done:'Z_REQ_APPROVED',stages:[st1('Line Manager Approval','Z_LINE_MGR'),st1('Role Owner Approval','Z_ROLE_OWNER')]},
  {id:'Z_HIGH_RISK',desc:'High risk approval',done:'Z_REQ_APPROVED',stages:[st1('Line Manager Approval','Z_LINE_MGR'),st1('Role Owner Approval','Z_ROLE_OWNER'),st1('Security Approval','Z_SEC_TEAM')]}];
 s.routes=[
  {rule:'Z_RULE_RISK_ROUTE',res:'HIGH_RISK',path:'Z_HIGH_RISK'},
  {rule:'Z_RULE_RISK_ROUTE',res:'STANDARD',path:'Z_STANDARD'},
  {rule:'Z_RULE_CRIT_ROLE',res:'HIGH_RISK',path:'Z_HIGH_RISK'}];
 s.defaultPath='Z_STANDARD';
 return s}
let st;
function load(){try{const j=localStorage.getItem('msmpSim.v1');if(j){st=JSON.parse(j);return}}catch(e){}st=sampleState()}
function save(){try{localStorage.setItem('msmpSim.v1',JSON.stringify(st))}catch(e){}}
function loadSample(){if(confirm('Load sample data? Your current work will be replaced.')){st=sampleState();save();render()}}
function loadBlank(){if(confirm('Start with empty configuration? Your current work will be replaced.')){st=blankState();save();render()}}

/* ---------- helpers ---------- */
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const opt=(arr,sel,blank)=>(blank?'<option value=""></option>':'')+arr.map(a=>`<option ${a===sel?'selected':''}>${esc(a)}</option>`).join('');
function clamp(k,len){let i=st.sel[k]||0;if(i>=len)i=len-1;if(i<0)i=-1;st.sel[k]=i;return i}
function pick(k,i){st.sel[k]=i;save();render()}
function sec(title,body){return `<div class="sec"><div class="sec-h"><span>${title}</span><span class="min" onclick="var b=this.parentNode.nextSibling;b.style.display=b.style.display==='none'?'':'none'">&#8212;</span></div><div class="sec-b">${body}</div></div>`}
let tt;function toast(m,t){const e=document.getElementById('toast');e.textContent=m;e.className='toast '+(t||'');e.style.display='block';clearTimeout(tt);tt=setTimeout(()=>e.style.display='none',2600)}
function fill(txt,ctx){let o=String(txt||'');VARS.forEach(v=>{const val=(ctx&&ctx[v[0]]!=null)?ctx[v[0]]:v[2];o=o.split(v[0]).join(val)});return o}
function ruleResults(r){if(!r)return[];const a=r.cases.map(c=>c.res).filter(x=>x);if(r.def)a.push(r.def);return[...new Set(a)]}
function evalRule(r,inp){const v=inp[ATTRKEY[r.attr]];for(const c of r.cases){if(c.op==='='&&v===c.val)return c.res;if(c.op==='≠'&&v!==c.val)return c.res;if(c.op==='contains'&&String(v).toLowerCase().includes(String(c.val).toLowerCase()))return c.res}return r.def}
/* small screens: give every table cell a label so rows can show as cards */
function labelTables(){document.querySelectorAll('table.tbl').forEach(t=>{const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((c,i)=>c.setAttribute('data-label',h[i]||(c.querySelector('button')?'Remove':'Select'))))})}
function linksHtml(){return `<details class="info lk"><summary>Learning links (Shreedhar sir)</summary><div class="ib"><ul>${LINKS.map(l=>`<li><a href="${l[1]}" target="_blank" rel="noopener">${esc(l[0])}</a>${l[3]?'<span class="rec">best for this step</span>':''}<br><small>${esc(l[2])}</small></li>`).join('')}</ul></div></details>`}

/* ---------- render shell ---------- */
function go(n){if(n<1||n>7)return;st.step=n;save();render();window.scrollTo(0,0)}
function render(){
 document.getElementById('learnChk').checked=st.learn;
 document.getElementById('sim').classList.toggle('hidelearn',!st.learn);
 document.getElementById('hTitle').textContent=`MSMP Workflow Configuration: Step ${st.step}  of 7  (${SHORT[st.step-1]})`;
 const w=document.getElementById('wiz');
 w.innerHTML=STEPS.map((s,i)=>`<div class="ws ${st.step===i+1?'act':''} ${st.step>i+1?'done':''}" onclick="go(${i+1})"><div class="c">${i+1}</div><span class="l">${esc(s)}</span></div>`).join('');
 const a=w.querySelector('.ws.act');if(a)w.scrollLeft=a.offsetLeft-(w.clientWidth-a.offsetWidth)/2;
 const p=st.process;
 let h=`<div class="procrow"><label>Process:</label><input readonly aria-label="Process" value="${esc(p.desc||p.id)}"></div>`+infoHtml(st.step)+linksHtml();
 h+=[null,step1,step2,step3,step4,step5,step6,step7][st.step]();
 document.getElementById('main').innerHTML=h;
 labelTables();
 document.getElementById('bBack').disabled=st.step===1;
 document.getElementById('bNext').disabled=st.step===7;
 if(st.step===4)updPreview();
}
function infoHtml(n){const d=INFO[n];return `<details class="info" ${st.infoOpen?'open':''} ontoggle="st.infoOpen=this.open"><summary>About this stage: ${esc(SHORT[n-1])}</summary><div class="ib"><h4>What it does</h4><p>${d.what}</p><h4>Why it is needed</h4><p>${d.why}</p><h4>How to do it in the system</h4><ol>${d.how.map(x=>`<li>${x}</li>`).join('')}</ol><h4>Example</h4><p>${d.ex}</p><h4>Common mistakes</h4><ul>${d.bad.map(x=>`<li>${x}</li>`).join('')}</ul></div></details>`}

/* ---------- step 1 ---------- */
function step1(){const p=st.process;
 const g=`<div class="grid">
 <label>Process ID</label><input class="w240" value="${esc(p.id)}" oninput="st.process.id=this.value.toUpperCase();save()" placeholder="Z_GRAC_ACCESS_REQUEST">
 <label>Copied from standard</label><input class="w240" readonly value="${esc(p.base)}">
 <label>Description</label><input class="w240" value="${esc(p.desc)}" oninput="st.process.desc=this.value;save()" placeholder="Access Request Approval Workflow">
 <label>Process Type</label><select class="w240" onchange="st.process.type=this.value;save()">${opt(PROC_TYPES,p.type)}</select></div>`;
 const rt=`<div class="chk">${REQ_TYPES.map(r=>`<label><input type="checkbox" ${p.req[r]?'checked':''} onchange="st.process.req['${r}']=this.checked;save()"> ${r}</label>`).join('')}</div>`;
 const nt=`<div class="grid">
 <label>Notify requester at start</label><div><input type="checkbox" ${p.notifyInit?'checked':''} onchange="st.process.notifyInit=this.checked;save()"></div>
 <label>Enable escalation</label><div><input type="checkbox" ${p.escOn?'checked':''} onchange="st.process.escOn=this.checked;save()"></div>
 <label>Default reminder (days)</label><input type="number" min="0" class="w90" value="${p.remind}" oninput="st.process.remind=+this.value;save()">
 <label>Default escalation (days)</label><input type="number" min="0" class="w90" value="${p.escal}" oninput="st.process.escal=+this.value;save()"></div>`;
 return sec('General Data',g)+sec('Request Types handled by this process',rt)+sec('Notification and Timing Defaults',nt)}

/* ---------- step 2 ---------- */
function addRule(){st.rules.push({name:'Z_RULE_'+(st.rules.length+1),desc:'',type:'Initiator Rule',attr:'Risk Level',cases:[],def:''});st.sel.rule=st.rules.length-1;save();render()}
function delRule(){const i=clamp('rule',st.rules.length);if(i<0)return;st.rules.splice(i,1);save();render()}
function addCase(){const i=clamp('rule',st.rules.length);if(i<0)return;st.rules[i].cases.push({op:'=',val:'',res:''});save();render()}
function delCase(k){st.rules[st.sel.rule].cases.splice(k,1);save();render()}
function step2(){const rs=st.rules,i=clamp('rule',rs.length);
 let t=`<div class="toolbar"><button class="btn" onclick="addRule()">Add</button><button class="btn neg" onclick="delRule()">Delete</button></div><div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Rule Name</th><th>Description</th><th>Rule Type</th><th>Check Attribute</th><th>Default Result</th></tr></thead><tbody>`;
 t+=rs.map((r,k)=>`<tr class="${k===i?'sel':''}"><td><input type="radio" name="rr" ${k===i?'checked':''} onclick="pick('rule',${k})"></td>
 <td><input class="w180" value="${esc(r.name)}" oninput="st.rules[${k}].name=this.value;save()"></td>
 <td><input class="w240" value="${esc(r.desc)}" oninput="st.rules[${k}].desc=this.value;save()"></td>
 <td><select onchange="st.rules[${k}].type=this.value;save()">${opt(RULE_TYPES,r.type)}</select></td>
 <td><select onchange="st.rules[${k}].attr=this.value;save()">${opt(ATTRS,r.attr)}</select></td>
 <td><input class="w140" value="${esc(r.def)}" oninput="st.rules[${k}].def=this.value.toUpperCase();save()" placeholder="STANDARD"></td></tr>`).join('');
 t+=`</tbody></table></div>`;if(!rs.length)t+='<p>No rules yet. Click Add.</p>';
 let d='';
 if(i>=0){const r=rs[i];
  d=`<p>Rule <b>${esc(r.name)}</b> checks <b>${esc(r.attr)}</b>. If a case matches, its result is returned. Otherwise the default result <b>${esc(r.def||'(empty)')}</b> is returned.</p>
  <div class="toolbar"><button class="btn" onclick="addCase()">Add Case</button></div>
  <div class="tblwrap"><table class="tbl mw480"><thead><tr><th>IF ${esc(r.attr)}</th><th>Value</th><th>THEN Result</th><th></th></tr></thead><tbody>`+
  r.cases.map((c,k)=>`<tr><td><select onchange="st.rules[${i}].cases[${k}].op=this.value;save()">${opt(['=','≠','contains'],c.op)}</select></td>
  <td><input class="w140" value="${esc(c.val)}" oninput="st.rules[${i}].cases[${k}].val=this.value;save()" placeholder="High"></td>
  <td><input class="w140" value="${esc(c.res)}" oninput="st.rules[${i}].cases[${k}].res=this.value.toUpperCase();save()" placeholder="HIGH_RISK"></td>
  <td><button class="btn neg" onclick="delCase(${k})">&#10005;</button></td></tr>`).join('')+`</tbody></table></div>`;
  d+=`<div class="tip">Possible values: Risk Level = Low / Medium / High. Role Criticality = Normal / Critical. Target System = S4P / ECC / BWP. Department = Finance / IT / HR / Operations. Request Type = the types ticked in Step 1.</div>`}
 return sec('Rules',t)+(d?sec('Rule Logic (like BRFplus decision table)',d):'')+sec('Kinds of rules and their uses',ruleGuideHtml())}

/* ---------- step 3 ---------- */
function addAgent(){st.agents.push({id:'Z_AGENT_'+(st.agents.length+1),desc:'',type:'Rule-based',value:'',deleg:false});st.sel.agent=st.agents.length-1;save();render()}
function delAgent(){const i=clamp('agent',st.agents.length);if(i<0)return;st.agents.splice(i,1);save();render()}
function step3(){const a=st.agents,i=clamp('agent',a.length);
 let t=`<div class="toolbar"><button class="btn" onclick="addAgent()">Add</button><button class="btn neg" onclick="delAgent()">Delete</button></div><div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Agent ID</th><th>Description</th><th>Agent Type</th><th>Value (rule / user / role / group)</th><th>Allow Delegation</th></tr></thead><tbody>`;
 t+=a.map((x,k)=>`<tr class="${k===i?'sel':''}"><td><input type="radio" name="ar" ${k===i?'checked':''} onclick="pick('agent',${k})"></td>
 <td><input class="w180" value="${esc(x.id)}" oninput="st.agents[${k}].id=this.value.toUpperCase();save()"></td>
 <td><input class="w240" value="${esc(x.desc)}" oninput="st.agents[${k}].desc=this.value;save()"></td>
 <td><select onchange="st.agents[${k}].type=this.value;save()">${opt(AGENT_TYPES,x.type)}</select></td>
 <td><input class="w240" value="${esc(x.value)}" oninput="st.agents[${k}].value=this.value;save()"></td>
 <td><input type="checkbox" ${x.deleg?'checked':''} onchange="st.agents[${k}].deleg=this.checked;save()"></td></tr>`).join('');
 t+='</tbody></table></div>';if(!a.length)t+='<p>No agents yet. Click Add.</p>';
 return sec('Agents',t)}

/* ---------- step 4 ---------- */
function addTpl(){st.templates.push({id:'Z_TEMPLATE_'+(st.templates.length+1),recip:'Approver',subject:'',body:''});st.sel.tpl=st.templates.length-1;save();render()}
function delTpl(){const i=clamp('tpl',st.templates.length);if(i<0)return;st.templates.splice(i,1);save();render()}
function updPreview(){const i=clamp('tpl',st.templates.length);const e=document.getElementById('tplPrev');if(!e||i<0)return;const t=st.templates[i];e.textContent='Subject: '+fill(t.subject)+'\n\n'+fill(t.body)}
function insVar(v){const i=clamp('tpl',st.templates.length);if(i<0)return;const ta=document.getElementById('tplBody');const s=ta.selectionStart==null?ta.value.length:ta.selectionStart,e=ta.selectionEnd==null?s:ta.selectionEnd;ta.value=ta.value.slice(0,s)+v+ta.value.slice(e);ta.focus();ta.selectionStart=ta.selectionEnd=s+v.length;st.templates[i].body=ta.value;save();updPreview()}
function step4(){const a=st.templates,i=clamp('tpl',a.length);
 let t=`<div class="toolbar"><button class="btn" onclick="addTpl()">Add</button><button class="btn neg" onclick="delTpl()">Delete</button></div><div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Template ID</th><th>Recipient</th><th>Subject</th></tr></thead><tbody>`;
 t+=a.map((x,k)=>`<tr class="${k===i?'sel':''}"><td><input type="radio" name="tr" ${k===i?'checked':''} onclick="pick('tpl',${k})"></td>
 <td><input class="w240" value="${esc(x.id)}" oninput="st.templates[${k}].id=this.value.toUpperCase();save()"></td>
 <td><select onchange="st.templates[${k}].recip=this.value;save()">${opt(['Approver','Requester','Manager','Security Team'],x.recip)}</select></td>
 <td><input class="w360" value="${esc(x.subject)}" oninput="st.templates[${k}].subject=this.value;save();updPreview()"></td></tr>`).join('');
 t+='</tbody></table></div>';if(!a.length)t+='<p>No templates yet. Click Add.</p>';
 let d='';
 if(i>=0){const x=a[i];d=`<div class="two"><div><p><b>Email body</b> for ${esc(x.id)}</p><textarea id="tplBody" rows="9" oninput="st.templates[${i}].body=this.value;save();updPreview()">${esc(x.body)}</textarea>
 <p class="mt8">Tap a variable to insert it:</p><div class="chips">${VARS.map(v=>`<span class="chip" title="${esc(v[1])}" onclick="insVar('${v[0]}')">${esc(v[0])}</span>`).join('')}</div></div>
 <div><p><b>Preview</b> with sample values</p><div class="prev" id="tplPrev"></div></div></div>`}
 const vt=`<div class="tblwrap"><table class="tbl mw480"><thead><tr><th>Variable</th><th>Meaning</th><th>Sample value</th></tr></thead><tbody>${VARS.map(v=>`<tr><td><code>${esc(v[0])}</code></td><td>${esc(v[1])}</td><td>${esc(v[2])}</td></tr>`).join('')}</tbody></table></div><div class="tip">Variable names here are examples for learning. Check the variable list in your own system for exact names.</div>`;
 return sec('Notification Templates',t)+(d?sec('Template Details',d):'')+sec('Variables',vt)}

/* ---------- step 5 ---------- */
function addPath(){st.paths.push({id:'Z_PATH_'+(st.paths.length+1),desc:'',done:'',stages:[]});st.sel.path=st.paths.length-1;st.sel.stage=0;save();render()}
function delPath(){const i=clamp('path',st.paths.length);if(i<0)return;st.paths.splice(i,1);save();render()}
function addStage(){const i=clamp('path',st.paths.length);if(i<0)return toast('Select or add a path first','E');const p=st.process;st.paths[i].stages.push({name:'Stage '+(st.paths[i].stages.length+1),agent:'',tpl:'',rej:'',remind:p.remind,escal:p.escal,escTo:'',mand:true});st.sel.stage=st.paths[i].stages.length-1;save();render()}
function delStage(){const i=clamp('path',st.paths.length);if(i<0)return;const s=clamp('stage',st.paths[i].stages.length);if(s<0)return;st.paths[i].stages.splice(s,1);save();render()}
function moveStage(d){const i=clamp('path',st.paths.length);if(i<0)return;const a=st.paths[i].stages,s=clamp('stage',a.length),n=s+d;if(s<0||n<0||n>=a.length)return;[a[s],a[n]]=[a[n],a[s]];st.sel.stage=n;save();render()}
function step5(){const ps=st.paths,i=clamp('path',ps.length);
 let t=`<div class="toolbar"><button class="btn" onclick="addPath()">Add</button><button class="btn neg" onclick="delPath()">Delete</button></div><div class="tblwrap"><table class="tbl mw520"><thead><tr><th></th><th>Path ID</th><th>Description</th><th>Final notification (when fully approved)</th></tr></thead><tbody>`;
 const tplIds=st.templates.map(x=>x.id),agIds=st.agents.map(x=>x.id);
 t+=ps.map((x,k)=>`<tr class="${k===i?'sel':''}"><td><input type="radio" name="pr" ${k===i?'checked':''} onclick="pick('path',${k});st.sel.stage=0"></td>
 <td><input class="w180" value="${esc(x.id)}" oninput="st.paths[${k}].id=this.value.toUpperCase();save()"></td>
 <td><input class="w240" value="${esc(x.desc)}" oninput="st.paths[${k}].desc=this.value;save()"></td>
 <td><select onchange="st.paths[${k}].done=this.value;save()">${opt(tplIds,x.done,true)}</select></td></tr>`).join('');
 t+='</tbody></table></div>';if(!ps.length)t+='<p>No paths yet. Click Add.</p>';
 let d='';
 if(i>=0){const p=ps[i],s=clamp('stage',p.stages.length);
  d=`<div class="toolbar"><button class="btn" onclick="addStage()">Add Stage</button><button class="btn neg" onclick="delStage()">Delete Stage</button><button class="btn" onclick="moveStage(-1)">Move Up</button><button class="btn" onclick="moveStage(1)">Move Down</button></div>
  <div class="tblwrap"><table class="tbl mw1000"><thead><tr><th></th><th>No.</th><th>Stage Name</th><th>Agent</th><th>Notification on start</th><th>Notification on reject</th><th>Remind (days)</th><th>Escalate (days)</th><th>Escalate to</th><th>Mandatory</th></tr></thead><tbody>`+
  p.stages.map((x,k)=>`<tr class="${k===s?'sel':''}"><td><input type="radio" name="sr" ${k===s?'checked':''} onclick="pick('stage',${k})"></td><td>${k+1}</td>
  <td><input class="w180" value="${esc(x.name)}" oninput="st.paths[${i}].stages[${k}].name=this.value;save()"></td>
  <td><select onchange="st.paths[${i}].stages[${k}].agent=this.value;save()">${opt(agIds,x.agent,true)}</select></td>
  <td><select onchange="st.paths[${i}].stages[${k}].tpl=this.value;save()">${opt(tplIds,x.tpl,true)}</select></td>
  <td><select onchange="st.paths[${i}].stages[${k}].rej=this.value;save()">${opt(tplIds,x.rej,true)}</select></td>
  <td><input type="number" min="0" class="w60" value="${x.remind}" oninput="st.paths[${i}].stages[${k}].remind=+this.value;save()"></td>
  <td><input type="number" min="0" class="w60" value="${x.escal}" oninput="st.paths[${i}].stages[${k}].escal=+this.value;save()"></td>
  <td><select onchange="st.paths[${i}].stages[${k}].escTo=this.value;save()">${opt(agIds,x.escTo,true)}</select></td>
  <td><input type="checkbox" ${x.mand?'checked':''} onchange="st.paths[${i}].stages[${k}].mand=this.checked;save()"></td></tr>`).join('')+'</tbody></table></div>';
  if(!p.stages.length)d+='<p>This path has no stages. Click Add Stage.</p>';
  if(!st.agents.length||!st.templates.length)d+='<div class="tip">Dropdowns are empty because there are no agents or templates yet. Create them in Step 3 and Step 4 first.</div>'}
 return sec('Paths',t)+(d?sec('Stages of selected path',d):'')}

/* ---------- step 6 ---------- */
function addRoute(){st.routes.push({rule:'',res:'',path:''});st.sel.route=st.routes.length-1;save();render()}
function delRoute(){const i=clamp('route',st.routes.length);if(i<0)return;st.routes.splice(i,1);save();render()}
function step6(){const rs=st.routes,i=clamp('route',rs.length);
 const ruleNames=st.rules.map(r=>r.name),pathIds=st.paths.map(p=>p.id);
 let t=`<div class="toolbar"><button class="btn" onclick="addRoute()">Add</button><button class="btn neg" onclick="delRoute()">Delete</button></div><div class="tblwrap"><table class="tbl mw600"><thead><tr><th></th><th>Rule</th><th>Rule Result</th><th>Route to Path</th></tr></thead><tbody>`;
 t+=rs.map((x,k)=>{const r=st.rules.find(q=>q.name===x.rule);return `<tr class="${k===i?'sel':''}"><td><input type="radio" name="rtr" ${k===i?'checked':''} onclick="pick('route',${k})"></td>
 <td><select onchange="st.routes[${k}].rule=this.value;st.routes[${k}].res='';save();render()">${opt(ruleNames,x.rule,true)}</select></td>
 <td><select onchange="st.routes[${k}].res=this.value;save()">${opt(ruleResults(r),x.res,true)}</select></td>
 <td><select onchange="st.routes[${k}].path=this.value;save()">${opt(pathIds,x.path,true)}</select></td></tr>`}).join('');
 t+='</tbody></table></div>';if(!rs.length)t+='<p>No route mappings yet. Click Add.</p>';
 const dflt=`<div class="grid g-default"><label>Default Path</label><select onchange="st.defaultPath=this.value;save()">${opt(pathIds,st.defaultPath,true)}</select></div><div class="tip">The default path is used when no rule result matches any mapping above.</div>`;
 return sec('Route Mapping',t)+sec('Default Route',dflt)}

/* ---------- validation / versions ---------- */
function validateCfg(c){const m=[];const E=t=>m.push({t:'E',m:t}),W=t=>m.push({t:'W',m:t}),S=t=>m.push({t:'S',m:t});
 if(!c.process.id.trim())E('Step 1: Process ID is empty.');else if(!/^[ZY]/.test(c.process.id))W('Step 1: Custom process IDs should start with Z or Y.');
 if(!Object.values(c.process.req).some(v=>v))E('Step 1: No request type is selected.');
 if(!c.rules.length)E('Step 2: No rules maintained.');
 const dup=(a,f)=>a.map(f).filter((x,i,b)=>x&&b.indexOf(x)!==i);
 dup(c.rules,r=>r.name).forEach(n=>E('Step 2: Duplicate rule name '+n));
 c.rules.forEach(r=>{if(!r.name)E('Step 2: A rule has no name.');if(!r.def)W('Step 2: Rule '+r.name+' has no default result.');if(!r.cases.length)W('Step 2: Rule '+r.name+' has no cases.')});
 if(!c.agents.length)E('Step 3: No agents maintained.');
 dup(c.agents,a=>a.id).forEach(n=>E('Step 3: Duplicate agent '+n));
 c.agents.forEach(a=>{if(!a.value)W('Step 3: Agent '+a.id+' has no value.')});
 if(!c.templates.length)E('Step 4: No notification templates maintained.');
 dup(c.templates,a=>a.id).forEach(n=>E('Step 4: Duplicate template '+n));
 if(!c.paths.length)E('Step 5: No paths maintained.');
 const ag=c.agents.map(a=>a.id),tp=c.templates.map(a=>a.id);
 c.paths.forEach(p=>{if(!p.stages.length)E('Step 5: Path '+p.id+' has no stages.');
  if(p.done&&!tp.includes(p.done))E('Step 5: Path '+p.id+' final notification does not exist.');
  p.stages.forEach((s,k)=>{const w='Step 5: '+p.id+' stage '+(k+1)+' ';
   if(!s.agent)E(w+'has no agent.');else if(!ag.includes(s.agent))E(w+'agent '+s.agent+' does not exist.');
   if(!s.tpl)W(w+'has no start notification.');else if(!tp.includes(s.tpl))E(w+'start notification does not exist.');
   if(s.rej&&!tp.includes(s.rej))E(w+'reject notification does not exist.');
   if(s.escal>0&&!s.escTo)W(w+'escalation days set but no escalation agent.');
   if(s.escTo&&!ag.includes(s.escTo))E(w+'escalation agent does not exist.');
   if(s.remind>s.escal&&s.escal>0)W(w+'reminder days are bigger than escalation days.')})});
 if(!c.routes.length)E('Step 6: No route mapping maintained.');
 c.routes.forEach((r,k)=>{const w='Step 6: Mapping '+(k+1)+' ';const ru=c.rules.find(q=>q.name===r.rule);
  if(!ru)E(w+'rule is missing or does not exist.');else if(!ruleResults(ru).includes(r.res))E(w+'result "'+r.res+'" is not returned by rule '+r.rule+'.');
  if(!c.paths.find(p=>p.id===r.path))E(w+'path is missing or does not exist.')});
 if(!c.defaultPath)E('Step 6: Default path is not set.');else if(!c.paths.find(p=>p.id===c.defaultPath))E('Step 6: Default path does not exist.');
 if(!m.some(x=>x.t==='E'))S('Validation finished. No errors.');
 return m}
function cfgOf(){const o=JSON.parse(JSON.stringify(st));return{process:o.process,rules:o.rules,agents:o.agents,templates:o.templates,paths:o.paths,routes:o.routes,defaultPath:o.defaultPath}}
function doValidate(){st.msgs=validateCfg(cfgOf());save();render();toast(st.msgs.some(x=>x.t==='E')?'Validation found errors':'Validation OK',st.msgs.some(x=>x.t==='E')?'E':'S')}
function genVersion(){const m=validateCfg(cfgOf());st.msgs=m;
 if(m.some(x=>x.t==='E')){save();render();return toast('Cannot generate. Fix the errors first.','E')}
 const n=st.versions.length+1;st.versions.push({no:n,status:'Inactive',on:new Date().toLocaleString('en-GB'),cfg:cfgOf()});st.sel.ver=st.versions.length-1;
 st.msgs.push({t:'S',m:'Version '+n+' generated.'});save();render();toast('Version '+n+' generated','S')}
function actVersion(){const i=clamp('ver',st.versions.length);if(i<0)return toast('Generate a version first','E');st.versions.forEach(v=>v.status='Inactive');st.versions[i].status='Active';st.sim.run=null;st.msgs=[{t:'S',m:'Version '+st.versions[i].no+' is now Active. New requests will use it.'}];save();render();toast('Version activated','S')}
function activeCfg(){const v=st.versions.find(x=>x.status==='Active');return v?v.cfg:null}

/* ---------- step 7 ---------- */
function step7(){const vs=st.versions,i=clamp('ver',vs.length);
 let t=`<div class="toolbar"><button class="btn" onclick="doValidate()">Validate</button><button class="btn em" onclick="genVersion()">Generate Version</button><button class="btn" onclick="actVersion()">Activate</button></div>
 <div class="tblwrap"><table class="tbl mw560"><thead><tr><th></th><th>Version</th><th>Status</th><th>Generated on</th><th>Process ID</th><th>Paths</th></tr></thead><tbody>`;
 t+=vs.map((v,k)=>`<tr class="${k===i?'sel':''}"><td><input type="radio" name="vr" ${k===i?'checked':''} onclick="pick('ver',${k})"></td><td>${v.no}</td><td><span class="badge ${v.status==='Active'?'act':'in'}">${v.status}</span></td><td>${esc(v.on)}</td><td>${esc(v.cfg.process.id)}</td><td>${v.cfg.paths.length}</td></tr>`).join('');
 t+='</tbody></table></div>';if(!vs.length)t+='<p>No version generated yet.</p>';
 const ms=st.msgs.length?st.msgs.map(x=>`<div class="msg ${x.t}"><span>${x.t==='S'?'&#10004;':x.t==='E'?'&#10006;':'&#9888;'}</span><span>${esc(x.m)}</span></div>`).join(''):'<p>Click Validate to check your configuration.</p>';
 return sec('Versions',t)+sec('Messages',ms)+sec('Test Request Simulation',simHtml())}

/* ---------- simulator ---------- */
function simHtml(){const cfg=activeCfg();
 if(!cfg)return '<div class="tip">No active version. Generate and activate a version above. The test uses the <b>active version only</b>, just like the real system.</div>';
 const inp=st.sim.input,reqs=Object.keys(cfg.process.req).filter(k=>cfg.process.req[k]);
 let h=`<p>Running on active version <b>${st.versions.find(v=>v.status==='Active').no}</b> of <b>${esc(cfg.process.id)}</b>.</p>
 <div class="grid g-sim">
 <label>Request Type</label><select onchange="st.sim.input.reqType=this.value">${opt(reqs.length?reqs:REQ_TYPES,inp.reqType)}</select>
 <label>Target System</label><select onchange="st.sim.input.system=this.value">${opt(['S4P','ECC','BWP'],inp.system)}</select>
 <label>Risk Level</label><select onchange="st.sim.input.risk=this.value">${opt(['Low','Medium','High'],inp.risk)}</select>
 <label>Role Criticality</label><select onchange="st.sim.input.crit=this.value">${opt(['Normal','Critical'],inp.crit)}</select>
 <label>Department</label><select onchange="st.sim.input.dept=this.value">${opt(['Finance','IT','HR','Operations'],inp.dept)}</select></div>
 <div class="toolbar mt10"><button class="btn em" onclick="runSim()">Submit Test Request</button></div>`;
 const r=st.sim.run;if(!r)return h;
 h+=`<h4>How the system chose the path</h4><ol class="trace">${r.trace.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
 if(!r.path)return h+'<div class="msg E">No path found. Request would fail.</div>';
 h+=`<h4>Approval flow: ${esc(r.path.id)} &nbsp; <span class="badge ${r.status==='Approved'?'act':'in'}">${esc(r.status)}</span></h4>`;
 h+=r.path.stages.map((s,k)=>{const cls=k<r.idx?(r.rejectedAt===k?'no':'ok'):(k===r.idx&&r.status==='In Process'?'cur':'');const ag=cfg.agents.find(a=>a.id===s.agent);
  let st1=k<r.idx?(r.rejectedAt===k?'Rejected':'Approved'):(k===r.idx&&r.status==='In Process'?'Waiting for approval':'Not started');
  let b='';if(k===r.idx&&r.status==='In Process')b=`<div class="mt6"><button class="btn em" onclick="simAct('a')">Approve</button><button class="btn neg" onclick="simAct('r')">Reject</button><button class="btn" onclick="simAct('e')">No response (wait ${s.escal} days)</button></div>`;
  return `<div class="stage ${cls}"><b>Stage ${k+1}: ${esc(s.name)}</b> &mdash; ${st1}<br><small>Agent: ${esc(s.agent)} (${esc(ag?ag.value:'?')}) | Reminder after ${s.remind} d | Escalate after ${s.escal} d to ${esc(s.escTo||'-')}</small>${b}</div>`}).join('');
 h+=`<h4>Emails sent</h4>`+(r.log.length?r.log.map(x=>`<div class="mail">${esc(x)}</div>`).join(''):'<p>None yet.</p>');
 return h}
function simCtx(stage,approver){const i=st.sim.input,r=st.sim.run;return{'&REQUESTOR&':'Ravi Kumar','&REQ_TYPE&':i.reqType,'&SYSTEM&':i.system,'&RISK_LEVEL&':i.risk,'&STAGE&':stage?stage.name:'-','&APPROVER&':approver||'Approver','&REQUEST_NO&':'0000001234','&COMMENTS&':'Rejected in simulation'}}
function mail(cfg,tplId,to,stage,approver){const t=cfg.templates.find(x=>x.id===tplId);if(!t)return null;const c=simCtx(stage,approver);return 'To: '+to+'\nSubject: '+fill(t.subject,c)+'\n'+fill(t.body,c)}
function startMail(r,cfg){const s=r.path.stages[r.idx];const ag=cfg.agents.find(a=>a.id===s.agent);const m=mail(cfg,s.tpl,(ag?ag.value:s.agent),s,ag?ag.value:s.agent);r.log.push(m||('(No start notification for stage '+(r.idx+1)+')'))}
function runSim(){const cfg=activeCfg();if(!cfg)return;const inp=st.sim.input,trace=[];let chosen=null;
 for(const rt of cfg.routes){const ru=cfg.rules.find(q=>q.name===rt.rule);if(!ru){trace.push('Rule '+rt.rule+' not found. Skipped.');continue}
  const res=evalRule(ru,inp);trace.push('Rule '+ru.name+' checks '+ru.attr+' = "'+inp[ATTRKEY[ru.attr]]+'" and returns '+(res||'(nothing)')+'.');
  if(res===rt.res){chosen=rt.path;trace.push('Route mapping: result '+res+' maps to path '+rt.path+'. Path selected.');break}else trace.push('Route mapping wants '+rt.res+' for this entry. No match, check next.')}
 if(!chosen){chosen=cfg.defaultPath;trace.push('Nothing matched. Using default path '+chosen+'.')}
 const path=cfg.paths.find(p=>p.id===chosen);const run={trace,path,idx:0,status:'In Process',log:[],rejectedAt:-1};
 if(cfg.process.notifyInit)run.log.push('To: Requester\nSubject: Your request 0000001234 is submitted');
 if(path&&path.stages.length)startMail(run,cfg);st.sim.run=run;save();render()}
function simAct(a){const cfg=activeCfg(),r=st.sim.run;if(!cfg||!r)return;const s=r.path.stages[r.idx];const ag=cfg.agents.find(x=>x.id===s.agent);
 if(a==='a'){r.idx++;if(r.idx>=r.path.stages.length){r.status='Approved';const m=mail(cfg,r.path.done,'Requester',s,ag?ag.value:'');if(m)r.log.push(m)}else startMail(r,cfg)}
 else if(a==='r'){r.rejectedAt=r.idx;r.idx++;r.status='Rejected';const m=mail(cfg,s.rej,'Requester',s,ag?ag.value:'');r.log.push(m||'(No reject notification set. Requester gets no email.)')}
 else{const esc2=cfg.agents.find(x=>x.id===s.escTo);r.log.push('After '+s.remind+' days: reminder sent to '+(ag?ag.value:s.agent)+'.');
  if(s.escTo)r.log.push('After '+s.escal+' days: request escalated to '+s.escTo+' ('+(esc2?esc2.value:'?')+').');else r.log.push('After '+s.escal+' days: no escalation agent set. Request stays stuck.')}
 save();render()}

load();render();
