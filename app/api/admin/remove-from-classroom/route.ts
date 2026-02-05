import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { adminRemoveStudent } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole('admin')

    const { studentId, classroomId } = await request.json()

    if (!studentId || !classroomId) {
      return NextResponse.json(
        { success: false, error: 'Student ID and Classroom ID are required' },
        { status: 400 }
      )
    }

    // Call the admin function to remove student from classroom
    await adminRemoveStudent(studentId, classroomId)

    return NextResponse.json({
      success: true,
      message: 'Student removed from classroom successfully'
    })
  } catch (error: any) {
    console.error('Error removing student from classroom:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove student' },
      { status: 500 }
    )
  }
}
