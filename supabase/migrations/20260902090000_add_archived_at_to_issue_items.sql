-- أرشفة بند فرعي داخل تقرير قائم: يُطلب أحياناً تقرير بعدد بنود أقل (متبرع
-- يرغب في ٦ بنود من ١٠)، فنُخفي البند بدل حذفه ليبقى العمل الميداني محفوظاً
-- وقابلاً للإرجاع. البند المؤرشف يُستثنى من جدول التكلفة والمواصفات والإجمالي
-- وصفحات الصور، ويبقى ظاهراً للفني في الواجهة برمادي مصغّر.
ALTER TABLE public.issue_items
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- أغلب القراءات تطلب البنود غير المؤرشفة فقط
CREATE INDEX IF NOT EXISTS idx_issue_items_issue_active
  ON public.issue_items (issue_id)
  WHERE archived_at IS NULL;

-- الأدمن يؤرشف في كل التقارير لا في تقاريره وحدها.
-- SECURITY DEFINER لتجاوز RLS على profiles: لو مُنع المستخدم من قراءة صفّه
-- لعاد الشرط false وصار الأدمن كغيره.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  );
$$;

-- سياسات RLS تُجمَع بـ OR، فسياسة «فني التقرير» الحالية تبقى عاملة كما هي
DROP POLICY IF EXISTS "Admins can update any issue item" ON public.issue_items;
CREATE POLICY "Admins can update any issue item" ON public.issue_items
  FOR UPDATE USING (public.is_admin());

-- صور المشكلة تُقابل بنودها بالترتيب (صورة رقم ن ← بند رقم ن في حالة ٢)، وكل
-- الصور القديمة أُدخلت بقيمة photo_order الافتراضية نفسها فالترتيب بينها غير
-- محدد. نُرقّمها بترتيب الإدخال حتى تُسقط الأرشفة صورة البند المؤرشف لا غيرها،
-- ونقتصر على المشكلات التي تتساوى فيها القيم فلا نعبث بترتيبٍ مكتوبٍ فعلاً.
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY issue_id ORDER BY created_at, id) - 1 AS photo_index
  FROM public.issue_photos
)
UPDATE public.issue_photos AS p
SET photo_order = o.photo_index
FROM ordered AS o
WHERE o.id = p.id
  AND p.issue_id IN (
    SELECT issue_id
    FROM public.issue_photos
    GROUP BY issue_id
    HAVING MIN(photo_order) = MAX(photo_order)
  );

-- PostgREST يحتفظ بمخطط مؤقت، فبدون هذا يفشل الكتابة على العمود الجديد
-- بـ PGRST204 حتى يُحدَّث المخطط من تلقائه.
NOTIFY pgrst, 'reload schema';
