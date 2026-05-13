import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [topPerformers, setTopPerformers] = useState([]);
    const [weakStudents, setWeakStudents] = useState([]);
    const [lowAttendance, setLowAttendance] = useState([]);
    const [batchPerformance, setBatchPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const [{ data: students }, { data: testResults }, { data: attendance }, { data: batches }] = await Promise.all([
                supabase.from('students').select('*'),
                supabase.from('test_results').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('batches').select('*')
            ]);

            const studentStats = (students || []).map(student => {
                const studentTests = (testResults || []).filter(r => r.student_id === student.id);
                const studentAttendance = (attendance || []).filter(a => a.student_id === student.id);

                const avgMarks = studentTests.length > 0
                    ? Math.round(studentTests.reduce((sum, r) => sum + r.marks, 0) / studentTests.length)
                    : 0;

                const attendancePercentage = studentAttendance.length > 0
                    ? Math.round((studentAttendance.filter(a => a.status === 'Present').length / studentAttendance.length) * 100)
                    : 0;

                return {
                    ...student,
                    avgMarks,
                    attendancePercentage,
                    testCount: studentTests.length
                };
            });

            const top = studentStats
                .filter(s => s.testCount > 0)
                .sort((a, b) => b.avgMarks - a.avgMarks)
                .slice(0, 10);
            setTopPerformers(top);

            const weak = studentStats
                .filter(s => s.testCount > 0 && s.avgMarks < 50)
                .sort((a, b) => a.avgMarks - b.avgMarks)
                .slice(0, 10);
            setWeakStudents(weak);

            const low = studentStats
                .filter(s => s.attendancePercentage < 75)
                .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
                .slice(0, 10);
            setLowAttendance(low);

            const batchStats = await Promise.all((batches || []).map(async (batch) => {
                const { data: assignments } = await supabase
                    .from('student_batches')
                    .select('*')
                    .eq('batch_id', batch.id);

                const batchStudentIds = (assignments || []).map(a => a.student_id);
                const batchStudents = studentStats.filter(s => batchStudentIds.includes(s.id));

                const avgAttendance = batchStudents.length > 0
                    ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / batchStudents.length)
                    : 0;

                const avgMarks = batchStudents.length > 0
                    ? Math.round(batchStudents.reduce((sum, s) => sum + s.avgMarks, 0) / batchStudents.length)
                    : 0;

                return {
                    name: batch.name,
                    avgAttendance,
                    avgMarks,
                    studentCount: batchStudents.length
                };
            }));

            setBatchPerformance(batchStats);
            setLoading(false);
        } catch (error) {
            console.error('Error loading reports:', error);
            setLoading(false);
        }
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
                <title>Reports - Mentora</title>
                <meta name="description" content="View performance reports in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
                                <p className="text-muted-foreground">Performance insights and trends</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="mentora-card">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                        Top Performers
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="mentora-table">
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Student</th>
                                                    <th>Avg Marks</th>
                                                    <th>Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topPerformers.map((student, index) => (
                                                    <tr key={student.id}>
                                                        <td className="font-bold text-primary">{index + 1}</td>
                                                        <td className="font-medium">{student.name}</td>
                                                        <td>{student.avgMarks}</td>
                                                        <td>{student.attendancePercentage}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {topPerformers.length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">No data available</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mentora-card">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                        Students Needing Support
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="mentora-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Avg Marks</th>
                                                    <th>Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {weakStudents.map(student => (
                                                    <tr key={student.id}>
                                                        <td className="font-medium">{student.name}</td>
                                                        <td className="text-red-600 font-semibold">{student.avgMarks}</td>
                                                        <td>{student.attendancePercentage}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {weakStudents.length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">No students below 50%</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    Low Attendance Alert
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="mentora-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Standard</th>
                                                <th>Attendance</th>
                                                <th>Avg Marks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowAttendance.map(student => (
                                                <tr key={student.id}>
                                                    <td className="font-medium">{student.name}</td>
                                                    <td>{student.standard}</td>
                                                    <td className="text-red-600 font-semibold">{student.attendancePercentage}%</td>
                                                    <td>{student.avgMarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {lowAttendance.length === 0 && (
                                        <p className="text-center py-8 text-muted-foreground">All students have good attendance</p>
                                    )}
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Batch Performance</h2>
                                {batchPerformance.length > 0 ? (
                                    <>
                                        <div className="h-80 mb-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={batchPerformance}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="avgAttendance" fill="hsl(var(--primary))" name="Avg Attendance %" />
                                                    <Bar dataKey="avgMarks" fill="hsl(142 76% 36%)" name="Avg Marks" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="mentora-table">
                                                <thead>
                                                    <tr>
                                                        <th>Batch</th>
                                                        <th>Students</th>
                                                        <th>Avg Attendance</th>
                                                        <th>Avg Marks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchPerformance.map((batch, index) => (
                                                        <tr key={index}>
                                                            <td className="font-medium">{batch.name}</td>
                                                            <td>{batch.studentCount}</td>
                                                            <td>{batch.avgAttendance}%</td>
                                                            <td>{batch.avgMarks}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center py-12 text-muted-foreground">No batch data available</p>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default ReportsPage;