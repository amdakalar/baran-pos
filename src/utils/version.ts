/**
 * Baran POS - Version & Update Manager Utility
 */

export const APP_VERSION = '1.0.1';
export const GITHUB_REPO = 'amdakalar/baran-pos';
export const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const GITHUB_RAW_PKG = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`;

export interface AppUpdateInfo {
  version: string;
  title: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt?: string;
  isMandatory?: boolean;
}

/**
 * Parse semver string (e.g. "1.0.1" or "v1.0.1-beta") into numeric parts [1, 0, 1]
 */
export function parseSemver(ver: string): number[] {
  if (!ver) return [0, 0, 0];
  const clean = ver.replace(/^v/, '').trim().split(/[-+]/)[0];
  const parts = clean.split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts;
}

/**
 * Compare two semver strings.
 * Returns true if remote is strictly newer/greater than current.
 */
export function isNewerVersion(remote: string, current: string = APP_VERSION): boolean {
  if (!remote) return false;
  const rParts = parseSemver(remote);
  const cParts = parseSemver(current);
  const maxLen = Math.max(rParts.length, cParts.length, 3);

  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

/**
 * Fetch latest release from GitHub API or raw fallback
 */
export async function fetchLatestRelease(currentVersion: string = APP_VERSION): Promise<AppUpdateInfo | null> {
  // 1. Try official GitHub Release API
  try {
    const res = await fetch(GITHUB_API_LATEST, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      cache: 'no-cache',
    });

    if (res.ok) {
      const data = await res.json();
      const tag = (data.tag_name || '').replace(/^v/, '').trim();
      if (tag && isNewerVersion(tag, currentVersion)) {
        const asset = data.assets?.find((a: any) => a.name.endsWith('.exe')) || data.assets?.[0];
        const downloadUrl = asset?.browser_download_url || data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;
        return {
          version: tag,
          title: data.name || `وەشانی نوێ v${tag}`,
          releaseNotes: data.body || '',
          downloadUrl,
          publishedAt: data.published_at,
        };
      }
    }
  } catch (err) {
    console.warn('[UpdateChecker] GitHub releases API fetch failed:', err);
  }

  // 2. Fallback to raw package.json on main branch in case rate limited
  try {
    const rawRes = await fetch(`${GITHUB_RAW_PKG}?t=${Date.now()}`, {
      cache: 'no-cache',
    });
    if (rawRes.ok) {
      const pkg = await rawRes.json();
      const remoteVer = (pkg.version || '').trim();
      if (remoteVer && isNewerVersion(remoteVer, currentVersion)) {
        return {
          version: remoteVer,
          title: `وەشانی نوێ (v${remoteVer})`,
          releaseNotes: 'وەشانێکی نوێ لە گیتحەب بەردەستە بە تایبەتمەندی و چاکسازیی نوێوە.',
          downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
        };
      }
    }
  } catch (err) {
    console.warn('[UpdateChecker] Raw package.json fallback failed:', err);
  }

  return null;
}

/**
 * Helper to safely open external links inside Electron or web browser
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  if (window.electronAPI?.app?.openExternal) {
    window.electronAPI.app.openExternal(url).catch(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
