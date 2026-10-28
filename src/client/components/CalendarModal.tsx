import React, { useState, useEffect } from 'react';
import { CalendarSource, Ghost } from '../types';
import { X, Calendar, RefreshCw, Trash2, Plus, Upload, Link2, CheckCircle2, UserCheck } from 'lucide-react';

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
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // New Feed Form
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedColor, setFeedColor] = useState('#6366f1');

  // Ghost Form
  const [ghostName, setGhostName] = useState('');
  const [ghostRelation, setGhostRelation] = useState('');
  const [ghostColor, setGhostColor] = useState('#ec4899');
  const [ghostIcsUrl, setGhostIcsUrl] = useState('');

  // Manual Meeting Form
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [meetingStart, setMeetingStart] = useState(defaultStartTime || '10:00');
  const [meetingEnd, setMeetingEnd] = useState('11:00');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isGhostMeeting, setIsGhostMeeting] = useState(false);
  const [selectedGhostIdForMeeting, setSelectedGhostIdForMeeting] = useState<string>('');

  // Raw ICS Paste
  const [rawIcsText, setRawIcsText] = useState('');
  const [activeTab, setActiveTab] = useState<'ghosts' | 'feeds' | 'manual' | 'import'>('ghosts');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSourcesAndGhosts = async () => {
    try {
      const [resCals, resGhosts] = await Promise.all([
        fetch('/api/v1/calendars', { headers: { 'X-API-Key': apiKey } }),
        fetch('/api/v1/ghosts', { headers: { 'X-API-Key': apiKey } }),
      ]);

      if (resCals.ok) {
        const data = await resCals.json();
        setSources(data.calendars || []);
      }
      if (resGhosts.ok) {
        const data = await resGhosts.json();
        setGhosts(data.ghosts || []);
        if (data.ghosts && data.ghosts.length > 0 && !selectedGhostIdForMeeting) {
          setSelectedGhostIdForMeeting(data.ghosts[0].id);
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
    try {
      const res = await fetch('/api/v1/ghosts', {
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

      if (res.ok) {
        setGhostName('');
        setGhostRelation('');
        setGhostIcsUrl('');
        setSuccessMsg('Ghost added and synced!');
        setTimeout(() => setSuccessMsg(null), 3000);
        await fetchSourcesAndGhosts();
        onRefreshMeetings();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGhost = async (ghostId: string) => {
    setSyncingId(ghostId);
    try {
      const res = await fetch(`/api/v1/ghosts/${ghostId}/sync`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      if (res.ok) {
        setSuccessMsg('Ghost calendar synced successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
        await fetchSourcesAndGhosts();
        onRefreshMeetings();
      }
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteGhost = async (ghostId: string) => {
    try {
      await fetch(`/api/v1/ghosts/${ghostId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  // Add / Sync / Delete Sources
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim() || !feedUrl.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/calendars', {
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

      if (res.ok) {
        setFeedName('');
        setFeedUrl('');
        setSuccessMsg('Calendar feed added and synced!');
        setTimeout(() => setSuccessMsg(null), 3000);
        await fetchSourcesAndGhosts();
        onRefreshMeetings();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFeed = async (sourceId: string) => {
    setSyncingId(sourceId);
    try {
      const res = await fetch(`/api/v1/calendars/${sourceId}/sync`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      if (res.ok) {
        setSuccessMsg('Calendar synced successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
        await fetchSourcesAndGhosts();
        onRefreshMeetings();
      }
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteFeed = async (sourceId: string) => {
    try {
      await fetch(`/api/v1/calendars/${sourceId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });
      await fetchSourcesAndGhosts();
      onRefreshMeetings();
    } catch (e) {
      console.error(e);
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

      const res = await fetch('/api/v1/meetings', {
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
          is_ghost: isGhostMeeting,
          ghost_id: isGhostMeeting ? selectedGhostIdForMeeting : undefined,
        }),
      });

      if (res.ok) {
        setMeetingTitle('');
        setMeetingLocation('');
        setMeetingUrl('');
        setIsGhostMeeting(false);
        setSuccessMsg('Event added to agenda!');
        setTimeout(() => setSuccessMsg(null), 3000);
        onRefreshMeetings();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  // Import Raw ICS
  const handleImportIcsText = async () => {
    if (!rawIcsText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/calendars/import-ics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ ics_text: rawIcsText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setRawIcsText('');
        setSuccessMsg(`Imported ${data.count} calendar events!`);
        setTimeout(() => setSuccessMsg(null), 3000);
        onRefreshMeetings();
      }
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
            <span className="font-semibold text-lg text-stone-900">Calendars & Ghosts</span>
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
            { id: 'ghosts', label: '👻 Ghosts (Family / Spouse)' },
            { id: 'feeds', label: 'My Calendar Feeds' },
            { id: 'manual', label: 'Add Meeting' },
            { id: 'import', label: 'Raw .ics Upload' },
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

          {/* GHOSTS TAB */}
          {activeTab === 'ghosts' && (
            <div className="space-y-5">
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 leading-relaxed">
                <span className="font-semibold">What are Ghosts?</span> External people whose schedules impact you (like your spouse, kids, or roommates). Connect their .ics calendar feeds or log their appointments so their commitments show up clearly on your agenda, with a one-click toggle to show or hide them anytime.
              </div>

              {/* Registered Ghosts */}
              <div>
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Active Ghosts ({ghosts.length})
                </span>
                {ghosts.length === 0 ? (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    No ghosts configured yet. Add your spouse, children, or roommates below!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ghosts.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs shadow-2xs"
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
                            </div>
                            <div className="text-[10px] text-stone-500 truncate max-w-xs">
                              {g.ics_url ? g.ics_url : 'Manual events only'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {g.ics_url && (
                            <button
                              onClick={() => handleSyncGhost(g.id)}
                              disabled={syncingId === g.id}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition"
                              title="Sync Ghost Calendar"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${syncingId === g.id ? 'animate-spin' : ''}`}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGhost(g.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition"
                            title="Delete Ghost"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Ghost Form */}
              <form onSubmit={handleAddGhost} className="space-y-3 pt-3 border-t border-stone-200">
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Add New Ghost
                </span>
                <div className="grid grid-cols-[1fr_1fr_60px] gap-2">
                  <input
                    type="text"
                    required
                    value={ghostName}
                    onChange={(e) => setGhostName(e.target.value)}
                    placeholder="Name (e.g. Sarah or Leo)"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={ghostRelation}
                    onChange={(e) => setGhostRelation(e.target.value)}
                    placeholder="Relation (e.g. Spouse, Child)"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="color"
                    value={ghostColor}
                    onChange={(e) => setGhostColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer p-1"
                    title="Ghost badge color"
                  />
                </div>

                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="url"
                    value={ghostIcsUrl}
                    onChange={(e) => setGhostIcsUrl(e.target.value)}
                    placeholder="Optional .ics URL (e.g. Google Calendar secret iCal link)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Adding...' : 'Add Ghost'}</span>
                </button>
              </form>
            </div>
          )}

          {/* MY FEEDS TAB */}
          {activeTab === 'feeds' && (
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  My Calendar Feeds ({sources.length})
                </span>
                {sources.length === 0 ? (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    No personal calendar feeds configured yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sources.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <div>
                            <div className="font-semibold text-stone-800">{s.name}</div>
                            <div className="text-[10px] text-stone-500 truncate max-w-xs">
                              {s.ics_url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSyncFeed(s.id)}
                            disabled={syncingId === s.id}
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition"
                            title="Sync Now"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${syncingId === s.id ? 'animate-spin' : ''}`}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteFeed(s.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition"
                            title="Delete Feed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Feed Form */}
              <form onSubmit={handleAddFeed} className="space-y-3 pt-3 border-t border-stone-200">
                <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Add My Calendar Feed
                </span>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <input
                    type="text"
                    required
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder="Feed Name (e.g. Work Calendar)"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <input
                    type="color"
                    value={feedColor}
                    onChange={(e) => setFeedColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer p-1"
                    title="Calendar badge color"
                  />
                </div>

                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="url"
                    required
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Adding & Syncing...' : 'Subscribe & Sync'}</span>
                </button>
              </form>
            </div>
          )}

          {/* MANUAL MEETING TAB */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Event / Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Soccer Practice or Product Sync"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>

              {/* Ghost Assignment Toggle */}
              {ghosts.length > 0 && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGhostMeeting}
                      onChange={(e) => setIsGhostMeeting(e.target.checked)}
                      className="rounded border-stone-300 text-pink-600 focus:ring-0"
                    />
                    <span className="text-xs font-medium text-pink-700 flex items-center gap-1">
                      <span>👻 This is a Ghost Event (Spouse / Child / Roommate)</span>
                    </span>
                  </label>

                  {isGhostMeeting && (
                    <div className="pt-1">
                      <select
                        value={selectedGhostIdForMeeting}
                        onChange={(e) => setSelectedGhostIdForMeeting(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800"
                      >
                        {ghosts.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} {g.relation ? `(${g.relation})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder="e.g. Room 4B or Remote"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Meeting URL
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
                <span>{loading ? 'Creating...' : 'Add Event to Agenda'}</span>
              </button>
            </form>
          )}

          {/* RAW IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Paste raw `.ics` calendar content here to import one-time events without configuring a
                recurring URL feed.
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
                <span>{loading ? 'Importing...' : 'Import .ics Content'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
