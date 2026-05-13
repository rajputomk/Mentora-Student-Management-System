import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Button } from '@/components/ui/button';
import { DollarSign, Filter } from 'lucide-react';
import { toast } from 'sonner';

const FeesPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [{ data: feesData }, { data: studentsData }] = await Promise.all([
                supabase.from('fees').select('*').order('month', { ascending: false }),
                supabase.from('students').select('*')
            ]);

            setFees(feesData);
            setStudents(studentsData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load fees data');
            setLoading(false);
        }
    };

    const handleMarkPaid = async (feeId, studentId, amount) => {
        try {
            const { error: updateError } = await supabase.from('fees').update({ status: 'Paid' }).eq('id', feeId);
            if (updateError) throw updateError;

            const { error: insertError } = await supabase.from('payments').insert([{
                student_id: studentId,
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                method: 'Cash'
            }]);
            if (insertError) throw insertError;

            toast.success('Fee marked as paid');
            loadData();
        } catch (error) {
            console.error('Error marking fee as paid:', error);
            toast.error('Failed to update fee status');
        }
    };

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown';
    };

    const filteredFees = filter === 'all'
        ? fees
        : fees.filter(f => f.status === (filter === 'paid' ? 'Paid' : 'Pending'));

    const totalPaid = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);

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
                <title>Fees - Mentora</title>
                <meta name="description" content="Manage student fees in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Fees Management</h1>
                                <p className="text-muted-foreground">Track and manage student fee payments</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">₹{totalPaid}</div>
                                    <div className="text-sm text-muted-foreground">Total Collected</div>
                                </div>

                                <div className="mentora-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="h-6 w-6 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">₹{totalPending}</div>
                                    <div className="text-sm text-muted-foreground">Pending Collection</div>
                                </div>
                            </div>

                            <div className="mentora-card">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Fee Records</h2>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={filter === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter('all')}
                                            className="transition-all duration-200 active:scale-95"
                                        >
                                            All
                                        </Button>
                                        <Button
                                            variant={filter === 'paid' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter('paid')}
                                            className="transition-all duration-200 active:scale-95"
                                        >
                                            Paid
                                        </Button>
                                        <Button
                                            variant={filter === 'pending' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter('pending')}
                                            className="transition-all duration-200 active:scale-95"
                                        >
                                            Pending
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="mentora-table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Month</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFees.map(fee => (
                                                <tr key={fee.id}>
                                                    <td className="font-medium">{getStudentName(fee.student_id)}</td>
                                                    <td>{fee.month}</td>
                                                    <td>₹{fee.amount}</td>
                                                    <td>
                                                        <span className={fee.status === 'Paid' ? 'status-paid' : 'status-pending'}>
                                                            {fee.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {fee.status === 'Pending' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleMarkPaid(fee.id, fee.student_id, fee.amount)}
                                                                className="transition-all duration-200 active:scale-95"
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredFees.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No fee records found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default FeesPage;