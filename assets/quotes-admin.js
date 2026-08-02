(function(){
'use strict';
let rows=[],selected=null,unsubscribeRealtime=null,pollTimer=null,loadInFlight=null,lastUpdateAt=null;
const $=s=>document.querySelector(s);
const labels={new:'جديد',contacted:'تم التواصل',pricing:'جاري التسعير',sent:'تم إرسال العرض',accepted:'مقبول',rejected:'مرفوض'};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=d=>d?new Date(d).toLocaleString('ar-EG'):'—';
const debounce=(fn,ms=250)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}};

function setConnection(mode,text){
  const el=$('#liveStatus');if(!el)return;
  el.dataset.mode=mode;el.textContent=text;
}
function setLastUpdate(){
  lastUpdateAt=new Date();
  const el=$('#lastUpdate');if(el)el.textContent=`آخر تحديث: ${lastUpdateAt.toLocaleTimeString('ar-EG')}`;
}
function toast(message,type='info'){
  let el=$('#qToast');
  if(!el){el=document.createElement('div');el.id='qToast';el.className='qtoast';document.body.appendChild(el);}
  el.textContent=message;el.dataset.type=type;el.classList.add('show');
  clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3200);
}

async function load({silent=false,preserveSelection=true}={}){
  if(loadInFlight)return loadInFlight;
  if(!silent)setConnection('loading','جارٍ التحديث...');
  loadInFlight=(async()=>{
    try{
      const fresh=await FlevoStore.getQuotations();
      rows=fresh;
      if(!preserveSelection)selected=null;
      selected=selected&&rows.some(x=>String(x.id)===String(selected))?selected:null;
      render();setLastUpdate();
      if(!unsubscribeRealtime)setConnection('polling','تحديث تلقائي');
      return rows;
    }catch(e){
      console.error('Quotation load error:',e);
      setConnection('error','تعذر الاتصال');
      if(!silent)toast(`تعذر تحميل الطلبات: ${e.message}`,'error');
      throw e;
    }finally{loadInFlight=null;}
  })();
  return loadInFlight;
}

function filtered(){
  const q=$('#search').value.trim().toLowerCase(),f=$('#filter').value;
  return rows.filter(x=>(!f||x.status===f)&&(!q||[x.customer_name,x.company_name,x.phone,x.email,x.event_name,x.city,x.service_type].join(' ').toLowerCase().includes(q)));
}
function render(){
  const arr=filtered();
  $('#kTotal').textContent=rows.length;
  $('#kNew').textContent=rows.filter(x=>x.status==='new').length;
  $('#kOpen').textContent=rows.filter(x=>['contacted','pricing','sent'].includes(x.status)).length;
  $('#kAccepted').textContent=rows.filter(x=>x.status==='accepted').length;
  $('#list').innerHTML=arr.map(x=>`<div class="item ${String(selected)===String(x.id)?'active':''}" data-id="${esc(x.id)}"><div class="itemhead"><b>${esc(x.customer_name)}</b><span class="badge ${esc(x.status)}">${labels[x.status]||esc(x.status)}</span></div><small>${esc(x.company_name||'بدون شركة')} · ${esc(x.phone||'')}</small><small>${esc(x.event_name||x.service_type||'طلب عام')} · ${fmt(x.created_at)}</small></div>`).join('')||'<div class="empty">لا توجد نتائج.</div>';
  document.querySelectorAll('.item').forEach(i=>i.onclick=()=>open(i.dataset.id));
  if(selected)open(selected,false);
}
function open(id,rerender=true){
  selected=id;if(rerender)render();
  const x=rows.find(r=>String(r.id)===String(id));if(!x)return;
  $('#detail').innerHTML=`<h2>${esc(x.customer_name)}</h2><div class="fields"><div class="field"><small>الشركة</small>${esc(x.company_name||'—')}</div><div class="field"><small>الهاتف</small><a dir="ltr" href="tel:${esc(x.phone)}">${esc(x.phone)}</a></div><div class="field"><small>البريد</small>${esc(x.email||'—')}</div><div class="field"><small>المدينة</small>${esc(x.city||'—')}</div><div class="field"><small>الخدمة</small>${esc(x.service_type||'—')}</div><div class="field"><small>المعرض / المشروع</small>${esc(x.event_name||'—')}</div><div class="field"><small>التاريخ المطلوب</small>${esc(x.event_date||'—')}</div><div class="field"><small>المساحة</small>${esc(x.booth_area||'—')}</div><div class="field"><small>الميزانية</small>${esc(x.budget||'—')}</div><div class="field"><small>تاريخ الاستلام</small>${fmt(x.created_at)}</div><div class="field full"><small>تفاصيل العميل</small>${esc(x.notes||'—')}</div><div class="field full"><small>الحالة</small><select id="status">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${x.status===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="field full"><small>ملاحظات داخلية</small><textarea class="notes" id="internal">${esc(x.internal_notes||'')}</textarea></div></div><div class="actions" style="margin-top:16px"><button class="abtn primary" id="save">حفظ المتابعة</button><a class="abtn soft" target="_blank" rel="noopener" href="https://wa.me/${String(x.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent('مرحباً '+x.customer_name+'، معك فريق FLEVO بخصوص طلب عرض السعر.')}">واتساب</a><a class="abtn soft" href="tel:${esc(x.phone)}">اتصال</a><button class="abtn danger" id="delete">حذف</button></div>`;
  $('#save').onclick=async()=>{
    const button=$('#save');button.disabled=true;
    try{const upd=await FlevoStore.updateQuotation(x.id,{status:$('#status').value,internal_notes:$('#internal').value.trim()||null});Object.assign(x,upd);toast('تم حفظ المتابعة','success');render();}
    catch(e){toast(e.message,'error');}finally{button.disabled=false;}
  };
  $('#delete').onclick=async()=>{
    if(!confirm('حذف الطلب نهائيًا؟'))return;
    try{await FlevoStore.deleteQuotation(x.id);selected=null;await load({preserveSelection:false});toast('تم حذف الطلب','success');}
    catch(e){toast(e.message,'error');}
  };
}
function csv(){
  const cols=['created_at','customer_name','company_name','phone','email','service_type','event_name','event_date','booth_area','city','budget','status','notes','internal_notes'];
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const text='\ufeff'+[cols.join(','),...filtered().map(r=>cols.map(c=>q(r[c])).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download='flevo-quotation-requests.csv';a.click();URL.revokeObjectURL(a.href);
}
function startPolling(){
  clearInterval(pollTimer);
  pollTimer=setInterval(()=>{if(!document.hidden&&navigator.onLine)load({silent:true}).catch(()=>{});},15000);
}
function startRealtime(){
  if(unsubscribeRealtime)unsubscribeRealtime();
  let subscribed=false;
  unsubscribeRealtime=FlevoStore.subscribeToQuotations(async payload=>{
    const isNew=payload.eventType==='INSERT';
    await load({silent:true}).catch(()=>{});
    if(isNew)toast(`طلب عرض سعر جديد: ${payload.new?.customer_name||'عميل جديد'}`,'success');
  },status=>{
    if(status==='SUBSCRIBED'){subscribed=true;setConnection('live','متصل مباشر');}
    else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
      setConnection('polling','تحديث تلقائي');
    }
  });
  setTimeout(()=>{if(!subscribed)setConnection('polling','تحديث تلقائي');},6000);
}
async function init(){
  $('#search').oninput=debounce(render,150);
  $('#filter').onchange=render;
  $('#refresh').onclick=()=>load().catch(()=>{});
  $('#csv').onclick=csv;
  window.addEventListener('online',()=>{setConnection('loading','استعادة الاتصال...');load({silent:true}).then(startRealtime).catch(()=>{});});
  window.addEventListener('offline',()=>setConnection('error','غير متصل'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load({silent:true}).catch(()=>{});});
  await load().catch(()=>{});startRealtime();startPolling();
}
window.addEventListener('beforeunload',()=>{unsubscribeRealtime?.();clearInterval(pollTimer);});
FlevoUnifiedAuth.protectPage({onAuthenticated:init});
})();
