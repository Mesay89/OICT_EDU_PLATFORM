import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, User, Loader2, Pin, Calendar, Tag, ChevronRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BASE_URL from '../../api/config';

const Forum = ({ courseId }) => {
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New thread form state
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('General');

  // Reply form state
  const [replyContent, setReplyContent] = useState('');

  const fetchThreads = async () => {
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/comm/forums/${courseId}`, cfg);
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && user) {
      fetchThreads();
    }
  }, [courseId, user]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/comm/forums`, {
        courseId,
        title: newThreadTitle,
        content: newThreadContent,
        category: newThreadCategory
      }, cfg);
      
      setThreads([data, ...threads]);
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedThread) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/comm/forums/${selectedThread._id}/posts`, {
        content: replyContent
      }, cfg);
      
      setSelectedThread(data);
      setThreads(threads.map(t => t._id === data._id ? data : t));
      setReplyContent('');
    } catch (error) {
      console.error('Error adding post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
      </div>
    );
  }

  // Thread detail view
  if (selectedThread) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedThread(null)}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:underline mb-4"
        >
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Threads
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedThread.category}
              </span>
              {selectedThread.isPinned && (
                <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Pin className="h-3 w-3 fill-current" /> Pinned
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{selectedThread.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" /> Started by {selectedThread.author?.name} • {new Date(selectedThread.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {selectedThread.posts.map((post, idx) => (
              <div key={post._id} className="p-8 flex gap-6">
                <div className="flex-shrink-0">
                   {post.author?.image ? (
                     <img src={post.author.image} alt={post.author.name} className="h-12 w-12 rounded-2xl object-cover shadow-md" />
                   ) : (
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {post.author?.name?.charAt(0) || 'U'}
                    </div>
                   )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{post.author?.name}</h4>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-gray-50 dark:bg-zinc-950/50 border-t border-gray-100 dark:border-zinc-800">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Add your reply</h3>
            <form onSubmit={handleAddPost}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your response here..."
                className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500 outline-none transition-all h-32 text-gray-900 dark:text-white resize-none mb-4"
              />
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:bg-gray-400"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                Post Reply
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Course Discussions</h2>
        {!showCreateForm && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Start Discussion
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Post New Topic</h3>
          <form onSubmit={handleCreateThread} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Topic Title</label>
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  value={newThreadCategory}
                  onChange={(e) => setNewThreadCategory(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                >
                  <option value="General" className="bg-white dark:bg-zinc-900">General Discussion</option>
                  <option value="Technical" className="bg-white dark:bg-zinc-900">Technical Help</option>
                  <option value="Study Group" className="bg-white dark:bg-zinc-900">Study Group</option>
                  <option value="Off-topic" className="bg-white dark:bg-zinc-900">Off-topic</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Content</label>
              <textarea
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                placeholder="Elaborate on your topic..."
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all h-40 font-bold text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4 font-bold">
              <button
                type="submit"
                disabled={submitting || !newThreadTitle.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 shadow-lg shadow-indigo-500/20 disabled:bg-gray-400"
              >
                Create Thread
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-8 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {threads.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
             <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
             <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No discussions yet.</p>
             <p className="text-gray-400">Be the first to share something with the community!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div 
              key={thread._id} 
              onClick={() => setSelectedThread(thread)}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-0.5 rounded-full text-xs font-bold uppercase">
                      {thread.category}
                    </span>
                    {thread.isPinned && (
                      <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                        <Pin className="h-3 w-3 fill-current" /> PINNED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {thread.author?.name}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(thread.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {thread.posts?.length} posts</span>
                  </div>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Forum;
