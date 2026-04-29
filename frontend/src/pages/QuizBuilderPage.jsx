import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen, Plus, Trash2, Eye, EyeOff, Shield, Clock, Shuffle,
  ChevronLeft, Save, CheckCircle, AlertCircle, Settings, Users, BarChart2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const QuizBuilderPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [tab, setTab] = useState('bank'); // bank | quizzes | analytics
  const [bankQuestions, setBankQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // New question form
  const [qForm, setQForm] = useState({
    type: 'mcq', text: '', options: ['', '', '', ''], correct: 0,
    tags: '', points: 1, explanation: ''
  });

  // New quiz form
  const [quizForm, setQuizForm] = useState({
    title: '', description: '', questions: [],
    shuffleQuestions: true, shuffleOptions: true, timeLimitMinutes: 0,
    timePerQuestion: 0, maxAttempts: 1, passingScore: 70,
    showResultsAfter: true, allowedWindowBlurs: 3,
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);

  const cfg = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => {
    const load = async () => {
      const [cRes, qRes, quizRes] = await Promise.all([
        axios.get(`${BASE_URL}/courses/${courseId}`),
        axios.get(`${BASE_URL}/quiz/questions/${courseId}`, cfg),
        axios.get(`${BASE_URL}/quiz/course/${courseId}`, cfg),
      ]);
      setCourseName(cRes.data.title);
      setBankQuestions(qRes.data);
      setQuizzes(quizRes.data);
    };
    load();
  }, [courseId]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ── Question Bank ─────────────────────────────────────────────────────────
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      courseId,
      type: qForm.type,
      text: qForm.text,
      options: qForm.type === 'mcq' ? qForm.options : ['True', 'False'],
      correct: Number(qForm.correct),
      tags: qForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      points: Number(qForm.points),
      explanation: qForm.explanation,
    };

    try {
      if (editingQuestionId) {
        const { data } = await axios.put(`${BASE_URL}/quiz/questions/${editingQuestionId}`, payload, cfg);
        setBankQuestions(prev => prev.map(q => q._id === editingQuestionId ? data : q));
        flash('✅ Question updated!');
      } else {
        const { data } = await axios.post(`${BASE_URL}/quiz/questions`, payload, cfg);
        setBankQuestions(prev => [data, ...prev]);
        flash('✅ Question added to bank!');
      }
      setQForm({ type: 'mcq', text: '', options: ['', '', '', ''], correct: 0, tags: '', points: 1, explanation: '' });
      setEditingQuestionId(null);
    } catch { flash('❌ Failed to save question.'); }
    setSaving(false);
  };

  const startEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    setQForm({
      type: q.type,
      text: q.text,
      options: q.options.length ? q.options : ['', '', '', ''],
      correct: q.correct,
      tags: q.tags?.join(', ') || '',
      points: q.points,
      explanation: q.explanation || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    await axios.delete(`${BASE_URL}/quiz/questions/delete/${id}`, cfg);
    setBankQuestions(prev => prev.filter(q => q._id !== id));
  };

  // ── Quizzes ───────────────────────────────────────────────────────────────
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (quizForm.questions.length === 0) { flash('❌ Select at least one question!'); return; }
    setSaving(true);
    try {
      if (editingQuizId) {
        const { data } = await axios.put(`${BASE_URL}/quiz/${editingQuizId}`, { ...quizForm, courseId }, cfg);
        setQuizzes(prev => prev.map(q => q._id === editingQuizId ? data : q));
        flash('✅ Quiz updated!');
      } else {
        const { data } = await axios.post(`${BASE_URL}/quiz`, { ...quizForm, courseId }, cfg);
        setQuizzes(prev => [data, ...prev]);
        flash('✅ Quiz created!');
      }
      setShowQuizForm(false);
      setEditingQuizId(null);
      setQuizForm({ title: '', description: '', questions: [], shuffleQuestions: true, shuffleOptions: true, timeLimitMinutes: 0, timePerQuestion: 0, maxAttempts: 1, passingScore: 70, showResultsAfter: true, allowedWindowBlurs: 3 });
    } catch { flash('❌ Failed to save quiz.'); }
    setSaving(false);
  };

  const startEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || '',
      questions: quiz.questions?.map(q => q._id || q) || [],
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      timeLimitMinutes: quiz.timeLimitMinutes,
      timePerQuestion: quiz.timePerQuestion,
      maxAttempts: quiz.maxAttempts,
      passingScore: quiz.passingScore,
      showResultsAfter: quiz.showResultsAfter,
      allowedWindowBlurs: quiz.allowedWindowBlurs
    });
    setShowQuizForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async (quizId) => {
    const { data } = await axios.put(`${BASE_URL}/quiz/${quizId}/publish`, {}, cfg);
    setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, isPublished: data.isPublished } : q));
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz?')) return;
    await axios.delete(`${BASE_URL}/quiz/${quizId}`, cfg);
    setQuizzes(prev => prev.filter(q => q._id !== quizId));
  };

  const toggleQInQuiz = (qId) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.includes(qId)
        ? prev.questions.filter(x => x !== qId)
        : [...prev.questions, qId],
    }));
  };

  if (!user || user.role !== 'instructor') return <div>Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <div className="bg-zinc-900 text-white px-8 py-5 flex items-center justify-between border-b border-zinc-800">
        <button onClick={() => navigate('/instructor/courses')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <div>
          <h1 className="text-xl font-black text-center">Quiz Builder</h1>
          <p className="text-xs text-indigo-400 text-center font-bold">{courseName}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Flash */}
      {msg && (
        <div className={`mx-auto max-w-4xl mt-4 px-4 py-3 rounded-xl font-bold text-sm text-center ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-zinc-800">
          {[['bank', BookOpen, 'Question Bank'], ['quizzes', Shield, 'Quizzes'], ['analytics', BarChart2, 'Results']].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-3 font-black border-b-4 transition-all ${tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── QUESTION BANK ── */}
        {tab === 'bank' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add Question Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-md border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" /> {editingQuestionId ? 'Edit Question' : 'Add to Bank'}
                </span>
                {editingQuestionId && (
                  <button onClick={() => {
                    setEditingQuestionId(null);
                    setQForm({ type: 'mcq', text: '', options: ['', '', '', ''], correct: 0, tags: '', points: 1, explanation: '' });
                  }} className="text-xs text-red-500 font-bold hover:underline">Cancel Edit</button>
                )}
              </h2>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Question Type</label>
                  <select value={qForm.type} onChange={e => setQForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold">
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="truefalse">True / False</option>
                    <option value="essay">Essay (written)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Question Text</label>
                  <textarea required rows={3} value={qForm.text} onChange={e => setQForm(p => ({ ...p, text: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Enter your question..." />
                </div>

                {qForm.type === 'mcq' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-gray-500">Options (tick the correct one)</label>
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="radio" name="correct" checked={qForm.correct === i} onChange={() => setQForm(p => ({ ...p, correct: i }))}
                          className="w-4 h-4 text-indigo-600" />
                        <input value={opt} required onChange={e => {
                            const opts = [...qForm.options]; opts[i] = e.target.value;
                            setQForm(p => ({ ...p, options: opts }));
                          }}
                          className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
                          placeholder={`Option ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}

                {qForm.type === 'truefalse' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Correct Answer</label>
                    <div className="flex gap-4">
                      {['True', 'False'].map((v, i) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="tf" checked={qForm.correct === i} onChange={() => setQForm(p => ({ ...p, correct: i }))} className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Points</label>
                    <input type="number" min={1} value={qForm.points} onChange={e => setQForm(p => ({ ...p, points: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tags (comma separated)</label>
                    <input value={qForm.tags} onChange={e => setQForm(p => ({ ...p, tags: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                      placeholder="topic1, topic2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Explanation (shown after submission)</label>
                  <input value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    placeholder="Why is this the answer?" />
                </div>

                <button type="submit" disabled={saving}
                  className={`w-full py-3 rounded-xl font-black transition-all disabled:opacity-60 ${editingQuestionId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                  {saving ? 'Saving...' : editingQuestionId ? 'Update Question' : '+ Add to Bank'}
                </button>
              </form>
            </div>

            {/* Bank List */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" /> Saved Questions ({bankQuestions.length})
              </h2>
              {bankQuestions.length === 0 && <p className="text-gray-400 text-sm">No questions yet. Add your first one!</p>}
              {bankQuestions.map(q => (
                <div key={q._id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${q.type === 'mcq' ? 'bg-indigo-100 text-indigo-700' : q.type === 'essay' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {q.type === 'truefalse' ? 'T/F' : q.type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                        {q.tags?.map(t => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{t}</span>)}
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{q.text}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button onClick={() => startEditQuestion(q)} className="text-indigo-400 hover:text-indigo-600">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QUIZZES ── */}
        {tab === 'quizzes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Course Quizzes</h2>
              <button onClick={() => setShowQuizForm(!showQuizForm)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition-all">
                <Plus className="h-4 w-4" /> New Quiz
              </button>
            </div>

            {/* Create Quiz Panel */}
            {showQuizForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-200 dark:border-zinc-800 p-8">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-600" /> {editingQuizId ? 'Edit Quiz' : 'Configure New Quiz'}
                  </span>
                  {editingQuizId && (
                    <button onClick={() => {
                      setEditingQuizId(null);
                      setQuizForm({ title: '', description: '', questions: [], shuffleQuestions: true, shuffleOptions: true, timeLimitMinutes: 0, timePerQuestion: 0, maxAttempts: 1, passingScore: 70, showResultsAfter: true, allowedWindowBlurs: 3 });
                      setShowQuizForm(false);
                    }} className="text-xs text-red-500 font-bold hover:underline">Cancel Edit</button>
                  )}
                </h3>
                <form onSubmit={handleCreateQuiz} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quiz Title *</label>
                      <input required value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold"
                        placeholder="Midterm Quiz..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Time Limit (min, 0 = unlimited)</label>
                      <input type="number" min={0} value={quizForm.timeLimitMinutes}
                        onChange={e => setQuizForm(p => ({ ...p, timeLimitMinutes: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Time Per Question (sec, 0 = unlimited)</label>
                      <input type="number" min={0} value={quizForm.timePerQuestion}
                        onChange={e => setQuizForm(p => ({ ...p, timePerQuestion: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Attempts</label>
                      <input type="number" min={1} value={quizForm.maxAttempts}
                        onChange={e => setQuizForm(p => ({ ...p, maxAttempts: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Passing Score (%)</label>
                      <input type="number" min={0} max={100} value={quizForm.passingScore}
                        onChange={e => setQuizForm(p => ({ ...p, passingScore: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Tab Switches (Anti-cheat)</label>
                      <input type="number" min={0} value={quizForm.allowedWindowBlurs}
                        onChange={e => setQuizForm(p => ({ ...p, allowedWindowBlurs: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold" />
                    </div>
                  </div>

                  {/* Anti-cheat toggles */}
                  <div className="flex flex-wrap gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/20">
                    <h4 className="w-full text-xs font-black uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1"><Shield className="h-3 w-3" /> Anti-Cheat Settings</h4>
                    {[
                      ['shuffleQuestions', 'Shuffle Question Order'],
                      ['shuffleOptions',   'Shuffle MCQ Options'],
                      ['showResultsAfter', 'Show Answers After Submit'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={quizForm[key]} onChange={e => setQuizForm(p => ({ ...p, [key]: e.target.checked }))}
                          className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Question picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      Select Questions from Bank ({quizForm.questions.length} selected)
                    </label>
                    {bankQuestions.length === 0 && <p className="text-sm text-gray-400">Add questions to the bank first.</p>}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {bankQuestions.map(q => (
                        <label key={q._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${quizForm.questions.includes(q._id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300'}`}>
                          <input type="checkbox" checked={quizForm.questions.includes(q._id)} onChange={() => toggleQInQuiz(q._id)} className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-bold text-gray-900 dark:text-white flex-1">{q.text}</span>
                          <span className="text-xs text-gray-500">{q.points}pt</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowQuizForm(false)} className="flex-1 py-3 bg-gray-200 dark:bg-zinc-800 rounded-xl font-black hover:bg-gray-300 dark:hover:bg-zinc-700">Cancel</button>
                    <button type="submit" disabled={saving} className={`flex-1 py-3 ${editingQuizId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-xl font-black shadow-md disabled:opacity-60 flex items-center justify-center gap-2`}>
                      <Save className="h-4 w-4" /> {saving ? 'Saving...' : editingQuizId ? 'Update Quiz' : 'Create Quiz'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quiz List */}
            <div className="space-y-4">
              {quizzes.length === 0 && <div className="text-center py-12 text-gray-400"><Shield className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-bold">No quizzes yet</p></div>}
              {quizzes.map(quiz => (
                <div key={quiz._id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-gray-900 dark:text-white text-lg">{quiz.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-black uppercase ${quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {quiz.isPublished ? '● Live' : '○ Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                        <span><BookOpen className="inline h-3 w-3 mr-1" />{quiz.questions?.length || 0} questions</span>
                        <span><Clock className="inline h-3 w-3 mr-1" />{quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} min` : 'No limit'}</span>
                        <span><Shuffle className="inline h-3 w-3 mr-1" />{quiz.shuffleQuestions ? 'Shuffled' : 'Fixed order'}</span>
                        <span><Shield className="inline h-3 w-3 mr-1" />Max {quiz.allowedWindowBlurs} blurs</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditQuiz(quiz)}
                        className="px-4 py-2 rounded-xl font-black text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all">
                        <Save className="inline h-3 w-3 mr-1" />Edit
                      </button>
                      <button onClick={() => handlePublish(quiz._id)}
                        className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${quiz.isPublished ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                        {quiz.isPublished ? <><EyeOff className="inline h-3 w-3 mr-1" />Unpublish</> : <><Eye className="inline h-3 w-3 mr-1" />Publish</>}
                      </button>
                      <button onClick={() => handleDelete(quiz._id)}
                        className="px-4 py-2 rounded-xl font-black text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-all">
                        <Trash2 className="inline h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS (placeholder) ── */}
        {tab === 'analytics' && (
          <div className="text-center py-16">
            <BarChart2 className="h-16 w-16 mx-auto mb-4 text-indigo-300" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Results</h2>
            <p className="text-gray-500 mb-8">View student attempts for each quiz in this course.</p>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              {quizzes.map(quiz => (
                <div key={quiz._id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">{quiz.questions?.length || 0} questions · Passing: {quiz.passingScore}%</p>
                  </div>
                  <button
                    onClick={() => navigate(`/quiz/${quiz._id}/results`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">
                    View Attempts
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBuilderPage;
