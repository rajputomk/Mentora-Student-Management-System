import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Button } from '@/components/ui/button';
import { Users, Calendar, DollarSign, TrendingUp, Play, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { calculateAveragePercentage } from '@/lib/utils';

const TeacherDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        todaySessions: 0,
        pendingFees: 0,
        avgPerformance: 0
    });
    const [todaySessions, setTodaySessions] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const { data: students } = await supabase.from('students').select('*');

            const today = new Date().toISOString().split('T')[0];
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            const { data: sessions } = await supabase
                .from('sessions')
                .select('*, batches(*)')
                .gte('date', today)
                .lt('date', nextDayStr);

            const { data: fees } = await supabase
                .from('fees')
                .select('*')
                .eq('status', 'Pending');

            const { data: testResults } = await supabase.from('test_results').select('*, tests(*)');
            const avgMarks = calculateAveragePercentage(testResults);

            setStats({
                totalStudents: students ? students.length : 0,
                todaySessions: sessions ? sessions.length : 0,
                pendingFees: fees ? fees.reduce((sum, f) => sum + f.amount, 0) : 0,
                avgPerformance: avgMarks
            });

            setTodaySessions(sessions || []);

            const { data: attendance } = await supabase
                .from('attendance')
                .select('*, students(*), sessions(*)')
                .eq('status', 'Absent')
                .order('created_at', { ascending: false });

            const alertsList = [
                ...(attendance || []).slice(0, 3).map(a => ({
                    type: 'absence',
                    message: `${a.students?.name} was absent`,
                    time: a.created_at
                })),
                ...(fees || []).slice(0, 3).map(f => {
                    const student = (students || []).find(s => s.id === f.student_id);
                    return {
                        type: 'fee',
                        message: `${student?.name} has pending fee of ₹${f.amount}`,
                        time: f.created_at || new Date()
                    };
                })
            ].slice(0, 5);

            setAlerts(alertsList);

            const { data: recentTests } = await supabase
                .from('tests')
                .select('*, batches(*)')
                .order('created_at', { ascending: false });

            const activity = [
                ...(sessions || []).slice(0, 2).map(s => ({
                    type: 'session',
                    message: `Session scheduled: ${s.topic}`,
                    time: s.created_at
                })),
                ...(recentTests || []).slice(0, 2).map(t => ({
                    type: 'test',
                    message: `Test created: ${t.name}`,
                    time: t.created_at
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            setRecentActivity(activity);
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    const handleStartSession = (sessionId) => {
        navigate(`/teacher/sessions?session=${sessionId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Dashboard - Mentora</title>
                <meta name="description" content="Teacher dashboard for Mentora education management system" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                                <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{stats.totalStudents}</div>
                                    <div className="text-sm text-muted-foreground">Total Students</div>
                                </div>

                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{stats.todaySessions}</div>
                                    <div className="text-sm text-muted-foreground">Today's Sessions</div>
                                </div>

                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="h-6 w-6 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">₹{stats.pendingFees}</div>
                                    <div className="text-sm text-muted-foreground">Pending Fees</div>
                                </div>

                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{stats.avgPerformance}%</div>
                                    <div className="text-sm text-muted-foreground">Avg Performance</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="mentora-card">
                                    <h2 className="text-xl font-bold mb-4">Today's Sessions</h2>
                                    {todaySessions.length > 0 ? (
                                        <div className="space-y-3">
                                            {todaySessions.map(session => (
                                                <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{session.topic}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {session.start_time} - {session.end_time}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {session.batches?.name}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStartSession(session.id)}
                                                        className="transition-all duration-200 active:scale-95"
                                                    >
                                                        <Play className="h-4 w-4 mr-1" />
                                                        Start
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No sessions scheduled for today</p>
                                    )}
                                </div>

                                <div className="mentora-card">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        Alerts
                                    </h2>
                                    {alerts.length > 0 ? (
                                        <div className="space-y-3">
                                            {alerts.map((alert, index) => (
                                                <div key={index} className="p-3 bg-muted rounded-lg">
                                                    <div className="text-sm">{alert.message}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {format(new Date(alert.time), 'PPp')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No alerts</p>
                                    )}
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                                {recentActivity.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentActivity.map((activity, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                                <div className="flex-1">
                                                    <div className="text-sm">{activity.message}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {format(new Date(activity.time), 'PPp')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default TeacherDashboard;