import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { GraduationCap, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
    const [mode, setMode] = useState('teacher');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginTeacher, loginParent } = useAuth();
    const navigate = useNavigate();

    const handleTeacherLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await loginTeacher(email, password);
            toast.success('Login successful');
            navigate('/teacher/dashboard');
        } catch (error) {
            toast.error(error.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleParentLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await loginParent(studentId);
            toast.success('Login successful');
            navigate('/parent');
        } catch (error) {
            toast.error(error.message || 'Invalid student ID');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Login - Mentora</title>
                <meta name="description" content="Login to Mentora education management system" />
            </Helmet>

            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-md my-auto">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Welcome to Mentora</h1>
                        <p className="text-muted-foreground">Education management made simple</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-2 mb-6">
                            <Button
                                variant={mode === 'teacher' ? 'default' : 'outline'}
                                className="flex-1 w-full"
                                onClick={() => setMode('teacher')}
                            >
                                <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                                <span>Teacher Login</span>
                            </Button>
                            <Button
                                variant={mode === 'parent' ? 'default' : 'outline'}
                                className="flex-1 w-full"
                                onClick={() => setMode('parent')}
                            >
                                <User className="h-4 w-4 mr-2 shrink-0" />
                                <span>Parent Login</span>
                            </Button>
                        </div>

                        {mode === 'teacher' ? (
                            <form onSubmit={handleTeacherLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="mentora-input text-foreground"
                                        placeholder="teacher@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="mentora-input text-foreground w-full pr-10"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login as Teacher'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleParentLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Student ID</label>
                                    <input
                                        type="text"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        required
                                        className="mentora-input text-foreground"
                                        placeholder="Enter student ID"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login as Parent'}
                                </Button>

                                <p className="text-xs text-muted-foreground text-center">
                                    Parents can login using their child's student ID
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;