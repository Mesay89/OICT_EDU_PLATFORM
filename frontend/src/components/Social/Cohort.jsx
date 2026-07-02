import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Users, User, Calendar, Shield, Info, Loader2, Mail, MessageCircle, ExternalLink, Hash } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BASE_URL from '../../api/config';

const Cohort = ({ courseId, bundleId }) => {
  const { user } = useContext(AuthContext);
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCohort = async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const url = bundleId 
          ? `${BASE_URL}/cohorts/my/undefined?bundleId=${bundleId}`
          : `${BASE_URL}/cohorts/my/${courseId}`;
        const { data } = await axios.get(url, cfg);
        setCohort(data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('No cohort assigned yet for this course.');
        } else {
          setError('Failed to load cohort information.');
          console.error('Error fetching cohort:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    if ((courseId || bundleId) && user) {
      fetchCohort();
    }
  }, [courseId, bundleId, user]);

  if (loading) {
     return (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
        </div>
      );
  }

  if (error || !cohort) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 p-12 rounded-3xl border-2 border-dashed border-amber-200 dark:border-amber-800 text-center animate-in fade-in duration-500">
        <Users className="h-16 w-16 text-amber-300 dark:text-amber-700/50 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-amber-800 dark:text-amber-400 mb-2">Almost There!</h3>
        <p className="text-amber-700 dark:text-amber-500 max-w-md mx-auto leading-relaxed">
          {error || "Student cohorts are being organized by instructors. Once you're assigned, you'll see your learning team here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden relative group">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <Users className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                   ASSIGNED COHORT
                </span>
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">{cohort.name}</h1>
              <div className="flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                 <div className="flex items-center gap-1.5">
                   <Calendar className="h-4 w-4 text-indigo-500" /> Matches {new Date(cohort.startDate).toLocaleDateString()}
                 </div>
                 <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full"></div>
                 <div className="flex items-center gap-1.5">
                   <Users className="h-4 w-4 text-purple-500" /> {cohort.students?.length} Learners
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
             <span className="text-[10px] font-black text-gray-400 uppercase">LEAD MENTOR</span>
             <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-950 p-2 pl-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <div className="font-bold text-gray-900 dark:text-white text-sm">{cohort.instructor?.name}</div>
                {cohort.instructor?.image ? (
                   <img src={cohort.instructor.image} className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20" alt="I" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                     {cohort.instructor?.name?.charAt(0) || 'I'}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roster column with Premium UI */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
               <Hash className="h-6 w-6 text-indigo-600" /> Learning Team Members
             </h2>
             <span className="text-xs font-bold bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-3 py-1 rounded-full text-indigo-600">
               Cohort #{Math.floor(Math.random() * 9000) + 1000}
             </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cohort.students?.map((student) => (
              <div 
                key={student._id} 
                className="group bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-indigo-500 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {student.image ? (
                      <img src={student.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:rotate-6 transition-transform" alt="S" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-inner group-hover:-rotate-3 transition-transform">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-zinc-900 rounded-full group-hover:scale-125 transition-transform shadow-lg"></div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                    <p className="text-xs font-medium text-gray-500 mb-2 truncate">Student Learner</p>
                    <div className="flex gap-2">
                       <button className="p-1.5 bg-gray-50 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                         <Mail className="h-3.5 w-3.5" />
                       </button>
                       <button className="p-1.5 bg-gray-50 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                         <MessageCircle className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Column with Premium Cards */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
              <Shield className="absolute -bottom-8 -right-8 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" /> Cohort Benefits
              </h3>
              <ul className="space-y-4 font-bold text-sm tracking-tight">
                <li className="flex items-start gap-3">
                   <div className="p-1 bg-white/20 rounded mt-0.5"><Users className="h-3 w-3" /></div>
                   Small group interactions
                </li>
                <li className="flex items-start gap-3">
                   <div className="p-1 bg-white/20 rounded mt-0.5"><MessageCircle className="h-3 w-3" /></div>
                   Private dedicated support
                </li>
                <li className="flex items-start gap-3">
                   <div className="p-1 bg-white/20 rounded mt-0.5"><Calendar className="h-3 w-3" /></div>
                   Fixed learning timeline
                </li>
              </ul>
              <button className="w-full mt-8 py-4 bg-white text-indigo-700 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
                 Join Cohort Community <ExternalLink className="h-4 w-4" />
              </button>
           </div>
           
           <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
              <h4 className="font-black text-gray-900 dark:text-white text-sm mb-4">Upcoming Benchmarks</h4>
              <div className="space-y-3">
                 {[1, 2].map((i) => (
                   <div key={i} className="flex gap-4 p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-300 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                         {i}
                      </div>
                      <div>
                         <p className="text-xs font-black text-gray-900 dark:text-white">Module {i} Milestone</p>
                         <p className="text-[10px] text-gray-400">Due in {i * 7} days</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Cohort;
