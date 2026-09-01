import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { app, IpcMainInvokeEvent } from 'electron';

export interface DownloadProgressPayload {
  percent: number;
  transferredMB: number;
  totalMB: number;
  speedMB: string;
}

export function downloadAndInstallUpdate(
  targetUrl: string,
  event: IpcMainInvokeEvent
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      resolve({ success: false, message: 'لینکی داونلۆد نادروستە.' });
      return;
    }

    const tempFileName = `baran-pos-update-${Date.now()}.exe`;
    const tempFilePath = path.join(app.getPath('temp'), tempFileName);
    const fileStream = fs.createWriteStream(tempFilePath);

    function followUrl(currentUrl: string, redirectCount = 0) {
      if (redirectCount > 10) {
        resolve({ success: false, message: 'Too many redirects while downloading.' });
        return;
      }

      const client = currentUrl.startsWith('https') ? https : http;

      const req = client.get(
        currentUrl,
        {
          headers: {
            'User-Agent': 'Baran-POS-Updater',
            Accept: '*/*',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            followUrl(res.headers.location, redirectCount + 1);
            return;
          }

          if (res.statusCode !== 200) {
            res.resume();
            resolve({
              success: false,
              message: `Server responded with error code: ${res.statusCode}`,
            });
            return;
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let receivedBytes = 0;
          let lastReportTime = Date.now();
          let bytesSinceLastReport = 0;

          res.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length;
            bytesSinceLastReport += chunk.length;
            const now = Date.now();

            if (now - lastReportTime >= 150 || receivedBytes === totalBytes) {
              const timeDiffSec = (now - lastReportTime) / 1000;
              const speedBps = timeDiffSec > 0 ? bytesSinceLastReport / timeDiffSec : 0;
              const speedMB = (speedBps / (1024 * 1024)).toFixed(1) + ' MB/s';
              const percent =
                totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 0;
              const transferredMB = parseFloat((receivedBytes / (1024 * 1024)).toFixed(1));
              const totalMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(1));

              const progressData: DownloadProgressPayload = {
                percent,
                transferredMB,
                totalMB,
                speedMB,
              };

              try {
                event.sender.send('app:downloadProgress', progressData);
              } catch {}

              lastReportTime = now;
              bytesSinceLastReport = 0;
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(async () => {
              try {
                event.sender.send('app:downloadProgress', {
                  percent: 100,
                  transferredMB: parseFloat((receivedBytes / (1024 * 1024)).toFixed(1)),
                  totalMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(1)),
                  speedMB: '0 MB/s',
                });
                event.sender.send('app:downloadCompleted', { tempFilePath });
              } catch {}

              setTimeout(() => {
                try {
                  const child = spawn(tempFilePath, [], {
                    detached: true,
                    stdio: 'ignore',
                  });
                  child.unref();

                  setTimeout(() => {
                    app.quit();
                  }, 1200);
                } catch (spawnErr) {
                  console.error('[Updater] Failed to spawn installer:', spawnErr);
                }
              }, 1000);

              resolve({
                success: true,
                message: 'داونلۆد تەواو بوو. سیستەم دەکرێتەوە و نوێ دەبێتەوە...',
              });
            });
          });

          fileStream.on('error', (err) => {
            fs.unlink(tempFilePath, () => {});
            resolve({ success: false, message: `Failed to save file: ${err.message}` });
          });
        }
      );

      req.on('error', (err) => {
        fs.unlink(tempFilePath, () => {});
        resolve({ success: false, message: `Download error: ${err.message}` });
      });
    }

    followUrl(targetUrl);
  });
}
