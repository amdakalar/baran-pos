/**
 * Baran POS - Version & Update Manager Utility
 */

export const APP_VERSION = '1.0.3';
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
 * Fetch latest release from Electron IPC (Turso Cloud DB) or GitHub Releases API
 */
export async function fetchLatestRelease(currentVersion: string = APP_VERSION): Promise<AppUpdateInfo | null> {
  // 1. If running inside Electron desktop, use the secure IPC handler (Turso Cloud & GitHub)
  if (window.electronAPI?.app?.checkUpdate) {
    try {
      const update = await window.electronAPI.app.checkUpdate();
      if (update && update.hasUpdate) {
        return {
          version: update.latestVersion,
          title: update.title,
          releaseNotes: update.releaseNotes,
          downloadUrl: update.downloadUrl,
        };
      }
      return null;
    } catch (err) {
      console.warn('[UpdateChecker] IPC checkUpdate failed:', err);
    }
  }

  // 2. Direct Turso REST Cloud fallback (works 100% of the time, zero GitHub API rate limits)
  try {
    const res = await fetch('https://baran-pos-amdakalar.aws-ap-northeast-1.turso.io/v2/pipeline', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgxMTgyMDcsImlkIjoiMDFhMDU0MWQtNDIwMS03ZTE0LWE5YTYtYzA4YzQ0OWZmYTIwIiwia2lkIjoiOFZCRHU2WTVhcm9UanN3YkpoQ0tYenl2dkhFVnJnckJ1ODRja21NX3ROYyIsInJpZCI6IjExODdlMzNkLTNlODUtNDExYi1hZTQ0LTkyNTQxMmI0OWE5OSJ9.RKXSax5xEx37Z8OW9Jga7sl4deo6FFWNihLJ-lB9YnJ8swENQOgAWBwx70yHCUmBziXSwaTfeuRzUCesVWzSCg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: `SELECT version, title, download_url, release_notes FROM app_version_meta WHERE key = 'latest_release' LIMIT 1;`,
            },
          },
          { type: 'close' },
        ],
      }),
    });
    if (res.ok) {
      const json: any = await res.json();
      const rows = json.results?.[0]?.response?.result?.rows;
      if (rows && rows.length > 0) {
        const ver = String(rows[0][0]?.value || '');
        const title = String(rows[0][1]?.value || `وەشانی نوێ v${ver}`);
        const downloadUrl = String(rows[0][2]?.value || 'https://github.com/amdakalar/baran-pos/releases/latest');
        const releaseNotes = String(rows[0][3]?.value || '');
        if (ver && isNewerVersion(ver, currentVersion)) {
          return {
            version: ver,
            title,
            releaseNotes,
            downloadUrl,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[UpdateChecker] Direct Turso query failed:', err);
  }

  // 3. Try official GitHub Release API (if repo is public)
  try {
    const res = await fetch(GITHUB_API_LATEST, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Baran-POS-App' },
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
