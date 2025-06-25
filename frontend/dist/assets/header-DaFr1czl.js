const r=`<nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom fixed-top">\r
    <div class="container-fluid">\r
        <a class="navbar-brand" href="/core/dashboard/index.html">\r
            <strong>SmartWorkArt</strong>\r
        </a>\r
        <div class="d-flex align-items-center">\r
            <span id="header-username" class="navbar-text me-3">\r
                Wird geladen...\r
            </span>\r
            <button id="logout-btn" class="btn btn-outline-primary btn-sm">Abmelden</button>\r
        </div>\r
    </div>\r
</nav> `;async function o(n){const e=await fetch("/api/user/current",{headers:{Authorization:`Bearer ${n}`}});if(!e.ok)throw(e.status===401||e.status===403)&&(localStorage.removeItem("token"),window.location.href="/core/login/index.html"),new Error("Fehler beim Abrufen der Benutzerdaten.");return await e.json()}async function a(){const n=localStorage.getItem("token");if(!n)throw window.location.href="/core/login/index.html",new Error("Kein Authentifizierungstoken gefunden.");try{const e=await o(n),t=document.getElementById("main-header");return t&&(t.innerHTML=r,document.getElementById("header-username").textContent=e.firstName,document.getElementById("logout-btn").addEventListener("click",()=>{localStorage.removeItem("token"),window.location.href="/core/login/index.html"})),e}catch(e){throw console.error("Initialisierungsfehler im Header:",e),localStorage.removeItem("token"),window.location.href="/core/login/index.html",e}}export{a as i};
