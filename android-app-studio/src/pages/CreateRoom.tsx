import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/client';
import {
  ArrowLeft, BookOpen, Palette, Loader2, Image,
} from 'lucide-react';

const COLORS = [
  { value: '#3A4B54', name: 'Slate' },
  { value: '#5C504A', name: 'Taupe' },
  { value: '#485E5A', name: 'Sage' },
  { value: '#605068', name: 'Plum' },
  { value: '#4A5468', name: 'Steel' },
  { value: '#684A4A', name: 'Rust' },
  { value: '#52584C', name: 'Olive' },
  { value: '#4A5F68', name: 'Ocean' },
  { value: '#68554A', name: 'Siena' },
  { value: '#2D2D2D', name: 'Charcoal' },
];

export default function CreateRoom() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: '',
    color_theme: '#3A4B54',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('subject', form.subject);
      formData.append('color_theme', form.color_theme);
      if (coverImage) formData.append('cover_image', coverImage);

      const room = await roomsAPI.create(formData);
      navigate(`/room/${room.id}`, { replace: true });
    } catch (err: any) {
      setError(err?.detail || 'Failed to create room.');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="detail-header">
        <button className="icon-btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="detail-title">Create Room</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Preview */}
      <div className="create-room-preview" style={{ backgroundColor: form.color_theme }}>
        <div className="create-preview-overlay" />
        <BookOpen size={32} className="create-preview-icon" />
        <h3>{form.name || 'Room Name'}</h3>
        {form.subject && <span>{form.subject}</span>}
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        {error && (
          <div className="auth-error">
            <span>{error}</span>
          </div>
        )}

        <div className="input-group">
          <label>Room Name *</label>
          <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
            <input
              type="text"
              placeholder="e.g. Mathematics 101"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Subject</label>
          <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Description</label>
          <textarea
            className="textarea-input glass-panel w-full py-3 px-4 border border-white/10"
            placeholder="Describe your classroom..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Color Picker */}
        <div className="input-group">
          <label>Color Theme</label>
          <div className="color-picker glass-panel p-3 border border-white/10 rounded-xl flex gap-2 overflow-x-auto">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-swatch ${form.color_theme === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => update('color_theme', c.value)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Cover Image */}
        <div className="input-group">
          <label>Cover Image (optional)</label>
          <label className="file-upload-label glass-panel p-4 flex flex-col items-center gap-2 border border-white/10 rounded-xl cursor-pointer">
            <Image size={18} />
            <span>{coverImage ? coverImage.name : 'Choose image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Room'}
        </button>
      </form>
    </div>
  );
}
