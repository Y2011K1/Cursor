import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { adminRemoveStudent } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole('admin')

    const body = await request.json()
    const studentId = body.studentId
    const id = body.courseId ?? body.classroomId

    if (!studentId || !id) {
      return NextResponse.json(
        { success: false, error: 'Student ID and Course ID are required' },
        { status: 400 }
      )
    }

    await adminRemoveStudent(studentId, id)

    return NextResponse.json({
      success: true,
      message: 'Student removed from course successfully'
    })
  } catch (error: any) {
    console.error('Error removing student from course:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove student' },
      { status: 500 }
    )
  }
}
