import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveTestPage from './pages/LiveTestPage';
import TestPage from './pages/TestPage';
import SubmitPage from './pages/SubmitPage';
import VideosPage from './pages/VideosPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import ResultsPage from './pages/ResultsPage';
import LoadTestPage from './pages/LoadTestPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/test" element={<ProtectedRoute><LiveTestPage /></ProtectedRoute>} />
          <Route path="/test/:testId" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
          <Route path="/test/:testId/submit" element={<ProtectedRoute><SubmitPage /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
          <Route path="/videos/:questionId" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/loadtest" element={<ProtectedRoute><LoadTestPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
