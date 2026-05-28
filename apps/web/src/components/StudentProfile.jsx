import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import AttendanceCalendar from './AttendanceCalendar.jsx';

const StudentProfile = ({ studentId, onClose }) => {
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [fees, setFees] = useState([]);
    const [notes, setNotes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudentData();
    }, [studentId]);

    const loadStudentData = async () => {
        try {
            const { data: studentData } = await supabase.from('students').select('*').eq('id', studentId).single();
            setStudent(studentData);

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*, sessions(*)')
                .eq('student_id', studentId);
            setAttendance(attendanceData || []);

            const { data: sessionsData } = await supabase.from('sessions').select('*');
            setSessions(sessionsData || []);

            const { data: testResultsData } = await supabase
                .from('test_results')
                .select('*, tests(*)')
                .eq('student_id', studentId);
            setTestResults(testResultsData || []);

            const { data: feesData } = await supabase.from('fees').select('*').eq('student_id', studentId).order('month', { ascending: false });
            setFees(feesData || []);

            const { data: notesData } = await supabase.from('notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
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



    const getPerformanceChartData = () => {
        return testResults.slice(0, 10).reverse().map(result => ({
            name: result.tests?.name || 'Test',
            marks: result.marks,
            maxMarks: result.tests?.max_marks || 100
        }));
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card rounded-xl p-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-xl max-w-4xl w-full my-8">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold">Student Profile</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Basic Information</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-muted-foreground">Name:</span> {student?.name}</p>
                                <p><span className="text-muted-foreground">Student ID:</span> {student?.student_login_id}</p>
                                <p><span className="text-muted-foreground">Standard:</span> {student?.standard}</p>
                                <p><span className="text-muted-foreground">Phone:</span> {student?.phone}</p>
                                <p><span className="text-muted-foreground">Parent Phone:</span> {student?.parent_phone}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Performance Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Attendance</span>
                                    <span className="font-semibold text-lg">{calculateAttendancePercentage()}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Average Marks</span>
                                    <span className="font-semibold text-lg">{calculateAverageMarks()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mentora-card">
                        <AttendanceCalendar attendance={attendance} />
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Test Performance
                        </h3>
                        {testResults.length > 0 ? (
                            <>
                                <div className="h-64 mb-4">
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
                                                    <td>{result.tests?.name}</td>
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
                            <p className="text-muted-foreground text-center py-8">No test results available</p>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Fees Status</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">
                                    ₹{fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)}
                                </div>
                                <div className="text-sm text-green-600">Paid</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-700">
                                    ₹{fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)}
                                </div>
                                <div className="text-sm text-red-600">Pending</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Teacher Notes</h3>
                        {notes.length > 0 ? (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm">{note.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(note.created_at), 'PPp')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No notes available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;