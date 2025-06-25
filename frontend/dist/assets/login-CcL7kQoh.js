import{T as b}from"./bootstrap.esm-DGoQCxh1.js";import{r as y,c as x,a as L}from"./form-builder-WLbl3xe7.js";async function w(e,o){const n={email:e,password:o};try{const t=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!t.ok){const r=await t.text();console.error("Antwort vom Server (Fehler):",r);try{const s=JSON.parse(r);throw new Error(s.message||`HTTP-Fehler! Status: ${t.status}`)}catch{throw new Error(r||`HTTP-Fehler! Status: ${t.status}`)}}const a=await t.json();return a&&a.token&&localStorage.setItem("userInfo",JSON.stringify(a)),a}catch(t){throw console.error("Fehler beim Login:",t),t}}async function S(e,o,n,t,a){try{const r=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({firstName:e,lastName:o,email:n,password:t,customFields:a})}),s=await r.json();if(!r.ok)throw new Error(s.message||"Ein unbekannter Fehler ist aufgetreten.");return s}catch(r){throw console.error("Fehler bei der Registrierung:",r),r}}function f(e){const n=/[A-Z]/.test(e),t=/[a-z]/.test(e),a=/\d/.test(e),r=/[!@#$%^&*(),.?":{}|<>]/.test(e),s=[{key:"length",label:"Mindestens 8 Zeichen",met:e.length>=8,weight:2},{key:"uppercase",label:"Mindestens einen Großbuchstaben (A-Z)",met:n,weight:1},{key:"lowercase",label:"Mindestens einen Kleinbuchstaben (a-z)",met:t,weight:1},{key:"number",label:"Mindestens eine Zahl (0-9)",met:a,weight:1},{key:"special",label:"Mindestens ein Sonderzeichen (!@#$%^&*)",met:r,weight:1}],l=s.filter(c=>c.met),u=s.reduce((c,v)=>c+v.weight,0),h=l.reduce((c,v)=>c+v.weight,0),d=Math.round(h/u*100);let i="sehr-schwach",g="Sehr schwach",m="#dc3545";return d>=100?(i="sehr-stark",g="Sehr stark",m="#198754"):d>=80?(i="stark",g="Stark",m="#28a745"):d>=60?(i="mittel",g="Mittel",m="#ffc107"):d>=40&&(i="schwach",g="Schwach",m="#fd7e14"),{isValid:l.length===s.length,requirements:s,metRequirements:l,strengthPercent:d,strengthLevel:i,strengthText:g,strengthColor:m,errors:s.filter(c=>!c.met).map(c=>c.label)}}function k(e,o){const n=document.getElementById(o);if(!n||!e)return console.error("Password input oder container nicht gefunden"),null;const t=`
        <div class="password-strength-container mt-2">
            <!-- Fortschrittsbalken -->
            <div class="password-strength-progress mb-2">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: 0%; transition: all 0.3s ease;" 
                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-1">
                    <small class="password-strength-text text-muted">Passwort eingeben...</small>
                    <small class="password-strength-percentage text-muted">0%</small>
                </div>
            </div>
            
            <!-- Anforderungen-Liste -->
            <div class="password-requirements">
                <div class="row g-1">
                    <div class="col-12">
                        <small class="text-muted fw-bold">Anforderungen:</small>
                    </div>
                </div>
                <div class="requirements-list mt-1"></div>
            </div>
        </div>
    `;e.innerHTML=t;const a=e.querySelector(".progress-bar"),r=e.querySelector(".password-strength-text"),s=e.querySelector(".password-strength-percentage"),l=e.querySelector(".requirements-list");function u(){const d=n.value;if(!d){a.style.width="0%",a.style.backgroundColor="#e9ecef",r.textContent="Passwort eingeben...",r.className="password-strength-text text-muted",s.textContent="0%",l.innerHTML="",n.classList.remove("is-valid","is-invalid");return}const i=f(d);return a.style.width=`${i.strengthPercent}%`,a.style.backgroundColor=i.strengthColor,a.setAttribute("aria-valuenow",i.strengthPercent),r.textContent=i.strengthText,r.className="password-strength-text fw-bold",r.style.color=i.strengthColor,s.textContent=`${i.strengthPercent}%`,s.style.color=i.strengthColor,h(i.requirements),i.isValid?(n.classList.remove("is-invalid"),n.classList.add("is-valid")):(n.classList.remove("is-valid"),n.classList.add("is-invalid")),i}function h(d){const i=d.map(g=>{const m=g.met?"text-success":"text-muted",c=g.met?"✓":"○",v=g.met?"text-success":"text-muted";return`
                <div class="requirement-item d-flex align-items-center gap-2 mb-1">
                    <span class="${m}" style="font-weight: bold; font-size: 12px;">${c}</span>
                    <small class="${v}" style="font-size: 11px;">${g.label}</small>
                </div>
            `}).join("");l.innerHTML=i}return n.addEventListener("input",u),n.addEventListener("keyup",u),n.addEventListener("blur",u),u(),{validate:()=>f(n.value),update:u,isValid:()=>f(n.value).isValid,getPassword:()=>n.value,reset:()=>{n.value="",u()}}}async function p(e,o){try{const n=await w(e,o);localStorage.setItem("token",n.token),window.location.href="/core/dashboard/index.html"}catch(n){const t=document.querySelector("#login-panel .feedback-message");t?(t.textContent=`Dev-Login fehlgeschlagen: ${n.message}`,t.className="feedback-message mt-3 text-center text-danger"):console.error("Dev-Login fehlgeschlagen:",n)}}function E(e){e&&e.addEventListener("submit",async o=>{o.preventDefault();const n=e.querySelector('button[type="submit"]');let t=e.querySelector(".feedback-message");t||(t=document.createElement("div"),t.className="feedback-message mt-3 text-center",e.appendChild(t)),n.disabled=!0,t.textContent="";const a=e.querySelector("#email").value,r=e.querySelector("#password").value;try{const s=await w(a,r);localStorage.setItem("token",s.token),window.location.href="/core/dashboard/index.html"}catch(s){t.textContent=s.message,t.className="feedback-message mt-3 text-center text-danger"}finally{n.disabled=!1}})}function C(e){if(!e)return;const o=document.getElementById("dynamic-fields-container");o&&y(o,L);const n=document.getElementById("password-strength-container");let t=null;n&&(t=k(n,"register-password")),e.addEventListener("submit",async r=>{r.preventDefault();const s=document.getElementById("register-form"),l=document.getElementById("register-success-message"),u=e.querySelector("#register-firstname").value,h=e.querySelector("#register-lastname").value,d=e.querySelector("#register-email").value,i=e.querySelector("#register-password").value,g=x(o);if(t&&!t.isValid()){const c=`Passwort erfüllt nicht alle Anforderungen:

${t.validate().errors.join(`
`)}`;a(c);return}try{await S(u,h,d,i,g),s.classList.add("d-none"),l.classList.remove("d-none")}catch(m){a(m.message)}});function a(r){let s=e.querySelector(".registration-feedback");if(!s){s=document.createElement("div"),s.className="registration-feedback alert alert-danger mt-3",s.setAttribute("role","alert");const l=e.querySelector('button[type="submit"]');l.parentNode.insertBefore(s,l)}s.innerHTML=`
            <div class="d-flex align-items-start">
                <div class="me-2">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                    <strong>Registrierung fehlgeschlagen:</strong><br>
                    ${r.replace(/\n/g,"<br>")}
                </div>
            </div>
        `,s.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>{s.parentNode&&s.remove()},1e4)}}function T(){const e=document.getElementById("login-form");E(e);const o=document.getElementById("register-form");C(o),[].slice.call(document.querySelectorAll("#auth-tabs button")).forEach(function(r){const s=new b(r);r.addEventListener("click",function(l){l.preventDefault(),s.show()})});const t=document.getElementById("dev-login-admin-btn");t&&t.addEventListener("click",()=>{p("admin@seniorenheim.de","Admin123!")});const a=document.getElementById("dev-login-user-btn");a&&a.addEventListener("click",()=>{p("nehilanthe@gmail.com","91LiKWlh@MxI")})}document.addEventListener("DOMContentLoaded",()=>{T()});
