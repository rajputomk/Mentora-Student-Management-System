import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const AttendanceCalendar = ({ attendance = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Reset selected date when changing months
    useEffect(() => {
        setSelectedDate(null);
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Calculate dynamic calendar values
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon, ...
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Get attendance records in the current month to calculate dynamic stats
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthAttendance = attendance.filter(a => {
        if (!a.sessions?.date) return false;
        const sessionDate = new Date(a.sessions.date);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
    });

    const presentCount = monthAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
    const absentCount = monthAttendance.filter(a => a.status?.toLowerCase() === 'absent').length;
    const lateCount = monthAttendance.filter(a => a.status?.toLowerCase() === 'late').length;

    // Calendar grid generation
    const gridCells = [];

    // Add empty placeholders for weekday alignment
    for (let i = 0; i < startWeekday; i++) {
        gridCells.push({
            type: 'empty',
            key: `empty-${i}`
        });
    }

    // Add actual days of the month
    for (let d = 1; d <= totalDays; d++) {
        const dayDate = new Date(year, month, d);
        
        // Find matching attendance record
        const record = attendance.find(a => {
            if (!a.sessions?.date) return false;
            const sessionDate = new Date(a.sessions.date);
            return sessionDate.getFullYear() === year &&
                   sessionDate.getMonth() === month &&
                   sessionDate.getDate() === d;
        });

        gridCells.push({
            type: 'day',
            day: d,
            date: dayDate,
            record: record,
            key: `day-${d}`
        });
    }

    return (
        <div className="space-y-6">
            {/* Header and navigation */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                    Attendance - {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrevMonth}
                        className="transition-all duration-200 active:scale-95"
                    >
                        Previous
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNextMonth}
                        className="transition-all duration-200 active:scale-95"
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Dynamic Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-green-50/50 border border-green-200/50 dark:bg-green-950/20 dark:border-green-900/30">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">{presentCount}</div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-500">Present</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50/50 border border-red-200/50 dark:bg-red-950/20 dark:border-red-900/30">
                    <div className="text-3xl font-bold text-red-700 dark:text-red-400">{absentCount}</div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-500">Absent</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50/50 border border-yellow-200/50 dark:bg-yellow-950/20 dark:border-yellow-900/30">
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{lateCount}</div>
                    <div className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Late</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">
                        {day}
                    </div>
                ))}

                {gridCells.map((cell, idx) => {
                    if (cell.type === 'empty') {
                        return <div key={cell.key} className="aspect-square bg-transparent" />;
                    }

                    const { day, record } = cell;
                    
                    let cellStyle = {};
                    let cellClass = 'bg-muted/40 text-muted-foreground hover:bg-muted/70';
                    
                    if (record) {
                        const status = record.status?.toLowerCase();
                        if (status === 'present') {
                            cellClass = '';
                            cellStyle = {
                                backgroundColor: 'rgba(220, 252, 231, 0.7)',
                                borderColor: 'rgba(34, 197, 94, 0.7)',
                                color: '#15803d',
                                borderWidth: '2px'
                            };
                        } else if (status === 'absent') {
                            cellClass = '';
                            cellStyle = {
                                backgroundColor: 'rgba(254, 226, 226, 0.7)',
                                borderColor: 'rgba(239, 68, 68, 0.7)',
                                color: '#b91c1c',
                                borderWidth: '2px'
                            };
                        } else if (status === 'late') {
                            cellClass = '';
                            cellStyle = {
                                backgroundColor: 'rgba(254, 240, 138, 0.7)',
                                borderColor: 'rgba(234, 179, 8, 0.7)',
                                color: '#a16207',
                                borderWidth: '2px'
                            };
                        }
                    }

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            onClick={() => record && setSelectedDate(record)}
                            disabled={!record}
                            className={`
                                aspect-square rounded-lg text-sm font-semibold
                                transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent
                                ${cellClass}
                                ${record ? 'cursor-pointer shadow-sm' : 'cursor-default opacity-60'}
                            `}
                            style={cellStyle}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Session details drawer/card */}
            {selectedDate && (
                <div className="mt-6 p-5 bg-muted/60 dark:bg-muted/20 border border-border/80 rounded-xl shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                        Session Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
                        <p><span className="text-muted-foreground font-medium">Date:</span> {format(new Date(selectedDate.sessions?.date), 'PPP')}</p>
                        <p><span className="text-muted-foreground font-medium">Time:</span> {selectedDate.sessions?.start_time} - {selectedDate.sessions?.end_time}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground font-medium">Topic:</span> {selectedDate.sessions?.topic || 'No topic specified'}</p>
                        <p><span className="text-muted-foreground font-medium">Status:</span>{' '}
                            <span 
                                className="px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block uppercase"
                                style={
                                    selectedDate.status?.toLowerCase() === 'present' 
                                        ? { backgroundColor: 'rgba(220, 252, 231, 0.6)', borderColor: 'rgba(34, 197, 94, 0.6)', color: '#15803d' }
                                        : selectedDate.status?.toLowerCase() === 'absent'
                                        ? { backgroundColor: 'rgba(254, 226, 226, 0.6)', borderColor: 'rgba(239, 68, 68, 0.6)', color: '#b91c1c' }
                                        : { backgroundColor: 'rgba(254, 240, 138, 0.6)', borderColor: 'rgba(234, 179, 8, 0.6)', color: '#a16207' }
                                }
                            >
                                {selectedDate.status}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
