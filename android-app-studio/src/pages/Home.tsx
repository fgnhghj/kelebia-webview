import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { roomsAPI, getMediaUrl } from "../api/client";
import PullToRefresh from "../components/PullToRefresh";
import {
  Plus,
  Users,
  BookOpen,
  Clock,
  ChevronRight,
  RefreshCw,
  Loader2,
  Sparkles,
  LogIn,
  Search,
  Archive,
  X,
} from "lucide-react";

interface Room {
  id: number;
  name: string;
  description: string;
  subject: string;
  invite_code: string;
  color_theme: string;
  teacher: { full_name: string; avatar: string | null };
  student_count: number;
  created_at: string;
}

export default function Home() {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [archivedRooms, setArchivedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await roomsAPI.list({ search: searchQuery || undefined });
      setRooms(data);
    } catch {
      // silent fail
    }
    setLoading(false);
    setRefreshing(false);
  }, [searchQuery]);

  const fetchArchivedRooms = useCallback(async () => {
    try {
      const data = await roomsAPI.list({ archived: true });
      setArchivedRooms(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchArchivedRooms();
    // Auto-refresh rooms every 8s
    const interval = setInterval(() => fetchRooms(), 8000);
    return () => clearInterval(interval);
  }, [fetchRooms, fetchArchivedRooms]);

  // Re-fetch when search query changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => fetchRooms(), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchRooms]);

  const handlePullRefresh = async () => {
    await fetchRooms(true);
    await fetchArchivedRooms();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("good_morning");
    if (hour < 18) return t("good_afternoon");
    return t("good_evening");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return t("today");
    if (days === 1) return t("yesterday");
    if (days < 7) return `${days}d`;
    const locale =
      lang === "fr" ? "fr-FR" : lang === "ar_tn" ? "ar-TN" : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      <div className="page-container">
        {/* Header */}
        <header className="header">
          <div className="greeting">
            <span className="greeting-time">{getGreeting()}</span>
            <h1 className="greeting-name">{user?.first_name || t("profile")}</h1>
          </div>
          <button className="avatar" onClick={() => navigate("/settings")}>
            {user?.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{getInitials(user?.full_name || "U")}</span>
            )}
          </button>
        </header>

        {/* Quick Actions */}
        <div className="quick-actions">
          {isTeacher ? (
            <button
              className="action-pill glass-panel pill-create"
              onClick={() => navigate("/room/create")}
            >
              <div className="action-icon"><Plus size={16} /></div>
              <span>{t("create_room")}</span>
            </button>
          ) : (
            <button
              className="action-pill glass-panel pill-create"
              onClick={() => navigate("/explore")}
            >
              <div className="action-icon"><LogIn size={16} /></div>
              <span>{t("join_room")}</span>
            </button>
          )}
          <button
            className="action-pill glass-panel pill-grades"
            onClick={() => navigate("/grades")}
          >
            <div className="action-icon"><Sparkles size={16} /></div>
            <span>{t("my_grades")}</span>
          </button>
          <button className={`action-pill glass-panel pill-refresh ${refreshing ? "opacity-50" : ""}`} onClick={() => fetchRooms(true)}>
            <div className="action-icon"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></div>
            <span>{t("refresh")}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar glass-panel" style={{ margin: '0 24px 24px', width: 'auto' }}>
          <Search size={20} className="text-tertiary" />
          <input
            type="text"
            placeholder={t("search_rooms")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Rooms Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t("your_rooms")}</h2>
            <span className="section-count">{rooms.length}</span>
          </div>

          {loading ? (
            <div className="room-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="room-card glass-panel animate-pulse h-28" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state glass-panel text-center py-12 px-6 mx-6 rounded-2xl flex flex-col items-center gap-4">
              <BookOpen size={48} strokeWidth={1} className="text-tertiary mb-2" />
              <h3 className="text-xl font-medium text-white">{t("no_rooms")}</h3>
              <p className="text-tertiary text-sm max-w-[240px] leading-relaxed">{isTeacher ? t("create_first") : t("join_with_code")}</p>
              <button
                className="mt-2 bg-white text-black font-medium py-2.5 px-6 rounded-full"
                onClick={() => navigate(isTeacher ? "/room/create" : "/explore")}
              >
                {isTeacher ? t("create_room") : t("join_room")}
              </button>
            </div>
          ) : (
            <div className="room-list">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  className="room-card glass-panel w-full text-left"
                  style={{ "--card-color": room.color_theme || "#6b9b7b" } as React.CSSProperties}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div className="room-top">
                    <div>
                      <h3 className="room-title">{room.name}</h3>
                      {room.subject && <span className="room-subject">{room.subject}</span>}
                    </div>
                    <ChevronRight size={20} className="text-tertiary" />
                  </div>
                  <div className="room-meta">
                    <div className="meta-item">
                      <Users size={14} />
                      <span>
                        {room.student_count} {t("students")}
                      </span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{formatDate(room.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Archived Rooms Section */}
        {archivedRooms.length > 0 && (
          <section className="section">
            <div className="section-header">
              <button className="section-toggle" onClick={() => setShowArchived(!showArchived)}>
                <Archive size={16} className="text-tertiary" />
                <h2>{t("archived_rooms")}</h2>
                <span className="section-count">{archivedRooms.length}</span>
              </button>
            </div>
            {showArchived && (
              <div className="room-list">
                {archivedRooms.map((room) => (
                  <button
                    key={room.id}
                    className="room-card archived"
                    onClick={() => navigate(`/room/${room.id}`)}
                  >
                    <div
                      className="room-card-accent"
                      style={{ backgroundColor: room.color_theme, opacity: 0.5 }}
                    />
                    <div className="room-card-body">
                      <div className="room-card-top">
                        <h3 className="room-card-name">{room.name}</h3>
                        <Archive size={16} className="text-tertiary" />
                      </div>
                      {room.subject && (
                        <span className="room-card-subject">{room.subject}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </PullToRefresh>
  );
}
