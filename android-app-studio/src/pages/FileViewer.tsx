import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMediaUrl } from '../api/client';
import {
  ArrowLeft, Download, Eye, Code, ExternalLink,
  Loader2, FileText, Image, FileCode, File,
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

/** Fetch file as blob with JWT auth header */
async function fetchWithAuth(url: string): Promise<Blob> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.blob();
}

export default function FileViewer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const blobUrlRef = useRef<string | null>(null);

  const rawUrl = params.get('url') || '';
  const title = params.get('title') || 'File';
  const ext = params.get('ext') || rawUrl.split('.').pop()?.split('?')[0] || '';

  const fileUrl = getMediaUrl(rawUrl);
  const category = getCategory(ext);

  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [htmlMode, setHtmlMode] = useState<'preview' | 'code' | null>(null);
  const [error, setError] = useState('');

  // Google Docs Viewer for Office files (these are usually public or we rely on URL)
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    setTextContent(null);
    setBlobUrl(null);

    if (category === 'text' || category === 'html') {
      // Fetch text content
      fetchWithAuth(fileUrl)
        .then(blob => blob.text())
        .then(txt => {
          setTextContent(txt);
          if (category === 'html') setHtmlMode('preview');
          setLoading(false);
        })
        .catch(e => {
          setError(`Failed to load: ${e.message}`);
          setLoading(false);
        });
    } else if (category === 'pdf') {
      // Fetch PDF as blob → create object URL → render in iframe
      fetchWithAuth(fileUrl)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBlobUrl(url);
          setLoading(false);
        })
        .catch(e => {
          setError(`Failed to load PDF: ${e.message}`);
          setLoading(false);
        });
    } else if (category === 'image') {
      // Images: fetch as blob for auth support
      fetchWithAuth(fileUrl)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBlobUrl(url);
          setLoading(false);
        })
        .catch(e => {
          setError(`Failed to load image: ${e.message}`);
          setLoading(false);
        });
    } else if (category === 'office') {
      // Office files: try Google Docs viewer (assumes public URL)
      // Loading dismissed by iframe onLoad or timeout
      const timer = setTimeout(() => setLoading(false), 12000);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [fileUrl, category]);

  const handleDownload = async () => {
    try {
      const blob = blobUrl
        ? await (await fetch(blobUrl)).blob()
        : await fetchWithAuth(fileUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', title);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

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
          <button className="icon-btn-ghost" onClick={handleDownload}>
            <Download size={20} />
          </button>
          <button className="icon-btn-ghost" onClick={() => window.open(fileUrl, '_blank')}>
            <ExternalLink size={20} />
          </button>
        </div>
      </header>

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

        {/* PDF — rendered from authenticated blob URL */}
        {category === 'pdf' && !error && blobUrl && (
          <object
            data={blobUrl}
            type="application/pdf"
            className="file-viewer-iframe"
            title={title}
          >
            {/* Fallback if <object> doesn't render PDF (some Android WebViews) */}
            <iframe
              src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(blobUrl)}`}
              className="file-viewer-iframe"
              title={title}
              onLoad={() => setLoading(false)}
            />
          </object>
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

        {/* Image — rendered from authenticated blob URL */}
        {category === 'image' && !error && blobUrl && (
          <div className="file-viewer-image-wrap">
            <img
              src={blobUrl}
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
            <button className="btn-primary" onClick={handleDownload}>
              <Download size={18} /> Download File
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
