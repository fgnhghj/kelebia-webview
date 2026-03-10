import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { roomsAPI, getMediaUrl } from "../api/client";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await roomsAPI.list();
      setRooms(data);
    } catch {
      // silent fail
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchRooms();
    // Auto-refresh rooms every 8s
    const interval = setInterval(() => fetchRooms(), 8000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

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
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div className="header-greeting">
          <p className="greeting-label">{getGreeting()}</p>
          <h1 className="greeting-name">{user?.first_name || t("profile")}</h1>
        </div>
        <button className="header-avatar" onClick={() => navigate("/settings")}>
          {user?.avatar ? (
            <img src={getMediaUrl(user.avatar)} alt="" />
          ) : (
            <span>{getInitials(user?.full_name || "U")}</span>
          )}
        </button>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions">
        {isTeacher ? (
          <button
            className="quick-action-card"
            onClick={() => navigate("/room/create")}
          >
            <div className="qa-icon accent">
              <Plus size={20} />
            </div>
            <span>{t("create_room")}</span>
          </button>
        ) : (
          <button
            className="quick-action-card"
            onClick={() => navigate("/explore")}
          >
            <div className="qa-icon accent">
              <LogIn size={20} />
            </div>
            <span>{t("join_room")}</span>
          </button>
        )}
        <button
          className="quick-action-card"
          onClick={() => navigate("/grades")}
        >
          <div className="qa-icon gold">
            <Sparkles size={20} />
          </div>
          <span>{t("my_grades")}</span>
        </button>
        <button className="quick-action-card" onClick={() => fetchRooms(true)}>
          <div className={`qa-icon info ${refreshing ? "spinning" : ""}`}>
            <RefreshCw size={20} />
          </div>
          <span>{t("refresh")}</span>
        </button>
      </div>

      {/* Rooms Section */}
      <section className="section">
        <div className="section-header">
          <h2>{t("your_rooms")}</h2>
          <span className="section-count">{rooms.length}</span>
        </div>

        {loading ? (
          <div className="room-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card-accent" />
                <div className="skeleton-card-body">
                  <div className="skeleton skeleton-line w-60" />
                  <div className="skeleton skeleton-line w-30 h-10" />
                  <div className="skeleton skeleton-line w-80 h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} strokeWidth={1} className="text-tertiary" />
            <h3>{t("no_rooms")}</h3>
            <p>{isTeacher ? t("create_first") : t("join_with_code")}</p>
            <button
              className="btn-primary btn-sm"
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
                className="room-card"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div
                  className="room-card-accent"
                  style={{ backgroundColor: room.color_theme }}
                />
                <div className="room-card-body">
                  <div className="room-card-top">
                    <h3 className="room-card-name">{room.name}</h3>
                    <ChevronRight size={18} className="text-tertiary" />
                  </div>
                  {room.subject && (
                    <span className="room-card-subject">{room.subject}</span>
                  )}
                  <div className="room-card-meta">
                    <div className="room-card-meta-item">
                      <Users size={14} />
                      <span>
                        {room.student_count} {t("students")}
                      </span>
                    </div>
                    <div className="room-card-meta-item">
                      <Clock size={14} />
                      <span>{formatDate(room.created_at)}</span>
                    </div>
                  </div>
                  {!isTeacher && (
                    <p className="room-card-teacher">
                      {room.teacher.full_name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
