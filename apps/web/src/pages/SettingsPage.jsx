import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SettingsPage = () => {
    const { currentUser } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [standards, setStandards] = useState(['8th', '9th', '10th', '11th', '12th']);
    const [subjects, setSubjects] = useState(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English']);
    const [newStandard, setNewStandard] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [feeStructure, setFeeStructure] = useState({
        monthly: '5000',
        quarterly: '14000',
        yearly: '50000'
    });

    const handleAddStandard = () => {
        if (newStandard.trim() && !standards.includes(newStandard.trim())) {
            setStandards([...standards, newStandard.trim()]);
            setNewStandard('');
            toast.success('Standard added successfully');
        }
    };

    const handleRemoveStandard = (standard) => {
        setStandards(standards.filter(s => s !== standard));
        toast.success('Standard removed successfully');
    };

    const handleAddSubject = () => {
        if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
            setSubjects([...subjects, newSubject.trim()]);
            setNewSubject('');
            toast.success('Subject added successfully');
        }
    };

    const handleRemoveSubject = (subject) => {
        setSubjects(subjects.filter(s => s !== subject));
        toast.success('Subject removed successfully');
    };

    const handleSaveFeeStructure = () => {
        toast.success('Fee structure updated successfully');
    };

    return (
        <>
            <Helmet>
                <title>Settings - Mentora</title>
                <meta name="description" content="Manage settings in Mentora" />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                                <p className="text-muted-foreground">Manage your account and preferences</p>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={currentUser?.name || ''}
                                            disabled
                                            className="mentora-input text-foreground opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={currentUser?.email || ''}
                                            disabled
                                            className="mentora-input text-foreground opacity-60"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Standards Management</h2>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newStandard}
                                        onChange={(e) => setNewStandard(e.target.value)}
                                        placeholder="Add new standard"
                                        className="mentora-input text-foreground flex-1"
                                    />
                                    <Button onClick={handleAddStandard} className="transition-all duration-200 active:scale-95">
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {standards.map(standard => (
                                        <div key={standard} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                                            <span>{standard}</span>
                                            <button
                                                onClick={() => handleRemoveStandard(standard)}
                                                className="text-destructive hover:text-destructive/80 transition-colors duration-200"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Subjects Management</h2>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="Add new subject"
                                        className="mentora-input text-foreground flex-1"
                                    />
                                    <Button onClick={handleAddSubject} className="transition-all duration-200 active:scale-95">
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {subjects.map(subject => (
                                        <div key={subject} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                                            <span>{subject}</span>
                                            <button
                                                onClick={() => handleRemoveSubject(subject)}
                                                className="text-destructive hover:text-destructive/80 transition-colors duration-200"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mentora-card">
                                <h2 className="text-xl font-bold mb-4">Fee Structure</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Monthly Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={feeStructure.monthly}
                                            onChange={(e) => setFeeStructure({ ...feeStructure, monthly: e.target.value })}
                                            className="mentora-input text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Quarterly Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={feeStructure.quarterly}
                                            onChange={(e) => setFeeStructure({ ...feeStructure, quarterly: e.target.value })}
                                            className="mentora-input text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Yearly Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={feeStructure.yearly}
                                            onChange={(e) => setFeeStructure({ ...feeStructure, yearly: e.target.value })}
                                            className="mentora-input text-foreground"
                                        />
                                    </div>
                                    <Button onClick={handleSaveFeeStructure} className="transition-all duration-200 active:scale-95">
                                        Save Fee Structure
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;