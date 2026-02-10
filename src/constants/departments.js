// Department options for the college
export const DEPARTMENTS = {
    'BSc Computer Science': { degree: 'BSc', maxYears: 3 },
    'BSc Mathematics': { degree: 'BSc', maxYears: 3 },
    'BSc Micro Biology': { degree: 'BSc', maxYears: 3 },
    'BSc Bio Chemistry': { degree: 'BSc', maxYears: 3 },
    'BSc Chemistry': { degree: 'BSc', maxYears: 3 },
    'MSc Computer Science': { degree: 'MSc', maxYears: 2 },
    'MSc Mathematics': { degree: 'MSc', maxYears: 2 },
    'MSc Micro Biology': { degree: 'MSc', maxYears: 2 },
    'MSc Bio Chemistry': { degree: 'MSc', maxYears: 2 },
    'MSc Chemistry': { degree: 'MSc', maxYears: 2 },
    'BA Tamil': { degree: 'BA', maxYears: 3 },
    'BA English': { degree: 'BA', maxYears: 3 },
    'MA Tamil': { degree: 'MA', maxYears: 2 },
    'MA English': { degree: 'MA', maxYears: 2 },
    'B.Com': { degree: 'BCom', maxYears: 3 }
};

// Get department categories for grouping
export const DEPARTMENT_CATEGORIES = {
    'BSc Programs': [
        'BSc Computer Science',
        'BSc Mathematics',
        'BSc Micro Biology',
        'BSc Bio Chemistry',
        'BSc Chemistry'
    ],
    'MSc Programs': [
        'MSc Computer Science',
        'MSc Mathematics',
        'MSc Micro Biology',
        'MSc Bio Chemistry',
        'MSc Chemistry'
    ],
    'BA Programs': [
        'BA Tamil',
        'BA English'
    ],
    'MA Programs': [
        'MA Tamil',
        'MA English'
    ],
    'Commerce': [
        'B.Com'
    ]
};

// Year options based on department
export const getYearOptions = (department) => {
    const deptInfo = DEPARTMENTS[department];
    if (!deptInfo) return ['1st Year', '2nd Year', '3rd Year'];

    const years = [];
    for (let i = 1; i <= deptInfo.maxYears; i++) {
        years.push(`${i}${i === 1 ? 'st' : i === 2 ? 'nd' : 'rd'} Year`);
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
    const suffix = nextYearNum === 1 ? 'st' : nextYearNum === 2 ? 'nd' : 'rd';
    return {
        year: `${nextYearNum}${suffix} Year`,
        status: 'active'
    };
};
// Simplified Department list for Teachers
export const TEACHER_DEPARTMENTS = [
    "Computer Science (CS)",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biochemistry",
    "Microbiology",
    "Biotechnology",
    "Commerce",
    "English",
    "Tamil",
    "Business Administration (BBA)",
    "Economics",
    "History"
];
