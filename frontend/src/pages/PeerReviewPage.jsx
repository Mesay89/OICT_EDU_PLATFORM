import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';
import { ChevronLeft, Plus, CheckCircle, Clock, Save, FileText, Send, User, Trash2 } from 'lucide-react';

const PeerReviewPage = () => {
  const { courseId: paramCourseId } = useParams();
  const [searchParams] = useSearchParams();
  const queryBundleId = searchParams.get('bundleId');
  const queryCourseId = searchParams.get('courseId');
  
  // Determine targetId and type - prioritize query params, ignore "undefined" string
  const isBundle = !!queryBundleId;
  const targetId = queryBundleId || queryCourseId || (paramCourseId !== 'undefined' ? paramCourseId : null);
  
  console.log('PeerReview Page Init:', { paramCourseId, queryBundleId, queryCourseId, targetId, isBundle });
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  
  // INSTRUCTOR STATES
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    title: '', assignmentId: '', instructions: '', reviewsRequired: 2, dueDate: '',
    rubric: [{ criterion: 'Clarity', maxPoints: 10 }]
  });
  const [taskResults, setTaskResults] = useState(null);
  const [viewingResultsFor, setViewingResultsFor] = useState(null);

  // STUDENT STATES
  const [studentTasks, setStudentTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [peersToReview, setPeersToReview] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  
  // REVIEWING STATES
  const [activeReviewee, setActiveReviewee] = useState(null);
  const [rubricScores, setRubricScores] = useState({});
  const [overallComment, setOverallComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInstructor = course?.instructor?._id === user?._id;

  useEffect(() => {
    if (!user || (!targetId && !user)) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Always fetch course/bundle details
        const endpoint = isBundle ? `${BASE_URL}/bundles/${targetId}` : `${BASE_URL}/courses/${targetId}`;
        const targetRes = await axios.get(endpoint, cfg);
        setCourse(targetRes.data); // We store bundle data in 'course' state variable for simplicity
        const isInst = targetRes.data.instructor?._id === user._id;

        if (isInst) {
          // Fetch Instructor Data
          const reviewEndpoint = isBundle ? `${BASE_URL}/peer-review/bundle/${targetId}` : `${BASE_URL}/peer-review/course/${targetId}`;
          const assignEndpoint = isBundle ? `${BASE_URL}/lms/bundles/${targetId}/assignments` : `${BASE_URL}/lms/courses/${targetId}/assignments`;
          
          console.log('Fetching assignments from:', assignEndpoint);
          
          const [tasksRes, asgnRes] = await Promise.all([
            axios.get(reviewEndpoint, cfg),
            axios.get(assignEndpoint, cfg).catch((err) => {
              console.error('Failed to fetch assignments:', err.response?.data || err.message);
              return {data: []};
            })
          ]);
          
          console.log('Assignments fetched:', asgnRes.data.length, asgnRes.data);
          
          setTasks(tasksRes.data);
          setAssignments(asgnRes.data);
        } else {
          // Fetch Student Data
          const studentEndpoint = isBundle ? `${BASE_URL}/peer-review/my-tasks/bundle/${targetId}` : `${BASE_URL}/peer-review/my-tasks/${targetId}`;
          const [tasksRes] = await Promise.all([
            axios.get(studentEndpoint, cfg),
          ]);
          setStudentTasks(tasksRes.data);
        }
      } catch (err) {
        console.error("Error fetching peer reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [targetId, isBundle, user]);

  // ── INSTRUCTOR ACTIONS ──
  const handleAddRubricRow = () => {
    setForm({ ...form, rubric: [...form.rubric, { criterion: '', maxPoints: 10 }] });
  };
  
  const handleRemoveRubricRow = (idx) => {
    const r = [...form.rubric];
    r.splice(idx, 1);
    setForm({ ...form, rubric: r });
  };
  
  const handleRubricChange = (idx, field, val) => {
    const r = [...form.rubric];
    r[idx][field] = val;
    setForm({ ...form, rubric: r });
  };

  const fetchResults = async (taskId) => {
    try {
      setLoading(true);
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/peer-review/${taskId}/submissions`, cfg);
      setTaskResults(data);
      setViewingResultsFor(taskId);
    } catch (err) {
      alert("Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payload = {
        title: form.title,
        assignmentId: form.assignmentId,
        instructions: form.instructions,
        reviewsRequired: parseInt(form.reviewsRequired) || 2,
        dueDate: form.dueDate || undefined,
        rubric: form.rubric
      };

      if (isBundle) {
        payload.bundleId = targetId;
      } else {
        payload.courseId = targetId;
      }

      await axios.post(`${BASE_URL}/peer-review`, payload, cfg);
      
      alert("Peer review task scheduled!");
      setShowCreateForm(false);
      setForm({ title: '', assignmentId: '', instructions: '', reviewsRequired: 2, dueDate: '', rubric: [{ criterion: 'Clarity', maxPoints: 10 }]});
      
      const reviewEndpoint = isBundle ? `${BASE_URL}/peer-review/bundle/${targetId}` : `${BASE_URL}/peer-review/course/${targetId}`;
      const { data } = await axios.get(reviewEndpoint, cfg);
      setTasks(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (taskId) => {
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(`${BASE_URL}/peer-review/${taskId}/publish`, {}, cfg);
      setTasks(tasks.map(t => t._id === taskId ? { ...t, isPublished: res.data.isPublished } : t));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // ── STUDENT ACTIONS ──
  const loadTaskDetails = async (task) => {
    setSelectedTask(task);
    setActiveReviewee(null);
    setRubricScores({});
    setOverallComment('');
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const [peersRes, feedbackRes] = await Promise.all([
        axios.get(`${BASE_URL}/peer-review/${task._id}/peers-to-review`, cfg),
        axios.get(`${BASE_URL}/peer-review/${task._id}/my-feedback`, cfg)
      ]);
      setPeersToReview(peersRes.data);
      setMyFeedback(feedbackRes.data);
    } catch (err) {
      alert('Error loading task details');
    }
  };

  const startReviewing = (peer) => {
    setActiveReviewee(peer);
    const initialScores = {};
    selectedTask.rubric.forEach(r => initialScores[r.criterion] = 0);
    setRubricScores(initialScores);
    setOverallComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    // Validate scores are not exceeding max
    for (const row of selectedTask.rubric) {
      if (rubricScores[row.criterion] > row.maxPoints) {
        return alert(`Score for "${row.criterion}" exceeds max points of ${row.maxPoints}`);
      }
      if (rubricScores[row.criterion] < 0) {
        return alert(`Score for "${row.criterion}" cannot be negative`);
      }
    }

    try {
      setSubmitting(true);
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payloadRubric = selectedTask.rubric.map(row => ({
        criterion: row.criterion,
        score: rubricScores[row.criterion] || 0
      }));

      await axios.post(`${BASE_URL}/peer-review/${selectedTask._id}/submit`, {
        revieweeId: activeReviewee.revieweeId,
        rubricScores: payloadRubric,
        overallComment
      }, cfg);

      alert("Review submitted successfully!");
      // reload peers
      loadTaskDetails(selectedTask);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-indigo-600 font-bold">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition font-bold mb-4">
          <ChevronLeft className="h-5 w-5" /> Back
        </button>

        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <User className="h-8 w-8 text-indigo-200" /> Peer Review System
            </h1>
            <p className="font-medium text-indigo-200 uppercase tracking-widest text-xs">{course?.title || 'Course'}</p>
          </div>
          {isInstructor && (
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow drop-shadow flex items-center gap-2"
            >
              {showCreateForm ? 'Cancel' : <><Plus className="h-5 w-5" /> New Event</>}
            </button>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            INSTRUCTOR VIEW
        ───────────────────────────────────────────────────────────────────────────── */}
        {isInstructor && (
          <div className="space-y-8 animate-in fade-in">
            {showCreateForm && (
              <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-100 dark:border-indigo-900 rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                   <Plus className="h-5 w-5 text-indigo-500" /> Create Peer Review Event
                </h2>
                <form onSubmit={handleCreateTask} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-2">Event Title</label>
                      <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-2">Linked Assignment</label>
                      <select required value={form.assignmentId} onChange={e=>setForm({...form, assignmentId: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white">
                        <option value="" disabled>Select an assignment...</option>
                        {assignments.length === 0 ? (
                          <option value="" disabled>No assignments available</option>
                        ) : (
                          assignments.map(a => (
                            <option key={a._id} value={a._id}>
                              {a.title} {a.module ? `(Module ${a.module})` : ''} {a.status !== 'approved' ? `[${a.status}]` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      {assignments.length === 0 && (
                        <p className="text-xs text-red-500 mt-2 font-bold">
                          ⚠️ No assignments found. Please create an assignment first.
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} loaded
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-2">Reviews Required Per Student</label>
                      <input type="number" min="1" required value={form.reviewsRequired} onChange={e=>setForm({...form, reviewsRequired: parseInt(e.target.value) || 2})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-2">Due Date</label>
                      <input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Instructions</label>
                    <textarea value={form.instructions} onChange={e=>setForm({...form, instructions: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 h-24 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white resize-none" placeholder="Provide instructions for the reviewers..."></textarea>
                  </div>

                  {/* Rubric Builder */}
                  <div className="bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <h3 className="font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                      Grading Rubric
                      <button type="button" onClick={handleAddRubricRow} className="text-sm px-3 py-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded font-bold hover:bg-slate-300 transition">+ Add Row</button>
                    </h3>
                    <div className="space-y-3">
                      {form.rubric.map((r, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input required placeholder="Criterion (e.g. Code Quality)" value={r.criterion} onChange={e=>handleRubricChange(i, 'criterion', e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white" />
                          <input required type="number" min="1" placeholder="Max Points" value={r.maxPoints} onChange={e=>handleRubricChange(i, 'maxPoints', Number(e.target.value))} className="w-32 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 dark:text-white" />
                          {form.rubric.length > 1 && (
                            <button type="button" onClick={() => handleRemoveRubricRow(i)} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Trash2 className="h-5 w-5"/></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button disabled={submitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Deploy Event'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.length === 0 && <p className="text-gray-500 col-span-full text-center py-12 font-bold">No events created yet.</p>}
              {tasks.map(task => (
                <div key={task._id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                   <div>
                     <div className="mb-4 flex items-start justify-between">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white">{task.title}</h3>
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${task.isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {task.isPublished ? 'Published' : 'Draft'}
                        </span>
                     </div>
                     <p className="text-sm font-bold text-gray-500 mb-1">Assures: {task.assignment?.title || 'Unknown'}</p>
                     <p className="text-sm font-bold text-gray-500 mb-4">{task.reviewsRequired} reviews required per student</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => togglePublish(task._id)}
                       className={`flex-1 py-2 rounded-xl font-black text-sm transition-all ${task.isPublished ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-400' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400'}`}
                     >
                       {task.isPublished ? 'Unpublish' : 'Publish'}
                     </button>
                     <button 
                       onClick={() => fetchResults(task._id)}
                       className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-xl font-black text-sm"
                     >
                       Results
                     </button>
                   </div>
                </div>
              ))}
            </div>

            {viewingResultsFor && taskResults && (
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border-2 border-emerald-100 dark:border-emerald-900 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Detailed Grading Results</h2>
                  <button onClick={() => {setViewingResultsFor(null); setTaskResults(null);}} className="text-gray-400 hover:text-gray-600 font-bold uppercase text-xs tracking-widest">Close Results</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b dark:border-zinc-800">
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Reviewer</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Reviewee</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Scores</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Overall Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800">
                      {taskResults.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-gray-500 font-bold italic">No reviews submitted yet.</td></tr>}
                      {taskResults.map(res => (
                        <tr key={res._id}>
                          <td className="py-4 font-bold text-gray-900 dark:text-white">{res.reviewer?.name}</td>
                          <td className="py-4 font-bold text-gray-600 dark:text-zinc-400">{res.reviewee?.name}</td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              {res.rubricScores.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black">
                                  {s.criterion}: {s.score}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-sm italic text-gray-500 dark:text-zinc-400 max-w-xs truncate" title={res.overallComment}>
                            "{res.overallComment}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────────
            STUDENT VIEW
        ───────────────────────────────────────────────────────────────────────────── */}
        {!isInstructor && !selectedTask && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Active Peer Review Tasks</h2>
            {studentTasks.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold text-lg">No peer reviews assigned at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentTasks.map(task => (
                  <div key={task._id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all" onClick={() => loadTaskDetails(task)}>
                     <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">{task.title}</h3>
                     <p className="text-sm font-bold text-gray-500 mb-4">Required Reviews: {task.reviewsRequired}</p>
                     <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
                       Open Task <ChevronLeft className="h-4 w-4 rotate-180" />
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isInstructor && selectedTask && (
          <div className="animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedTask(null)} className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow font-bold text-gray-600"><ChevronLeft className="h-5 w-5"/></button>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedTask.title}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: List of peers & my feedback */}
               <div className="space-y-6">
                 <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                   <h3 className="font-black text-lg mb-4 text-gray-900 dark:text-white">Peers to Evaluate</h3>
                   {peersToReview.length === 0 ? (
                     <p className="text-sm text-gray-500 font-bold">No pending peers or you've completed all required reviews! 🎉</p>
                   ) : (
                     <div className="space-y-3">
                       {peersToReview.map(peer => (
                         <button 
                           key={peer.submissionId}
                           onClick={() => startReviewing(peer)}
                           className={`w-full text-left p-4 rounded-xl font-bold border transition-all ${activeReviewee?.revieweeId === peer.revieweeId ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300'}`}
                         >
                           Review of: {peer.revieweeName}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                 {myFeedback.length > 0 && (
                   <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30">
                     <h3 className="font-black text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5"/> Feedback I Received</h3>
                     <div className="space-y-4">
                       {myFeedback.map(fb => (
                         <div key={fb._id} className="bg-white dark:bg-emerald-950/50 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800">
                           <div className="mb-2">
                             <p className="text-2xl font-black text-emerald-600">{fb.totalScore} <span className="text-xs text-gray-400">Total</span></p>
                           </div>
                           <p className="italic text-sm text-gray-700 dark:text-gray-300 font-medium">"{fb.overallComment || 'No comments.'}"</p>
                           <ul className="mt-3 space-y-1">
                             {fb.rubricScores.map((r,i) => (
                               <li key={i} className="text-xs font-bold text-gray-500 flex justify-between">
                                 <span>{r.criterion}</span>
                                 <span className="text-emerald-600">{r.score}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               {/* Right Column: Active Review Form */}
               <div className="lg:col-span-2">
                 {activeReviewee ? (
                   <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl">
                      <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white">Evaluating: {activeReviewee.revieweeName}</h3>
                      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs font-black uppercase text-indigo-400 mb-2">Student's Submitted Work & Notes</p>
                        <a href={activeReviewee.fileUrl} target="_blank" rel="noopener noreferrer" className="font-black text-indigo-600 hover:underline break-all block mb-2">{activeReviewee.fileUrl}</a>
                        {activeReviewee.studentNotes && (
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 italic border-l-2 border-indigo-300 pl-3">"{activeReviewee.studentNotes}"</div>
                        )}
                      </div>

                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <h4 className="font-black text-gray-900 dark:text-white border-b pb-2">Grading Rubric</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedTask.rubric.map(row => (
                            <div key={row._id || row.criterion} className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
                              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">{row.criterion} <span className="text-gray-400 text-xs">(Max: {row.maxPoints})</span></label>
                              <input 
                                required type="number" min="0" max={row.maxPoints} 
                                value={rubricScores[row.criterion] !== undefined ? rubricScores[row.criterion] : ''} 
                                onChange={e => setRubricScores({...rubricScores, [row.criterion]: Number(e.target.value)})}
                                className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 p-3 rounded-lg focus:border-indigo-500 font-bold outline-none dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div>
                           <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Detailed Constructive Feedback</label>
                           <textarea 
                             required value={overallComment} onChange={e=>setOverallComment(e.target.value)}
                             placeholder="Help your peer improve..."
                             className="w-full bg-gray-50 dark:bg-zinc-950 border-2 border-gray-200 dark:border-zinc-800 p-4 h-32 rounded-xl focus:border-indigo-500 font-bold outline-none resize-none dark:text-white"
                           />
                        </div>

                        <button disabled={submitting} type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-50">
                          {submitting ? 'Submitting...' : <><Send className="h-5 w-5"/> Submit Evaluation</>}
                        </button>
                      </form>
                   </div>
                 ) : (
                   <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl p-8 bg-gray-50 dark:bg-zinc-900/50">
                     <div className="text-center">
                       <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                       <p className="font-bold text-gray-500">Select a peer from the left panel to begin reviewing.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PeerReviewPage;
