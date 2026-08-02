const sb = window.supabase.createClient(window.FLEVO_SUPABASE_URL, window.FLEVO_SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'flevo-supabase-auth'
  }
});

const CAT_AR = {booths:'بوثات المعارض',events:'الفعاليات',manufacturing:'التصنيع',fabrication:'التصنيع',special:'أعمال خاصة'};

function rowToProject(r){
  const images=(r.project_images||[])
    .sort((a,b)=>(a.display_order||0)-(b.display_order||0))
    .map(x=>x.image_url);
  return {
    id:r.slug,uuid:r.id,titleAr:r.title_ar,titleEn:r.title_en||'',category:r.category||'booths',
    categoryAr:CAT_AR[r.category]||r.category,
    categoryEn:({booths:'Exhibition Booths',events:'Events',manufacturing:'Fabrication',fabrication:'Fabrication',special:'Special Projects'})[r.category]||r.category,
    client:r.client||'',location:r.location_ar||'',locationEn:r.location_en||r.location_ar||'',year:r.project_year||'',area:r.area||'',
    duration:r.duration_ar||'',durationEn:r.duration_en||r.duration_ar||'',cover:r.cover_image||images[0]||'assets/flevo-logo-transparent.png',
    descriptionAr:r.description_ar||'',descriptionEn:r.description_en||r.description_ar||'',
    scope:(r.scope_ar||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),
    scopeEn:(r.scope_en||r.scope_ar||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),
    images,published:r.published,featured:r.featured,order:r.display_order||999
  };
}

function withTimeout(promise, timeoutMs, timeoutMessage){
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage || 'انتهت مهلة الاتصال بالخادم.')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function isMissingClientRequestId(error){
  const text = `${error?.code||''} ${error?.message||''} ${error?.details||''}`.toLowerCase();
  return text.includes('client_request_id') && (
    text.includes('column') || text.includes('schema cache') || text.includes('pgrst204')
  );
}

window.FlevoStore={
  client:sb,
  async getProjects(includeHidden=false){
    let q=sb.from('projects').select('*,project_images(*)').order('display_order',{ascending:true});
    if(!includeHidden) q=q.eq('published',true);
    const {data,error}=await q;if(error)throw error;return (data||[]).map(rowToProject);
  },
  async getProjectBySlug(slug){
    const {data,error}=await sb.from('projects').select('*,project_images(*)').eq('slug',slug).single();if(error)throw error;return rowToProject(data);
  },
  async signIn(email,password){return await sb.auth.signInWithPassword({email,password});},
  async signOut(){return await sb.auth.signOut();},
  async session(){return (await sb.auth.getSession()).data.session;},
  async saveProject(p){
    const payload={slug:p.id,title_ar:p.titleAr,title_en:p.titleEn||null,client:p.client||null,category:p.category||'booths',location_ar:p.location||null,project_year:p.year?Number(p.year):null,area:p.area||null,duration_ar:p.duration||null,description_ar:p.descriptionAr||null,scope_ar:(p.scope||[]).join('\n'),cover_image:p.cover||null,published:!!p.published,featured:!!p.featured,display_order:Number(p.order)||999};
    let res;
    if(p.uuid)res=await sb.from('projects').update(payload).eq('id',p.uuid).select().single();
    else res=await sb.from('projects').insert(payload).select().single();
    if(res.error)throw res.error;p.uuid=res.data.id;return p;
  },
  async deleteProject(p){const {error}=await sb.from('projects').delete().eq('id',p.uuid);if(error)throw error;},
  async uploadImage(file,slug){
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`projects/${slug}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error}=await sb.storage.from(window.FLEVO_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;
    const {data}=sb.storage.from(window.FLEVO_BUCKET).getPublicUrl(path);return {url:data.publicUrl,path};
  },
  async addProjectImage(projectUuid,url,path='',order=0,isCover=false){const {data,error}=await sb.from('project_images').insert({project_id:projectUuid,image_url:url,storage_path:path,display_order:order,is_cover:isCover}).select().single();if(error)throw error;return data;},
  async removeProjectImage(projectUuid,url){const {data,error}=await sb.from('project_images').delete().eq('project_id',projectUuid).eq('image_url',url).select();if(error)throw error;return data;},

  /**
   * Create a quotation request and wait for Supabase to return the persisted row.
   * Uses client_request_id when the optional v5.11 migration is installed to make
   * repeated clicks/network retries idempotent. Falls back safely on old schemas.
   */
  async createQuotation(payload, options={}){
    const timeoutMs = Number(options.timeoutMs) || 20000;
    const requestId = payload.client_request_id || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const completePayload = {...payload, client_request_id: requestId};

    const insertWithId = async () => {
      const response = await sb
        .from('quotation_requests')
        .upsert(completePayload,{onConflict:'client_request_id',ignoreDuplicates:false})
        .select('*')
        .single();
      if(response.error) throw response.error;
      return response.data;
    };

    const insertLegacy = async () => {
      const legacyPayload = {...payload};
      delete legacyPayload.client_request_id;
      const response = await sb.from('quotation_requests').insert(legacyPayload).select('*').single();
      if(response.error) throw response.error;
      return response.data;
    };

    try {
      return await withTimeout(insertWithId(), timeoutMs, 'استغرق تأكيد حفظ الطلب وقتًا أطول من المعتاد. تحقق من الاتصال ثم حاول مرة أخرى.');
    } catch(error) {
      if(isMissingClientRequestId(error)) {
        return await withTimeout(insertLegacy(), timeoutMs, 'استغرق تأكيد حفظ الطلب وقتًا أطول من المعتاد. تحقق من الاتصال ثم حاول مرة أخرى.');
      }
      throw error;
    }
  },

  async getQuotations(){const {data,error}=await sb.from('quotation_requests').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];},
  async updateQuotation(id,patch){const {data,error}=await sb.from('quotation_requests').update(patch).eq('id',id).select().single();if(error)throw error;return data;},
  async deleteQuotation(id){const {error}=await sb.from('quotation_requests').delete().eq('id',id);if(error)throw error;return true;},
  subscribeToQuotations(callback, statusCallback){
    const channel=sb.channel(`quotation-requests-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'quotation_requests'},payload=>callback?.(payload))
      .subscribe(status=>statusCallback?.(status));
    return ()=>sb.removeChannel(channel);
  },

  async getServices(includeHidden=false){let q=sb.from('services').select('*').order('display_order',{ascending:true});if(!includeHidden)q=q.eq('published',true);const {data,error}=await q;if(error)throw error;return data||[];},
  async saveService(s){const payload={title_ar:s.title_ar,title_en:s.title_en||null,description_ar:s.description_ar||null,description_en:s.description_en||null,icon:s.icon||'✦',published:!!s.published,display_order:Number(s.display_order)||999};const r=s.id?await sb.from('services').update(payload).eq('id',s.id).select().single():await sb.from('services').insert(payload).select().single();if(r.error)throw r.error;return r.data;},
  async deleteService(id){const {error}=await sb.from('services').delete().eq('id',id);if(error)throw error;return true;},
  async getArticles(includeHidden=false){let q=sb.from('articles').select('*').order('display_order',{ascending:true});if(!includeHidden)q=q.eq('published',true);const {data,error}=await q;if(error)throw error;return data||[];},
  async saveArticle(a){const payload={slug:a.slug,title_ar:a.title_ar,title_en:a.title_en||null,excerpt_ar:a.excerpt_ar||null,excerpt_en:a.excerpt_en||null,content_ar:a.content_ar||null,content_en:a.content_en||null,category_ar:a.category_ar||null,category_en:a.category_en||null,image_url:a.image_url||null,published:!!a.published,display_order:Number(a.display_order)||999};const r=a.id?await sb.from('articles').update(payload).eq('id',a.id).select().single():await sb.from('articles').insert(payload).select().single();if(r.error)throw r.error;return r.data;},
  async deleteArticle(id){const {error}=await sb.from('articles').delete().eq('id',id);if(error)throw error;return true;},
  async createContactMessage(payload){const {data,error}=await sb.from('contact_messages').insert(payload).select().single();if(error)throw error;return data;},
  async getCompanySettings(){const {data,error}=await sb.from('company_settings').select('*').eq('id',1).single();if(error)throw error;return data;},
  async saveCompanySettings(patch){const {data,error}=await sb.from('company_settings').update({...patch,updated_at:new Date().toISOString()}).eq('id',1).select().single();if(error)throw error;return data;},
  export(list){const blob=new Blob([JSON.stringify(list,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='flevo-projects-backup.json';a.click();URL.revokeObjectURL(a.href);}
};
