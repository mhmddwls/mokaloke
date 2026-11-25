const KEY="luxor_connect_v1";
const places=[
["معبد الكرنك","🏛️","تاريخ، تصوير، وجولة إرشادية"],
["معبد الأقصر","🌅","زيارة صباحية أو مسائية وتجربة صوتية"],
["وادي الملوك","⛰️","مقابر ملكية ومناظر جبلية"],
["معبد حتشبسوت","👑","عمارة فريدة وقصة الملكة حتشبسوت"],
["متحف الأقصر","🏺","قطع أثرية مختارة بعناية"],
["البر الغربي","🚲","مسارات للرحلات والتصوير"]
];
let db=JSON.parse(localStorage.getItem(KEY)||'{"posts":[],"events":[],"profile":"زائر الأقصر"}');
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.style.display="block";setTimeout(()=>e.style.display="none",1800)}
function go(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p).classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.page===p))}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
function modal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("newPostBtn").onclick=()=>modal(`<h2>منشور جديد</h2><form class="form" id="postForm"><label>اكتب ما تريد مشاركته</label><textarea id="postText" required></textarea><label>صورة</label><input id="postImg" type="file" accept="image/*"><button class="primary">نشر</button></form>`);
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")e.currentTarget.classList.add("hidden")};
document.addEventListener("submit",e=>{
 if(e.target.id==="postForm"){e.preventDefault();const text=document.getElementById("postText").value.trim(),f=document.getElementById("postImg").files[0];if(f){const r=new FileReader();r.onload=()=>addPost(text,r.result);r.readAsDataURL(f)}else addPost(text,"")}
 if(e.target.id==="eventForm"){e.preventDefault();db.events.unshift({title:eventTitle.value,date:eventDate.value,place:eventPlace.value});save();document.getElementById("modal").classList.add("hidden");toast("تمت إضافة الفعالية")}
});
function addPost(text,img){db.posts.unshift({id:Date.now(),name:db.profile,text,img,likes:0,comments:[]});save();document.getElementById("modal").classList.add("hidden");toast("تم نشر المنشور")}
function render(){
 const feed=document.getElementById("feed");
 feed.innerHTML=db.posts.length?db.posts.map(p=>`<article class="post"><div class="postHead"><div class="avatar">👤</div><div><b>${esc(p.name)}</b><small> · الآن</small></div></div><p>${esc(p.text)}</p>${p.img?`<img src="${p.img}" alt="صورة المنشور">`:""}<div class="actions"><button onclick="like(${p.id})">👍 ${p.likes}</button><button onclick="comment(${p.id})">💬 ${p.comments.length}</button><button onclick="sharePost(${p.id})">↗️ مشاركة</button></div><div class="comments">${p.comments.map(c=>`<div class="comment"><b>${esc(c.name)}:</b> ${esc(c.text)}</div>`).join("")}</div></article>`).join(""):`<div class="notice">لا توجد منشورات بعد. كن أول من يشارك تجربة من الأقصر!</div>`;
 document.getElementById("placeCards").innerHTML=places.map(p=>`<div class="place"><span class="badge">مكان سياحي</span><h3>${p[1]} ${p[0]}</h3><p>${p[2]}</p><button class="secondary" onclick="toast('ميزة الحجز والموقع يمكن ربطها بخرائط Google في النسخة المتصلة')">فتح الدليل</button></div>`).join("");
 document.getElementById("eventsList").innerHTML=db.events.length?db.events.map((e,i)=>`<div class="event"><h3>📅 ${esc(e.title)}</h3><p>${esc(e.date)} — ${esc(e.place)}</p><button class="secondary" onclick="db.events.splice(${i},1);save()">حذف</button></div>`).join(""):`<div class="notice">لا توجد فعاليات مضافة.</div>`;
 document.getElementById("profileName").textContent=db.profile;
 document.getElementById("postCount").textContent=db.posts.length;
 document.getElementById("likeCount").textContent=db.posts.reduce((a,p)=>a+p.likes,0);
 document.getElementById("commentCount").textContent=db.posts.reduce((a,p)=>a+p.comments.length,0);
}
window.like=id=>{let p=db.posts.find(x=>x.id===id);p.likes++;save()};
window.comment=id=>{const t=prompt("اكتب تعليقك");if(t){db.posts.find(x=>x.id===id).comments.push({name:db.profile,text:t});save()}};
window.sharePost=id=>{navigator.clipboard?.writeText(location.href);toast("تم نسخ رابط التطبيق للمشاركة")};
window.esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
document.getElementById("editProfile").onclick=()=>{const n=prompt("اسمك",db.profile);if(n){db.profile=n;save()}};
document.getElementById("addEventBtn").onclick=()=>modal(`<h2>إضافة فعالية</h2><form class="form" id="eventForm"><input id="eventTitle" placeholder="اسم الفعالية" required><input id="eventDate" type="date" required><input id="eventPlace" placeholder="المكان" required><button class="primary">إضافة</button></form>`);
document.getElementById("guideBtn").onclick=()=>modal(`<h2>🧭 مساعد السائح</h2><p>اختر نوع المساعدة:</p><div class="list"><button class="secondary" onclick="toast('يمكن إضافة خدمة مرشد سياحي')">طلب مرشد سياحي</button><button class="secondary" onclick="toast('يمكن إضافة خدمة برنامج يومي')">برنامج يوم كامل</button><button class="secondary" onclick="toast('يمكن إضافة خدمة مواصلات')">مواصلات</button><button class="secondary" onclick="toast('يمكن إضافة خدمة حجز رحلة نيلية')">رحلة نيلية</button></div>`);
document.getElementById("phraseBtn").onclick=()=>modal(`<h2>🌍 عبارات للسائح</h2><div class="lang"><b>Welcome to Luxor</b><br>أهلاً بك في الأقصر</div><div class="lang"><b>How can I help you?</b><br>كيف يمكنني مساعدتك؟</div><div class="lang"><b>Have a nice trip!</b><br>أتمنى لك رحلة سعيدة!</div>`);
document.getElementById("search").oninput=e=>{const q=e.target.value.trim();document.querySelectorAll(".place").forEach((x,i)=>x.style.display=!q||places[i].join(" ").includes(q)?"block":"none")};

document.getElementById("adminBtn").onclick=()=>modal(`<h2>🔐 لوحة التحكم</h2><form class="form" id="loginForm"><input id="adminCode" type="password" inputmode="numeric" placeholder="رمز الإدارة" required><button class="primary">دخول</button></form>`);
document.addEventListener("submit",e=>{if(e.target.id==="loginForm"){e.preventDefault();if(document.getElementById("adminCode").value==="189132")adminPanel();else toast("رمز الإدارة غير صحيح")}});
function adminPanel(){modal(`<h2>🛡️ الإدارة الكاملة</h2><div class="admin"><div class="notice">أنت في وضع الإدارة. في هذه النسخة البيانات محفوظة على هذا الجهاز فقط.</div><button class="secondary" onclick="adminExport()">📦 تصدير البيانات</button><button class="secondary" onclick="adminImport()">📥 استيراد نسخة</button><button class="secondary" onclick="toast('إدارة المستخدمين تحتاج قاعدة بيانات عند تحويل المشروع لنسخة أونلاين')">👥 إدارة المستخدمين</button><button class="secondary" onclick="toast('الإشعارات والتنبيهات جاهزة للربط بخدمة Push')">🔔 الإشعارات</button><button class="danger" onclick="if(confirm('حذف كل البيانات؟')){localStorage.removeItem(KEY);location.reload()}">🗑️ مسح كل البيانات</button></div>`)}
function adminExport(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download="luxor-connect-backup.json";a.click()}
function adminImport(){const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=()=>{const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();toast("تم الاستيراد")}catch{toast("ملف غير صالح")}};r.readAsText(i.files[0])};i.click()}
render();