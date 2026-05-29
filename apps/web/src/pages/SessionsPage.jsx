import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Button } from '@/components/ui/button';
import { Check, X, CheckCircle2, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SessionsPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'manage'
    
    // New/Edit Session States
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [students, setStudents] = useState([]);
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('17:00');
    const [endTime, setEndTime] = useState('18:00');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);

    // Manage Sessions States
    const [manageDate, setManageDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [manageSessions, setManageSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        loadBatches();
    }, []);

    useEffect(() => {
        if (selectedBatch && !editingSessionId) {
            loadBatchStudents();
        }
    }, [selectedBatch]);

    useEffect(() => {
        if (activeTab === 'manage') {
            loadManageSessions();
        }
    }, [activeTab, manageDate]);

    const loadBatches = async () => {
        try {
            const { data, error } = await supabase.from('batches').select('*').order('name');
            if (error) throw error;
            setBatches(data || []);
        } catch (error) {
            console.error('Error loading batches:', error);
            toast.error('Failed to load batches');
        }
    };

    const loadBatchStudents = async () => {
        setLoading(true);
        try {
            const { data: assignments, error } = await supabase
                .from('student_batches')
                .select('*, students(*)')
                .eq('batch_id', selectedBatch);

            if (error) throw error;

            const studentsList = (assignments || []).map(a => a.students).filter(Boolean);
            setStudents(studentsList);

            const initialAttendance = {};
            studentsList.forEach(student => {
                initialAttendance[student.id] = 'Present';
            });
            setAttendance(initialAttendance);

            setLoading(false);
        } catch (error) {
            console.error('Error loading students:', error);
            toast.error('Failed to load students');
            setLoading(false);
        }
    };

    const loadManageSessions = async () => {
        setLoadingSessions(true);
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('*, batches(name, standard), attendance(status)')
                .eq('date', manageDate)
                .order('start_time');
            if (error) throw error;
            setManageSessions(data || []);
        } catch (error) {
            console.error('Error loading sessions:', error);
            toast.error('Failed to load sessions');
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to delete this session? All attendance records for this session will also be deleted.')) return;
        try {
            const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
            if (error) throw error;
            toast.success('Session deleted successfully');
            loadManageSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Failed to delete session');
        }
    };

    const handleEditSession = async (session) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*, students(*)')
                .eq('session_id', session.id);
            
            if (error) throw error;
            
            // Set all states for editing
            setEditingSessionId(session.id);
            setSelectedBatch(session.batch_id);
            setTopic(session.topic);
            setDate(session.date);
            setStartTime(session.start_time);
            setEndTime(session.end_time);
            
            const studentsList = (data || []).map(a => a.students).filter(Boolean);
            setStudents(studentsList);
            
            const loadedAttendance = {};
            data.forEach(a => {
                loadedAttendance[a.student_id] = a.status;
            });
            setAttendance(loadedAttendance);
            
            setActiveTab('new');
        } catch (error) {
            console.error('Error loading session details:', error);
            toast.error('Failed to load session details');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAll = (status) => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student.id] = status;
        });
        setAttendance(newAttendance);
    };

    const handleSaveSession = async () => {
        if (!selectedBatch || !topic.trim()) {
            toast.error('Please select a batch and enter a topic');
            return;
        }
        if (!date || !startTime || !endTime) {
            toast.error('Please enter date, start time, and end time');
            return;
        }

        setSaving(true);
        try {
            if (editingSessionId) {
                // Update existing session
                const { error: sessionError } = await supabase.from('sessions').update({
                    batch_id: selectedBatch,
                    date: date,
                    start_time: startTime,
                    end_time: endTime,
                    topic: topic
                }).eq('id', editingSessionId);

                if (sessionError) throw sessionError;

                // Update attendance
                for (const student of students) {
                    const { data: existing } = await supabase
                        .from('attendance')
                        .select('id')
                        .eq('session_id', editingSessionId)
                        .eq('student_id', student.id)
                        .maybeSingle();

                    if (existing) {
                        await supabase.from('attendance')
                            .update({ status: attendance[student.id] })
                            .eq('id', existing.id);
                    } else {
                        await supabase.from('attendance')
                            .insert([{ session_id: editingSessionId, student_id: student.id, status: attendance[student.id] }]);
                    }
                }
                toast.success('Session updated successfully');
                setEditingSessionId(null);
            } else {
                // Create new session
                const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert([{
                    batch_id: selectedBatch,
                    date: date,
                    start_time: startTime,
                    end_time: endTime,
                    topic: topic
                }]).select();

                if (sessionError) throw sessionError;
                const session = sessionData[0];

                for (const student of students) {
                    const { error: attendanceError } = await supabase.from('attendance').insert([{
                        session_id: session.id,
                        student_id: student.id,
                        status: attendance[student.id]
                    }]);
                    if (attendanceError) throw attendanceError;
                }
                toast.success('Session and attendance saved successfully');
            }

            // Reset form
            setTopic('');
            setSelectedBatch('');
            setStudents([]);
            setAttendance({});
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setStartTime('17:00');
            setEndTime('18:00');
            
            // Go back to manage tab if we were editing
            if (editingSessionId) {
                setActiveTab('manage');
            }
        } catch (error) {
            console.error('Error saving session:', error);
            toast.error('Failed to save session');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Sessions - Mentora</title>
                <meta name="description" content="Manage and mark attendance for sessions in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Sessions & Attendance</h1>
                                <p className="text-muted-foreground">Record attendance or manage past sessions</p>
                            </div>

                            <div className="flex border-b border-border mb-6">
                                <button
                                    onClick={() => { setActiveTab('new'); if(editingSessionId) { setEditingSessionId(null); setTopic(''); setSelectedBatch(''); setStudents([]); } }}
                                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'new' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {editingSessionId ? 'Edit Session' : 'Mark Attendance'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'manage' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Manage Sessions
                                </button>
                            </div>

                            {activeTab === 'new' ? (
                                <div className="mentora-card space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Select Batch</label>
                                            <select
                                                value={selectedBatch}
                                                onChange={(e) => setSelectedBatch(e.target.value)}
                                                disabled={!!editingSessionId}
                                                className="mentora-input text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Choose a batch...</option>
                                                {batches.map(batch => (
                                                    <option key={batch.id} value={batch.id}>
                                                        {batch.name} - {batch.standard}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Topic</label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="Enter today's topic"
                                                className="mentora-input text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Date</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="mentora-input text-foreground w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Start Time</label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="mentora-input text-foreground w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">End Time</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="mentora-input text-foreground w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleMarkAll('Present')}
                                            className="transition-all duration-200 active:scale-95"
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Mark All Present
                                        </Button>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : students.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="mentora-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Student Name</th>
                                                            <th>Student ID</th>
                                                            <th className="text-center">Present</th>
                                                            <th className="text-center">Absent</th>
                                                            <th className="text-center">Late</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {students.map(student => {
                                                            const status = attendance[student.id];
                                                            let rowClass = "transition-colors ";
                                                            if (status === 'Present') rowClass += "bg-green-50/50 hover:bg-green-50 dark:bg-green-900/10 dark:hover:bg-green-900/20";
                                                            else if (status === 'Absent') rowClass += "bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20";
                                                            else if (status === 'Late') rowClass += "bg-yellow-50/50 hover:bg-yellow-50 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20";
                                                            else rowClass += "hover:bg-muted/50";

                                                            return (
                                                            <tr key={student.id} className={rowClass}>
                                                                <td className="font-medium">{student.name}</td>
                                                                <td>{student.student_login_id}</td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`attendance-${student.id}`}
                                                                        checked={attendance[student.id] === 'Present'}
                                                                        onChange={() => setAttendance({ ...attendance, [student.id]: 'Present' })}
                                                                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-ring"
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`attendance-${student.id}`}
                                                                        checked={attendance[student.id] === 'Absent'}
                                                                        onChange={() => setAttendance({ ...attendance, [student.id]: 'Absent' })}
                                                                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-ring"
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`attendance-${student.id}`}
                                                                        checked={attendance[student.id] === 'Late'}
                                                                        onChange={() => setAttendance({ ...attendance, [student.id]: 'Late' })}
                                                                        className="w-4 h-4 text-yellow-600 focus:ring-2 focus:ring-ring"
                                                                    />
                                                                </td>
                                                            </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex justify-end gap-3">
                                                {editingSessionId && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingSessionId(null);
                                                            setActiveTab('manage');
                                                            setTopic('');
                                                            setSelectedBatch('');
                                                            setStudents([]);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={handleSaveSession}
                                                    disabled={saving}
                                                    className="transition-all duration-200 active:scale-95"
                                                >
                                                    {saving ? 'Saving...' : editingSessionId ? 'Update Session' : 'Save Session'}
                                                </Button>
                                            </div>
                                        </>
                                    ) : selectedBatch ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No students assigned to this batch
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Select a batch to mark attendance
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mentora-card space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 max-w-sm">
                                            <label className="block text-sm font-medium mb-2">Select Date to View Sessions</label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="date"
                                                    value={manageDate}
                                                    onChange={(e) => setManageDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {loadingSessions ? (
                                        <div className="text-center py-12">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : manageSessions.length > 0 ? (
                                        <div className="space-y-4 mt-4">
                                            {manageSessions.map(session => (
                                                <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-muted/50 rounded-xl border border-border/50 hover:border-border transition-colors">
                                                    <div className="mb-4 sm:mb-0">
                                                        <h3 className="font-bold text-lg text-foreground">{session.topic}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                                                                {session.batches?.name} ({session.batches?.standard})
                                                            </span>
                                                            <span>•</span>
                                                            <span>{session.start_time} - {session.end_time}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 sm:flex-none"
                                                            onClick={() => handleEditSession(session)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                            onClick={() => handleDeleteSession(session.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                                            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                            <h3 className="text-lg font-medium text-foreground">No Sessions Found</h3>
                                            <p className="text-muted-foreground mt-1">There are no sessions recorded for {format(new Date(manageDate), 'PPP')}.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default SessionsPage;
