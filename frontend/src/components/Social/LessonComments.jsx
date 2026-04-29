import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MessageSquare, Send, CornerDownRight, User, Loader2, Info } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BASE_URL from '../../api/config';

const LessonComments = ({ courseId, moduleId, isSidebar = false }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = async () => {
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/comm/comments/${courseId}/${moduleId}`, cfg);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && moduleId && user) {
      setLoading(true);
      fetchComments();
    }
  }, [courseId, moduleId, user]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/comm/comments`, {
        courseId,
        moduleId,
        content: newComment
      }, cfg);
      
      setComments([data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/comm/comments/${commentId}/reply`, {
        content: replyContent
      }, cfg);
      
      setComments(comments.map(c => c._id === commentId ? data : c));
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className={`${isSidebar ? 'mt-4 pt-4' : 'mt-12 border-t border-gray-200 dark:border-zinc-800 pt-8'} animate-in fade-in duration-700`}>
      <div className={`flex items-center gap-3 ${isSidebar ? 'mb-4' : 'mb-8'}`}>
        <div className={`p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 ${isSidebar ? 'hidden' : ''}`}>
          <MessageSquare className="h-6 w-6" />
        </div>
        <h2 className={`${isSidebar ? 'text-sm font-black' : 'text-2xl font-bold'} text-gray-900 dark:text-white uppercase tracking-widest`}>Discussions</h2>
        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-black">
          {comments.length}
        </span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-10 group">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts or ask a question about this lesson..."
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all resize-none h-32 text-gray-700 dark:text-gray-200"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className={`absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 ${isSidebar ? 'px-3 py-1.5 text-xs' : 'px-5 py-2'}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSidebar ? 'Post' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Messages List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
            <Info className="h-10 w-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="group flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex-shrink-0">
                {comment.user?.image ? (
                  <img src={comment.user.image} alt={comment.user.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-zinc-800" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{comment.user?.name}</h4>
                    <span className="text-xs text-gray-500 dark:text-zinc-500">
                      {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight className="h-3 w-3" /> Reply
                    </button>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === comment._id && (
                  <div className="mt-3 ml-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full p-3 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-zinc-900 focus:border-indigo-500 outline-none transition-all resize-none h-20 text-sm text-gray-700 dark:text-gray-200"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReply(comment._id)}
                        disabled={submitting || !replyContent.trim()}
                        className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:bg-gray-400"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies List */}
                {comment.replies?.length > 0 && (
                  <div className="mt-4 space-y-4 ml-6 border-l-2 border-gray-100 dark:border-zinc-800 pl-6">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          {reply.user?.image ? (
                            <img src={reply.user.image} alt={reply.user.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 font-bold border border-gray-200 dark:border-zinc-700 text-[10px]">
                              {reply.user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white">{reply.user?.name}</h5>
                            <span className="text-[10px] text-gray-400">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LessonComments;
