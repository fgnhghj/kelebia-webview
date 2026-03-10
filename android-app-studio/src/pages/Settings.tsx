import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage, LANG_OPTIONS } from "../contexts/LanguageContext";
import { authAPI, getMediaUrl } from "../api/client";
import {
  User,
  Mail,
  Building2,
  FileText,
  Shield,
  ShieldCheck,
  ShieldOff,
  LogOut,
  ChevronRight,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Moon,
  Info,
  Heart,
  Globe,
  Copy,
  Trash2,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    institution: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrData, setQrData] = useState<{
    qr_code: string;
    secret: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
        institution: user.institution,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value),
      );
      await authAPI.updateProfile(formData);
      await refreshUser();
      setEditing(false);
      setMessage(t("profile_updated"));
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage(t("profile_update_failed"));
    }
    setSaving(false);
  };

  const handleEnable2FA = async () => {
    setTwoFALoading(true);
    try {
      const data = await authAPI.enable2FA();
      setQrData(data);
      setShow2FASetup(true);
    } catch {
      alert(t("error"));
    }
    setTwoFALoading(false);
  };

  const handleConfirm2FA = async () => {
    setTwoFALoading(true);
    try {
      await authAPI.confirm2FA(totpCode);
      await refreshUser();
      setShow2FASetup(false);
      setQrData(null);
      setTotpCode("");
    } catch {
      alert(t("error"));
    }
    setTwoFALoading(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm(t("two_fa"))) return;
    try {
      await authAPI.disable2FA();
      await refreshUser();
    } catch {
      alert(t("error"));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await authAPI.updateProfile(formData);
      await refreshUser();
    } catch {
      alert(t("profile_update_failed"));
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm(t("delete"))) return;
    try {
      await authAPI.deleteAvatar();
      await refreshUser();
    } catch {
      alert(t("error"));
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!user) return null;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">{t("settings")}</h1>
      </header>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt="" />
            ) : (
              <span>{getInitials(user.full_name)}</span>
            )}
          </div>
          <label className="avatar-edit-btn">
            <Camera size={14} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
          {user.avatar && (
            <button
              className="avatar-delete-btn"
              onClick={handleDeleteAvatar}
              type="button"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <h2 className="profile-name">{user.full_name}</h2>
        <span className="profile-role">
          {user.role === "teacher" ? t("teacher_view") : t("profile")}
        </span>
        <span className="profile-email">{user.email}</span>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`settings-message ${message === t("profile_update_failed") ? "error" : "success"}`}
        >
          {message === t("profile_update_failed") ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Profile Details */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>{t("profile")}</h3>
          <button
            className="btn-text"
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editing ? (
              t("save")
            ) : (
              t("edit")
            )}
          </button>
        </div>
        <div className="settings-card">
          <div className="settings-item">
            <User size={18} className="settings-icon" />
            <div className="settings-item-content">
              <label>{t("first_name")}</label>
              {editing ? (
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  className="settings-input"
                />
              ) : (
                <span>{user.first_name}</span>
              )}
            </div>
          </div>
          <div className="settings-item">
            <User size={18} className="settings-icon" />
            <div className="settings-item-content">
              <label>{t("last_name")}</label>
              {editing ? (
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  className="settings-input"
                />
              ) : (
                <span>{user.last_name}</span>
              )}
            </div>
          </div>
          <div className="settings-item">
            <Building2 size={18} className="settings-icon" />
            <div className="settings-item-content">
              <label>{t("institution")}</label>
              {editing ? (
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) =>
                    setForm({ ...form, institution: e.target.value })
                  }
                  className="settings-input"
                  placeholder={t("institution")}
                />
              ) : (
                <span>{user.institution || t("not_set")}</span>
              )}
            </div>
          </div>
          <div className="settings-item">
            <FileText size={18} className="settings-icon" />
            <div className="settings-item-content">
              <label>{t("bio")}</label>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="settings-input"
                  rows={2}
                  placeholder={t("bio")}
                />
              ) : (
                <span>{user.bio || t("not_set")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="settings-section">
        <h3>{t("security")}</h3>
        <div className="settings-card">
          <div
            className="settings-item clickable"
            onClick={user.is_2fa_enabled ? handleDisable2FA : handleEnable2FA}
          >
            {user.is_2fa_enabled ? (
              <ShieldCheck size={18} className="text-success" />
            ) : (
              <Shield size={18} className="settings-icon" />
            )}
            <div className="settings-item-content">
              <label>{t("two_fa")}</label>
              <span>{user.is_2fa_enabled ? t("enabled") : t("disabled")}</span>
            </div>
            <ChevronRight size={18} className="text-tertiary" />
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && qrData && (
        <div className="modal-overlay" onClick={() => setShow2FASetup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t("setup_2fa")}</h3>
            <p className="modal-desc">{t("scan_qr")}</p>
            <img src={qrData.qr_code} alt="QR Code" className="qr-code-img" />
            <button
              className="secret-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(qrData.secret);
                setSecretCopied(true);
                setTimeout(() => setSecretCopied(false), 2000);
              }}
            >
              <code>{qrData.secret}</code>
              {secretCopied ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : (
                <Copy size={16} />
              )}
              <span>{secretCopied ? t("copied") : t("copy_secret")}</span>
            </button>
            <div className="input-group">
              <label>{t("verification_code")}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  className="text-center tracking-[0.3em]"
                />
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleConfirm2FA}
              disabled={twoFALoading || totpCode.length !== 6}
            >
              {twoFALoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                t("verify_enable")
              )}
            </button>
          </div>
        </div>
      )}

      {/* Language */}
      <div className="settings-section">
        <h3>{t("language")}</h3>
        <div className="settings-card lang-picker">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`lang-option ${lang === opt.value ? "active" : ""}`}
              onClick={() => setLang(opt.value)}
            >
              <span className="lang-flag">{opt.flag}</span>
              <span className="lang-label">{opt.label}</span>
              {lang === opt.value && (
                <CheckCircle2 size={16} className="text-accent lang-check" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3>{t("about")}</h3>
        <div className="settings-card">
          <div className="settings-item">
            <Info size={18} className="settings-icon" />
            <div className="settings-item-content">
              <label>ISET Classroom</label>
              <span>{t("version")} 2.0.0</span>
            </div>
          </div>
          <div className="settings-item">
            <Heart size={18} className="text-accent" />
            <div className="settings-item-content">
              <label>{t("made_by")}</label>
              <span>Aymen HM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        <span>{t("logout")}</span>
      </button>

      <div className="settings-footer">
        <p>ISET Classroom v2.0</p>
        <p>By Aymen HM</p>
      </div>
    </div>
  );
}
