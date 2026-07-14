import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import BASE_URL from '../api/config';
import { useCurrency } from '../context/CurrencyContext';
import { useTimezone } from '../context/TimezoneContext';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Clock, Star, Filter, ArrowRight, Loader2, BookOpen, Shield, Calendar, Package } from 'lucide-react';

// Premium Skeleton Component for Perceived Speed
const CourseSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm animate-pulse">
    <div className="h-56 bg-gray-200 dark:bg-zinc-800"></div>
    <div className="p-8 space-y-4">
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-8 w-full bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
      <div className="h-20 w-full bg-gray-100 dark:bg-zinc-900 rounded-2xl"></div>
      <div className="flex justify-between pt-4">
        <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
        <div className="h-6 w-12 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
      </div>
    </div>
  </div>
);

const CourseCatalogPage = () => {
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All Levels');
  const { formatPrice } = useCurrency();
  const { formatDate } = useTimezone();
  const { t } = useTranslation();

  const categories = ['All', 'Programming', 'Science', 'General', 'Health & Fitness', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Language'];
  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  // Debouncing logic for "Instant Search" response
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); 
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (activeCategory !== 'All') params.append('category', activeCategory);
        if (activeLevel !== 'All Levels') params.append('level', activeLevel);
        
        const [coursesRes, bundlesRes] = await Promise.all([
          axios.get(`${BASE_URL}/courses?${params.toString()}`),
          axios.get(`${BASE_URL}/bundles`),
        ]);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setBundles(Array.isArray(bundlesRes.data) ? bundlesRes.data : []);
        setError(null);
      } catch (error) {
        console.error('Failed to load courses:', error);
        setError(error.message || 'Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [debouncedSearch, activeCategory, activeLevel]);

  // Filter bundles by search term, category, and level on the frontend
  const filteredBundles = bundles.filter(bundle => {
    // 1. Search term filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesBundleTitle = bundle.title?.toLowerCase().includes(searchLower);
      const matchesBundleDesc = bundle.description?.toLowerCase().includes(searchLower);
      const matchesCourseTitle = bundle.courses?.some(c => c.title?.toLowerCase().includes(searchLower));
      if (!matchesBundleTitle && !matchesBundleDesc && !matchesCourseTitle) {
        return false;
      }
    }
    // 2. Category filter
    if (activeCategory !== 'All') {
      const matchesCategory = bundle.courses?.some(c => c.category === activeCategory);
      if (!matchesCategory) return false;
    }
    // 3. Level filter
    if (activeLevel !== 'All Levels') {
      const matchesLevel = bundle.courses?.some(c => c.level === activeLevel);
      if (!matchesLevel) return false;
    }
    return true;
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const intent = searchParams.get('intent');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Dynamic Header Section */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 pt-20 pb-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest mx-auto lg:mx-0">
                <BookOpen className="h-3 w-3" /> {t("course.catalog_badge")}
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                {t("nav.courses")}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                {t("course.catalog_subtitle")}
              </p>
            </div>

            <div className="relative w-full lg:w-[450px] mx-auto lg:mx-0">
              <Search
                className={`absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 transition-colors ${search ? "text-indigo-600" : "text-gray-400"}`}
              />
              <input
                type="text"
                placeholder={t("course.search_placeholder")}
                aria-label="Search courses"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-zinc-950 border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-500 rounded-[28px] outline-none transition-all font-bold text-gray-900 dark:text-white shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {loading && search && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Loader2 className="animate-spin h-5 w-5 text-indigo-600" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            <div className="flex items-center gap-3 min-w-max">
              <Filter className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all border-2 flex-shrink-0 ${activeCategory === cat ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-transparent border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-indigo-600 dark:hover:border-indigo-500"}`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            <div className="flex items-center gap-3 min-w-max">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg flex-shrink-0">
                <span className="font-black text-[10px] text-gray-500 uppercase tracking-widest">
                  {t("course.level")}
                </span>
              </div>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  aria-pressed={activeLevel === lvl}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all border-2 flex-shrink-0 ${activeLevel === lvl ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-transparent border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-purple-600 dark:hover:border-purple-500"}`}
                >
                  {t(`levels.${lvl}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="max-w-7xl mx-auto px-6 py-16 relative"
        style={{
          backgroundImage: `url('/images/library.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Content with improved readability using text shadows instead of overlay */}
        <div className="relative z-10">{/* All content goes here */}
        {loading && (!courses || !courses.length) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-12 rounded-[40px] text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
              {t("course.connection_interrupted")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-8">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
              aria-label="Retry connection"
            >
              {t("course.retry")}
            </button>
          </div>
        ) : Array.isArray(courses) && courses.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-[48px] border-2 border-dashed border-gray-100 dark:border-zinc-800">
            <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-950 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {t("course.no_matches")}
            </h2>
            <p className="text-gray-500 font-bold">
              {t("course.adjust_filters")}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setActiveLevel("All Levels");
              }}
              className="mt-8 text-indigo-600 font-black hover:underline underline-offset-8"
              aria-label="Reset all filters"
            >
              {t("course.reset_filters")}
            </button>
          </div>
        ) : (
          <>
            {/* Bundles Section — filtered by search term */}
            {filteredBundles.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                    <Package className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Bundle Deals {debouncedSearch && <span className="text-violet-500 text-lg">for "{debouncedSearch}"</span>}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Save more with our curated course bundles
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredBundles.map((bundle) => (
                    <Link
                      to={`/bundles/${bundle._id}`}
                      key={bundle._id}
                      className="group bg-white dark:bg-zinc-900 rounded-[40px] border-2 border-violet-100 dark:border-violet-900/40 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 flex flex-col transform hover:-translate-y-2"
                    >
                      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-900">
                        {bundle.image ? (
                          <img
                            src={bundle.image}
                            alt={bundle.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="h-20 w-20 text-violet-400 opacity-40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Bundle Badge */}
                        <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                          <Package className="h-3 w-3" /> Bundle Deal
                        </div>
                        <div className="absolute top-6 right-6 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl">
                          {formatPrice(bundle.price).formatted}
                        </div>
                        <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                          <span className="bg-violet-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2">
                            View Bundle <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border border-violet-100 dark:border-violet-800/50">
                            {bundle.courses?.length || 0} Courses
                          </span>
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border border-blue-100 dark:border-blue-800/50">
                            {bundle.modules?.filter(m => m.isReleased)?.length || 0} Modules
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
                          {bundle.title}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4 flex-grow">
                          {bundle.description}
                        </p>
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-zinc-800">
                          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center font-black text-white text-xs">
                            {bundle.instructor?.name?.charAt(0) || "I"}
                          </div>
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {bundle.instructor?.name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Courses Section */}
            {bundles.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Individual Courses
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Browse all available courses
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.isArray(courses) &&
                courses.map((course) => (
                  <Link
                    to={`/courses/${course._id}${intent ? `?intent=${intent}` : ""}`}
                    key={course._id}
                    className="group bg-white dark:bg-zinc-900 rounded-[40px] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col transform hover:-translate-y-2"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={
                          course.image ||
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3"
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-6 right-6 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                        {
                          formatPrice(course.price, false, course.currency)
                            .formatted
                        }
                      </div>
                      <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                        <span className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2">
                          {t("course.discover_details")}{" "}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                          {t(`categories.${course.category}`)}
                        </span>
                        {course.level && course.level !== "All Levels" && (
                          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border border-purple-100 dark:border-purple-800/50">
                            {t(`levels.${course.level}`)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
                            {course.instructor?.name?.charAt(0) || "I"}
                          </div>
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {course.instructor?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[10px] font-bold">
                            {t("course.added_on")}:{" "}
                            {formatDate(course.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </>
        )}
        </div> {/* Close relative z-10 wrapper */}
      </div>
    </div>
  );
};

export default CourseCatalogPage;
