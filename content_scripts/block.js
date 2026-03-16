(function () {

  if (document.getElementById("matchu-pomodoro-extension-overlay")) return;

  const overlay = document.createElement("div");

  overlay.id = "matchu-pomodoro-extension-overlay";

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "999999999";
  overlay.style.background =
    "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontFamily = "system-ui";
  overlay.style.textAlign = "center";

  overlay.innerHTML = `
      <img src="${chrome.runtime.getURL(
        "icons/work_full.png"
      )}" style="width:120px;margin-bottom:20px;">
      <h1 style="font-size:32px;margin:0;">Stay Focused 🚀</h1>
      <p style="font-size:18px;margin-top:10px;">
        This site is blocked during your work session.
      </p>
  `;

  document.documentElement.appendChild(overlay);

})();