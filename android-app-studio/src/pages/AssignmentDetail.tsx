import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage, type Lang } from "../contexts/LanguageContext";
import { assignmentsAPI, submissionsAPI } from "../api/client";
import {
  ArrowLeft,
  Clock,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  Send,
  X,
  Download,
  Star,
  Award,
  RotateCcw,
} from "lucide-react";

export default function AssignmentDetail() {
  const { id, assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher, isStudent } = useAuth();
  const { t, lang } = useLanguage();
  const aId = Number(assignmentId);
  const goBack = () =>
    navigate(`/room/${id}`, { state: { tab: "assignments" } });

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [grading, setGrading] = useState<{
    id: number;
    score: string;
    feedback: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aData, sData] = await Promise.all([
          assignmentsAPI.get(aId),
          submissionsAPI.list(aId),
        ]);
        setAssignment(aData);
        setSubmissions(sData);
      } catch {
        goBack();
      }
      setLoading(false);
    };
    fetchData();
  }, [aId, navigate]);

  const handleSubmit = async () => {
    if (!assignment) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("assignment", String(assignment.id));
      formData.append("comment", comment);
      files.forEach((f) => formData.append("files", f));
      await submissionsAPI.create(formData);
      // Refresh
      const [aData, sData] = await Promise.all([
        assignmentsAPI.get(aId),
        submissionsAPI.list(aId),
      ]);
      setAssignment(aData);
      setSubmissions(sData);
      setComment("");
      setFiles([]);
    } catch {
      alert(t("error"));
    }
    setSubmitting(false);
  };

  const handleGrade = async () => {
    if (!grading) return;
    try {
      await submissionsAPI.grade(grading.id, {
        score: Number(grading.score),
        feedback: grading.feedback,
      });
      const sData = await submissionsAPI.list(aId);
      setSubmissions(sData);
      setGrading(null);
    } catch {
      alert(t("error"));
    }
  };

  const handleResubmit = async () => {
    if (!mySubmission || !confirm(t("resubmit_confirm"))) return;
    try {
      await submissionsAPI.resubmit(mySubmission.id);
      const [aData, sData] = await Promise.all([
        assignmentsAPI.get(aId),
        submissionsAPI.list(aId),
      ]);
      setAssignment(aData);
      setSubmissions(sData);
    } catch {
      alert(t("error"));
    }
  };

  const getLocale = (l: Lang) =>
    l === "fr" ? "fr-FR" : l === "ar_tn" ? "ar-TN" : "en-US";

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return t("no_deadline");
    return new Date(deadline).toLocaleDateString(getLocale(lang), {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!assignment) return null;

  const mySubmission = assignment.my_submission;

  return (
    <div className="page-container">
      {/* Header */}
      <header className="detail-header">
        <button className="icon-btn-ghost" onClick={goBack}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="detail-title">{t("tasks")}</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Assignment Info */}
      <div className="detail-card">
        <h2 className="detail-card-title">{assignment.title}</h2>
        {assignment.description && (
          <p className="detail-card-desc">{assignment.description}</p>
        )}
        <div className="detail-card-meta">
          <div
            className={`deadline-badge ${assignment.is_past_deadline ? "overdue" : ""}`}
          >
            <Clock size={14} />
            <span>{formatDeadline(assignment.deadline)}</span>
          </div>
          <div className="grade-badge">
            <Star size={14} />
            <span>
              {t("max_score")}: {assignment.max_grade}
            </span>
          </div>
        </div>
        {assignment.file && (
          <button
            className="file-download-btn"
            onClick={async () => {
              if (Capacitor.isNativePlatform()) {
                await Browser.open({ url: assignment.file });
              } else {
                const ext =
                  assignment.file?.split(".").pop()?.split("?")[0] || "";
                const params = new URLSearchParams({
                  url: assignment.file!,
                  title: assignment.title || t("file"),
                  ext,
                });
                navigate(`/file-view?${params.toString()}`);
              }
            }}
          >
            <Download size={16} />
            <span>{t("file")}</span>
          </button>
        )}
      </div>

      {/* Student: Submit or View Submission */}
      {isStudent && !mySubmission && (
        <div className="detail-card">
          <h3 className="detail-card-subtitle">{t("your_submission")}</h3>

          <div className="input-group">
            <label>
              {t("comments")} ({t("optional")})
            </label>
            <textarea
              className="textarea-input"
              placeholder={t("add_comment")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="file-upload-area">
            <input
              type="file"
              id="submission-files"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            <label htmlFor="submission-files" className="file-upload-label">
              <Paperclip size={18} />
              <span>
                {files.length > 0
                  ? `${files.length} ${t("file").toLowerCase()}${files.length > 1 ? "s" : ""}`
                  : t("file")}
              </span>
            </label>
            {files.length > 0 && (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className="file-chip">
                    <span>{f.name}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            disabled={submitting || (files.length === 0 && !comment)}
            onClick={handleSubmit}
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            <span>{t("submit")}</span>
          </button>
        </div>
      )}

      {isStudent && mySubmission && (
        <div className="detail-card">
          <div className="submission-done">
            <CheckCircle2 size={24} className="text-success" />
            <div>
              <h4>{t("submitted")}</h4>
              <p className="text-secondary text-sm">
                {new Date(mySubmission.submitted_at).toLocaleDateString(
                  getLocale(lang),
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          </div>
          {mySubmission.grade && (
            <div className="grade-result">
              <span className="grade-score">
                {mySubmission.grade.score}/{assignment.max_grade}
              </span>
              {mySubmission.grade.feedback && (
                <p className="grade-feedback">{mySubmission.grade.feedback}</p>
              )}
            </div>
          )}
          {mySubmission.is_late && (
            <div className="late-badge">
              <AlertTriangle size={14} />
              <span>{t("past_due")}</span>
            </div>
          )}
          {assignment.allow_resubmission && mySubmission.status !== 'graded' && (
            <button className="btn-secondary btn-sm" onClick={handleResubmit} style={{ marginTop: 8 }}>
              <RotateCcw size={16} />
              <span>{t("resubmit")}</span>
            </button>
          )}
        </div>
      )}

      {/* Teacher: View Submissions */}
      {isTeacher && (
        <div className="detail-card">
          <h3 className="detail-card-subtitle">
            {t("tasks")} ({submissions.length})
          </h3>
          {submissions.length === 0 ? (
            <p className="empty-hint">{t("no_assignments")}</p>
          ) : (
            <div className="submissions-list">
              {submissions.map((sub) => (
                <div key={sub.id} className="submission-item">
                  <div className="submission-info">
                    <span className="submission-student">
                      {sub.student.full_name}
                    </span>
                    <span className="submission-time">
                      {new Date(sub.submitted_at).toLocaleDateString(
                        getLocale(lang),
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  {sub.files?.map((f: any) => (
                    <button
                      key={f.id}
                      className="file-download-btn sm"
                      onClick={async () => {
                        if (Capacitor.isNativePlatform()) {
                          await Browser.open({ url: f.file });
                        } else {
                          const ext =
                            (f.filename || f.file || "")
                              .split(".")
                              .pop()
                              ?.split("?")[0] || "";
                          const params = new URLSearchParams({
                            url: f.file,
                            title: f.filename || t("file"),
                            ext,
                          });
                          navigate(`/file-view?${params.toString()}`);
                        }
                      }}
                    >
                      <FileText size={14} />
                      <span>{f.filename || t("file")}</span>
                    </button>
                  ))}
                  {sub.comment && (
                    <p className="submission-comment">{sub.comment}</p>
                  )}
                  {sub.grade ? (
                    <div className="grade-result inline">
                      <span>
                        {sub.grade.score}/{assignment.max_grade}
                      </span>
                    </div>
                  ) : (
                    <button
                      className="btn-outline btn-xs"
                      onClick={() =>
                        setGrading({ id: sub.id, score: "", feedback: "" })
                      }
                    >
                      <Award size={14} />
                      {t("graded")}
                    </button>
                  )}
                  {sub.is_late && (
                    <span className="late-tag">{t("past_due")}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Teacher: Grading Modal */}
      {grading && assignment && (
        <div className="modal-overlay" onClick={() => setGrading(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("graded")}</h3>
              <button className="icon-btn-ghost" onClick={() => setGrading(null)}>
                <X size={20} />
              </button>
            </div>
            <p className="grade-modal-student">
              {submissions.find((s) => s.id === grading.id)?.student?.full_name || ""}
            </p>
            <div className="grade-modal-form">
              <div className="grade-modal-score-row">
                <input
                  type="number"
                  className="grade-modal-score-input"
                  placeholder="0"
                  value={grading.score}
                  onChange={(e) =>
                    setGrading({ ...grading, score: e.target.value })
                  }
                  max={assignment.max_grade}
                  min={0}
                  autoFocus
                />
                <span className="grade-modal-max">/ {assignment.max_grade}</span>
              </div>
              <textarea
                className="grade-modal-feedback"
                placeholder={t("comments")}
                value={grading.feedback}
                onChange={(e) =>
                  setGrading({ ...grading, feedback: e.target.value })
                }
                rows={3}
              />
              <button
                className="btn-primary"
                onClick={handleGrade}
                disabled={!grading.score}
              >
                <CheckCircle2 size={18} />
                <span>{t("save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
