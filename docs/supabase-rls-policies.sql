-- FreshGuard Supabase RLS 정책 (초안)
-- 이 파일을 supabase-schema.sql 실행 후에 Supabase SQL Editor에서 실행하세요.
-- 각 정책의 의도는 위 주석으로 설명합니다.

-- ─── RLS 활성화 ──────────────────────────────────────────────────────────────

ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE items                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_check_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_check_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods        ENABLE ROW LEVEL SECURITY;

-- ─── 헬퍼 함수 ────────────────────────────────────────────────────────────────

-- 현재 유저의 organization_id 반환
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 현재 유저의 role 반환
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 현재 유저가 특정 store에 접근 가능한지 확인
CREATE OR REPLACE FUNCTION can_access_store(target_store_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_members
    WHERE user_id = auth.uid() AND store_id = target_store_id
  ) OR current_user_role() IN ('owner', 'hq_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── organizations ────────────────────────────────────────────────────────────

-- 자신이 속한 조직만 조회 가능
CREATE POLICY "organizations: read own org" ON organizations
  FOR SELECT USING (id = current_org_id());

-- owner 또는 hq_admin만 조직 정보 수정 가능
CREATE POLICY "organizations: update by owner/hq_admin" ON organizations
  FOR UPDATE USING (
    id = current_org_id()
    AND current_user_role() IN ('owner', 'hq_admin')
  );

-- ─── profiles ────────────────────────────────────────────────────────────────

-- 자기 자신의 프로필은 항상 조회 가능
CREATE POLICY "profiles: read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- 같은 조직 내 프로필 조회 가능 (직원 목록 표시용)
CREATE POLICY "profiles: read same org profiles" ON profiles
  FOR SELECT USING (organization_id = current_org_id());

-- 자기 프로필만 수정 가능 (role 변경은 owner/manager만)
CREATE POLICY "profiles: update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 회원가입 시 프로필 생성 (자기 자신)
CREATE POLICY "profiles: insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── stores ──────────────────────────────────────────────────────────────────

-- 자신의 조직에 속한 매장만 조회 가능
CREATE POLICY "stores: read org stores" ON stores
  FOR SELECT USING (organization_id = current_org_id());

-- owner 또는 hq_admin만 매장 생성 가능
CREATE POLICY "stores: insert by owner/hq_admin" ON stores
  FOR INSERT WITH CHECK (
    organization_id = current_org_id()
    AND current_user_role() IN ('owner', 'hq_admin')
  );

-- owner 또는 hq_admin만 매장 수정 가능
CREATE POLICY "stores: update by owner/hq_admin" ON stores
  FOR UPDATE USING (
    organization_id = current_org_id()
    AND current_user_role() IN ('owner', 'hq_admin')
  );

-- ─── store_members ────────────────────────────────────────────────────────────

-- 자신의 조직 매장 멤버십만 조회 가능
CREATE POLICY "store_members: read org members" ON store_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_members.store_id
        AND s.organization_id = current_org_id()
    )
  );

-- owner 또는 manager만 멤버 추가 가능
CREATE POLICY "store_members: insert by owner/manager" ON store_members
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- owner 또는 manager만 멤버 삭제 가능
CREATE POLICY "store_members: delete by owner/manager" ON store_members
  FOR DELETE USING (
    current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- ─── storage_locations ────────────────────────────────────────────────────────

-- 접근 가능한 매장의 위치만 조회 가능
CREATE POLICY "storage_locations: read accessible stores" ON storage_locations
  FOR SELECT USING (can_access_store(store_id));

-- owner 또는 manager만 위치 생성/수정/삭제 가능
CREATE POLICY "storage_locations: write by owner/manager" ON storage_locations
  FOR ALL USING (
    can_access_store(store_id)
    AND current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- ─── items ───────────────────────────────────────────────────────────────────

-- 접근 가능한 매장의 품목만 조회 가능
CREATE POLICY "items: read accessible stores" ON items
  FOR SELECT USING (can_access_store(store_id));

-- 접근 가능한 매장에 품목 추가 가능 (staff 포함)
CREATE POLICY "items: insert by accessible store members" ON items
  FOR INSERT WITH CHECK (can_access_store(store_id));

-- 접근 가능한 매장의 품목 수정 가능
CREATE POLICY "items: update by accessible store members" ON items
  FOR UPDATE USING (can_access_store(store_id));

-- 품목 삭제는 owner 또는 manager만 가능
CREATE POLICY "items: delete by owner/manager" ON items
  FOR DELETE USING (
    can_access_store(store_id)
    AND current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- ─── stock_logs ───────────────────────────────────────────────────────────────

-- 접근 가능한 매장의 재고 로그만 조회 가능
CREATE POLICY "stock_logs: read accessible stores" ON stock_logs
  FOR SELECT USING (can_access_store(store_id));

-- 접근 가능한 매장에 로그 추가 가능 (staff 포함)
CREATE POLICY "stock_logs: insert by accessible store members" ON stock_logs
  FOR INSERT WITH CHECK (can_access_store(store_id));

-- 재고 로그는 수정/삭제 불가 (audit trail 보존)
-- 삭제가 필요하면 owner만 가능하도록 별도 정책 추가

-- ─── disposal_records ─────────────────────────────────────────────────────────

-- 접근 가능한 매장의 폐기 기록만 조회 가능
CREATE POLICY "disposal_records: read accessible stores" ON disposal_records
  FOR SELECT USING (can_access_store(store_id));

-- 접근 가능한 매장에 폐기 기록 추가 가능 (staff 포함)
CREATE POLICY "disposal_records: insert by accessible store members" ON disposal_records
  FOR INSERT WITH CHECK (can_access_store(store_id));

-- 폐기 승인/거부는 owner 또는 manager만 가능
CREATE POLICY "disposal_records: approve by owner/manager" ON disposal_records
  FOR UPDATE USING (
    can_access_store(store_id)
    AND current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- ─── hygiene_check_templates ─────────────────────────────────────────────────

-- 글로벌 템플릿(store_id IS NULL) 또는 자신의 매장 템플릿만 조회 가능
CREATE POLICY "hygiene_check_templates: read global or own store" ON hygiene_check_templates
  FOR SELECT USING (
    store_id IS NULL
    OR can_access_store(store_id)
  );

-- owner 또는 manager만 템플릿 생성/수정/삭제 가능
CREATE POLICY "hygiene_check_templates: write by owner/manager" ON hygiene_check_templates
  FOR ALL USING (
    current_user_role() IN ('owner', 'manager', 'hq_admin')
  );

-- ─── hygiene_check_sessions ──────────────────────────────────────────────────

-- 접근 가능한 매장의 세션만 조회 가능
CREATE POLICY "hygiene_check_sessions: read accessible stores" ON hygiene_check_sessions
  FOR SELECT USING (can_access_store(store_id));

-- 접근 가능한 매장에 세션 추가 가능 (staff 포함)
CREATE POLICY "hygiene_check_sessions: insert by accessible store members" ON hygiene_check_sessions
  FOR INSERT WITH CHECK (can_access_store(store_id));

-- 세션 업데이트는 접근 가능한 멤버만
CREATE POLICY "hygiene_check_sessions: update by accessible store members" ON hygiene_check_sessions
  FOR UPDATE USING (can_access_store(store_id));

-- ─── hygiene_check_items ─────────────────────────────────────────────────────

-- 세션이 속한 매장에 접근 가능한 유저만 조회 가능
CREATE POLICY "hygiene_check_items: read via session store access" ON hygiene_check_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hygiene_check_sessions s
      WHERE s.id = hygiene_check_items.session_id
        AND can_access_store(s.store_id)
    )
  );

-- 세션이 속한 매장에 접근 가능한 유저만 체크 항목 수정 가능
CREATE POLICY "hygiene_check_items: update via session store access" ON hygiene_check_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM hygiene_check_sessions s
      WHERE s.id = hygiene_check_items.session_id
        AND can_access_store(s.store_id)
    )
  );

-- ─── app_settings ────────────────────────────────────────────────────────────

-- 접근 가능한 매장의 설정만 조회 가능
CREATE POLICY "app_settings: read accessible stores" ON app_settings
  FOR SELECT USING (can_access_store(store_id));

-- owner 또는 hq_admin만 설정 변경 가능
CREATE POLICY "app_settings: write by owner/hq_admin" ON app_settings
  FOR ALL USING (
    can_access_store(store_id)
    AND current_user_role() IN ('owner', 'hq_admin')
  );

-- ─── subscriptions ────────────────────────────────────────────────────────────

-- 자신의 조직 구독 정보만 조회 가능
CREATE POLICY "subscriptions: read own org" ON subscriptions
  FOR SELECT USING (organization_id = current_org_id());

-- owner 또는 hq_admin만 구독 변경 가능
CREATE POLICY "subscriptions: write by owner/hq_admin" ON subscriptions
  FOR ALL USING (
    organization_id = current_org_id()
    AND current_user_role() IN ('owner', 'hq_admin')
  );

-- ─── payment_methods ──────────────────────────────────────────────────────────

-- 자신의 조직 결제 수단만 조회 가능
CREATE POLICY "payment_methods: read own org" ON payment_methods
  FOR SELECT USING (organization_id = current_org_id());

-- owner만 결제 수단 추가/수정/삭제 가능
CREATE POLICY "payment_methods: write by owner" ON payment_methods
  FOR ALL USING (
    organization_id = current_org_id()
    AND current_user_role() = 'owner'
  );
