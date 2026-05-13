import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const StudentBatchAssignment = ({ batchId, onClose, onSuccess }) => {
    const [students, setStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [batchId]);

    const loadData = async () => {
        try {
            const { data: allStudents } = await supabase.from('students').select('*');
            setStudents(allStudents || []);

            const { data: assignments } = await supabase.from('student_batches').select('*').eq('batch_id', batchId);

            const assignedIds = assignments.map(a => a.student_id);
            setAssignedStudents(assignedIds);
            setSelectedStudents(assignedIds);

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load students');
            setLoading(false);
        }
    };

    const handleToggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const toAdd = selectedStudents.filter(id => !assignedStudents.includes(id));
            const toRemove = assignedStudents.filter(id => !selectedStudents.includes(id));

            for (const studentId of toAdd) {
                await supabase.from('student_batches').insert([{
                    student_id: studentId,
                    batch_id: batchId
                }]);
            }

            const { data: allAssignments } = await supabase.from('student_batches').select('*').eq('batch_id', batchId);

            for (const studentId of toRemove) {
                const assignment = (allAssignments || []).find(a => a.student_id === studentId);
                if (assignment) {
                    await supabase.from('student_batches').delete().eq('id', assignment.id);
                }
            }

            toast.success('Students assigned successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving assignments:', error);
            toast.error('Failed to assign students');
        } finally {
            setSaving(false);
        }
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Assign Students to Batch</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        {students.map(student => (
                            <label
                                key={student.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-all duration-200"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => handleToggleStudent(student.id)}
                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {student.standard} • {student.student_login_id}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StudentBatchAssignment;