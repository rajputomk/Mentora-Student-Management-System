import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import StudentBatchAssignment from '@/components/StudentBatchAssignment.jsx';
import { Button } from '@/components/ui/button';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BatchesPage = () => {
    const { currentUser } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [assigningBatch, setAssigningBatch] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        standard: '',
        subject: '',
        schedule: ''
    });

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            const { data, error } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            const batchesWithCount = await Promise.all(data.map(async (batch) => {
                const { data: assignments } = await supabase.from('student_batches').select('*').eq('batch_id', batch.id);

                return {
                    ...batch,
                    studentCount: assignments ? assignments.length : 0
                };
            }));

            setBatches(batchesWithCount);
            setLoading(false);
        } catch (error) {
            console.error('Error loading batches:', error);
            toast.error('Failed to load batches');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...formData,
                teacher_id: currentUser.id
            };

            if (editingBatch) {
                const { error } = await supabase.from('batches').update(data).eq('id', editingBatch.id);
                if (error) throw error;
                toast.success('Batch updated successfully');
            } else {
                const { error } = await supabase.from('batches').insert([data]);
                if (error) throw error;
                toast.success('Batch created successfully');
            }

            setShowForm(false);
            setEditingBatch(null);
            setFormData({
                name: '',
                standard: '',
                subject: '',
                schedule: ''
            });
            loadBatches();
        } catch (error) {
            console.error('Error saving batch:', error);
            toast.error('Failed to save batch');
            setLoading(false);
        }
    };

    const handleEdit = (batch) => {
        setEditingBatch(batch);
        setFormData({
            name: batch.name,
            standard: batch.standard,
            subject: batch.subject,
            schedule: batch.schedule
        });
        setShowForm(true);
    };

    const handleDelete = async (batchId) => {
        if (!window.confirm('Are you sure you want to delete this batch?')) return;

        try {
            const { error } = await supabase.from('batches').delete().eq('id', batchId);
            if (error) throw error;
            toast.success('Batch deleted successfully');
            loadBatches();
        } catch (error) {
            console.error('Error deleting batch:', error);
            toast.error('Failed to delete batch');
        }
    };

    if (loading && batches.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Batches - Mentora</title>
                <meta name="description" content="Manage batches in Mentora education management system" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Batches</h1>
                                    <p className="text-muted-foreground">Manage your teaching batches</p>
                                </div>
                                <Button onClick={() => setShowForm(true)} className="transition-all duration-200 active:scale-95">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Batch
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {batches.map(batch => (
                                    <div key={batch.id} className="mentora-card">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{batch.name}</h3>
                                                <p className="text-sm text-muted-foreground">{batch.subject}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(batch)}
                                                    className="transition-all duration-200 hover:bg-muted"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(batch.id)}
                                                    className="transition-all duration-200 hover:bg-destructive/10 text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Standard</span>
                                                <span className="font-medium">{batch.standard}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Schedule</span>
                                                <span className="font-medium">{batch.schedule}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Students</span>
                                                <span className="font-medium">{batch.studentCount}</span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full transition-all duration-200 active:scale-95"
                                            onClick={() => setAssigningBatch(batch.id)}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Assign Students
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {batches.length === 0 && (
                                <div className="mentora-card text-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No batches created yet</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-card rounded-xl max-w-md w-full my-auto">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold">
                                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Batch Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                    placeholder="e.g., Math Advanced"
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
                                    placeholder="e.g., 10th"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Schedule</label>
                                <input
                                    type="text"
                                    value={formData.schedule}
                                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                    required
                                    className="mentora-input text-foreground"
                                    placeholder="e.g., Mon, Wed, Fri 4-6 PM"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingBatch(null);
                                        setFormData({
                                            name: '',
                                            standard: '',
                                            subject: '',
                                            schedule: ''
                                        });
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 transition-all duration-200 active:scale-95">
                                    {editingBatch ? 'Update' : 'Create'} Batch
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {assigningBatch && (
                <StudentBatchAssignment
                    batchId={assigningBatch}
                    onClose={() => setAssigningBatch(null)}
                    onSuccess={loadBatches}
                />
            )}
        </>
    );
};

export default BatchesPage;