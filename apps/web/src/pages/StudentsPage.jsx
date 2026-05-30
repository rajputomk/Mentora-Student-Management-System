import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import StudentProfile from '@/components/StudentProfile.jsx';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Pencil, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { calculateAveragePercentage } from '@/lib/utils';

const StudentsPage = () => {
    const [searchParams] = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        parent_phone: '',
        standard: '',
        student_login_id: ''
    });

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchQuery]);

    const loadStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const studentsWithStats = await Promise.all(data.map(async (student) => {
                const { data: attendance } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('student_id', student.id);

                const { data: testResults } = await supabase
                    .from('test_results')
                    .select('*, tests(*)')
                    .eq('student_id', student.id);

                const attendancePercentage = (attendance && attendance.length > 0)
                    ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100)
                    : 0;

                const avgMarks = calculateAveragePercentage(testResults);

                return {
                    ...student,
                    attendancePercentage,
                    avgMarks
                };
            }));

            setStudents(studentsWithStats);
            setLoading(false);
        } catch (error) {
            console.error('Error loading students:', error);
            toast.error('Failed to load students');
            setLoading(false);
        }
    };

    const filterStudents = () => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = students.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.student_login_id.toLowerCase().includes(query) ||
            student.standard.toLowerCase().includes(query)
        );
        setFilteredStudents(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingStudent) {
                const { error } = await supabase.from('students').update(formData).eq('id', editingStudent.id);
                if (error) throw error;
                toast.success('Student updated successfully');
            } else {
                const { error } = await supabase.from('students').insert([formData]);
                if (error) throw error;
                toast.success('Student added successfully');
            }

            setShowForm(false);
            setEditingStudent(null);
            setFormData({
                name: '',
                phone: '',
                parent_phone: '',
                standard: '',
                student_login_id: ''
            });
            loadStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error(error.message || 'Failed to save student');
            setLoading(false);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            phone: student.phone,
            parent_phone: student.parent_phone,
            standard: student.standard,
            student_login_id: student.student_login_id
        });
        setShowForm(true);
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;

        try {
            const { error } = await supabase.from('students').delete().eq('id', studentId);
            if (error) throw error;
            toast.success('Student deleted successfully');
            loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
        }
    };

    if (loading && students.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Students - Mentora</title>
                <meta name="description" content="Manage students in Mentora education management system" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Students</h1>
                                    <p className="text-muted-foreground">Manage your students</p>
                                </div>
                                <Button onClick={() => setShowForm(true)} className="transition-all duration-200 active:scale-95">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Student
                                </Button>
                            </div>

                            <div className="mentora-card">
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, ID, or standard..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="mentora-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Student ID</th>
                                                <th>Standard</th>
                                                <th>Attendance</th>
                                                <th>Avg Marks</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(student => (
                                                <tr key={student.id}>
                                                    <td className="font-medium">{student.name}</td>
                                                    <td>{student.student_login_id}</td>
                                                    <td>{student.standard}</td>
                                                    <td>{student.attendancePercentage}%</td>
                                                    <td>{student.avgMarks}%</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedStudent(student.id)}
                                                                className="transition-all duration-200 hover:bg-muted"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(student)}
                                                                className="transition-all duration-200 hover:bg-muted"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(student.id)}
                                                                className="transition-all duration-200 hover:bg-destructive/10 text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-12">
                                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">
                                                {searchQuery ? 'No students found matching your search' : 'No students added yet'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-card rounded-xl max-w-md w-full my-auto">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold">
                                {editingStudent ? 'Edit Student' : 'Add New Student'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Student ID</label>
                                <input
                                    type="text"
                                    value={formData.student_login_id}
                                    onChange={(e) => setFormData({ ...formData, student_login_id: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Standard</label>
                                <input
                                    type="text"
                                    value={formData.standard}
                                    onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Parent Phone</label>
                                <input
                                    type="tel"
                                    value={formData.parent_phone}
                                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingStudent(null);
                                        setFormData({
                                            name: '',
                                            phone: '',
                                            parent_phone: '',
                                            standard: '',
                                            student_login_id: ''
                                        });
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 transition-all duration-200 active:scale-95">
                                    {editingStudent ? 'Update' : 'Add'} Student
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <StudentProfile
                    studentId={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </>
    );
};

export default StudentsPage;