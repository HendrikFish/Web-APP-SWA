import{a as c}from"./bootstrap.esm-DGoQCxh1.js";function d(l,r="info",s=4e3){let e=document.getElementById("toast-container");e||(e=document.createElement("div"),e.id="toast-container",e.className="toast-container position-fixed bottom-0 end-0 p-3",e.style.zIndex="1055",document.body.appendChild(e));const a={success:{icon:"bi-check-circle-fill",bgClass:"bg-success",textClass:"text-white"},error:{icon:"bi-x-circle-fill",bgClass:"bg-danger",textClass:"text-white"},warning:{icon:"bi-exclamation-triangle-fill",bgClass:"bg-warning",textClass:"text-dark"},info:{icon:"bi-info-circle-fill",bgClass:"bg-info",textClass:"text-white"}},i=a[r]||a.info,o=`toast-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,t=document.createElement("div");t.className=`toast ${i.bgClass} ${i.textClass} border-0`,t.id=o,t.setAttribute("role","alert"),t.setAttribute("aria-live","assertive"),t.setAttribute("aria-atomic","true"),t.setAttribute("data-bs-autohide",s>0?"true":"false"),s>0&&t.setAttribute("data-bs-delay",s.toString()),t.innerHTML=`
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${i.icon} me-2"></i>
                ${l}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" aria-label="Schließen"></button>
        </div>
    `,e.appendChild(t);try{new c(t).show(),t.addEventListener("hidden.bs.toast",()=>{t.remove()})}catch(n){console.error("Fehler beim Initialisieren des Toast:",n),setTimeout(()=>{t.remove()},s)}return o}export{d as showToast};
