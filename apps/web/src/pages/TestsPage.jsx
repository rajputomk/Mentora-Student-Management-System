import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const TestsPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [batches, setBatches] = useState([]);
    const [tests, setTests] = useState([]);
    const [showTestForm, setShowTestForm] = useState(false);
    const [showMarksForm, setShowMarksForm] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [students, setStudents] = useState([]);
    const [testFormData, setTestFormData] = useState({
        name: '',
        batch_id: '',
        date: '',
        max_marks: ''
    });
    const [marksData, setMarksData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBatches();
        loadTests();
    }, []);

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

    const loadTests = async () => {
        try {
            const { data, error } = await supabase.from('tests').select('*, batches(*)').order('date', { ascending: false });
            if (error) throw error;
            setTests(data || []);
        } catch (error) {
            console.error('Error loading tests:', error);
            toast.error('Failed to load tests');
        }
    };

    const handleCreateTest = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: testData, error: createError } = await supabase.from('tests').insert([testFormData]).select();
            if (createError) throw createError;
            const test = testData[0];
            toast.success('Test created successfully');
            setShowTestForm(false);
            setTestFormData({
                name: '',
                batch_id: '',
                date: '',
                max_marks: ''
            });
            loadTests();

            const { data: assignments, error: assignmentsError } = await supabase
                .from('student_batches')
                .select('*, students(*)')
                .eq('batch_id', testFormData.batch_id);
            if (assignmentsError) throw assignmentsError;

            const studentsList = (assignments || []).map(a => a.students).filter(Boolean);
            setStudents(studentsList);
            setSelectedTest(test);

            const initialMarks = {};
            studentsList.forEach(student => {
                initialMarks[student.id] = { marks: '', remarks: '' };
            });
            setMarksData(initialMarks);

            setShowMarksForm(true);
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMarks = async () => {
        setSaving(true);
        try {
            for (const student of students) {
                const data = marksData[student.id];
                if (data.marks !== '') {
                    const { error: insertError } = await supabase.from('test_results').insert([{
                        student_id: student.id,
                        test_id: selectedTest.id,
                        marks: parseInt(data.marks),
                        remarks: data.remarks
                    }]);
                    if (insertError) throw insertError;
                }
            }

            toast.success('Marks saved successfully');
            setShowMarksForm(false);
            setSelectedTest(null);
            setStudents([]);
            setMarksData({});
        } catch (error) {
            console.error('Error saving marks:', error);
            toast.error('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const handleEnterMarks = async (test) => {
        try {
            const { data: assignments, error: assignmentsError } = await supabase
                .from('student_batches')
                .select('*, students(*)')
                .eq('batch_id', test.batch_id);
            if (assignmentsError) throw assignmentsError;

            const studentsList = (assignments || []).map(a => a.students).filter(Boolean);
            setStudents(studentsList);
            setSelectedTest(test);

            const { data: existingResults, error: resultsError } = await supabase
                .from('test_results')
                .select('*')
                .eq('test_id', test.id);
            if (resultsError) throw resultsError;
            
            const existingResultsArr = existingResults || [];

            const initialMarks = {};
            studentsList.forEach(student => {
                const existing = existingResultsArr.find(r => r.student_id === student.id);
                initialMarks[student.id] = {
                    marks: existing ? existing.marks.toString() : '',
                    remarks: existing ? existing.remarks : ''
                };
            });
            setMarksData(initialMarks);

            setShowMarksForm(true);
        } catch (error) {
            console.error('Error loading test data:', error);
            toast.error('Failed to load test data');
        }
    };

    return (
        <>
            <Helmet>
                <title>Tests - Mentora</title>
                <meta name="description" content="Manage tests and marks in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Tests & Marks</h1>
                                    <p className="text-muted-foreground">Create tests and enter student marks</p>
                                </div>
                                <Button onClick={() => setShowTestForm(true)} className="transition-all duration-200 active:scale-95">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Test
                                </Button>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">All Tests</h2>
                                <div className="overflow-x-auto">
                                    <table className="mentora-table">
                                        <thead>
                                            <tr>
                                                <th>Test Name</th>
                                                <th>Batch</th>
                                                <th>Date</th>
                                                <th>Max Marks</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tests.map(test => (
                                                <tr key={test.id}>
                                                    <td className="font-medium">{test.name}</td>
                                                    <td>{test.batches?.name}</td>
                                                    <td>{test.date}</td>
                                                    <td>{test.max_marks}</td>
                                                    <td>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEnterMarks(test)}
                                                            className="transition-all duration-200 active:scale-95"
                                                        >
                                                            Enter Marks
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {tests.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No tests created yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {showTestForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Create New Test</h2>
                        </div>

                        <form onSubmit={handleCreateTest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Test Name</label>
                                <input
                                    type="text"
                                    value={testFormData.name}
                                    onChange={(e) => setTestFormData({ ...testFormData, name: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                    placeholder="e.g., Unit Test 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Batch</label>
                                <select
                                    value={testFormData.batch_id}
                                    onChange={(e) => setTestFormData({ ...testFormData, batch_id: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                >
                                    <option value="">Select batch...</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name} - {batch.standard}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Date</label>
                                <input
                                    type="date"
                                    value={testFormData.date}
                                    onChange={(e) => setTestFormData({ ...testFormData, date: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Maximum Marks</label>
                                <input
                                    type="number"
                                    value={testFormData.max_marks}
                                    onChange={(e) => setTestFormData({ ...testFormData, max_marks: e.target.value })}
                                    required
                                    min="1"
                                    className="mentora-input text-foreground"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowTestForm(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1 transition-all duration-200 active:scale-95">
                                    {saving ? 'Creating...' : 'Create Test'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMarksForm && selectedTest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-card rounded-xl max-w-4xl w-full my-8">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Enter Marks - {selectedTest.name}</h2>
                            <p className="text-sm text-muted-foreground">Maximum Marks: {selectedTest.max_marks}</p>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {students.map(student => (
                                    <div key={student.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-sm text-muted-foreground">{student.student_login_id}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Marks</label>
                                            <input
                                                type="number"
                                                value={marksData[student.id]?.marks || ''}
                                                onChange={(e) => setMarksData({
                                                    ...marksData,
                                                    [student.id]: { ...marksData[student.id], marks: e.target.value }
                                                })}
                                                min="0"
                                                max={selectedTest.max_marks}
                                                className="mentora-input text-foreground"
                                                placeholder="Enter marks"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Remarks</label>
                                            <input
                                                type="text"
                                                value={marksData[student.id]?.remarks || ''}
                                                onChange={(e) => setMarksData({
                                                    ...marksData,
                                                    [student.id]: { ...marksData[student.id], remarks: e.target.value }
                                                })}
                                                className="mentora-input text-foreground"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowMarksForm(false);
                                    setSelectedTest(null);
                                    setStudents([]);
                                    setMarksData({});
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSaveMarks} disabled={saving} className="transition-all duration-200 active:scale-95">
                                {saving ? 'Saving...' : 'Save Marks'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TestsPage;