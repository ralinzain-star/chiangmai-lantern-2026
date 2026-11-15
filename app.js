/* ===== Chiang Mai Lantern 2026 — trip app ===== */
var TRIP = null;
var currentLang = 'zh';
var defaultLang = 'zh';
var curCurrency = 'TWD';
var poiFilter = 'all';
var map = null, markerLayer = null;

var DEST_TZ = 'Asia/Bangkok';
var HOME_TZ = 'Asia/Taipei';

var CAT_COLORS = {attraction:'#e8664a',hotel:'#4a7ce8',food:'#4aad5b',cafe:'#9b6ad4',shopping:'#e8964a',transport:'#4ab8c9',work:'#6a6ad4',other:'#c9975a'};
var CAT_ICONS = {attraction:'attractions',hotel:'hotel',food:'restaurant',cafe:'local_cafe',shopping:'shopping_bag',transport:'directions_transit',work:'laptop_mac',other:'spa'};

var I18N = {
  nav_overview:{zh:'概覽',en:'Overview',th:'ภาพรวม'},
  nav_itinerary:{zh:'行程',en:'Itinerary',th:'กำหนดการ'},
  nav_booking:{zh:'訂位',en:'Booking',th:'การจอง'},
  nav_budget:{zh:'預算',en:'Budget',th:'งบ'},
  nav_spots:{zh:'地圖',en:'Spots',th:'แผนที่'},
  nav_shopping:{zh:'逛街',en:'Shopping',th:'ช้อปปิ้ง'},
  nav_checklist:{zh:'清單',en:'Checklist',th:'เช็กลิสต์'},
  nav_more:{zh:'更多',en:'More',th:'เพิ่ม'},
  nav_lang:{zh:'語言',en:'Language',th:'ภาษา'},
  stat_days:{zh:'天數',en:'Days',th:'วัน'},
  stat_people:{zh:'人數',en:'People',th:'คน'},
  stat_spots:{zh:'地點',en:'Spots',th:'สถานที่'},
  stat_budget:{zh:'每人預算',en:'Per person',th:'ต่อคน'},
  ov_arrivals:{zh:'航班 & 抵達',en:'Flights & Arrivals',th:'เที่ยวบิน'},
  ov_today:{zh:'近期行程',en:'Upcoming',th:'เร็วๆ นี้'},
  ov_veg:{zh:'全程五辛素 — 找黃紅 เจ 旗、「ไม่ใส่กระเทียม ไม่ใส่หัวหอม」不加蒜洋蔥。',en:'No-allium vegetarian throughout — look for the red/yellow เจ flag.',th:'มังสวิรัติเจตลอดทริป'},
  book_flights:{zh:'機票（已開）',en:'Flights (booked)',th:'เที่ยวบิน'},
  book_confirmed:{zh:'已確認住宿 & 預訂',en:'Confirmed stays & bookings',th:'จองแล้ว'},
  book_out:{zh:'去程',en:'Outbound',th:'ขาไป'},
  book_ret:{zh:'回程',en:'Return',th:'ขากลับ'},
  bud_total:{zh:'每人預估總額',en:'Estimated per person',th:'ประมาณต่อคน'},
  bud_bycat:{zh:'分類佔比',en:'By category',th:'ตามหมวด'},
  bud_items:{zh:'明細',en:'Items',th:'รายการ'},
  shop_top:{zh:'一定要買',en:'Top picks',th:'ต้องซื้อ'},
  shop_bkk:{zh:'曼谷（11/23–24）',en:'Bangkok (11/23–24)',th:'กรุงเทพ'},
  shop_cm:{zh:'清邁（11/25–28）',en:'Chiang Mai (11/25–28)',th:'เชียงใหม่'},
  shop_brands:{zh:'品牌',en:'Brands',th:'แบรนด์'},
  shop_malls:{zh:'賣場',en:'Malls',th:'ห้าง'},
  shop_buy:{zh:'值得買',en:'Worth buying',th:'ของน่าซื้อ'},
  shop_markets:{zh:'市集',en:'Markets',th:'ตลาด'},
  shop_shops:{zh:'選品店',en:'Select shops',th:'ร้าน'},
  shop_note:{zh:'市集多收現金；清邁不少店週日公休，想逛趁週六。',en:'Markets prefer cash; many CM shops close Sunday — shop on Saturday.',th:''},
  clock_dest:{zh:'泰國',en:'Thailand',th:'ไทย'},
  clock_home:{zh:'台灣',en:'Taiwan',th:'ไต้หวัน'},
  today_left:{zh:'天後出發',en:'days to go',th:'วันก่อนไป'},
  today_go:{zh:'進入行程 →',en:'Enter trip →',th:'เข้าสู่ทริป →'},
  today_todo:{zh:'出發前可以做',en:'Before you go',th:'ก่อนออกเดินทาง'},
  cover_go:{zh:'GO',en:'GO',th:'GO'},
  m_more:{zh:'更多搜尋',en:'Search more',th:'ค้นหาเพิ่ม'}
};
function t(k){var e=I18N[k];if(!e)return k;return e[currentLang]||e[defaultLang]||k;}
function gf(obj,field){if(!obj)return '';if(currentLang!=='zh'){var v=obj[field+'_'+currentLang];if(v)return v;}return obj[field]||'';}
function fmtMoney(twd){
  if(curCurrency==='THB'){var thb=Math.round(twd/(TRIP.currency.rates.THB||0.92));return '฿'+thb.toLocaleString();}
  return 'NT$'+Math.round(twd).toLocaleString();
}
function hhmm(dec){var h=Math.floor(dec);var m=Math.round((dec-h)*60);return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;}

/* ---------- load ---------- */
function loadData(){
  var inline=document.getElementById('trip-data');
  if(inline){try{TRIP=JSON.parse(inline.textContent);init();return;}catch(e){}}
  fetch('data/trip.json').then(function(r){return r.json();}).then(function(d){TRIP=d;init();})
    .catch(function(){document.body.innerHTML='<p style="padding:40px">無法載入 trip.json，請以 serve.py 開啟。</p>';});
}

function init(){
  renderToday(); buildNav();
  renderOverview(); renderItinerary(); renderBooking(); renderBudget(); renderSpots(); renderShopping(); renderChecklist();
  initClocks();
  document.addEventListener('click',function(e){
    if(!e.target.closest('#bb-more-btn')) closeMore();
    if(!e.target.closest('#lang-btn')&&!e.target.closest('#lang-menu')) document.getElementById('lang-menu').classList.remove('open');
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
}

/* ---------- today overlay ---------- */
function renderToday(){
  var now=new Date();
  var start=new Date(TRIP.startDate+'T00:00:00');
  var end=new Date(TRIP.endDate+'T23:59:59');
  var el=document.getElementById('today-overlay');
  var dayMs=86400000;
  var todayStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  var daysLeft=Math.ceil((start-now)/dayMs);
  var html='';
  if(now<start){
    var todos=['TDAC 入境卡','機票/住宿截圖','泰銖 & eSIM','回程 FD242 加買行李','打包 & 行動電源'];
    if(currentLang==='en')todos=['TDAC arrival card','Save booking screenshots','THB cash & eSIM','Add return checked bag','Pack & power bank'];
    html+='<div class="today-label">'+(currentLang==='zh'?'距離出發':'Countdown')+'</div>';
    html+='<div class="today-count">'+Math.max(0,daysLeft)+'</div>';
    html+='<div class="today-label">'+t('today_left')+'</div>';
    html+='<div class="today-dest">'+gf(TRIP,'destination')+'</div>';
    html+='<div class="today-tag">'+taglineText()+'</div>';
    html+='<div class="today-todos-label">'+t('today_todo')+'</div><div class="today-todos">';
    todos.forEach(function(x){html+='<div class="today-todo-item"><span class="mi">check_circle</span><div><div class="tt-main">'+x+'</div></div></div>';});
    html+='</div>';
  }else if(now<=end){
    html+='<div class="today-dest">'+gf(TRIP,'destination')+'</div><div class="today-tag">'+(currentLang==='zh'?'旅程進行中':'Trip in progress')+'</div>';
  }else{
    html+='<div class="today-dest">'+(currentLang==='zh'?'旅程結束 ✈️':'Trip ended ✈️')+'</div>';
  }
  html+='<button class="today-enter" onclick="dismissToday()">'+t('today_go')+'</button>';
  el.innerHTML=html;
}
function dismissToday(){document.getElementById('today-overlay').classList.add('hidden');}

/* tagline is a plain multilingual obj without base field; gf expects field name */
function taglineText(){var tl=TRIP.tagline;return tl[currentLang]||tl[defaultLang]||'';}

/* ---------- cover ---------- */
var DEFAULT_COVER='https://images.unsplash.com/photo-1500754088824-ce0582cfe45f?q=80&w=1600&auto=format&fit=crop';
function renderCover(){
  var saved=null;try{saved=localStorage.getItem('cm-cover');}catch(e){}
  document.getElementById('cover-bg').style.backgroundImage='url('+(saved||DEFAULT_COVER)+')';
  document.getElementById('cover-title').textContent=gf(TRIP,'destination');
  document.getElementById('cover-meta').textContent='11/23–11/29 · '+TRIP.people+(currentLang==='zh'?' 人':' people');
  document.getElementById('cover-desc').textContent=taglineText();
  document.getElementById('cover-go-label').textContent=t('cover_go');
}
function enterApp(){document.getElementById('cover').classList.add('cover-hidden');}
function uploadCover(){
  var i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=function(){var f=i.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{localStorage.setItem('cm-cover',rd.result);}catch(e){}document.getElementById('cover-bg').style.backgroundImage='url('+rd.result+')';};rd.readAsDataURL(f);};
  i.click();
}

/* ---------- nav ---------- */
function buildNav(){ applyLang(); }
function showTab(id){
  var cur=document.querySelector('.tab-panel.active');
  if(cur&&cur.id==='tab-'+id)return;
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
  var el=document.getElementById('tab-'+id);if(el)el.classList.add('active');
  document.querySelectorAll('.sb').forEach(function(b){b.classList.toggle('active',b.dataset.tab===id);});
  document.querySelectorAll('.bb').forEach(function(b){b.classList.toggle('active',b.dataset.tab===id);});
  closeMore();
  window.scrollTo(0,0);
  if(id==='spots'&&map)setTimeout(function(){map.invalidateSize();},120);
}
function toggleMore(){var m=document.getElementById('bb-more-menu');m.classList.toggle('open');}
function closeMore(){var m=document.getElementById('bb-more-menu');if(m)m.classList.remove('open');}

/* ---------- lang ---------- */
function toggleLangMenu(){document.getElementById('lang-menu').classList.toggle('open');}
function setLang(l){currentLang=l;document.getElementById('lang-menu').classList.remove('open');closeMore();applyLang();}
function applyLang(){
  document.documentElement.lang=currentLang;
  document.querySelectorAll('[data-i18n]').forEach(function(el){el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll('.lang-menu button').forEach(function(b){b.classList.toggle('on',b.dataset.l===currentLang);});
  renderToday();renderOverview();renderItinerary();renderBooking();renderBudget();renderSpots();renderShopping();renderChecklist();updateClocks();
}

/* ---------- overview ---------- */
function renderOverview(){
  var f=TRIP.flights;
  var arrivals=[
    {zh:'Archer 11/17（先探路）',en:'Archer 11/17'},
    {zh:'俊華 11/22',en:'Jun-Hua 11/22'},
    {zh:'十渶 11/23 下午',en:'Shih-Ying 11/23 PM'},
    {zh:'Iris（我）11/23 16:50',en:'Iris 11/23 16:50'},
    {zh:'Dina 另飛、後段會合',en:'Dina joins later'}
  ];
  var h='';
  h+='<div class="section-title"><span class="mi">flight</span>'+t('ov_arrivals')+'</div>';
  h+='<div class="card">';
  h+='<div><b>'+t('book_out')+'</b> · '+f.outbound.flight+' '+gf(f.outbound,'dep')+' '+f.outbound.dep_time+' → '+gf(f.outbound,'arr')+' '+f.outbound.arr_time+'（'+gf(f.outbound,'baggage')+'）</div>';
  h+='<div style="margin-top:6px"><b>'+t('book_ret')+'</b> · '+f.return.flight+' '+gf(f.return,'dep')+' '+f.return.dep_time+' → '+gf(f.return,'arr')+' '+f.return.arr_time+'（'+gf(f.return,'baggage')+'）</div>';
  h+='<div class="pill-list">';
  arrivals.forEach(function(a){h+='<span class="pill-flat">'+(a[currentLang]||a.zh)+'</span>';});
  h+='</div></div>';
  document.getElementById('ov-arrivals').innerHTML=h;

  // upcoming: first 2 days
  var tc='<div class="today-card-h"><span class="mi">event</span>'+t('ov_today')+'</div>';
  TRIP.schedule.slice(0,3).forEach(function(d){
    tc+='<div style="font-weight:700;margin:10px 0 2px">'+d.date.slice(5)+' · '+gf(d,'city')+'</div>';
    d.events.forEach(function(ev){
      tc+='<div class="tc-ev"><span class="tc-t">'+hhmm(ev.sh)+'</span><span class="tc-dot" style="background:'+CAT_COLORS[ev.cat]+'"></span><span>'+gf(ev,'name')+'</span></div>';
    });
  });
  document.getElementById('ov-today').innerHTML=tc;

  document.getElementById('ov-info').innerHTML='<span class="mi">eco</span><span>'+t('ov_veg')+'</span>';

  // stats
  var statHtml='';
  statHtml+='<div class="st"><div class="st-label">'+t('stat_days')+'</div><div class="st-val">7</div><div class="st-sub">11/23–29</div></div>';
  statHtml+='<div class="st"><div class="st-label">'+t('stat_people')+'</div><div class="st-val">'+TRIP.people+'</div></div>';
  statHtml+='<div class="st"><div class="st-label">'+t('stat_spots')+'</div><div class="st-val">'+TRIP.pois.length+'</div></div>';
  var per=TRIP.budget.items.reduce(function(a,b){return a+b.cost_twd;},0);
  statHtml+='<div class="st"><div class="st-label">'+t('stat_budget')+'</div><div class="st-val">'+fmtMoney(per)+'</div></div>';
  document.getElementById('ov-stats').innerHTML=statHtml;
}

/* ---------- itinerary ---------- */
function renderItinerary(){
  var todayStr=new Date().toISOString().slice(0,10);
  var h='';
  TRIP.schedule.forEach(function(d){
    h+='<div class="cal-day'+(d.date===todayStr?' is-today':'')+'">';
    h+='<div class="cal-day-h"><span class="cal-day-date">'+d.date.slice(5)+'</span><span class="cal-day-city">'+gf(d,'city')+'</span></div>';
    d.events.forEach(function(ev){
      var col=CAT_COLORS[ev.cat];
      h+='<div class="cal-ev"><span class="cal-ev-time">'+hhmm(ev.sh)+'–'+hhmm(ev.eh)+'</span>';
      h+='<span class="cal-ev-bar" style="background:'+col+'"></span><div class="cal-ev-body">';
      h+='<div class="cal-ev-name">'+gf(ev,'name');
      if(ev.reservation===true||ev.reservation==='needed')h+='<span class="tag tag-book">'+(currentLang==='zh'?'訂':'book')+'</span>';
      h+='</div>';
      if(gf(ev,'note'))h+='<div class="cal-ev-note">'+gf(ev,'note')+'</div>';
      if(ev.map)h+='<a class="lnk" target="_blank" href="'+ev.map+'"><span class="mi">place</span>Map</a> ';
      if(ev.booking_url)h+='<a class="lnk" target="_blank" href="'+ev.booking_url+'"><span class="mi">confirmation_number</span>'+(currentLang==='zh'?'訂票':'book')+'</a>';
      h+='</div></div>';
    });
    h+='</div>';
  });
  document.getElementById('itinerary-list').innerHTML=h;
}

/* ---------- booking ---------- */
function renderBooking(){
  var f=TRIP.flights;
  var h='<div class="flight-card"><div class="flight-head"><span class="mi">flight</span>'+f.outbound.carrier+' / '+f.return.carrier+'<span class="flight-badge">'+(currentLang==='zh'?'已開票':'booked')+'</span></div>';
  [['book_out',f.outbound],['book_ret',f.return]].forEach(function(p){
    var s=p[1];
    h+='<div class="flight-seg"><span class="seg-badge">'+t(p[0])+'</span>';
    h+='<div class="seg-pt"><div class="seg-time">'+s.dep_time+'</div><div class="seg-city">'+gf(s,'dep')+'</div></div>';
    h+='<div class="seg-arrow">'+s.flight+' · '+s.duration+'</div>';
    h+='<div class="seg-pt"><div class="seg-time">'+s.arr_time+'</div><div class="seg-city">'+gf(s,'arr')+'</div></div></div>';
    h+='<div class="seg-meta">'+s.date.slice(5)+' · '+gf(s,'baggage')+'</div>';
  });
  h+='</div>';
  document.getElementById('booking-flights').innerHTML=h;

  var bg='';
  TRIP.hotels.forEach(function(ht){
    bg+='<div class="booked-card"><div class="bc-h"><span class="mi">hotel</span>'+gf(ht,'name')+'<span class="bc-badge done">'+(currentLang==='zh'?'已訂':'done')+'</span></div>';
    bg+='<div class="bc-m">'+ht.dates+' · '+fmtMoney(ht.price_twd)+(gf(ht,'note')?' · '+gf(ht,'note'):'')+'</div>';
    bg+='<a class="lnk" target="_blank" href="https://www.google.com/maps/search/?api=1&query='+ht.lat+','+ht.lng+'"><span class="mi">place</span>Map</a></div>';
  });
  var booked=[
    {i:'confirmation_number',z:'CAD 天燈節門票（Settour 標準票）',e:'CAD lantern ticket',s:'done'},
    {i:'spa',z:'Sense Garden 按摩 11/26 20:00',e:'Sense Garden 11/26 20:00',s:'done'},
    {i:'restaurant',z:'Baan Landai 11/27 13:00 五位',e:'Baan Landai 11/27 13:00 x5',s:'done'},
    {i:'directions_car',z:'天燈節會場私人包車（Dina）',e:'Festival charter (Dina)',s:'done'},
    {i:'nature',z:'11/27 雨豆樹＋大象咖啡套裝（俊華）',e:'Rain-tree + elephant tour (Jun-Hua)',s:'done'},
    {i:'kayaking',z:'Mae Taeng 泛舟＋竹筏 11/26',e:'Mae Taeng rafting 11/26',s:'done'},
    {i:'paragliding',z:'動力傘 Flying Bird 11/28（選配）',e:'Flying Bird 11/28 (opt)',s:'pending'}
  ];
  booked.forEach(function(b){
    bg+='<div class="booked-card"><div class="bc-h"><span class="mi">'+b.i+'</span>'+(currentLang==='zh'?b.z:b.e)+'<span class="bc-badge '+b.s+'">'+(b.s==='done'?(currentLang==='zh'?'已訂':'done'):(currentLang==='zh'?'待訂':'todo'))+'</span></div></div>';
  });
  document.getElementById('booking-confirmed').innerHTML=bg;
}

/* ---------- budget ---------- */
function renderBudget(){
  var items=TRIP.budget.items;
  var total=items.reduce(function(a,b){return a+b.cost_twd;},0);
  document.getElementById('budget-total').innerHTML=
    '<div class="bt-label">'+t('bud_total')+'</div><div class="bt-val" id="bt-val">'+fmtMoney(total)+'</div>'+
    '<div class="bt-sub">'+TRIP.people+(currentLang==='zh'?' 人同行 · 共乘已分攤':' travelers')+'</div>'+
    '<div class="cur-pills"><button class="cur-pill'+(curCurrency==='TWD'?' on':'')+'" onclick="setCur(\'TWD\')">TWD</button><button class="cur-pill'+(curCurrency==='THB'?' on':'')+'" onclick="setCur(\'THB\')">THB</button></div>';
  // by category
  var cats={};items.forEach(function(it){cats[it.cat]=(cats[it.cat]||0)+it.cost_twd;});
  var max=Math.max.apply(null,Object.values(cats));
  var cb='';
  Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];}).forEach(function(c){
    cb+='<div class="h-bar-row"><span>'+c+'</span><div class="h-bar-track"><div class="h-bar-fill" style="width:'+(cats[c]/max*100)+'%;background:'+CAT_COLORS[c]+'"></div></div><span>'+fmtMoney(cats[c])+'</span></div>';
  });
  document.getElementById('budget-cats').innerHTML=cb;
  var li='';
  items.forEach(function(it){li+='<div class="b-row"><span>'+gf(it,'name')+'</span><span class="b-cost">'+fmtMoney(it.cost_twd)+'</span></div>';});
  document.getElementById('budget-items').innerHTML=li;
}
function setCur(c){curCurrency=c;renderBudget();renderOverview();}

/* ---------- spots / map ---------- */
function renderSpots(){
  var cats=['all','attraction','food','shopping','hotel','other'];
  var fl='';
  cats.forEach(function(c){fl+='<button class="chip'+(poiFilter===c?' on':'')+'" onclick="setFilter(\''+c+'\')">'+(c==='all'?(currentLang==='zh'?'全部':'All'):c)+'</button>';});
  document.getElementById('poi-filters').innerHTML=fl;
  var pois=TRIP.pois.filter(function(p){return poiFilter==='all'||p.cat===poiFilter;});
  var li='';
  pois.forEach(function(p){
    li+='<div class="poi" onclick="openModal(\''+p.id+'\')"><span class="poi-dot" style="background:'+CAT_COLORS[p.cat]+'"></span>'+
      '<div style="flex:1"><div class="poi-name">'+gf(p,'name')+'</div><div class="poi-desc">'+gf(p,'desc')+'</div></div>'+
      '<a class="poi-map" onclick="event.stopPropagation()" target="_blank" href="'+(p.url||('https://www.google.com/maps/search/?api=1&query='+p.lat+','+p.lng))+'"><span class="mi">place</span></a></div>';
  });
  document.getElementById('poi-list').innerHTML=li;
  if(!map){
    map=L.map('map',{scrollWheelZoom:false}).setView([16.5,99.6],6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
    markerLayer=L.layerGroup().addTo(map);
  }
  markerLayer.clearLayers();
  var bounds=[];
  pois.forEach(function(p){
    var m=L.circleMarker([p.lat,p.lng],{radius:7,color:'#fff',weight:2,fillColor:CAT_COLORS[p.cat],fillOpacity:1});
    m.bindPopup('<b>'+gf(p,'name')+'</b><br>'+gf(p,'desc'));
    m.on('click',function(){openModal(p.id);});
    m.addTo(markerLayer);bounds.push([p.lat,p.lng]);
  });
  if(bounds.length)map.fitBounds(bounds,{padding:[30,30]});
}
function setFilter(c){poiFilter=c;renderSpots();}

/* ---------- shopping ---------- */
function chipLink(o){return '<a class="shop-chip" target="_blank" href="'+o.url+'">'+gf(o,'name')+'<span class="mi">open_in_new</span></a>';}
function renderShopping(){
  var s=TRIP.shopping;var h='';
  h+='<div class="section-title"><span class="mi">star</span>'+t('shop_top')+'</div><div class="shop-top">';
  s.topPicks.forEach(function(p){h+='<a target="_blank" href="'+p.url+'"><span class="mi">shopping_bag</span><span class="stt">'+gf(p,'name')+'</span></a>';});
  h+='</div>';
  // Bangkok
  h+='<div class="section-title"><span class="mi">location_city</span>'+t('shop_bkk')+'</div>';
  h+='<div class="shop-grp"><h3>'+t('shop_brands')+'</h3><div class="shop-chips">';
  s.bangkok.brands.forEach(function(b){h+=chipLink(b);});h+='</div></div>';
  h+='<div class="shop-grp"><h3>'+t('shop_malls')+'</h3><div class="shop-chips">';
  s.bangkok.malls.forEach(function(b){h+=chipLink(b);});h+='</div>'+chipLink(s.bangkok.ref).replace('shop-chip','shop-chip')+'</div>';
  // Chiang Mai
  h+='<div class="section-title"><span class="mi">landscape</span>'+t('shop_cm')+'</div>';
  h+='<div class="shop-grp"><h3>'+t('shop_buy')+'</h3><div class="shop-chips">';
  s.chiangmai.buy.forEach(function(b){h+=chipLink(b);});h+='</div></div>';
  h+='<div class="shop-grp"><h3>'+t('shop_markets')+'</h3><div class="shop-chips">';
  s.chiangmai.markets.forEach(function(b){h+=chipLink(b);});h+='</div></div>';
  h+='<div class="shop-grp"><h3>'+t('shop_shops')+'</h3><div class="shop-chips">';
  s.chiangmai.shops.forEach(function(b){h+=chipLink(b);});h+='</div></div>';
  h+='<div class="info-box" style="margin-top:20px"><span class="mi">payments</span><span>'+t('shop_note')+'</span></div>';
  document.getElementById('shopping-body').innerHTML=h;
}

/* ---------- checklist ---------- */
function renderChecklist(){
  var h='';
  TRIP.checklist.forEach(function(g,gi){
    h+='<div class="check-group"><h3>'+gf2(g.title)+'</h3>';
    g.items.forEach(function(it,ii){
      var key='cm-chk-'+gi+'-'+ii;var done=false;try{done=localStorage.getItem(key)==='1';}catch(e){}
      h+='<label class="check-item'+(done?' done':'')+'"><input type="checkbox" '+(done?'checked':'')+' onchange="toggleChk(\''+key+'\',this)"><span>'+gf2(it)+'</span></label>';
    });
    h+='</div>';
  });
  document.getElementById('checklist-grid').innerHTML=h;
}
function gf2(o){return o[currentLang]||o[defaultLang]||o.zh||'';}
function toggleChk(key,el){try{localStorage.setItem(key,el.checked?'1':'0');}catch(e){}el.closest('.check-item').classList.toggle('done',el.checked);}

/* ---------- clocks ---------- */
function initClocks(){updateClocks();setInterval(updateClocks,30000);}
function updateClocks(){
  var d=document.getElementById('clock-dest'),h=document.getElementById('clock-home');
  if(!d)return;
  function tz(z){return new Date().toLocaleTimeString('en-GB',{timeZone:z,hour:'2-digit',minute:'2-digit'});}
  d.querySelector('.cl-time').textContent=tz(DEST_TZ);
  d.querySelector('.cl-label').textContent=t('clock_dest');
  h.querySelector('.cl-time').textContent=tz(HOME_TZ);
  h.querySelector('.cl-label').textContent=t('clock_home');
}

/* ---------- modal ---------- */
function openModal(id){
  var p=TRIP.pois.filter(function(x){return x.id===id;})[0];if(!p)return;
  var q=encodeURIComponent(gf(p,'name')+' '+(p.city==='bangkok'?'Bangkok':'Chiang Mai'));
  var links=[
    ['Google Maps',p.url||('https://www.google.com/maps/search/?api=1&query='+p.lat+','+p.lng)],
    ['Google','https://www.google.com/search?q='+q],
    ['Instagram','https://www.instagram.com/explore/search/keyword/?q='+q],
    ['YouTube','https://www.youtube.com/results?search_query='+q]
  ];
  var h='<div class="m-row"><span class="mi" style="color:'+CAT_COLORS[p.cat]+'">'+CAT_ICONS[p.cat]+'</span><span>'+gf(p,'desc')+'</span></div>';
  if(gf(p,'addr'))h+='<div class="m-row"><span class="mi">place</span><span>'+gf(p,'addr')+'</span></div>';
  var lk='<div class="modal-links">';links.forEach(function(l){lk+='<a target="_blank" href="'+l[1]+'">'+l[0]+'</a>';});lk+='</div>';
  document.getElementById('modal-title').textContent=gf(p,'name');
  document.getElementById('modal-body').innerHTML=h+'<div style="margin-top:12px;font-size:.78rem;color:var(--text-3)">'+t('m_more')+'</div>'+lk;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){var m=document.getElementById('modal-overlay');if(m)m.classList.remove('open');}

/* ---------- export ---------- */
function exportGeo(){
  var geo={type:'FeatureCollection',features:TRIP.pois.map(function(p){return {type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:{name:p.name,category:p.cat,description:p.desc}};})};
  var blob=new Blob([JSON.stringify(geo,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chiangmai-lantern-2026.geojson';a.click();
}

document.addEventListener('DOMContentLoaded',loadData);
