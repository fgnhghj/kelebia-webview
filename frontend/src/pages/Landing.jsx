import { Link } from 'react-router-dom';
import { useTranslation } from '../LanguageContext';
import { motion } from 'framer-motion';
import { FiLayout, FiUploadCloud, FiClock, FiCheckSquare, FiMessageSquare, FiBell, FiArrowRight, FiBookOpen } from 'react-icons/fi';

export default function Landing() {
    const { t } = useTranslation();

    const features = [
        { icon: <FiLayout />, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
        { icon: <FiUploadCloud />, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
        { icon: <FiClock />, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
        { icon: <FiCheckSquare />, title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
        { icon: <FiMessageSquare />, title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
        { icon: <FiBell />, title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
    ];

    return (
        <div>
            <nav className="landing-nav">
                <div className="brand">
                    <div className="logo" style={{
                        width: 32, height: 32,
                        background: 'var(--text-primary)', color: 'var(--bg-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, fontWeight: 500, fontFamily: 'var(--font-serif)'
                    }}>K</div>
                    <h1>Kelebia Classroom</h1>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link to="/login" className="btn btn-ghost">{t('landing.login')}</Link>
                    <Link to="/signup" className="btn btn-primary">{t('landing.getStarted')}</Link>
                </div>
            </nav>

            <section className="landing-hero">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {t('landing.heroTitle')}<br />{t('landing.heroTitle2')}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {t('landing.heroDesc')}
                </motion.p>
                <motion.div
                    className="actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', gap: 16, justifyContent: 'center' }}
                >
                    <Link to="/signup" className="btn btn-primary btn-lg">
                        {t('landing.startTeaching')} <FiArrowRight />
                    </Link>
                    <Link to="/signup" className="btn btn-secondary btn-lg">
                        <FiBookOpen /> {t('landing.joinStudent')}
                    </Link>
                </motion.div>
            </section>

            <section style={{ borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', padding: '96px 32px 0' }}>
                    <h2 style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.5px' }}>
                        {t('landing.focusTitle')} <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--brand)' }}>{t('landing.focusHighlight')}</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontSize: 16, maxWidth: 600, margin: '16px auto 0' }}>
                        {t('landing.focusDesc')}
                    </p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="icon" style={{ fontSize: 24, marginBottom: 20, color: 'var(--text-primary)' }}>{f.icon}</div>
                            <h3 style={{ fontSize: 20, marginBottom: 12, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <footer className="landing-footer" style={{ padding: '64px 32px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="logo" style={{
                            width: 24, height: 24,
                            background: 'var(--text-muted)', color: 'var(--bg-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 4, fontWeight: 500, fontFamily: 'var(--font-serif)', fontSize: 12
                        }}>K</div>
                        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-primary)' }}>Kelebia Classroom</span>
                    </div>
                    <p style={{ margin: 0 }}>{t('landing.footer')}</p>
                </div>
            </footer>
        </div>
    );
}
