/* ============ إعدادات الربط ============
   MODE: 'local'    -> تجربة فورية بدون سيرفر (localStorage داخل نفس المتصفح فقط)
         'supabase' -> تشغيل حقيقي عبر Supabase

   جداول Supabase (SQL):
   create table subjects(id uuid primary key default gen_random_uuid(), name text not null);
   create table sections(id uuid primary key default gen_random_uuid(), subject_id uuid references subjects on delete cascade, name text not null);
   create table sheets(id uuid primary key default gen_random_uuid(), section_id uuid references sections on delete cascade, number int, title text, file_url text, created_at timestamptz default now());
   create table access_logs(id uuid primary key default gen_random_uuid(), sheet_id uuid, sheet_title text, session_id text, ip text, device text, opened_at timestamptz default now());
   create table revoked_sessions(id uuid primary key default gen_random_uuid(), session_id text unique, created_at timestamptz default now());
   + أنشئ Bucket اسمه sheets في Storage، وفعّل RLS (انظر الملاحظات في الرد).
*/
const CONFIG = {
  MODE: 'local',
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_KEY: 'YOUR_ANON_KEY',
  BUCKET: 'sheets',
  ADMIN_PASSWORD: 'change-me' // للتجربة فقط: استبدله بـ Supabase Auth
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const DB = (() => {
  const sb = CONFIG.MODE === 'supabase';
  const L = {
    get: t => JSON.parse(localStorage.getItem('geo_' + t) || '[]'),
    set: (t, v) => localStorage.setItem('geo_' + t, JSON.stringify(v))
  };
  const H = () => ({ apikey: CONFIG.SUPABASE_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' });
  const R = t => `${CONFIG.SUPABASE_URL}/rest/v1/${t}`;

  return {
    async list(t) {
      if (sb) return (await fetch(`${R(t)}?select=*`, { headers: H() })).json();
      return L.get(t);
    },
    async insert(t, row) {
      if (sb) return (await (await fetch(R(t), { method: 'POST', headers: H(), body: JSON.stringify(row) })).json())[0];
      const now = new Date().toISOString();
      const rec = { id: crypto.randomUUID(), created_at: now, opened_at: now, ...row };
      L.set(t, [...L.get(t), rec]);
      return rec;
    },
    async remove(t, id) {
      if (sb) return fetch(`${R(t)}?id=eq.${id}`, { method: 'DELETE', headers: H() });
      L.set(t, L.get(t).filter(r => r.id !== id));
    },
    async upload(file) {
      if (sb) {
        const name = Date.now() + '-' + file.name.replace(/[^\w.-]/g, '_');
        const r = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/${CONFIG.BUCKET}/${name}`, {
          method: 'POST',
          headers: { apikey: CONFIG.SUPABASE_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY, 'Content-Type': file.type },
          body: file
        });
        if (!r.ok) throw new Error('فشل رفع الملف');
        return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${CONFIG.BUCKET}/${name}`;
      }
      return new Promise((res, rej) => { // الوضع المحلي: الملف يُحفظ كـ Data URL (حد التخزين ~5MB)
        const f = new FileReader();
        f.onload = () => res(f.result);
        f.onerror = () => rej(new Error('تعذّرت قراءة الملف'));
        f.readAsDataURL(file);
      });
    }
  };
})();

const Session = {
  id() {
    let s = localStorage.getItem('geo_sid');
    if (!s) { s = 'S-' + crypto.randomUUID().slice(0, 8); localStorage.setItem('geo_sid', s); }
    return s;
  },
  device() {
    const u = navigator.userAgent;
    const os = /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'غير معروف';
    const br = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'متصفح آخر';
    return `${os} / ${br} / ${/Mobi/.test(u) ? 'جوال' : 'حاسوب'}`;
  },
  async ip() { // للإنتاج: اجلب الـ IP من Edge Function لأن هذه القيمة يمكن تزويرها من المتصفح
    try { return (await (await fetch('https://api.ipify.org?format=json')).json()).ip; }
    catch { return 'غير معروف'; }
  }
};
