import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  roomsAPI, sectionsAPI, assignmentsAPI, announcementsAPI,
} from '../api/client';
import {
  ArrowLeft, Users, FileText, ClipboardList, Megaphone,
  ChevronRight, Clock, AlertCircle, Pin, Download,
  ExternalLink, Loader2, Settings, UserPlus, Copy, Check,
  Plus, LogOut,
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

type Tab = 'content' | 'assignments' | 'announcements';

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTeacher, user } = useAuth();
  const roomId = Number(id);

  const [room, setRoom] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<Tab>('content');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
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
      } catch {
        navigate('/home', { replace: true });
      }
      setLoading(false);
    };
    fetchAll();
  }, [roomId, navigate]);

  const copyCode = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this room?')) return;
    try {
      await roomsAPI.leave(roomId);
      navigate('/home', { replace: true });
    } catch { /* ignore */ }
  };

  const openFile = (url: string) => {
    window.open(url, '_blank');
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
    if (!deadline) return 'No deadline';
    const d = new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (diff < 0) return 'Past due';
    if (hours < 1) return 'Due soon';
    if (hours < 24) return `${hours}h left`;
    if (days < 7) return `${days}d left`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'assignments', label: 'Tasks', icon: ClipboardList, count: assignments.length },
    { key: 'announcements', label: 'News', icon: Megaphone, count: announcements.length },
  ];

  return (
    <div className="page-container no-padding">
      {/* Room Header */}
      <div className="room-header" style={{ backgroundColor: room.color_theme }}>
        <div className="room-header-overlay" />
        <div className="room-header-content">
          <div className="room-header-nav">
            <button className="icon-btn-ghost" onClick={() => navigate(-1)}>
              <ArrowLeft size={22} />
            </button>
            <div className="room-header-actions">
              {isTeacher && (
                <button className="icon-btn-ghost" onClick={() => setShowInfo(!showInfo)}>
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
          <h1 className="room-header-title">{room.name}</h1>
          {room.subject && <p className="room-header-subject">{room.subject}</p>}
          <div className="room-header-stats">
            <div className="room-stat">
              <Users size={14} />
              <span>{room.student_count} students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="room-info-panel">
          <div className="invite-code-row">
            <span className="invite-label">Invite Code</span>
            <button className="invite-code-btn" onClick={copyCode}>
              <span className="invite-code">{room.invite_code}</span>
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </button>
          </div>
          {room.description && (
            <p className="room-description">{room.description}</p>
          )}
          {!isTeacher && (
            <button className="btn-danger-outline btn-sm" onClick={handleLeave}>
              <LogOut size={16} />
              Leave Room
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
        {tab === 'content' && (
          <div className="content-sections">
            {sections.length === 0 ? (
              <div className="empty-state-sm">
                <FileText size={32} strokeWidth={1} className="text-tertiary" />
                <p>No content yet</p>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="content-section">
                  <h3 className="section-title">{section.title}</h3>
                  {section.contents.length === 0 ? (
                    <p className="empty-hint">No items in this section</p>
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
                              openFile(item.file);
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

        {tab === 'assignments' && (
          <div className="assignments-list">
            {assignments.length === 0 ? (
              <div className="empty-state-sm">
                <ClipboardList size={32} strokeWidth={1} className="text-tertiary" />
                <p>No assignments yet</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  className="assignment-card"
                  onClick={() => navigate(`/room/${roomId}/assignment/${assignment.id}`)}
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
                        : '✓ Submitted'}
                    </div>
                  )}
                  {isTeacher && (
                    <div className="assignment-stats">
                      <span>{assignment.submissions_count} submitted</span>
                      <span>·</span>
                      <span>{assignment.graded_count} graded</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'announcements' && (
          <div className="announcements-list">
            {announcements.length === 0 ? (
              <div className="empty-state-sm">
                <Megaphone size={32} strokeWidth={1} className="text-tertiary" />
                <p>No announcements yet</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="announcement-card">
                  <div className="announcement-header">
                    {ann.is_pinned && <Pin size={14} className="text-gold" />}
                    <span className="announcement-author">{ann.author.full_name}</span>
                    <span className="announcement-time">
                      {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="announcement-title">{ann.title}</h4>
                  <p className="announcement-body">{ann.body}</p>
                  {ann.comment_count > 0 && (
                    <span className="announcement-comments">
                      {ann.comment_count} comment{ann.comment_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
