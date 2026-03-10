import { Download, ShieldAlert } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface UpdateBlockerProps {
  message: string;
  updateUrl: string;
  minVersion: string;
}

export default function UpdateBlocker({ message, updateUrl, minVersion }: UpdateBlockerProps) {
  const { t } = useLanguage();

  const handleUpdate = () => {
    if (updateUrl) {
      window.open(updateUrl, '_system');
    }
  };

  return (
    <div className="update-blocker-overlay">
      <div className="update-blocker-card">
        <div className="update-blocker-icon">
          <ShieldAlert size={56} />
        </div>

        <h2 className="update-blocker-title">{t('update_required')}</h2>

        <p className="update-blocker-message">{message}</p>

        <p className="update-blocker-version">
          {t('minimum_version')}: <strong>v{minVersion}</strong>
        </p>

        {updateUrl && (
          <button className="update-blocker-btn" onClick={handleUpdate}>
            <Download size={20} />
            {t('download_update')}
          </button>
        )}
      </div>
    </div>
  );
}
