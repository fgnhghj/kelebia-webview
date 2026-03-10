import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useTranslation } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiShield, FiSave, FiLock, FiUnlock, FiLink, FiMessageSquare, FiTag } from 'react-icons/fi';

export default function AdminPanel() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        min_version: '1.0.0',
        is_locked: false,
        lock_message: '',
        update_url: '',
        updated_at: null,
    });

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await adminAPI.getVersionConfig();
                setConfig(data);
            } catch (err) {
                if (err?.response?.status === 403) {
                    toast.error('Access denied — admin only');
                } else {
                    toast.error('Failed to load version config');
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await adminAPI.updateVersionConfig({
                min_version: config.min_version,
                is_locked: config.is_locked,
                lock_message: config.lock_message,
                update_url: config.update_url,
            });
            setConfig(data);
            toast.success(t('admin.saved'));
        } catch (err) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (!user?.is_staff) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="page-header">
                        <h1>{t('admin.title')}</h1>
                    </div>
                    <div className="empty-state">
                        <FiShield size={48} />
                        <h3>Access Denied</h3>
                        <p>This page is only available for administrators.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="page-header">
                        <h1><FiShield style={{ marginRight: 10 }} /> {t('admin.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{t('admin.subtitle')}</p>
                    </div>

                    {loading ? (
                        <div className="skeleton-grid">
                            <div className="skeleton" style={{ height: 200 }} />
                            <div className="skeleton" style={{ height: 200 }} />
                        </div>
                    ) : (
                        <div className="admin-panel-content">
                            {/* Version Lock Toggle */}
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    {config.is_locked ? <FiLock size={20} /> : <FiUnlock size={20} />}
                                    <h3>{t('admin.versionLock')}</h3>
                                </div>
                                <p className="admin-card-desc">{t('admin.versionLockDesc')}</p>
                                <label className="admin-toggle">
                                    <input
                                        type="checkbox"
                                        checked={config.is_locked}
                                        onChange={e => setConfig({ ...config, is_locked: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                    <span className="toggle-label">
                                        {config.is_locked ? t('admin.locked') : t('admin.unlocked')}
                                    </span>
                                </label>
                            </div>

                            {/* Minimum Version */}
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    <FiTag size={20} />
                                    <h3>{t('admin.minVersion')}</h3>
                                </div>
                                <p className="admin-card-desc">{t('admin.minVersionDesc')}</p>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={config.min_version}
                                    onChange={e => setConfig({ ...config, min_version: e.target.value })}
                                    placeholder="e.g. 2.1.0"
                                />
                            </div>

                            {/* Lock Message */}
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    <FiMessageSquare size={20} />
                                    <h3>{t('admin.lockMessage')}</h3>
                                </div>
                                <p className="admin-card-desc">{t('admin.lockMessageDesc')}</p>
                                <textarea
                                    className="admin-textarea"
                                    rows={4}
                                    value={config.lock_message}
                                    onChange={e => setConfig({ ...config, lock_message: e.target.value })}
                                    placeholder="A new version is available..."
                                />
                            </div>

                            {/* Update URL */}
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    <FiLink size={20} />
                                    <h3>{t('admin.updateUrl')}</h3>
                                </div>
                                <p className="admin-card-desc">{t('admin.updateUrlDesc')}</p>
                                <input
                                    type="url"
                                    className="admin-input"
                                    value={config.update_url}
                                    onChange={e => setConfig({ ...config, update_url: e.target.value })}
                                    placeholder="https://example.com/app.apk"
                                />
                            </div>

                            {/* Last updated */}
                            {config.updated_at && (
                                <p className="admin-last-updated">
                                    {t('admin.lastUpdated')}: {new Date(config.updated_at).toLocaleString()}
                                </p>
                            )}

                            {/* Save Button */}
                            <button
                                className="admin-save-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FiSave size={18} />
                                {saving ? t('admin.saving') : t('admin.save')}
                            </button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
