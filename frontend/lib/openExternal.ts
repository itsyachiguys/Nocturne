// lib/openExternal.ts
export async function openExternal(url?: string | null): Promise<void> {
    if (!url) return;
  
    // Normal browser / PWA / Electron (Electron needs Step 3).
    const win = window.open(url, "_blank", "noopener,noreferrer");
  
    // window.open returns null when a popup blocker or WebView swallows it.
    // Fall back to a synthetic anchor click, then to same-tab navigation.
    if (!win) {
      try {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        window.location.assign(url);
      }
    }
  }