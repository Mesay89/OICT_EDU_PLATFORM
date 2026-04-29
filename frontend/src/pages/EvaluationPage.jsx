import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Award, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const EvaluationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [existingScore, setExistingScore] = useState(null);

  const [questions, setQuestions] = useState([
    {
      question: "What is the primary goal of this course?",
      options: ["Master the core concepts", "Just passing time", "Watching videos", "None of the above"],
      answer: 0
    },
    {
      question: "Which tool is emphasized in the curriculum?",
      options: ["Standard industry tools", "Legacy systems", "Manual process", "No tools used"],
      answer: 0
    }
  ]);

  const [userAnswers, setUserAnswers] = useState(new Array(2).fill(null));

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
            setCanTakeQuiz(progressData.progress >= 80);
            setExistingScore(progressData.quizScore);
            
            // Check if certificate already exists
            if (progressData.certificateIssued) {
              const { data: certData } = await axios.get(`${BASE_URL}/enrollments/${id}/certificate`, config);
              setCertificateData(certData);
              setSubmitted(true);
              setScore(progressData.quizScore);
            }

            // Fetch course quiz
            try {
              const { data: quizzes } = await axios.get(`${BASE_URL}/quiz/course/${id}`, config);
              if (quizzes && quizzes.length > 0 && quizzes[0].questions?.length > 0) {
                const fetchedQuestions = quizzes[0].questions.map(q => ({
                  _id: q._id,
                  question: q.text,
                  options: q.options,
                  answer: q.correct ?? 0
                }));
                setQuestions(fetchedQuestions);
                setUserAnswers(new Array(fetchedQuestions.length).fill(null));
              }
            } catch (qErr) {
              console.error('Error fetching course quiz', qErr);
            }
          } catch (error) {
            console.log('No progress data yet');
          }
        }
      } catch (error) {
        console.error('Error fetching course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndProgress();
  }, [id, user]);

  const handleSubmit = async () => {
    let corrected = 0;
    userAnswers.forEach((ans, idx) => {
      if (ans === questions[idx].answer) corrected++;
    });
    const quizScore = Math.round((corrected / questions.length) * 100);
    setScore(quizScore);

    // Submit to backend
    if (user && user.role === 'student') {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(
          `${BASE_URL}/enrollments/${id}/complete`,
          { quizScore },
          config
        );

        if (data.certificateIssued) {
          // Fetch certificate data
          const { data: certData } = await axios.get(`${BASE_URL}/enrollments/${id}/certificate`, config);
          setCertificateData(certData);
        }

        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting quiz:', error);
        alert(error.response?.data?.message || 'Failed to submit quiz');
      }
    } else {
      setSubmitted(true);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-indigo-600 font-semibold">Loading assessment...</div>;
  if (!course) return <div className="text-center py-20">Course not found</div>;

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen pb-20">
      <div className="bg-zinc-900 text-white p-6 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-indigo-400">
            <ChevronLeft className="h-5 w-5" /> Back to Player
          </button>
          <h1 className="font-bold text-xl">Final Evaluation: {course.title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-12">
        {!canTakeQuiz && !submitted ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 text-center">
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
        ) : !submitted ? (
          <div className="space-y-8">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Please answer all questions to complete the course and receive your certificate.</p>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] shadow-xl border-2 border-gray-100 dark:border-zinc-800 transition-all hover:shadow-2xl">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 leading-tight flex gap-4">
                  <span className="text-indigo-600">Q{qIdx + 1}.</span> {q.question}
                </h3>
                <div className="space-y-4">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => {
                        const newAns = [...userAnswers];
                        newAns[qIdx] = oIdx;
                        setUserAnswers(newAns);
                      }}
                      className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 group ${
                        userAnswers[qIdx] === oIdx 
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 ring-4 ring-indigo-500/10 shadow-lg' 
                        : 'border-gray-100 dark:border-zinc-800 hover:border-indigo-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        userAnswers[qIdx] === oIdx 
                        ? 'border-indigo-600 bg-indigo-600 scale-110' 
                        : 'border-gray-300 group-hover:border-indigo-400'
                      }`}>
                        {userAnswers[qIdx] === oIdx && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      </div>
                      <span className={`text-lg font-bold transition-colors ${userAnswers[qIdx] === oIdx ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={userAnswers.includes(null)}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-2xl font-bold text-xl shadow-lg transition-all"
            >
              Submit Evaluation
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 text-center">
            <div className={`${score >= 70 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-amber-100 dark:bg-amber-900/20'} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8`}>
              <Award className={`h-12 w-12 ${score >= 70 ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {score >= 70 ? 'Congratulations!' : 'Quiz Completed'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              You scored <span className={`${score >= 70 ? 'text-green-600' : 'text-amber-600'} font-bold`}>{score}%</span> on the final assessment.
            </p>

            {certificateData ? (
              <div className="mb-8">
                <button 
                  onClick={() => navigate(`/certificate/${id}`)}
                  className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-md transition-all"
                >
                  View Certificate
                </button>
              </div>
            ) : score >= 70 ? (
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
                  You need at least 70% to earn a certificate. You can retake the quiz to improve your score.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
              >
                Back to Dashboard
              </button>
              {score < 70 && (
                <button 
                  onClick={() => {
                    setSubmitted(false);
                    setUserAnswers(new Array(questions.length).fill(null));
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all"
                >
                  Retake Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPage;
