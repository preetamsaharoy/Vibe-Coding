let currentTab = null;

// ── Init ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Show domain
  try {
    const url = new URL(tab.url);
    document.getElementById("domain-badge").textContent = url.hostname.replace("www.", "");
  } catch {
    document.getElementById("domain-badge").textContent = "—";
  }

  // Render current tab mute button
  renderMainButton(tab.mutedInfo?.muted);

  // Render all tabs with audio
  await renderAudioTabs();
});

// ── Main button ───────────────────────────────────────
function renderMainButton(isMuted) {
  const btn       = document.getElementById("mute-btn");
  const btnIcon   = document.getElementById("btn-icon");
  const label     = document.getElementById("btn-label");
  const sub       = document.getElementById("btn-sub");
  const svgSound  = document.getElementById("btn-svg-sound");
  const svgMuted  = document.getElementById("btn-svg-muted");
  const logoWave1 = document.getElementById("wave1");
  const logoWave2 = document.getElementById("wave2");
  const logoMuteX = document.getElementById("mute-x");

  if (isMuted) {
    btn.classList.add("is-muted");
    btnIcon.className = "btn-icon muted";
    svgSound.style.display = "none";
    svgMuted.style.display = "block";
    label.textContent = "Unmute this tab";
    sub.textContent   = "Tab is currently muted";
    logoWave1.style.display = "none";
    logoWave2.style.display = "none";
    logoMuteX.style.display = "block";
  } else {
    btn.classList.remove("is-muted");
    btnIcon.className = "btn-icon sound";
    svgSound.style.display = "block";
    svgMuted.style.display = "none";
    label.textContent = "Mute this tab";
    sub.textContent   = "Tab is playing audio";
    logoWave1.style.display = "block";
    logoWave2.style.display = "block";
    logoMuteX.style.display = "none";
  }
}

// ── Toggle current tab ────────────────────────────────
async function toggleCurrentTab() {
  if (!currentTab) return;
  const nowMuted = !currentTab.mutedInfo?.muted;
  await chrome.tabs.update(currentTab.id, { muted: nowMuted });
  currentTab.mutedInfo = { muted: nowMuted };
  renderMainButton(nowMuted);
  await renderAudioTabs();
}

// ── All audio tabs ────────────────────────────────────
async function renderAudioTabs() {
  const allTabs = await chrome.tabs.query({ audible: true });
  // Also include muted tabs (they were audible before muting)
  const mutedTabs = await chrome.tabs.query({ muted: true });

  // Merge, deduplicate by id
  const seen = new Set();
  const audioTabs = [];
  for (const t of [...allTabs, ...mutedTabs]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      audioTabs.push(t);
    }
  }

  const list    = document.getElementById("tab-list");
  const section = document.getElementById("audio-tabs-section");
  const hint    = document.getElementById("footer-hint");
  const muteAll = document.getElementById("mute-all-btn");

  list.innerHTML = "";

  if (audioTabs.length === 0) {
    section.style.display = "none";
    hint.textContent = "No audio detected";
    muteAll.style.display = "none";
    return;
  }

  section.style.display = "block";
  muteAll.style.display = "block";
  const count = audioTabs.length;
  hint.textContent = `${count} tab${count !== 1 ? "s" : ""} with audio`;

  for (const t of audioTabs) {
    const isMuted = t.mutedInfo?.muted;
    const item = document.createElement("div");
    item.className = "tab-item";
    item.title = t.title || "Untitled tab";

    // Favicon
    let faviconEl;
    if (t.favIconUrl && !t.favIconUrl.startsWith("chrome://")) {
      faviconEl = document.createElement("img");
      faviconEl.className = "tab-favicon";
      faviconEl.src = t.favIconUrl;
      faviconEl.onerror = () => {
        faviconEl.replaceWith(makeFallbackFavicon());
      };
    } else {
      faviconEl = makeFallbackFavicon();
    }

    // Status dot
    const dot = document.createElement("div");
    dot.className = `tab-dot ${isMuted ? "muted" : "playing"}`;

    // Title
    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = t.title || "Untitled tab";

    // Toggle button
    const toggle = document.createElement("button");
    toggle.className = `tab-toggle ${isMuted ? "unmute" : ""}`;
    toggle.textContent = isMuted ? "Unmute" : "Mute";
    toggle.onclick = async (e) => {
      e.stopPropagation();
      const nowMuted = !isMuted;
      await chrome.tabs.update(t.id, { muted: nowMuted });
      // If this is the current tab, update main button too
      if (currentTab && t.id === currentTab.id) {
        currentTab.mutedInfo = { muted: nowMuted };
        renderMainButton(nowMuted);
      }
      await renderAudioTabs();
    };

    // Click row to switch to tab
    item.onclick = () => chrome.tabs.update(t.id, { active: true });

    item.append(faviconEl, dot, title, toggle);
    list.appendChild(item);
  }
}

function makeFallbackFavicon() {
  const el = document.createElement("div");
  el.className = "tab-favicon-fallback";
  return el;
}

// ── Mute all ─────────────────────────────────────────
async function muteAll() {
  const allTabs = await chrome.tabs.query({ audible: true });
  await Promise.all(allTabs.map(t => chrome.tabs.update(t.id, { muted: true })));
  if (currentTab) {
    currentTab.mutedInfo = { muted: true };
    renderMainButton(true);
  }
  await renderAudioTabs();
}
