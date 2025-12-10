import { plannerService } from './plannerService';

export interface ImportedAssignment {
    title: string;
    description?: string;
    dueDate?: Date;
    subjectId?: string;
    subjectName?: string;
    source: 'google_classroom' | 'canvas';
}

class ImportService {
    /**
     * Import assignments from Google Classroom
     * Note: Requires Google Classroom API credentials and OAuth setup
     */
    async importFromGoogleClassroom(accessToken: string, userId: string): Promise<ImportedAssignment[]> {
        try {
            // Fetch courses
            const coursesResponse = await fetch(
                'https://classroom.googleapis.com/v1/courses',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!coursesResponse.ok) {
                throw new Error('Failed to fetch courses from Google Classroom');
            }

            const coursesData = await coursesResponse.json();
            const courses = coursesData.courses || [];
            const assignments: ImportedAssignment[] = [];

            // Fetch courseWork for each course
            for (const course of courses) {
                const courseWorkResponse = await fetch(
                    `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (courseWorkResponse.ok) {
                    const courseWorkData = await courseWorkResponse.json();
                    const courseWork = courseWorkData.courseWork || [];

                    for (const work of courseWork) {
                        assignments.push({
                            title: work.title,
                            description: work.description,
                            dueDate: work.dueDate
                                ? new Date(
                                    work.dueDate.year,
                                    work.dueDate.month - 1,
                                    work.dueDate.day
                                )
                                : undefined,
                            subjectName: course.name,
                            source: 'google_classroom',
                        });
                    }
                }
            }

            return assignments;
        } catch (error) {
            console.error('Error importing from Google Classroom:', error);
            throw error;
        }
    }

    /**
     * Import assignments from Canvas LMS
     * Note: Requires Canvas API credentials
     */
    async importFromCanvas(
        canvasUrl: string,
        accessToken: string,
        userId: string
    ): Promise<ImportedAssignment[]> {
        try {
            // Fetch courses
            const coursesResponse = await fetch(`${canvasUrl}/api/v1/courses`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!coursesResponse.ok) {
                throw new Error('Failed to fetch courses from Canvas');
            }

            const courses = await coursesResponse.json();
            const assignments: ImportedAssignment[] = [];

            // Fetch assignments for each course
            for (const course of courses) {
                const assignmentsResponse = await fetch(
                    `${canvasUrl}/api/v1/courses/${course.id}/assignments`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (assignmentsResponse.ok) {
                    const courseAssignments = await assignmentsResponse.json();

                    for (const assignment of courseAssignments) {
                        assignments.push({
                            title: assignment.name,
                            description: assignment.description,
                            dueDate: assignment.due_at ? new Date(assignment.due_at) : undefined,
                            subjectName: course.name,
                            source: 'canvas',
                        });
                    }
                }
            }

            return assignments;
        } catch (error) {
            console.error('Error importing from Canvas:', error);
            throw error;
        }
    }

    /**
     * Parse and normalize assignment data from various sources
     */
    parseAssignmentData(rawData: any, source: 'google_classroom' | 'canvas'): ImportedAssignment {
        if (source === 'google_classroom') {
            return {
                title: rawData.title,
                description: rawData.description,
                dueDate: rawData.dueDate
                    ? new Date(
                        rawData.dueDate.year,
                        rawData.dueDate.month - 1,
                        rawData.dueDate.day
                    )
                    : undefined,
                source: 'google_classroom',
            };
        } else {
            // Canvas
            return {
                title: rawData.name,
                description: rawData.description,
                dueDate: rawData.due_at ? new Date(rawData.due_at) : undefined,
                source: 'canvas',
            };
        }
    }

    /**
     * Save imported assignments to database
     */
    async saveImportedAssignments(
        userId: string,
        assignments: ImportedAssignment[]
    ): Promise<void> {
        // For each assignment, create or find subject, then create assignment
        for (const assignment of assignments) {
            let subjectId = assignment.subjectId;

            // If no subjectId but we have a subject name, try to find or create it
            if (!subjectId && assignment.subjectName) {
                const { data: subjects } = await plannerService.getSubjects(userId);
                const existingSubject = subjects?.find(
                    (s: any) => s.name.toLowerCase() === assignment.subjectName?.toLowerCase()
                );

                if (existingSubject) {
                    subjectId = existingSubject.id;
                } else {
                    // Create new subject
                    const newSubject = await plannerService.addSubject(
                        userId,
                        assignment.subjectName,
                        '#3B82F6' // Default blue color
                    );
                    subjectId = newSubject.id;
                }
            }

            // Create assignment
            if (subjectId && assignment.dueDate) {
                await plannerService.addAssignment(
                    userId,
                    assignment.title,
                    assignment.description || '',
                    assignment.dueDate,
                    subjectId
                );
            }
        }
    }
}

export const importService = new ImportService();
