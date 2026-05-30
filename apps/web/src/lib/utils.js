import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function calculateAveragePercentage(gradedResults) {
    const validResults = (gradedResults || []).filter(r => r.marks !== null && !r.is_absent);
    if (validResults.length === 0) return 0;
    
    const totalObtained = validResults.reduce((sum, r) => sum + Number(r.marks), 0);
    const totalMax = validResults.reduce((sum, r) => sum + Number(r.tests?.max_marks || 30), 0);
    
    if (totalMax === 0) return 0;
    const percentage = (totalObtained / totalMax) * 100;
    return percentage % 1 === 0 ? percentage : Math.round(percentage * 10) / 10;
}