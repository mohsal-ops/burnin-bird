// "App mode": when the site is opened from the home-screen icon (standalone
// display mode), it switches to an app layout: a launch screen, a compact top
// bar, a bottom tab bar and screen transitions. In a normal browser tab
// nothing changes.
//
// This inline script runs before the page paints. It adds `sv-app` to <html>
// and injects the launch screen, so the website layout never flashes first.
// Preview it in any browser with ?appmode=1 (and ?appmode=0 to leave).

export default function AppModeBoot({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const js = `(function(){try{
var q=new URLSearchParams(location.search).get("appmode");
if(q==="1")sessionStorage.setItem("sv_appmode","1");
if(q==="0")sessionStorage.removeItem("sv_appmode");
var on=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true||sessionStorage.getItem("sv_appmode")==="1";
if(!on)return;
var h=document.documentElement;h.classList.add("sv-app");
if(sessionStorage.getItem("sv_splashed"))return;
sessionStorage.setItem("sv_splashed","1");
var d=document.createElement("div");d.id="sv-splash";
var logo=${JSON.stringify(logoUrl || "")};
d.innerHTML=(logo?'<img alt="" src="'+logo+'">':'')+'<div class="sv-splash-name"></div><div class="sv-splash-bar"><i></i></div>';
d.querySelector(".sv-splash-name").textContent=${JSON.stringify(name)};
(document.body||h).appendChild(d);
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
