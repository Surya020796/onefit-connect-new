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
    input.removeAttribute('list');
    input.setAttribute('autocomplete','off');
    input.placeholder='e.g. Aisha Khan or M001';
    const oldList=document.getElementById('onefit-member-names');
    if(oldList)oldList.remove();
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
    const name=field.value.normalize('NFKC').trim().replace(/\s+/g,' ');
    const text=name.toLocaleLowerCase();
    if(!text){field.focus();return;}
    const normalized=m=>m.name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
    let found=members.filter(m=>m.id.toLowerCase()===text||normalized(m)===text);
    if(!found.length && !text.includes(' ')){
      found=members.filter(m=>normalized(m).split(' ')[0]===text);
    }
    if(found.length>1){
      toast('More than one member shares that first name. Enter full name or Member ID.');
      field.focus();return;
    }
    if(!found.length){
      toast("Member not found. Select New Member Sign Up to create an account.");
      field.focus();
      return;
    }
    current.memberId=found[0].id;
    const password=document.getElementById('memberLoginPassword');
    if(password)password.value='';
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
  window.memberHome=function freshMemberHome(){
  const m=member();
  const visits=presentVisits(m);
  const mine=upcomingBookings(m).sort((a,b)=>{
    const ca=classForBooking(a),cb=classForBooking(b);
    return ((ca?.date||'')+' '+(ca?.time||'')).localeCompare((cb?.date||'')+' '+(cb?.time||''));
  });
  const now=new Date();
  const first=new Date(now);first.setHours(0,0,0,0);first.setDate(first.getDate()-((first.getDay()+6)%7));
  const weekStart=formatDay(first);
  const thirtyDays=new Date(now);thirtyDays.setDate(now.getDate()-29);
  const thirtyStart=formatDay(thirtyDays);
  const weeklyVisits=visits.filter(a=>visitDate(a)>=weekStart);
  const recentVisits=visits.filter(a=>visitDate(a)>=thirtyStart);
  const nextClasses=mine.slice(0,3).map(b=>{
    const c=classForBooking(b);
    if(!c)return '';
    return `<div class="ofc-session"><div class="ofc-session-symbol">${ico('calendar',20)}</div><div class="ofc-session-info"><b>${esc(c.name)}</b><span>${esc(c.date)} · ${esc(c.time)}</span><small>${esc(c.location)} · ${esc(c.instructor)}</small></div><span class="ofc-booked">Booked</span></div>`;
  }).join('');
  const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label,i)=>{
    const day=new Date(first);day.setDate(day.getDate()+i);
    const key=formatDay(day);
    const checked=visits.some(a=>visitDate(a)===key);
    const isToday=key===formatDay(now);
    return `<div class="ofc-weekday ${checked?'ofc-done':''} ${isToday?'ofc-today':''}"><span>${checked?ico('check',15):day.getDate()}</span><small>${label}</small></div>`;
  }).join('');
  const recommended=preferredRecommendations(m).slice(0,3);
  const recMarkup=recommended.map(c=>{
    const type=(c.type||'Class').toUpperCase();
    return `<article class="ofc-class-tile"><span class="ofc-class-type">${esc(type)}</span><b>${esc(c.name)}</b><small>${esc(c.date)} · ${esc(c.time)}</small><p>${esc(c.location)} · ${Math.max(0,c.capacity-c.booked)} seats left</p><button onclick="recommendBook('${esc(c.id)}')">Book this class ${ico('arrow',14)}</button></article>`;
  }).join('');
  const activityText=weeklyVisits.length===1?'session':"sessions";
  document.getElementById('app').innerHTML=`
    <div class="member-dashboard ofc-dashboard">
      <section class="ofc-member-hero">
        <div class="ofc-member-hero-main">
          <span class="ofc-eyebrow"><span class="ofc-lime-dot"></span> YOUR ONEFIT SPACE</span>
          <h1>Keep moving, <em>${esc(m.name.split(/\s+/)[0])}.</em></h1>
          <p>Your classes, bookings, and progress — connected across all three studios.</p>
          <div class="ofc-hero-buttons">
            <button onclick="navigate('classes')">Explore classes ${ico('arrow',17)}</button>
            <button class="ofc-hero-outline" onclick="navigate('mybookings')">My bookings</button>
          </div>
        </div>
        <div class="ofc-hero-location"><span>HOME STUDIO</span><strong>${esc(m.location)}</strong><small>One membership · Three locations</small></div>
      </section>
      <section>
        <div class="ofc-headingline"><h2>Your membership at a glance</h2><span>Live prototype data</span></div>
        <div class="ofc-metrics">
          ${displayStat('bookings','Upcoming classes',mine.length,'Current reservations')}
          ${displayStat('check','Classes attended',visits.length,'Recorded visits')}
          ${displayStat('pin','Studio access','03','All locations')}
          ${displayStat('award','Member status',esc(m.status||'Active'),'Shared membership')}
        </div>
      </section>
      <section class="ofc-dashboard-grid">
        <div class="ofc-box">
          <div class="ofc-box-head"><div><span class="ofc-overline">UP NEXT</span><h3>Your classes</h3></div><button class="ofc-text-link" onclick="navigate('mybookings')">All bookings ${ico('arrow',15)}</button></div>
          ${nextClasses||'<div class="ofc-blank"><strong>No upcoming reservations yet.</strong><span>Find a session that works for you at any OneFit location.</span><button onclick="navigate(\'classes\')">Find a class</button></div>'}
        </div>
        <div class="ofc-box ofc-weekly">
          <div class="ofc-box-head"><div><span class="ofc-overline">YOUR MOMENTUM</span><h3>This week</h3></div><button class="ofc-text-link" onclick="navigate('activity')">Activity ${ico('arrow',15)}</button></div>
          <div class="ofc-week-summary"><div><strong>${weeklyVisits.length}</strong><span>${activityText} attended this week</span></div><div class="ofc-week-sub"><b>${recentVisits.length}</b><span>last 30 days</span></div></div>
          <div class="ofc-weekdays">${weekdays}</div>
          <p class="ofc-footnote">Attendance updates when staff marks you present at a class.</p>
        </div>
        <div class="ofc-box">
          <div class="ofc-box-head"><div><span class="ofc-overline">FIND YOUR NEXT MOVE</span><h3>Classes to try</h3></div><button class="ofc-text-link" onclick="navigate('classes')">Browse all ${ico('arrow',15)}</button></div>
          <div class="ofc-recommendations">${recMarkup||'<p class="ofc-footnote">No available classes right now. Check the full schedule for new sessions.</p>'}</div>
        </div>
        <div class="ofc-box ofc-community">
          <div class="ofc-box-head"><div><span class="ofc-overline">YOUR MEMBERSHIP</span><h3>Three studios. One pass.</h3></div>${ico('pin',24)}</div>
          <p>Book at whichever location suits you best. Your schedule and attendance stay together in OneFit Connect.</p>
          <div class="ofc-location-badges">${locations.map(l=>`<span class="${m.location===l?'ofc-home-location':''}">${ico('pin',14)} ${esc(l)}${m.location===l?' · Home':''}</span>`).join('')}</div>
          <div class="ofc-membership-strip"><span><i></i> ${esc(m.status||'Active')} membership</span><button onclick="navigate('profile')">View profile ${ico('arrow',14)}</button></div>
        </div>
      </section>
      <p class="ofc-footer-note">OneFit Connect prototype · Sample members and classes · Demo data is saved in this browser</p>
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