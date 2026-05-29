import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = ({ onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/teacher/students?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header className="bg-white border-b border-border sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden hover:bg-accent hover:text-accent-foreground text-[#111827]"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link to="/teacher/dashboard" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                            <span className="text-primary-foreground font-bold text-sm">M</span>
                        </div>
                        <span className="font-bold text-xl text-[#111827] hidden sm:inline tracking-tight">Mentora</span>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search students, batches, or subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-xl bg-white text-[#111827] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 hover:border-primary/50 shadow-sm"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-primary text-[#111827] transition-colors rounded-xl">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="hidden sm:flex gap-2 text-primary border-border hover:bg-accent hover:border-primary/30 transition-all rounded-xl font-medium">
                                <Plus className="h-4 w-4" />
                                <span>New</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border-border rounded-xl shadow-lg">
                            <DropdownMenuItem onClick={() => navigate('/teacher/students')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Add Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/batches')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Create Batch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/sessions')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Mark Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/tests')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Add Test
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile + button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="icon" className="sm:hidden bg-primary hover:brightness-110 text-white rounded-xl">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border-border rounded-xl shadow-lg">
                            <DropdownMenuItem onClick={() => navigate('/teacher/students')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Add Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/batches')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Create Batch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/sessions')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Mark Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/teacher/tests')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Add Test
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-accent hover:text-primary text-[#111827] rounded-xl transition-colors">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border-border rounded-xl shadow-lg">
                            <div className="px-3 py-2 border-b border-border mb-1">
                                <div className="text-sm font-semibold text-[#111827] truncate">{currentUser?.name || 'Teacher Profile'}</div>
                                <div className="text-xs text-muted-foreground truncate">{currentUser?.email || 'teacher@mentora.com'}</div>
                            </div>
                            <DropdownMenuItem onClick={() => navigate('/teacher/settings')} className="hover:bg-accent hover:text-primary cursor-pointer rounded-lg mx-1">
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg mx-1 mt-1">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;