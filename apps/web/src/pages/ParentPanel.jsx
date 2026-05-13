import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar as CalendarIcon, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const ParentPanel = () => {
    const { studentData, logout } = useAuth();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [fees, setFees] = useState([]);
    const [notes, setNotes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (studentData) {
            loadStudentData();
        }
    }, [studentData]);

    const loadStudentData = async () => {
        try {
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*, sessions(*)')
                .eq('student_id', studentData.id);
            const sortedAttendance = (attendanceData || []).sort((a, b) => new Date(b.sessions?.date || 0) - new Date(a.sessions?.date || 0));
            setAttendance(sortedAttendance);

            const { data: sessionsData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
            setSessions(sessionsData || []);

            const { data: testResultsData } = await supabase
                .from('test_results')
                .select('*, tests(*)')
                .eq('student_id', studentData.id);
            const sortedTests = (testResultsData || []).sort((a, b) => new Date(b.tests?.date || 0) - new Date(a.tests?.date || 0));
            setTestResults(sortedTests);

            const { data: feesData } = await supabase.from('fees').select('*').eq('student_id', studentData.id).order('month', { ascending: false });
            setFees(feesData || []);

            const { data: notesData } = await supabase.from('notes').select('*').eq('student_id', studentData.id).order('created_at', { ascending: false });
            setNotes(notesData || []);

            setLoading(false);
        } catch (error) {
            console.error('Error loading student data:', error);
            setLoading(false);
        }
    };

    const calculateAttendancePercentage = () => {
        if (attendance.length === 0) return 0;
        const present = attendance.filter(a => a.status === 'Present').length;
        return Math.round((present / attendance.length) * 100);
    };

    const calculateAverageMarks = () => {
        if (testResults.length === 0) return 0;
        const total = testResults.reduce((sum, result) => sum + result.marks, 0);
        return Math.round(total / testResults.length);
    };

    const getMonthlyAttendanceSummary = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const monthAttendance = attendance.filter(a => {
            if (!a.sessions?.date) return false;
            const sessionDate = new Date(a.sessions.date);
            return sessionDate >= monthStart && sessionDate <= monthEnd;
        });

        const present = monthAttendance.filter(a => a.status === 'Present').length;
        const absent = monthAttendance.filter(a => a.status === 'Absent').length;
        const late = monthAttendance.filter(a => a.status === 'Late').length;

        return { present, absent, late, total: monthAttendance.length };
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                    </div>
                ))}
                {days.map(day => {
                    const dayAttendance = attendance.find(a => {
                        if (!a.sessions?.date) return false;
                        return isSameDay(new Date(a.sessions.date), day);
                    });

                    let bgColor = 'bg-muted';
                    if (dayAttendance) {
                        if (dayAttendance.status === 'Present') bgColor = 'bg-green-100 border-green-500';
                        else if (dayAttendance.status === 'Absent') bgColor = 'bg-red-100 border-red-500';
                        else if (dayAttendance.status === 'Late') bgColor = 'bg-yellow-100 border-yellow-500';
                    }

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => dayAttendance && setSelectedDate(dayAttendance)}
                            className={`
                aspect-square rounded-lg border-2 border-transparent text-sm font-medium
                transition-all duration-200 hover:scale-105
                ${bgColor}
                ${dayAttendance ? 'cursor-pointer' : 'cursor-default'}
              `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        );
    };

    const getPerformanceChartData = () => {
        return testResults.slice(0, 10).reverse().map(result => ({
            name: result.tests?.name || 'Test',
            marks: result.marks,
            maxMarks: result.tests?.max_marks || 100
        }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const monthSummary = getMonthlyAttendanceSummary();

    return (
        <>
            <Helmet>
                <title>{`${studentData?.name} - Parent Panel - Mentora`}</title>
                <meta name="description" content="Parent panel for viewing student progress in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <header className="bg-card border-b border-border sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold">M</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Mentora</h1>
                                <p className="text-sm text-muted-foreground">{studentData?.name}</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="transition-all duration-200 active:scale-95">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="mentora-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{calculateAttendancePercentage()}%</div>
                            <div className="text-sm text-muted-foreground">Attendance</div>
                        </div>

                        <div className="mentora-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{calculateAverageMarks()}</div>
                            <div className="text-sm text-muted-foreground">Average Marks</div>
                        </div>

                        <div className="mentora-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">
                                {fees.filter(f => f.status === 'Pending').length > 0 ? 'Pending' : 'Paid'}
                            </div>
                            <div className="text-sm text-muted-foreground">Fee Status</div>
                        </div>
                    </div>

                    <div className="mentora-card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">Attendance - {format(currentMonth, 'MMMM yyyy')}</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                    className="transition-all duration-200 active:scale-95"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                    className="transition-all duration-200 active:scale-95"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-700">{monthSummary.present}</div>
                                <div className="text-sm text-green-600">Present</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-3xl font-bold text-red-700">{monthSummary.absent}</div>
                                <div className="text-sm text-red-600">Absent</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-3xl font-bold text-yellow-700">{monthSummary.late}</div>
                                <div className="text-sm text-yellow-600">Late</div>
                            </div>
                        </div>

                        {renderCalendar()}

                        {selectedDate && (
                            <div className="mt-6 p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold mb-2">Session Details</h3>
                                <p className="text-sm"><span className="text-muted-foreground">Date:</span> {format(new Date(selectedDate.sessions?.date), 'PPP')}</p>
                                <p className="text-sm"><span className="text-muted-foreground">Time:</span> {selectedDate.sessions?.start_time} - {selectedDate.sessions?.end_time}</p>
                                <p className="text-sm"><span className="text-muted-foreground">Topic:</span> {selectedDate.sessions?.topic}</p>
                                <p className="text-sm"><span className="text-muted-foreground">Status:</span> <span className={`status-${selectedDate.status.toLowerCase()}`}>{selectedDate.status}</span></p>
                            </div>
                        )}
                    </div>

                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6">Test Performance</h2>
                        {testResults.length > 0 ? (
                            <>
                                <div className="h-80 mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={getPerformanceChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="marks" stroke="hsl(var(--primary))" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="mentora-table">
                                        <thead>
                                            <tr>
                                                <th>Test Name</th>
                                                <th>Date</th>
                                                <th>Marks</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testResults.map(result => (
                                                <tr key={result.id}>
                                                    <td className="font-medium">{result.tests?.name}</td>
                                                    <td>{result.tests?.date ? format(new Date(result.tests.date), 'PP') : '-'}</td>
                                                    <td>{result.marks} / {result.tests?.max_marks}</td>
                                                    <td>{result.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-12">No test results available</p>
                        )}
                    </div>

                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6">Recent Classes</h2>
                        {sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.slice(0, 10).map(session => (
                                    <div key={session.id} className="p-4 bg-muted rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium">{session.topic}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {format(new Date(session.date), 'PPP')} • {session.start_time} - {session.end_time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-12">No recent classes</p>
                        )}
                    </div>

                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6">Fee Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="p-6 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-700 mb-2">
                                    ₹{fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)}
                                </div>
                                <div className="text-sm text-green-600">Total Paid</div>
                            </div>
                            <div className="p-6 bg-red-50 rounded-lg">
                                <div className="text-3xl font-bold text-red-700 mb-2">
                                    ₹{fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)}
                                </div>
                                <div className="text-sm text-red-600">Pending Payment</div>
                            </div>
                        </div>

                        {fees.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="mentora-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map(fee => (
                                            <tr key={fee.id}>
                                                <td>{fee.month}</td>
                                                <td>₹{fee.amount}</td>
                                                <td>
                                                    <span className={fee.status === 'Paid' ? 'status-paid' : 'status-pending'}>
                                                        {fee.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6">Teacher Notes</h2>
                        {notes.length > 0 ? (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="p-4 bg-muted rounded-lg">
                                        <p className="text-sm">{note.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {format(new Date(note.created_at), 'PPp')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-12">No notes from teacher</p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default ParentPanel;