import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess } from '../../utils/toast';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const emptyStoryForm = { name: '', country: '', text: '' };
const emptyHallForm = { name: '', year: '' };

const ContentManagementCenter = () => {
  const [stories, setStories] = useState([]);
  const [hallEntries, setHallEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyForm, setStoryForm] = useState(emptyStoryForm);
  const [hallForm, setHallForm] = useState(emptyHallForm);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [editingHallId, setEditingHallId] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const loadContent = async () => {
    try {
      setLoading(true);
      const [storiesRes, hallRes] = await Promise.all([
        fetch(API_ENDPOINTS.LEADERBOARD.STORIES),
        fetch(API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME)
      ]);

      const [storiesData, hallData] = await Promise.all([storiesRes.json(), hallRes.json()]);
      setStories(storiesData?.data?.stories || []);
      setHallEntries(hallData?.data?.hallOfFame || []);
    } catch (error) {
      showError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const submitStory = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingStoryId ? API_ENDPOINTS.TEACHER.STORY_BY_ID(editingStoryId) : API_ENDPOINTS.TEACHER.STORIES;
      const method = editingStoryId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method, headers: authHeaders(), body: JSON.stringify(storyForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      showSuccess(editingStoryId ? 'Story updated' : 'Story created');
      setStoryForm(emptyStoryForm);
      setEditingStoryId(null);
      loadContent();
    } catch (error) {
      showError(error.message || 'Failed to save story');
    }
  };

  const submitHallEntry = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingHallId ? API_ENDPOINTS.TEACHER.HALL_OF_FAME_BY_ID(editingHallId) : API_ENDPOINTS.TEACHER.HALL_OF_FAME;
      const method = editingHallId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method, headers: authHeaders(), body: JSON.stringify(hallForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      showSuccess(editingHallId ? 'Hall of Fame student updated' : 'Hall of Fame student added');
      setHallForm(emptyHallForm);
      setEditingHallId(null);
      loadContent();
    } catch (error) {
      showError(error.message || 'Failed to save Hall of Fame entry');
    }
  };

  const deleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.TEACHER.STORY_BY_ID(id), { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      showSuccess('Story deleted');
      loadContent();
    } catch (error) {
      showError(error.message || 'Failed to delete story');
    }
  };

  const deleteHallEntry = async (id) => {
    if (!window.confirm('Delete this Hall of Fame student?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.TEACHER.HALL_OF_FAME_BY_ID(id), { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      showSuccess('Hall of Fame student deleted');
      loadContent();
    } catch (error) {
      showError(error.message || 'Failed to delete Hall of Fame student');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Content Management</h2>
        <p className="text-gray-400 text-sm">Manage Hall of Fame students and student stories from one place.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">{editingHallId ? 'Edit Hall of Fame Student' : 'Add Hall of Fame Student'}</h3>
          <form onSubmit={submitHallEntry} className="space-y-3 mb-6">
            <input className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="Student name" value={hallForm.name} onChange={(e) => setHallForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <input className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="Year (e.g. 2026)" value={hallForm.year} onChange={(e) => setHallForm((prev) => ({ ...prev, year: e.target.value }))} required />
            <div className="flex gap-2">
              <button type="submit" className="bg-[#CA133E] hover:bg-[#A01030] text-white px-4 py-2 rounded-xl">{editingHallId ? 'Update' : 'Add'}</button>
              {editingHallId && <button type="button" onClick={() => { setEditingHallId(null); setHallForm(emptyHallForm); }} className="border border-white/10 text-gray-400 px-4 py-2 rounded-xl">Cancel</button>}
            </div>
          </form>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {!loading && hallEntries.map((entry) => (
              <div key={entry._id} className="flex items-center justify-between bg-[#161616] rounded-xl p-3">
                <div>
                  <p className="text-white font-semibold">{entry.name}</p>
                  <p className="text-gray-400 text-xs">Class of {entry.year}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingHallId(entry._id); setHallForm({ name: entry.name, year: entry.year }); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => deleteHallEntry(entry._id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">{editingStoryId ? 'Edit Story' : 'Add Story'}</h3>
          <form onSubmit={submitStory} className="space-y-3 mb-6">
            <input className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="Student name" value={storyForm.name} onChange={(e) => setStoryForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <input className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="Country" value={storyForm.country} onChange={(e) => setStoryForm((prev) => ({ ...prev, country: e.target.value }))} required />
            <textarea className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white min-h-[110px]" placeholder="Story text" value={storyForm.text} onChange={(e) => setStoryForm((prev) => ({ ...prev, text: e.target.value }))} required />
            <div className="flex gap-2">
              <button type="submit" className="bg-[#CA133E] hover:bg-[#A01030] text-white px-4 py-2 rounded-xl">{editingStoryId ? 'Update' : 'Add'}</button>
              {editingStoryId && <button type="button" onClick={() => { setEditingStoryId(null); setStoryForm(emptyStoryForm); }} className="border border-white/10 text-gray-400 px-4 py-2 rounded-xl">Cancel</button>}
            </div>
          </form>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {!loading && stories.map((story) => (
              <div key={story._id} className="bg-[#161616] rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{story.name}</p>
                    <p className="text-gray-400 text-xs">{story.country}</p>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{story.text}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingStoryId(story._id); setStoryForm({ name: story.name, country: story.country, text: story.text }); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl"><PencilIcon className="h-4 w-4" /></button>
                    <button onClick={() => deleteStory(story._id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagementCenter;
