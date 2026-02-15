// Mock data for Student Wise Analysis module

export interface Student {
  id: string
  name: string
  rollNo: string
  universityRollNo: string
  department: string
  section: string
  email: string
  enrolledCourses: string[]
}

export interface Course {
  id: string
  code: string
  name: string
  department: string
  sections: string[]
}

export interface CourseEnrollment {
  studentId: string
  courseId: string
  marks: number
  maxMarks: number
  attendancePercentage: number
  sessionsAttended: number
  totalSessions: number
}

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: "c1",
    code: "CS101",
    name: "Programming Fundamentals",
    department: "Computer Science",
    sections: ["A", "B", "C"],
  },
  { id: "c2", code: "CS201", name: "Data Structures", department: "Computer Science", sections: ["A", "B"] },
  { id: "c3", code: "CS301", name: "Algorithms", department: "Computer Science", sections: ["A", "B", "C"] },
  { id: "c4", code: "CS401", name: "Machine Learning", department: "Computer Science", sections: ["A"] },
  { id: "c5", code: "MA101", name: "Calculus I", department: "Mathematics", sections: ["A", "B"] },
]

// Mock Students
export const mockStudents: Student[] = [
  {
    id: "s1",
    name: "Rahul Sharma",
    rollNo: "CS2021001",
    universityRollNo: "2021CS001",
    department: "Computer Science",
    section: "A",
    email: "rahul.sharma@univ.edu",
    enrolledCourses: ["c1", "c2", "c3", "c5"],
  },
  {
    id: "s2",
    name: "Priya Patel",
    rollNo: "CS2021002",
    universityRollNo: "2021CS002",
    department: "Computer Science",
    section: "A",
    email: "priya.patel@univ.edu",
    enrolledCourses: ["c1", "c2", "c4", "c5"],
  },
  {
    id: "s3",
    name: "Amit Kumar",
    rollNo: "CS2021003",
    universityRollNo: "2021CS003",
    department: "Computer Science",
    section: "A",
    email: "amit.kumar@univ.edu",
    enrolledCourses: ["c1", "c3", "c5"],
  },
  {
    id: "s4",
    name: "Neha Gupta",
    rollNo: "CS2021004",
    universityRollNo: "2021CS004",
    department: "Computer Science",
    section: "B",
    email: "neha.gupta@univ.edu",
    enrolledCourses: ["c1", "c2", "c3"],
  },
  {
    id: "s5",
    name: "Vikram Singh",
    rollNo: "CS2021005",
    universityRollNo: "2021CS005",
    department: "Computer Science",
    section: "B",
    email: "vikram.singh@univ.edu",
    enrolledCourses: ["c1", "c2", "c4"],
  },
  {
    id: "s6",
    name: "Ananya Reddy",
    rollNo: "CS2021006",
    universityRollNo: "2021CS006",
    department: "Computer Science",
    section: "B",
    email: "ananya.reddy@univ.edu",
    enrolledCourses: ["c1", "c3", "c5"],
  },
  {
    id: "s7",
    name: "Rohan Mehta",
    rollNo: "CS2021007",
    universityRollNo: "2021CS007",
    department: "Computer Science",
    section: "C",
    email: "rohan.mehta@univ.edu",
    enrolledCourses: ["c1", "c2", "c3", "c4"],
  },
  {
    id: "s8",
    name: "Kavitha Nair",
    rollNo: "CS2021008",
    universityRollNo: "2021CS008",
    department: "Computer Science",
    section: "C",
    email: "kavitha.nair@univ.edu",
    enrolledCourses: ["c1", "c3", "c5"],
  },
  {
    id: "s9",
    name: "Sanjay Deshmukh",
    rollNo: "CS2021009",
    universityRollNo: "2021CS009",
    department: "Computer Science",
    section: "A",
    email: "sanjay.deshmukh@univ.edu",
    enrolledCourses: ["c1", "c2", "c4", "c5"],
  },
  {
    id: "s10",
    name: "Meera Iyer",
    rollNo: "CS2021010",
    universityRollNo: "2021CS010",
    department: "Computer Science",
    section: "A",
    email: "meera.iyer@univ.edu",
    enrolledCourses: ["c1", "c2", "c3"],
  },
  {
    id: "s11",
    name: "Arjun Das",
    rollNo: "CS2021011",
    universityRollNo: "2021CS011",
    department: "Computer Science",
    section: "B",
    email: "arjun.das@univ.edu",
    enrolledCourses: ["c1", "c3", "c4"],
  },
  {
    id: "s12",
    name: "Sneha Reddy",
    rollNo: "CS2021012",
    universityRollNo: "2021CS012",
    department: "Computer Science",
    section: "C",
    email: "sneha.reddy@univ.edu",
    enrolledCourses: ["c1", "c2", "c5"],
  },
]

// Mock Course Enrollments with marks and attendance
export const mockEnrollments: CourseEnrollment[] = [
  // Student 1 - Rahul Sharma
  {
    studentId: "s1",
    courseId: "c1",
    marks: 78,
    maxMarks: 100,
    attendancePercentage: 85,
    sessionsAttended: 34,
    totalSessions: 40,
  },
  {
    studentId: "s1",
    courseId: "c2",
    marks: 82,
    maxMarks: 100,
    attendancePercentage: 90,
    sessionsAttended: 36,
    totalSessions: 40,
  },
  {
    studentId: "s1",
    courseId: "c3",
    marks: 71,
    maxMarks: 100,
    attendancePercentage: 78,
    sessionsAttended: 31,
    totalSessions: 40,
  },
  {
    studentId: "s1",
    courseId: "c5",
    marks: 65,
    maxMarks: 100,
    attendancePercentage: 72,
    sessionsAttended: 29,
    totalSessions: 40,
  },
  // Student 2 - Priya Patel
  {
    studentId: "s2",
    courseId: "c1",
    marks: 92,
    maxMarks: 100,
    attendancePercentage: 95,
    sessionsAttended: 38,
    totalSessions: 40,
  },
  {
    studentId: "s2",
    courseId: "c2",
    marks: 88,
    maxMarks: 100,
    attendancePercentage: 92,
    sessionsAttended: 37,
    totalSessions: 40,
  },
  {
    studentId: "s2",
    courseId: "c4",
    marks: 85,
    maxMarks: 100,
    attendancePercentage: 88,
    sessionsAttended: 35,
    totalSessions: 40,
  },
  {
    studentId: "s2",
    courseId: "c5",
    marks: 79,
    maxMarks: 100,
    attendancePercentage: 82,
    sessionsAttended: 33,
    totalSessions: 40,
  },
  // Student 3 - Amit Kumar
  {
    studentId: "s3",
    courseId: "c1",
    marks: 55,
    maxMarks: 100,
    attendancePercentage: 65,
    sessionsAttended: 26,
    totalSessions: 40,
  },
  {
    studentId: "s3",
    courseId: "c3",
    marks: 48,
    maxMarks: 100,
    attendancePercentage: 58,
    sessionsAttended: 23,
    totalSessions: 40,
  },
  {
    studentId: "s3",
    courseId: "c5",
    marks: 52,
    maxMarks: 100,
    attendancePercentage: 62,
    sessionsAttended: 25,
    totalSessions: 40,
  },
  // Student 4 - Neha Gupta
  {
    studentId: "s4",
    courseId: "c1",
    marks: 74,
    maxMarks: 100,
    attendancePercentage: 80,
    sessionsAttended: 32,
    totalSessions: 40,
  },
  {
    studentId: "s4",
    courseId: "c2",
    marks: 69,
    maxMarks: 100,
    attendancePercentage: 75,
    sessionsAttended: 30,
    totalSessions: 40,
  },
  {
    studentId: "s4",
    courseId: "c3",
    marks: 77,
    maxMarks: 100,
    attendancePercentage: 82,
    sessionsAttended: 33,
    totalSessions: 40,
  },
  // Student 5 - Vikram Singh
  {
    studentId: "s5",
    courseId: "c1",
    marks: 61,
    maxMarks: 100,
    attendancePercentage: 70,
    sessionsAttended: 28,
    totalSessions: 40,
  },
  {
    studentId: "s5",
    courseId: "c2",
    marks: 58,
    maxMarks: 100,
    attendancePercentage: 68,
    sessionsAttended: 27,
    totalSessions: 40,
  },
  {
    studentId: "s5",
    courseId: "c4",
    marks: 72,
    maxMarks: 100,
    attendancePercentage: 78,
    sessionsAttended: 31,
    totalSessions: 40,
  },
  // Student 6 - Ananya Reddy
  {
    studentId: "s6",
    courseId: "c1",
    marks: 86,
    maxMarks: 100,
    attendancePercentage: 88,
    sessionsAttended: 35,
    totalSessions: 40,
  },
  {
    studentId: "s6",
    courseId: "c3",
    marks: 83,
    maxMarks: 100,
    attendancePercentage: 85,
    sessionsAttended: 34,
    totalSessions: 40,
  },
  {
    studentId: "s6",
    courseId: "c5",
    marks: 91,
    maxMarks: 100,
    attendancePercentage: 92,
    sessionsAttended: 37,
    totalSessions: 40,
  },
  // Student 7 - Rohan Mehta
  {
    studentId: "s7",
    courseId: "c1",
    marks: 95,
    maxMarks: 100,
    attendancePercentage: 98,
    sessionsAttended: 39,
    totalSessions: 40,
  },
  {
    studentId: "s7",
    courseId: "c2",
    marks: 91,
    maxMarks: 100,
    attendancePercentage: 95,
    sessionsAttended: 38,
    totalSessions: 40,
  },
  {
    studentId: "s7",
    courseId: "c3",
    marks: 89,
    maxMarks: 100,
    attendancePercentage: 90,
    sessionsAttended: 36,
    totalSessions: 40,
  },
  {
    studentId: "s7",
    courseId: "c4",
    marks: 94,
    maxMarks: 100,
    attendancePercentage: 95,
    sessionsAttended: 38,
    totalSessions: 40,
  },
  // Student 8 - Kavitha Nair
  {
    studentId: "s8",
    courseId: "c1",
    marks: 67,
    maxMarks: 100,
    attendancePercentage: 72,
    sessionsAttended: 29,
    totalSessions: 40,
  },
  {
    studentId: "s8",
    courseId: "c3",
    marks: 63,
    maxMarks: 100,
    attendancePercentage: 68,
    sessionsAttended: 27,
    totalSessions: 40,
  },
  {
    studentId: "s8",
    courseId: "c5",
    marks: 71,
    maxMarks: 100,
    attendancePercentage: 75,
    sessionsAttended: 30,
    totalSessions: 40,
  },
  // Student 9 - Sanjay Deshmukh
  {
    studentId: "s9",
    courseId: "c1",
    marks: 42,
    maxMarks: 100,
    attendancePercentage: 52,
    sessionsAttended: 21,
    totalSessions: 40,
  },
  {
    studentId: "s9",
    courseId: "c2",
    marks: 38,
    maxMarks: 100,
    attendancePercentage: 48,
    sessionsAttended: 19,
    totalSessions: 40,
  },
  {
    studentId: "s9",
    courseId: "c4",
    marks: 45,
    maxMarks: 100,
    attendancePercentage: 55,
    sessionsAttended: 22,
    totalSessions: 40,
  },
  {
    studentId: "s9",
    courseId: "c5",
    marks: 41,
    maxMarks: 100,
    attendancePercentage: 50,
    sessionsAttended: 20,
    totalSessions: 40,
  },
  // Student 10 - Meera Iyer
  {
    studentId: "s10",
    courseId: "c1",
    marks: 81,
    maxMarks: 100,
    attendancePercentage: 85,
    sessionsAttended: 34,
    totalSessions: 40,
  },
  {
    studentId: "s10",
    courseId: "c2",
    marks: 76,
    maxMarks: 100,
    attendancePercentage: 80,
    sessionsAttended: 32,
    totalSessions: 40,
  },
  {
    studentId: "s10",
    courseId: "c3",
    marks: 79,
    maxMarks: 100,
    attendancePercentage: 82,
    sessionsAttended: 33,
    totalSessions: 40,
  },
  // Student 11 - Arjun Das
  {
    studentId: "s11",
    courseId: "c1",
    marks: 73,
    maxMarks: 100,
    attendancePercentage: 78,
    sessionsAttended: 31,
    totalSessions: 40,
  },
  {
    studentId: "s11",
    courseId: "c3",
    marks: 68,
    maxMarks: 100,
    attendancePercentage: 72,
    sessionsAttended: 29,
    totalSessions: 40,
  },
  {
    studentId: "s11",
    courseId: "c4",
    marks: 75,
    maxMarks: 100,
    attendancePercentage: 80,
    sessionsAttended: 32,
    totalSessions: 40,
  },
  // Student 12 - Sneha Reddy
  {
    studentId: "s12",
    courseId: "c1",
    marks: 88,
    maxMarks: 100,
    attendancePercentage: 90,
    sessionsAttended: 36,
    totalSessions: 40,
  },
  {
    studentId: "s12",
    courseId: "c2",
    marks: 84,
    maxMarks: 100,
    attendancePercentage: 88,
    sessionsAttended: 35,
    totalSessions: 40,
  },
  {
    studentId: "s12",
    courseId: "c5",
    marks: 82,
    maxMarks: 100,
    attendancePercentage: 85,
    sessionsAttended: 34,
    totalSessions: 40,
  },
]

// Helper functions
export function getStudentsByCourseAndSection(courseId: string, section: string): Student[] {
  return mockStudents.filter((student) => student.enrolledCourses.includes(courseId) && student.section === section)
}

export function getStudentById(studentId: string): Student | undefined {
  return mockStudents.find((s) => s.id === studentId)
}

export function getCourseById(courseId: string): Course | undefined {
  return mockCourses.find((c) => c.id === courseId)
}

export function getEnrollment(studentId: string, courseId: string): CourseEnrollment | undefined {
  return mockEnrollments.find((e) => e.studentId === studentId && e.courseId === courseId)
}

export function getStudentEnrollments(studentId: string): CourseEnrollment[] {
  return mockEnrollments.filter((e) => e.studentId === studentId)
}

export function getCourseEnrollments(courseId: string): CourseEnrollment[] {
  return mockEnrollments.filter((e) => e.courseId === courseId)
}

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C"
  if (percentage >= 40) return "D"
  return "F"
}

export function calculatePercentile(marks: number, maxMarks: number): number {
  return Math.round((marks / maxMarks) * 90)
}

export function calculateStats(enrollments: CourseEnrollment[]): {
  mean: number
  median: number
  stdDev: number
} {
  if (enrollments.length === 0) return { mean: 0, median: 0, stdDev: 0 }

  const marks = enrollments.map((e) => e.marks)
  const mean = marks.reduce((a, b) => a + b, 0) / marks.length

  const sortedMarks = [...marks].sort((a, b) => a - b)
  const mid = Math.floor(sortedMarks.length / 2)
  const median = sortedMarks.length % 2 !== 0 ? sortedMarks[mid] : (sortedMarks[mid - 1] + sortedMarks[mid]) / 2

  const squaredDiffs = marks.map((m) => Math.pow(m - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / marks.length
  const stdDev = Math.sqrt(variance)

  return { mean: Math.round(mean * 10) / 10, median, stdDev: Math.round(stdDev * 10) / 10 }
}

export function calculateZScore(marks: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0
  return Math.round(((marks - mean) / stdDev) * 100) / 100
}

export function calculateRank(studentMarks: number, allMarks: number[]): number {
  const sortedMarks = [...allMarks].sort((a, b) => b - a)
  return sortedMarks.indexOf(studentMarks) + 1
}
