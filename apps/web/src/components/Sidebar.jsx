import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    FileText,
    DollarSign,
    BarChart3,
    Settings,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
        { icon: Users, label: 'Students', path: '/teacher/students' },
        { icon: BookOpen, label: 'Batches', path: '/teacher/batches' },
        { icon: Calendar, label: 'Sessions', path: '/teacher/sessions' },
        { icon: FileText, label: 'Tests', path: '/teacher/tests' },
        { icon: DollarSign, label: 'Fees', path: '/teacher/fees' },
        { icon: BarChart3, label: 'Reports', path: '/teacher/reports' },
        { icon: Settings, label: 'Settings', path: '/teacher/settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed top-0 left-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex items-center justify-between p-4 border-b border-sidebar-border lg:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">M</span>
                        </div>
                        <span className="font-bold text-lg">Mentora</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                    }
                `}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;