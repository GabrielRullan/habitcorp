import React, { useState, useEffect } from 'react';
import { CalendarSource, Ghost, EventRecurrence } from '../types';
import { X, Calendar, RefreshCw, Trash2, Plus, Upload, Link2, CheckCircle2, UserCheck, Pencil, Check, Repeat, AlertCircle, HelpCircle } from 'lucide-react';
import { fetchJson } from '../apiHelper';
import { useTranslation } from '../i18n/I18nContext';

const WEEKDAYS = [
  { label: 'Su', value: 0 },
  { label: 'Mo', value: 1 },
  { label: 'Tu', value: 2 },
  { label: 'We', value: 3 },
  { label: 'Th', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
];

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onRefreshMeetings: () => void;
  defaultDate?: string;
  defaultStartTime?: string;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onRefreshMeetings,
  defaultDate,
  defaultStartTime,
}) => {
  const { t } = useTranslation();

  // Escape key handler for keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // New Feed Form
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedColor, setFeedColor] = useState('#6366f1');

  // Edit Feed State
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedName, setEditFeedName] = useState('');
  const [editFeedColor, setEditFeedColor] = useState('#6366f1');
  const [editFeedIcsUrl, setEditFeedIcsUrl] = useState('');

  // Ghost Form
  const [ghostName, setGhostName] = useState('');
  const [ghostRelation, setGhostRelation] = useState('');
  const [ghostColor, setGhostColor] = useState('#ec4899');
  const [ghostIcsUrl, setGhostIcsUrl] = useState('');

  // Edit Ghost State
  const [editingGhostId, setEditingGhostId] = useState<string | null>(null);
  const [editGhostName, setEditGhostName] = useState('');
  const [editGhostRelation, setEditGhostRelation] = useState('');
  const [editGhostColor, setEditGhostColor] = useState('#ec4899');
  const [editGhostIcsUrl, setEditGhostIcsUrl] = useState('');

  // Manual Meeting Form
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [meetingStart, setMeetingStart] = useState(defaultStartTime || '10:00');
  const [meetingEnd, setMeetingEnd] = useState('11:00');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingRecurrence, setMeetingRecurrence] = useState<EventRecurrence>('none');
  const [meetingRepeatDays, setMeetingRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [meetingRepeatUntil, setMeetingRepeatUntil] = useState('');
  const [isGhostMeeting, setIsGhostMeeting] = useState(false);
  const [selectedGhostIdsForMeeting, setSelectedGhostIdsForMeeting] = useState<string[]>([]);

  // Raw ICS Paste
  const [rawIcsText, setRawIcsText] = useState('');
  const [activeTab, setActiveTab] = useState<'ghosts' | 'feeds' | 'manual' | 'import'>('ghosts');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const fetchSourcesAndGhosts = async () => {
    try {
      const [resCals, resGhosts] = await Promise.all([
        fetchJson<{ calendars: CalendarSource[] }>('/api/v1/calendars', { headers: { 'X-API-Key': apiKey } }),
        fetchJson<{ ghosts: Ghost[] }>('/api/v1/ghosts', { headers: { 'X-API-Key': apiKey } }),
      ]);

      if (resCals?.calendars) {
        setSources(resCals.calendars);
      }
      if (resGhosts?.ghosts) {
        setGhosts(resGhosts.ghosts);
        if (resGhosts.ghosts.length > 0 && selectedGhostIdsForMeeting.length === 0) {
          setSelectedGhostIdsForMeeting([resGhosts.ghosts[0].id]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSourcesAndGhosts();
      if (defaultDate) setMeetingDate(defaultDate);
      if (defaultStartTime) setMeetingStart(defaultStartTime);
    }
  }, [isOpen, apiKey, defaultDate, defaultStartTime]);

  if (!isOpen) return null;

  // Add / Sync / Delete Ghosts
  const handleAddGhost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghostName.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchJson<{ id: string; synced_events_count?: number; sync_error?: string }>('/api/v1/ghosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: ghostName.trim(),
          relation: ghostRelation.trim(),
          color: ghostColor,
          ics_url: ghostIcsUrl.trim(),
        }),
      });

      setGhostName('');
      setGhostRelation('');
      setGhostIcsUrl('');
      if (res?.sync_error) {
        setErrorMsg(t.calGhostAddSyncError(res.sync_error));
      } else {
        const count = res?.synced_events_count ?? 0;
        setSuccessMsg(count > 0 ? t.calGhostAddedSynced(count) : t.calGhostAddedContact);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      setErrorMsg(err.message || t.calGhostAddError);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGhost = async (ghostId: string) => {
    setSyncingId(ghostId);
    setErrorMsg(null);
    try {
      const res = await fetchJson<{ count: number; message: string }>(`/api/v1/ghosts/${ghostId}/sync`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      const count = res?.count ?? 0;
      setSuccessMsg(t.calGhostSyncedEvents(count));
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      setErrorMsg(err.message || t.calGhostSyncError);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteGhost = async (ghostId: string) => {
    try {
      await fetchJson(`/api/v1/ghosts/${ghostId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEditGhost = (g: Ghost) => {
    setEditingGhostId(g.id);
    setEditGhostName(g.name);
    setEditGhostRelation(g.relation || '');
    setEditGhostColor(g.color || '#ec4899');
    setEditGhostIcsUrl(g.ics_url || '');
  };

  const handleSaveGhostEdit = async (ghostId: string) => {
    if (!editGhostName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await fetchJson(`/api/v1/ghosts/${ghostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: editGhostName.trim(),
          relation: editGhostRelation.trim(),
          color: editGhostColor,
          ics_url: editGhostIcsUrl.trim(),
        }),
      });
      setEditingGhostId(null);
      setSuccessMsg(t.calGhostUpdated);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      setErrorMsg(err.message || t.calGhostUpdateError);
    } finally {
      setLoading(false);
    }
  };

  // Add / Sync / Delete Sources
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim() || !feedUrl.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchJson<{ id: string; synced_events_count?: number; sync_error?: string }>('/api/v1/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: feedName.trim(),
          ics_url: feedUrl.trim(),
          color: feedColor,
        }),
      });

      setFeedName('');
      setFeedUrl('');
      if (data?.sync_error) {
        setErrorMsg(t.calFeedAddSyncNotice(data.sync_error));
      } else {
        const count = data?.synced_events_count ?? 0;
        setSuccessMsg(
          count > 0
            ? t.calFeedAddedSynced(count)
            : t.calFeedAddedNoEvents
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      setErrorMsg(err.message || t.calFeedAddError);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFeed = async (sourceId: string) => {
    setSyncingId(sourceId);
    setErrorMsg(null);
    try {
      const res = await fetchJson<{ count: number; message: string }>(`/api/v1/calendars/${sourceId}/sync`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      const count = res?.count ?? 0;
      setSuccessMsg(t.calFeedSyncedEvents(count));
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      setErrorMsg(err.message || t.calFeedSyncError);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteFeed = async (sourceId: string) => {
    try {
      await fetchJson(`/api/v1/calendars/${sourceId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEditFeed = (s: CalendarSource) => {
    setEditingFeedId(s.id);
    setEditFeedName(s.name);
    setEditFeedColor(s.color || '#6366f1');
    setEditFeedIcsUrl(s.ics_url || '');
  };

  const handleSaveFeedEdit = async (sourceId: string) => {
    if (!editFeedName.trim()) return;
    setLoading(true);
    try {
      await fetchJson(`/api/v1/calendars/${sourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: editFeedName.trim(),
          color: editFeedColor,
          ics_url: editFeedIcsUrl.trim(),
        }),
      });
      setEditingFeedId(null);
      setSuccessMsg(t.calFeedUpdated);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (err: any) {
      console.error('Error updating feed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Manual Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    setLoading(true);
    try {
      const startDateTime = `${meetingDate}T${meetingStart}:00Z`;
      const endDateTime = `${meetingDate}T${meetingEnd}:00Z`;

      let resolvedRepeatDays: number[] = [];
      if (meetingRecurrence === 'daily') {
        resolvedRepeatDays = [0, 1, 2, 3, 4, 5, 6];
      } else if (meetingRecurrence === 'weekdays') {
        resolvedRepeatDays = [1, 2, 3, 4, 5];
      } else if (meetingRecurrence === 'weekly') {
        resolvedRepeatDays = [new Date(`${meetingDate}T12:00:00Z`).getUTCDay()];
      } else if (meetingRecurrence === 'custom_days') {
        resolvedRepeatDays = meetingRepeatDays;
      }

      await fetchJson('/api/v1/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          start_time: startDateTime,
          end_time: endDateTime,
          location: meetingLocation.trim() || undefined,
          meeting_url: meetingUrl.trim() || undefined,
          is_ghost: (isGhostMeeting || selectedGhostIdsForMeeting.length > 0) ? 1 : 0,
          ghost_id: selectedGhostIdsForMeeting[0] || undefined,
          ghost_ids: selectedGhostIdsForMeeting,
          recurrence: meetingRecurrence,
          repeat_days: resolvedRepeatDays,
          repeat_until: meetingRecurrence !== 'none' && meetingRepeatUntil ? meetingRepeatUntil : null,
        }),
      });

      setMeetingTitle('');
      setMeetingLocation('');
      setMeetingUrl('');
      setMeetingRecurrence('none');
      setMeetingRepeatDays([1, 2, 3, 4, 5]);
      setMeetingRepeatUntil('');
      setIsGhostMeeting(false);
      setSelectedGhostIdsForMeeting([]);
      setSuccessMsg(t.calEventAddedToAgenda);
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefreshMeetings();
      onClose();
    } catch (err: any) {
      console.error('Error creating meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  // Import Raw ICS
  const handleImportIcsText = async () => {
    if (!rawIcsText.trim()) return;
    setLoading(true);
    try {
      const data = await fetchJson<{ count: number }>('/api/v1/calendars/import-ics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ ics_text: rawIcsText.trim() }),
      });
      setRawIcsText('');
      setSuccessMsg(t.calEventsImported(data?.count || 0));
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefreshMeetings();
    } catch (err: any) {
      console.error('Error importing ICS:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden my-8 text-stone-800">
        <div className="flex items-center justify-between p-5 border-b border-stone-200/80 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-lg text-stone-900">{t.calModalTitle || 'Calendars & Ghosts'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200/80 bg-stone-50/40 px-5 pt-3 overflow-x-auto">
          {[
            { id: 'ghosts', label: t.calTabGhosts },
            { id: 'feeds', label: t.calTabFeeds },
            { id: 'manual', label: t.calTabManual },
            { id: 'import', label: t.calTabImport },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-medium border-b-2 shrink-0 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{t.calSyncNoticePrefix}</span>
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-500 hover:text-rose-800 transition"
                title={t.calDismissTitle}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* GHOSTS TAB */}
          {activeTab === 'ghosts' && (
            <div className="space-y-5">
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 leading-relaxed">
                <span className="font-semibold">{t.calGhostsWhatIsTitle}</span> {t.calGhostsWhatIsDesc}
              </div>

              {/* Registered Ghosts */}
              <div>
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  {t.calGhostsActiveHeading(ghosts.length)}
                </span>
                {ghosts.length === 0 ? (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {t.calGhostsEmpty}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ghosts.map((g) => (
                      editingGhostId === g.id ? (
                        <div
                          key={g.id}
                          className="p-3.5 bg-white border-2 border-pink-300 rounded-xl text-xs shadow-xs space-y-2.5 animate-in fade-in-50"
                        >
                          <div className="flex items-center justify-between font-semibold text-pink-900 border-b border-pink-100 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-pink-600" />
                              <span>{t.calGhostEditHeading(g.name)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingGhostId(null)}
                              className="text-stone-400 hover:text-stone-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-[1fr_1fr_50px] gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calGhostNameLabel}</label>
                              <input
                                type="text"
                                required
                                value={editGhostName}
                                onChange={(e) => setEditGhostName(e.target.value)}
                                placeholder={t.calGhostNamePlaceholder}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calGhostRelationLabel}</label>
                              <input
                                type="text"
                                value={editGhostRelation}
                                onChange={(e) => setEditGhostRelation(e.target.value)}
                                placeholder={t.calGhostRelationPlaceholder}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calGhostColorLabel}</label>
                              <input
                                type="color"
                                value={editGhostColor}
                                onChange={(e) => setEditGhostColor(e.target.value)}
                                className="w-full h-8 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer p-0.5"
                                title={t.calGhostColorTooltip}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calGhostIcsUrlLabel}</label>
                            <div className="relative">
                              <Link2 className="absolute left-2.5 top-2 w-3 h-3 text-stone-400" />
                              <input
                                type="url"
                                value={editGhostIcsUrl}
                                onChange={(e) => setEditGhostIcsUrl(e.target.value)}
                                placeholder={t.calGhostIcsUrlPlaceholder}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingGhostId(null)}
                              className="px-2.5 py-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg text-xs font-medium transition"
                            >
                              {t.cancelBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveGhostEdit(g.id)}
                              disabled={loading || !editGhostName.trim()}
                              className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t.saveChangesBtn}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs shadow-2xs hover:border-stone-300 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[10px]"
                              style={{ backgroundColor: g.color }}
                            />
                            <div>
                              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                                <span>👻 {g.name}</span>
                                {g.relation && (
                                  <span className="text-[10px] text-pink-700 bg-pink-100 px-1.5 py-0.2 rounded-full border border-pink-200 font-medium">
                                    {g.relation}
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500 bg-stone-200/80 px-1.5 py-0.5 rounded-full font-mono">
                                  {t.calGhostEventsCount(g.events_count ?? 0)}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 truncate max-w-xs font-mono">
                                {g.ics_url ? g.ics_url : t.calGhostManualOnly}
                              </div>
                              {g.ics_url && (
                                <div className="text-[10px] text-stone-400 mt-0.5">
                                  {g.last_synced_at
                                    ? t.calGhostLastSynced(new Date(g.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                                    : t.calGhostNeverSynced}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {g.ics_url && (
                              <button
                                onClick={() => handleSyncGhost(g.id)}
                                disabled={syncingId === g.id}
                                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition"
                                title={t.calGhostSyncTooltip}
                              >
                                <RefreshCw
                                  className={`w-3.5 h-3.5 ${syncingId === g.id ? 'animate-spin' : ''}`}
                                />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEditGhost(g)}
                              className="p-1.5 text-stone-500 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition"
                              title={t.calGhostEditTooltip}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGhost(g.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition"
                              title={t.calGhostDeleteTooltip}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Ghost Form */}
              <form onSubmit={handleAddGhost} className="space-y-3 pt-3 border-t border-stone-200">
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {t.calGhostAddNewHeading}
                </span>
                <div className="grid grid-cols-[1fr_1fr_60px] gap-2">
                  <input
                    type="text"
                    required
                    value={ghostName}
                    onChange={(e) => setGhostName(e.target.value)}
                    placeholder={t.calGhostAddNamePlaceholder}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={ghostRelation}
                    onChange={(e) => setGhostRelation(e.target.value)}
                    placeholder={t.calGhostAddRelationPlaceholder}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="color"
                    value={ghostColor}
                    onChange={(e) => setGhostColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer p-1"
                    title={t.calGhostColorTooltip}
                  />
                </div>

                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="url"
                    value={ghostIcsUrl}
                    onChange={(e) => setGhostIcsUrl(e.target.value)}
                    placeholder={t.calGhostAddIcsPlaceholder}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? t.calGhostAddingBtn : t.calGhostAddSubmitBtn}</span>
                </button>
              </form>
            </div>
          )}

          {/* MY FEEDS TAB */}
          {activeTab === 'feeds' && (
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  {t.calFeedsHeading(sources.length)}
                </span>
                {sources.length === 0 ? (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {t.calFeedsEmpty}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sources.map((s) => (
                      editingFeedId === s.id ? (
                        <div
                          key={s.id}
                          className="p-3.5 bg-white border-2 border-indigo-300 rounded-xl text-xs shadow-xs space-y-2.5 animate-in fade-in-50"
                        >
                          <div className="flex items-center justify-between font-semibold text-indigo-900 border-b border-indigo-100 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{t.calFeedEditHeading(s.name)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingFeedId(null)}
                              className="text-stone-400 hover:text-stone-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-[1fr_60px] gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calFeedNameLabel}</label>
                              <input
                                type="text"
                                required
                                value={editFeedName}
                                onChange={(e) => setEditFeedName(e.target.value)}
                                placeholder={t.calFeedNamePlaceholder}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calFeedColorLabel}</label>
                              <input
                                type="color"
                                value={editFeedColor}
                                onChange={(e) => setEditFeedColor(e.target.value)}
                                className="w-full h-8 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer p-0.5"
                                title={t.calFeedColorTooltip}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-0.5">{t.calFeedIcsUrlLabel}</label>
                            <div className="relative">
                              <Link2 className="absolute left-2.5 top-2 w-3 h-3 text-stone-400" />
                              <input
                                type="url"
                                value={editFeedIcsUrl}
                                onChange={(e) => setEditFeedIcsUrl(e.target.value)}
                                placeholder={t.calFeedIcsUrlPlaceholder}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingFeedId(null)}
                              className="px-2.5 py-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg text-xs font-medium transition"
                            >
                              {t.cancelBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveFeedEdit(s.id)}
                              disabled={loading || !editFeedName.trim()}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t.saveChangesBtn}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs shadow-2xs hover:border-stone-300 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-stone-800 flex items-center gap-2">
                                <span className="truncate">{s.name}</span>
                                <span className="text-[10px] text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                                  {t.calFeedEventsCount(s.events_count ?? 0)}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 truncate max-w-xs font-mono">
                                {s.ics_url}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                {s.last_synced_at
                                  ? t.calFeedLastSynced(new Date(s.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), new Date(s.last_synced_at).toLocaleDateString())
                                  : t.calFeedNeverSynced}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleSyncFeed(s.id)}
                              disabled={syncingId === s.id}
                              className="p-1.5 text-stone-500 hover:text-indigo-600 hover:bg-stone-200/60 rounded-lg transition"
                              title={t.calFeedSyncTooltip}
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${syncingId === s.id ? 'animate-spin text-indigo-600' : ''}`}
                              />
                            </button>
                            <button
                              onClick={() => handleStartEditFeed(s)}
                              className="p-1.5 text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title={t.calFeedEditTooltip}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFeed(s.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition"
                              title={t.calFeedDeleteTooltip}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Tips & Instructions Accordion */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-2 text-indigo-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{t.calGuideAccordionTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] text-indigo-700 underline font-medium hover:text-indigo-900 transition"
                  >
                    {showGuide ? t.calGuideHideTips : t.calGuideShowTips}
                  </button>
                </div>
                {showGuide && (
                  <div className="space-y-1.5 text-[11px] text-indigo-900/80 pt-2 border-t border-indigo-200/60">
                    <div>
                      <strong>{t.calGuideGoogleLabel}</strong> {t.calGuideGoogleText}
                    </div>
                    <div>
                      <strong>{t.calGuideAppleLabel}</strong> {t.calGuideAppleText}
                    </div>
                    <div>
                      <strong>{t.calGuideOutlookLabel}</strong> {t.calGuideOutlookText}
                    </div>
                    <div className="text-[10px] text-indigo-600 pt-0.5">
                      {t.calGuideNoteText}
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Feed Form */}
              <form onSubmit={handleAddFeed} className="space-y-3 pt-3 border-t border-stone-200">
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {t.calFeedAddNewHeading}
                </span>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <input
                    type="text"
                    required
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder={t.calFeedAddNamePlaceholder}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="color"
                    value={feedColor}
                    onChange={(e) => setFeedColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer p-1"
                    title={t.calFeedBadgeColorTooltip}
                  />
                </div>

                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="url"
                    required
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder={t.calFeedAddUrlPlaceholder}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? t.calFeedAddingSyncingBtn : t.calFeedSubscribeSyncBtn}</span>
                </button>
              </form>
            </div>
          )}

          {/* MANUAL MEETING TAB */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  {t.calManualTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder={t.calManualTitlePlaceholder}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>

              {/* Ghost Assignment Toggle (Multiple Ghosts Supported) */}
              {ghosts.length > 0 && (
                <div className="p-3 bg-pink-50/50 border border-pink-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGhostMeeting || selectedGhostIdsForMeeting.length > 0}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsGhostMeeting(checked);
                          if (checked && selectedGhostIdsForMeeting.length === 0 && ghosts.length > 0) {
                            setSelectedGhostIdsForMeeting([ghosts[0].id]);
                          } else if (!checked) {
                            setSelectedGhostIdsForMeeting([]);
                          }
                        }}
                        className="rounded border-stone-300 text-pink-600 focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-pink-900 flex items-center gap-1">
                        <span>{t.calManualIsGhostCheckbox}</span>
                      </span>
                    </label>
                    {selectedGhostIdsForMeeting.length > 0 && (
                      <span className="text-[10px] text-pink-700 bg-pink-100 font-semibold px-2 py-0.5 rounded-full border border-pink-200">
                        {t.calManualGhostCountBadge(selectedGhostIdsForMeeting.length)}
                      </span>
                    )}
                  </div>

                  {(isGhostMeeting || selectedGhostIdsForMeeting.length > 0) && (
                    <div className="pt-1.5 space-y-1">
                      <span className="block text-[11px] font-medium text-stone-500">
                        {t.calManualSelectGhostsLabel}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ghosts.map((g) => {
                          const isSelected = selectedGhostIdsForMeeting.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                setSelectedGhostIdsForMeeting((prev) => {
                                  const next = isSelected
                                    ? prev.filter((id) => id !== g.id)
                                    : [...prev, g.id];
                                  if (next.length > 0) setIsGhostMeeting(true);
                                  return next;
                                });
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                                isSelected
                                  ? 'shadow-2xs font-semibold'
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
                              {isSelected && <span className="text-[10px] ml-0.5 font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">{t.labelDate}</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">{t.labelStartTime}</label>
                  <input
                    type="time"
                    required
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">{t.eventEndTimeLabel}</label>
                  <input
                    type="time"
                    required
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Periodicity / Recurrence in Manual Meeting Tab */}
              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.periodicityTitle}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'none' as EventRecurrence, label: t.recurrenceOneTime },
                    { id: 'daily' as EventRecurrence, label: t.periodEveryDay },
                    { id: 'weekdays' as EventRecurrence, label: t.periodWeekdays },
                    { id: 'weekly' as EventRecurrence, label: t.recurrenceWeekly },
                    { id: 'custom_days' as EventRecurrence, label: t.periodSpecificDays },
                    { id: 'monthly' as EventRecurrence, label: t.recurrenceMonthly },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMeetingRecurrence(opt.id)}
                      className={`py-1.5 px-2 rounded-lg border text-left font-medium transition text-[11px] ${
                        meetingRecurrence === opt.id
                          ? 'bg-white border-indigo-400 text-indigo-900 shadow-2xs font-semibold'
                          : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {meetingRecurrence === 'custom_days' && (
                  <div className="flex gap-1 pt-1">
                    {(t.weekdaysShort || WEEKDAYS).map((wd) => {
                      const active = meetingRepeatDays.includes(wd.value);
                      return (
                        <button
                          type="button"
                          key={wd.value}
                          onClick={() => {
                            if (active && meetingRepeatDays.length > 1) {
                              setMeetingRepeatDays(meetingRepeatDays.filter((d) => d !== wd.value));
                            } else if (!active) {
                              setMeetingRepeatDays([...meetingRepeatDays, wd.value].sort());
                            }
                          }}
                          className={`flex-1 py-1 rounded-md text-xs font-semibold border text-center transition ${
                            active
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-stone-200 text-stone-500 hover:border-indigo-300'
                          }`}
                        >
                          {wd.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {meetingRecurrence !== 'none' && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100/80">
                    <span className="text-[11px] text-stone-600 font-medium">{t.repeatUntilLabel}</span>
                    <input
                      type="date"
                      value={meetingRepeatUntil}
                      min={meetingDate}
                      onChange={(e) => setMeetingRepeatUntil(e.target.value)}
                      className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">{t.eventLocationLabel}</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder={t.eventLocationPlaceholder}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {t.eventMeetingUrlLabel}
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{loading ? t.calManualCreatingBtn : t.calManualAddEventBtn}</span>
              </button>
            </form>
          )}

          {/* RAW IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                {t.calRawImportDescription}
              </p>
              <textarea
                rows={6}
                value={rawIcsText}
                onChange={(e) => setRawIcsText(e.target.value)}
                placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT&#10;..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
              />
              <button
                onClick={handleImportIcsText}
                disabled={loading || !rawIcsText.trim()}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{loading ? t.calRawImportingBtn : t.calRawImportBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
