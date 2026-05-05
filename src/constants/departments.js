// Department options for the college
export const DEPARTMENTS = {
    // Under Graduate
    'B.Sc. Computer Science': { degree: 'BSc', maxYears: 3 },
    'B.C.A. Computer Application': { degree: 'BCA', maxYears: 3 },
    'B.Sc. Microbiology': { degree: 'BSc', maxYears: 3 },
    'B.Sc. Biochemistry': { degree: 'BSc', maxYears: 3 },
    'B.Sc. Physics': { degree: 'BSc', maxYears: 3 },
    'B.Sc. Chemistry': { degree: 'BSc', maxYears: 3 },
    'B.Sc. Mathematics': { degree: 'BSc', maxYears: 3 },
    'B.Com. Bank Management': { degree: 'BCom', maxYears: 3 },
    'B.Com. Commerce': { degree: 'BCom', maxYears: 3 },
    'B.A. English Literature': { degree: 'BA', maxYears: 3 },
    'B.A. Tamil': { degree: 'BA', maxYears: 3 },
    'B.B.A. Business Administration': { degree: 'BBA', maxYears: 3 },
    'B.Sc. Computer Science with Artificial Intelligence': { degree: 'BSc', maxYears: 3 },
    'B.Sc. Computer Science with Data Science': { degree: 'BSc', maxYears: 3 },

    // Post Graduate
    'M.Sc. Computer Science': { degree: 'MSc', maxYears: 2 },
    'M.Sc. Information Technology': { degree: 'MSc', maxYears: 2 },
    'M.Sc. Microbiology': { degree: 'MSc', maxYears: 2 },
    'M.Sc. Biochemistry': { degree: 'MSc', maxYears: 2 },
    'M.Com. Commerce': { degree: 'MCom', maxYears: 2 },
    'M.A. Tamil': { degree: 'MA', maxYears: 2 },

    // Research Courses
    'Ph.D. Microbiology (Full Time)': { degree: 'PhD', maxYears: 3 },
    'Ph.D. Tamil (Part Time)': { degree: 'PhD', maxYears: 5 }
};

// Get department categories for grouping
export const DEPARTMENT_CATEGORIES = {
    'Under Graduate Courses': [
        'B.Sc. Computer Science',
        'B.C.A. Computer Application',
        'B.Sc. Microbiology',
        'B.Sc. Biochemistry',
        'B.Sc. Physics',
        'B.Sc. Chemistry',
        'B.Sc. Mathematics',
        'B.Com. Bank Management',
        'B.Com. Commerce',
        'B.A. English Literature',
        'B.A. Tamil',
        'B.B.A. Business Administration',
        'B.Sc. Computer Science with Artificial Intelligence',
        'B.Sc. Computer Science with Data Science'
    ],
    'Post Graduate Courses': [
        'M.Sc. Computer Science',
        'M.Sc. Information Technology',
        'M.Sc. Microbiology',
        'M.Sc. Biochemistry',
        'M.Com. Commerce',
        'M.A. Tamil'
    ],
    'Research Courses': [
        'Ph.D. Microbiology (Full Time)',
        'Ph.D. Tamil (Part Time)'
    ]
};

// Year options based on department
export const getYearOptions = (department) => {
    const deptInfo = DEPARTMENTS[department];
    if (!deptInfo) return ['1st Year', '2nd Year', '3rd Year'];

    const years = [];
    for (let i = 1; i <= deptInfo.maxYears; i++) {
        years.push(`${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Year`);
    }
    return years;
};

// Calculate next year based on department and current year
export const calculateNextYear = (department, currentYear, admissionDate) => {
    const deptInfo = DEPARTMENTS[department];
    if (!deptInfo) return { year: currentYear, status: 'active' };

    const yearsSinceAdmission = Math.floor(
        (Date.now() - new Date(admissionDate)) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Extract year number from string like "1st Year"
    const currentYearNum = parseInt(currentYear);

    // Check if enough time has passed (1 year)
    if (yearsSinceAdmission < currentYearNum) {
        return { year: currentYear, status: 'active' };
    }

    // Calculate next year
    const nextYearNum = currentYearNum + 1;

    // Check if student has completed the program
    if (nextYearNum > deptInfo.maxYears) {
        return {
            year: currentYear,
            status: 'graduated',
            graduationDate: new Date().toISOString()
        };
    }

    // Promote to next year
    const suffix = nextYearNum === 1 ? 'st' : nextYearNum === 2 ? 'nd' : nextYearNum === 3 ? 'rd' : 'th';
    return {
        year: `${nextYearNum}${suffix} Year`,
        status: 'active'
    };
};
// Simplified Department list for Teachers
export const TEACHER_DEPARTMENTS = [
    "Computer Science",
    "Computer Application",
    "Microbiology",
    "Biochemistry",
    "Physics",
    "Chemistry",
    "Mathematics",
    "Bank Management",
    "Commerce",
    "English Literature",
    "Tamil",
    "Business Administration",
    "Information Technology"
];
