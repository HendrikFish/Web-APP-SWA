import{C as B}from"./bootstrap.esm-DGoQCxh1.js";import{i as C}from"./header-DaFr1czl.js";/* empty css               */import{showToast as l}from"./toast-notification-BBb3bACE.js";async function j(){try{const e=await fetch("/api/einrichtungen/stammdaten");if(!e.ok)throw new Error("Netzwerkantwort war nicht erfolgreich.");return await e.json()}catch(e){throw console.error("Fehler beim Abrufen der Einrichtungs-Stammdaten:",e),e}}async function T(e){try{const t=await fetch("/api/einrichtungen",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify(e)});if(!t.ok){const n=await t.json();throw new Error(n.message||"Fehler beim Speichern der Einrichtung.")}return await t.json()}catch(t){throw console.error("Fehler beim Erstellen der Einrichtung:",t),t}}async function M(){try{const e=await fetch("/api/einrichtungen");if(!e.ok)throw new Error("Fehler beim Laden der Einrichtungen.");return await e.json()}catch(e){throw console.error("Fehler beim Abrufen der Einrichtungen:",e),e}}async function D(e){try{const t=await fetch(`/api/einrichtungen/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});if(!t.ok){const n=await t.json();throw new Error(n.message||"Fehler beim Löschen der Einrichtung.")}return await t.json()}catch(t){throw console.error("Fehler beim Löschen der Einrichtung:",t),t}}async function G(e){try{const t=await fetch(`/api/einrichtungen/${e}`);if(!t.ok)throw new Error("Einrichtung konnte nicht geladen werden.");return await t.json()}catch(t){throw console.error("Fehler beim Abrufen der Einrichtung:",t),t}}async function H(e,t){try{const n=await fetch(`/api/einrichtungen/${e}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify(t)});if(!n.ok){const r=await n.json();throw new Error(r.message||"Fehler beim Aktualisieren der Einrichtung.")}return await n.json()}catch(n){throw console.error("Fehler beim Aktualisieren der Einrichtung:",n),n}}const f=document.getElementById("einrichtung-form-container"),I=document.getElementById("form-collapse-container"),d=I?new B(I,{toggle:!1}):null;let p=null;function N(e){const t=`
        <div class="card shadow-sm rounded-0">
            <div class="card-body">
                <h3 class="card-title mb-4">Neue Einrichtung anlegen</h3>
                <form id="einrichtung-form">
                    <div class="row">

                        <!-- ========== Spalte 1: Grunddaten & Konfiguration ========== -->
                        <div class="col-12 col-lg-4 border-end-lg">
                            <h4 class="h5 mb-3">Grunddaten</h4>
                            <div class="mb-3">
                                <label for="name" class="form-label">Name der Einrichtung</label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="kuerzel" class="form-label">Kürzel</label>
                                <input type="text" class="form-control" id="kuerzel" required>
                            </div>
                            <div class="mb-3">
                                <label for="adresse" class="form-label">Adresse</label>
                                <textarea class="form-control" id="adresse" rows="2" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="ansprechperson" class="form-label">Ansprechperson</label>
                                <input type="text" class="form-control" id="ansprechperson">
                            </div>
                            <div class="mb-3">
                                <label for="telefon" class="form-label">Telefonnummer</label>
                                <input type="tel" class="form-control" id="telefon">
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">E-Mail</label>
                                <input type="email" class="form-control" id="email">
                            </div>

                            <hr class="my-4">
                            
                            <h4 class="h5 mb-3">Konfiguration</h4>
                            <div class="mb-3">
                                <div class="form-label">Einrichtungstyp</div>
                                <input type="hidden" id="einrichtung-typ" value="extern">
                                <div class="btn-group w-100" role="group" aria-label="Einrichtungstyp">
                                    <button type="button" class="btn btn-outline-primary active" data-typ="extern">Extern</button>
                                    <button type="button" class="btn btn-outline-primary" data-typ="intern">Intern</button>
                                </div>
                            </div>
                             <div class="mb-3">
                                <label for="personengruppe" class="form-label">Personengruppe</label>
                                <select class="form-select" id="personengruppe">
                                    ${e.personengruppen.map(n=>`<option value="${n}">${n}</option>`).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="tour" class="form-label">Tour</label>
                                <select class="form-select" id="tour">
                                    ${e.touren.map(n=>`<option value="${n.name}">${n.name} (${n.zeit})</option>`).join("")}
                                </select>
                            </div>
                        </div>

                        <!-- ========== Spalte 2: Speiseplan ========== -->
                        <div class="col-12 col-lg-4 border-end-lg">
                            <h4 class="h5 mb-3">Speiseangebot (Mittag)</h4>
                            ${["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"].map(n=>`
                                <div class="mb-3">
                                    <label class="form-label fw-bold d-block">${n}</label>
                                    <div class="btn-group w-100" role="group" aria-label="Speiseangebot für ${n}">
                                        ${e.speiseplanKomponenten.map(r=>`
                                            <input type="checkbox" class="btn-check" id="${n}-${r}" autocomplete="off" value="${r}">
                                            <label class="btn btn-outline-secondary" for="${n}-${r}">${r}</label>
                                        `).join("")}
                                        <button type="button" class="btn btn-outline-primary select-all-day-btn" data-tag="${n}">Alle</button>
                                    </div>
                                </div>
                            `).join("")}
                        </div>

                        <!-- ========== Spalte 3: Gruppen & Aktionen ========== -->
                        <div class="col-12 col-lg-4">
                            <h4 class="h5 mb-3">Gruppenverwaltung</h4>
                            <div id="gruppen-liste">
                                <!-- Gruppen werden hier dynamisch hinzugefügt -->
                            </div>
                            <button type="button" class="btn btn-outline-secondary btn-sm mt-2" id="add-gruppe-btn">
                                <i class="bi bi-plus"></i> Gruppe hinzufügen
                            </button>
                            <p class="mt-3">Gesamtanzahl Personen: <strong id="gesamt-personen">0</strong></p>

                            <hr class="my-4">
                            
                             <!-- Speiseangebot Abend (nur für Interne) -->
                            <div id="abendessen-container" class="d-none">
                                <h4 class="h5 mb-3">Speiseangebot (Abend)</h4>
                                <!-- Optionen für Abendessen hier -->
                            </div>

                            <div class="d-grid gap-2 mt-5">
                                 <button type="submit" class="btn btn-primary">Einrichtung speichern</button>
                                 <button type="button" class="btn btn-light" id="cancel-btn">Abbrechen</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;if(!document.getElementById("form-layout-styles")){const n=document.createElement("style");n.id="form-layout-styles",n.textContent=`
            @media (min-width: 992px) { /* lg breakpoint */
                .border-end-lg {
                    border-right: 1px solid #dee2e6;
                }
            }
        `,document.head.appendChild(n)}return t}function O(){const e=document.getElementById("einrichtung-form");if(!e)return;e.addEventListener("click",a=>{if(a.target.matches(".select-all-day-btn")){const o=a.target.dataset.tag,u=Array.from(e.querySelectorAll(`input.btn-check[id^="${o}-"]`)),F=!u.every(b=>b.checked);u.forEach(b=>{b.checked=F})}});const t=document.querySelector('[aria-label="Einrichtungstyp"]'),n=document.getElementById("add-gruppe-btn"),r=document.getElementById("gruppen-liste");e.addEventListener("submit",K),t&&t.addEventListener("click",a=>{const o=a.target.closest("button");if(!o||o.classList.contains("select-all-day-btn"))return;t.querySelector(".active").classList.remove("active"),o.classList.add("active");const u=o.dataset.typ;document.getElementById("einrichtung-typ").value=u,document.getElementById("abendessen-container").classList.toggle("d-none",u!=="intern")}),n.addEventListener("click",()=>{$()}),r.addEventListener("click",a=>{a.target.classList.contains("remove-gruppe-btn")&&(a.target.closest(".gruppen-zeile").remove(),g())}),r.addEventListener("input",a=>{a.target.classList.contains("gruppe-anzahl")&&g()}),document.getElementById("cancel-btn").addEventListener("click",z),document.querySelectorAll("#add-einrichtung-btn-mobile, #add-einrichtung-btn-desktop").forEach(a=>{a.addEventListener("click",()=>{p!==null&&L()})})}function $(e={name:"",anzahl:""}){const t=document.getElementById("gruppen-liste"),n=document.createElement("div");n.className="row g-2 mb-2 align-items-center gruppen-zeile",n.innerHTML=`
        <div class="col-sm-6">
            <input type="text" class="form-control gruppe-name" placeholder="Gruppenname" value="${e.name}">
        </div>
        <div class="col-sm-4">
            <input type="number" class="form-control gruppe-anzahl" placeholder="Anzahl" min="0" value="${e.anzahl}">
        </div>
        <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-sm btn-outline-danger remove-gruppe-btn">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `,t.appendChild(n)}function g(){const e=document.getElementById("gesamt-personen"),t=document.querySelectorAll(".gruppe-anzahl"),n=Array.from(t).reduce((r,s)=>r+(parseInt(s.value,10)||0),0);e.textContent=n}async function K(e){e.preventDefault(),A();const t=e.target,n=t.querySelector('button[type="submit"]');n.disabled=!0,n.innerHTML='<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Speichern...';const r=R(t);try{const s={};if((!r.name||r.name.length<3)&&(s.name=["Der Name muss mindestens 3 Zeichen lang sein."]),(!r.kuerzel||r.kuerzel.length<1)&&(s.kuerzel=["Ein Kürzel ist erforderlich."]),(!r.adresse||r.adresse.length<5)&&(s.adresse=["Die Adresse muss mindestens 5 Zeichen lang sein."]),r.email&&r.email.length>0&&(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)||(s.email=["Bitte geben Sie eine gültige E-Mail-Adresse ein."])),Object.keys(s).length>0){P(s);return}p?(await H(p,r),l("Erfolg","Einrichtung wurde erfolgreich aktualisiert.","success"),document.dispatchEvent(new CustomEvent("einrichtung-aktualisiert"))):(await T(r),l("Erfolg","Neue Einrichtung wurde erfolgreich erstellt.","success"),document.dispatchEvent(new CustomEvent("einrichtung-erstellt"))),z()}catch(s){l("Fehler",s.message,"error")}finally{n.disabled=!1,n.innerHTML="Einrichtung speichern"}}function P(e){for(const[t,n]of Object.entries(e)){const r=document.getElementById(t);if(r){r.classList.add("is-invalid");const s=document.createElement("div");s.className="invalid-feedback",s.textContent=n.join(", "),r.parentNode.appendChild(s)}}}function A(){document.querySelectorAll(".is-invalid").forEach(e=>e.classList.remove("is-invalid")),document.querySelectorAll(".invalid-feedback").forEach(e=>e.remove())}function R(e){const t={name:e.querySelector("#name").value,kuerzel:e.querySelector("#kuerzel").value,adresse:e.querySelector("#adresse").value,ansprechperson:e.querySelector("#ansprechperson").value,telefon:e.querySelector("#telefon").value,email:e.querySelector("#email").value,isIntern:document.getElementById("einrichtung-typ").value==="intern",personengruppe:e.querySelector("#personengruppe").value,tour:e.querySelector("#tour").value,speiseplan:{},gruppen:[]};["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"].forEach(s=>{var i,a,o;t.speiseplan[s.toLowerCase()]={suppe:((i=e.querySelector(`#${s}-Suppe`))==null?void 0:i.checked)||!1,hauptspeise:((a=e.querySelector(`#${s}-Hauptspeise`))==null?void 0:a.checked)||!1,dessert:((o=e.querySelector(`#${s}-Dessert`))==null?void 0:o.checked)||!1}}),e.querySelectorAll(".gruppe-anzahl");const r=[];return e.querySelectorAll(".gruppen-zeile").forEach(s=>{const i=s.querySelector(".gruppe-name").value,a=parseInt(s.querySelector(".gruppe-anzahl").value,10);i&&a>0&&r.push({name:i,anzahl:a})}),t.gruppen=r,t}function U(){const e=document.querySelector('[aria-label="Einrichtungstyp"]');e&&(e.querySelector(".active").classList.remove("active"),e.querySelector('[data-typ="extern"]').classList.add("active"),document.getElementById("einrichtung-typ").value="extern",document.getElementById("abendessen-container").classList.add("d-none")),document.getElementById("gruppen-liste").innerHTML="",g()}function J(e){const t=document.getElementById("einrichtung-form");t.querySelector("#name").value=e.name,t.querySelector("#kuerzel").value=e.kuerzel,t.querySelector("#adresse").value=e.adresse,t.querySelector("#ansprechperson").value=e.ansprechperson,t.querySelector("#telefon").value=e.telefon,t.querySelector("#email").value=e.email,t.querySelector("#personengruppe").value=e.personengruppe,t.querySelector("#tour").value=e.tour;const n=e.isIntern;document.getElementById("einrichtung-typ").value=n?"intern":"extern";const r=document.querySelector('[aria-label="Einrichtungstyp"]');r.querySelector(".active").classList.remove("active"),r.querySelector(`[data-typ="${n?"intern":"extern"}"]`).classList.add("active"),document.getElementById("abendessen-container").classList.toggle("d-none",!n),Object.keys(e.speiseplan).forEach(i=>{Object.keys(e.speiseplan[i]).forEach(a=>{const o=t.querySelector(`#${i.charAt(0).toUpperCase()+i.slice(1)}-${a.charAt(0).toUpperCase()+a.slice(1)}`);o&&(o.checked=e.speiseplan[i][a])})});const s=document.getElementById("gruppen-liste");s.innerHTML="",e.gruppen.forEach(i=>{$(i)}),g()}function L(){p=null;const e=document.getElementById("einrichtung-form");if(!e)return;e.reset(),A(),U();const t=document.getElementById("einrichtung-form-container");t&&(t.querySelector("h3.card-title").textContent="Neue Einrichtung anlegen",t.querySelector('button[type="submit"]').textContent="Einrichtung speichern")}function z(){L(),d==null||d.hide()}function V(e){L(),p=e.id;const t=document.getElementById("einrichtung-form-container");t&&(t.querySelector("h3.card-title").textContent=`Einrichtung bearbeiten: ${e.name}`,t.querySelector('button[type="submit"]').textContent="Änderungen speichern",J(e),d==null||d.show())}async function Z(){if(f)try{const e=await j();f.innerHTML=N(e),O()}catch(e){console.error("Fehler beim Initialisieren des Einrichtungsformulars:",e),f.innerHTML='<div class="alert alert-danger">Fehler beim Laden des Formulars.</div>'}}const c=document.getElementById("einrichtung-liste-container"),q=document.getElementById("form-collapse-container"),y=q?new B(q,{toggle:!1}):null,k=document.getElementById("search-input"),v=document.getElementById("sort-key-group"),E=document.getElementById("sort-direction-group");let w=[],S="name",x="asc";function Q(e){const t=e.gruppen.reduce((n,r)=>n+r.anzahl,0);return`
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${e.name} (${e.kuerzel})</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${e.adresse}</h6>
                    </div>
                    <span class="badge ${e.isIntern?"bg-primary":"bg-secondary"}">${e.isIntern?"Intern":"Extern"}</span>
                </div>
                <p class="card-text">
                    <strong>Ansprechperson:</strong> ${e.ansprechperson||"N/A"}<br>
                    <strong>Telefon:</strong> ${e.telefon||"N/A"}<br>
                    <strong>Gesamtpersonen:</strong> ${t}
                </p>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary" data-id="${e.id}">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${e.id}">Löschen</button>
                </div>
            </div>
        </div>
    `}async function m(){if(c){c.innerHTML='<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Lade...</span></div>';try{w=await M(),w.forEach(e=>{e.gesamtPersonen=e.gruppen.reduce((t,n)=>t+n.anzahl,0)}),h()}catch{c.innerHTML='<div class="alert alert-danger">Fehler beim Laden der Einrichtungen.</div>',l("Fehler","Die Einrichtungsliste konnte nicht geladen werden.","error")}}}function h(){let e=[...w];e.sort((n,r)=>{const s=n[S],i=r[S];let a=0;return typeof s=="number"&&typeof i=="number"?a=s-i:typeof s=="string"&&typeof i=="string"?a=s.localeCompare(i,"de"):s>i?a=1:s<i&&(a=-1),x==="asc"?a:-a});const t=k.value.toLowerCase();t&&(e=e.filter(n=>n.name.toLowerCase().includes(t)||n.kuerzel.toLowerCase().includes(t))),W(e)}function W(e){if(c){if(e.length===0){k.value?c.innerHTML='<p class="text-muted">Keine Einrichtungen für Ihre Suche gefunden.</p>':c.innerHTML='<p class="text-muted">Noch keine Einrichtungen erstellt.</p>';return}c.innerHTML=e.map(Q).join("")}}function X(){m(),k.addEventListener("input",h),v&&v.addEventListener("click",e=>{const t=e.target.closest("button");!t||t.classList.contains("active")||(v.querySelector(".active").classList.remove("active"),t.classList.add("active"),S=t.dataset.key,h())}),E&&E.addEventListener("click",e=>{const t=e.target.closest("button");!t||t.classList.contains("active")||(E.querySelector(".active").classList.remove("active"),t.classList.add("active"),x=t.dataset.direction,h())}),c.addEventListener("click",async e=>{const t=e.target.closest(".btn-outline-primary"),n=e.target.closest(".btn-outline-danger");if(t){const r=t.dataset.id;try{const s=await G(r);V(s),y==null||y.show()}catch{l("Fehler","Die Daten der Einrichtung konnten nicht geladen werden.","error")}return}if(n){const r=n.dataset.id,i=n.closest(".card").querySelector(".card-title").textContent.split("(")[0].trim();if(confirm(`Sind Sie sicher, dass Sie die Einrichtung "${i}" wirklich löschen möchten?`))try{await D(r),l("Erfolg",`Einrichtung "${i}" wurde gelöscht.`),m()}catch(a){l("Fehler",a.message,"error")}return}}),document.addEventListener("einrichtung-erstellt",()=>{l("Info","Aktualisiere Einrichtungsliste...","info"),m()}),document.addEventListener("einrichtung-aktualisiert",()=>{l("Info","Aktualisiere Einrichtungsliste...","info"),m()})}C();document.addEventListener("DOMContentLoaded",()=>{Z(),X()});
