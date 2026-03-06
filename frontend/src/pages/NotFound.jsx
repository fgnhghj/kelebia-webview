import { Link } from 'react-router-dom';
import { useTranslation } from '../LanguageContext';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: 24,
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', maxWidth: 460 }}
            >
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand), var(--brand-hover, #4a6cf7))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px', color: 'white',
                }}>
                    <FiAlertTriangle size={36} />
                </div>
                <h1 style={{ fontSize: 72, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-2px' }}>404</h1>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {t('notFound.title')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                    {t('notFound.desc')}
                </p>
                <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <FiHome size={16} /> {t('notFound.goHome')}
                </Link>
            </motion.div>
        </div>
    );
}
