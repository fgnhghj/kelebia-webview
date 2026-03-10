import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { gradesAPI } from '../api/client';
import PullToRefresh from '../components/PullToRefresh';
import {
  BarChart3, Loader2, TrendingUp, Award, BookOpen, CheckCircle,
} from 'lucide-react';

interface RoomGrade {
  room_id: number;
  room_name: string;
  room_color: string;
  average: number;
  total_score: number;
  total_max: number;
  total_assignments: number;
  submitted_count: number;
  completion_pct: number;
  grades: {
    assignment_id: number;
    assignment_title: string;
    score: number;
    max_grade: number;
    feedback: string;
    graded_at: string | null;
  }[];
}

export default function Grades() {
  const { isStudent, isTeacher } = useAuth();
  const { t } = useLanguage();
  const [roomGrades, setRoomGrades] = useState<RoomGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);

  const fetchGrades = useCallback(async () => {
    if (!isStudent) {
      setLoading(false);
      return;
    }
    try {
      const data = await gradesAPI.overview();
      setRoomGrades(Array.isArray(data) ? data : (data?.results ?? []));
    } catch { /* silent */ }
    setLoading(false);
  }, [isStudent]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const handlePullRefresh = async () => {
    await fetchGrades();
  };

  const getGradeColor = (avg: number) => {
    if (avg >= 80) return 'var(--success)';
    if (avg >= 60) return 'var(--gold)';
    if (avg >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  const overallAvg = roomGrades.length > 0
    ? Math.round(roomGrades.reduce((s, r) => s + r.average, 0) / roomGrades.length * 10) / 10
    : 0;

  const totalAssignments = roomGrades.reduce((s, r) => s + (r.total_assignments || 0), 0);
  const totalSubmitted = roomGrades.reduce((s, r) => s + (r.submitted_count || 0), 0);
  const overallCompletion = totalAssignments > 0 ? Math.round((totalSubmitted / totalAssignments) * 100) : 0;

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('grades')}</h1>
          <p className="page-subtitle">{t('your_performance')}</p>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : isTeacher ? (
        <div className="empty-state">
          <BarChart3 size={48} strokeWidth={1} className="text-tertiary" />
          <h3>{t('teacher_view')}</h3>
          <p>{t('teacher_grades_desc')}</p>
        </div>
      ) : roomGrades.length === 0 ? (
        <div className="empty-state">
          <Award size={48} strokeWidth={1} className="text-tertiary" />
          <h3>{t('no_grades')}</h3>
          <p>{t('no_grades_desc')}</p>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grades-overview">
            <div className="grade-stat-card">
              <TrendingUp size={20} style={{ color: getGradeColor(overallAvg) }} />
              <div className="grade-stat-value" style={{ color: getGradeColor(overallAvg) }}>
                {overallAvg}%
              </div>
              <span className="grade-stat-label">{t('overall_average')}</span>
            </div>
            <div className="grade-stat-card">
              <CheckCircle size={20} style={{ color: getGradeColor(overallCompletion) }} />
              <div className="grade-stat-value" style={{ color: getGradeColor(overallCompletion) }}>
                {overallCompletion}%
              </div>
              <span className="grade-stat-label">{t('completion')}</span>
            </div>
            <div className="grade-stat-card">
              <BookOpen size={20} className="text-accent" />
              <div className="grade-stat-value">{totalSubmitted}/{totalAssignments}</div>
              <span className="grade-stat-label">{t('assignments_completed')}</span>
            </div>
            <div className="grade-stat-card">
              <Award size={20} className="text-gold" />
              <div className="grade-stat-value">
                {roomGrades.reduce((s, r) => s + r.grades.length, 0)}
              </div>
              <span className="grade-stat-label">{t('graded_count')}</span>
            </div>
          </div>

          {/* Room Grade Cards */}
          <div className="grades-rooms">
            {roomGrades.map((room) => (
              <div key={room.room_id} className="grade-room-card">
                <button
                  className="grade-room-header"
                  onClick={() => setExpandedRoom(expandedRoom === room.room_id ? null : room.room_id)}
                >
                  <div className="grade-room-color" style={{ backgroundColor: room.room_color }} />
                  <div className="grade-room-info">
                    <h4>{room.room_name}</h4>
                    <span>{room.grades.length} graded assignment{room.grades.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grade-room-avg" style={{ color: getGradeColor(room.average) }}>
                    {room.average}%
                  </div>
                </button>

                {/* Progress Bar */}
                <div className="grade-progress-bg">
                  <div
                    className="grade-progress-fill"
                    style={{
                      width: `${room.average}%`,
                      backgroundColor: getGradeColor(room.average),
                    }}
                  />
                </div>

                {/* Completion Bar */}
                {(room.total_assignments || 0) > 0 && (
                  <div className="room-completion-row">
                    <span className="room-completion-label">{t('completion')}: {room.submitted_count}/{room.total_assignments}</span>
                    <div className="grade-progress-bg" style={{ height: 4 }}>
                      <div
                        className="grade-progress-fill"
                        style={{
                          width: `${room.completion_pct || 0}%`,
                          backgroundColor: 'var(--info)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedRoom === room.room_id && (
                  <div className="grade-details">
                    {room.grades.map((g) => (
                      <div key={g.assignment_id} className="grade-detail-item">
                        <span className="grade-detail-title">{g.assignment_title}</span>
                        <span className="grade-detail-score">
                          {g.score}/{g.max_grade}
                        </span>
                      </div>
                    ))}
                    <div className="grade-detail-total">
                      <span>{t('total')}</span>
                      <span>{room.total_score}/{room.total_max}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
