(function installSignup(){
  "use strict";
  const plans=[
    {id:"monthly",name:"Monthly",price:69,duration:"month",billing:"every month",description:"A flexible monthly membership.",tag:"Flexible",detail:"Unlimited class booking · All 3 locations"},
    {id:"quarterly",name:"Quarterly",price:195,duration:"3 months",billing:"every 3 months",description:"Commit to a season of training.",tag:"Save $12",detail:"Unlimited class booking · All 3 locations"},
    {id:"annual",name:"Annual",price:720,duration:"year",billing:"every year",description:"Keep your routine going all year.",tag:"Save $108",detail:"Unlimited class booking · All 3 locations"}
  ];
  const methods=[
    {id:"card",label:"Credit / debit card",caption:"Card checkout simulation"},
    {id:"paypal",label:"PayPal",caption:"Wallet checkout simulation"},
    {id:"applepay",label:"Digital wallet",caption:"Mobile wallet simulation"}
  ];
  const state={step:"details",draft:{first:"",last:"",email:"",phone:"",location:locations[0]},planId:"monthly",paymentMethod:"card",processing:false};
  const $=id=>document.getElementById(id);
  const safe=v=>esc(String(v??""));
  const chosenPlan=()=>plans.find(p=>p.id===state.planId)||plans[0];
  const chosenMethod=()=>methods.find(p=>p.id===state.paymentMethod)||methods[0];
  function insertEntryPoint(){
    const form=document.querySelector("form.onefit-simple-login");
    if(!form||form.parentElement.querySelector(".ofc-signup-trigger"))return;
    const action=document.createElement("div");
    action.className="ofc-signup-trigger";
    action.innerHTML='<div class="ofc-join-divider"><span>New to OneFit Connect?</span></div><button type="button" class="ofc-join-link" onclick="showSignup()">Create a new member account →</button>';
    form.after(action);
  }
  const originalRenderHome=window.renderHome;
  window.renderHome=function(){originalRenderHome();insertEntryPoint();};
  function progress(){
    const order=["details","plan","payment"],pos=order.indexOf(state.step);
    return '<nav class="ofc-join-progress" aria-label="Signup steps">'+order.map((key,i)=>'<div class="'+(i<=pos?'active ':'')+(i===pos?'current':'')+'"><span>'+(i<pos?'✓':(i+1))+'</span>'+["Your details","Choose a plan","Demo checkout"][i]+'</div>').join('')+'</nav>';
  }
  function joinFrame(content){
    $("app").innerHTML=`
      <div class="ofc-join-page">
        <div class="ofc-join-layout">
          <aside class="ofc-join-promo">
            <span class="ofc-join-eyebrow">ONEFIT CONNECT / JOIN THE MOVEMENT</span>
            <h1>One membership.<br><em>Every studio.</em></h1>
            <p>Train where life takes you. Join OneFit and book across all three participating locations.</p>
            <div class="ofc-join-benefits">
              <div><span>01</span><p><b>Move across locations</b><small>One membership for Location 1, 2 and 3</small></p></div>
              <div><span>02</span><p><b>Book on your schedule</b><small>Classes and availability in one place</small></p></div>
              <div><span>03</span><p><b>Keep it all together</b><small>Reservations, attendance, and progress</small></p></div>
            </div>
            <div class="ofc-join-promo-foot">ONEFIT / YOUR STUDIO EVERYWHERE</div>
          </aside>
          <section class="ofc-join-main">
            <div class="ofc-join-main-top"><span>NEW MEMBER</span><button type="button" class="ofc-close-join" onclick="signupCancel()">← Back to home</button></div>
            ${progress()}
            ${content}
          </section>
        </div>
      </div>`;
  }
  function renderDetails(){
    state.step="details";
    joinFrame(`
      <div class="ofc-join-title"><h2>Let's get you started.</h2><p>Enter your information to create a member profile.</p></div>
      <form id="ofc-register-details" onsubmit="signupNext(event)">
        <div class="ofc-signup-grid">
          <label>First name <i>*</i><input name="first" autocomplete="off" required minlength="2" maxlength="50" placeholder="e.g. Aisha" value="${safe(state.draft.first)}"></label>
          <label>Last name <i>*</i><input name="last" autocomplete="off" required minlength="2" maxlength="50" placeholder="e.g. Khan" value="${safe(state.draft.last)}"></label>
        </div>
        <label>Email <i>*</i><input name="email" type="email" autocomplete="off" required maxlength="120" placeholder="e.g. aisha@example.com" value="${safe(state.draft.email)}"></label>
        <label>Phone <i>*</i><input name="phone" type="tel" autocomplete="off" required maxlength="24" placeholder="e.g. 314-555-0123" value="${safe(state.draft.phone)}"></label>
        <label>Password <span>(optional)</span><input name="password" type="password" autocomplete="new-password" placeholder="Not required for this demo"></label>
        <div class="ofc-join-notice">Demo only: password is ignored. Please use sample contact details, not sensitive personal information.</div>
        <label>Home location <i>*</i>
          <select name="location" required>
            ${locations.map(l=>'<option value="'+safe(l)+'" '+(state.draft.location===l?'selected':'')+'>'+safe(l)+'</option>').join('')}
          </select>
        </label>
        <div class="ofc-join-form-actions"><button type="button" class="ofc-light-btn" onclick="signupCancel()">Cancel</button><button type="submit" class="ofc-forward-btn">Continue to plans →</button></div>
        <p class="ofc-existing">Already a member? <button type="button" onclick="signupCancel()">Return to log in</button></p>
      </form>`);
  }
  function renderPlans(){
    state.step="plan";
    joinFrame(`
      <div class="ofc-join-title"><h2>Choose your membership.</h2><p>Every option includes all three studios and unlimited class bookings.</p></div>
      <div class="ofc-plan-list" role="radiogroup" aria-label="Membership plan">
        ${plans.map(p=>'<button type="button" role="radio" aria-checked="'+(state.planId===p.id)+'" class="ofc-plan-choice '+(state.planId===p.id?'selected':'')+'" onclick="signupSelectPlan(\''+p.id+'\')"><span class="ofc-plan-radio"></span><span class="ofc-plan-details"><b>'+p.name+'</b><small>'+p.description+'</small><span>'+p.detail+'</span></span><span class="ofc-plan-price"><strong>$'+p.price+'</strong><small>/ '+p.duration+'</small><em>'+p.tag+'</em></span></button>').join('')}
      </div>
      <div class="ofc-plan-smallprint">Illustrative USD prices only. No subscriptions or real charges will be created.</div>
      <div class="ofc-join-form-actions"><button type="button" class="ofc-light-btn" onclick="signupBack()">← Back</button><button type="button" class="ofc-forward-btn" onclick="signupCheckout()">Continue to checkout →</button></div>`);
  }
  function renderCheckout(){
    state.step="payment";
    const p=chosenPlan();
    joinFrame(`
      <div class="ofc-join-title"><h2>Review your membership.</h2><p>Confirm your signup using the simulated payment gateway.</p></div>
      <div class="ofc-checkout-summary">
        <div><span>Member</span><b>${safe(state.draft.first+' '+state.draft.last)}</b></div>
        <div><span>Home studio</span><b>${safe(state.draft.location)}</b></div>
        <div><span>Membership</span><b>${p.name} · ${p.billing}</b></div>
        <div class="ofc-total"><span>Demo payment amount</span><strong>$${p.price}.00 <small>USD</small></strong></div>
      </div>
      <div class="ofc-pay-heading"><h3>Payment method</h3><span>SIMULATION ONLY</span></div>
      <div class="ofc-payment-methods" role="radiogroup" aria-label="Demo payment methods">
        ${methods.map(m=>'<button type="button" role="radio" aria-checked="'+(state.paymentMethod===m.id)+'" class="'+(state.paymentMethod===m.id?'selected':'')+'" onclick="signupSelectMethod(\''+m.id+'\')"><span class="ofc-pay-radio"></span><span><b>'+m.label+'</b><small>'+m.caption+'</small></span></button>').join('')}
      </div>
      <div class="ofc-payment-warning"><b>Demo payment gateway</b><span>No card numbers, bank details, or real payments are collected. Confirming simulates successful payment and creates your member profile in this browser.</span></div>
      <div class="ofc-join-form-actions"><button type="button" class="ofc-light-btn" onclick="signupBack()">← Back</button><button type="button" class="ofc-forward-btn" id="ofc-confirm-demo" onclick="signupFinish()">Confirm demo payment & create account →</button></div>`);
  }
  window.showSignup=function(){
    state.step="details";state.paymentMethod="card";state.planId="monthly";
    state.draft={first:"",last:"",email:"",phone:"",location:locations[0]};
    document.getElementById("sidebar").classList.remove("show");
    renderDetails();
    window.scrollTo?.({top:0,behavior:"smooth"});
  };
  window.signupCancel=function(){state.processing=false;goHome();};
  window.signupNext=function(event){
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const first=String(data.get("first")||"").trim().replace(/\s+/g," ");
    const last=String(data.get("last")||"").trim().replace(/\s+/g," ");
    const email=String(data.get("email")||"").trim().toLowerCase();
    const phone=String(data.get("phone")||"").trim();
    const location=String(data.get("location")||"");
    if(first.length<2||last.length<2||first.length>50||last.length>50){toast("Enter a valid first and last name.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast("Enter a valid email address.");return;}
    const digits=phone.replace(/\D/g,"");
    if(digits.length<7||digits.length>15){toast("Enter a valid phone number.");return;}
    if(!locations.includes(location)){toast("Select a home location.");return;}
    const fullname=(first+" "+last).toLocaleLowerCase();
    const duplicate=members.find(m=>m.name.toLocaleLowerCase().trim()===fullname||(m.email&&m.email.trim().toLowerCase()===email));
    if(duplicate){toast("This member already exists. Please use Existing Member Login.");return;}
    // The optional password is deliberately NOT retained in state or local storage.
    form.elements.password.value="";
    state.draft={first,last,email,phone,location};
    renderPlans();
  };
  window.signupSelectPlan=function(id){
    if(!plans.some(p=>p.id===id))return;
    state.planId=id;renderPlans();
  };
  window.signupCheckout=function(){renderCheckout();};
  window.signupSelectMethod=function(method){
    if(!methods.some(m=>m.id===method))return;
    state.paymentMethod=method;renderCheckout();
  };
  window.signupBack=function(){
    if(state.step==="payment")renderPlans();
    else renderDetails();
  };
  window.signupFinish=function(){
    if(state.processing||state.step!=="payment")return;
    const d=state.draft;
    if(!d.first||!d.last||!d.email||!d.location){toast("Finish your details first.");return renderDetails();}
    if(members.some(m=>m.name.toLocaleLowerCase().trim()===(d.first+" "+d.last).toLocaleLowerCase()||(m.email&&m.email.toLowerCase()===d.email))){
      toast("That member already exists. Please log in instead.");return;
    }
    state.processing=true;
    const nextId=Math.max(0,...members.map(m=>parseInt(String(m.id).replace(/^M/i,""),10)||0))+1;
    const p=chosenPlan(),payment=chosenMethod();
    const id="M"+String(nextId).padStart(3,"0");
    const createdAt=new Date().toISOString();
    const newMember={id,name:d.first+" "+d.last,email:d.email,phone:d.phone,location:d.location,status:"Active",plan:p.name,planId:p.id,planPrice:p.price,planDuration:p.duration,registeredAt:createdAt,paymentStatus:"Demo confirmed",paymentMethod:payment.label};
    members.push(newMember);
    try{save();}catch(e){members.pop();state.processing=false;toast("Could not save this demo member in the browser.");return;}
    const key="ofc_demo_payments";
    try{
      const old=JSON.parse(localStorage.getItem(key)||"[]");
      old.push({memberId:id,amount:p.price,currency:"USD",plan:p.name,method:payment.label,status:"Demo confirmed — no charge",createdAt});
      localStorage.setItem(key,JSON.stringify(old));
    }catch(_){}
    current.memberId=id;
    state.processing=false;
    enter("member");
    toast("Welcome to OneFit! Demo account "+id+" created successfully.");
  };
  const oldMembersPage=window.membersPage;
  if(typeof oldMembersPage==="function"){
    window.membersPage=function(){
      oldMembersPage();
      const newcomers=members.filter(m=>m.registeredAt).sort((a,b)=>String(b.registeredAt).localeCompare(String(a.registeredAt)));
      if(!newcomers.length)return;
      const section=document.createElement("section");
      section.className="ofc-new-signups";
      section.innerHTML='<div class="section-head"><div><h2>New member signups</h2><div class="muted small">Demo registrations saved in this browser</div></div></div><div class="card table-wrap"><table class="table"><thead><tr><th>ID</th><th>Member</th><th>Home studio</th><th>Plan</th><th>Payment status</th></tr></thead><tbody>'+
        newcomers.map(m=>'<tr><td>'+safe(m.id)+'</td><td>'+safe(m.name)+'<div class="muted small">'+safe(m.email)+'</div></td><td>'+safe(m.location)+'</td><td>'+safe(m.plan||"Standard")+' <span class="muted small">$'+safe(m.planPrice)+'</span></td><td><span class="pill green">Demo confirmed</span></td></tr>').join('')+
        '</tbody></table></div>';
      $("app").prepend(section);
    };
  }
  const oldMemberHome=window.memberHome;
  if(typeof oldMemberHome==="function"){
    window.memberHome=function(){
      oldMemberHome();
      const m=members.find(x=>x.id===current.memberId);
      if(!m||!m.plan)return;
      const panel=document.querySelector(".ofc-membership-strip");
      if(!panel)return;
      const label=document.createElement("div");
      label.className="ofc-my-plan";
      label.innerHTML='<b>'+safe(m.plan)+' membership</b><span>$'+safe(m.planPrice)+' per '+safe(m.planDuration)+' · Demo payment confirmed</span>';
      panel.before(label);
    };
  }
  insertEntryPoint();
})();