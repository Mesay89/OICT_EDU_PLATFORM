import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, PlayCircle, CheckCircle, Lock, Loader2, ChevronDown, ChevronRight, Package, BookOpen, Star, X, Send, User, MessageCircle } from 'lucide-react';
import LessonComments from '../components/Social/LessonComments';
import Cohort from '../components/Social/Cohort';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

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

const BundlePlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [bundle, setBundle] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [courseProgress, setCourseProgress] = useState({});
  const [moduleProgress, setModuleProgress] = useState({});
  const [enrollmentDate, setEnrollmentDate] = useState(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  
  const [bundleQuizzes, setBundleQuizzes] = useState([]);
  const [bundleProgress, setBundleProgress] = useState(0);

  // Assignments State
  const [sidebarTab, setSidebarTab] = useState('content');
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submittingAsn, setSubmittingAsn] = useState(false);
  const [submissionForms, setSubmissionForms] = useState({});

  // Review state
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const tickRef = useRef(null);
  const watchedRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedRef = useRef(-1);
  const moduleIdRef = useRef('');
  const lastSavedTimeRef = useRef(0);

  const selectedCourse = courses[selectedCourseIdx];
  const currentModule = currentModuleIdx === -1 ? null : selectedCourse?.modules?.[currentModuleIdx];
  // Normalize course _id to string for progress map lookups
  const cid = (course) => course?._id?.toString?.() || course?._id || course?.toString?.() || '';

  const getVideoInfo = useCallback(() => {
    if (!selectedCourse) return { url: '', moduleId: '', title: '', source: 'youtube' };
    if (currentModuleIdx === -1 || !selectedCourse.modules?.length) {
      return { 
        url: selectedCourse.introVideoUrl, 
        moduleId: 'intro-video', 
        title: `${selectedCourse.title} — Introduction`, 
        source: selectedCourse.videoSource || 'youtube' 
      };
    }
    if (currentModule) {
      return {
        url: currentModule.videoUrl || selectedCourse.introVideoUrl,
        moduleId: currentModule._id?.toString() || `module-${currentModuleIdx}`,
        title: (currentModule.title && !currentModule.title.includes('data:image')) ? currentModule.title : `Module ${currentModuleIdx + 1}`,
        source: currentModule.videoSource || selectedCourse.videoSource || 'youtube'
      };
    }
    return { 
      url: selectedCourse.introVideoUrl, 
      moduleId: 'intro-video', 
      title: `${selectedCourse.title} — Introduction`, 
      source: selectedCourse.videoSource || 'youtube' 
    };
  }, [selectedCourse, currentModuleIdx, currentModule]);

  const { url: videoUrl, title: videoTitle, source: videoSource, moduleId: activeModuleId } = useMemo(() => getVideoInfo(), [getVideoInfo]);
  const ytVideoId = useMemo(() => isYouTube(videoUrl) ? getYouTubeVideoId(videoUrl) : null, [videoUrl]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!user) return;
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Check review status
        try {
          const { data } = await axios.get(`${BASE_URL}/reviews/myreview/${id}`, cfg);
          if (data && active) setHasReviewed(true);
        } catch (e) {
          console.error('Failed fetching bundle review', e);
        }
        
        const [bundleRes, enrollRes] = await Promise.all([
          axios.get(`${BASE_URL}/bundles/${id}`, cfg),
          axios.get(`${BASE_URL}/enrollments/myenrollments`, cfg).catch(() => ({ data: [] }))
        ]);
        
        if (!active) return;
        const bundleData = bundleRes.data;
        setBundle(bundleData);

        // getBundleById populates courses as full objects — extract _id safely
        // Each entry in bundleData.courses may be a full object { _id, title, ... } or a bare ID string
        const rawCourses = bundleData.courses || [];
        const extractId = (c) => (c?._id ? c._id.toString() : c?.toString());
        
        // Deduplicate course IDs
        const uniqueCourseIds = [...new Set(rawCourses.map(extractId).filter(Boolean))];
        
        // If courses are already fully populated (they have a title field), use them directly
        let resolvedCourses;
        if (rawCourses.length > 0 && rawCourses[0]?.title) {
          // Already populated — use them directly, no extra fetches needed
          resolvedCourses = rawCourses;
        } else {
          // Bare IDs — fetch each course
          const courseResponses = await Promise.all(
            uniqueCourseIds.map(courseId =>
              axios.get(`${BASE_URL}/courses/${courseId}`, cfg).catch(() => null)
            )
          );
          resolvedCourses = courseResponses.filter(Boolean).map(r => r.data);
        }
        
        if (!active) return;
        setCourses(resolvedCourses);

        // Check enrollment — compare against the resolved course _ids
        const myEnrolls = enrollRes.data;
        const allEnrolled = uniqueCourseIds.length > 0 && uniqueCourseIds.every(courseId =>
          myEnrolls.some(e => (e.course?._id || e.course)?.toString() === courseId)
        );
        setIsEnrolled(allEnrolled);

        // Get enrollment date from first course enrollment
        const firstEnroll = myEnrolls.find(e =>
          uniqueCourseIds.includes((e.course?._id || e.course)?.toString())
        );
        if (firstEnroll) setEnrollmentDate(firstEnroll.createdAt);

        // Fetch progress for each unique course ID (fully fault-tolerant)
        const progressResults = await Promise.all(
          uniqueCourseIds.map(courseId =>
            axios.get(`${BASE_URL}/enrollments/${courseId}/progress`, cfg)
              .then(r => ({ courseId, data: r.data }))
              .catch(() => ({ courseId, data: {} }))
          )
        );

        const progressMap = {};
        const moduleProgMap = {};
        progressResults.forEach(({ courseId, data }) => {
          progressMap[courseId] = data.progress || 0;
          moduleProgMap[courseId] = data.moduleProgress || [];
        });
        setCourseProgress(progressMap);
        setModuleProgress(moduleProgMap);
        
        // Compute overall bundle progress based on total videos across all courses
        if (resolvedCourses.length > 0) {
           let totalVideosInBundle = 0;
           let totalProgressWeight = 0;
           resolvedCourses.forEach(c => {
             const videoCount = 1 + (c.modules?.length || 0);
             totalVideosInBundle += videoCount;
             const cProgress = progressMap[cid(c)] || 0;
             totalProgressWeight += (cProgress / 100) * videoCount;
           });
           setBundleProgress(totalVideosInBundle > 0 ? Math.round((totalProgressWeight / totalVideosInBundle) * 100) : 0);
        }

        // Fetch bundle quizzes (final quizzes)
        try {
           const quizRes = await axios.get(`${BASE_URL}/quiz/course/undefined?bundleId=${id}`, cfg);
           setBundleQuizzes(quizRes.data);
        } catch (e) {
           console.error('Failed to fetch bundle quiz', e);
        }

        // Fetch assignments and submissions
        try {
           const asnRes = await axios.get(`${BASE_URL}/lms/bundles/${id}/assignments`, cfg);
           // Students only see approved assignments
           const filteredAsns = user.role === 'student' 
             ? asnRes.data.filter(a => a.status === 'approved') 
             : asnRes.data;
           setAssignments(filteredAsns);
           
           const subRes = await axios.get(`${BASE_URL}/lms/my-submissions/undefined?bundleId=${id}`, cfg);
           setMySubmissions(subRes.data);
           
           // Initialize submission forms
           const initForms = {};
           filteredAsns.forEach(a => {
              initForms[a._id] = {};
              if (a.questions && a.questions.length > 0) {
                 a.questions.forEach((q, i) => { initForms[a._id][i] = ''; });
              } else {
                 initForms[a._id] = { textAnswer: '' }; // fallback for legacy text-only
              }
           });
           setSubmissionForms(initForms);
        } catch (e) {
           console.error('Failed to fetch assignments', e);
        }

      } catch (e) {
        console.error('BundlePlayerPage load error:', e.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    if (id) load();
    return () => { active = false; };
  }, [id, user]);

  const updateLocalProgress = useCallback((courseId, moduleId, watched, total) => {
    if (!selectedCourse || total <= 0) return;
    setModuleProgress(prev => {
      const newProg = { ...prev };
      if (!newProg[courseId]) newProg[courseId] = [];
      
      const courseProg = newProg[courseId];
      const idx = courseProg.findIndex(p => p.moduleId === moduleId);
      const completed = watched >= total * 0.95;
      
      if (idx >= 0) {
        courseProg[idx] = { ...courseProg[idx], watchedDuration: Math.max(courseProg[idx].watchedDuration, watched), totalDuration: total, completed: courseProg[idx].completed || completed };
      } else {
        courseProg.push({ moduleId, watchedDuration: watched, totalDuration: total, completed });
      }
      
      const allIds = ['intro-video', ...(selectedCourse.modules || []).map((m, i) => m._id?.toString() || `module-${i}`)];
      let totalSum = 0;
      for (const segId of allIds) {
        const seg = courseProg.find(x => x.moduleId === segId);
        if (seg && seg.totalDuration > 0) totalSum += Math.min(seg.watchedDuration / seg.totalDuration, 1);
      }
      const overall = allIds.length > 0 ? Math.round((totalSum / allIds.length) * 100) : 0;
      
      setCourseProgress(prev => {
        const next = { ...prev, [courseId]: Math.max(prev[courseId] || 0, overall) };
        // Update bundle overall progress as well based on total videos
        if (courses && courses.length > 0) {
           let totalVideosInBundle = 0;
           let totalProgressWeight = 0;
           courses.forEach(c => {
             const videoCount = 1 + (c.modules?.length || 0);
             totalVideosInBundle += videoCount;
             const cProgress = next[cid(c)] || 0;
             totalProgressWeight += (cProgress / 100) * videoCount;
           });
           setBundleProgress(totalVideosInBundle > 0 ? Math.round((totalProgressWeight / totalVideosInBundle) * 100) : 0);
        }
        return next;
      });
      return newProg;
    });
  }, [selectedCourse, courses]);

  const saveProgress = useCallback(async (courseId, moduleId, watched, total) => {
    if (!user || total <= 0 || !courseId) return;
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(`${BASE_URL}/enrollments/${courseId}/progress`, { moduleId, watchedDuration: Math.floor(watched), totalDuration: Math.floor(total) }, cfg);
      if (res.data) {
        setCourseProgress(curr => ({...curr, [courseId]: Math.max(curr[courseId] || 0, res.data.progress || 0)}));
        setModuleProgress(curr => ({...curr, [courseId]: res.data.moduleProgress || []}));
      }
    } catch (e) { console.error('Save failed:', e.message); }
  }, [user]);

  const lastLocalUpdateRef = useRef(-1);

  const handleTimeUpdate = (e) => {
    if (!user || !selectedCourse) return;
    const el = e.target;
    if (!el || el.duration <= 0) return;
    
    const currentSecond = Math.floor(el.currentTime);
    if (lastLocalUpdateRef.current !== currentSecond) {
      lastLocalUpdateRef.current = currentSecond;
      updateLocalProgress(cid(selectedCourse), activeModuleId, el.currentTime, el.duration);
    }
    
    const now = Date.now();
    if (now - lastSavedTimeRef.current >= 5000 || el.currentTime >= el.duration * 0.95) {
      lastSavedTimeRef.current = now;
      saveProgress(cid(selectedCourse), activeModuleId, el.currentTime, el.duration);
    }
  };

  const handleVideoEnded = (e) => {
    if (!user || !selectedCourse) return;
    const el = e.target;
    if (el && el.duration > 0) {
      updateLocalProgress(cid(selectedCourse), activeModuleId, el.duration, el.duration);
      saveProgress(cid(selectedCourse), activeModuleId, el.duration, el.duration);
    }
  };

  useEffect(() => {
    if (!selectedCourse || !user) return;
    const courseId = cid(selectedCourse);
    const mod = currentModuleIdx === -1 ? null : selectedCourse.modules?.[currentModuleIdx];
    const videoUrl = currentModuleIdx === -1 ? selectedCourse.introVideoUrl : (mod?.videoUrl || selectedCourse.introVideoUrl);
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
        updateLocalProgress(courseId, moduleIdRef.current, watchedRef.current, dur);
        if (watchedRef.current - lastSavedRef.current >= 5) {
          lastSavedRef.current = watchedRef.current;
          saveProgress(courseId, moduleIdRef.current, watchedRef.current, dur);
        }
        if (watchedRef.current >= dur * 0.95) {
          saveProgress(courseId, moduleIdRef.current, dur, dur);
          clearInterval(tickRef.current); tickRef.current = null;
        }
      }, 1000);
    };
    
    const stopTick = () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      if (durationRef.current > 0) saveProgress(courseId, moduleIdRef.current, watchedRef.current, durationRef.current);
    };
    
    const wrapper = document.getElementById(`yt-wrapper-${moduleId}`);
    if (wrapper) {
      wrapper.innerHTML = '';
      const freshDiv = document.createElement('div'); freshDiv.id = `yt-container-${moduleId}`;
      freshDiv.className = 'w-full h-full'; 
      freshDiv.style.height = '100%';
      freshDiv.style.width = '100%';
      wrapper.appendChild(freshDiv);
    }
    
    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const container = document.getElementById(`yt-container-${moduleId}`); if (!container) return;
      ytPlayerRef.current = new window.YT.Player(`yt-container-${moduleId}`, {
        height: '100%', width: '100%', videoId,
        playerVars: { 
          controls: 1, 
          rel: 0, 
          modestbranding: 1, 
          autoplay: 0,
          playsinline: 1
        },
        events: {
          onReady: (e) => { 
            durationRef.current = Math.floor(e.target.getDuration()) || 0;
            // Force iframe to fill container completely
            const iframe = e.target.getIframe();
            if (iframe) {
              iframe.style.cssText = 'width: 100% !important; height: 100% !important; max-width: none !important; position: absolute; top: 0; left: 0;';
            }
          },
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
  }, [selectedCourse, currentModuleIdx, user, saveProgress, updateLocalProgress]);

  const handleCourseSelect = (idx) => {
    setSelectedCourseIdx(idx);
    setCurrentModuleIdx(-1);
    setShowCourseDropdown(false);
  };

  const handleModuleSelect = (idx) => {
    setCurrentModuleIdx(idx);
  };

  // Trigger review modal when bundle reaches >= 80%
  useEffect(() => {
    if (bundleProgress >= 80 && !hasReviewed && !showReviewModal) {
      setShowReviewModal(true);
    }
  }, [bundleProgress, hasReviewed, showReviewModal]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/reviews`, { bundleId: id, rating: reviewRating, comment: reviewComment }, cfg);
      setHasReviewed(true);
      setShowReviewModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-950">
      <Loader2 className="animate-spin h-16 w-16 text-violet-600" />
    </div>
  );

  if (!bundle || !isEnrolled) return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-8 bg-white dark:bg-zinc-950">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Bundle Not Found or Not Enrolled</h1>
      <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold">
        Go to Dashboard
      </button>
    </div>
  );

  const handleAssignmentSubmit = async (e, asn) => {
    e.preventDefault();
    setSubmittingAsn(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      let textAnswer = '';
      
      if (asn.questions && asn.questions.length > 0) {
         textAnswer = asn.questions.map((q, i) => {
           return `Q${i + 1} (${q.type}): ${q.prompt}\nA: ${submissionForms[asn._id][i] || ''}`;
         }).join('\n\n');
      } else {
         textAnswer = submissionForms[asn._id].textAnswer || '';
      }
      
      const payload = { assignmentId: asn._id, textAnswer };
      const { data } = await axios.post(`${BASE_URL}/lms/submissions`, payload, cfg);
      setMySubmissions(prev => [...prev, data]);
      alert('Assignment submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmittingAsn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-600" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{bundle.title}</h1>
            </div>
            {bundleProgress > 0 && (
              <div className="ml-4 flex flex-col hidden sm:flex">
                <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Bundle Progress</span>
                <div className="flex items-center gap-2">
                   <div className="w-32 bg-gray-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-violet-600 h-1.5" style={{ width: `${bundleProgress}%` }} />
                   </div>
                   <span className="text-xs font-bold text-violet-600">{bundleProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Course Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {selectedCourse?.title || 'Select Course'}
              </span>
              {showCourseDropdown ? <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            </button>

            {showCourseDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 z-50 max-h-96 overflow-y-auto">
                {courses.map((course, idx) => (
                  <button
                    key={course._id}
                    onClick={() => handleCourseSelect(idx)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0 ${
                      selectedCourseIdx === idx ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{course.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {course.modules?.length || 0} modules • {courseProgress[cid(course)] || 0}% complete
                      </p>
                    </div>
                    {courseProgress[cid(course)] === 100 && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full py-6">
        <div className="flex gap-0">
          {/* Video Player - Left Side */}
          <div className="flex-1 min-w-0">
            <div className="bg-black rounded-2xl overflow-hidden relative aspect-video w-full">
              {videoUrl ? (
                isYouTube(videoUrl) && ytVideoId ? (
                  <div className="w-full h-full overflow-hidden bg-black" id={`yt-wrapper-${activeModuleId}`} style={{ height: '100%', width: '100%', position: 'relative' }} />
                ) : isGDrive(videoUrl) ? (
                  <iframe
                    className="w-full h-full"
                    src={getGoogleDriveUrl(videoUrl)}
                    title={videoTitle}
                    allow="autoplay"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    onContextMenu={e => e.preventDefault()}
                    poster={currentModule?.thumbnail || selectedCourse?.image}
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onPause={e => { lastSavedTimeRef.current = 0; if (e.target.duration > 0) saveProgress(cid(selectedCourse), activeModuleId, e.target.currentTime, e.target.duration); }}
                    src={videoUrl}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <PlayCircle className="h-20 w-20 text-gray-600" />
                </div>
              )}
            </div>

            <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{videoTitle}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Course: {selectedCourse?.title}
              </p>
              {courseProgress[cid(selectedCourse)] !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-sm font-bold text-violet-600">{courseProgress[cid(selectedCourse)]}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all"
                      style={{ width: `${courseProgress[cid(selectedCourse)]}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bundle Assignments */}
            {sidebarTab === 'assignments' && assignments.map(asn => {
              const mySub = mySubmissions.find(s => s.assignment?._id === asn._id || s.assignment === asn._id);
              return (
                <div key={asn._id} id={`assignment-${asn._id}`} className="mt-8 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-violet-100 dark:border-violet-900/30 overflow-hidden shadow-xl">
                  <div className="bg-violet-600 p-8 text-white">
                    <div className="flex items-center gap-4 mb-2">
                      <Package className="h-8 w-8" />
                      <h3 className="text-2xl font-black">{asn.title}</h3>
                    </div>
                    <p className="font-bold opacity-90">{asn.description}</p>
                    <div className="mt-4 flex gap-6 text-sm font-black uppercase">
                      <span className="bg-white/20 px-3 py-1 rounded">Max: {asn.points} PTS</span>
                      {asn.dueDate && <span className="bg-white/20 px-3 py-1 rounded">Due: {new Date(asn.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="p-8">
                    {mySub ? (
                      <div className="space-y-6">
                        <div className={`p-6 rounded-2xl border-2 flex items-center justify-between ${mySub.status === 'graded' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${mySub.status === 'graded' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                              {mySub.status === 'graded' ? <CheckCircle className="text-white h-6 w-6" /> : <Clock className="text-white h-6 w-6" />}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase text-gray-400">Status</p>
                              <p className="text-xl font-black capitalize">{mySub.status}</p>
                            </div>
                          </div>
                          {mySub.status === 'graded' && (
                            <div className="text-right">
                              <p className="text-3xl font-black text-emerald-600">{mySub.score} / {asn.points}</p>
                            </div>
                          )}
                        </div>
                        {mySub.textAnswer && (
                          <div className="bg-gray-50 dark:bg-zinc-950 rounded-2xl p-6 border-2 border-gray-100 dark:border-zinc-800">
                            <h4 className="text-sm font-black text-gray-400 uppercase mb-4">Your Answers</h4>
                            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{mySub.textAnswer}</div>
                          </div>
                        )}
                        {mySub.feedback && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-6 border-2 border-indigo-100 dark:border-indigo-900/30">
                            <h4 className="text-sm font-black text-indigo-400 uppercase mb-4">Instructor Feedback</h4>
                            <div className="whitespace-pre-wrap text-indigo-900 dark:text-indigo-300 font-bold">{mySub.feedback}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={e => handleAssignmentSubmit(e, asn)} className="space-y-8">
                        {asn.questions && asn.questions.length > 0 ? (
                          <div className="space-y-6">
                            {asn.questions.map((q, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-zinc-950 rounded-2xl p-6 border-2 border-gray-100 dark:border-zinc-800">
                                <p className="font-black text-gray-900 dark:text-white mb-4"><span className="text-violet-600">Q{i+1}.</span> {q.prompt}</p>
                                {q.type === 'essay' && (
                                  <textarea required rows={4} value={submissionForms[asn._id]?.[i] || ''} onChange={e => setSubmissionForms(prev => ({...prev, [asn._id]: {...prev[asn._id], [i]: e.target.value}}))} placeholder="Your comprehensive answer..." className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none font-medium text-gray-900 dark:text-white resize-none" />
                                )}
                                {q.type === 'short_answer' && (
                                  <input required type="text" value={submissionForms[asn._id]?.[i] || ''} onChange={e => setSubmissionForms(prev => ({...prev, [asn._id]: {...prev[asn._id], [i]: e.target.value}}))} placeholder="Your short answer..." className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none font-medium text-gray-900 dark:text-white" />
                                )}
                                {q.type === 'choice' && (
                                  <div className="space-y-3">
                                    {(q.options || []).map((opt, oi) => (
                                      <label key={oi} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer hover:border-violet-400 transition-colors">
                                        <input required type="radio" name={`asn-${asn._id}-q-${i}`} value={opt} checked={submissionForms[asn._id]?.[i] === opt} onChange={e => setSubmissionForms(prev => ({...prev, [asn._id]: {...prev[asn._id], [i]: e.target.value}}))} className="accent-violet-600 w-5 h-5" />
                                        <span className="font-medium text-gray-900 dark:text-white">{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-black text-gray-400 uppercase mb-2">Your Submission</label>
                            <textarea required value={submissionForms[asn._id]?.textAnswer || ''} onChange={e => setSubmissionForms(prev => ({...prev, [asn._id]: {...prev[asn._id], textAnswer: e.target.value}}))} placeholder="Type your answer or provide a link to your work..." className="w-full p-4 h-32 rounded-2xl bg-gray-50 dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 outline-none font-bold resize-none" />
                          </div>
                        )}
                        <button disabled={submittingAsn} type="submit" className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-3">
                          {submittingAsn ? <Loader2 className="animate-spin" /> : <Send />} Submit Work
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Lesson Comments */}
            {sidebarTab === 'content' && (
              <div className="mt-6">
                <LessonComments courseId={selectedCourse?._id} bundleId={bundle._id} moduleId={activeModuleId} />
              </div>
            )}
          </div>

          {/* Course Modules - Right Side */}
          <div className="w-72 flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-xl">
              <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button onClick={() => setSidebarTab('content')} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${sidebarTab === 'content' ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>Content</button>
                <button onClick={() => setSidebarTab('assignments')} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${sidebarTab === 'assignments' ? 'bg-white dark:bg-zinc-700 text-amber-600 shadow-sm' : 'text-gray-500'}`}>Assignments {assignments.length > 0 && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{assignments.length}</span>}</button>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 sticky top-4 rounded-b-xl max-h-[80vh] overflow-y-auto">
              {sidebarTab === 'content' ? (
                <>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">Course Content</h3>
              
              {/* Introduction */}
              <button
                onClick={() => handleModuleSelect(-1)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                  currentModuleIdx === -1 
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <PlayCircle className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Introduction</p>
                </div>
                {moduleProgress[cid(selectedCourse)]?.find(p => p.moduleId === 'intro-video')?.completed && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </button>

              {/* Modules */}
              {selectedCourse?.modules?.map((module, idx) => {
                const isInstructor = user?._id === selectedCourse?.instructor?._id || user?._id === selectedCourse?.instructor;
                if (!module.isReleased && !isInstructor && user?.role !== 'admin') return null;
                const isLocked = false; // Bundle courses are fully accessible
                const moduleProg = moduleProgress[cid(selectedCourse)]?.find(p => p.moduleId === module._id?.toString() || p.moduleId === `module-${idx}`);
                
                return (
                  <button
                    key={module._id || idx}
                    onClick={() => !isLocked && handleModuleSelect(idx)}
                    disabled={isLocked}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                      currentModuleIdx === idx 
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
                        : isLocked 
                          ? 'opacity-50 cursor-not-allowed text-gray-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <PlayCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {(module.title && !module.title.includes('data:image')) ? module.title : `Module ${idx + 1}`}
                      </p>
                    </div>
                    {moduleProg?.completed && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Final Quizzes */}
              {bundleQuizzes.length > 0 && (
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Final Assessments</h3>
                  {bundleQuizzes.map(quiz => (
                     <button
                       key={quiz._id}
                       onClick={() => {
                          if (bundleProgress >= 80) {
                             navigate(`/quiz/${quiz._id}?bundleId=${bundle._id}`);
                          } else {
                             alert("You must complete at least 80% of the bundle to unlock this quiz.");
                          }
                       }}
                       className={`w-full text-left px-4 py-4 rounded-xl mb-2 flex items-center gap-3 transition-colors shadow-sm border ${
                         bundleProgress >= 80 
                           ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent hover:shadow-md' 
                           : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700 cursor-not-allowed'
                       }`}
                     >
                       {bundleProgress >= 80 ? (
                         <CheckCircle className="h-5 w-5 flex-shrink-0 text-white/80" />
                       ) : (
                         <Lock className="h-5 w-5 flex-shrink-0 opacity-50" />
                       )}
                       <div className="flex-1 min-w-0">
                         <p className="font-bold truncate">{quiz.title}</p>
                         <p className="text-xs opacity-80">{bundleProgress >= 80 ? 'Available Now' : 'Requires 80% Progress'}</p>
                       </div>
                     </button>
                  ))}
                </div>
              )}

              {/* Cohort Section */}
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <Cohort bundleId={bundle._id} />
              </div>
              </>
            ) : (
              <div className="p-2 space-y-2">
                {assignments.length === 0 ? <div className="p-8 text-center opacity-50"><Package className="h-12 w-12 mx-auto mb-2 text-violet-500" /><p className="text-xs font-bold text-gray-500">No assignments yet.</p></div> : assignments.map(asn => {
                  const mySub = mySubmissions.find(s => (s.assignment?._id || s.assignment) === asn._id);
                  return (
                    <button key={asn._id} onClick={() => { setTimeout(() => document.getElementById(`assignment-${asn._id}`)?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-violet-500 transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${mySub ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}><Package className="h-4 w-4" /></div>
                        <p className="text-xs font-black truncate flex-1">{asn.title}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-gray-400">{asn.points} pts</span>
                        <span className={`text-[10px] font-black uppercase ${mySub ? 'text-emerald-500' : 'text-amber-500'}`}>{mySub ? (mySub.status === 'graded' ? 'Graded' : 'Submitted') : 'Pending'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] overflow-hidden p-8 shadow-2xl relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-10 w-10 text-violet-600 fill-violet-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Great Progress!</h2>
              <p className="text-gray-500">
                You've completed {bundleProgress}% of the bundle. How are you liking it?
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className="p-1 hover:scale-125 transition-all"
                  >
                    <Star className={`h-10 w-10 ${num <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share your feedback..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl p-4 min-h-[120px] outline-none border-2 border-transparent focus:border-violet-500 transition-all font-medium"
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
              >
                {submittingReview ? <Loader2 className="animate-spin" /> : <>Submit Review <Send className="h-5 w-5" /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundlePlayerPage;
