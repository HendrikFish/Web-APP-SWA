import"./bootstrap.esm-DGoQCxh1.js";import{i as $}from"./header-DaFr1czl.js";/* empty css               */import{showToast as d}from"./toast-notification-BBb3bACE.js";const h={api:{getAlleRezepte:"/api/rezepte",createRezept:"/api/rezepte",updateRezept:e=>`/api/rezepte/${e}`,deleteRezept:e=>`/api/rezepte/${e}`,getStammdaten:"/api/rezepte/stammdaten"},shared:{getAlleZutaten:"/api/zutaten"}};async function F(){const e=await fetch(h.api.getAlleRezepte);if(!e.ok)throw new Error("Netzwerkfehler beim Abrufen der Rezepte.");return await e.json()}async function B(){const e=await fetch(h.api.getStammdaten);if(!e.ok)throw new Error("Netzwerkfehler beim Abrufen der Rezept-Stammdaten.");return await e.json()}async function T(){const e=await fetch(h.shared.getAlleZutaten);if(!e.ok)throw new Error("Netzwerkfehler beim Abrufen der Zutatenliste.");return await e.json()}function L(){const e=JSON.parse(localStorage.getItem("userInfo"));return e&&e.token?{Authorization:`Bearer ${e.token}`,"Content-Type":"application/json"}:{"Content-Type":"application/json"}}async function D(e){const t=await fetch(h.api.createRezept,{method:"POST",headers:L(),body:JSON.stringify(e)});if(!t.ok){const n=await t.json();throw new Error(n.message||"Fehler beim Erstellen des Rezepts.")}return await t.json()}async function K(e){const t=await fetch(h.api.deleteRezept(e),{method:"DELETE",headers:L()});if(!t.ok){const n=await t.json().catch(()=>({}));throw new Error(n.message||"Fehler beim Löschen des Rezepts.")}}async function M(e,t){const n=await fetch(h.api.updateRezept(e),{method:"PUT",headers:L(),body:JSON.stringify(t)});if(!n.ok){const r=await n.json().catch(()=>({}));throw new Error(r.message||"Fehler beim Aktualisieren des Rezepts.")}return await n.json()}const g={alleRezepte:[],searchTerm:"",sortBy:"name-asc"};let f,w,v;function j(){if(f=document.getElementById("rezept-liste-container"),w=document.getElementById("rezept-suche-input"),v=document.getElementById("rezept-sortierung-select"),!f||!w||!v){console.error("Einige Elemente für die Rezeptliste wurden nicht gefunden.");return}w.addEventListener("input",e=>{g.searchTerm=e.target.value,R()}),v.addEventListener("change",e=>{g.sortBy=e.target.value,R()})}function Z(e){g.alleRezepte=e,R()}function H(){let e=[...g.alleRezepte];if(g.searchTerm){const t=g.searchTerm.toLowerCase();e=e.filter(n=>n.name.toLowerCase().includes(t))}return e.sort((t,n)=>{switch(g.sortBy){case"name-asc":return t.name.localeCompare(n.name);case"name-desc":return n.name.localeCompare(t.name);case"date-new":return new Date(n.createdAt)-new Date(t.createdAt);case"date-old":return new Date(t.createdAt)-new Date(n.createdAt);default:return 0}}),e}function R(){if(!f)return;const e=H();if(f.innerHTML="",e.length===0){f.innerHTML='<p class="text-center text-muted">Keine passenden Rezepte gefunden.</p>';return}e.forEach(t=>{var s;const n=document.createElement("a");n.href="#",n.className="list-group-item list-group-item-action",n.dataset.id=t.id;const r=t.createdAt?new Date(t.createdAt).toLocaleDateString("de-DE"):"",i=((s=t.createdBy)==null?void 0:s.name)||"";let o="";i&&r?o=`Erstellt von ${i} am ${r}`:r&&(o=`Erstellt am ${r}`),n.innerHTML=`
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${t.name}</h5>
                <small class="text-muted">${t.kategorie||"Ohne Kategorie"}</small>
            </div>
            <p class="mb-1 text-truncate">${t.anleitung||"Keine Anleitung vorhanden."}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
                 <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" data-action="edit">
                        <i class="bi bi-pencil-fill"></i> <span class="d-none d-md-inline">Bearbeiten</span>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete">
                        <i class="bi bi-trash-fill"></i> <span class="d-none d-md-inline">Löschen</span>
                    </button>
                </div>
                <small class="text-muted">${o}</small>
            </div>
        `,f.appendChild(n)})}function x(e=null){const t=document.getElementById("rezept-form");if(!t){console.error("Der Formular-Container wurde nicht gefunden.");return}t.dataset.id=e?e.id:"",t.innerHTML=`
        <input type="hidden" id="rezept-id" value="${(e==null?void 0:e.id)||""}">
        
        <div class="mb-3">
            <label for="rezept-name" class="form-label">Rezeptname</label>
            <input type="text" id="rezept-name" class="form-control" placeholder="Rezeptnamen eingeben" value="${e?e.name:""}" required>
        </div>

        <div class="mb-3">
            <label for="rezept-kategorie" class="form-label">Kategorie</label>
            <select id="rezept-kategorie" class="form-select" required>
                <option value="" disabled selected>Wähle eine Kategorie</option>
            </select>
        </div>
        
        <hr>

        <h5 class="h6">Zutaten hinzufügen</h5>
        <div class="mb-3 position-relative">
            <label for="zutat-suche" class="form-label">Zutat suchen</label>
            <input type="text" id="zutat-suche" class="form-control" placeholder="Zutat suchen..." autocomplete="off">
            <div id="zutat-vorschlaege-container" class="list-group position-absolute w-100" style="z-index: 10;">
                <!-- Vorschläge werden hier per JS eingefügt -->
            </div>
        </div>

        <div id="rezept-zutaten-liste" class="mb-3">
            <!-- Hinzugefügte Zutaten werden hier angezeigt -->
        </div>

        <hr>

        <div class="mb-3">
            <label for="rezept-anleitung" class="form-label">Anleitung</label>
            <textarea id="rezept-anleitung" class="form-control" rows="5">${e?e.anleitung:""}</textarea>
        </div>
        
        <hr>

        <div id="rezept-zusammenfassung" class="mb-3">
            <h5 class="h6">Live-Zusammenfassung</h5>
            <div class="card bg-light border">
                <div class="card-body p-3">
                    <p class="mb-1 d-flex justify-content-between"><strong>Geschätzte Kosten:</strong> <span id="summary-kosten" class="fw-bold">0,00 €</span></p>
                    <p class="mb-1 d-flex justify-content-between"><strong>Allergene:</strong> <span id="summary-allergene" class="badge bg-warning text-dark">Keine</span></p>
                    <p class="mb-0 d-flex justify-content-between"><strong>Kalorien (gesamt):</strong> <span id="summary-kalorien" class="fw-bold">0 kcal</span></p>
                </div>
            </div>
        </div>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="button" id="form-abbrechen-btn" class="btn btn-secondary">Abbrechen</button>
            <button type="submit" class="btn btn-primary">${e?"Änderungen speichern":"Rezept erstellen"}</button>
        </div>
    `}function S(e){const t=document.getElementById("rezept-kategorie");t&&(t.innerHTML='<option value="">Bitte Kategorie wählen...</option>',e.forEach(n=>{const r=document.createElement("option");r.value=n,r.textContent=n,t.appendChild(r)}))}function E(e){const t=document.getElementById("zutat-vorschlaege-container");if(t){if(t.innerHTML="",e.length===0){t.classList.remove("d-block");return}e.forEach(n=>{const r=document.createElement("a");r.href="#",r.className="list-group-item list-group-item-action",r.textContent=n.name,r.dataset.id=n.id,t.appendChild(r)})}}function z(e){const t=document.getElementById("rezept-zutaten-liste");if(!t)return;if(t.innerHTML="",e.length===0){t.innerHTML='<p class="text-muted fst-italic">Noch keine Zutaten hinzugefügt.</p>';return}const n=document.createElement("ul");n.className="list-group",e.forEach(r=>{const i=document.createElement("li");i.className="list-group-item d-flex justify-content-between align-items-center";const o=r.menge!==void 0?r.menge:1,s=r.einheit||"Stk";i.innerHTML=`
            <span>${r.name}</span>
            <div class="d-flex align-items-center gap-2">
                <div class="input-group input-group-sm" style="width: 150px;">
                    <button class="btn btn-outline-secondary" type="button" data-action="step-down" data-id="${r.id}">-</button>
                    <input 
                        type="number" 
                        class="form-control text-center" 
                        value="${o}" 
                        min="0"
                        step="1"
                        data-id="${r.id}"
                        data-field="menge"
                        id="menge-${r.id}"
                    >
                    <button class="btn btn-outline-secondary" type="button" data-action="step-up" data-id="${r.id}">+</button>
                </div>
                <span style="width: 50px;">${s}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" data-id="${r.id}" data-action="remove-zutat">&times;</button>
            </div>
        `,n.appendChild(i)}),t.appendChild(n)}function N(e){const t=document.getElementById("rezept-form"),n=t.querySelector("#rezept-name").value,r=t.querySelector("#rezept-anleitung").value,i=t.querySelector("#rezept-kategorie").value,o=e.map(s=>({zutatId:s.id,menge:parseFloat(document.getElementById(`menge-${s.id}`).value)||0,einheit:s.einheit}));return{name:n,anleitung:r,kategorie:i,portionen:1,zutaten:o}}function b(e){const t=document.getElementById("summary-kosten"),n=document.getElementById("summary-allergene"),r=document.getElementById("summary-kalorien");if(!t||!n||!r){console.error("Summary-Elemente nicht gefunden!");return}let i=0;const o=new Set;let s=0;e.forEach(a=>{var p;const c=document.getElementById(`menge-${a.id}`),m=c?parseFloat(c.value)||0:a.menge||0;if(a.preis&&typeof a.preis.basis=="number"&&typeof a.preis.umrechnungsfaktor=="number"&&a.preis.umrechnungsfaktor!==0){const u=a.preis.basis/a.preis.umrechnungsfaktor;i+=u*m}if(a.allergene&&a.allergene.length>0&&a.allergene.forEach(u=>o.add(u.code)),a.naehrwerte&&typeof a.naehrwerte.kalorien_kcal=="number"){const u=((p=a.einheit)==null?void 0:p.toLowerCase())||"";u!=="stück"&&u!=="stk"&&(s+=a.naehrwerte.kalorien_kcal/100*m)}}),t.textContent=`${i.toFixed(2).replace(".",",")} €`,r.textContent=`${Math.round(s)} kcal`,o.size>0?(n.textContent=Array.from(o).join(", "),n.className="badge bg-danger"):(n.textContent="Keine",n.className="badge bg-success")}function q(){const e=document.getElementById("rezept-form");e&&(e.innerHTML=`
            <p class="text-center text-muted">
                Bitte wählen Sie ein Rezept aus der Liste zum Bearbeiten oder erstellen Sie ein neues.
            </p>
        `,e.dataset.id="")}let y=[],k=[],l=[];async function V(){console.log("Rezept-Modul wird initialisiert..."),j();try{y=await T()}catch(n){console.error("Kritischer Fehler: Die globale Zutatenliste konnte nicht geladen werden.",n),d("Die Zutatensuche ist nicht verfügbar.","error")}await I();const e=document.getElementById("neues-rezept-btn");e&&e.addEventListener("click",async()=>{l=[],x(),z(l);try{const n=await B();S(n.kategorien),C()}catch(n){console.error("Fehler beim Laden der Stammdaten für das Formular:",n),d("Kategorien konnten nicht geladen werden.","error")}});const t=document.getElementById("rezept-liste-container");t&&t.addEventListener("click",P),document.querySelector("main.container").addEventListener("submit",n=>{n.target.id==="rezept-form"&&O(n)})}async function I(){try{k=await F(),Z(k)}catch(e){console.error("Fehler beim Initialisieren der Rezeptliste:",e),d("Fehler beim Laden der Rezepte.","error");const t=document.getElementById("rezept-liste-container");t&&(t.innerHTML='<p class="text-center text-danger">Die Rezepte konnten nicht geladen werden.</p>')}}function C(){const e=document.getElementById("zutat-suche"),t=document.getElementById("zutat-vorschlaege-container");document.getElementById("rezept-form");const n=document.getElementById("rezept-zutaten-liste");e&&e.addEventListener("input",()=>{const r=e.value.toLowerCase();if(r.length<2){E([]);return}const i=y.filter(o=>o.name.toLowerCase().includes(r));E(i.slice(0,5))}),t&&t.addEventListener("click",r=>{var a;r.preventDefault();const i=r.target.closest("a");if(!i)return;const o=i.dataset.id;if(!l.find(c=>c.id===o)){const c=y.find(m=>m.id===o);l.push({...c,menge:1,einheit:((a=c.preis)==null?void 0:a.verwendungseinheit)||"Stk"}),z(l),b(l)}e.value="",E([])}),n&&(n.addEventListener("click",r=>{var s;const i=r.target.dataset.action,o=r.target.dataset.id;if(i==="remove-zutat"){l=l.filter(a=>a.id!==o),z(l),b(l);return}if(i==="step-up"||i==="step-down"){const a=document.getElementById(`menge-${o}`);if(!a)return;const c=l.find(A=>A.id===o);if(!c)return;const m=((s=c.einheit)==null?void 0:s.toLowerCase())||"stk",p=m==="g"||m==="ml"?10:1;let u=parseFloat(a.value)||0;i==="step-up"?u+=p:u-=p,a.value=u<0?0:u,a.dispatchEvent(new Event("input",{bubbles:!0}))}}),n.addEventListener("input",r=>{if(r.target.matches('input[data-field="menge"]')){const i=r.target.dataset.id,o=parseFloat(r.target.value)||0,s=l.find(a=>a.id===i);s&&(s.menge=o),b(l)}}))}async function O(e){e.preventDefault();const n=e.target.dataset.id;try{const r=N(l);if(!r.name||!r.kategorie){d("Bitte Rezeptname und Kategorie ausfüllen.","warning");return}if(r.zutaten.length===0){d("Bitte fügen Sie mindestens eine Zutat hinzu.","warning");return}n?(await M(n,r),d("Rezept erfolgreich aktualisiert!","success")):(await D(r),d("Rezept erfolgreich erstellt!","success")),q(),await I(),l=[]}catch(r){console.error("Fehler beim Speichern des Rezepts:",r),d(r.message,"error")}}async function P(e){const t=e.target,n=t.closest("button[data-action]");if(!n)return;const i=t.closest("a.list-group-item").dataset.id,o=n.dataset.action;if(o==="delete"&&confirm("Sind Sie sicher, dass Sie dieses Rezept wirklich löschen möchten?"))try{await K(i),d("Rezept erfolgreich gelöscht.","success"),await I()}catch(s){console.error("Fehler beim Löschen des Rezepts:",s),d(s.message,"error")}if(o==="edit"){const s=k.find(a=>a.id===i);if(!s){d("Fehler: Rezept nicht gefunden.","error");return}l=s.zutaten.map(a=>{var p;const c=y.find(u=>u.id===a.zutatId),m=a.einheit||((p=c==null?void 0:c.preis)==null?void 0:p.verwendungseinheit)||"Stk";return{...c,menge:a.menge,einheit:m}}),x(s),z(l);try{const a=await B();S(a.kategorien),document.getElementById("rezept-kategorie").value=s.kategorie,C(),b(l)}catch(a){console.error("Fehler beim Laden der Stammdaten für das Bearbeiten:",a),d("Kategorien konnten nicht geladen werden.","error")}}}document.addEventListener("DOMContentLoaded",async()=>{try{await $(),await V(),d("Rezept-Modul erfolgreich geladen!","success")}catch(e){console.error("Fehler bei der Initialisierung des Rezept-Moduls:",e),d("Fehler beim Laden des Rezept-Moduls.","error")}});
