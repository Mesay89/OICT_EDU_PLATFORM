import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Award, ArrowRight, Star, TrendingUp, Globe, Clock, Zap, Shield, Sparkles, Loader2, Play } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BASE_URL from '../api/config';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({ totalCourses: null, totalInstructors: null, totalStudents: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, statsRes] = await Promise.all([
          axios.get(`${BASE_URL}/courses/featured`),
          axios.get(`${BASE_URL}/reports/public-stats`).catch(() => ({ data: null }))
        ]);
        setFeatured(Array.isArray(featRes.data) ? featRes.data : []);
        if (statsRes.data) setPlatformStats(statsRes.data);

        if (user) {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const recRes = await axios.get(`${BASE_URL}/courses/recommendations`, config);
          setRecommended(recRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch home page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const fmtStat = (n) => {
    if (n === null || n === undefined) return '...';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
    return `${n}+`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Stunning Gradient */}
      <section className="relative overflow-hidden bg-slate-950  pt-20 pb-32">
        {/* Hero background image — replace file at public/images/home_page.jpg to change */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/home_page12.png')" }}
        />
        <div className="absolute inset-0 bg-slate-950/60" />

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), 
                             radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          ></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Heading - Redesigned Layout */}
            <div className="space-y-4 mb-10">
              <h1 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-bold text-[#F9FAFB] leading-[1.5] tracking-tight">
                <span className="block drop-shadow-2xl">
                  {t("hero.title1")}
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 drop-shadow-2xl animate-gradient mt-2">
                  {t("hero.title2")}
                </span>
              </h1>
            </div>

            {/* Subtitle - Better Spacing and Typography */}
            <div className="max-w-3xl mx-auto mb-12">
              <p className="text-[20px] sm:text-[20px] md:text-[24px] text-[#F9FAFB]/95 leading-[1.5] font-medium drop-shadow-lg">
                {t("hero.subtitle")}
              </p>
            </div>

            {/* CTA Buttons - Enhanced Design */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link
                to="/register"
                aria-label="Get Started Free"
                className="group px-10 py-5 text-[16px] font-bold leading-[1.5] rounded-2xl text-indigo-600 bg-white hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                {t("hero.cta_get_started")}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/courses"
                aria-label="Explore Courses"
                className="px-10 py-5 text-[16px] font-bold leading-[1.5] rounded-2xl text-[#F9FAFB] bg-white/10 backdrop-blur-sm border-2 border-white/40 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                {t("hero.cta_explore")}
              </Link>
            </div>
          </div>

          {/* Stats - Enhanced Design with Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
            <div className="group text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:border-white/30 shadow-lg">
              <div className="text-[32px] font-bold leading-[1.5] text-[#F9FAFB] mb-2 group-hover:scale-110 transition-transform">{fmtStat(platformStats.totalCourses)}</div>
              <div className="text-[#F9FAFB]/90 font-bold text-[16px] leading-[1.5]">
                {t("stats.courses")}
              </div>
            </div>
            <div className="group text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:border-white/30 shadow-lg">
              <div className="text-[32px] font-bold leading-[1.5] text-[#F9FAFB] mb-2 group-hover:scale-110 transition-transform">{fmtStat(platformStats.totalInstructors)}</div>
              <div className="text-[#F9FAFB]/90 font-bold text-[16px] leading-[1.5]">
                {t("stats.instructors")}
              </div>
            </div>
            <div className="group text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:border-white/30 shadow-lg">
              <div className="text-[32px] font-bold leading-[1.5] text-[#F9FAFB] mb-2 group-hover:scale-110 transition-transform">{fmtStat(platformStats.totalStudents)}</div>
              <div className="text-[#F9FAFB]/90 font-bold text-[16px] leading-[1.5]">
                {t("stats.students")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Solid White Background */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-[16px] font-medium leading-[1.5] mb-4">
              <TrendingUp className="h-4 w-4" />
              {t("features.badge")}
            </div>
            <h2 className="text-[32px] md:text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-4">
              {t("features.title")}
            </h2>
            <p className="text-[20px] leading-[1.5] text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Video className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
              title={t("features.video_title")}
              desc={t("features.video_desc")}
              delay="0"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
              title={t("features.expert_title")}
              desc={t("features.expert_desc")}
              delay="100"
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-pink-500 to-pink-600"
              title={t("features.lifetime_title")}
              desc={t("features.lifetime_desc")}
              delay="200"
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
              title={t("features.cert_title")}
              desc={t("features.cert_desc")}
              delay="300"
            />
          </div>

          {/* Additional Feature Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
              title={t("features.pace_title")}
              desc={t("features.pace_desc")}
              delay="0"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
              title={t("features.quick_title")}
              desc={t("features.quick_desc")}
              delay="100"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-cyan-500 to-cyan-600"
              title={t("features.secure_title")}
              desc={t("features.secure_desc")}
              delay="200"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-white" />}
              bgColor="bg-gradient-to-br from-rose-500 to-rose-600"
              title={t("features.interactive_title")}
              desc={t("features.interactive_desc")}
              delay="300"
            />
          </div>
        </div>
      </section>

      {/* Recommended Section (Logged In) */}
      {user && Array.isArray(recommended) && recommended.length > 0 && (
        <section className="py-24 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-[16px] leading-[1.5] mb-3">
                  <Zap className="h-4 w-4" /> {t("home.recommended_badge")}
                </div>
                <h2 className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">
                  {t("home.recommended_title")}
                </h2>
              </div>
              <Link
                to="/courses"
                className="text-gray-500 dark:text-gray-400 font-bold text-[16px] leading-[1.5] hover:text-indigo-600 transition-colors flex items-center gap-2 mb-2"
              >
                {t("home.see_more")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommended.slice(0, 3).map((course) => (
                <CourseCard key={course._id} course={course} isRecommended />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses Section */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-4">
              {t("home.featured_title")}
            </h2>
            <p className="text-[20px] leading-[1.5] text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
              {t("home.featured_subtitle")}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.isArray(featured) && featured.length > 0 ? (
                featured.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400 font-bold text-[16px] leading-[1.5] py-20">
                  {t("home.no_featured")}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section with Vibrant Gradient */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), 
                             radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          ></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-[#F9FAFB] px-4 py-2 rounded-full text-[16px] font-medium leading-[1.5] mb-6 border border-white/30">
            <Globe className="h-4 w-4" />
            {t("home.cta_badge")}
          </div>

          <h2 className="text-[32px] md:text-[32px] font-bold leading-[1.5] text-[#F9FAFB] mb-6">
            {t("home.cta_title")}
          </h2>
          <p className="text-[20px] leading-[1.5] text-[#F9FAFB]/90 mb-10 max-w-2xl mx-auto font-medium">
            {t("home.cta_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="group px-10 py-5 text-[16px] font-bold leading-[1.5] rounded-xl text-indigo-600 bg-white hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              {t("home.cta_btn")}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/about"
              className="px-10 py-5 text-[16px] font-bold leading-[1.5] rounded-xl text-[#F9FAFB] bg-white/20 backdrop-blur-sm border-2 border-white/40 hover:bg-white/30 transition-all flex items-center justify-center"
            >
              {t("home.learn_more")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, bgColor, delay }) => (
  <div 
    className="group relative bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border border-gray-100 dark:border-zinc-800 overflow-hidden cursor-pointer"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Animated gradient background on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    {/* Shine effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
    
    {/* Pulse ring effect */}
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping"></div>
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      <div className={`${bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl relative overflow-hidden`}>
        {/* Icon glow effect */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
        <div className="relative z-10">
          {icon}
        </div>
      </div>
      <h3 className="text-[20px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-3 group-hover:text-indigo-600 transition-all duration-300">
        {title}
      </h3>
      <p className="text-[16px] leading-[1.5] text-gray-600 dark:text-gray-300 font-medium mb-6 line-clamp-3">
        {desc}
      </p>
    </div>
    
    {/* Corner accent with animation */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-bl-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>
    
    {/* Bottom border glow */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    
    {/* Floating particles effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
    </div>
  </div>
);

const CourseCard = ({ course, isRecommended }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/courses/${course._id}`} className="group bg-white dark:bg-zinc-900 rounded-[40px] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col hover:-translate-y-2">
      <div className="relative h-64 overflow-hidden">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        {isRecommended && (
          <div className="absolute top-6 left-6 bg-indigo-600 text-[#F9FAFB] px-3 py-1 rounded-full text-[16px] font-bold leading-[1.5] shadow-lg">
            {t('course.picked_for_you')}
          </div>
        )}
        <div className="absolute top-6 right-6 bg-white dark:bg-zinc-900 text-[#111827] dark:text-[#F9FAFB] px-4 py-2 rounded-2xl font-bold text-[16px] leading-[1.5] shadow-xl">
          {course.price === 0 ? t('course.free') : `${course.currency} ${course.price}`}
        </div>
      </div>
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold leading-[1.5] text-indigo-500">{t(`categories.${course.category}`)}</span>
          <div className="flex items-center gap-1 text-yellow-500">
             <Star className="h-3 w-3 fill-yellow-500" />
             <span className="text-[16px] font-bold leading-[1.5]">{course.averageRating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        <h3 className="text-[20px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all line-clamp-2">
          {course.title}
        </h3>
        <div className="pt-4 border-t border-gray-50 dark:border-zinc-800 flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[#F9FAFB] text-[16px] leading-[1.5]">
             {course.instructor?.name?.charAt(0) || "I"}
           </div>
           <span className="text-[16px] font-bold leading-[1.5] text-gray-500 dark:text-gray-400">{course.instructor?.name}</span>
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
