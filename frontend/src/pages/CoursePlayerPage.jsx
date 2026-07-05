import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ChevronLeft, PlayCircle, FileText, CheckCircle, Lock, CloudUpload, Check, AlertCircle, ExternalLink, Send, Loader2, Clock, Award, User, Star, MessageSquare, X, Shield } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTimezone } from '../context/TimezoneContext';
import BASE_URL from '../api/config';
import LessonComments from '../components/Social/LessonComments';

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  let id = null;
  if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
  else if (url.includes('youtube.com/watch')) id = new URLSearchParams(url.split('?')[1]).get('v');
  else if (url.includes('youtube.com/embed/')) id = url.split('embed/')[1].split('?')[0].split('&')[0];
  else if (url.includes('youtube.com/shorts/')) id = url.split('shorts/')[1].split('?')[0].split('&')[0];
  return id && id.length === 11 ? id : null;
};

const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
const isGDrive = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

const getGoogleDriveUrl = (url) => {
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.google.com/file/d/${m1[1]}/preview`;
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/file/d/${m2[1]}/preview`;
  return url;
};

const CoursePlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { formatDate } = useTimezone();

  const [course, setCourse] = useState(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [moduleProgress, setModuleProgress] = useState([]);
  const [enrollmentDate, setEnrollmentDate] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [subFileUrl, setSubFileUrl] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [subAnswers, setSubAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const [hasReviewed, setHasReviewed] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [sidebarTab, setSidebarTab] = useState('content');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const checkReview = async () => {
      if (!user || !id) return;
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/reviews/myreview/${id}`, cfg);
        setHasReviewed(!!data);
      } catch (err) { console.error('Review check failed'); }
    };
    checkReview();
  }, [id, user]);

  useEffect(() => {
    if (courseProgress >= 90 && !hasReviewed && !showReviewModal) {
      setShowReviewModal(true);
    }
  }, [courseProgress, hasReviewed, showReviewModal]);

  const isModuleLocked = (mod) => {
    if (!user || !enrollmentDate || !mod) return false;
    if (course && course.instructor?._id === user._id) return false;
    if (!mod.dripDelayDays || mod.dripDelayDays === 0) return false;
    const availableAt = new Date(enrollmentDate).getTime() + (mod.dripDelayDays * 24 * 60 * 60 * 1000);
    return Date.now() < availableAt;
  };

  const getAvailableDate = (mod) => {
    if (!enrollmentDate || !mod) return '';
    const availableAt = new Date(enrollmentDate).getTime() + (mod.dripDelayDays * 24 * 60 * 60 * 1000);
    return formatDate(availableAt);
  };

  const currentModule = currentModuleIdx === -1 ? null : course?.modules?.[currentModuleIdx];
  const isCurrentModuleLocked = currentModuleIdx === -1 ? false : isModuleLocked(currentModule);

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const tickRef = useRef(null);
  const watchedRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedRef = useRef(-1);
  const moduleIdRef = useRef('');

  const getVideoInfo = useCallback(() => {
    if (!course) return { url: '', moduleId: '', title: '', source: 'youtube' };
    if (currentModuleIdx === -1 || !course.modules?.length) {
      return { url: course.introVideoUrl, moduleId: 'intro-video', title: `${course.title} — Introduction`, source: course.videoSource || 'youtube' };
    }
    if (currentModule) {
      return {
        url: currentModule.videoUrl || course.introVideoUrl,
        moduleId: currentModule._id?.toString() || `module-${currentModuleIdx}`,
        title: (currentModule.title && !currentModule.title.includes('data:image')) ? currentModule.title : `Module ${currentModuleIdx + 1}`,
        source: currentModule.videoSource || course.videoSource || 'youtube'
      };
    }
    return { url: course.introVideoUrl, moduleId: 'intro-video', title: `${course.title} — Introduction`, source: course.videoSource || 'youtube' };
  }, [course, currentModuleIdx, currentModule]);

  const { url: videoUrl, title: videoTitle, source: videoSource, moduleId: activeModuleId } = useMemo(() => getVideoInfo(), [getVideoInfo]);
  const ytVideoId = useMemo(() => isYouTube(videoUrl) ? getYouTubeVideoId(videoUrl) : null, [videoUrl]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!user) return;
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const [courseRes, enrollRes, progRes, asgnRes, subRes] = await Promise.all([
          axios.get(`${BASE_URL}/courses/${id}`, cfg),
          axios.get(`${BASE_URL}/enrollments/myenrollments`, cfg).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/enrollments/${id}/progress`, cfg).catch(() => ({ data: {} })),
          axios.get(`${BASE_URL}/lms/courses/${id}/assignments`, cfg).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/lms/my-submissions/${id}`, cfg).catch(() => ({ data: [] }))
        ]);
        if (!active) return;
        setCourse(courseRes.data);
        const myEnroll = enrollRes.data.find(e => (e.course?._id || e.course)?.toString() === id);
        if (myEnroll) setEnrollmentDate(myEnroll.createdAt);
        setIsEnrolled(!!myEnroll || user.role === 'admin' || (user.role === 'instructor' && courseRes.data.instructor?._id === user._id) || courseRes.data.price === 0);
        setCourseProgress(progRes.data.progress || 0);
        setModuleProgress(progRes.data.moduleProgress || []);
        setAssignments(asgnRes.data);
        setMySubmissions(subRes.data);
      } catch (e) { console.error(e.message); }
      finally { if (active) { setLoading(false); setCheckingEnrollment(false); } }
    };
    if (id) load();
    return () => { active = false; };
  }, [id, user]);

  const handleAssignmentSubmit = async (e, assignmentId) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Format answers
      const answersArray = Object.keys(subAnswers).map(qid => ({ questionId: qid, answer: subAnswers[qid] }));
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/lms/submissions`, { assignmentId, fileUrl: subFileUrl, studentNotes: subNotes, answers: answersArray }, cfg);
      setMySubmissions(prev => [...prev, data]);
      setSubFileUrl(''); setSubNotes('');
      alert('Assignment submitted successfully!');
    } catch (err) { alert(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/reviews`, { courseId: id, rating: reviewRating, comment: reviewComment }, cfg);
      setHasReviewed(true); setShowReviewModal(false);
      alert('Thank you for your feedback!');
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  const handleReportContent = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/moderation/report`, {
        contentType: 'course',
        contentId: id,
        reason: reportReason,
        description: reportDescription
      }, cfg);
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      alert('Report submitted successfully. Thank you for helping keep our platform safe.');
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit report'); }
    finally { setSubmittingReport(false); }
  };

  const updateLocalProgress = useCallback((moduleId, watched, total) => {
    if (!course || total <= 0) return;
    setModuleProgress(prev => {
      const newProg = [...prev];
      const idx = newProg.findIndex(p => p.moduleId === moduleId);
      const completed = watched >= total * 0.95;
      if (idx >= 0) {
        newProg[idx] = { ...newProg[idx], watchedDuration: Math.max(newProg[idx].watchedDuration, watched), totalDuration: total, completed: newProg[idx].completed || completed };
      } else {
        newProg.push({ moduleId, watchedDuration: watched, totalDuration: total, completed });
      }
      const allIds = ['intro-video', ...(course.modules || []).map((m, i) => m._id?.toString() || `module-${i}`)];
      let totalSum = 0;
      for (const segId of allIds) {
        const seg = newProg.find(x => x.moduleId === segId);
        if (seg && seg.totalDuration > 0) totalSum += Math.min(seg.watchedDuration / seg.totalDuration, 1);
      }
      const overall = allIds.length > 0 ? Math.round((totalSum / allIds.length) * 100) : 0;
      setCourseProgress(curr => Math.max(curr, overall));
      return newProg;
    });
  }, [course]);

  const saveProgress = useCallback(async (moduleId, watched, total) => {
    if (!user || total <= 0) return;
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(`${BASE_URL}/enrollments/${id}/progress`, { moduleId, watchedDuration: Math.floor(watched), totalDuration: Math.floor(total) }, cfg);
      if (res.data) {
        setCourseProgress(curr => Math.max(curr, res.data.progress || 0));
        setModuleProgress(res.data.moduleProgress || []);
      }
    } catch (e) { console.error('Save failed:', e.message); }
  }, [user, id]);

  const lastSavedTimeRef = useRef(0);
  const handleTimeUpdate = (e) => {
    if (!user) return;
    const el = e.target;
    if (!el || el.duration <= 0) return;
    const now = Date.now();
    updateLocalProgress(activeModuleId, el.currentTime, el.duration);
    if (now - lastSavedTimeRef.current >= 5000 || el.currentTime >= el.duration * 0.95) {
      lastSavedTimeRef.current = now;
      saveProgress(activeModuleId, el.currentTime, el.duration);
    }
  };

  const handleVideoEnded = (e) => {
    if (!user) return;
    const el = e.target;
    if (el && el.duration > 0) {
      updateLocalProgress(activeModuleId, el.duration, el.duration);
      saveProgress(activeModuleId, el.duration, el.duration);
    }
  };

  useEffect(() => {
    if (!course || !user) return;
    const mod = course?.modules?.[currentModuleIdx];
    const videoUrl = currentModuleIdx === -1 ? course.introVideoUrl : (mod?.videoUrl || course.introVideoUrl);
    const moduleId = currentModuleIdx === -1 ? 'intro-video' : (mod?._id?.toString() || `module-${currentModuleIdx}`);
    if (!videoUrl || !isYouTube(videoUrl)) return;
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return;
    moduleIdRef.current = moduleId; watchedRef.current = 0; durationRef.current = 0; lastSavedRef.current = -1;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
    const startTick = () => {
      if (tickRef.current) return;
      tickRef.current = setInterval(() => {
        const dur = durationRef.current; if (dur <= 0) return;
        watchedRef.current = Math.min(watchedRef.current + 1, dur);
        updateLocalProgress(moduleIdRef.current, watchedRef.current, dur);
        if (watchedRef.current - lastSavedRef.current >= 5) {
          lastSavedRef.current = watchedRef.current;
          saveProgress(moduleIdRef.current, watchedRef.current, dur);
        }
        if (watchedRef.current >= dur * 0.95) {
          saveProgress(moduleIdRef.current, dur, dur);
          clearInterval(tickRef.current); tickRef.current = null;
        }
      }, 1000);
    };
    const stopTick = () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      if (durationRef.current > 0) saveProgress(moduleIdRef.current, watchedRef.current, durationRef.current);
    };
    const wrapper = document.getElementById(`yt-wrapper-${moduleId}`);
    if (wrapper) {
      wrapper.innerHTML = '';
      const freshDiv = document.createElement('div'); freshDiv.id = `yt-container-${moduleId}`;
      freshDiv.className = 'w-full h-full'; wrapper.appendChild(freshDiv);
    }
    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const container = document.getElementById(`yt-container-${moduleId}`); if (!container) return;
      ytPlayerRef.current = new window.YT.Player(`yt-container-${moduleId}`, {
        height: '100%', width: '100%', videoId,
        playerVars: { controls: 1, rel: 0, modestbranding: 1, autoplay: 0 },
        events: {
          onReady: (e) => { durationRef.current = Math.floor(e.target.getDuration()) || 0; },
          onStateChange: (e) => {
            try {
              const dur = Math.floor(e.target.getDuration()); const cur = Math.floor(e.target.getCurrentTime());
              if (dur > 0) durationRef.current = dur; if (cur > 0) watchedRef.current = Math.max(watchedRef.current, cur);
            } catch {}
            if (e.data === window.YT.PlayerState.PLAYING) startTick();
            else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) stopTick();
          },
        },
      });
    };
    if (window.YT && window.YT.Player) createPlayer();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); createPlayer(); };
      if (!document.getElementById('yt-api-script')) {
        const s = document.createElement('script'); s.id = 'yt-api-script'; s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
      }
    }
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
    };
  }, [course, currentModuleIdx, user, saveProgress, updateLocalProgress]);

  const isModuleCompleted = (idx) => {
    const mod = course?.modules?.[idx]; if (!mod) return false;
    const p = moduleProgress.find(p => p.moduleId === (mod._id?.toString() || `module-${idx}`));
    return p?.completed || false;
  };

  const getModulePct = (idx) => {
    const mod = course?.modules?.[idx]; if (!mod) return 0;
    const p = moduleProgress.find(p => p.moduleId === (mod._id?.toString() || `module-${idx}`));
    if (!p || !p.totalDuration) return 0;
    return Math.min(Math.round((p.watchedDuration / p.totalDuration) * 100), 100);
  };

  if (loading || checkingEnrollment) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!course) return <div className="flex justify-center items-center min-h-screen"><p>Course not found</p></div>;

  if (user?.role === 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-2 border-purple-100 dark:border-purple-900/20 text-center">
          <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="h-12 w-12 text-purple-500" /></div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Learning Disabled For Admins</h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold mb-8">Admin accounts can review content, but they do not participate in student flow.</p>
          <button onClick={() => navigate('/admin-dashboard')} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl">Open Admin Dashboard</button>
        </div>
      </div>
    );
  }

  if (course.status !== 'published' && user?._id !== course.instructor?._id) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-2 border-amber-100 dark:border-amber-900/20 text-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="h-12 w-12 text-amber-500 animate-pulse" /></div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Pending Approval</h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold mb-8">This course is currently awaiting admin approval.</p>
          <button onClick={() => navigate('/catalog')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Explore Other Courses</button>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return <div className="flex justify-center items-center min-h-screen"><div className="text-center"><h1 className="text-3xl font-bold mb-4">Access Required</h1><button onClick={() => navigate(`/courses/${id}`)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg">View Course</button></div></div>;
  }

  return (
    <>
      <div className="flex flex-col lg:h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between border-b border-zinc-800 sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-indigo-400 transition-colors"><ChevronLeft className="h-5 w-5" /> <span>Back</span></button>
          <div className="flex flex-col items-center flex-1 px-4 text-center min-w-0"><span className="font-bold truncate w-full max-w-md">{course.title}</span></div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><Shield className="h-4 w-4" /> <span>Report</span></button>
            <button onClick={() => navigate(`/peer-review/${id}`)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><User className="h-4 w-4" /> <span>Reviews</span></button>
            <button onClick={() => { if (courseProgress < 80) { alert(`Progress: ${courseProgress}%. Need 80% to take final quiz.`); return; } navigate(`/evaluation/${id}`); }} className={`${courseProgress >= 80 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed opacity-70'} px-4 py-2 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg`}><CheckCircle className="h-4 w-4" /> <span>Final Quiz</span></button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
            <div className="aspect-video bg-black relative">
              {isCurrentModuleLocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white p-8 text-center animate-in fade-in duration-500"><div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6"><Lock className="h-10 w-10 text-amber-500" /></div><h2 className="text-3xl font-black mb-2">Content Locked</h2><p className="text-zinc-400 max-w-md font-bold underline underline-offset-8">Unlocks on <span className="text-amber-500">{getAvailableDate(currentModule)}</span></p></div>
              ) : !videoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4"><PlayCircle className="h-20 w-20" /><span>No video available</span></div>
              ) : (ytVideoId || videoSource === 'youtube') && isYouTube(videoUrl) ? (
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" id={`yt-wrapper-${activeModuleId}`} />
              ) : (isGDrive(videoUrl) || videoSource === 'googledrive') ? (
                <iframe src={getGoogleDriveUrl(videoUrl)} className="absolute inset-0 w-full h-full" style={{ border: 'none' }} allow="autoplay" allowFullScreen title={videoTitle} />
              ) : (
                <video ref={videoRef} src={videoUrl} controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} poster={currentModule?.thumbnail || course.image} preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleVideoEnded} onPause={e => { lastSavedTimeRef.current = 0; if (e.target.duration > 0) saveProgress(activeModuleId, e.target.currentTime, e.target.duration); }} />
              )}
            </div>

            <div className="p-8 max-w-4xl mx-auto w-full">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">{videoTitle}</h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{currentModule?.content || course.description}</p>
              {currentModule?.content && currentModule.content.startsWith('http') && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 flex items-center justify-between"><div><h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-400">Study Materials</h4><p className="text-sm text-indigo-700 dark:text-indigo-300">View or download reference documents.</p></div><a href={currentModule.content} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"><FileText className="w-5 h-5" /> View Document</a></div>
              )}

              {assignments.filter(a => Number(a.module) === (currentModuleIdx + 1)).map(asn => {
                const mySub = mySubmissions.find(s => s.assignment?._id === asn._id || s.assignment === asn._id);
                return (
                  <div key={asn._id} id={`assignment-${asn._id}`} className="mt-12 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-xl">
                    <div className="bg-amber-500 p-8 text-white"><div className="flex items-center gap-4 mb-2"><Award className="h-8 w-8" /><h3 className="text-2xl font-black">{asn.title}</h3></div><p className="font-bold opacity-90">{asn.description}</p><div className="mt-4 flex gap-6 text-sm font-black uppercase"><span className="bg-white/20 px-3 py-1 rounded">Max: {asn.points} PTS</span>{asn.dueDate && <span className="bg-white/20 px-3 py-1 rounded">Due: {formatDate(asn.dueDate)}</span>}</div></div>
                    <div className="p-8">
                      {mySub ? (
                        <div className="space-y-6">
                          <div className={`p-6 rounded-2xl border-2 flex items-center justify-between ${mySub.status === 'graded' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}><div className="flex items-center gap-4"><div className={`h-12 w-12 rounded-full flex items-center justify-center ${mySub.status === 'graded' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{mySub.status === 'graded' ? <CheckCircle className="text-white h-6 w-6" /> : <Clock className="text-white h-6 w-6" />}</div><div><p className="text-xs font-black uppercase text-gray-400">Status</p><p className="text-xl font-black capitalize">{mySub.status}</p></div></div>{mySub.status === 'graded' && <div className="text-right"><p className="text-3xl font-black text-emerald-600">{mySub.score} / {asn.points}</p></div>}</div>
                          <a href={mySub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 font-black hover:underline"><ExternalLink className="h-4 w-4" /> View Your Submission</a>
                        </div>
                      ) : (
                        <form onSubmit={e => handleAssignmentSubmit(e, asn._id)} className="space-y-6">
                          {asn.questions && asn.questions.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm border-b-2 border-gray-100 dark:border-zinc-800 pb-2">Questions</h4>
                              {asn.questions.map((q, qi) => (
                                <div key={qi} className="space-y-2">
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <span className="text-amber-500 mr-2">Q{qi + 1}.</span> {q.prompt}
                                  </label>
                                  {q.type === 'essay' && (
                                    <textarea required value={subAnswers[q._id || qi] || ''} onChange={e => setSubAnswers(prev => ({...prev, [q._id || qi]: e.target.value}))} className="w-full p-4 h-32 rounded-xl bg-gray-50 dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 outline-none font-bold resize-none" placeholder="Write your essay here..."></textarea>
                                  )}
                                  {q.type === 'short_answer' && (
                                    <input type="text" required value={subAnswers[q._id || qi] || ''} onChange={e => setSubAnswers(prev => ({...prev, [q._id || qi]: e.target.value}))} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 outline-none font-bold" placeholder="Short answer..." />
                                  )}
                                  {q.type === 'choice' && (
                                    <div className="space-y-2">
                                      {q.options.map((opt, oi) => (
                                        <label key={oi} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-all">
                                          <input type="radio" required name={`q_${q._id || qi}`} value={opt} checked={subAnswers[q._id || qi] === opt} onChange={e => setSubAnswers(prev => ({...prev, [q._id || qi]: e.target.value}))} className="w-4 h-4 text-amber-500" />
                                          <span className="text-sm font-bold">{opt}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-zinc-800">
                            <label className="block text-sm font-black text-gray-400 uppercase mb-2">Work URL (Optional if answered above)</label>
                            <input type="url" value={subFileUrl} onChange={e => setSubFileUrl(e.target.value)} placeholder="Paste link to your work..." className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 outline-none font-bold" />
                          </div>
                          <div>
                            <label className="block text-sm font-black text-gray-400 uppercase mb-2">Notes</label>
                            <textarea value={subNotes} onChange={e => setSubNotes(e.target.value)} placeholder="Anything for the instructor..." className="w-full p-4 h-32 rounded-2xl bg-gray-50 dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 outline-none font-bold resize-none" />
                          </div>
                          <button disabled={submitting} type="submit" className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-3">{submitting ? 'Submitting...' : 'Submit Work'}</button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
              <LessonComments courseId={id} moduleId={activeModuleId} />
            </div>
          </div>

          <div className="w-full lg:w-96 flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
              <div className="flex bg-gray-200 dark:bg-zinc-800 p-1 rounded-xl">
                <button onClick={() => setSidebarTab('content')} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${sidebarTab === 'content' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Content</button>
                <button onClick={() => setSidebarTab('assignments')} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${sidebarTab === 'assignments' ? 'bg-white dark:bg-zinc-700 text-amber-600 shadow-sm' : 'text-gray-500'}`}>Assignments {assignments.length > 0 && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{assignments.length}</span>}</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'content' ? (
                <>
                  <div className="p-4 border-b border-gray-100 dark:border-zinc-800"><div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2"><span>Your Progress</span><span className="text-indigo-600">{courseProgress}%</span></div><div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${courseProgress}%` }} /></div></div>
                  <button onClick={() => setCurrentModuleIdx(-1)} className={`w-full text-left p-4 border-b border-gray-200 dark:border-zinc-700 flex gap-4 transition-all ${currentModuleIdx === -1 ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'}`}><div className="flex-shrink-0"><PlayCircle className="h-8 w-8 text-indigo-500" /></div><div className="flex flex-col justify-center"><p className={`text-sm font-black ${currentModuleIdx === -1 ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>Introduction Video</p><p className="text-xs text-gray-400">Available now</p></div></button>
                  {course.modules?.map((mod, idx) => {
                    const isInstructor = user._id === course.instructor?._id; if (!mod.isReleased && !isInstructor) return null;
                    const isLocked = isModuleLocked(mod); const isActive = currentModuleIdx === idx;
                    const hasVideo = mod.videoUrl && mod.videoUrl.trim() !== '';
                    const modThumb = mod.thumbnail || (hasVideo ? null : null);
                    return (
                      <button key={idx} onClick={() => setCurrentModuleIdx(idx)} className={`w-full text-left p-4 border-b border-gray-100 dark:border-zinc-800 flex gap-4 transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'}`}>
                        {/* Thumbnail or icon */}
                        <div className="flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                          {modThumb ? (
                            <img src={modThumb} alt={`Part ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-amber-500" />
                          ) : isModuleCompleted(idx) ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : mod.type === 'document' ? (
                            <FileText className={`h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                          ) : (
                            <PlayCircle className={`h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                          <p className={`text-sm font-black truncate ${isLocked ? 'text-gray-400' : isActive ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>{mod.title || `Module ${idx + 1}`}</p>
                          {isLocked ? <p className="text-xs font-bold text-amber-500">Unlocks {getAvailableDate(mod)}</p> : isModuleCompleted(idx) ? <p className="text-xs text-emerald-600">✓ Completed</p> : <p className="text-xs text-gray-400">{mod.type === 'document' ? '📄 Document' : '▶ Video'}</p>}
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="p-2 space-y-2">
                  {assignments.length === 0 ? <div className="p-8 text-center opacity-50"><Award className="h-12 w-12 mx-auto mb-2" /><p className="text-xs font-bold">No assignments yet.</p></div> : assignments.map(asn => {
                    const mySub = mySubmissions.find(s => (s.assignment?._id || s.assignment) === asn._id);
                    return (
                      <button key={asn._id} onClick={() => { setCurrentModuleIdx(Number(asn.module) - 1); setTimeout(() => document.getElementById(`assignment-${asn._id}`)?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-amber-500 transition-all"><div className="flex items-center gap-3 mb-2"><div className={`p-2 rounded-lg ${mySub ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}><Award className="h-4 w-4" /></div><p className="text-xs font-black truncate flex-1">{asn.title}</p></div><div className="flex justify-between"><span className="text-[10px] font-bold text-gray-400">Module {asn.module}</span><span className={`text-[10px] font-black uppercase ${mySub ? 'text-emerald-500' : 'text-emerald-500'}`}>{mySub ? (mySub.status === 'graded' ? 'Graded' : 'Submitted') : 'Approved'}</span></div></button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] overflow-hidden p-8 shadow-2xl relative"><button onClick={() => setShowReviewModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"><X className="h-5 w-5 text-gray-400" /></button><div className="text-center space-y-4 mb-8"><div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Star className="h-10 w-10 text-indigo-600 fill-indigo-600" /></div><h2 className="text-3xl font-black">Great Progress!</h2><p className="text-gray-500">You've completed {courseProgress}% of the course. How are you liking it?</p></div><form onSubmit={handleSubmitReview} className="space-y-6"><div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map(num => (<button key={num} type="button" onClick={() => setReviewRating(num)} className="p-1 hover:scale-125 transition-all"><Star className={`h-10 w-10 ${num <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} /></button>))}</div><textarea placeholder="Share your feedback..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 min-h-[120px] outline-none border-2 border-transparent focus:border-indigo-500 transition-all font-medium" required /><button type="submit" disabled={submittingReview} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2">{submittingReview ? <Loader2 className="animate-spin" /> : <>Submit Review <Send className="h-5 w-5" /></>}</button></form></div></div>
      )}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] overflow-hidden p-8 shadow-2xl relative">
            <button onClick={() => setShowReportModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"><X className="h-5 w-5 text-gray-400" /></button>
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Shield className="h-10 w-10 text-red-600" /></div>
              <h2 className="text-3xl font-black">Report Content</h2>
              <p className="text-gray-500">Help us keep the platform safe by reporting inappropriate content.</p>
            </div>
            <form onSubmit={handleReportContent} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Reason</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 outline-none border-2 border-transparent focus:border-red-500 transition-all font-medium" required>
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="spam">Spam or Misleading</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Description</label>
                <textarea placeholder="Please provide details about your report..." value={reportDescription} onChange={e => setReportDescription(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 min-h-[120px] outline-none border-2 border-transparent focus:border-red-500 transition-all font-medium" required />
              </div>
              <button type="submit" disabled={submittingReport} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2">{submittingReport ? <Loader2 className="animate-spin" /> : <>Submit Report <Shield className="h-5 w-5" /></>}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CoursePlayerPage;
