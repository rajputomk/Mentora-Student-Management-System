import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loginAttempts, setLoginAttempts] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('mentora_user');
        const storedRole = localStorage.getItem('mentora_role');
        if (storedUser && storedRole) {
            try {
                setCurrentUser(JSON.parse(storedUser));
                setUserRole(storedRole);
            } catch (e) {
                console.error("Failed to parse stored session");
            }
        }
        setInitialLoading(false);
    }, []);

    const checkRateLimit = (identifier) => {
        const now = Date.now();
        const attempts = loginAttempts[identifier] || [];
        const recentAttempts = attempts.filter(time => now - time < 60000);

        if (recentAttempts.length >= 5) {
            return { allowed: false, remainingTime: 60 - Math.floor((now - recentAttempts[0]) / 1000) };
        }

        return { allowed: true };
    };

    const recordLoginAttempt = (identifier) => {
        const now = Date.now();
        setLoginAttempts(prev => ({
            ...prev,
            [identifier]: [...(prev[identifier] || []), now].slice(-5)
        }));
    };

    const loginTeacher = async (email, password) => {
        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
            throw new Error(`Too many login attempts. Please try again in ${rateCheck.remainingTime} seconds.`);
        }

        try {
            const { data, error } = await supabase.rpc('login_teacher', {
                teacher_email: email,
                teacher_password: password
            });

            if (error) throw new Error(error.message);
            if (!data || data.length === 0) throw new Error("Invalid email or password");

            const teacher = data[0];
            setCurrentUser(teacher);
            setUserRole('teacher');
            localStorage.setItem('mentora_user', JSON.stringify(teacher));
            localStorage.setItem('mentora_role', 'teacher');
            return teacher;
        } catch (error) {
            recordLoginAttempt(email);
            throw error;
        }
    };

    const loginParent = async (studentLoginId) => {
        const rateCheck = checkRateLimit(studentLoginId);
        if (!rateCheck.allowed) {
            throw new Error(`Too many login attempts. Please try again in ${rateCheck.remainingTime} seconds.`);
        }

        try {
            const { data: students, error } = await supabase
                .from('students')
                .select('*')
                .eq('student_login_id', studentLoginId);

            if (error) throw error;

            if (!students || students.length === 0) {
                recordLoginAttempt(studentLoginId);
                throw new Error('Invalid student ID');
            }

            const student = students[0];
            setStudentData(student);
            setUserRole('parent');
            const parentUser = { id: student.id, name: student.name, student_login_id: studentLoginId };
            setCurrentUser(parentUser);
            localStorage.setItem('mentora_user', JSON.stringify(parentUser));
            localStorage.setItem('mentora_role', 'parent');
            return student;
        } catch (error) {
            recordLoginAttempt(studentLoginId);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('mentora_user');
        localStorage.removeItem('mentora_role');
        setCurrentUser(null);
        setUserRole(null);
        setStudentData(null);
    };

    const value = {
        currentUser,
        userRole,
        studentData,
        isAuthenticated: !!currentUser,
        loginTeacher,
        loginParent,
        logout,
        initialLoading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};