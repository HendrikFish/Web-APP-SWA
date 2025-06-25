import{M as B}from"./bootstrap.esm-DGoQCxh1.js";import{i as q}from"./header-DaFr1czl.js";import{a as M,r as A,c as H}from"./form-builder-WLbl3xe7.js";const z=[{id:"user-approval",name:"Benutzer-Genehmigung",icon:"bi-person-check-fill"},{id:"user-management",name:"Benutzerverwaltung",icon:"bi-people-fill"},{id:"field-config",name:"Registrierungsfelder",icon:"bi-input-cursor-text"},{id:"notifications",name:"Benachrichtigungen",icon:"bi-bell-fill"},{id:"module-management",name:"Modulverwaltung",icon:"bi-grid-1x2-fill"}];function U(e,n,a,o){if(!e)return;const i=document.createElement("ul");i.className="nav nav-pills flex-column mb-auto",n.forEach((l,t)=>{const s=document.createElement("li");s.className="nav-item";const d=document.createElement("a");d.href=`#${l.id}`,d.className=t===0?"nav-link active":"nav-link text-dark",d.dataset.featureId=l.id;let r=l.name;l.id==="user-approval"&&a>0&&(r+=` <span class="badge bg-danger rounded-pill ms-auto">${a}</span>`),d.innerHTML=`<i class="bi ${l.icon} me-2"></i>${r}`,s.appendChild(d),i.appendChild(s)}),e.innerHTML="",e.appendChild(i),e.addEventListener("click",l=>{const t=l.target.closest("a");if(!t)return;l.preventDefault(),e.querySelectorAll("a").forEach(d=>d.classList.remove("active")),e.querySelectorAll("a").forEach(d=>d.classList.add("text-dark")),t.classList.add("active"),t.classList.remove("text-dark");const s=t.dataset.featureId;o(s)})}function D(e,n,a){if(!e){console.error("Container für die Benutzergenehmigung nicht gefunden.");return}if(e.innerHTML="",n.length===0){e.innerHTML='<div class="alert alert-success">Aktuell gibt es keine neuen Anfragen.</div>';return}const o=document.createElement("div");o.className="list-group",n.forEach(i=>{const l=document.createElement("div");l.className="list-group-item d-flex justify-content-between align-items-center";let t=`
            <h5 class="mb-1">${i.firstName} ${i.lastName}</h5>
            <p class="mb-1"><small>${i.email}</small></p>
        `;if(i.customFields&&Object.keys(i.customFields).length>0){t+='<ul class="list-unstyled mb-0 mt-2 small">';for(const[s,d]of Object.entries(i.customFields)){const r=M.find(b=>b.id===s),c=r?r.label:s;t+=`<li><strong>${c}:</strong> ${d}</li>`}t+="</ul>"}l.innerHTML=`
            <div>
                ${t}
            </div>
            <div>
                <button class="btn btn-success btn-sm me-2" data-user-id="${i._id}" data-action="approve">
                    <i class="bi bi-check-lg me-1"></i> Genehmigen
                </button>
                <button class="btn btn-danger btn-sm" data-user-id="${i._id}" data-action="delete">
                    <i class="bi bi-x-lg me-1"></i> Löschen
                </button>
            </div>
        `,o.appendChild(l)}),e.appendChild(o),o.addEventListener("click",i=>{const l=i.target.closest("button[data-user-id]");if(!l)return;const t=l.dataset.userId,s=l.dataset.action;s==="approve"?a.onApprove(t):s==="delete"&&a.onDelete(t)})}console.log("User Approval UI Modul geladen.");function j(e,n,a,o){if(!e){console.error("Container für die Benutzertabelle nicht gefunden.");return}e.innerHTML="";const i=document.createElement("div");i.className="card shadow-sm rounded-0";const l=document.createElement("div");l.className="card-header d-flex justify-content-between align-items-center",l.innerHTML=`
        <h5 class="mb-0">Benutzerliste</h5>
        <button class="btn btn-primary btn-sm">
            <i class="bi bi-plus-lg me-1"></i> Neuen Benutzer anlegen
        </button>
    `;const t=document.createElement("div");t.className="card-body p-0";const s=document.createElement("div");s.className="d-none d-md-block";const d=document.createElement("div");d.className="table-responsive";const r=document.createElement("table");r.className="table table-hover mb-0";const c=n.map(u=>`
        <tr>
            <td>${u._id.slice(-6)}</td>
            <td>${u.firstName} ${u.lastName}</td>
            <td><span class="badge bg-secondary">${Array.isArray(u.roles)?u.roles.join(", "):u.role}</span></td>
            <td class="text-end">
                <!-- Neutrale Buttons mit Rand für einen sauberen Look -->
                <button class="btn btn-light btn-sm border" title="Benutzer bearbeiten" data-user-id="${u._id}" data-action="edit">
                    <i class="bi bi-pencil" data-user-id="${u._id}" data-action="edit"></i>
                </button>
                <button class="btn btn-light btn-sm border text-danger" title="Benutzer löschen" data-user-id="${u._id}" data-action="delete">
                    <i class="bi bi-trash" data-user-id="${u._id}" data-action="delete"></i>
                </button>
            </td>
        </tr>
    `).join("");r.innerHTML=`
        <thead class="table-light">
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Rolle</th>
                <th scope="col" class="text-end">Aktionen</th>
            </tr>
        </thead>
        <tbody>
            ${c.length>0?c:'<tr><td colspan="4" class="text-center p-4">Keine Benutzer gefunden.</td></tr>'}
        </tbody>
    `,d.appendChild(r),s.appendChild(d);const b=document.createElement("div");b.className="d-md-none";const f=document.createElement("div");f.className="list-group list-group-flush",n.length>0?n.forEach(u=>{const p=document.createElement("div");p.className="list-group-item",p.innerHTML=`
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${u.firstName} ${u.lastName}</h6>
                    <small class="text-muted">ID: ${u._id.slice(-6)}</small>
                </div>
                <p class="mb-1">
                    <span class="badge bg-secondary">${Array.isArray(u.roles)?u.roles.join(", "):u.role}</span>
                </p>
                <div class="mt-2 text-end">
                    <button class="btn btn-light btn-sm border" title="Benutzer bearbeiten">
                        <i class="bi bi-pencil me-1"></i> Bearbeiten
                    </button>
                    <button class="btn btn-light btn-sm border text-danger" title="Benutzer löschen">
                        <i class="bi bi-trash me-1"></i> Löschen
                    </button>
                </div>
            `,f.appendChild(p)}):f.innerHTML='<div class="list-group-item text-center p-4">Keine Benutzer gefunden.</div>',b.appendChild(f),t.appendChild(s),t.appendChild(b),i.appendChild(l),i.appendChild(t),e.appendChild(i),e.insertAdjacentHTML("beforeend",`
    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserModalLabel">Benutzer bearbeiten</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="editUserForm">
              <input type="hidden" id="edit-userId">
              <div class="mb-3">
                <label for="edit-firstName" class="form-label">Vorname</label>
                <input type="text" class="form-control" id="edit-firstName" required>
              </div>
              <div class="mb-3">
                <label for="edit-lastName" class="form-label">Nachname</label>
                <input type="text" class="form-control" id="edit-lastName" required>
              </div>
              <div class="mb-3">
                <label for="edit-email" class="form-label">E-Mail</label>
                <input type="email" class="form-control" id="edit-email" required>
              </div>
              <div id="dynamic-edit-fields">
                <!-- Dynamische Felder werden hier per JavaScript eingefügt -->
              </div>
              <div class="mb-3">
                <label for="edit-role" class="form-label">Rolle</label>
                <select class="form-select" id="edit-role" required>
                  <option value="admin">Admin</option>
                  <option value="co-admin">Co-Admin</option>
                  <option value="Koch">Koch</option>
                  <option value="Service">Service</option>
                  <option value="Stock">Stock</option>
                  <option value="Schule">Schule</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="LH">LH</option>
                  <option value="TZ">TZ</option>
                  <option value="ER">ER</option>
                  <option value="extern">Extern</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="edit-einrichtungen" class="form-label">Zugewiesene Einrichtungen</label>
                <div id="edit-einrichtungen" class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                  <!-- Einrichtungs-Checkboxes werden hier per JavaScript eingefügt -->
                </div>
                <small class="form-text text-muted">Wählen Sie eine oder mehrere Einrichtungen für diesen Benutzer aus.</small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button type="button" id="saveUserChangesBtn" class="btn btn-primary">Änderungen speichern</button>
          </div>
        </div>
      </div>
    </div>
    `),e.addEventListener("click",u=>{const p=u.target.closest("[data-user-id]");if(!p)return;const x=p.dataset.userId,$=p.dataset.action,v=n.find(C=>C._id===x);v&&($==="delete"?confirm(`Sind Sie sicher, dass Sie den Benutzer ${v.firstName} ${v.lastName} löschen möchten?`)&&a(x):$==="edit"&&o(v))})}function R(e,n){const a=document.getElementById("editUserModal");if(!a||!e){console.error("Modal oder Benutzer für Bearbeitung nicht gefunden.",{user:e});return}a.querySelector("#edit-userId").value=e._id,a.querySelector("#edit-firstName").value=e.firstName,a.querySelector("#edit-lastName").value=e.lastName,a.querySelector("#edit-email").value=e.email,a.querySelector("#edit-role").value=e.role,V(e.einrichtungen||[]);const o=a.querySelector("#dynamic-edit-fields");A(o,M,e.customFields);const i=B.getOrCreateInstance(a);i.show();const l=document.getElementById("saveUserChangesBtn"),t=l.cloneNode(!0);l.parentNode.replaceChild(t,l);const s=()=>{const d=document.getElementById("editUserForm");if(!d.checkValidity()){d.reportValidity();return}const r={firstName:document.getElementById("edit-firstName").value,lastName:document.getElementById("edit-lastName").value,email:document.getElementById("edit-email").value,role:document.getElementById("edit-role").value,einrichtungen:K(),customFields:H(o)};n(e._id,r),i.hide()};t.addEventListener("click",s)}async function V(e=[]){try{const a=await(await fetch("/api/einrichtungen")).json(),o=document.getElementById("edit-einrichtungen");o.innerHTML="",a.forEach(i=>{const l=e.includes(i.id),t=`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" value="${i.id}" 
                           id="einrichtung-${i.id}" ${l?"checked":""}>
                    <label class="form-check-label" for="einrichtung-${i.id}">
                        <strong>${i.kuerzel}</strong> - ${i.name}
                        <br><small class="text-muted">${i.personengruppe}</small>
                    </label>
                </div>
            `;o.insertAdjacentHTML("beforeend",t)}),a.length===0&&(o.innerHTML='<p class="text-muted">Keine Einrichtungen verfügbar.</p>')}catch(n){console.error("Fehler beim Laden der Einrichtungen:",n);const a=document.getElementById("edit-einrichtungen");a.innerHTML='<p class="text-danger">Fehler beim Laden der Einrichtungen.</p>'}}function K(){const e=document.querySelectorAll('#edit-einrichtungen input[type="checkbox"]:checked');return Array.from(e).map(n=>n.value)}const E=["admin","co-admin","Koch","Service","Stock","Schule","Kindergarten","LH","TZ","ER","extern"];function O(e){switch(e){case"Aktiv":return'<span class="badge bg-success">Aktiv</span>';case"Inaktiv":return'<span class="badge bg-danger">Inaktiv</span>';case"Empfangen":return'<span class="badge bg-info text-dark">Empfangen</span>';default:return`<span class="badge bg-secondary">${e}</span>`}}function _(e){switch(e){case"once":return"Einmalig";case"onLogin":return"Bei Login";case"interval":return"Tag-basiert";default:return e}}function P(e,n){const a=document.createElement("tr");return a.innerHTML=`
        <td>${e.title}</td>
        <td><span class="badge bg-secondary">${_(e.trigger)}</span></td>
        <td><small>${e.targetRoles.join(", ")}</small></td>
        <td>
            ${O(e.status)}
        </td>
        <td class="text-end">
            <button class="btn btn-light btn-sm border" data-action="edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-light btn-sm border text-danger" data-action="delete"><i class="bi bi-trash"></i></button>
        </td>
    `,a.querySelector('[data-action="edit"]').addEventListener("click",()=>n.onEdit(e)),a.querySelector('[data-action="delete"]').addEventListener("click",()=>n.onDelete(e.id)),a}function S(e,n){const a=document.getElementById("notificationModal"),o=new B(a),i=document.getElementById("notificationForm");i.reset(),document.getElementById("notification-id").value="",E.forEach(d=>{document.getElementById(`role-${d}`).checked=!1}),e?(document.getElementById("notification-id").value=e.id,document.getElementById("notification-title").value=e.title,document.getElementById("notification-message").value=e.message,document.getElementById("notification-trigger").value=e.trigger,document.getElementById("notification-triggerValue").value=e.triggerValue||"",document.getElementById("notification-active").checked=e.active,e.targetRoles.forEach(d=>{const r=document.getElementById(`role-${d}`);r&&(r.checked=!0)})):document.getElementById("notification-active").checked=!0;const l=document.getElementById("saveNotificationBtn"),t=()=>{if(!i.checkValidity()){i.reportValidity();return}const d=E.filter(c=>document.getElementById(`role-${c}`).checked),r={id:document.getElementById("notification-id").value||void 0,title:document.getElementById("notification-title").value,message:document.getElementById("notification-message").value,trigger:document.getElementById("notification-trigger").value,triggerValue:document.getElementById("notification-triggerValue").value||null,targetRoles:d,active:document.getElementById("notification-active").checked};n(r),o.hide()},s=l.cloneNode(!0);l.parentNode.replaceChild(s,l),s.addEventListener("click",t),o.show()}function Z(e,n,a){e.innerHTML=`
        <div class="card shadow-sm rounded-0">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Gespeicherte Benachrichtigungen</h5>
                <button class="btn btn-primary btn-sm" id="addNotificationBtn">
                    <i class="bi bi-plus-lg me-1"></i> Neue Benachrichtigung
                </button>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Titel</th>
                                <th>Typ</th>
                                <th>Zielgruppe</th>
                                <th>Status</th>
                                <th class="text-end">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody id="notifications-list-container"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal fade" id="notificationModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Benachrichtigung bearbeiten</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="notificationForm">
                            <input type="hidden" id="notification-id">
                            <div class="mb-3">
                                <label for="notification-title" class="form-label">Titel</label>
                                <input type="text" class="form-control" id="notification-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="notification-message" class="form-label">Nachricht</label>
                                <textarea class="form-control" id="notification-message" rows="3" required></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="notification-trigger" class="form-label">Auslöser (Trigger)</label>
                                    <select class="form-select" id="notification-trigger">
                                        <option value="onLogin">Bei jedem Login</option>
                                        <option value="interval">An einem bestimmten Tag</option>
                                        <option value="once">Einmalig (nach Erstellung)</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="notification-triggerValue" class="form-label">Wert für Trigger (optional)</label>
                                    <input type="text" class="form-control" id="notification-triggerValue" placeholder="z.B. 26 für den 26. des Monats">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ziel-Rollen</label>
                                <div class="p-2 border rounded" style="max-height: 150px; overflow-y: auto;">
                                    ${E.map(i=>`
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" value="${i}" id="role-${i}">
                                            <label class="form-check-label" for="role-${i}">${i}</label>
                                        </div>
                                    `).join("")}
                                </div>
                            </div>
                             <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="notification-active" checked>
                                <label class="form-check-label" for="notification-active">Benachrichtigung ist aktiv</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
                        <button type="button" class="btn btn-primary" id="saveNotificationBtn">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    `;const o=e.querySelector("#notifications-list-container");o.innerHTML="",n.length>0?n.forEach(i=>o.appendChild(P(i,a))):o.innerHTML='<tr><td colspan="5" class="text-center p-4">Keine Benachrichtigungen gefunden.</td></tr>',e.querySelector("#addNotificationBtn").addEventListener("click",()=>{a.onAdd()})}function J(e){return`
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong class="me-2">${e.label}</strong>
                <span class="badge bg-secondary me-2">${e.type}</span>
                ${e.required?'<span class="badge bg-info">Pflichtfeld</span>':""}
            </div>
            <div>
                <button class="btn btn-light btn-sm border me-2" data-action="edit" data-field-id="${e.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-light btn-sm border text-danger" data-action="delete" data-field-id="${e.id}"><i class="bi bi-trash"></i></button>
            </div>
        </li>
    `}function T(e,n){if(e){for(;e.firstChild;)e.removeChild(e.firstChild);if(n.length===0){const a=document.createElement("li");a.className="list-group-item text-center text-muted",a.textContent="Keine Felder konfiguriert.",e.appendChild(a);return}n.forEach(a=>{const o=document.createElement("div");o.innerHTML=J(a).trim(),e.appendChild(o.firstChild)})}}function L(e,n,a){const o=e.querySelector("#fieldConfigForm"),i=e.querySelector("#saveFieldBtn"),l=e.querySelector(".modal-title"),t=new B(e);o.reset(),l.textContent=n?"Feld bearbeiten":"Neues Feld erstellen",n?(o.querySelector("#field-id").value=n.id,o.querySelector("#field-label").value=n.label,o.querySelector("#field-type").value=n.type,o.querySelector("#field-required").checked=n.required,o.querySelector("#field-id").disabled=!0):o.querySelector("#field-id").disabled=!1;const s=()=>{if(!o.checkValidity()){o.reportValidity();return}const d={id:o.querySelector("#field-id").value,label:o.querySelector("#field-label").value,type:o.querySelector("#field-type").value,required:o.querySelector("#field-required").checked};a(d,n?n.id:null),t.hide()};i.addEventListener("click",s,{once:!0}),t.show()}function G(e,n,a){e.innerHTML=`
        <div class="card shadow-sm rounded-0">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Konfigurierte Felder</h5>
                <button class="btn btn-primary btn-sm" id="addFieldBtn"><i class="bi bi-plus-lg me-1"></i> Feld hinzufügen</button>
            </div>
            <div class="card-body">
                <ul class="list-group" id="field-list-container"></ul>
            </div>
        </div>

        <div class="modal fade" id="fieldConfigModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Feld</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="fieldConfigForm">
                            <div class="mb-3">
                                <label for="field-id" class="form-label">Feld-ID (eindeutig)</label>
                                <input type="text" class="form-control" id="field-id" required pattern="[a-zA-Z0-9_]+">
                            </div>
                            <div class="mb-3">
                                <label for="field-label" class="form-label">Anzeigetext (Label)</label>
                                <input type="text" class="form-control" id="field-label" required>
                            </div>
                            <div class="mb-3">
                                <label for="field-type" class="form-label">Feld-Typ</label>
                                <select class="form-select" id="field-type">
                                    <option value="text">Text</option>
                                    <option value="email">E-Mail</option>
                                    <option value="tel">Telefon</option>
                                    <option value="number">Zahl</option>
                                    <option value="date">Datum</option>
                                </select>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="field-required">
                                <label class="form-check-label" for="field-required">Pflichtfeld</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
                        <button type="button" id="saveFieldBtn" class="btn btn-primary">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    `;const o=e.querySelector("#field-list-container"),i=e.querySelector("#fieldConfigModal");e.querySelector("#addFieldBtn").addEventListener("click",()=>{L(i,null,a.onSave)}),o.addEventListener("click",l=>{const t=l.target.closest("button[data-action]");if(!t)return;const s=t.dataset.action,d=t.dataset.fieldId,r=a.getFields().find(c=>c.id===d);r&&(s==="edit"?L(i,r,a.onSave):s==="delete"&&confirm(`Sind Sie sicher, dass Sie das Feld "${r.label}" löschen möchten?`)&&a.onDelete(d))}),T(o,n)}function W(e,n,a,o){if(!e)return;let i=n.map(t=>`
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi ${t.icon} me-2"></i>
                    ${t.name}
                </h5>
            </div>
            <div class="card-body">
                <p class="card-text">${t.description}</p>
                <div class="form-group" data-module-id="${t.id}">
                    <label class="form-label">Sichtbar für folgende Rollen:</label>
                    <div class="d-flex flex-wrap gap-3 mt-2">
                        ${a.map(s=>`
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${s}" id="role-${t.id}-${s}"
                                    ${t.roles.includes(s)?"checked":""}>
                                <label class="form-check-label" for="role-${t.id}-${s}">
                                    ${s}
                                </label>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        </div>
    `).join("");e.innerHTML=`
        <div id="module-management-container">
            ${i}
        </div>
        <div class="mt-4">
            <button id="save-module-roles-btn" class="btn btn-primary">
                <i class="bi bi-save me-2"></i>
                Berechtigungen speichern
            </button>
        </div>
    `;const l=document.getElementById("save-module-roles-btn");l&&l.addEventListener("click",()=>{const t=n.map(s=>{const d=e.querySelectorAll(`[data-module-id="${s.id}"] .form-check-input`),r=Array.from(d).filter(c=>c.checked).map(c=>c.value);return{...s,roles:r}});o.onSave(t)})}async function m(e,n={}){const a=localStorage.getItem("token");if(!a)throw window.location.href="/core/login/index.html",new Error("Nicht authentifiziert");const o={Authorization:`Bearer ${a}`,"Content-Type":"application/json"},i={...n,headers:{...o,...n.headers}},l=await fetch(e,i);if(l.status===401||l.status===403)throw localStorage.removeItem("token"),window.location.href="/core/login/index.html",new Error("Sitzung abgelaufen oder nicht autorisiert.");if(!l.ok){const t=await l.json().catch(()=>({message:`Netzwerkfehler: ${l.status}`}));throw new Error(t.message)}return l.status===204?{}:l.json()}async function Q(){return m("/api/admin/users")}async function N(e){return m(`/api/admin/users/${e}`,{method:"DELETE"})}async function X(e){return m(`/api/admin/users/${e}/approve`,{method:"PUT"})}async function Y(e,n){return m(`/api/admin/users/${e}`,{method:"PUT",body:JSON.stringify(n)})}async function I(){return m("/api/admin/custom-fields")}async function F(e){return m("/api/admin/custom-fields",{method:"PUT",body:JSON.stringify(e)})}async function ee(){return m("/api/notifications")}async function te(e){return m("/api/notifications",{method:"POST",body:JSON.stringify(e)})}async function ie(e,n){return m(`/api/notifications/${e}`,{method:"PUT",body:JSON.stringify(n)})}async function ne(e){return m(`/api/notifications/${e}`,{method:"DELETE"})}async function ae(){return m("/api/admin/modules")}async function le(e){return m("/api/admin/modules",{method:"PUT",body:JSON.stringify(e)})}async function oe(){return m("/api/admin/roles")}let h=[],y=[];document.getElementById("admin-sidebar");document.getElementById("admin-feature-container");document.getElementById("admin-content-title");async function se(){return y=await Q(),y.filter(e=>!e.isApproved)}async function de(e){const n=async()=>{try{const a=await ee();Z(e,a,{onAdd:()=>S(null,async i=>{await te(i),n()}),onEdit:i=>S(i,async l=>{await ie(l.id,l),n()}),onDelete:async i=>{confirm("Soll diese Benachrichtigung wirklich gelöscht werden?")&&(await ne(i),n())}})}catch(a){e.innerHTML=`<p class="text-danger">Fehler: ${a.message}</p>`}};await n()}async function g(){try{const e=await q();if(!e||!e.role.includes("admin")){window.location.href="/core/dashboard/index.html";return}h=z;const n=await se(),a=document.getElementById("admin-sidebar").querySelector(".position-sticky");U(a,h,n.length,k),h.length>0&&k(h[0].id)}catch(e){console.error("Fehler beim Initialisieren des Admin Dashboards:",e),document.getElementById("admin-feature-container").innerHTML='<div class="alert alert-danger">Ein schwerwiegender Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</div>'}}async function k(e){const n=document.getElementById("admin-content-title"),a=document.getElementById("admin-feature-container"),o=h.find(t=>t.id===e);if(!n||!a||!o)return;n.textContent=o.name;const i=`${o.id}-content`;a.innerHTML=`<div id="${i}"><p>Lade ${o.name}...</p></div>`;const l=document.getElementById(i);try{if(e==="user-management"){const t=y.filter(s=>s.isApproved);j(l,t,async s=>{await N(s),g()},s=>R(s,async(d,r)=>{await Y(d,r),g()}))}else if(e==="user-approval"){const t=y.filter(d=>!d.isApproved);D(l,t,{onApprove:async d=>{await X(d),g()},onDelete:async d=>{confirm("Soll dieser Benutzer wirklich abgelehnt und gelöscht werden?")&&(await N(d),g())}})}else if(e==="field-config")try{let t=await I();const s=async()=>{t=await I();const r=l.querySelector("#field-list-container");r&&T(r,t)};G(l,t,{onSave:async(r,c)=>{let b;if(c){const f=t.findIndex(w=>w.id===c);f!==-1&&(t[f]=r),b=[...t]}else{if(t.some(f=>f.id===r.id)){alert("Fehler: Diese Feld-ID existiert bereits.");return}b=[...t,r]}b&&(await F(b),await s())},onDelete:async r=>{const c=t.filter(b=>b.id!==r);await F(c),await s()},getFields:()=>t})}catch(t){console.error("Fehler im 'field-config':",t),l.innerHTML=`<div class="alert alert-danger">Fehler beim Laden der Feld-Konfiguration: ${t.message}</div>`}else if(e==="notifications")await de(l);else if(e==="module-management"){const[t,s]=await Promise.all([ae(),oe()]);W(l,t,s,{onSave:async r=>{try{await le(r),alert("Modulberechtigungen erfolgreich gespeichert!"),k("module-management")}catch(c){console.error("Fehler beim Speichern der Modulberechtigungen:",c),alert(`Fehler: ${c.message}`)}}})}else l.innerHTML=`<p>Feature "${o.name}" wird bald implementiert.</p>`}catch(t){l.innerHTML=`<p class="text-danger">Fehler: ${t.message}</p>`}}document.addEventListener("DOMContentLoaded",g);
