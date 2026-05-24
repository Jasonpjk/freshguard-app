-- ⚠️ 현재 FreshGuard의 기본 운영 방향은 Vercel + Railway + PostgreSQL입니다. 이 파일은 Supabase 모드 참고용으로 보존됩니다.
-- ============================================================
-- FreshGuard 데모 시드 데이터
-- 주의: RLS가 활성화된 상태에서 실행 시 service_role key 필요
--       또는 Supabase Dashboard SQL Editor에서 직접 실행
-- ============================================================

-- 1. 데모 Organization
INSERT INTO organizations (id, name, type, plan, created_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '강남점 F&B',
  'restaurant',
  'free',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. 데모 Store
INSERT INTO stores (id, organization_id, name, type, address, is_active, created_at)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '강남점',
  'restaurant',
  '서울시 강남구 테헤란로 123',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. 데모 Profile (auth.users의 실제 UUID로 교체 필요)
-- INSERT INTO profiles (id, organization_id, name, role, is_active)
-- VALUES (
--   '<YOUR-AUTH-USER-UUID>',
--   'aaaaaaaa-0000-0000-0000-000000000001',
--   '김점주',
--   'owner',
--   true
-- );

-- 4. App Settings
INSERT INTO app_settings (
  organization_id, store_id,
  warning_days, urgent_days, default_open_use_days,
  notify_expired, notify_urgent, notify_warning
)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  3, 1, 3,
  true, true, false
) ON CONFLICT DO NOTHING;

-- 5. 보관 장소
INSERT INTO storage_locations (store_id, organization_id, name, type, temperature, capacity, notes)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '냉장고 1번', 'refrigerator', 4, 100, '채소/유제품 전용'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '냉장고 2번', 'refrigerator', 3, 80, '육류/수산물 전용'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '냉동고 A', 'freezer', -18, 200, '냉동식품 전용'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '건식 창고', 'dry', null, 500, '상온 보관'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '바 냉장고', 'bar', 5, 60, '음료/주류 전용');

-- 6. 위생 점검 템플릿 (global — store_id NULL)
INSERT INTO hygiene_check_templates (category, label, required, sort_order, is_active)
VALUES
  ('개인위생', '손 세척 및 소독 실시', true, 1, true),
  ('개인위생', '위생복 착용 상태 확인', true, 2, true),
  ('식품보관', '냉장/냉동 온도 기록', true, 3, true),
  ('식품보관', '유통기한 초과 식품 제거', true, 4, true),
  ('식품보관', '식품 보관 상태 (밀폐/분리) 확인', false, 5, true),
  ('시설청결', '조리 기구 세척 및 살균', true, 6, true),
  ('시설청결', '바닥/벽면 청결 상태', false, 7, true),
  ('시설청결', '배수구 청소 및 악취 여부', false, 8, true),
  ('온도관리', '조리 식품 중심 온도 확인 (75°C 이상)', true, 9, true),
  ('온도관리', '냉각 식품 온도 확인 (5°C 이하)', true, 10, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 주의사항
-- ============================================================
-- - profiles.id 는 auth.users.id 와 동일해야 합니다.
--   → 실제 가입 후 Supabase Dashboard > Authentication > Users 에서 UUID 확인 후 INSERT
-- - organizations.owner_id 는 회원가입 시 자동 설정됩니다 (authRepository.signUp Step 6).
-- - store_members 는 회원가입 시 자동 생성됩니다 (authRepository.signUp Step 5).
-- - RLS 정책이 활성화된 경우 service_role 키로 실행하거나
--   Supabase Dashboard > SQL Editor 에서 실행하세요.
