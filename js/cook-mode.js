(() => {
  let wakeLock = null;
  let keepAliveInterval = null;
  let active = false;

function isRecipePage() {
  return document.querySelector(".procedure, .ingredients");
}

function injectButton() {
  const btn = document.createElement("button");
  btn.id = "cookModeBtn";   // ← THIS is the canonical ID
  btn.textContent = "🍳 Cook Mode";

  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 16px;
    border-radius: 24px;
    border: 1px solid #333;
    background: #fff;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,.2);
  `;

  document.body.appendChild(btn);
  return btn;
}


  async function enable() {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Cook Mode: Wake Lock enabled");
    } catch {
      console.log("Cook Mode: fallback keep-alive");
      keepAliveInterval = setInterval(() => {
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
      }, 30000);
    }
  }

  function disable() {
    if (wakeLock) wakeLock.release();
    wakeLock = null;
    clearInterval(keepAliveInterval);
    console.log("Cook Mode: disabled");
  }

function init() {
  if (!isRecipePage()) return;

  const btn = injectButton();

  let active = localStorage.getItem("cookMode") === "on";

  if (active) {
    btn.textContent = "🍳 Cook Mode: On";
    enable();
  }

  btn.onclick = async () => {
    active = !active;
    localStorage.setItem("cookMode", active ? "on" : "off");
    btn.textContent = active ? "🍳 Cook Mode: On" : "🍳 Cook Mode";
    active ? enable() : disable();
  };
}


  document.addEventListener("DOMContentLoaded", init);
})();

