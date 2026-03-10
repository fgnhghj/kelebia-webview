import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  roomsAPI, sectionsAPI, contentAPI, assignmentsAPI, announcementsAPI, commentsAPI,
} from '../api/client';
import {
  ArrowLeft, Users, FileText, ClipboardList, Megaphone,
  ChevronRight, ChevronDown, ChevronUp, Clock, Pin, Download,
  ExternalLink, Loader2, Settings, Copy, Check,
  Plus, LogOut, Send, MessageSquare, X, BookOpen, Link2, Paperclip, Edit3,
} from 'lucide-react';

interface Section {
  id: number;
  title: string;
  order: number;
  contents: Content[];
}

interface Content {
  id: number;
  title: string;
  description: string;
  content_type: string;
  file: string | null;
  link: string;
  is_pinned: boolean;
  file_extension: string | null;
  file_size_display: string | null;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  max_grade: number;
  is_past_deadline: boolean;
  my_submission: any;
  submissions_count: number;
  graded_count: number;
  file: string | null;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  author: { full_name: string };
  is_pinned: boolean;
  comment_count: number;
  created_at: string;
}

interface Comment {
  id: number;
  author: { full_name: string };
  body: string;
  created_at: string;
}

type Tab = 'content' | 'assignments' | 'announcements';

/* ─── Small reusable modal ──────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher } = useAuth();
  const { t } = useLanguage();
  const roomId = Number(id);

  const [room, setRoom] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<Tab>((location.state as any)?.tab || 'content');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Teacher modals
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add section form
  const [sectionTitle, setSectionTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // Add content form
  const [contentForm, setContentForm] = useState({
    title: '', description: '', content_type: 'lecture', link: '',
  });
  const [contentFile, setContentFile] = useState<File | null>(null);

  // Add assignment form
  const [assignForm, setAssignForm] = useState({
    title: '', description: '', deadline: '', max_grade: '20',
  });
  const [assignFile, setAssignFile] = useState<File | null>(null);

  // Add announcement form
  const [annForm, setAnnForm] = useState({ title: '', body: '' });

  // Comments
  const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({});
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const fetchAll = async (isBackground = false) => {
    try {
      const [roomData, sectionData, assignmentData, announcementData] = await Promise.all([
        roomsAPI.get(roomId),
        sectionsAPI.list(roomId),
        assignmentsAPI.list(roomId),
        announcementsAPI.list(roomId),
      ]);
      setRoom(roomData);
      setSections(sectionData);
      setAssignments(assignmentData);
      setAnnouncements(announcementData);
      if (!isBackground && sectionData.length > 0) setSelectedSectionId(sectionData[0].id);
    } catch {
      if (!isBackground) navigate('/home', { replace: true });
    }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // Auto-refresh room data every 8s
    const interval = setInterval(() => fetchAll(true), 8000);
    return () => clearInterval(interval);
  }, [roomId, navigate]);

  const copyCode = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (!confirm(t('leave_confirm'))) return;
    try {
      await roomsAPI.leave(roomId);
      navigate('/home', { replace: true });
    } catch { /* ignore */ }
  };

  const openFile = (url: string, title?: string, ext?: string | null) => {
    const params = new URLSearchParams({ url, title: title || 'File' });
    if (ext) params.set('ext', ext);
    navigate(`/file-view?${params.toString()}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return '📖';
      case 'tp': return '🔬';
      case 'exam': return '📝';
      case 'link': return '🔗';
      default: return '📄';
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return t('no_deadline');
    const d = new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (diff < 0) return t('past_due');
    if (hours < 1) return t('due_soon');
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  /* ─── Teacher: add section ── */
  const handleAddSection = async () => {
    if (!sectionTitle.trim()) return;
    setSaving(true);
    try {
      const created = await sectionsAPI.create({ room: roomId, title: sectionTitle, order: sections.length });
      setSections(prev => [...prev, { ...created, contents: [] }]);
      setSelectedSectionId(created.id);
      setSectionTitle('');
      setShowAddSection(false);
    } catch { alert('Failed to create section'); }
    setSaving(false);
  };

  /* ─── Teacher: add content ── */
  const handleAddContent = async () => {
    if (!contentForm.title.trim() || !selectedSectionId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('room', String(roomId));
      fd.append('section', String(selectedSectionId));
      fd.append('title', contentForm.title);
      fd.append('description', contentForm.description);
      fd.append('content_type', contentForm.content_type);
      if (contentForm.content_type === 'link') {
        fd.append('link', contentForm.link);
      } else if (contentFile) {
        fd.append('file', contentFile);
      }
      const created = await contentAPI.create(fd);
      setSections(prev => prev.map(s =>
        s.id === selectedSectionId ? { ...s, contents: [...s.contents, created] } : s
      ));
      setContentForm({ title: '', description: '', content_type: 'lecture', link: '' });
      setContentFile(null);
      setShowAddContent(false);
    } catch { alert('Failed to add content'); }
    setSaving(false);
  };

  /* ─── Teacher: add assignment ── */
  const handleAddAssignment = async () => {
    if (!assignForm.title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('room', String(roomId));
      fd.append('title', assignForm.title);
      fd.append('description', assignForm.description);
      fd.append('max_grade', assignForm.max_grade);
      if (assignForm.deadline) fd.append('deadline', new Date(assignForm.deadline).toISOString());
      if (assignFile) fd.append('file', assignFile);
      const created = await assignmentsAPI.create(fd);
      setAssignments(prev => [...prev, created]);
      setAssignForm({ title: '', description: '', deadline: '', max_grade: '20' });
      setAssignFile(null);
      setShowAddAssignment(false);
    } catch { alert('Failed to create assignment'); }
    setSaving(false);
  };

  /* ─── Teacher: add announcement ── */
  const handleAddAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.body.trim()) return;
    setSaving(true);
    try {
      const created = await announcementsAPI.create({ room: roomId, ...annForm });
      setAnnouncements(prev => [created, ...prev]);
      setAnnForm({ title: '', body: '' });
      setShowAddAnnouncement(false);
    } catch { alert('Failed to post announcement'); }
    setSaving(false);
  };

  /* ─── Comments ── */
  const toggleComments = async (annId: number) => {
    if (openComments === annId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(annId);
    if (commentsMap[annId]) return;
    setLoadingComments(true);
    try {
      const data = await commentsAPI.list(annId);
      setCommentsMap(prev => ({ ...prev, [annId]: data }));
    } catch { /* ignore */ }
    setLoadingComments(false);
  };

  const handlePostComment = async (annId: number) => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const created = await commentsAPI.create({ announcement: annId, body: commentText });
      setCommentsMap(prev => ({ ...prev, [annId]: [...(prev[annId] || []), created] }));
      setAnnouncements(prev => prev.map(a =>
        a.id === annId ? { ...a, comment_count: a.comment_count + 1 } : a
      ));
      setCommentText('');
    } catch { /* ignore */ }
    setPostingComment(false);
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!room) return null;

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'content', label: t('content'), icon: FileText },
    { key: 'assignments', label: t('tasks'), icon: ClipboardList, count: assignments.length },
    { key: 'announcements', label: t('news'), icon: Megaphone, count: announcements.length },
  ];

  return (
    <div className="page-container no-padding">
      {/* Room Header */}
      <div className="room-header" style={{ backgroundColor: room.color_theme }}>
        <div className="room-header-overlay" />
        <div className="room-header-content">
          <div className="room-header-nav">
            <button className="icon-btn-ghost" onClick={() => navigate('/home')}>
              <ArrowLeft size={22} />
            </button>
            <div className="room-header-actions">
              {isTeacher ? (
                <button className="room-code-btn" onClick={copyCode}>
                  <span className="room-code-text">{room.invite_code}</span>
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              ) : (
                <button className="icon-btn-ghost leave-btn" onClick={handleLeave}>
                  <LogOut size={18} />
                </button>
              )}
              <button className="icon-btn-ghost" onClick={() => setShowInfo(!showInfo)}>
                <Settings size={20} />
              </button>
            </div>
          </div>
          <h1 className="room-header-title">{room.name}</h1>
          {room.subject && <p className="room-header-subject">{room.subject}</p>}
          <div className="room-header-stats">
            <div className="room-stat">
              <Users size={14} />
              <span>{room.student_count} {t('students')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="room-info-panel">
          <div className="invite-code-row">
            <span className="invite-label">{t('invite_code')}</span>
            <button className="invite-code-btn" onClick={copyCode}>
              <span className="invite-code">{room.invite_code}</span>
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </button>
          </div>
          {room.description && <p className="room-description">{room.description}</p>}
          {!isTeacher && (
            <button className="btn-danger-outline btn-sm" onClick={handleLeave}>
              <LogOut size={16} />
              {t('leave_room')}
            </button>
          )}
        </div>
      )}

      {/* Tab Bar */}
      <div className="tab-bar">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            className={`tab-item ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <span className="tab-badge">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="room-content">

        {/* ── CONTENT TAB ── */}
        {tab === 'content' && (
          <div className="content-sections">
            {isTeacher && (
              <div className="teacher-actions-row">
                <button className="fab-inline" onClick={() => setShowAddSection(true)}>
                  <BookOpen size={15} /> {t('add_section')}
                </button>
                {sections.length > 0 && (
                  <button className="fab-inline" onClick={() => setShowAddContent(true)}>
                    <Plus size={15} /> {t('add_content')}
                  </button>
                )}
              </div>
            )}
            {sections.length === 0 ? (
              <div className="empty-state-sm">
                <FileText size={32} strokeWidth={1} className="text-tertiary" />
                <p>{t('no_content')}</p>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="content-section">
                  <h3 className="section-title">{section.title}</h3>
                  {section.contents.length === 0 ? (
                    <p className="empty-hint">{isTeacher ? t('add_content') : t('no_content')}</p>
                  ) : (
                    <div className="content-items">
                      {section.contents.map((item) => (
                        <button
                          key={item.id}
                          className="content-item"
                          onClick={() => {
                            if (item.content_type === 'link' && item.link) {
                              window.open(item.link, '_blank');
                            } else if (item.file) {
                              openFile(item.file, item.title, item.file_extension);
                            }
                          }}
                        >
                          <span className="content-type-emoji">{getTypeIcon(item.content_type)}</span>
                          <div className="content-item-info">
                            <span className="content-item-title">{item.title}</span>
                            <span className="content-item-meta">
                              {item.file_extension?.toUpperCase()}
                              {item.file_size_display && ` · ${item.file_size_display}`}
                            </span>
                          </div>
                          {item.is_pinned && <Pin size={14} className="text-gold" />}
                          {item.content_type === 'link' ? (
                            <ExternalLink size={16} className="text-tertiary" />
                          ) : (
                            <Download size={16} className="text-tertiary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB ── */}
        {tab === 'assignments' && (
          <div className="assignments-list">
            {isTeacher && (
              <div className="teacher-actions-row">
                <button className="fab-inline" onClick={() => setShowAddAssignment(true)}>
                  <Plus size={15} /> {t('add_assignment')}
                </button>
              </div>
            )}
            {assignments.length === 0 ? (
              <div className="empty-state-sm">
                <ClipboardList size={32} strokeWidth={1} className="text-tertiary" />
                <p>{t('no_assignments')}</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  className="assignment-card"
                  onClick={() => navigate(`/room/${roomId}/assignment/${assignment.id}`, { state: { tab: 'assignments' } })}
                >
                  <div className="assignment-card-top">
                    <h4 className="assignment-title">{assignment.title}</h4>
                    <ChevronRight size={18} className="text-tertiary" />
                  </div>
                  <div className="assignment-meta">
                    <div className={`deadline-badge ${assignment.is_past_deadline ? 'overdue' : ''}`}>
                      <Clock size={13} />
                      <span>{formatDeadline(assignment.deadline)}</span>
                    </div>
                    <span className="assignment-grade">/{assignment.max_grade}</span>
                  </div>
                  {!isTeacher && assignment.my_submission && (
                    <div className={`submission-status ${assignment.my_submission.status}`}>
                      {assignment.my_submission.status === 'graded'
                        ? `✓ ${assignment.my_submission.grade?.score}/${assignment.max_grade}`
                        : `✓ ${t('submitted')}`}
                    </div>
                  )}
                  {isTeacher && (
                    <div className="assignment-stats">
                      <span>{assignment.submissions_count} {t('submitted')}</span>
                      <span>·</span>
                      <span>{assignment.graded_count} {t('graded')}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ── */}
        {tab === 'announcements' && (
          <div className="announcements-list">
            {isTeacher && (
              <div className="teacher-actions-row">
                <button className="fab-inline" onClick={() => setShowAddAnnouncement(true)}>
                  <Edit3 size={15} /> {t('add_announcement')}
                </button>
              </div>
            )}
            {announcements.length === 0 ? (
              <div className="empty-state-sm">
                <Megaphone size={32} strokeWidth={1} className="text-tertiary" />
                <p>{t('no_announcements')}</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="announcement-card">
                  <div className="announcement-header">
                    {ann.is_pinned && <Pin size={14} className="text-gold" />}
                    <span className="announcement-author">{ann.author.full_name}</span>
                    <span className="announcement-time">
                      {new Date(ann.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="announcement-title">{ann.title}</h4>
                  <p className="announcement-body">{ann.body}</p>

                  {/* Comments toggle */}
                  <button
                    className="comments-toggle-btn"
                    onClick={() => toggleComments(ann.id)}
                  >
                    <MessageSquare size={15} />
                    <span>{ann.comment_count} {t('comments')}</span>
                    {openComments === ann.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {openComments === ann.id && (
                    <div className="comments-section">
                      {loadingComments && !commentsMap[ann.id] ? (
                        <Loader2 size={18} className="animate-spin text-accent mx-auto my-2" />
                      ) : (
                        <>
                          {(commentsMap[ann.id] || []).length === 0 ? (
                            <p className="empty-hint">{t('no_comments')}</p>
                          ) : (
                            (commentsMap[ann.id] || []).map((c) => (
                              <div key={c.id} className="comment-item">
                                <span className="comment-author">{c.author.full_name}</span>
                                <p className="comment-body">{c.body}</p>
                              </div>
                            ))
                          )}
                          <div className="comment-input-row">
                            <input
                              type="text"
                              className="comment-input"
                              placeholder={t('add_comment')}
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(ann.id); }}
                            />
                            <button
                              className="comment-send-btn"
                              onClick={() => handlePostComment(ann.id)}
                              disabled={postingComment || !commentText.trim()}
                            >
                              {postingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ══ TEACHER MODALS ══ */}

      {/* Add Section Modal */}
      {showAddSection && (
        <Modal title={t('add_section')} onClose={() => setShowAddSection(false)}>
          <div className="modal-body">
            <div className="input-group">
              <label>{t('section_name')}</label>
              <div className="input-wrapper">
                <BookOpen size={18} />
                <input
                  type="text"
                  placeholder={t('section_name')}
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={handleAddSection} disabled={saving || !sectionTitle.trim()}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : t('save')}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Content Modal */}
      {showAddContent && (
        <Modal title={t('add_content')} onClose={() => setShowAddContent(false)}>
          <div className="modal-body">
            <div className="input-group">
              <label>{t('title')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={t('title')}
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Section</label>
              <select
                className="input-wrapper select-native"
                value={selectedSectionId ?? ''}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
              >
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>{t('content_type')}</label>
              <select
                className="input-wrapper select-native"
                value={contentForm.content_type}
                onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
              >
                <option value="lecture">📖 Lecture</option>
                <option value="tp">🔬 TP / Lab</option>
                <option value="exam">📝 Exam</option>
                <option value="link">🔗 Link</option>
                <option value="other">📄 Other</option>
              </select>
            </div>
            {contentForm.content_type === 'link' ? (
              <div className="input-group">
                <label>{t('link')}</label>
                <div className="input-wrapper">
                  <Link2 size={18} />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={contentForm.link}
                    onChange={(e) => setContentForm({ ...contentForm, link: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="input-group">
                <label>{t('file')} ({t('optional')})</label>
                <label className="file-upload-btn">
                  <Paperclip size={16} />
                  {contentFile ? contentFile.name : 'Choisir un fichier'}
                  <input type="file" className="hidden" onChange={(e) => setContentFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
            <div className="input-group">
              <label>{t('description')} ({t('optional')})</label>
              <div className="input-wrapper">
                <textarea
                  rows={2}
                  placeholder={t('description')}
                  value={contentForm.description}
                  onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={handleAddContent} disabled={saving || !contentForm.title.trim()}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : t('save')}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <Modal title={t('add_assignment')} onClose={() => setShowAddAssignment(false)}>
          <div className="modal-body">
            <div className="input-group">
              <label>{t('title')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={t('title')}
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>{t('description')}</label>
              <div className="input-wrapper">
                <textarea
                  rows={3}
                  placeholder={t('description')}
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>{t('deadline')} ({t('optional')})</label>
              <div className="input-wrapper">
                <input
                  type="datetime-local"
                  value={assignForm.deadline}
                  onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>{t('max_score')}</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  min="1"
                  placeholder="20"
                  value={assignForm.max_grade}
                  onChange={(e) => setAssignForm({ ...assignForm, max_grade: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>{t('file')} ({t('optional')})</label>
              <label className="file-upload-btn">
                <Paperclip size={16} />
                {assignFile ? assignFile.name : 'Pièce jointe...'}
                <input type="file" className="hidden" onChange={(e) => setAssignFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button className="btn-primary" onClick={handleAddAssignment} disabled={saving || !assignForm.title.trim()}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : t('save')}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnouncement && (
        <Modal title={t('add_announcement')} onClose={() => setShowAddAnnouncement(false)}>
          <div className="modal-body">
            <div className="input-group">
              <label>{t('title')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={t('title')}
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Message</label>
              <div className="input-wrapper">
                <textarea
                  rows={4}
                  placeholder="Écrivez votre annonce..."
                  value={annForm.body}
                  onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
                />
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleAddAnnouncement}
              disabled={saving || !annForm.title.trim() || !annForm.body.trim()}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : t('post')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
