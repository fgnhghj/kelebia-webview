import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMediaUrl } from '../api/client';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  ArrowLeft, Download, Eye, Code, ExternalLink,
  Loader2, FileText, Image, FileCode, File, CheckCircle2,
} from 'lucide-react';

/* ─── Extension helpers ─── */
const PDF_EXT = ['pdf'];
const IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const TEXT_EXT = [
  'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml',
  'py', 'js', 'ts', 'tsx', 'jsx', 'java', 'c', 'cpp', 'h', 'hpp',
  'css', 'scss', 'less', 'sql', 'sh', 'bash', 'bat', 'ps1',
  'rb', 'php', 'go', 'rs', 'swift', 'kt', 'r', 'lua', 'dart',
  'ini', 'conf', 'cfg', 'env', 'log', 'gitignore', 'dockerfile',
];
const HTML_EXT = ['html', 'htm'];
const OFFICE_EXT = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp'];

function getCategory(ext: string | null): 'pdf' | 'image' | 'text' | 'html' | 'office' | 'other' {
  if (!ext) return 'other';
  const e = ext.toLowerCase().replace('.', '');
  if (PDF_EXT.includes(e)) return 'pdf';
  if (IMG_EXT.includes(e)) return 'image';
  if (HTML_EXT.includes(e)) return 'html';
  if (TEXT_EXT.includes(e)) return 'text';
  if (OFFICE_EXT.includes(e)) return 'office';
  return 'other';
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'pdf': return <FileText size={20} />;
    case 'image': return <Image size={20} />;
    case 'text': return <FileCode size={20} />;
    case 'html': return <FileCode size={20} />;
    default: return <File size={20} />;
  }
}

/* ─── Download helpers ─── */

/** Generate safe 32-bit int notification ID */
const notifId = () => Math.floor(Math.random() * 2147483646) + 1;

/** Sanitise filename for filesystem */
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 120);

/** Convert ArrayBuffer to base64 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Show / update a local notification */
async function showNotification(id: number, title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        iconColor: '#D4845A',
        ongoing: false,
      }],
    });
  } catch { /* ignore */ }
}

export default function FileViewer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const rawUrl = params.get('url') || '';
  const title = params.get('title') || 'File';
  const ext = params.get('ext') || rawUrl.split('.').pop()?.split('?')[0] || '';

  const fileUrl = getMediaUrl(rawUrl);
  const category = getCategory(ext);

  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [htmlMode, setHtmlMode] = useState<'preview' | 'code' | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0); // 0-100
  const [dlDone, setDlDone] = useState(false);

  // Google Docs Viewer for PDFs and Office files
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  // Fetch text content for text/html files
  useEffect(() => {
    if (category === 'text' || category === 'html') {
      setLoading(true);
      fetch(fileUrl)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(txt => {
          setTextContent(txt);
          if (category === 'html') setHtmlMode('preview');
          setLoading(false);
        })
        .catch(e => {
          setError(`Failed to load file: ${e.message}`);
          setLoading(false);
        });
    } else {
      // For iframe-based viewers, loading is handled by iframe onLoad
      if (category !== 'image') {
        const timer = setTimeout(() => setLoading(false), 15000);
        return () => clearTimeout(timer);
      }
      setLoading(false);
    }
  }, [fileUrl, category]);

  /* ─── Download handler with progress + notifications ─── */
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setDlProgress(0);
    setDlDone(false);

    const fileName = safeName(title + (ext && !title.endsWith(`.${ext}`) ? `.${ext}` : ''));
    const nId = notifId();

    try {
      // Show "starting" notification
      await showNotification(nId, '⬇️ Downloading…', `Starting download: ${title}`);

      if (Capacitor.isNativePlatform()) {
        /* ─── Native: Use Filesystem.downloadFile or XHR → Filesystem.writeFile ─── */
        const token = localStorage.getItem('access_token');

        // Use XHR for progress tracking
        const data = await new Promise<ArrayBuffer>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', fileUrl, true);
          xhr.responseType = 'arraybuffer';
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              setDlProgress(pct);
              // Update notification every 20%
              if (pct % 20 === 0 || pct === 100) {
                showNotification(nId, '⬇️ Downloading…', `${title} — ${pct}%`);
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response as ArrayBuffer);
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send();
        });

        setDlProgress(100);

        // Convert to base64 and write to Downloads
        const base64Data = bufferToBase64(data);

        // Try to write to Downloads directory
        try {
          await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: base64Data,
            directory: Directory.ExternalStorage,
            recursive: true,
          });
        } catch {
          // Fallback: write to app's documents
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });
        }

        // Success notification
        await showNotification(nId, '✅ Download Complete', `${title} saved to Downloads`);
        setDlDone(true);
      } else {
        /* ─── Web fallback: anchor download ─── */
        const resp = await fetch(fileUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setDlProgress(100);
        setDlDone(true);
      }
    } catch (err: any) {
      console.error('Download failed:', err);
      await showNotification(nId, '❌ Download Failed', `Could not download ${title}`);
      // Fallback: open in browser
      window.open(fileUrl, '_blank');
    } finally {
      setDownloading(false);
      // Clear done status after 3s
      setTimeout(() => { setDlDone(false); setDlProgress(0); }, 3000);
    }
  }, [downloading, fileUrl, title, ext]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="file-viewer-page">
      {/* Top Bar */}
      <header className="file-viewer-header">
        <button className="icon-btn-ghost" onClick={goBack}>
          <ArrowLeft size={22} />
        </button>
        <div className="file-viewer-title-area">
          {getCategoryIcon(category)}
          <div className="file-viewer-title-text">
            <h1>{title}</h1>
            <span>{ext.toUpperCase()}{category !== 'other' ? ` · ${category}` : ''}</span>
          </div>
        </div>
        <div className="file-viewer-actions">
          {category === 'html' && textContent && (
            <button
              className="icon-btn-ghost"
              onClick={() => setHtmlMode(htmlMode === 'preview' ? 'code' : 'preview')}
              title={htmlMode === 'preview' ? 'View Source' : 'Preview'}
            >
              {htmlMode === 'preview' ? <Code size={20} /> : <Eye size={20} />}
            </button>
          )}
          <button
            className={`icon-btn-ghost ${downloading ? 'downloading' : ''} ${dlDone ? 'dl-done' : ''}`}
            onClick={handleDownload}
            disabled={downloading}
          >
            {dlDone ? <CheckCircle2 size={20} /> : downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          </button>
          <button className="icon-btn-ghost" onClick={() => window.open(fileUrl, '_blank')}>
            <ExternalLink size={20} />
          </button>
        </div>
      </header>

      {/* Download progress bar (visible during download) */}
      {(downloading || dlDone) && (
        <div className="dl-progress-bar-wrap">
          <div className={`dl-progress-bar ${dlDone ? 'done' : ''}`} style={{ width: `${dlProgress}%` }} />
          <span className="dl-progress-text">
            {dlDone ? '✓ Saved to Downloads' : `Downloading… ${dlProgress}%`}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="file-viewer-body">
        {loading && (
          <div className="file-viewer-loading">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p>Loading file…</p>
          </div>
        )}

        {error && (
          <div className="file-viewer-error">
            <FileText size={48} strokeWidth={1} className="text-tertiary" />
            <p>{error}</p>
            <button className="btn-primary btn-sm" onClick={handleDownload}>
              <Download size={16} /> Download Instead
            </button>
          </div>
        )}

        {/* PDF — Google Docs Viewer */}
        {category === 'pdf' && !error && (
          <iframe
            src={googleViewerUrl}
            className="file-viewer-iframe"
            title={title}
            onLoad={() => setLoading(false)}
            onError={() => { setError('Failed to load PDF'); setLoading(false); }}
          />
        )}

        {/* Office — Google Docs Viewer */}
        {category === 'office' && !error && (
          <iframe
            src={googleViewerUrl}
            className="file-viewer-iframe"
            title={title}
            onLoad={() => setLoading(false)}
            onError={() => { setError('Failed to load document'); setLoading(false); }}
          />
        )}

        {/* Image */}
        {category === 'image' && !error && (
          <div className="file-viewer-image-wrap">
            <img
              src={fileUrl}
              alt={title}
              className="file-viewer-image"
              onError={() => setError('Failed to load image')}
            />
          </div>
        )}

        {/* Text / Code */}
        {category === 'text' && textContent !== null && !error && (
          <div className="file-viewer-code-wrap">
            <pre className="file-viewer-code">{textContent}</pre>
          </div>
        )}

        {/* HTML — Preview or Source */}
        {category === 'html' && textContent !== null && !error && (
          <>
            {htmlMode === 'preview' ? (
              <iframe
                srcDoc={textContent}
                className="file-viewer-iframe"
                title={title}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="file-viewer-code-wrap">
                <pre className="file-viewer-code">{textContent}</pre>
              </div>
            )}
          </>
        )}

        {/* Unknown type — download prompt */}
        {category === 'other' && !loading && !error && (
          <div className="file-viewer-fallback">
            <File size={56} strokeWidth={1} className="text-tertiary" />
            <h3>{title}</h3>
            <p>This file type ({ext.toUpperCase() || 'unknown'}) can't be previewed.</p>
            <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {downloading ? ` Downloading ${dlProgress}%…` : ' Download File'}
            </button>
            <button className="btn-outline" onClick={() => window.open(fileUrl, '_blank')} style={{marginTop: 8}}>
              <ExternalLink size={18} /> Open in Browser
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
