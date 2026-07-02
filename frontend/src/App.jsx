import { lazy, Suspense, useState, useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingBots from './components/FloatingBots';
import MaintenanceMode from './components/MaintenanceMode';
import HomePage from './pages/HomePage';
import { AuthContext } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import BASE_URL from './api/config';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InstructorCoursesPage = lazy(() => import('./pages/InstructorCoursesPage'));
const CourseCatalogPage = lazy(() => import('./pages/CourseCatalogPage'));
const CourseDetailsPage = lazy(() => import('./pages/CourseDetailsPage'));
const CoursePlayerPage = lazy(() => import('./pages/CoursePlayerPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CashManagerDashboard = lazy(() => import('./pages/CashManagerDashboard'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const BundleSuccessPage = lazy(() => import('./pages/BundleSuccessPage'));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const QuizBuilderPage = lazy(() => import('./pages/QuizBuilderPage'));
const QuizPlayerPage = lazy(() => import('./pages/QuizPlayerPage'));
const QuizAttemptsPage = lazy(() => import('./pages/QuizAttemptsPage'));
const PeerReviewPage = lazy(() => import('./pages/PeerReviewPage'));
const BundleManagementPage = lazy(() => import('./pages/BundleManagementPage'));
const BundleDetailsPage = lazy(() => import('./pages/BundleDetailsPage'));
const BundleCheckoutPage = lazy(() => import('./pages/BundleCheckoutPage'));
const BundlePlayerPage = lazy(() => import('./pages/BundlePlayerPage'));
const BundleCertificatePage = lazy(() => import('./pages/BundleCertificatePage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

function App() {
  const { user } = useContext(AuthContext);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${BASE_URL}/settings`);
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode || false);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
    const interval = setInterval(checkMaintenanceMode, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // SuperAdmin can bypass maintenance mode
  const isSuperAdmin = user?.role === 'superAdmin';
  const shouldShowMaintenance = maintenanceMode && !isSuperAdmin;

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceMode />;
  }

  return (
    <Routes>
      <Route path="/certificate/:courseId" element={
        <Suspense fallback={<PageLoader />}>
          <CertificatePage />
        </Suspense>
      } />

      <Route path="/certificate/bundle/:certificateId" element={
        <Suspense fallback={<PageLoader />}>
          <BundleCertificatePage />
        </Suspense>
      } />

      <Route path="/*" element={
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
                <Route path="/instructor/bundles" element={<BundleManagementPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/courses" element={<CourseCatalogPage />} />
                <Route path="/courses/:id" element={<CourseDetailsPage />} />
                <Route path="/player/:id" element={<CoursePlayerPage />} />
                <Route path="/evaluation/:id" element={<EvaluationPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/cash-manager-dashboard" element={<CashManagerDashboard />} />
                <Route path="/checkout/:id" element={<CheckoutPage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />
                <Route path="/bundle-success" element={<BundleSuccessPage />} />
                <Route path="/affiliate" element={<AffiliateDashboard />} />
                <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
                <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />
                <Route path="/messages" element={<ChatPage />} />
                <Route path="/messages/:userId" element={<ChatPage />} />
                <Route path="/instructor/quiz-builder" element={<QuizBuilderPage />} />
                <Route path="/instructor/quiz-builder/:courseId" element={<QuizBuilderPage />} />
                <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
                <Route path="/quiz/:quizId/results" element={<QuizAttemptsPage />} />
                <Route path="/peer-review" element={<PeerReviewPage />} />
                <Route path="/peer-review/:courseId" element={<PeerReviewPage />} />
                <Route path="/bundles/:id" element={<BundleDetailsPage />} />
                <Route path="/bundle-checkout/:id" element={<BundleCheckoutPage />} />
                <Route path="/bundle-player/:id" element={<BundlePlayerPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <FloatingBots />
        </div>
      } />
    </Routes>
  );
}

export default App;
