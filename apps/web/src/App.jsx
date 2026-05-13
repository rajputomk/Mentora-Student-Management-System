import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import LoginPage from './pages/LoginPage.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import BatchesPage from './pages/BatchesPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import TestsPage from './pages/TestsPage.jsx';
import FeesPage from './pages/FeesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ParentPanel from './pages/ParentPanel.jsx';
import { Toaster } from '@/components/ui/sonner';

function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/students"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <StudentsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/batches"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <BatchesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/sessions"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <SessionsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/tests"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TestsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/fees"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <FeesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/reports"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <ReportsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/settings"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <SettingsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/parent"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentPanel />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                <Toaster />
            </Router>
        </AuthProvider>
    );
}

export default App;