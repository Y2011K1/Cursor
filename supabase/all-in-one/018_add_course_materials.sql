-- ============================================
-- Add Course Materials Table
-- ============================================
-- Teachers can upload course materials (PDFs, documents, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  order_index INTEGER DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_course_materials_classroom_id ON public.course_materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_published ON public.course_materials(classroom_id, is_published) WHERE is_published = true;

-- Add trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS Policies for Course Materials
-- ============================================

-- Teachers can manage course materials in their classroom
CREATE POLICY "Teachers can manage course materials"
  ON public.course_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = course_materials.classroom_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = course_materials.classroom_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published course materials in their enrolled classrooms
CREATE POLICY "Students can view published course materials"
  ON public.course_materials FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Admins can view all course materials
CREATE POLICY "Admins can view all course materials"
  ON public.course_materials FOR SELECT
  USING (public.is_admin());
