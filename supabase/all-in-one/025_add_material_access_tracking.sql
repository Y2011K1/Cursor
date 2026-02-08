-- ============================================
-- Add Material Access Tracking
-- Track when students access/download course materials for points
-- ============================================

CREATE TABLE IF NOT EXISTS public.material_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, material_id)
);

-- Enable RLS
ALTER TABLE public.material_access ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_access_student_id ON public.material_access(student_id);
CREATE INDEX IF NOT EXISTS idx_material_access_material_id ON public.material_access(material_id);
CREATE INDEX IF NOT EXISTS idx_material_access_student_material ON public.material_access(student_id, material_id);

-- ============================================
-- RLS Policies for Material Access
-- ============================================

-- Students can insert their own material access records
CREATE POLICY "Students can track own material access"
  ON public.material_access FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can view their own material access records
CREATE POLICY "Students can view own material access"
  ON public.material_access FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can view material access for students in their classroom
CREATE POLICY "Teachers can view classroom material access"
  ON public.material_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_materials cm
      JOIN public.classrooms cl ON cm.classroom_id = cl.id
      WHERE cm.id = material_access.material_id 
      AND cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all material access
CREATE POLICY "Admins can view all material access"
  ON public.material_access FOR SELECT
  USING (public.is_admin());
