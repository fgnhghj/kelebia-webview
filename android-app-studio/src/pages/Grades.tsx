import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gradesAPI } from '../api/client';
import {
  BarChart3, Loader2, TrendingUp, Award, BookOpen,
} from 'lucide-react';

interface RoomGrade {
  room_id: number;
  room_name: string;
  room_color: string;
  average: number;
  total_score: number;
  total_max: number;
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
  const [roomGrades, setRoomGrades] = useState<RoomGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);

  useEffect(() => {
    if (!isStudent) {
      setLoading(false);
      return;
    }
    const fetchGrades = async () => {
      try {
        const data = await gradesAPI.overview();
        setRoomGrades(data);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchGrades();
  }, [isStudent]);

  const getGradeColor = (avg: number) => {
    if (avg >= 80) return 'var(--success)';
    if (avg >= 60) return 'var(--gold)';
    if (avg >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  const overallAvg = roomGrades.length > 0
    ? Math.round(roomGrades.reduce((s, r) => s + r.average, 0) / roomGrades.length * 10) / 10
    : 0;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Grades</h1>
          <p className="page-subtitle">Your academic performance</p>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : isTeacher ? (
        <div className="empty-state">
          <BarChart3 size={48} strokeWidth={1} className="text-tertiary" />
          <h3>Teacher View</h3>
          <p>Grade overview is available for students. View grades in each room's assignments.</p>
        </div>
      ) : roomGrades.length === 0 ? (
        <div className="empty-state">
          <Award size={48} strokeWidth={1} className="text-tertiary" />
          <h3>No grades yet</h3>
          <p>Your grades will appear here once assignments are graded</p>
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
              <span className="grade-stat-label">Overall Average</span>
            </div>
            <div className="grade-stat-card">
              <BookOpen size={20} className="text-accent" />
              <div className="grade-stat-value">{roomGrades.length}</div>
              <span className="grade-stat-label">Rooms</span>
            </div>
            <div className="grade-stat-card">
              <Award size={20} className="text-gold" />
              <div className="grade-stat-value">
                {roomGrades.reduce((s, r) => s + r.grades.length, 0)}
              </div>
              <span className="grade-stat-label">Graded</span>
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
                      <span>Total</span>
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
  );
}
