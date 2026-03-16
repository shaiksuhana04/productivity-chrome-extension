(function(){

  const overlay = document.getElementById(
    "matchu-pomodoro-extension-overlay"
  );

  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }

})();