/* Mokaloke cloud social module. Requires Supabase project + schema.sql. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const CFG="mokaloke_supabase_config_v1";
let sb=null,user=null,active=null,channel=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const say=t=>window.toast?window.toast(t):alert(t);
const cfg=()=>{try{return JSON.parse(localStorage.getItem(CFG)||"null")}catch{return null}};
function setState(t){$("connectionState").textContent=t}
function showAuth(){ $("authPanel").classList.remove("hidden"); $("socialApp").classList.add("hidden"); }
function showApp(){ $("authPanel").classList.add("hidden"); $("socialApp").classList.remove("hidden"); loadChats(); loadStatuses(); }
async function connect(url,key){
 if(!window.supabase?.createClient){say("تعذر تحميل مكتبة الاتصال. افحص الإنترنت.");return}
 try{sb=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});localStorage.setItem(CFG,JSON.stringify({url,key}));setState("تم الاتصال بالخدمة");const {data,error}=await sb.auth.getSession();if(error)throw error;user=data.session?.user||null;if(user)showApp();else showAuth();}catch(e){setState("فشل الاتصال");say(e.message||"تعذر الاتصال")}
}
$("connectCloud").onclick=()=>{const u=$("sbUrl").value.trim(),k=$("sbKey").value.trim();if(!u.startsWith("https://")||!k)return say("أدخل الرابط والمفتاح الصحيحين");connect(u,k)};
const saved=cfg();if(saved){$("sbUrl").value=saved.url;$("sbKey").value=saved.key;connect(saved.url,saved.key)}
$("signUp").onclick=async()=>{if(!sb)return say("اتصل بالخدمة أولاً");const email=$("authEmail").value.trim(),password=$("authPassword").value,name=$("authName").value.trim(),username=$("authUsername").value.trim().toLowerCase();if(!name||!email||!/^([a-z0-9_]{3,24})$/.test(username)||password.length<8)return say("أدخل الاسم واسم مستخدم من 3-24 حرفاً إنجليزياً/أرقاماً/شرطة سفلية والبريد وكلمة مرور من 8 أحرف");const {error}=await sb.auth.signUp({email,password,options:{data:{display_name:name,username}}});if(error)return say(error.message);say("تم إنشاء الحساب. افحص بريدك لتأكيد التسجيل إذا كان التحقق مفعلاً.")};
$("signIn").onclick=async()=>{if(!sb)return say("اتصل بالخدمة أولاً");const {data,error}=await sb.auth.signInWithPassword({email:$("authEmail").value.trim(),password:$("authPassword").value});if(error)return say(error.message);user=data.user;showApp();say("تم تسجيل الدخول")};
$("signOut").onclick=async()=>{if(sb)await sb.auth.signOut();user=null;showAuth()};
if(sb)sb.auth.onAuthStateChange((_e,session)=>{user=session?.user||null;if(user)showApp();else showAuth()});
async function loadChats(){if(!sb||!user)return;const {data,error}=await sb.from("conversation_members").select("conversation_id, conversations(id,title,kind,updated_at)").eq("user_id",user.id);if(error){say("تعذر تحميل المحادثات: "+error.message);return}const rows=(data||[]).map(x=>x.conversations).filter(Boolean);$("cloudChats").innerHTML=rows.map(c=>`<div class="cloudChat"><b>${c.kind==="group"?"👥":"💬"} ${esc(c.title||"محادثة خاصة")}</b><button class="secondary" data-chat="${c.id}">فتح</button></div>`).join("")||'<p class="hint">لا توجد محادثات بعد. ابحث عن صديق لبدء محادثة.</p>'}
$("cloudChats").onclick=e=>{const b=e.target.closest("[data-chat]");if(b)openChat(b.dataset.chat)};
async function openChat(id){active=id;const {data,error}=await sb.from("conversations").select("id,title").eq("id",id).single();if(error)return say(error.message);$("roomTitle").textContent=data.title||"محادثة خاصة";$("cloudRoom").classList.remove("hidden");await loadMessages();if(channel)sb.removeChannel(channel);channel=sb.channel("room-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"conversation_id=eq."+id},payload=>renderMessage(payload.new)).subscribe()}
async function loadMessages(){const {data,error}=await sb.from("messages").select("id,body,sender_id,created_at").eq("conversation_id",active).order("created_at",{ascending:true}).limit(150);if(error)return say(error.message);$("cloudMessages").innerHTML="";(data||[]).forEach(renderMessage)}
function renderMessage(m){const el=document.createElement("div");el.className="cloudBubble"+(m.sender_id===user.id?" mine":"");const d=new Date(m.created_at);el.innerHTML=esc(m.body)+"<small>"+d.toLocaleString("ar-EG")+"</small>";$("cloudMessages").appendChild(el);$("cloudMessages").scrollTop=$("cloudMessages").scrollHeight}
$("sendCloudMessage").onclick=async()=>{const body=$("cloudMessage").value.trim();if(!body||!active)return;const {error}=await sb.from("messages").insert({conversation_id:active,sender_id:user.id,body});if(error)return say(error.message);$("cloudMessage").value=""};
$("cloudMessage").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendCloudMessage").click()});
$("closeRoom").onclick=()=>{$("cloudRoom").classList.add("hidden");if(channel){sb.removeChannel(channel);channel=null}active=null};
$("findUsers").onclick=async()=>{const q=$("userSearch").value.trim();if(q.length<2)return say("اكتب حرفين على الأقل");const {data,error}=await sb.from("profiles").select("id,display_name,username").ilike("username","%"+q+"%").neq("id",user.id).limit(20);if(error)return say(error.message);$("userResults").innerHTML=(data||[]).map(p=>`<div class="userResult"><span>👤 ${esc(p.display_name||p.username||"مستخدم")}</span><button class="secondary" data-user="${p.id}">مراسلة</button></div>`).join("")||'<p class="hint">لا توجد نتائج</p>'};
$("userResults").onclick=async e=>{const b=e.target.closest("[data-user]");if(!b)return;const {data,error}=await sb.rpc("create_direct_conversation",{other_user:b.dataset.user});if(error)return say(error.message);await loadChats();openChat(data)};
$("makeGroup").onclick=async()=>{const title=prompt("اسم المجموعة");if(!title?.trim())return;const members=prompt("أدخل UUID للأعضاء مفصولاً بفواصل، أو اتركه فارغاً لمجموعة لك وحدك")||"";const ids=members.split(",").map(x=>x.trim()).filter(Boolean);const {data,error}=await sb.rpc("create_group_conversation",{group_title:title.trim(),member_ids:ids});if(error)return say(error.message);await loadChats();openChat(data)};
async function loadStatuses(){if(!sb||!user)return;const {data,error}=await sb.from("statuses").select("id,body,created_at,profiles(display_name)").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(50);if(error){$("cloudStatuses").innerHTML='<p class="hint">تعذر تحميل الحالات</p>';return}$("cloudStatuses").innerHTML=(data||[]).map(s=>`<div class="statusLine"><b>🟢 ${esc(s.profiles?.display_name||"مستخدم")}</b><p>${esc(s.body)}</p><small>${new Date(s.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||'<p class="hint">لا توجد حالات منشورة حالياً</p>'}
$("addCloudStatus").onclick=async()=>{const body=prompt("اكتب حالتك (تختفي بعد 24 ساعة)");if(!body?.trim())return;const {error}=await sb.from("statuses").insert({user_id:user.id,body:body.trim()});if(error)return say(error.message);loadStatuses()};
})();
