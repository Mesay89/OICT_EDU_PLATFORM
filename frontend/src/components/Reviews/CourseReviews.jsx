import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Star, MessageCircle, Send, Trash2, User as UserIcon } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BASE_URL from '../../api/config';

const CourseReviews = ({ courseId, isEnrolled }) => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/reviews/course/${courseId}`);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/reviews`, { courseId, rating, comment }, config);
      setComment('');
      setRating(5);
      fetchReviews();
      alert('Review posted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${BASE_URL}/reviews/${reviewId}`, config);
      fetchReviews();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  if (loading) return <div className="text-center py-10">Loading reviews...</div>;

  const alreadyReviewed = reviews.some(r => r.user?._id === user?._id);

  return (
    <div className="space-y-10">
      <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 shadow-sm border border-gray-100 dark:border-zinc-800">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
          <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" /> 
          Student Feedback ({reviews.length})
        </h2>

        {isEnrolled && !alreadyReviewed && user?.role === 'student' && (
          <form onSubmit={handleSubmit} className="mb-12 bg-gray-50 dark:bg-zinc-800/50 p-8 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-zinc-700">
            <h3 className="text-xl font-bold mb-4">How was your learning experience?</h3>
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-2 transition-all ${rating >= s ? 'text-yellow-500 scale-110' : 'text-gray-300 dark:text-zinc-600'}`}
                >
                  <Star className={`h-8 w-8 ${rating >= s ? 'fill-yellow-500' : ''}`} />
                </button>
              ))}
            </div>
            <textarea
              className="w-full p-6 bg-white dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-medium text-lg min-h-[150px] mb-4 transition-all"
              placeholder="Write your honest review here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            {error && <p className="text-red-500 font-bold mb-4">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 flex items-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Posting...' : <><Send className="h-5 w-5" /> Submit Review</>}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
             <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
             <p className="font-bold text-xl">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {reviews.map((r) => (
              <div key={r._id} className="p-8 bg-gray-50 dark:bg-zinc-800/30 rounded-[32px] border border-gray-100 dark:border-zinc-800 transition-all hover:border-indigo-100 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {r.user?.image ? <img src={r.user.image} alt="" className="w-full h-full rounded-full object-cover" /> : r.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-lg">{r.user?.name}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${r.rating >= s ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 dark:text-zinc-700'}`} />
                        ))}
                     </div>
                     {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(r._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                           <Trash2 className="h-5 w-5" />
                        </button>
                     )}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium text-lg leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReviews;
