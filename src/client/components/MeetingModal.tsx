import React, { useState, useEffect } from 'react';
import { CalendarMeeting, Ghost } from '../types';
import { useTranslation } from '../i18n/I18nContext';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Trash2,
  Sparkles,
  ExternalLink,
  Users,
  Check,
} from 'lucide-react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meetingData: {
    id?: string;
    title: string;
    description?: string;
    location?: string;
    meeting_url?: string;
    start_time: string;
    end_time: string;
    all_day?: number;
    color?: string;
    is_ghost?: number;
    ghost_id?: string;
    ghost_ids?: string[];
  }) => Promise<void>;
  onDelete?: (meetingId: string) => Promise<void>;
  initialMeeting?: CalendarMeeting | null;
  defaultDate?: string;
  defaultStartTime?: string;
  ghosts?: Ghost[];
}

const PALETTE = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Slate', color: '#64748b' },
];

export const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialMeeting,
  defaultDate,
  defaultStartTime,
  ghosts = [],
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(initialMeeting?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#6366f1');

  // Ghost / Family state (Multiple ghosts support)
  const [isGhost, setIsGhost] = useState(false);
  const [selectedGhostIds, setSelectedGhostIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize form fields
  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title || '');
      setDescription(initialMeeting.description || '');
      setLocation(initialMeeting.location || '');
      setMeetingUrl(initialMeeting.meeting_url || '');

      const sTime = initialMeeting.start_time || '';
      const eTime = initialMeeting.end_time || '';

      if (sTime.includes('T')) {
        setDate(sTime.slice(0, 10));
        setStartTime(sTime.slice(11, 16));
      } else {
        setDate(defaultDate || new Date().toISOString().slice(0, 10));
        setStartTime('10:00');
      }

      if (eTime.includes('T')) {
        setEndTime(eTime.slice(11, 16));
      } else {
        setEndTime('11:00');
      }

      setAllDay(Boolean(initialMeeting.all_day));
      setColor(initialMeeting.color || (initialMeeting.is_ghost ? '#ec4899' : '#6366f1'));
      setIsGhost(Boolean(initialMeeting.is_ghost));
      const initialGids = (initialMeeting.ghost_ids && initialMeeting.ghost_ids.length > 0)
        ? initialMeeting.ghost_ids
        : (initialMeeting.ghost_id ? [initialMeeting.ghost_id] : []);
      setSelectedGhostIds(initialGids);
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setMeetingUrl('');
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      const start = defaultStartTime || '10:00';
      setStartTime(start);

      // default end 1 hour later
      const [hh, mm] = start.split(':').map(Number);
      const endHh = (hh + 1) % 24;
      setEndTime(`${String(endHh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);

      setAllDay(false);
      setColor('#6366f1');
      setIsGhost(false);
      setSelectedGhostIds([]);
    }
    setConfirmDelete(false);
  }, [initialMeeting, defaultDate, defaultStartTime, isOpen, ghosts]);

  if (!isOpen) return null;

  // Quick duration helper
  const handleSetDuration = (durationMinutes: number) => {
    const [hh, mm] = startTime.split(':').map(Number);
    const totalMinutes = hh * 60 + mm + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const startIso = `${date}T${startTime}:00.000Z`;
      const endIso = `${date}T${endTime}:00.000Z`;

      await onSave({
        id: initialMeeting?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        meeting_url: meetingUrl.trim() || undefined,
        start_time: startIso,
        end_time: endIso,
        all_day: allDay ? 1 : 0,
        color,
        is_ghost: (isGhost || selectedGhostIds.length > 0) ? 1 : 0,
        ghost_id: selectedGhostIds[0] || undefined,
        ghost_ids: selectedGhostIds,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save meeting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialMeeting?.id || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialMeeting.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden my-8 text-stone-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200/80 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl border flex items-center justify-center"
              style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-stone-900">
                {isEditing ? t.modalEditEventTitle : t.modalNewEventTitle}
              </h2>
              <p className="text-xs text-stone-500">
                {isEditing
                  ? t.modalEditEventSub
                  : t.modalNewEventSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              {t.eventTitleLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Architecture Alignment, School Run, Dentist..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              autoFocus
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                {t.eventDateLabel}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {t.eventStartTimeLabel}
              </label>
              <input
                type="time"
                required
                disabled={allDay}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {t.eventEndTimeLabel}
              </label>
              <input
                type="time"
                required
                disabled={allDay}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          {!allDay && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-stone-400 font-medium mr-1">{t.eventDurationLabel}</span>
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSetDuration(mins)}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-600 text-stone-600 rounded-lg text-[10px] font-medium transition border border-stone-200/80"
                >
                  +{mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="meeting-all-day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
            />
            <label htmlFor="meeting-all-day" className="text-xs text-stone-600 font-medium cursor-pointer">
              {t.eventAllDayLabel}
            </label>
          </div>

          {/* Location & Video Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                {t.eventLocationLabel}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 3B, Home, Gym..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3 text-stone-400" />
                {t.eventMeetingUrlLabel}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition pr-7"
                />
                {meetingUrl && (
                  <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2 top-2 text-stone-400 hover:text-indigo-600"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              {t.eventDescNotesLabel}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Preparation items, talking points, context..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              {t.eventHighlightColorLabel}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setColor(p.color)}
                  className={`w-6 h-6 rounded-full transition flex items-center justify-center border ${
                    color === p.color ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.color, borderColor: '#ffffff88' }}
                  title={p.name}
                >
                  {color === p.color && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Family / Ghost Association */}
          <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGhost || selectedGhostIds.length > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGhost(checked);
                    if (checked && selectedGhostIds.length === 0 && ghosts.length > 0) {
                      setSelectedGhostIds([ghosts[0].id]);
                    } else if (!checked) {
                      setSelectedGhostIds([]);
                    }
                  }}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-stone-300"
                />
                <span className="flex items-center gap-1.5">
                  <span>👻</span>
                  <span>{t.eventFamilyGhostLabel}</span>
                </span>
              </label>
              {(isGhost || selectedGhostIds.length > 0) && (
                <span className="text-[10px] text-pink-600 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded font-medium">
                  {selectedGhostIds.length > 1 ? t.eventGhostsAttached(selectedGhostIds.length) : t.eventPastelOutlineBadge}
                </span>
              )}
            </div>

            {(isGhost || selectedGhostIds.length > 0) && (
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>{t.eventAssignedGhostsLabel}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {t.eventSelectedCount(selectedGhostIds.length)}
                  </span>
                </div>

                {ghosts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ghosts.map((g) => {
                      const isSelected = selectedGhostIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedGhostIds((prev) => {
                              const next = isSelected
                                ? prev.filter((id) => id !== g.id)
                                : [...prev, g.id];
                              if (next.length > 0) setIsGhost(true);
                              return next;
                            });
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                            isSelected
                              ? 'shadow-xs font-semibold'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${g.color}18`,
                                  borderColor: `${g.color}60`,
                                  color: g.color,
                                }
                              : undefined
                          }
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: g.color }}
                          />
                          <span>{g.name}</span>
                          {g.relation && (
                            <span className="text-[10px] opacity-75 font-normal">
                              ({g.relation})
                            </span>
                          )}
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">
                    {t.noGhostsConfiguredNote}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200/80">
            {isEditing && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{deleting ? '...' : t.confirmDeleteBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-700"
                  >
                    {t.cancelBtn}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteEventBtn}</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-medium transition"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{saving ? '...' : isEditing ? t.saveChangesBtn : t.createEventBtn}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
