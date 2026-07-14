import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Award, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const EvaluationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | check | info | attempt | results
  const [score, setScore] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [existingScore, setExistingScore] = useState(null);

  // Quiz metadata from backend
  const [quizMeta, setQuizMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // ── Anti-cheat & Timers ───────────────────────────────────────────────────
  const [blurCount, setBlurCount] = useState(0);
  const [blurWarning, setBlurWarning] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [allowedBlurs, setAllowedBlurs] = useState(3);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(null);
  const [questionSecsLeft, setQuestionSecsLeft] = useState(null);
  const totalTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const attemptIdRef = useRef(null);
  const cfg = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        // Fetch course
        const { data: courseData } = await axios.get(`${BASE_URL}/courses/${id}`);
        setCourse(courseData);

        // Fetch progress if user is logged in
        if (user && user.role === 'student') {
          try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data: progressData } = await axios.get(`${BASE_URL}/enrollments/${id}/progress`, config);
            
            setCourseProgress(progressData.progress || 0);
            const canTake = progressData.progress >= 80;
            setCanTakeQuiz(canTake);
            setExistingScore(progressData.quizScore);
            
            // Check if certificate already exists
            if (progressData.certificateIssued) {
              const { data: certData } = await axios.get(`${BASE_URL}/enrollments/${id}/certificate`, config);
              setCertificateData(certData);
              setSubmitted(true);
              setScore(progressData.quizScore);
              setPhase('results');
            } else if (canTake) {
              // Fetch course quiz metadata
              try {
                const { data: quizzes } = await axios.get(`${BASE_URL}/quiz/course/${id}`, config);
                if (quizzes && quizzes.length > 0) {
                  const quiz = quizzes[0];
                  setQuizMeta(quiz);
                  setAllowedBlurs(quiz.allowedWindowBlurs ?? 3);
                  
                  // Store questions structure (without answers)
                  if (quiz.questions?.length > 0) {
                    const fetchedQuestions = quiz.questions.map(q => ({
                      _id: q._id,
                      question: q.text,
                      options: q.options,
                      type: q.type,
                      points: q.points,
                      answer: q.correct ?? 0  // Only for grading after submit
                    }));
                    setQuestions(fetchedQuestions);
                    setUserAnswers(new Array(fetchedQuestions.length).fill(null));
                  }
                }
              } catch (qErr) {
                console.error('Error fetching course quiz', qErr);
              }
              setPhase('info');
            } else {
              setPhase('check');
            }
          } catch (error) {
            console.log('No progress data yet');
            setPhase('check');
          }
        } else {
          setPhase('check');
        }
      } catch (error) {
        console.error('Error fetching course');
        setPhase('check');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndProgress();
  }, [id, user]);

  // ── Start Quiz (from info screen) ─────────────────────────────────────────
  const handleStartQuiz = () => {
    // Generate a local attemptId for tracking
    attemptIdRef.current = `attempt-${Date.now()}`;
    setPhase('attempt');
    setBlurCount(0);
    setFlagged(false);

    // Start total timer if configured
    if (quizMeta?.timeLimitMinutes > 0) {
      setTotalSecondsLeft(quizMeta.timeLimitMinutes * 60);
    }

    // Start first question timer if configured
    if (quizMeta?.timePerQuestion > 0 && questions.length > 0) {
      setQuestionSecsLeft(quizMeta.timePerQuestion);
    }
  };

  // ── Anti-cheat: tab/window blur ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt') return;
    
    const handleBlur = async () => {
      console.log('Tab blur detected in EvaluationPage');
      setBlurCount(c => {
        const newCount = c + 1;
        console.log(`Blur count: ${newCount}, Allowed: ${allowedBlurs}`);
        
        if (newCount > allowedBlurs) {
          console.log('Exceeded allowed blurs, auto-submitting and flagging');
          setFlagged(true);
          // Auto-submit after short delay
          setTimeout(() => handleSubmit(true), 500);
        }
        return newCount;
      });
      setBlurWarning(true);
      setTimeout(() => setBlurWarning(false), 4000);
    };
    
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [phase, allowedBlurs]);

  // ── Total timer countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt' || totalSecondsLeft === null) return;
    if (totalSecondsLeft <= 0) { 
      handleSubmit(true); 
      return; 
    }
    totalTimerRef.current = setTimeout(() => setTotalSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(totalTimerRef.current);
  }, [totalSecondsLeft, phase]);

  // ── Per-question timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt' || questionSecsLeft === null) return;
    if (questionSecsLeft <= 0) {
      // Auto-advance to next question
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(i => i + 1);
      } else {
        // Last question, auto-submit
        handleSubmit(true);
      }
      return;
    }
    questionTimerRef.current = setTimeout(() => setQuestionSecsLeft(s => s - 1), 1000);
    return () => clearTimeout(questionTimerRef.current);
  }, [questionSecsLeft, phase, currentQuestionIdx, questions.length]);

  // Reset per-question timer when question changes
  useEffect(() => {
    if (phase !== 'attempt' || !quizMeta) return;
    if (quizMeta.timePerQuestion > 0) {
      setQuestionSecsLeft(quizMeta.timePerQuestion);
    } else {
      setQuestionSecsLeft(null);
    }
  }, [currentQuestionIdx, phase, quizMeta]);

  const handleSubmit = async (autoSubmit = false) => {
    // Stop all timers
    if (totalTimerRef.current) clearTimeout(totalTimerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);

    let corrected = 0;
    userAnswers.forEach((ans, idx) => {
      if (ans === questions[idx].answer) corrected++;
    });
    const quizScore = Math.round((corrected / questions.length) * 100);
    setScore(quizScore);

    const finalFlagged = autoSubmit || flagged || blurCount > allowedBlurs;
    console.log('Submitting evaluation with blur count:', blurCount, 'Flagged:', finalFlagged);

    // Submit to backend
    if (user && user.role === 'student') {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(
          `${BASE_URL}/enrollments/${id}/complete`,
          { quizScore, windowBlurCount: blurCount, flagged: finalFlagged },
          config
        );

        if (data.certificateIssued) {
          // Fetch certificate data
          const { data: certData } = await axios.get(`${BASE_URL}/enrollments/${id}/certificate`, config);
          setCertificateData(certData);
        }

        setSubmitted(true);
        setPhase('results');
      } catch (error) {
        console.error('Error submitting quiz:', error);
        alert(error.response?.data?.message || 'Failed to submit quiz');
      }
    } else {
      setSubmitted(true);
      setPhase('results');
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-indigo-600 font-semibold">Loading assessment...</div>;
  if (!course) return <div className="text-center py-20">Course not found</div>;

  // ── INFO SCREEN (Rules before starting) ───────────────────────────────────
  if (phase === 'info') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Final Evaluation</h1>
          <p className="text-gray-500 mb-6">This quiz is monitored for academic integrity.</p>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6 text-left space-y-2">
            <p className="font-black text-amber-800 dark:text-amber-400 text-sm">⚠️ Important Rules</p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc pl-4">
              <li>Do not switch tabs or open new windows</li>
              <li>Maximum <strong>{allowedBlurs}</strong> tab switches allowed</li>
              <li>Each tab switch will be logged and reported</li>
              <li>Exceeding the limit will auto-submit your quiz</li>
              {quizMeta?.timeLimitMinutes > 0 && (
                <li>Total time limit: <strong>{quizMeta.timeLimitMinutes}</strong> minutes</li>
              )}
              {quizMeta?.timePerQuestion > 0 && (
                <li>Time per question: <strong>{quizMeta.timePerQuestion}</strong> seconds</li>
              )}
              <li>Do not refresh the page during the quiz</li>
              <li>Answer all questions to complete the evaluation</li>
            </ul>
          </div>

          {existingScore !== null && (
            <div className="mb-6 text-sm text-gray-500 bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
              <p className="font-bold">Previous Score: {existingScore}%</p>
              <p className="text-xs mt-1">You can retake to improve your score</p>
            </div>
          )}

          <div className="mb-6 flex justify-around text-sm font-bold text-gray-700 dark:text-gray-300">
            <p>📝 Questions: {questions.length}</p>
            <p>✅ Pass: {quizMeta?.passingScore || 70}%</p>
            {quizMeta?.maxAttempts && <p>🔄 Max Attempts: {quizMeta.maxAttempts}</p>}
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg transition-all"
          >
            Start Evaluation
          </button>
          <button
            onClick={() => navigate(`/player/${id}`)}
            className="w-full mt-3 py-3 text-gray-500 font-bold hover:text-gray-700"
          >
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  // ── CHECK SCREEN (Progress < 80%) ─────────────────────────────────────────
  if (phase === 'check' && !canTakeQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 text-center max-w-lg">
          <div className="bg-amber-100 dark:bg-amber-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="h-12 w-12 text-amber-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Complete More Videos</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            You need to complete at least <span className="text-indigo-600 font-bold">80%</span> of the course videos before taking the final quiz.
          </p>
          <div className="bg-gray-100 dark:bg-zinc-950 p-6 rounded-2xl mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Current Progress</p>
            <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-4 mb-2">
              <div 
                className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${courseProgress}%` }}
              ></div>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{courseProgress}%</p>
          </div>
          <button 
            onClick={() => navigate(`/player/${id}`)}
            className="py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-md transition-all"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  // ── ATTEMPT PHASE (Taking Quiz) ───────────────────────────────────────────
  if (phase === 'attempt') {
    const q = questions[currentQuestionIdx];
    const ans = userAnswers[currentQuestionIdx];
    const progress = Math.round(((currentQuestionIdx + 1) / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
        {/* Anti-cheat warning banner */}
        {blurWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 font-black text-sm animate-in slide-in-from-top duration-300">
            ⚠️ TAB SWITCH DETECTED! (Count: {blurCount}/{allowedBlurs}) — This has been logged by the system.
          </div>
        )}

        {/* Top bar */}
        <div className={`bg-zinc-900 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800 ${blurWarning ? 'mt-11' : ''}`}>
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-indigo-400" />
            <span className="font-black">Question {currentQuestionIdx + 1} / {questions.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {blurCount > 0 && (
              <div className={`flex items-center gap-1 text-sm font-black ${blurCount > allowedBlurs ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                <AlertTriangle className="h-4 w-4" /> {blurCount} / {allowedBlurs} switches
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
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 leading-snug flex gap-4">
              <span className="text-indigo-600">Q{currentQuestionIdx + 1}.</span> {q?.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {q?.options?.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => {
                    const newAns = [...userAnswers];
                    newAns[currentQuestionIdx] = oIdx;
                    setUserAnswers(newAns);
                  }}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 group ${
                    ans === oIdx 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 ring-4 ring-indigo-500/10 shadow-lg' 
                    : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    ans === oIdx 
                    ? 'border-indigo-600 bg-indigo-600 scale-110' 
                    : 'border-gray-300 group-hover:border-indigo-400'
                  }`}>
                    {ans === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-lg font-bold ${ans === oIdx ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setCurrentQuestionIdx(i => Math.max(0, i - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-2 px-5 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-white rounded-xl font-bold disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(i => i + 1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition-all"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={userAnswers.includes(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-black shadow-md transition-all"
                >
                  <CheckCircle className="h-4 w-4" /> Submit Evaluation
                </button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestionIdx(i)}
                  className={`w-7 h-7 rounded-full text-xs font-black transition-all ${
                    i === currentQuestionIdx 
                    ? 'bg-indigo-600 text-white scale-110' 
                    : userAnswers[i] !== null && userAnswers[i] !== undefined
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ──────────────────────────────────────────────────────────
  if (phase === 'results') {
    const passingScore = quizMeta?.passingScore || 70;
    const passed = score >= passingScore;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-10 max-w-2xl w-full text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
            {passed ? <CheckCircle className="h-12 w-12 text-emerald-600" /> : <XCircle className="h-12 w-12 text-amber-500" />}
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {passed ? '🎉 Congratulations!' : '📚 Quiz Completed'}
          </h1>
          <p className="text-5xl font-black mt-4 mb-2 text-indigo-600">{score}%</p>
          <p className="text-gray-500 mb-6">{passed ? 'Excellent work!' : `You need ${passingScore}% to pass. You can retake to improve.`}</p>

          {flagged && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-red-700 dark:text-red-400 text-sm font-black">⚠️ Integrity Flag</p>
              <p className="text-red-600 text-xs mt-1">Your attempt has been flagged for review: {blurCount} tab switch{blurCount !== 1 ? 'es' : ''} detected (Limit: {allowedBlurs}).</p>
            </div>
          )}

          {certificateData ? (
            <div className="mb-8">
              <button 
                onClick={() => navigate(`/certificate/${id}`)}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-md transition-all"
              >
                View Certificate 🎓
              </button>
            </div>
          ) : passed ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl mb-8 border border-amber-200 dark:border-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Certificate generation in progress. Please refresh the page in a moment.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl mb-8 border border-amber-200 dark:border-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                You need at least {passingScore}% to earn a certificate. You can retake the quiz to improve your score.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-4 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
            >
              Dashboard
            </button>
            {!passed && (
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setPhase('info');
                  setUserAnswers(new Array(questions.length).fill(null));
                  setCurrentQuestionIdx(0);
                  setBlurCount(0);
                  setFlagged(false);
                  setTotalSecondsLeft(null);
                  setQuestionSecsLeft(null);
                }}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any unexpected state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default EvaluationPage;
