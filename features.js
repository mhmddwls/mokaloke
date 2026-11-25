/* Mokaloke social extension: local-first demo, Firebase-ready */
(()=>{
"use strict";
const $=id=>document.getElementById(id), KEY="mokaloke_social_v1";
let state; try{state=JSON.parse(localStorage.getItem(KEY)||"{}")}catch{state={}}
state={phone:state.phone||"",friends:state.friends||[],chats:state.chats||[],statuses:state.statuses||[],activeChat:state.activeChat||null};
const persist=()=>localStorage.setItem(KEY,JSON.stringify(state));
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const me=()=>localStorage.getItem("luxor_connect_v1")?JSON.parse(localStorage.getItem("luxor_connect_v1")).profile||"زائر الأقصر":"زائر الأقصر";
const notify=t=>window.toast?toast(t):alert(t);
const tabs=[...document.querySelectorAll(".tab")];
function openPage(id){if(window.go)go(id);else{document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));tabs.forEach(x=>x.classList.toggle("active",x.dataset.page===id))}}
function ensureChat(title,type="private"){let c=state.chats.find(x=>x.title===title);if(!c){c={id:"c"+Date.now(),title,type,messages:[]};state.chats.unshift(c)}state.activeChat=c.id;persist();renderChats();openRoom(c.id)}
function renderFriends(){$("friendsList").innerHTML=state.friends.length?state.friends.map(f=>`<div class="friendRow"><span>👤</span><b>${safe(f.name)}</b><small>${safe(f.phone)}</small><button class="secondary" data-chat="${safe(f.name)}">مراسلة</button></div>`).join(""):'<div class="notice">لم تضف أصدقاء بعد. البحث المباشر يحتاج تفعيل قاعدة البيانات.</div>'}
function renderChats(){let q=($("chatSearch").value||"").toLowerCase();$("chatList").innerHTML=state.chats.filter(c=>c.title.toLowerCase().includes(q)).map(c=>`<div class="chatRow"><span>${c.type==="group"?"👥":"👤"}</span><div><b>${safe(c.title)}</b><div class="muted">${safe(c.messages.at(-1)?.text||"ابدأ المحادثة")}</div></div><button class="secondary" data-open="${c.id}">فتح</button></div>`).join("")||'<div class="notice">لا توجد محادثات. ابدأ بإضافة مجموعة أو مراسلة صديق.</div>'}
function openRoom(id){const c=state.chats.find(x=>x.id===id);if(!c)return;state.activeChat=id;persist();$("chatRoom").classList.remove("hidden");$("chatTitle").textContent=c.title;$("messages").innerHTML=c.messages.map(m=>`<div class="bubble ${m.mine?"mine":""}">${safe(m.text)}<small>${safe(m.time||"")}</small></div>`).join("");$("messages").scrollTop=$("messages").scrollHeight}
function renderStatuses(){$("statusList").innerHTML=state.statuses.map(s=>`<div class="statusCard"><b>🟢 ${safe(s.name)}</b><small> · ${safe(s.time)}</small><div class="statusText">${safe(s.text)}</div></div>`).join("")||'<div class="notice">لا توجد حالات حالياً. شارك أول حالة مع أصدقائك.</div>'}
$("savePhone").onclick=()=>{let n=$("myPhone").value.trim();if(!/^\+?[0-9]{8,15}$/.test(n))return notify("اكتب رقم هاتف صحيحاً مع مفتاح الدولة");state.phone=n;persist();notify("تم حفظ الرقم على هذا الجهاز")};
$("myPhone").value=state.phone;
$("searchFriend").onclick=()=>{const n=$("friendSearch").value.trim();if(!n)return notify("اكتب رقم الهاتف أولاً");notify("البحث العام عن الأرقام غير متاح قبل ربط Firebase وتسجيل المستخدمين");};
$("newGroup").onclick=()=>{let n=prompt("اسم المجموعة");if(n?.trim())ensureChat(n.trim(),"group")};
$("chatList").onclick=e=>{let b=e.target.closest("[data-open]");if(b)openRoom(b.dataset.open)};
$("friendsList").onclick=e=>{let b=e.target.closest("[data-chat]");if(b)ensureChat(b.dataset.chat)};
$("sendMessage").onclick=()=>{let text=$("messageText").value.trim(),c=state.chats.find(x=>x.id===state.activeChat);if(!text||!c)return;c.messages.push({text,mine:true,time:new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})});$("messageText").value="";persist();openRoom(c.id);renderChats()};
$("messageText").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendMessage").click()});
$("backChats").onclick=()=>{$("chatRoom").classList.add("hidden")};
const stickers=["😀","😂","😍","❤️","👍","👏","🎉","🌹","🔥","🙏","🥰","😎","💯","✨","🫶","🌍","🏛️","𓂀"];
$("stickerBtn").onclick=()=>{$("stickerTray").classList.toggle("hidden");$("stickerTray").innerHTML=stickers.map(x=>`<button>${x}</button>`).join("")};
$("stickerTray").onclick=e=>{if(e.target.tagName==="BUTTON"){$("messageText").value+=$("messageText").value?" "+e.target.textContent:e.target.textContent;$("messageText").focus()}};
$("addStatus").onclick=()=>{let t=prompt("اكتب حالتك (نص قصير)");if(t?.trim()){state.statuses.unshift({name:me(),text:t.trim(),time:new Date().toLocaleString("ar-EG")});persist();renderStatuses()}};
$("chatSearch").oninput=renderChats;
renderFriends();renderChats();renderStatuses();

/* Firebase configuration hook. Online mode remains disabled until a real project config is supplied. */
window.MokalokeOnline={enabled:false,configure(config){
 if(!window.firebase){notify("مكتبات Firebase لم يتم تحميلها");return false}
 try{if(!firebase.apps.length)firebase.initializeApp(config);this.db=firebase.firestore();this.auth=firebase.auth();this.enabled=true;notify("تم الاتصال بخدمة Firebase؛ أضف قواعد الأمان قبل نشر التطبيق");return true}catch(e){console.error(e);notify("تعذر الاتصال بـ Firebase");return false}
}};
})();