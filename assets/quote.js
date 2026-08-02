(function(){
'use strict';
const AR={tag:'طلب عرض سعر',title:'ابدأ مشروعك مع FLEVO',desc:'أدخل بيانات المشروع وسيتواصل معك فريقنا لمراجعة المتطلبات وإعداد عرض السعر.',name:'الاسم الكامل',company:'اسم الشركة',phone:'رقم الهاتف',email:'البريد الإلكتروني',service:'نوع الخدمة',event:'اسم المعرض / الفعالية',date:'تاريخ التنفيذ',area:'المساحة التقريبية',city:'المدينة',budget:'الميزانية التقريبية',notes:'تفاصيل الطلب',submit:'إرسال الطلب',sending:'جارٍ حفظ الطلب والتحقق من وصوله...',success:'تم حفظ طلبك بنجاح. رقم الطلب:',error:'تعذر حفظ الطلب الآن. تحقق من الاتصال وحاول مرة أخرى.',invalid:'راجع الاسم ورقم الهاتف والبريد الإلكتروني.',offline:'لا يوجد اتصال بالإنترنت حاليًا.',close:'إغلاق'};
const EN={tag:'REQUEST A QUOTE',title:'Start Your Project with FLEVO',desc:'Share your project details and our team will contact you to review the requirements and prepare a quotation.',name:'Full Name',company:'Company Name',phone:'Phone Number',email:'Email Address',service:'Service Type',event:'Exhibition / Event Name',date:'Execution Date',area:'Approximate Area',city:'City',budget:'Estimated Budget',notes:'Project Details',submit:'Submit Request',sending:'Saving your request and confirming delivery...',success:'Your request was saved successfully. Request ID:',error:'Could not save the request now. Check your connection and try again.',invalid:'Please review your name, phone number and email.',offline:'You are currently offline.',close:'Close'};
const lang=()=>window.FlevoI18n?.lang==='en'?'en':'ar';
const D=()=>lang()==='en'?EN:AR;
const clean=v=>String(v||'').trim();
const validPhone=v=>clean(v).replace(/\D/g,'').length>=8;
const validEmail=v=>!clean(v)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v));

function ensureModal(){
  if(document.getElementById('quoteModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div class="quote-modal" id="quoteModal" aria-hidden="true"><div class="quote-card" role="dialog" aria-modal="true" aria-labelledby="quoteTitle"><button class="quote-close" type="button">×</button><div class="quote-head"><span data-q="tag"></span><h2 id="quoteTitle" data-q="title"></h2><p data-q="desc"></p></div><form id="quoteForm" class="quote-form" novalidate><input type="hidden" id="qProject"><input type="text" id="qWebsite" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0"><div class="form-grid"><label><span data-q="name"></span><input id="qName" required autocomplete="name" maxlength="120"></label><label><span data-q="company"></span><input id="qCompany" autocomplete="organization" maxlength="160"></label><label><span data-q="phone"></span><input id="qPhone" required inputmode="tel" autocomplete="tel" dir="ltr" maxlength="30"></label><label><span data-q="email"></span><input id="qEmail" type="email" autocomplete="email" dir="ltr" maxlength="180"></label><label><span data-q="service"></span><select id="qService"><option value="Exhibition booth">Exhibition booth / بوث معرض</option><option value="Event setup">Event setup / تجهيز فعالية</option><option value="Fabrication">Fabrication / تصنيع</option><option value="Interior and partitions">Interior & partitions / تجهيزات وبارتيشن</option><option value="Other">Other / أخرى</option></select></label><label><span data-q="event"></span><input id="qEvent" maxlength="180"></label><label><span data-q="date"></span><input id="qDate" type="date"></label><label><span data-q="area"></span><input id="qArea" placeholder="مثال: 120 م²" maxlength="80"></label><label><span data-q="city"></span><input id="qCity" maxlength="100"></label><label><span data-q="budget"></span><input id="qBudget" maxlength="100"></label><label class="full"><span data-q="notes"></span><textarea id="qNotes" rows="5" maxlength="3000"></textarea></label></div><button class="quote-submit" type="submit" data-q="submit"></button><div class="form-status" id="qStatus" role="status" aria-live="polite"></div></form></div></div>`);
}

function translate(){
  const d=D();
  document.querySelectorAll('[data-q]').forEach(x=>x.textContent=d[x.dataset.q]||'');
  document.querySelector('.quote-close')?.setAttribute('aria-label',d.close);
}

function init(){
  ensureModal();translate();
  const modal=document.getElementById('quoteModal');
  const form=document.getElementById('quoteForm');
  const status=document.getElementById('qStatus');
  const submit=form.querySelector('[type=submit]');
  let submitting=false;

  const open=(project='')=>{
    translate();status.textContent='';status.className='form-status';
    document.getElementById('qProject').value=project||'';
    if(project&&!document.getElementById('qEvent').value)document.getElementById('qEvent').value=project;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    setTimeout(()=>document.getElementById('qName').focus(),80);
  };
  const close=()=>{if(submitting)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';};

  document.querySelectorAll('[data-open-quote],a[href="#quote"]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();open(x.dataset.project||'');}));
  modal.querySelector('.quote-close').onclick=close;
  modal.onclick=e=>{if(e.target===modal)close();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
  document.addEventListener('flevo:language',translate);

  form.onsubmit=async e=>{
    e.preventDefault();
    if(submitting)return;
    const d=D();
    const val=id=>clean(document.getElementById(id).value);

    if(val('qWebsite')) return; // honeypot
    if(!navigator.onLine){status.textContent=d.offline;status.className='form-status error';return;}
    if(val('qName').length<2||!validPhone(val('qPhone'))||!validEmail(val('qEmail'))){
      status.textContent=d.invalid;status.className='form-status error';return;
    }

    const requestId=(crypto?.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const payload={
      client_request_id:requestId,
      customer_name:val('qName'),company_name:val('qCompany')||null,phone:val('qPhone'),email:val('qEmail')||null,
      service_type:val('qService')||null,event_name:val('qEvent')||val('qProject')||null,event_date:val('qDate')||null,
      booth_area:val('qArea')||null,city:val('qCity')||null,budget:val('qBudget')||null,notes:val('qNotes')||null,status:'new'
    };

    submitting=true;status.textContent=d.sending;status.className='form-status';submit.disabled=true;submit.setAttribute('aria-busy','true');
    try{
      const saved=await FlevoStore.createQuotation(payload,{timeoutMs:20000});
      const ref=String(saved?.id||requestId).slice(0,8).toUpperCase();
      status.textContent=`${d.success} ${ref}`;status.className='form-status success';
      form.reset();
      document.dispatchEvent(new CustomEvent('flevo-quotation-saved',{detail:saved}));
      setTimeout(()=>{submitting=false;close();},2600);
    }catch(err){
      console.error('Quotation error:',err);
      const message=err?.message&& !/duplicate key/i.test(err.message)?err.message:d.error;
      status.textContent=message;status.className='form-status error';
      submitting=false;
    }finally{
      submit.disabled=false;submit.removeAttribute('aria-busy');
    }
  };
  window.FlevoQuote={open,close,translate};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
