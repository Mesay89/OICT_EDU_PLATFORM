import { BookOpen, Target, Users, Award, TrendingUp, Globe, Lightbulb, CheckCircle, Sparkles, ArrowRight, Star, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      {/* Hero Section - Enhanced with Modern Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-bold mb-8 border border-white/20 shadow-lg">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              {t('about.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              <span className="block mb-2">{t('about.hero_title')}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 animate-gradient drop-shadow-2xl">
                {t('about.hero_subtitle')}
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium mb-10 drop-shadow-lg">
              {t('about.hero_desc')}
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <a
                href="/register"
                className="group px-8 py-4 text-lg font-bold rounded-xl text-indigo-600 bg-white hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/courses"
                className="px-8 py-4 text-lg font-bold rounded-xl text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                Explore Courses
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <div className="text-4xl font-black text-white mb-2">10K+</div>
                <div className="text-white/80 font-bold text-sm uppercase tracking-widest">Active Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <div className="text-4xl font-black text-white mb-2">500+</div>
                <div className="text-white/80 font-bold text-sm uppercase tracking-widest">Expert Instructors</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <div className="text-4xl font-black text-white mb-2">1000+</div>
                <div className="text-white/80 font-bold text-sm uppercase tracking-widest">Quality Courses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section - Redesigned with Modern Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-indigo-200 dark:border-indigo-800">
              <Target className="h-4 w-4" />
              {t('about.mission_badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
              {t('about.mission_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
              {t('about.mission_desc1')}
            </p>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-8">
              {t('about.mission_desc2')}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="font-bold text-lg">{t('about.expert_instructors')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-bold text-lg">{t('about.flexible_learning')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="font-bold text-lg">{t('about.lifetime_access')}</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="space-y-6">
              {/* Card 1 - Enhanced with Hover Effects */}
              <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-indigo-200 dark:border-indigo-800/50 hover:scale-105 hover:-translate-y-2">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white text-xl mb-3">{t('about.learn_best_title')}</h3>
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {t('about.learn_best_desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-200 dark:border-purple-800/50 hover:scale-105 hover:-translate-y-2">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white text-xl mb-3">{t('about.pace_title')}</h3>
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {t('about.pace_desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/20 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-pink-200 dark:border-pink-800/50 hover:scale-105 hover:-translate-y-2">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white text-xl mb-3">{t('about.certs_title')}</h3>
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {t('about.certs_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Changes Skills Section - Modern Timeline Design */}
        <div className="relative bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-[3rem] p-12 md:p-16 mb-32 border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-300/20 to-yellow-300/20 rounded-full blur-3xl"></div>

          <div className="text-center mb-16 relative z-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-lg">
              <Rocket className="h-5 w-5" />
              {t('about.skills_badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              {t('about.skills_title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto font-medium">
              {t('about.skills_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
            {/* Step 1 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-zinc-800 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  1
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-xl mb-4">{t('about.step1_title')}</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {t('about.step1_desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-zinc-800 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  2
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-xl mb-4">{t('about.step2_title')}</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {t('about.step2_desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-zinc-800 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  3
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-xl mb-4">{t('about.step3_title')}</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {t('about.step3_desc')}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-zinc-800 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  4
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-xl mb-4">{t('about.step4_title')}</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {t('about.step4_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Section - Enhanced Stats Display */}
        <div className="text-center mb-32">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-lg">
            <Globe className="h-5 w-5" />
            {t('about.impact_badge')}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {t('about.impact_title')}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto mb-16 font-medium">
            Join thousands of learners achieving their goals every day
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat Card 1 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3">10K+</div>
                <div className="text-gray-900 dark:text-white font-black text-xl mb-2">{t('about.stat_students')}</div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium">{t('about.stat_students_desc')}</p>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-3">500+</div>
                <div className="text-gray-900 dark:text-white font-black text-xl mb-2">{t('about.stat_instructors')}</div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium">{t('about.stat_instructors_desc')}</p>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="group relative bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-pink-100 dark:border-pink-900/50 hover:border-pink-300 dark:hover:border-pink-700 hover:-translate-y-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 mb-3">1000+</div>
                <div className="text-gray-900 dark:text-white font-black text-xl mb-2">{t('about.stat_courses')}</div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium">{t('about.stat_courses_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Premium Design */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl">
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
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-bold mb-8 border border-white/30 shadow-lg">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              Join Our Community Today
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              {t('about.cta_title')}
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto font-medium leading-relaxed">
              {t('about.cta_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="group inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-600 font-black text-lg rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 gap-2"
              >
                {t('about.cta_get_started')}
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/courses"
                className="inline-flex items-center justify-center px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-black text-lg rounded-2xl hover:bg-white/20 transition-all border-2 border-white/40 gap-2"
              >
                {t('about.cta_browse')}
                <BookOpen className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
