import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import Sidebar from '../components/Sidebar';
import { roomsAPI, sectionsAPI, contentAPI, assignmentsAPI, submissionsAPI, announcementsAPI, commentsAPI, exportAPI } from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiFileText, FiActivity, FiEdit3, FiPackage, FiLink, FiCopy,
    FiClock, FiFile, FiEdit, FiMessageSquare, FiUsers, FiPaperclip,
    FiFolderPlus, FiFolder, FiDownload, FiExternalLink, FiPlus,
    FiCheckCircle, FiAward, FiMapPin, FiMessageCircle,
    FiCheck, FiX, FiTrash2, FiBookOpen, FiEye, FiRefreshCw,
    FiSave, FiImage, FiMaximize2, FiMinimize2, FiArrowDown, FiArrowUp, FiLogOut
} from 'react-icons/fi';

const TYPE_ICONS = {
    lecture: <FiFileText />,
    tp: <FiActivity />,
    exam: <FiEdit3 />,
    resource: <FiPackage />,
    link: <FiLink />
};

function getFileUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}${path}`;
}

function copyToClipboard(text, successMsg, failMsg) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(successMsg || 'Copied!');
        }).catch(() => {
            fallbackCopy(text, successMsg, failMsg);
        });
    } else {
        fallbackCopy(text, successMsg, failMsg);
    }
}

function fallbackCopy(text, successMsg, failMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        toast.success(successMsg || 'Copied!');
    } catch {
        toast.error(failMsg || 'Copy failed');
    }
    document.body.removeChild(textarea);
}

function timeAgo(d) {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return '~1m';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
}

function Countdown({ deadline }) {
    const { t } = useTranslation();
    const [diff, setDiff] = useState(new Date(deadline) - Date.now());
    useEffect(() => {
        const timer = setInterval(() => setDiff(new Date(deadline) - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [deadline]);
    if (diff <= 0) return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> {t('room.pastDeadline')}</span>;
    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000), sec = Math.floor((diff % 60000) / 1000);
    return (
        <div className="countdown">
            <div className="countdown-unit"><div className="value">{d}</div><div className="label">{t('common.days')}</div></div>
            <div className="countdown-unit"><div className="value">{h}</div><div className="label">{t('common.hours')}</div></div>
            <div className="countdown-unit"><div className="value">{m}</div><div className="label">{t('common.minutes')}</div></div>
            <div className="countdown-unit"><div className="value">{sec}</div><div className="label">{t('common.seconds')}</div></div>
        </div>
    );
}

/* ---- File Preview Modal ---- */
function FilePreviewModal({ url, filename, onClose }) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    const fullUrl = getFileUrl(url);
    const [textContent, setTextContent] = useState('');
    const [loading, setLoading] = useState(false);

    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
    const isPdf = ext === 'pdf';
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    const isAudio = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext);
    const isCode = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'rb', 'go', 'rs', 'php', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bash', 'ps1', 'bat'].includes(ext);
    const isText = ['txt', 'md', 'markdown', 'csv', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'log', 'html', 'css', 'scss', 'less', 'sass', 'graphql', 'proto', 'makefile', 'dockerfile', 'gitignore'].includes(ext) || isCode;
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
    const canPreview = isImage || isPdf || isVideo || isAudio || isText;

    const LANG_MAP = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', rb: 'ruby', sh: 'bash', yml: 'yaml', md: 'markdown' };

    /* For text files, fetch content to render inline */
    useEffect(() => {
        if (isText && fullUrl) {
            setLoading(true);
            fetch(fullUrl)
                .then(r => { if (!r.ok) throw new Error('Fetch failed'); return r.text(); })
                .then(t => setTextContent(t))
                .catch(() => setTextContent('Error loading file.'))
                .finally(() => setLoading(false));
        }
    }, [isText, fullUrl]);

    const renderText = () => {
        if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>;
        if (ext === 'json') {
            try { return <pre style={preStyle}>{JSON.stringify(JSON.parse(textContent), null, 2)}</pre>; } catch { /* fall through */ }
        }
        if (ext === 'csv') {
            const rows = textContent.split('\n').filter(r => r.trim()).map(r => r.split(','));
            return (
                <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        {rows.map((row, i) => (
                            <tr key={i} style={{ background: i === 0 ? 'var(--bg-primary)' : 'transparent' }}>
                                {row.map((cell, j) => i === 0
                                    ? <th key={j} style={cellStyle}>{cell.trim()}</th>
                                    : <td key={j} style={cellStyle}>{cell.trim()}</td>
                                )}
                            </tr>
                        ))}
                    </table>
                </div>
            );
        }
        if (ext === 'md' || ext === 'markdown') {
            return <div style={{ ...preStyle, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: simpleMarkdown(textContent) }} />;
        }
        return <pre style={preStyle}>{textContent}</pre>;
    };

    const preStyle = { whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, lineHeight: 1.7, padding: 20, margin: 0, color: 'var(--text-primary)', tabSize: 4 };
    const cellStyle = { border: '1px solid var(--border)', padding: '6px 10px', textAlign: 'left' };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }} role="dialog" aria-modal="true" aria-label="File preview">
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: 960, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
                        <FiEye /> {filename || 'Preview'}
                        {(isCode || isText) && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>{LANG_MAP[ext] || ext}</span>}
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isOffice && (
                            <a href={`https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiExternalLink size={14} /> Google Viewer
                            </a>
                        )}
                        <a href={fullUrl} download className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiDownload size={14} /> Download
                        </a>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: canPreview ? 0 : 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    {isImage && <div style={{ padding: 16, textAlign: 'center' }}><img src={fullUrl} alt={filename} style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto', borderRadius: 8 }} /></div>}
                    {isPdf && <iframe src={`${fullUrl}#toolbar=1&navpanes=0`} title={filename} style={{ width: '100%', height: '75vh', border: 'none', borderRadius: 8 }} />}
                    {isVideo && (
                        <div style={{ padding: 16, textAlign: 'center' }}>
                            <video controls style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} src={fullUrl}>
                                Your browser does not support video playback.
                            </video>
                        </div>
                    )}
                    {isAudio && (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <FiFile size={48} style={{ color: 'var(--brand)', marginBottom: 16 }} />
                            <p style={{ fontWeight: 600, marginBottom: 16 }}>{filename}</p>
                            <audio controls style={{ width: '100%', maxWidth: 400 }} src={fullUrl}>
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    )}
                    {isText && !isImage && !isPdf && renderText()}
                    {isOffice && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <FiFile size={48} style={{ color: 'var(--brand)', marginBottom: 16 }} />
                            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{filename}</p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>Office files can be viewed with Google Docs Viewer</p>
                            <a href={`https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginRight: 8 }}>
                                <FiExternalLink style={{ marginRight: 6 }} /> Open in Google Viewer
                            </a>
                            <a href={fullUrl} download className="btn btn-secondary">
                                <FiDownload style={{ marginRight: 6 }} /> Download
                            </a>
                        </div>
                    )}
                    {!canPreview && !isOffice && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <FiFile size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{filename}</p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Preview not available for .{ext} files</p>
                            <a href={fullUrl} download className="btn btn-primary">
                                <FiDownload style={{ marginRight: 6 }} /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

/* Simple markdown to HTML (bold, italic, headers, links, code) */
function simpleMarkdown(text) {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/`([^`]+)`/g, '<code style="background:var(--bg-primary);padding:1px 5px;border-radius:3px;font-size:13px">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
            const trimmed = url.trim();
            if (/^https?:\/\//i.test(trimmed)) {
                return `<a href="${trimmed}" target="_blank" rel="noreferrer" style="color:var(--brand)">${label}</a>`;
            }
            return label;
        })
        .replace(/\n/g, '<br/>');
}

/* ---- Live Timer Component ---- */
function LiveTimer({ lastRefresh, onRefresh, refreshInterval }) {
    const { t } = useTranslation();
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - lastRefresh) / 1000);
            setSeconds(elapsed);
        }, 1000);
        return () => clearInterval(timer);
    }, [lastRefresh]);

    const nextIn = Math.max(0, refreshInterval - seconds);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            <button onClick={onRefresh} title={t('room.refreshNow')}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                <FiRefreshCw size={13} />
            </button>
            <span style={{ fontFamily: 'monospace', minWidth: 24, textAlign: 'right' }}>{nextIn}s</span>
        </div>
    );
}

export default function RoomDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [room, setRoom] = useState(null);
    const [tab, setTab] = useState('content');
    const [sections, setSections] = useState([]);
    const [unsectionedContent, setUnsectionedContent] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [members, setMembers] = useState({ members: [], pending: [] });
    const [loading, setLoading] = useState(true);

    // Auto-refresh
    const REFRESH_INTERVAL = 30;
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const refreshTimerRef = useRef(null);

    // Modals
    const [showUpload, setShowUpload] = useState(false);
    const [showAssignment, setShowAssignment] = useState(false);
    const [showAnnouncement, setShowAnnouncement] = useState(false);
    const [showSection, setShowSection] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    // Forms
    const [uploadForm, setUploadForm] = useState({ title: '', section: '', content_type: 'lecture', file: null, link: '' });
    const [assignForm, setAssignForm] = useState({ title: '', description: '', deadline: '', max_grade: 20, section: '', file: null });
    const [announceForm, setAnnounceForm] = useState({ title: '', body: '', is_pinned: false });
    const [sectionTitle, setSectionTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit states
    const [editingContent, setEditingContent] = useState(null);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    // Feature States
    const [selectedFiles, setSelectedFiles] = useState({});
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [expandedAssignment, setExpandedAssignment] = useState(null); // assignment id
    const [teacherSubmissions, setTeacherSubmissions] = useState([]); // submissions for expanded assignment
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [gradingId, setGradingId] = useState(null); // submission id being graded
    const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

    // Comments
    const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    // Sort assignments
    const [assignSort, setAssignSort] = useState('newest');

    // Room settings
    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [roomForm, setRoomForm] = useState({ name: '', subject: '', description: '', color_theme: '' });
    const [showFullscreenCode, setShowFullscreenCode] = useState(false);

    const isTeacher = room?.teacher?.id === user?.id;

    // Unsubmitted count for students
    const unsubmittedCount = !isTeacher ? assignments.filter(a => !a.my_submission && !a.is_past_deadline).length : 0;

    const loadAll = useCallback(async (silent = false) => {
        try {
            const roomRes = await roomsAPI.get(id);
            setRoom(roomRes.data);

            const [secRes, assRes, annRes, contRes] = await Promise.allSettled([
                sectionsAPI.list(id), assignmentsAPI.list(id), announcementsAPI.list(id), contentAPI.list(id)
            ]);
            if (secRes.status === 'fulfilled') setSections(secRes.value.data.results || secRes.value.data);
            if (assRes.status === 'fulfilled') setAssignments(assRes.value.data.results || assRes.value.data);
            if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data.results || annRes.value.data);
            // Collect unsectioned content (content with section=null)
            if (contRes.status === 'fulfilled') {
                const allContent = contRes.value.data.results || contRes.value.data;
                setUnsectionedContent(allContent.filter(c => !c.section));
            }

            if (roomRes.data.teacher?.id === user?.id) {
                try {
                    const memRes = await roomsAPI.members(id);
                    setMembers(memRes.data);
                } catch { /* silent */ }
            }
            setLastRefresh(Date.now());
        } catch {
            if (!silent) toast.error(t('room.loadError'));
        }
        finally { setLoading(false); }
    }, [id, user?.id, t]);

    // Initial load + auto-refresh
    useEffect(() => {
        loadAll();
        refreshTimerRef.current = setInterval(() => {
            loadAll(true);
        }, REFRESH_INTERVAL * 1000);
        return () => clearInterval(refreshTimerRef.current);
    }, [loadAll]);

    const manualRefresh = () => {
        loadAll(true);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let sectionId = uploadForm.section;
            // Auto-create a default section if none exist
            if (!sectionId && sections.length === 0) {
                try {
                    const secRes = await sectionsAPI.create({ room: parseInt(id), title: t('room.defaultSection') || 'General' });
                    sectionId = secRes.data.id;
                } catch { /* proceed without section */ }
            }
            // If still no section but sections exist, use the first one
            if (!sectionId && sections.length > 0) {
                sectionId = sections[0].id;
            }
            const fd = new FormData();
            fd.append('room', id);
            fd.append('title', uploadForm.title);
            fd.append('content_type', uploadForm.content_type);
            if (sectionId) fd.append('section', sectionId);
            if (uploadForm.file) fd.append('file', uploadForm.file);
            if (uploadForm.link) fd.append('link', uploadForm.link);
            await contentAPI.create(fd);
            toast.success(t('room.uploadSuccess'));
            if (uploadForm.content_type === 'tp') {
                toast.success(t('room.tpAutoAssignment'), { icon: '📝' });
            }
            setShowUpload(false);
            setUploadForm({ title: '', section: '', content_type: 'lecture', file: null, link: '' });
            loadAll();
        } catch { toast.error(t('room.uploadError')); }
        setSubmitting(false);
    };

    const handleNewAssignment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('room', id);
            fd.append('title', assignForm.title);
            fd.append('description', assignForm.description);
            if (assignForm.deadline) fd.append('deadline', new Date(assignForm.deadline).toISOString());
            fd.append('max_grade', assignForm.max_grade);
            if (assignForm.section) fd.append('section', assignForm.section);
            if (assignForm.file) fd.append('file', assignForm.file);
            await assignmentsAPI.create(fd);
            toast.success(t('room.assignmentCreated'));
            setShowAssignment(false);
            setAssignForm({ title: '', description: '', deadline: '', max_grade: 20, section: '', file: null });
            loadAll();
        } catch { toast.error(t('room.assignmentError')); }
        setSubmitting(false);
    };

    const handleNewAnnouncement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await announcementsAPI.create({ room: parseInt(id), ...announceForm });
            toast.success(t('room.announcementPublished'));
            setShowAnnouncement(false);
            setAnnounceForm({ title: '', body: '', is_pinned: false });
            loadAll();
        } catch { toast.error(t('room.announcementError')); }
        setSubmitting(false);
    };

    const handleNewSection = async (e) => {
        e.preventDefault();
        if (!sectionTitle.trim()) return;
        try {
            await sectionsAPI.create({ room: parseInt(id), title: sectionTitle });
            toast.success(t('room.sectionAdded'));
            setShowSection(false);
            setSectionTitle('');
            loadAll();
        } catch { toast.error(t('room.sectionError')); }
    };

    // Edit handlers
    const handleSaveContent = async (item) => {
        try {
            const fd = new FormData();
            fd.append('title', editingContent.title);
            if (editingContent.description !== undefined) fd.append('description', editingContent.description);
            await contentAPI.update(item.id, fd);
            toast.success(t('room.editSuccess'));
            setEditingContent(null);
            loadAll();
        } catch { toast.error(t('room.editError')); }
    };

    const handleSaveAssignment = async () => {
        try {
            const data = { title: editingAssignment.title, description: editingAssignment.description, max_grade: editingAssignment.max_grade };
            if (editingAssignment.deadline) data.deadline = new Date(editingAssignment.deadline).toISOString();
            await assignmentsAPI.update(editingAssignment.id, data);
            toast.success(t('room.editSuccess'));
            setEditingAssignment(null);
            loadAll();
        } catch { toast.error(t('room.editError')); }
    };

    const handleSaveAnnouncement = async () => {
        try {
            await announcementsAPI.update(editingAnnouncement.id, { title: editingAnnouncement.title, body: editingAnnouncement.body });
            toast.success(t('room.editSuccess'));
            setEditingAnnouncement(null);
            loadAll();
        } catch { toast.error(t('room.editError')); }
    };

    const handleMultiSubmit = async (assignmentId) => {
        const files = selectedFiles[assignmentId];
        if (!files || files.length === 0) return;
        setSubmitting(true);
        const fd = new FormData();
        fd.append('assignment', assignmentId);
        files.forEach(f => fd.append('files', f));
        try {
            await submissionsAPI.create(fd);
            toast.success(t('room.submissionSuccess'));
            setSelectedFiles(p => { const newP = { ...p }; delete newP[assignmentId]; return newP; });
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.non_field_errors?.[0] || t('room.submissionError'));
        }
        setSubmitting(false);
    };

    const handleToggleSubmissions = async (assignmentId) => {
        if (expandedAssignment === assignmentId) {
            setExpandedAssignment(null);
            setTeacherSubmissions([]);
            return;
        }
        setExpandedAssignment(assignmentId);
        setLoadingSubs(true);
        try {
            const res = await submissionsAPI.list(assignmentId);
            setTeacherSubmissions(res.data.results || res.data);
        } catch { toast.error(t('room.loadError')); }
        setLoadingSubs(false);
    };

    const handleDeleteSubmission = async (submissionId) => {
        if (!window.confirm(t('room.confirmDeleteSubmission'))) return;
        try {
            await submissionsAPI.delete(submissionId);
            toast.success(t('room.submissionDeleted'));
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleGradeSubmission = async (submissionId) => {
        if (!gradeForm.score) return;
        try {
            await submissionsAPI.grade(submissionId, gradeForm);
            toast.success(t('room.graded'));
            setGradingId(null);
            setGradeForm({ score: '', feedback: '' });
            // Refresh submissions list
            if (expandedAssignment) {
                const res = await submissionsAPI.list(expandedAssignment);
                setTeacherSubmissions(res.data.results || res.data);
            }
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleMemberAction = async (memberId, action) => {
        try {
            await roomsAPI.manageMember(id, { member_ids: [memberId], action });
            toast.success(action === 'approve' ? t('room.approved') : t('room.removed'));
            const memRes = await roomsAPI.members(id);
            setMembers(memRes.data);
            setSelectedMembers(p => p.filter(x => x !== memberId));
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleBulkRemove = async () => {
        if (!window.confirm(`${t('room.expelSelected')} (${selectedMembers.length})?`)) return;
        try {
            await roomsAPI.manageMember(id, { member_ids: selectedMembers, action: 'remove' });
            toast.success(t('room.expelled'));
            setSelectedMembers([]);
            const memRes = await roomsAPI.members(id);
            setMembers(memRes.data);
        } catch { toast.error(t('room.actionFailed')); }
    };

    // Delete handlers
    const handleDeleteContent = async (contentId) => {
        if (!window.confirm(t('room.confirmDeleteContent'))) return;
        try {
            await contentAPI.delete(contentId);
            toast.success(t('room.contentDeleted'));
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm(t('room.confirmDeleteAssignment'))) return;
        try {
            await assignmentsAPI.delete(assignmentId);
            toast.success(t('room.assignmentDeleted'));
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        if (!window.confirm(t('room.confirmDeleteAnnouncement'))) return;
        try {
            await announcementsAPI.delete(announcementId);
            toast.success(t('room.announcementDeleted'));
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
    };

    // Comments
    const handleToggleComments = async (announcementId) => {
        if (expandedAnnouncement === announcementId) {
            setExpandedAnnouncement(null);
            setComments([]);
            return;
        }
        setExpandedAnnouncement(announcementId);
        setLoadingComments(true);
        try {
            const res = await commentsAPI.list(announcementId);
            setComments(res.data.results || res.data);
        } catch { toast.error(t('room.loadError')); }
        setLoadingComments(false);
    };

    const handlePostComment = async (announcementId) => {
        if (!commentText.trim()) return;
        try {
            await commentsAPI.create({ announcement: announcementId, body: commentText });
            setCommentText('');
            const res = await commentsAPI.list(announcementId);
            setComments(res.data.results || res.data);
            loadAll(); // refresh comment_count
        } catch { toast.error(t('room.actionFailed')); }
    };

    // Room settings
    const openRoomSettings = () => {
        setRoomForm({ name: room.name, subject: room.subject || '', description: room.description || '', color_theme: room.color_theme || '#3A4B54' });
        setShowRoomSettings(true);
    };

    const navigate = useNavigate();

    const handleLeaveRoom = async () => {
        if (!window.confirm(t('room.leaveConfirm') || 'Are you sure you want to leave this room?')) return;
        try {
            await roomsAPI.leave(id);
            toast.success(t('room.leftRoom') || 'You have left the room');
            navigate('/dashboard');
        } catch { toast.error(t('room.actionFailed')); }
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(roomForm).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
            await roomsAPI.update(id, fd);
            toast.success(t('room.roomUpdated'));
            setShowRoomSettings(false);
            loadAll();
        } catch { toast.error(t('room.actionFailed')); }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="app-layout"><Sidebar /><main className="main-content">
            <div className="skeleton" style={{ height: 120, marginBottom: 20, borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: 40, width: '50%', marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 200 }} />
        </main></div>
    );

    if (!room) return <div className="app-layout"><Sidebar /><main className="main-content"><div className="empty-state"><h3>{t('room.notFound')}</h3></div></main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Banner */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                    background: `linear-gradient(135deg, ${room.color_theme}, ${room.color_theme}88)`,
                    borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 24, color: 'white',
                    position: 'relative'
                }}>
                    {/* Live timer top-right */}
                    <div style={{ position: 'absolute', top: 12, right: 16 }}>
                        <LiveTimer lastRefresh={lastRefresh} onRefresh={manualRefresh} refreshInterval={REFRESH_INTERVAL} />
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8, fontWeight: 500 }}>
                        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>{t('room.dashboard')}</Link> / {room.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 0, letterSpacing: '-0.5px' }}>{room.name}</h1>
                        {isTeacher ? (
                            <button onClick={openRoomSettings} title={t('room.roomSettings')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>
                                <FiEdit3 size={16} />
                            </button>
                        ) : (
                            <button onClick={handleLeaveRoom} title={t('room.leaveRoom') || 'Leave Room'} style={{ background: 'rgba(220,53,69,0.25)', border: '1px solid rgba(220,53,69,0.4)', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#ff6b6b', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.4)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.25)'; }}
                            >
                                <FiLogOut size={14} /> {t('room.leave') || 'Leave'}
                            </button>
                        )}
                    </div>
                    {room.subject && <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', marginTop: 8 }}>{room.subject}</span>}
                    {room.description && <p style={{ fontSize: 14, opacity: 0.85, marginTop: 8, lineHeight: 1.5, maxWidth: 600 }}>{room.description}</p>}

                    {isTeacher && (
                        <div style={{ marginTop: 24 }}>
                            <div className="invite-code-container" style={{
                                background: 'rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '8px 16px',
                                gap: 16,
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>{t('room.inviteCode')}</span>
                                    <span style={{ color: 'white', fontWeight: 600, letterSpacing: '1px', fontSize: 15, fontFamily: 'monospace' }}>{room.invite_code}</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(room.invite_code, t('room.codeCopied'), t('room.copyFailed'))}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', color: 'white',
                                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                                        padding: '6px 14px', fontSize: 13, fontWeight: 500,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                >
                                    <FiCopy size={14} /> {t('room.copy')}
                                </button>
                                <button
                                    onClick={() => setShowFullscreenCode(true)}
                                    title={t('room.fullscreenCode')}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', color: 'white',
                                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                                        padding: '6px 10px', fontSize: 13, fontWeight: 500,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                >
                                    <FiMaximize2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fullscreen Invite Code Overlay */}
                    <AnimatePresence>
                        {showFullscreenCode && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowFullscreenCode(false)}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: `linear-gradient(135deg, ${room.color_theme || '#1a1a2e'}, ${room.color_theme || '#1a1a2e'}dd, #0a0a14)`,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', userSelect: 'none'
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0.8, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.8, y: 20 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{ textAlign: 'center', color: 'white' }}
                                >
                                    <div style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 3, opacity: 0.6, marginBottom: 12 }}>
                                        {t('room.inviteCode')}
                                    </div>
                                    <div style={{ fontSize: 22, opacity: 0.8, marginBottom: 32, fontWeight: 400 }}>
                                        {room.name}
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(72px, 14vw, 180px)',
                                        fontWeight: 800,
                                        letterSpacing: 'clamp(12px, 3vw, 40px)',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                                        textShadow: '0 4px 30px rgba(0,0,0,0.4)',
                                        padding: '24px 48px',
                                        background: 'rgba(255,255,255,0.08)',
                                        borderRadius: 24,
                                        border: '2px solid rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(10px)',
                                        marginBottom: 40
                                    }}>
                                        {room.invite_code}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                                        <button
                                            onClick={() => copyToClipboard(room.invite_code, t('room.codeCopied'), t('room.copyFailed'))}
                                            style={{
                                                background: 'rgba(255,255,255,0.12)', color: 'white',
                                                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
                                                padding: '12px 28px', fontSize: 16, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                                        >
                                            <FiCopy size={18} /> {t('room.copy')}
                                        </button>
                                        <button
                                            onClick={() => setShowFullscreenCode(false)}
                                            style={{
                                                background: 'rgba(255,255,255,0.12)', color: 'white',
                                                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
                                                padding: '12px 28px', fontSize: 16, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                                        >
                                            <FiMinimize2 size={18} /> {t('room.exitFullscreen')}
                                        </button>
                                    </div>
                                    <p style={{ marginTop: 32, fontSize: 14, opacity: 0.4 }}>{t('room.clickToClose')}</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Tabs */}
                <div className="tabs">
                    {[
                        { key: 'content', icon: <FiFile style={{ marginRight: 6 }} />, label: t('room.content') },
                        { key: 'assignments', icon: <FiEdit style={{ marginRight: 6 }} />, label: t('room.assignments'), badge: !isTeacher && unsubmittedCount > 0 ? unsubmittedCount : null },
                        { key: 'announcements', icon: <FiMessageSquare style={{ marginRight: 6 }} />, label: t('room.announcements') },
                        ...(isTeacher ? [{ key: 'members', icon: <FiUsers style={{ marginRight: 6 }} />, label: t('room.members') }] : []),
                    ].map(tabItem => (
                        <button key={tabItem.key} className={`tab ${tab === tabItem.key ? 'active' : ''}`} onClick={() => setTab(tabItem.key)}>
                            {tabItem.icon}
                            {tabItem.label}
                            {tabItem.badge && (
                                <span style={{
                                    marginLeft: 6,
                                    minWidth: 8, height: 8, borderRadius: '50%',
                                    background: '#ef4444',
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                    boxShadow: '0 0 0 2px var(--bg-primary)'
                                }} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Tab */}
                {tab === 'content' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {isTeacher && (
                            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => { setUploadForm(p => ({ ...p, section: sections[0]?.id || '' })); setShowUpload(true); }}>
                                    <FiPaperclip style={{ marginRight: 6 }} /> {t('room.addContent')}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowSection(true)}>
                                    <FiFolderPlus style={{ marginRight: 6 }} /> {t('room.newSection')}
                                </button>
                            </div>
                        )}
                        {sections.length === 0 && unsectionedContent.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                                    <FiFile />
                                </div>
                                <h3>{t('room.noContent')}</h3>
                            </div>
                        ) : (
                            <>
                                {/* Unsectioned content (orphaned items without a section) */}
                                {unsectionedContent.length > 0 && (
                                    <div className="section-block">
                                        <div className="section-header">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FiBookOpen color="var(--brand)" /> {t('room.unsectioned') || 'Unsectioned'}
                                            </h3>
                                        </div>
                                        <div className="content-list">
                                            {unsectionedContent.map(item => (
                                                <div key={item.id} className="content-item">
                                                    <div className="item-icon" style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                                                        {TYPE_ICONS[item.content_type] || <FiPackage />}
                                                    </div>
                                                    <div className="item-info">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.content_type} · {new Date(item.created_at).toLocaleDateString()}{item.file_size_display ? ` · ${item.file_size_display}` : ''}</p>
                                                    </div>
                                                    <div className="item-actions" style={{ display: 'flex', gap: 4 }}>
                                                        {item.file && (
                                                            <>
                                                                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setPreviewFile({ url: item.file, filename: item.title + '.' + (item.file_extension || 'bin') })} title={t('room.preview')}>
                                                                    <FiEye />
                                                                </button>
                                                                <a href={getFileUrl(item.file)} className="btn btn-primary btn-sm btn-icon" download title={t('room.download')}><FiDownload /></a>
                                                            </>
                                                        )}
                                                        {item.link && <a href={item.link} className="btn btn-secondary btn-sm btn-icon" target="_blank" rel="noreferrer"><FiExternalLink /></a>}
                                                        {isTeacher && (
                                                            <>
                                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingContent({ id: item.id, title: item.title, description: item.description || '' })} title={t('room.edit')}>
                                                                    <FiEdit3 size={14} />
                                                                </button>
                                                                <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteContent(item.id)} title={t('room.delete')}>
                                                                    <FiTrash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Sections with nested content */}
                                {sections.map(sec => (
                                    <div key={sec.id} className="section-block">
                                        <div className="section-header">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FiFolder color="var(--brand)" /> {sec.title}
                                            </h3>
                                        </div>
                                        <div className="content-list">
                                            {sec.contents?.length === 0 ? (
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>{t('room.noContentInSection')}</p>
                                            ) : sec.contents?.map(item => (
                                                <div key={item.id} className="content-item">
                                                    <div className="item-icon" style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                                                        {TYPE_ICONS[item.content_type] || <FiPackage />}
                                                    </div>
                                                    {editingContent?.id === item.id ? (
                                                        /* Inline edit mode */
                                                        <div className="item-info" style={{ flex: 1 }}>
                                                            <input className="form-input" value={editingContent.title} onChange={e => setEditingContent(p => ({ ...p, title: e.target.value }))} style={{ marginBottom: 4, fontSize: 14, padding: '4px 8px' }} />
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                                                <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleSaveContent(item)} title={t('common.save')}><FiSave size={14} /></button>
                                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingContent(null)} title={t('common.cancel')}><FiX size={14} /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="item-info">
                                                                <h4>{item.title}</h4>
                                                                <p>{item.content_type} · {new Date(item.created_at).toLocaleDateString()}{item.file_size_display ? ` · ${item.file_size_display}` : ''}</p>
                                                            </div>
                                                            <div className="item-actions" style={{ display: 'flex', gap: 4 }}>
                                                                {item.file && (
                                                                    <>
                                                                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setPreviewFile({ url: item.file, filename: item.title + '.' + (item.file_extension || 'bin') })} title={t('room.preview')}>
                                                                            <FiEye />
                                                                        </button>
                                                                        <a href={getFileUrl(item.file)} className="btn btn-primary btn-sm btn-icon" download title={t('room.download')}><FiDownload /></a>
                                                                    </>
                                                                )}
                                                                {item.link && <a href={item.link} className="btn btn-secondary btn-sm btn-icon" target="_blank" rel="noreferrer"><FiExternalLink /></a>}
                                                                {isTeacher && (
                                                                    <>
                                                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingContent({ id: item.id, title: item.title, description: item.description || '' })} title={t('room.edit')}>
                                                                            <FiEdit3 size={14} />
                                                                        </button>
                                                                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteContent(item.id)} title={t('room.delete')}>
                                                                            <FiTrash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </motion.div>
                )}

                {/* Assignments Tab */}
                {tab === 'assignments' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {isTeacher && (
                            <div style={{ marginBottom: 16 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowAssignment(true)}>
                                    <FiPlus style={{ marginRight: 6 }} /> {t('room.newAssignment')}
                                </button>
                            </div>
                        )}
                        {assignments.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                                <select className="form-input" value={assignSort} onChange={e => setAssignSort(e.target.value)} style={{ width: 'auto', fontSize: 13, padding: '4px 10px' }}>
                                    <option value="newest">{t('room.sortNewest')}</option>
                                    <option value="oldest">{t('room.sortOldest')}</option>
                                    <option value="deadline_asc">{t('room.sortDeadlineAsc')}</option>
                                    <option value="deadline_desc">{t('room.sortDeadlineDesc')}</option>
                                </select>
                            </div>
                        )}
                        {(() => {
                            const sorted = [...assignments].sort((a, b) => {
                                if (assignSort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                                if (assignSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
                                if (assignSort === 'deadline_asc') return (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity);
                                if (assignSort === 'deadline_desc') return (b.deadline ? new Date(b.deadline) : -Infinity) - (a.deadline ? new Date(a.deadline) : -Infinity);
                                return 0;
                            });
                            return sorted.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                                        <FiEdit />
                                    </div>
                                    <h3>{t('room.noAssignments')}</h3>
                                </div>
                            ) : sorted.map(a => (
                                <div key={a.id} className="card" style={{ marginBottom: 12 }}>
                                    {editingAssignment?.id === a.id ? (
                                        /* Inline edit mode for assignment */
                                        <div>
                                            <div className="form-group" style={{ marginBottom: 8 }}>
                                                <input className="form-input" value={editingAssignment.title} onChange={e => setEditingAssignment(p => ({ ...p, title: e.target.value }))} placeholder={t('assignmentModal.titleLabel')} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 8 }}>
                                                <textarea className="form-input" rows="2" value={editingAssignment.description} onChange={e => setEditingAssignment(p => ({ ...p, description: e.target.value }))} placeholder={t('assignmentModal.description')} />
                                            </div>
                                            <div className="form-row" style={{ marginBottom: 8 }}>
                                                <div className="form-group"><input className="form-input" type="datetime-local" value={editingAssignment.deadline} onChange={e => setEditingAssignment(p => ({ ...p, deadline: e.target.value }))} /></div>
                                                <div className="form-group"><input className="form-input" type="number" min="1" value={editingAssignment.max_grade} onChange={e => setEditingAssignment(p => ({ ...p, max_grade: e.target.value }))} /></div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-primary btn-sm" onClick={handleSaveAssignment}><FiSave size={14} style={{ marginRight: 4 }} />{t('common.save')}</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingAssignment(null)}>{t('common.cancel')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <h4 style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</h4>
                                                        {isTeacher && (
                                                            <>
                                                                <button className="btn btn-ghost btn-sm btn-icon" style={{ padding: 2 }} onClick={() => setEditingAssignment({ id: a.id, title: a.title, description: a.description || '', deadline: a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '', max_grade: a.max_grade })} title={t('room.edit')}>
                                                                    <FiEdit3 size={14} />
                                                                </button>
                                                                <button className="btn btn-ghost btn-sm btn-icon" style={{ padding: 2, color: 'var(--danger)' }} onClick={() => handleDeleteAssignment(a.id)} title={t('room.delete')}>
                                                                    <FiTrash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {a.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{a.description}</p>}
                                                    {a.file && (
                                                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setPreviewFile({ url: a.file, filename: a.title + '.' + (a.file.split('.').pop() || 'bin') }); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                                                <FiEye size={12} /> {t('room.preview')}
                                                            </button>
                                                            <a href={getFileUrl(a.file)} download className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                                                <FiDownload size={12} /> {t('room.attachedFile')}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                {a.deadline && (
                                                    a.is_past_deadline
                                                        ? <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> {t('room.late')}</span>
                                                        : <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> {new Date(a.deadline).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                            {a.deadline && !a.is_past_deadline && <div style={{ marginTop: 12 }}><Countdown deadline={a.deadline} /></div>}

                                            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span className="badge badge-info">Max: {a.max_grade} pts</span>
                                                {isTeacher && (
                                                    <button className="badge badge-brand" onClick={() => handleToggleSubmissions(a.id)} style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <FiUsers size={12} /> {a.submissions_count || 0} {t('room.submissions')}
                                                    </button>
                                                )}
                                                {isTeacher && a.unsubmitted_count > 0 && (
                                                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <div style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }} />
                                                        {a.unsubmitted_count} {t('room.unsubmitted')}
                                                    </span>
                                                )}
                                                {a.my_submission && (
                                                    <span className={`badge ${a.my_submission.is_late ? 'badge-warning' : 'badge-success'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {a.my_submission.is_late ? <><FiClock /> {t('room.late')}</> : <><FiCheckCircle /> {t('room.submitted')}</>}
                                                    </span>
                                                )}
                                                {a.my_submission?.grade && (
                                                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <FiAward /> {a.my_submission.grade.score}/{a.max_grade}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Teacher: Expandable submissions list */}
                                            {isTeacher && expandedAssignment === a.id && (
                                                <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                                    <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUsers size={14} /> {t('room.allSubmissions')}</span>
                                                        {teacherSubmissions.length > 0 && (
                                                            <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={async () => {
                                                                try {
                                                                    const res = await exportAPI.assignmentGrades(a.id);
                                                                    const url = URL.createObjectURL(new Blob([res.data]));
                                                                    const link = document.createElement('a');
                                                                    link.href = url;
                                                                    link.download = `grades_${a.title}.csv`;
                                                                    link.click();
                                                                    URL.revokeObjectURL(url);
                                                                } catch { toast.error(t('room.actionFailed')); }
                                                            }}>
                                                                <FiDownload size={11} style={{ marginRight: 4 }} /> CSV
                                                            </button>
                                                        )}
                                                    </div>
                                                    {loadingSubs ? (
                                                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('common.loading')}</div>
                                                    ) : teacherSubmissions.length === 0 ? (
                                                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('room.noSubmissionsYet')}</div>
                                                    ) : teacherSubmissions.map(sub => (
                                                        <div key={sub.id} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                                                    <div className="avatar sm" style={{ width: 28, height: 28, fontSize: 11 }}>{(sub.student?.first_name?.[0] || '?').toUpperCase()}</div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600 }}>{sub.student?.full_name || sub.student?.username}</div>
                                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(sub.submitted_at).toLocaleString()}{sub.is_late ? ` · ${t('room.late')}` : ''}</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    {sub.grade ? (
                                                                        <span className="badge badge-success" style={{ fontSize: 12 }}>{sub.grade.score}/{a.max_grade}</span>
                                                                    ) : (
                                                                        <button className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: '3px 10px' }} onClick={() => { setGradingId(gradingId === sub.id ? null : sub.id); setGradeForm({ score: '', feedback: '' }); }}>
                                                                            <FiAward size={12} style={{ marginRight: 4 }} /> {t('room.grade')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Files */}
                                                            {sub.files && sub.files.length > 0 && (
                                                                <div style={{ marginTop: 8, paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                    {sub.files.map(f => (
                                                                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                            <a href={getFileUrl(f.file)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                                                                                <FiFileText size={12} /> {f.filename}
                                                                            </a>
                                                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPreviewFile({ url: f.file, filename: f.filename })} style={{ padding: 2 }}><FiEye size={12} /></button>
                                                                            <a href={getFileUrl(f.file)} download className="btn btn-ghost btn-sm btn-icon" style={{ padding: 2 }}><FiDownload size={12} /></a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* Grade form */}
                                                            {gradingId === sub.id && (
                                                                <div style={{ marginTop: 8, paddingLeft: 36, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                                                    <div className="form-group" style={{ marginBottom: 0, flex: '0 0 80px' }}>
                                                                        <label className="form-label" style={{ fontSize: 11 }}>{t('room.score')}</label>
                                                                        <input className="form-input" type="number" min="0" max={a.max_grade} placeholder={`/ ${a.max_grade}`} value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))} style={{ padding: '4px 8px', fontSize: 13 }} />
                                                                    </div>
                                                                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                                                        <label className="form-label" style={{ fontSize: 11 }}>{t('room.feedback')}</label>
                                                                        <input className="form-input" placeholder={t('room.feedbackPlaceholder')} value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} style={{ padding: '4px 8px', fontSize: 13 }} />
                                                                    </div>
                                                                    <button className="btn btn-primary btn-sm" onClick={() => handleGradeSubmission(sub.id)} style={{ marginBottom: 0 }}><FiCheck size={14} /></button>
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => setGradingId(null)} style={{ marginBottom: 0 }}><FiX size={14} /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Student: Submitted files with delete option */}
                                            {a.my_submission && a.my_submission.files && a.my_submission.files.length > 0 && (
                                                <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <h5 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{t('room.submittedFiles')}</h5>
                                                        {!a.is_past_deadline && !a.my_submission.grade && (
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteSubmission(a.my_submission.id)} style={{ color: 'var(--danger)', fontSize: 12, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <FiTrash2 size={12} /> {t('room.deleteAndResubmit')}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {a.my_submission.files.map(f => (
                                                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <a href={getFileUrl(f.file)} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                                                                    <FiFileText size={14} /> {f.filename}
                                                                </a>
                                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPreviewFile({ url: f.file, filename: f.filename })} title={t('room.preview')} style={{ padding: 2 }}>
                                                                    <FiEye size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!isTeacher && !a.my_submission && (
                                                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            <FiPaperclip /> {t('room.attachFiles')}
                                                            <input type="file" multiple hidden onChange={e => {
                                                                if (e.target.files.length) {
                                                                    setSelectedFiles(p => ({ ...p, [a.id]: [...(p[a.id] || []), ...Array.from(e.target.files)] }));
                                                                }
                                                            }} />
                                                        </label>

                                                        {selectedFiles[a.id] && selectedFiles[a.id].length > 0 && (
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                                                    {selectedFiles[a.id].map((f, i) => (
                                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 4, fontSize: 13 }}>
                                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><FiFile size={14} /> {f.name}</span>
                                                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedFiles(p => ({ ...p, [a.id]: p[a.id].filter((_, idx) => idx !== i) }))}>
                                                                                <FiX />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <button className="btn btn-primary btn-sm" disabled={submitting} onClick={() => handleMultiSubmit(a.id)}>
                                                                    {submitting ? t('room.sending') : `${t('room.submitAssignment')} (${selectedFiles[a.id].length})`}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        })()}
                    </motion.div>
                )}

                {/* Announcements Tab */}
                {tab === 'announcements' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {isTeacher && (
                            <div style={{ marginBottom: 16 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowAnnouncement(true)}>
                                    <FiMessageSquare style={{ marginRight: 6 }} /> {t('room.newAnnouncement')}
                                </button>
                            </div>
                        )}
                        {announcements.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                                    <FiMessageSquare />
                                </div>
                                <h3>{t('room.noAnnouncements')}</h3>
                            </div>
                        ) : announcements.map(a => (
                            <div key={a.id} className="announcement-item">
                                {editingAnnouncement?.id === a.id ? (
                                    /* Inline edit announcement */
                                    <div>
                                        <div className="form-group" style={{ marginBottom: 8 }}>
                                            <input className="form-input" value={editingAnnouncement.title} onChange={e => setEditingAnnouncement(p => ({ ...p, title: e.target.value }))} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 8 }}>
                                            <textarea className="form-input" rows="3" value={editingAnnouncement.body} onChange={e => setEditingAnnouncement(p => ({ ...p, body: e.target.value }))} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleSaveAnnouncement}><FiSave size={14} style={{ marginRight: 4 }} />{t('common.save')}</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingAnnouncement(null)}>{t('common.cancel')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="announcement-header">
                                            <div className="avatar sm">{(a.author?.first_name?.[0] || '?').toUpperCase()}</div>
                                            <div className="meta">
                                                <div className="name">{a.author?.full_name || a.author?.username}</div>
                                                <div className="time">{timeAgo(a.created_at)}</div>
                                            </div>
                                            {a.is_pinned && <span className="badge badge-brand" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={12} /> {t('room.pinned')}</span>}
                                            {isTeacher && (
                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={async () => {
                                                        try {
                                                            await announcementsAPI.update(a.id, { is_pinned: !a.is_pinned });
                                                            toast.success(a.is_pinned ? t('room.unpinned') : t('room.pinnedSuccess'));
                                                            loadAll();
                                                        } catch { toast.error(t('room.actionFailed')); }
                                                    }} title={a.is_pinned ? t('room.unpin') : t('room.pin')} style={{ color: a.is_pinned ? 'var(--brand)' : 'var(--text-muted)' }}>
                                                        <FiMapPin size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingAnnouncement({ id: a.id, title: a.title, body: a.body })} title={t('room.edit')}>
                                                        <FiEdit3 size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteAnnouncement(a.id)} title={t('room.delete')}>
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</h4>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.body}</p>
                                        <button
                                            onClick={() => handleToggleComments(a.id)}
                                            style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <FiMessageCircle /> {a.comment_count || 0} {t('room.comments')}
                                        </button>
                                        {expandedAnnouncement === a.id && (
                                            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                                {loadingComments ? (
                                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('common.loading')}</p>
                                                ) : comments.length === 0 ? (
                                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('room.noComments')}</p>
                                                ) : comments.map(c => (
                                                    <div key={c.id} style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                        <div className="avatar sm" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>{(c.author?.first_name?.[0] || '?').toUpperCase()}</div>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{c.author?.full_name || c.author?.username} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {timeAgo(c.created_at)}</span></div>
                                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.body}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                    <input className="form-input" style={{ fontSize: 13, padding: '6px 10px' }} placeholder={t('room.writeComment')} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handlePostComment(a.id); }} />
                                                    <button className="btn btn-primary btn-sm" onClick={() => handlePostComment(a.id)}>{t('room.postComment')}</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Members Tab (Teacher Only) */}
                {tab === 'members' && isTeacher && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{t('room.members')} ({members.members?.length || 0})</h3>
                        {members.pending?.length > 0 && (
                            <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warning)', borderWidth: 1, borderStyle: 'solid' }}>
                                <h4 style={{ marginBottom: 16, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FiClock /> {t('room.pendingRequests')} ({members.pending.length})
                                </h4>
                                {members.pending.map(m => (
                                    <div key={m.id} className="member-item">
                                        <div className="avatar sm">{(m.student?.first_name?.[0] || '?').toUpperCase()}</div>
                                        <div className="member-info">
                                            <div className="name">{m.student?.full_name}</div>
                                            <div className="email">{m.student?.email}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleMemberAction(m.id, 'approve')} title={t('room.approve')}>
                                                <FiCheck />
                                            </button>
                                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleMemberAction(m.id, 'remove')} title={t('room.reject')}>
                                                <FiX />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {selectedMembers.length > 0 && (
                                <div style={{ padding: '12px 16px', background: 'var(--brand-bg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{selectedMembers.length} {t('room.selectedStudents')}</span>
                                    <button className="btn btn-danger btn-sm" onClick={handleBulkRemove}>
                                        <FiTrash2 style={{ marginRight: 6 }} /> {t('room.expelSelected')}
                                    </button>
                                </div>
                            )}
                            {members.members?.map((m, idx) => (
                                <div key={m.id} className={`member-item ${selectedMembers.includes(m.id) ? 'selected' : ''}`} style={{ borderBottom: idx === members.members.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(m.id)}
                                        onChange={() => {
                                            setSelectedMembers(p => p.includes(m.id) ? p.filter(mid => mid !== m.id) : [...p, m.id]);
                                        }}
                                        style={{ marginRight: 12, cursor: 'pointer', accentColor: 'var(--brand)' }}
                                    />
                                    <div className="avatar sm">{(m.student?.first_name?.[0] || '?').toUpperCase()}</div>
                                    <div className="member-info">
                                        <div className="name">{m.student?.full_name || m.student?.username}</div>
                                        <div className="email">{m.student?.email}</div>
                                    </div>
                                </div>
                            ))}
                            {members.members?.length === 0 && (
                                <div className="empty-state" style={{ padding: '40px 20px' }}>
                                    <div className="icon" style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 12 }}>
                                        <FiUsers />
                                    </div>
                                    <h3>{t('room.noMembers')}</h3>
                                    <p>{t('room.shareTip')}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* === MODALS === */}

                {/* File Preview Modal */}
                {previewFile && <FilePreviewModal url={previewFile.url} filename={previewFile.filename} onClose={() => setPreviewFile(null)} />}

                {/* Upload Content Modal */}
                {showUpload && (
                    <div className="modal-overlay" onClick={() => setShowUpload(false)} role="dialog" aria-modal="true" aria-label="Upload content">
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('upload.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowUpload(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleUpload}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">{t('upload.titleLabel')} *</label>
                                        <input className="form-input" value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">{t('upload.type')}</label>
                                            <select className="form-input" value={uploadForm.content_type} onChange={e => setUploadForm(p => ({ ...p, content_type: e.target.value }))}>
                                                <option value="lecture">{t('upload.lecture')}</option><option value="tp">{t('upload.tp')}</option><option value="exam">{t('upload.exam')}</option><option value="resource">{t('upload.resource')}</option><option value="link">{t('upload.link')}</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('upload.section')}</label>
                                            <select className="form-input" value={uploadForm.section} onChange={e => setUploadForm(p => ({ ...p, section: e.target.value }))}>
                                                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {/* TP auto-assignment hint */}
                                    {uploadForm.content_type === 'tp' && (
                                        <div style={{ background: 'var(--brand-bg)', color: 'var(--brand)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiEdit size={16} /> {t('room.tpAutoHint')}
                                        </div>
                                    )}
                                    {uploadForm.content_type === 'link' ? (
                                        <div className="form-group">
                                            <label className="form-label">{t('upload.url')}</label>
                                            <input className="form-input" type="url" placeholder="https://..." value={uploadForm.link} onChange={e => setUploadForm(p => ({ ...p, link: e.target.value }))} />
                                        </div>
                                    ) : (
                                        <div className="form-group">
                                            <label className="form-label">{t('upload.file')}</label>
                                            <div className="file-drop" onClick={() => document.getElementById('file-input').click()} onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }} onDragLeave={e => e.currentTarget.classList.remove('dragover')} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); if (e.dataTransfer.files[0]) setUploadForm(p => ({ ...p, file: e.dataTransfer.files[0] })); }}>
                                                <div className="icon" style={{ fontSize: 32, marginBottom: 8, color: 'var(--brand)' }}>
                                                    <FiPaperclip />
                                                </div>
                                                <p style={{ fontWeight: 600 }}>{uploadForm.file ? uploadForm.file.name : t('upload.dropHint')}</p>
                                                <div className="hint">{t('upload.maxSize')}</div>
                                            </div>
                                            <input id="file-input" type="file" hidden onChange={e => e.target.files[0] && setUploadForm(p => ({ ...p, file: e.target.files[0] }))} />
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('upload.adding') : t('upload.add')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* New Assignment Modal */}
                {showAssignment && (
                    <div className="modal-overlay" onClick={() => setShowAssignment(false)} role="dialog" aria-modal="true" aria-label="New assignment">
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('assignmentModal.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowAssignment(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleNewAssignment}>
                                <div className="modal-body">
                                    <div className="form-group"><label className="form-label">{t('assignmentModal.titleLabel')} *</label><input className="form-input" value={assignForm.title} onChange={e => setAssignForm(p => ({ ...p, title: e.target.value }))} required autoFocus /></div>
                                    <div className="form-group"><label className="form-label">{t('assignmentModal.description')}</label><textarea className="form-input" rows="3" value={assignForm.description} onChange={e => setAssignForm(p => ({ ...p, description: e.target.value }))} /></div>
                                    <div className="form-row">
                                        <div className="form-group"><label className="form-label">{t('assignmentModal.deadline')}</label><input className="form-input" type="datetime-local" value={assignForm.deadline} onChange={e => setAssignForm(p => ({ ...p, deadline: e.target.value }))} /></div>
                                        <div className="form-group"><label className="form-label">{t('assignmentModal.maxGrade')}</label><input className="form-input" type="number" min="1" value={assignForm.max_grade} onChange={e => setAssignForm(p => ({ ...p, max_grade: e.target.value }))} /></div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('assignmentModal.attachFile')}</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <FiPaperclip /> {assignForm.file ? assignForm.file.name : t('upload.dropHint')}
                                                <input type="file" hidden onChange={e => e.target.files[0] && setAssignForm(p => ({ ...p, file: e.target.files[0] }))} />
                                            </label>
                                            {assignForm.file && (
                                                <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setAssignForm(p => ({ ...p, file: null }))}>
                                                    <FiX size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAssignment(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('assignmentModal.creating') : t('assignmentModal.create')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* New Announcement Modal */}
                {showAnnouncement && (
                    <div className="modal-overlay" onClick={() => setShowAnnouncement(false)} role="dialog" aria-modal="true" aria-label="New announcement">
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('announceModal.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowAnnouncement(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleNewAnnouncement}>
                                <div className="modal-body">
                                    <div className="form-group"><label className="form-label">{t('announceModal.titleLabel')} *</label><input className="form-input" value={announceForm.title} onChange={e => setAnnounceForm(p => ({ ...p, title: e.target.value }))} required autoFocus /></div>
                                    <div className="form-group"><label className="form-label">{t('announceModal.message')} *</label><textarea className="form-input" rows="4" value={announceForm.body} onChange={e => setAnnounceForm(p => ({ ...p, body: e.target.value }))} required /></div>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={announceForm.is_pinned} onChange={e => setAnnounceForm(p => ({ ...p, is_pinned: e.target.checked }))} style={{ accentColor: 'var(--brand)' }} />
                                            <FiMapPin size={14} /> {t('room.pinAnnouncement')}
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAnnouncement(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('announceModal.publishing') : t('announceModal.publish')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Add Section Modal */}
                {showSection && (
                    <div className="modal-overlay" onClick={() => setShowSection(false)} role="dialog" aria-modal="true" aria-label="Add section">
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('sectionModal.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowSection(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleNewSection}>
                                <div className="modal-body">
                                    <div className="form-group"><label className="form-label">{t('sectionModal.nameLabel')} *</label><input className="form-input" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder={t('sectionModal.namePlaceholder')} required autoFocus /></div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowSection(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('sectionModal.add')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Room Settings Modal */}
                {showRoomSettings && (
                    <div className="modal-overlay" onClick={() => setShowRoomSettings(false)} role="dialog" aria-modal="true" aria-label="Room settings">
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('room.roomSettings')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowRoomSettings(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleSaveRoom}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">{t('room.nameLabel')} *</label>
                                        <input className="form-input" value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('room.subjectLabel')}</label>
                                        <input className="form-input" value={roomForm.subject} onChange={e => setRoomForm(p => ({ ...p, subject: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('room.descriptionLabel')}</label>
                                        <textarea className="form-input" rows="3" value={roomForm.description} onChange={e => setRoomForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('room.colorLabel')}</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {['#3A4B54', '#5C504A', '#485E5A', '#605068', '#4A5468', '#684A4A', '#52584C', '#4A5F68', '#68554A', '#2D2D2D'].map(c => (
                                                <button type="button" key={c} onClick={() => setRoomForm(p => ({ ...p, color_theme: c }))} style={{
                                                    width: 32, height: 32, borderRadius: '50%', background: c, border: roomForm.color_theme === c ? '3px solid var(--brand)' : '2px solid var(--border)',
                                                    cursor: 'pointer', transition: 'transform 0.15s', transform: roomForm.color_theme === c ? 'scale(1.2)' : 'scale(1)',
                                                    boxShadow: roomForm.color_theme === c ? '0 0 0 2px var(--bg-primary)' : 'none',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }} aria-label={`Color ${c}`}>
                                                    {roomForm.color_theme === c && <FiCheck size={14} style={{ color: 'white' }} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowRoomSettings(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('common.saving') : t('common.save')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
