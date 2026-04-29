import { BookOpen, Target, Users, Award, TrendingUp, Globe, Lightbulb, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-transparent dark:border-indigo-800/30">
              <BookOpen className="h-4 w-4" />
              {t('about.badge')}
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              {t('about.hero_title')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                {t('about.hero_subtitle')}
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              {t('about.hero_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
              <Target className="h-5 w-5" />
              {t('about.mission_badge')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {t('about.mission_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
              {t('about.mission_desc1')}
            </p>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
              {t('about.mission_desc2')}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{t('about.expert_instructors')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{t('about.flexible_learning')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{t('about.lifetime_access')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-10 rounded-3xl">
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-600 text-white p-3 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{t('about.learn_best_title')}</h3>
                    <p className="text-gray-600 dark:text-zinc-400">
                      {t('about.learn_best_desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-600 text-white p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{t('about.pace_title')}</h3>
                    <p className="text-gray-600 dark:text-zinc-400">
                      {t('about.pace_desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-pink-100 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-600 text-white p-3 rounded-xl">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{t('about.certs_title')}</h3>
                    <p className="text-gray-600 dark:text-zinc-400">
                      {t('about.certs_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Changes Skills Section */}
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-zinc-900 dark:to-indigo-950/20 rounded-3xl p-12 mb-20 border border-transparent dark:border-zinc-800">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
              <Lightbulb className="h-5 w-5" />
              {t('about.skills_badge')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('about.skills_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
              {t('about.skills_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm dark:border dark:border-zinc-800/60 border border-transparent">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{t('about.step1_title')}</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                {t('about.step1_desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm dark:border dark:border-zinc-800/60 border border-transparent">
              <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{t('about.step2_title')}</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                {t('about.step2_desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm dark:border dark:border-zinc-800/60 border border-transparent">
              <div className="bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{t('about.step3_title')}</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                {t('about.step3_desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm dark:border dark:border-zinc-800/60 border border-transparent">
              <div className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                4
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{t('about.step4_title')}</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                {t('about.step4_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Impact Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
            <Globe className="h-5 w-5" />
            {t('about.impact_badge')}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12">
            {t('about.impact_title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-transparent dark:border-indigo-900/30 p-8 rounded-2xl">
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">10K+</div>
              <div className="text-gray-700 dark:text-zinc-300 font-semibold text-lg">{t('about.stat_students')}</div>
              <p className="text-gray-600 dark:text-zinc-400 mt-2">{t('about.stat_students_desc')}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border border-transparent dark:border-purple-900/30 p-8 rounded-2xl">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">500+</div>
              <div className="text-gray-700 dark:text-zinc-300 font-semibold text-lg">{t('about.stat_instructors')}</div>
              <p className="text-gray-600 dark:text-zinc-400 mt-2">{t('about.stat_instructors_desc')}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/20 border border-transparent dark:border-pink-900/30 p-8 rounded-2xl">
              <div className="text-5xl font-bold text-pink-600 dark:text-pink-400 mb-2">1000+</div>
              <div className="text-gray-700 dark:text-zinc-300 font-semibold text-lg">{t('about.stat_courses')}</div>
              <p className="text-gray-600 dark:text-zinc-400 mt-2">{t('about.stat_courses_desc')}</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t('about.cta_title')}</h2>
          <p className="text-xl mb-8 text-indigo-100">
            {t('about.cta_subtitle')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t('about.cta_get_started')}
            </a>
            <a
              href="/courses"
              className="inline-flex items-center px-8 py-4 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-colors border-2 border-white"
            >
              {t('about.cta_browse')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
