(async function () {
  const sidebar = document.getElementById("sidebarContent");
  const search = document.getElementById("recipeSearch");
  const all = document.getElementById("allRecipes"); // index page only

  if (!sidebar || !search) return;

  const collapseByDefault = document.body.dataset.sidebarCollapsed === "true";

  async function fetchJsonWithFallbacks(urls) {
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        return { items: await res.json(), usedUrl: url };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Unable to load recipes.json");
  }

  try {
    const { items, usedUrl } = await fetchJsonWithFallbacks([
      "../data/recipes.json",
      "data/recipes.json"
    ]);

    const isRecipePage = usedUrl.startsWith("..");
    const linkPrefix = isRecipePage ? "../" : "";

    const byCat = new Map();
    for (const r of items) {
      const cat = r.category || "Uncategorized";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(r);
    }

    const cats = Array.from(byCat.keys()).sort((a, b) => a.localeCompare(b));
    for (const c of cats) {
      byCat.get(c).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    const currentPath = location.pathname.split("/").slice(-2).join("/");
    const currentItem = items.find(r => (r.path || "").endsWith(currentPath));
    const currentCategory = currentItem ? (currentItem.category || "Uncategorized") : null;

    function escapeHtml(s) {
      return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function render(filterText = "") {
      const q = filterText.trim().toLowerCase();

      sidebar.innerHTML =
        cats.map((cat) => {
          const rows = byCat.get(cat).filter(r =>
            !q ||
            (r.title || "").toLowerCase().includes(q) ||
            (r.slug || "").toLowerCase().includes(q)
          );

          if (!rows.length) return "";

          let shouldOpen = false;
          if (q.length > 0) {
            shouldOpen = true;
          } else if (!collapseByDefault && isRecipePage && currentCategory === cat) {
            shouldOpen = true;
          }

          const listHtml = rows.map(r => {
            const href = `${linkPrefix}${r.path}`;
            const isCurrent = isRecipePage && (r.path || "").endsWith(currentPath);
            return `
              <li>
                <a href="${escapeHtml(href)}" ${isCurrent ? 'aria-current="page"' : ""}>
                  ${escapeHtml(r.title)}
                </a>
              </li>
            `;
          }).join("");

          return `
            <details class="collapsible" ${shouldOpen ? "open" : ""}>
              <summary>${escapeHtml(cat)} <span class="cat-count">(${rows.length})</span></summary>
              <div class="collapsible-body">
                <ul>${listHtml}</ul>
              </div>
            </details>
          `;
        }).join("") || `<div class="text-muted">No matches.</div>`;

      if (isRecipePage && q.length === 0) {
        const currentLink = sidebar.querySelector('a[aria-current="page"]');
        if (currentLink) {
          currentLink.scrollIntoView({ block: "center" });
        }
      }
    }

    if (all) {
      all.innerHTML = `
        <p>Ingredients first. Procedures second.</p>
        <p class="text-muted">
          This collection focuses on simple, whole-food recipes inspired by longevity traditions and everyday cooking.
        </p>
        <ul class="text-muted">
          <li>Browse by category on the left</li>
          <li>Search by name or ingredient</li>
          <li>Click any recipe for a clean, printable format</li>
        </ul>
      `;
    }

    search.addEventListener("input", () => render(search.value));
    render();

  } catch (err) {
    console.error(err);
    sidebar.innerHTML = `
      <div class="text-muted">
        Sidebar failed to load.<br />
        <code>${String(err).replaceAll("<","&lt;").replaceAll(">","&gt;")}</code>
      </div>
    `;
    if (all) {
      all.innerHTML = `<div class="text-muted">Failed to load recipes.</div>`;
    }
  }
})();

/* =====================================================
   Cook Mode — iOS-SAFE, Desktop-SAFE
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cookModeBtn")) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const btn = document.createElement("button");
  btn.id = "cookModeBtn";
  btn.type = "button";
  btn.textContent = "🍳 Cook Mode";

  btn.style.position = "fixed";
  btn.style.right = "16px";
  btn.style.bottom = "calc(16px + env(safe-area-inset-bottom))";
  btn.style.zIndex = "2147483647";
  btn.style.padding = "10px 14px";
  btn.style.borderRadius = "999px";
  btn.style.border = "none";
  btn.style.background = "#2ecc71";
  btn.style.color = "#000";
  btn.style.fontSize = "16px";
  btn.style.fontWeight = "600";
  btn.style.boxShadow = "0 4px 12px rgba(0,0,0,.4)";
  btn.style.cursor = "pointer";

  let wakeLock = null;
  let enabled = false;

  btn.addEventListener("click", async () => {
    if (isIOS || !("wakeLock" in navigator)) {
      alert(
        "Cook Mode on iPhone\n\n" +
        "iOS does not allow browsers to keep the screen awake.\n\n" +
        "Workaround:\n" +
        "Settings → Display & Brightness → Auto-Lock → Never\n\n" +
        "Turn it back on after cooking."
      );
      return;
    }

    try {
      if (!enabled) {
        wakeLock = await navigator.wakeLock.request("screen");
        btn.textContent = "🍳 Cook Mode: ON";
        enabled = true;
      } else {
        await wakeLock.release();
        wakeLock = null;
        btn.textContent = "🍳 Cook Mode";
        enabled = false;
      }
    } catch (err) {
      console.error("Wake Lock error:", err);
    }
  });

  document.body.appendChild(btn);
});
