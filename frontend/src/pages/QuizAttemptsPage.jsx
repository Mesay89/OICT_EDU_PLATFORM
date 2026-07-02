import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, CheckCircle, XCircle, AlertTriangle, User, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const QuizAttemptsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = user?.token;
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${BASE_URL}/quiz/${quizId}/attempts`, cfg);
        setAttempts(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attempts');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchAttempts();
    }
  }, [quizId, token]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Loading attempts...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Student Attempts</h1>
            <p className="text-gray-500 font-bold text-sm">Review quiz submissions and integrity flags</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-zinc-800 shadow-sm">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-zinc-700" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Attempts Yet</h3>
            <p className="text-gray-500 mt-2">Students haven't taken this quiz yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800 text-xs font-black uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="p-5">Student</th>
                    <th className="p-5">Score</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Submitted</th>
                    <th className="p-5">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {attempts.map(attempt => (
                    <tr key={attempt._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-gray-900 dark:text-white">{attempt.student?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-gray-500">{attempt.student?.email}</div>
                      </td>
                      <td className="p-5">
                        <span className={`text-xl font-black ${attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="p-5">
                        {attempt.passed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {attempt.submittedAt ? (
                          <>
                            <div>{new Date(attempt.submittedAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{new Date(attempt.submittedAt).toLocaleTimeString()}</div>
                          </>
                        ) : (
                          <span className="text-amber-600 inline-flex items-center gap-1"><Clock className="h-3 w-3"/> In Progress</span>
                        )}
                      </td>
                      <td className="p-5">
                        {attempt.flagged ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" /> Flagged
                            </span>
                            <span className="text-xs text-red-600 dark:text-red-400 font-bold w-48 break-words">
                              {attempt.flagReason}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3" /> Clean
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAttemptsPage;
