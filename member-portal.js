(function installMemberPortal(){
  "use strict";
  const iconPaths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="m9 16 2 2 4-5"/>',
    bookings:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h8M8 18h5"/>',
    activity:'<path d="M4 21v-6h4v6M10 21V9h4v12M16 21V4h4v17"/><path d="M3 11 8 8l5 1 7-6"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    star:'<path d="m12 3 2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/>',
    trend:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    award:'<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    arrow:'<path d="m9 18 6-6-6-6"/>',
    flame:'<path d="M12 22c5 0 8-3.2 8-8 0-3-1.7-5.9-4-8 0 2-1 3-2 4C14 7 11 4.5 9 2c0 4-5 7-5 12 0 4.8 3 8 8 8Z"/>'
  };
  function ico(name,size=20){return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(iconPaths[name]||iconPaths.star)+'</svg>';}
  function formatDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function classForBooking(b){return classes.find(c=>c.id===b.classId);}
  function presentVisits(m){return attendance.filter(a=>a.memberId===m.id && a.status==='Present');}
  function visitDate(a){let c=classes.find(c=>c.id===a.classId);return c?.date || (a.markedAt || '').slice(0,10);}
  function upcomingBookings(m){const day=formatDay(new Date());return bookings.filter(b=>b.memberId===m.id && b.status==='Booked' && classForBooking(b) && classForBooking(b).date>=day);}
  function member(){return members.find(m=>m.id===current.memberId) || members[0];}
  function memberOptionMarkup(){return members.map(m=>'<option value="'+esc(m.name)+'"></option><option value="'+esc(m.id)+'"></option>').join('');}
  function nameChoices(){
    const input=document.getElementById('memberLoginName');
    if(!input)return;
    input.setAttribute('list','onefit-member-names');
    let dl=document.getElementById('onefit-member-names');
    if(!dl){dl=document.createElement('datalist');dl.id='onefit-member-names';document.body.appendChild(dl);}
    dl.innerHTML=memberOptionMarkup();
    input.placeholder='Try Aisha Khan or M001';
    input.setAttribute('aria-label','Enter your full name or member ID');
  }
  const oldRenderHome=window.renderHome;
  window.renderHome=function(){oldRenderHome();nameChoices();};
  const oldGoHome=window.goHome;
  window.goHome=function(){
    document.body.classList.remove('member-mode');
    document.getElementById('memberTopIdentity')?.remove();
    oldGoHome();
  };
  const oldNavigate=window.navigate;
  let insightRange='week';
  window.navigate=function(page,btn){
    if(current.role==='member'){
      document.querySelectorAll('#sidebar .navbtn').forEach(b=>b.classList.toggle('active',b.dataset.memberPage===page));
      if(page==='activity')return memberActivity();
      if(page==='profile')return memberProfile();
    }
    return oldNavigate(page,btn);
  };
  function updateMemberHeader(){
    const m=member();
    let badge=document.getElementById('memberTopIdentity');
    if(!badge){
      badge=document.createElement('div');
      badge.id='memberTopIdentity';
      badge.className='member-top-identity';
      const buttons=document.querySelector('.top-actions');
      buttons.insertBefore(badge,document.getElementById('homeBtn'));
    }
    badge.innerHTML='<span>'+esc(m.name)+'</span><small>Member · Home: '+esc(m.location)+'</small>';
    document.getElementById('roleTag').textContent='Member';
    document.getElementById('homeBtn').textContent='Switch role ⌄';
  }
  const originalEnter=window.enter;
  window.enter=function(role){
    document.body.classList.toggle('member-mode',role==='member');
    originalEnter(role);
    if(role!=='member'){
      document.getElementById('memberTopIdentity')?.remove();
      document.getElementById('homeBtn').textContent='Exit portal';
      return;
    }
    const tabs=[['Home','member','home'],['Book a Class','classes','calendar'],['My Bookings','mybookings','bookings'],['My Activity','activity','activity'],['Profile','profile','profile']];
    document.getElementById('sidebar').innerHTML=tabs.map((t,i)=>'<button class="navbtn '+(i===0?'active':'')+'" data-member-page="'+t[1]+'" onclick="navigate(\''+t[1]+'\',this)">'+ico(t[2])+t[0]+'</button>').join('');
    updateMemberHeader();
  };
  window.memberLogin=function(event){
    event.preventDefault();
    const field=document.getElementById('memberLoginName');
    const text=field.value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
    if(!text){field.focus();return;}
    const normalized=m=>m.name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
    let found=members.filter(m=>m.id.toLowerCase()===text||normalized(m)===text);
    if(!found.length && !text.includes(' ')){
      found=members.filter(m=>normalized(m).split(' ')[0]===text);
    }
    if(found.length!==1){
      toast(found.length?'More than one member has that name. Please use the full name or Member ID.':'Member not found. Try a registered full name or Member ID.');
      field.focus();return;
    }
    current.memberId=found[0].id;
    const password=document.getElementById('memberLoginPassword');
    if(password) password.value='';
    enter('member');
  };
  function displayStat(icon,title,value,subtitle){
    return '<div class="member-stat"><div class="member-stat-icon">'+ico(icon)+'</div><div><b>'+value+'</b><span>'+title+(subtitle?'<br>'+subtitle:'')+'</span></div></div>';
  }
  function preferredRecommendations(m){
    const day=formatDay(new Date());
    const available=classes.filter(c=>c.date>=day&&c.booked<c.capacity).filter(c=>!bookings.some(b=>b.memberId===m.id&&b.classId===c.id&&b.status==='Booked'));
    let selected=[];
    ['HIIT','Yoga','Strength'].forEach(t=>{const c=available.find(c=>c.type===t&&!selected.includes(c));if(c)selected.push(c);});
    available.forEach(c=>{if(selected.length<3&&!selected.includes(c))selected.push(c);});
    return selected.slice(0,3);
  }
  function recCard(c){
    const imageType=['HIIT','Yoga','Strength'].includes(c.type)?c.type.toLowerCase():'other';
    return '<article class="member-rec"><div class="member-rec-photo '+imageType+'" role="img" aria-label="'+esc(c.type)+' class"></div><div class="member-rec-detail"><b>'+esc(c.name)+'</b><small>'+esc(c.date)+' · '+esc(c.time)+'</small><small>'+esc(c.location)+'</small><button onclick="recommendBook(\''+esc(c.id)+'\')">Book</button></div></article>';
  }
  window.recommendBook=function(id){
    const count=bookings.length;
    bookClass(id);
    if(bookings.length>count){window.navigate('member');}
  };
  window.setInsightRange=function(range){
    insightRange=['week','month','all'].includes(range)?range:'week';
    memberHome();
  };
  window.memberHome=function(){
    const m=member(),visits=presentVisits(m),mine=upcomingBookings(m),d=new Date(),start=new Date(d);
    start.setHours(0,0,0,0);
    start.setDate(start.getDate()-((start.getDay()+6)%7));
    const weekStart=formatDay(start),monthStart=formatDay(new Date(d.getFullYear(),d.getMonth(),1));
    const weekVisits=visits.filter(a=>visitDate(a)>=weekStart), monthVisits=visits.filter(a=>visitDate(a)>=monthStart);
    const rangeVisits=insightRange==='week'?weekVisits:insightRange==='month'?monthVisits:visits;
    const goal=4,percent=Math.min(100,Math.round(weekVisits.length/goal*100));
    const days=Array.from({length:7},(_,i)=>{
      const date=new Date(start);date.setDate(start.getDate()+i);
      const attended=visits.some(a=>visitDate(a)===formatDay(date));
      const isToday=formatDay(date)===formatDay(new Date());
      return '<div class="member-day '+(attended?'checked':'')+' '+(isToday?'current':'')+'"><span class="circle">'+(attended?ico('check',15):'')+'</span>'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]+'</div>';
    }).join('');
    const recommended=preferredRecommendations(m);
    const rangeTabs=[['week','This Week'],['month','This Month'],['all','All Time']].map(a=>'<button class="'+(insightRange===a[0]?'selected':'')+'" onclick="setInsightRange(\''+a[0]+'\')">'+a[1]+'</button>').join('');
    document.getElementById('app').innerHTML=`
      <div class="member-dashboard">
        <section class="member-welcome"><h1>Hi, ${esc(m.name.split(/\s+/)[0])}!</h1><p>Welcome back to OneFit Connect.<br>One membership. Three locations.</p><span class="tag">${ico('pin',15)} &nbsp; Home Location: ${esc(m.location)}</span></section>
        <section><h2 class="member-section-title">Your Overview</h2><div class="member-stats">
          ${displayStat('calendar','Classes Attended',visits.length,'Recorded check-ins')}
          ${displayStat('bookings','Upcoming Classes',mine.length,'Across all locations')}
          ${displayStat('star','Studio Rating','4.7 / 5','Illustrative demo score')}
          ${displayStat('pin','Locations Access','3','Locations 1, 2 and 3')}
        </div></section>
        <section class="member-panels">
          <div class="member-panel">
            <div class="member-panel-header"><div class="member-panel-title">${ico('calendar')} This Week at a Glance</div><button class="member-inline-link" onclick="navigate('activity')">View Activity ${ico('arrow',15)}</button></div>
            <div class="member-week-progress"><span>Classes attended: <b>${weekVisits.length} of ${goal} goal</b></span><div class="member-progress-line"><i style="width:${percent}%"></i></div><strong>${weekVisits.length} / ${goal}</strong></div>
            <div class="member-week-days">${days}</div>
          </div>
          <div class="member-panel">
            <div class="member-panel-header"><div class="member-panel-title">${ico('activity')} Your Fitness Insights</div><div class="member-range">${rangeTabs}</div></div>
            <div class="member-insight-row">
              <div class="member-donut" style="--progress:${percent}%"><div class="member-donut-inner"><b>${percent}%</b><small>Weekly goal</small></div></div>
              <div class="member-insight-item"><span class="symbol">🔥</span><strong>${(rangeVisits.length*360).toLocaleString()}</strong><span>Est. calories*</span></div>
              <div class="member-insight-item"><span class="symbol">◷</span><strong>${rangeVisits.length*60} min</strong><span>Est. workout time*</span></div>
              <div class="member-insight-item"><span class="symbol">✓</span><strong>${rangeVisits.length}</strong><span>Classes attended</span></div>
            </div>
            <div style="font-size:10px;color:#8290a7;margin-top:9px">*Illustrative estimates of 60 minutes and 360 calories per attended class, not tracked workout data.</div>
          </div>
          <div class="member-panel">
            <div class="member-panel-header"><div><div class="member-panel-title">${ico('star')} Recommended for You</div><div class="muted small">Available classes across your three locations.</div></div><button class="member-inline-link" onclick="navigate('classes')">View All ${ico('arrow',15)}</button></div>
            <div class="member-recs">${recommended.length?recommended.map(recCard).join(''):'<div class="member-empty">No available classes to recommend right now. Browse the full schedule for updates.</div>'}</div>
          </div>
          <div class="member-panel">
            <div class="member-panel-header"><div class="member-panel-title">${ico('award')} Membership</div></div>
            <div class="member-plan">
              <div class="member-plan-main"><span class="member-plan-chip">Standard Plan</span><span class="member-plan-live">${esc(m.status||'Active')}</span><div class="member-plan-sub">Unlimited access · All 3 locations</div></div>
              <div class="member-plan-info"><p>${ico('calendar',15)} &nbsp; Billing: Demo only</p><p>${ico('bookings',15)} &nbsp; No payment details collected</p></div>
              <button class="plan-button" onclick="manageDemoPlan()">Manage Plan ${ico('arrow',15)}</button>
            </div>
          </div>
        </section>
        <p style="font-size:11px;color:#7f8da8;margin:0">Prototype dashboard. Booking and attendance metrics use your saved demo records; plan, rating and estimated fitness figures are illustrative.</p>
      </div>`;
  };
  window.manageDemoPlan=function(){
    document.getElementById('modal').innerHTML='<h2>Standard Membership · Demo</h2><p>Your sample membership is active across all three OneFit locations. This prototype does not process payments or change real billing information.</p><p class="muted small">For the demonstration, use Book a Class or My Bookings to manage your sessions.</p><button onclick="closeModal()">Got it</button>';
    openModal();
  };
  window.memberActivity=function(){
    const m=member(),visits=presentVisits(m),recent=visits.slice().sort((a,b)=>visitDate(b).localeCompare(visitDate(a)));
    const active=bookings.filter(b=>b.memberId===m.id && b.status==='Booked');
    document.getElementById('app').innerHTML=`
      <div class="member-app-page">
      ${heading('My Activity','Your class attendance and bookings at all three locations')}
      <div class="member-stats" style="margin:18px 0 19px">
        ${displayStat('calendar','Recorded Visits',visits.length,'All time')}
        ${displayStat('bookings','Booked Classes',active.length,'Active reservations')}
        ${displayStat('pin','Home Location',esc(m.location),'Your home studio')}
        ${displayStat('activity','Available Studios',3,'One membership')}
      </div>
      <div class="member-panel">
        <div class="member-panel-title">${ico('activity')} Attendance History</div>
        <div class="member-activity-list" style="margin-top:14px">
        ${recent.length?recent.map(a=>{const c=classes.find(c=>c.id===a.classId);return '<div class="member-activity-line"><div><strong>'+esc(c?.name||'Class session')+'</strong><small>'+esc(visitDate(a))+' · '+esc(c?.location||'OneFit')+'</small></div><span class="pill green">Attended</span></div>';}).join(''):'<div class="member-empty">No attendance recorded yet. Book a class and ask front-desk staff to check you in.</div>'}
        </div>
        <button style="margin-top:17px" onclick="navigate('classes')">Book a Class ${ico('arrow',15)}</button>
      </div></div>`;
  };
  window.memberProfile=function(){
    const m=member();
    document.getElementById('app').innerHTML=`
      <div class="member-app-page">
      ${heading('My Profile','Update your demo member details')}
      <div class="member-panel member-profile-form">
        <div class="member-panel-title">${ico('profile')} Member Information</div>
        <div class="muted small" style="margin:8px 0 18px">Member ID: <strong>${esc(m.id)}</strong> · Changes stay in this browser for the prototype.</div>
        <form onsubmit="saveMemberProfile(event)">
          <label>Full Name<input name="fullName" value="${esc(m.name)}" required minlength="2" maxlength="90"></label>
          <label>Email (demo)<input type="email" name="email" value="${esc(m.email||'')}" placeholder="Optional"></label>
          <label>Home Location<select name="location">${locations.map(l=>'<option '+(m.location===l?'selected':'')+'>'+esc(l)+'</option>').join('')}</select></label>
          <button type="submit">Save Profile</button>
        </form>
        <div class="notice" style="margin-top:17px">Use your updated name or your Member ID to log in next time. Password remains optional and is not stored in this prototype.</div>
      </div></div>`;
  };
  window.saveMemberProfile=function(e){
    e.preventDefault();
    const form=new FormData(e.target),m=member();
    const name=String(form.get('fullName')||'').trim().replace(/\s+/g,' ');
    if(!name){toast('Enter a name.');return;}
    const collision=members.some(x=>x.id!==m.id&&x.name.toLowerCase()===name.toLowerCase());
    if(collision){toast('Another demo member already has that name. Choose a distinct name.');return;}
    m.name=name;
    m.email=String(form.get('email')||'').trim();
    m.location=String(form.get('location')||m.location);
    save();updateMemberHeader();memberProfile();toast('Demo profile saved.');
  };
  nameChoices();
})();