import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { calculateAveragePercentage } from '@/lib/utils';
import { LogOut, Calendar as CalendarIcon, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import AttendanceCalendar from '../components/AttendanceCalendar.jsx';

const ParentPanel = () => {
    const { studentData, logout } = useAuth();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [fees, setFees] = useState([]);
    const [notes, setNotes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

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

            // Fetch student batch assignments to display only relevant sessions
            const { data: studentBatches } = await supabase
                .from('student_batches')
                .select('batch_id')
                .eq('student_id', studentData.id);
            const batchIds = (studentBatches || []).map(sb => sb.batch_id);

            let sessionsData = [];
            if (batchIds.length > 0) {
                const { data: sData } = await supabase
                    .from('sessions')
                    .select('*')
                    .in('batch_id', batchIds)
                    .order('date', { ascending: false });
                sessionsData = sData || [];
            }
            setSessions(sessionsData);

            // Fetch all tests belonging to these batch IDs to show complete test history
            let testsData = [];
            if (batchIds.length > 0) {
                const { data: tData } = await supabase
                    .from('tests')
                    .select('*')
                    .in('batch_id', batchIds);
                testsData = tData || [];
            }

            // Fetch the student's test results
            const { data: testResultsData } = await supabase
                .from('test_results')
                .select('*, tests(*)')
                .eq('student_id', studentData.id);

            // Combine tests and test results so that tests with no marks entered are still visible
            const combinedResults = testsData.map(test => {
                const result = (testResultsData || []).find(r => r.test_id === test.id);
                return {
                    id: result?.id || `missing-${test.id}`,
                    student_id: studentData.id,
                    test_id: test.id,
                    marks: result ? result.marks : null,
                    is_absent: result ? !!result.is_absent : false,
                    remarks: result ? result.remarks : 'Not graded / Absent',
                    tests: test
                };
            });

            // Sort all combined results chronologically (oldest first) so that the line chart is plotted continuously
            const sortedTests = combinedResults.sort((a, b) => (a.tests?.date || '').localeCompare(b.tests?.date || ''));
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
        return calculateAveragePercentage(testResults);
    };

    const getAverageRawFraction = () => {
        const gradedResults = testResults.filter(r => r.marks !== null && !r.is_absent);
        if (gradedResults.length === 0) return '0/0';
        const totalObtained = gradedResults.reduce((sum, r) => sum + Number(r.marks), 0);
        const totalMax = gradedResults.reduce((sum, r) => sum + Number(r.tests?.max_marks || 30), 0);
        return `${totalObtained}/${totalMax}`;
    };



    const getPerformanceChartData = () => {
        return testResults
            .filter(result => result.marks !== null && !result.is_absent)
            .slice(-10)
            .map(result => ({
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
                    {/* Student Information Card */}
                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6 text-foreground">Student Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-foreground">
                            <div className="space-y-4">
                                <p>
                                    <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-1">Student Name</span> 
                                    <span className="font-semibold text-lg">{studentData?.name}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-1">Student ID</span> 
                                    <span className="font-semibold">{studentData?.student_login_id}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-1">Standard / Class</span> 
                                    <span className="font-semibold">{studentData?.standard}</span>
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <p>
                                        <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-1">Phone Number</span> 
                                        <span className="font-semibold">{studentData?.phone || 'Not Provided'}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-1">Parent Phone</span> 
                                        <span className="font-semibold">{studentData?.parent_phone || 'Not Provided'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Summary Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-foreground">Performance Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="mentora-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <CalendarIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold mb-1 text-foreground">{calculateAttendancePercentage()}%</div>
                                <div className="text-sm text-muted-foreground">Attendance</div>
                            </div>

                            <div className="mentora-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold mb-1 text-foreground">{calculateAverageMarks()}%</div>
                                <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
                                    <span>Average Marks</span>
                                    <span className="text-xs font-normal opacity-85">
                                        Based on total test scores ({getAverageRawFraction()})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reusable Attendance Calendar Card */}
                    <div className="mentora-card">
                        <AttendanceCalendar attendance={attendance} />
                    </div>

                    <div className="mentora-card">
                        <h2 className="text-2xl font-bold mb-6">Test Performance</h2>
                        {testResults.length > 0 ? (
                            (() => {
                                const chartData = getPerformanceChartData();
                                const maxChartMarks = chartData.length > 0 ? Math.max(...chartData.map(d => Math.max(d.maxMarks, d.marks))) : 20;
                                return (
                                    <>
                                        <div className="h-80 mb-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis domain={[0, maxChartMarks]} />
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
                                                     {[...testResults].reverse().map(result => (
                                                         <tr key={result.id}>
                                                             <td className="font-medium">{result.tests?.name}</td>
                                                             <td>{result.tests?.date ? format(new Date(result.tests.date), 'PP') : '-'}</td>
                                                             <td>
                                                                 {result.is_absent ? (
                                                                     <span className="text-red-600 font-semibold">Absent</span>
                                                                 ) : (
                                                                     `${result.marks !== null ? result.marks : '-'} / ${result.tests?.max_marks}`
                                                                 )}
                                                             </td>
                                                             <td>{result.remarks || '-'}</td>
                                                         </tr>
                                                     ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()
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