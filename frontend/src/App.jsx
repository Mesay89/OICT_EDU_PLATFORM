import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingBots from './components/FloatingBots';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InstructorCoursesPage from './pages/InstructorCoursesPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import ChatPage from './pages/ChatPage';
import EvaluationPage from './pages/EvaluationPage';
import CertificatePage from './pages/CertificatePage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PricingPage from './pages/PricingPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import BundleSuccessPage from './pages/BundleSuccessPage';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AboutPage from './pages/AboutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import QuizBuilderPage from './pages/QuizBuilderPage';
import QuizPlayerPage from './pages/QuizPlayerPage';
import PeerReviewPage from './pages/PeerReviewPage';

function App() {
  return (
    <Routes>
      {/* Certificate route — completely standalone, no navbar/footer */}
      <Route path="/certificate/:courseId" element={<CertificatePage />} />

      {/* All other routes — with navbar + footer */}
      <Route path="/*" element={
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailsPage />} />
              <Route path="/player/:id" element={<CoursePlayerPage />} />
              <Route path="/evaluation/:id" element={<EvaluationPage />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/checkout/:id" element={<CheckoutPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />
              <Route path="/bundle-success" element={<BundleSuccessPage />} />
              <Route path="/affiliate" element={<AffiliateDashboard />} />
              <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
              <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />
              <Route path="/messages" element={<ChatPage />} />
              <Route path="/messages/:userId" element={<ChatPage />} />
              <Route path="/instructor/quiz-builder/:courseId" element={<QuizBuilderPage />} />
              <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
              <Route path="/peer-review/:courseId" element={<PeerReviewPage />} />
            </Routes>
          </main>
          <Footer />
          <FloatingBots />
        </div>
      } />
    </Routes>
  );
}

export default App;
