import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Shield, Clock, AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Send, Lock, Award } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const QuizPlayerPage = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const bundleId = searchParams.get('bundleId');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [phase, setPhase] = useState('loading'); // loading | info | attempt | results | error
  const [quiz, setQuizMeta] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: { selectedOption, essayText } }
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myAttempts, setMyAttempts] = useState([]);
  const [errMsg, setErrMsg] = useState('');

  // ── Timers ────────────────────────────────────────────────────────────────
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(null);
  const [questionSecsLeft,  setQuestionSecsLeft]  = useState(null);
  const totalTimerRef    = useRef(null);
  const questionTimerRef = useRef(null);

  // ── Anti-cheat ────────────────────────────────────────────────────────────
  const [blurCount, setBlurCount] = useState(0);
  const [blurWarning, setBlurWarning] = useState(false);
  const attemptIdRef = useRef(null);
  const cfg = { headers: { Authorization: `Bearer ${user?.token}` } };

  // ── Load quiz meta & previous attempts ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, attRes] = await Promise.all([
          axios.get(`${BASE_URL}/quiz/${quizId}`, cfg),
          axios.get(`${BASE_URL}/quiz/${quizId}/my-attempts`, cfg).catch(() => ({ data: [] }))
        ]);
        setQuizMeta(qRes.data);
        setMyAttempts(attRes.data);
        setPhase('info');
      } catch (err) {
        setErrMsg(err.response?.data?.message || 'Could not load quiz');
        setPhase('error');
      }
    };
    if (!quizId || quizId === 'undefined') {
      setErrMsg('Quiz not found — invalid quiz ID.');
      setPhase('error');
      return;
    }
    if (!user?.token) {
      setErrMsg('You must be logged in to take this quiz.');
      setPhase('error');
      return;
    }
    load();
  }, [quizId, user?.token]);

  // ── Start attempt ─────────────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      const { data } = await axios.post(`${BASE_URL}/quiz/${quizId}/start`, {}, cfg);
      setAttemptId(data.attemptId);
      attemptIdRef.current = data.attemptId;
      setQuestions(data.questions);
      setQuizMeta(prev => ({ ...prev, timeLimitMinutes: data.timeLimitMinutes, allowedWindowBlurs: data.allowedWindowBlurs }));

      // Start total timer
      if (data.timeLimitMinutes > 0) {
        setTotalSecondsLeft(data.timeLimitMinutes * 60);
      }
      // Start first question timer
      if (data.questions[0]?.timePerQuestion > 0) {
        setQuestionSecsLeft(data.questions[0].timePerQuestion);
      }
      setPhase('attempt');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Could not start quiz');
      setPhase('error');
    }
  };

  // ── Submit quiz ────────────────────────────────────────────────────────────
  const handleSubmit = async (autoSubmit = false, blurCountOverride = null) => {
    try {
      setSubmitting(true);
      // Convert answers object to array format expected by backend
      const answersArray = Object.entries(answers).map(([questionId, data]) => ({
        questionId,
        selectedOption: data.selectedOption,
        essayText: data.essayText
      }));
      
      const payload = {
        answers: answersArray,
        windowBlurCount: blurCountOverride !== null ? blurCountOverride : blurCount
      };
      const { data } = await axios.put(`${BASE_URL}/quiz/attempts/${attemptIdRef.current}/submit`, payload, cfg);
      setResults(data);
      setPhase('results');
      // Stop timers
      if (totalTimerRef.current) clearTimeout(totalTimerRef.current);
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Could not submit quiz');
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Total timer countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt' || totalSecondsLeft === null) return;
    if (totalSecondsLeft <= 0) { handleSubmit(true); return; }
    totalTimerRef.current = setTimeout(() => setTotalSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(totalTimerRef.current);
  }, [totalSecondsLeft, phase, handleSubmit]);

  // ── Per-question timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt' || questionSecsLeft === null) return;
    if (questionSecsLeft <= 0) {
      // Auto-advance
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        handleSubmit(true);
      }
      return;
    }
    questionTimerRef.current = setTimeout(() => setQuestionSecsLeft(s => s - 1), 1000);
    return () => clearTimeout(questionTimerRef.current);
  }, [questionSecsLeft, phase, currentIdx, questions.length, handleSubmit]);

  // Reset per-question timer when question changes
  useEffect(() => {
    if (phase !== 'attempt') return;
    const q = questions[currentIdx];
    if (q?.timePerQuestion > 0) setQuestionSecsLeft(q.timePerQuestion);
    else setQuestionSecsLeft(null);
  }, [currentIdx, phase]);

  // ── Anti-cheat: tab/window blur ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt') return;
    
    const handleBlur = async () => {
      console.log('Tab blur detected');
      setBlurCount(c => {
        const newCount = c + 1;
        const allowedBlurs = quiz?.allowedWindowBlurs ?? 3;
        console.log(`Blur count: ${newCount}, Allowed: ${allowedBlurs}`);
        
        if (newCount > allowedBlurs) {
          console.log('Exceeded allowed blurs, auto-submitting');
          handleSubmit(true, newCount);
        }
        return newCount;
      });
      setBlurWarning(true);
      setTimeout(() => setBlurWarning(false), 4000);
      
      if (attemptIdRef.current) {
        try {
          await axios.put(`${BASE_URL}/quiz/attempts/${attemptIdRef.current}/blur`, {}, cfg);
          console.log('Blur reported to backend');
        } catch (err) {
          console.error('Failed to report blur:', err);
        }
      }
    };
    
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [phase, quiz]);

  // ── Answer setter ─────────────────────────────────────────────────────────
  const setAnswer = (qId, field, value) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] || {}), [field]: value } }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── RENDER PHASES ─────────────────────────────────────────────────────────

  if (phase === 'loading') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  if (phase === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Lock className="h-16 w-16 text-red-400" />
      <h2 className="text-2xl font-black text-gray-900 dark:text-white">{errMsg}</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Go Back</button>
    </div>
  );

  if (phase === 'info') return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-10 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Ready to Begin?</h1>
        <p className="text-gray-500 mb-6">This quiz is monitored for academic integrity.</p>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6 text-left space-y-2">
          <p className="font-black text-amber-800 dark:text-amber-400 text-sm">⚠️ Important Rules</p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc pl-4">
            <li>Do not switch tabs or open new windows</li>
            <li>Each tab switch will be flagged and reported</li>
            <li>Do not refresh the page during the quiz</li>
            <li>Submit before the timer runs out</li>
          </ul>
        </div>

        {quiz && (
          <div className="mb-6 flex justify-around text-sm font-bold text-gray-700 dark:text-gray-300">
            {quiz.timeLimitMinutes > 0 && <p>⏱️ Time Limit: {quiz.timeLimitMinutes} min</p>}
            <p>🔄 Max Attempts: {quiz.maxAttempts}</p>
          </div>
        )}

        {myAttempts.length > 0 && (
          <div className="mb-6 text-sm text-gray-500 bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
            <p className="font-bold">Previous Attempts: {myAttempts.length}</p>
            <p>Best Score: {Math.max(...myAttempts.filter(a => a.submittedAt).map(a => a.score))}%</p>
          </div>
        )}

        {quiz && myAttempts.length >= quiz.maxAttempts ? (
          <div className="w-full py-4 bg-red-100 text-red-700 rounded-2xl font-black text-lg shadow-inner">
            Max Attempts Reached
          </div>
        ) : (
          <button onClick={handleStart}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg transition-all">
            Start Quiz
          </button>
        )}
        <button onClick={() => navigate(-1)} className="w-full mt-3 py-3 text-gray-500 font-bold hover:text-gray-700">
          ← Go Back
        </button>
      </div>
    </div>
  );

  if (phase === 'attempt') {
    const q = questions[currentIdx];
    const ans = answers[q?._id] || {};
    const progress = Math.round(((currentIdx + 1) / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
        {/* Anti-cheat warning banner */}
        {blurWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 font-black text-sm animate-in slide-in-from-top duration-300">
            ⚠️ TAB SWITCH DETECTED! (Count: {blurCount}) — This has been logged by the system.
          </div>
        )}

        {/* Top bar */}
        <div className={`bg-zinc-900 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800 ${blurWarning ? 'mt-11' : ''}`}>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-400" />
            <span className="font-black">Question {currentIdx + 1} / {questions.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {blurCount > 0 && (
              <div className="flex items-center gap-1 text-red-400 text-sm font-black">
                <AlertTriangle className="h-4 w-4" /> {blurCount} tab switch{blurCount !== 1 ? 'es' : ''}
              </div>
            )}
            {questionSecsLeft !== null && (
              <div className={`flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full ${questionSecsLeft <= 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}>
                <Clock className="h-4 w-4" /> Per Q: {formatTime(questionSecsLeft)}
              </div>
            )}
            {totalSecondsLeft !== null && (
              <div className={`flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full ${totalSecondsLeft <= 60 ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-600/20 text-indigo-400'}`}>
                <Clock className="h-4 w-4" /> Total: {formatTime(totalSecondsLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-zinc-800">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Question area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-200 dark:border-zinc-800 p-8 max-w-2xl w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {q?.type === 'truefalse' ? 'True / False' : q?.type === 'essay' ? 'Essay' : 'MCQ'}
              </span>
              <span className="text-xs text-gray-500 font-bold">{q?.points} pt{q?.points > 1 ? 's' : ''}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 leading-snug">{q?.text}</h2>

            {/* MCQ / True-False options */}
            {(q?.type === 'mcq' || q?.type === 'truefalse') && (
              <div className="space-y-3">
                {(q?.options || []).map((opt, i) => (
                  <button key={i} onClick={() => setAnswer(q._id, 'selectedOption', i)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold ${ans.selectedOption === i ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 text-gray-800 dark:text-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${ans.selectedOption === i ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                        {ans.selectedOption === i && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      {opt}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Essay */}
            {q?.type === 'essay' && (
              <textarea rows={7} value={ans.essayText || ''} onChange={e => setAnswer(q._id, 'essayText', e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none focus:border-indigo-500 outline-none transition-all"
                placeholder="Write your answer here..." />
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                className="flex items-center gap-2 px-5 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-white rounded-xl font-bold disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              {currentIdx < questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(i => i + 1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition-all">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md transition-all disabled:opacity-60">
                  <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  className={`w-7 h-7 rounded-full text-xs font-black transition-all ${i === currentIdx ? 'bg-indigo-600 text-white' : answers[questions[i]?._id]?.selectedOption !== undefined || answers[questions[i]?._id]?.essayText ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-10 max-w-2xl w-full text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${results.passed ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
            {results.passed ? <CheckCircle className="h-12 w-12 text-emerald-600" /> : <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {results.passed ? '🎉 You Passed!' : '📚 Better Luck Next Time'}
          </h1>
          <p className="text-5xl font-black mt-4 mb-2 text-indigo-600">{results.score}%</p>
          <p className="text-gray-500 mb-6">{results.passed ? 'Excellent work!' : `You need ${quiz?.passingScore || 70}% to pass.`}</p>

          {results.flagged && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-red-700 dark:text-red-400 text-sm font-black">⚠️ Integrity Flag</p>
              <p className="text-red-600 text-xs mt-1">Your attempt has been flagged for review: {blurCount} tab switch{blurCount !== 1 ? 'es' : ''} detected.</p>
            </div>
          )}

          {results.answers && (
            <div className="text-left mt-6 space-y-3 max-h-96 overflow-y-auto pr-2">
              <h3 className="font-black text-gray-900 dark:text-white">Answer Review</h3>
              {results.answers.map((a, i) => {
                const qObj = questions.find(q => q._id === a.question?.toString?.() || q._id === a.question);
                return (
                  <div key={i} className={`p-4 rounded-xl border ${a.isCorrect ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                    <div className="flex items-center gap-2">
                      {a.isCorrect ? <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{qObj?.text || `Question ${i + 1}`}</p>
                    </div>
                    {results.explanations?.[a.question] && (
                      <p className="text-xs text-gray-500 mt-1 ml-6 italic">{results.explanations[a.question]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button onClick={() => bundleId ? navigate(`/bundle-player/${bundleId}`) : navigate(-1)} className="flex-1 py-3 bg-gray-200 dark:bg-zinc-800 rounded-xl font-black text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700">
              {bundleId ? 'Back to Bundle' : 'Back to Course'}
            </button>
          </div>

          {/* Bundle Certificate Section */}
          {results.bundleCertificate && (
            <div className="mt-8 p-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl text-white shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Award className="h-8 w-8" />
                <h3 className="text-xl font-black">🎓 Bundle Certificate Issued!</h3>
              </div>
              <p className="text-white/80 mb-1">Congratulations on completing <strong>{results.bundleCertificate.bundleTitle}</strong>!</p>
              <p className="text-xs text-white/60 mb-4 font-mono">Certificate ID: {results.bundleCertificate.certificateId}</p>
              <button
                onClick={() => navigate(`/certificate/bundle/${results.bundleCertificate.certificateId}`)}
                className="w-full py-3 bg-white text-violet-700 rounded-xl font-black shadow-lg hover:bg-gray-100 transition-all"
              >
                View & Download Certificate
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Final fallback — should never reach here, but prevents black screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50 dark:bg-zinc-950">
      <AlertTriangle className="h-14 w-14 text-amber-400" />
      <h2 className="text-xl font-black text-gray-900 dark:text-white">Unexpected state</h2>
      <p className="text-gray-500">Something went wrong loading the quiz.</p>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
        Go Back
      </button>
    </div>
  );
};

export default QuizPlayerPage;
