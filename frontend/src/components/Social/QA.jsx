import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { HelpCircle, MessageCircle, Send, CheckCircle, Lock, Shield, User, Loader2, Info, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BASE_URL from '../../api/config';

const QA = ({ courseId, instructorId }) => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [askMode, setAskMode] = useState(false);

  // New question form
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');

  // Instructor answer form
  const [answeringId, setAnsweringId] = useState(null);
  const [answerContent, setAnswerContent] = useState('');

  const isInstructor = user?._id === instructorId;

  const fetchQuestions = async () => {
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/comm/qa/${courseId}`, cfg);
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching Q&A:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && user) {
      fetchQuestions();
    }
  }, [courseId, user]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/comm/qa`, {
        courseId,
        instructorId,
        title,
        question
      }, cfg);
      
      setQuestions([data, ...questions]);
      setTitle('');
      setQuestion('');
      setAskMode(false);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (qId) => {
    if (!answerContent.trim()) return;

    setSubmitting(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`${BASE_URL}/comm/qa/${qId}/answer`, {
        answer: answerContent
      }, cfg);
      
      setQuestions(questions.map(q => q._id === qId ? data : q));
      setAnswerContent('');
      setAnsweringId(null);
    } catch (error) {
      console.error('Error answering question:', error);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Q&A with Instructor</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Get expert answers to your questions.</p>
          </div>
        </div>
        
        {!askMode && !isInstructor && (
          <button 
            onClick={() => setAskMode(true)}
            className="group bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            Ask a Question <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        )}
      </div>

      {askMode && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Ask your instructor</h3>
            <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
               <Shield className="h-3 w-3" /> DIRECT
            </span>
          </div>
          <form onSubmit={handleAskQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question about?"
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Details</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Explain what you need help with in detail..."
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all h-40 font-bold text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4 font-bold">
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 shadow-lg shadow-indigo-500/20 disabled:bg-gray-400"
              >
                Submit Question
              </button>
              <button
                type="button"
                onClick={() => setAskMode(false)}
                className="px-8 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
             <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
             <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No questions yet.</p>
             <p className="text-gray-400 underline underline-offset-4 decoration-indigo-500/30">Don't be shy, your instructor is here to help!</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q._id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-lg overflow-hidden group hover:border-indigo-500 transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${q.isAnswered ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                      {q.isAnswered ? 'Answered' : 'Pending Response'}
                    </span>
                    {q.isPublic && (
                      <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Community Resource
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    Asked {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 transition-colors">{q.title}</h3>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-shrink-0">
                    {q.student?.image ? (
                        <img src={q.student.image} alt="Student" className="h-10 w-10 rounded-full border-2 border-indigo-100" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">?</div>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-zinc-800 italic">
                    "{q.question}"
                  </div>
                </div>

                {/* Answer section */}
                {q.isAnswered ? (
                  <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {q.instructor?.image ? (
                            <img src={q.instructor.image} alt="Instructor" className="h-12 w-12 rounded-2xl shadow-md border-2 border-green-100" />
                        ) : (
                            <div className="h-12 w-12 rounded-2xl bg-green-600 flex items-center justify-center font-bold text-white shadow-lg">
                                {q.instructor?.name?.charAt(0) || 'I'}
                            </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-black text-gray-900 dark:text-white">{q.instructor?.name}</h4>
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-black uppercase">Official Instructor</span>
                        </div>
                        <p className="bg-green-50 dark:bg-green-900/10 p-6 rounded-3xl text-gray-800 dark:text-gray-200 border-2 border-green-100 dark:border-green-900/30 leading-relaxed font-medium">
                          {q.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isInstructor ? (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 animate-in slide-in-from-top-4">
                    {answeringId === q._id ? (
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-600" /> Provide expert resolution
                            </h4>
                            <textarea
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                placeholder="Write your professional response here..."
                                className="w-full p-4 rounded-2xl border-2 border-green-500 bg-white dark:bg-zinc-950 outline-none transition-all h-32 font-bold text-gray-900 dark:text-white resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAnswerQuestion(q._id)}
                                    disabled={submitting || !answerContent.trim()}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black shadow-lg shadow-green-500/20 active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                                    Finalize Answer
                                </button>
                                <button
                                    onClick={() => { setAnsweringId(null); setAnswerContent(''); }}
                                    className="px-6 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setAnsweringId(q._id)}
                            className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-4 rounded-2xl font-black border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                            Reply to student <ArrowRight className="h-5 w-5" />
                        </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                    <Info className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300 underline decoration-dotted">The instructor is currently reviewing your question.</p>
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

export default QA;
