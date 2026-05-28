
-- =====================================================
-- PHASE A: Core schema, roles, RLS, triggers, seeds
-- =====================================================

-- ---------- Enums ----------
CREATE TYPE public.app_role AS ENUM ('agent', 'manager', 'cluster_head', 'data_admin');
CREATE TYPE public.lead_stage AS ENUM ('new', 'allocated', 'in_progress', 'follow_up', 'partner_selected', 'submitted', 'approved', 'disbursed', 'declined', 'cancelled', 'expired');
CREATE TYPE public.slp_status AS ENUM ('submitted', 'in_review', 'approved', 'disbursed', 'declined', 'cancelled', 'on_hold');
CREATE TYPE public.partner_status AS ENUM ('active', 'inactive');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');

-- ---------- Profiles ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cluster_head_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.user_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------- User roles ----------
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'data_admin' THEN 1
    WHEN 'cluster_head' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'agent' THEN 4
  END
  LIMIT 1
$$;

-- ---------- Auto-create profile + bootstrap admin ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Bootstrap: first admin
  IF lower(NEW.email) = 'kshitij.dua@supersourcing.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'data_admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agent')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- Reference: products, partners, dispositions ----------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  status public.partner_status NOT NULL DEFAULT 'active',
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lending_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  products text[] NOT NULL DEFAULT '{}',
  integration_type text NOT NULL DEFAULT 'manual',
  min_credit_score integer,
  max_foir numeric(5,2),
  min_income numeric(12,2),
  status public.partner_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lending_partners TO authenticated;
GRANT ALL ON public.lending_partners TO service_role;
ALTER TABLE public.lending_partners ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dispositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  outcome_group text NOT NULL,
  requires_follow_up boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dispositions TO authenticated;
GRANT ALL ON public.dispositions TO service_role;
ALTER TABLE public.dispositions ENABLE ROW LEVEL SECURITY;

-- ---------- Lead batches ----------
CREATE TABLE public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES public.profiles(id),
  source text NOT NULL,
  file_name text,
  row_count integer NOT NULL DEFAULT 0,
  valid_count integer NOT NULL DEFAULT 0,
  invalid_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lead_batches TO authenticated;
GRANT ALL ON public.lead_batches TO service_role;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;

-- ---------- Leads ----------
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.lead_batches(id) ON DELETE SET NULL,

  -- Identity
  full_name text NOT NULL,
  mobile text NOT NULL,
  email text,
  pan text,
  dob date,
  gender text,
  city text,
  state text,
  pincode text,

  -- Employment
  employment_type text,
  employer_name text,
  designation text,
  work_experience_years numeric(4,1),

  -- Income & obligations
  monthly_income numeric(12,2),
  existing_obligations numeric(12,2) NOT NULL DEFAULT 0,
  foir numeric(5,2),

  -- Product / loan
  product text,
  loan_amount numeric(14,2),
  tenure_months integer,

  -- Credit
  credit_score integer,

  -- Workflow
  stage public.lead_stage NOT NULL DEFAULT 'new',
  disposition text,
  priority text NOT NULL DEFAULT 'medium',
  priority_score integer NOT NULL DEFAULT 0,
  source text,

  -- Assignment
  assigned_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  allocated_at timestamptz,
  expires_at timestamptz,

  -- Activity
  retry_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_agent ON public.leads(assigned_agent_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_batch ON public.leads(batch_id);
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ---------- Lead child tables ----------
CREATE TABLE public.lead_existing_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  lender text,
  loan_type text,
  outstanding_amount numeric(14,2),
  emi numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_existing_loans TO authenticated;
GRANT ALL ON public.lead_existing_loans TO service_role;
ALTER TABLE public.lead_existing_loans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lead_selected_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.lending_partners(id) ON DELETE RESTRICT,
  selected_by uuid REFERENCES public.profiles(id),
  selected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, partner_id)
);
GRANT SELECT, INSERT, DELETE ON public.lead_selected_partners TO authenticated;
GRANT ALL ON public.lead_selected_partners TO service_role;
ALTER TABLE public.lead_selected_partners ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- ---------- Call logs ----------
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id),
  call_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL,
  duration_seconds integer,
  disposition_code text,
  notes text,
  next_action text,
  follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_call_logs_lead ON public.call_logs(lead_id);
GRANT SELECT, INSERT ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- ---------- Follow-ups ----------
CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.profiles(id),
  scheduled_at timestamptz NOT NULL,
  type text NOT NULL DEFAULT 'call',
  sub_type text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_follow_ups_lead ON public.follow_ups(lead_id);
CREATE INDEX idx_follow_ups_agent ON public.follow_ups(agent_id);
GRANT SELECT, INSERT, UPDATE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- ---------- SLP submissions ----------
CREATE TABLE public.slp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.lending_partners(id),
  submitted_by uuid REFERENCES public.profiles(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status public.slp_status NOT NULL DEFAULT 'submitted',
  reference_id text,
  sanction_amount numeric(14,2),
  approval_date date,
  disbursed_amount numeric(14,2),
  disbursement_date date,
  status_reason text,
  last_update_note text,
  next_follow_up_at timestamptz,
  remarks text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_slp_lead ON public.slp_submissions(lead_id);
GRANT SELECT, INSERT, UPDATE ON public.slp_submissions TO authenticated;
GRANT ALL ON public.slp_submissions TO service_role;
ALTER TABLE public.slp_submissions ENABLE ROW LEVEL SECURITY;

-- ---------- Audit log ----------
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id),
  actor_role public.app_role,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON public.audit_log(actor_id);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ---------- Notifications ----------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- updated_at touch
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_partners BEFORE UPDATE ON public.lending_partners FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_slp BEFORE UPDATE ON public.slp_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- FOIR computation
CREATE OR REPLACE FUNCTION public.compute_lead_foir()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.monthly_income IS NOT NULL AND NEW.monthly_income > 0 THEN
    NEW.foir = round( (COALESCE(NEW.existing_obligations,0) / NEW.monthly_income * 100)::numeric, 2);
  ELSE
    NEW.foir = NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_lead_foir BEFORE INSERT OR UPDATE OF monthly_income, existing_obligations ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.compute_lead_foir();

-- Stage auto-derive from latest SLP
CREATE OR REPLACE FUNCTION public.sync_lead_stage_from_slp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stage public.lead_stage;
BEGIN
  _stage := CASE NEW.status
    WHEN 'submitted'  THEN 'submitted'::public.lead_stage
    WHEN 'in_review'  THEN 'submitted'::public.lead_stage
    WHEN 'approved'   THEN 'approved'::public.lead_stage
    WHEN 'disbursed'  THEN 'disbursed'::public.lead_stage
    WHEN 'declined'   THEN 'declined'::public.lead_stage
    WHEN 'cancelled'  THEN 'cancelled'::public.lead_stage
    WHEN 'on_hold'    THEN 'submitted'::public.lead_stage
  END;
  UPDATE public.leads SET stage = _stage, last_activity_at = now() WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_slp_sync_stage AFTER INSERT OR UPDATE OF status ON public.slp_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_stage_from_slp();

-- Bump last_activity on child writes
CREATE OR REPLACE FUNCTION public.bump_lead_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.leads SET last_activity_at = now() WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bump_call AFTER INSERT ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.bump_lead_activity();
CREATE TRIGGER trg_bump_followup AFTER INSERT OR UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.bump_lead_activity();
CREATE TRIGGER trg_bump_note AFTER INSERT ON public.lead_notes FOR EACH ROW EXECUTE FUNCTION public.bump_lead_activity();

-- POST-SLP field locks (PRD §10.18)
CREATE OR REPLACE FUNCTION public.enforce_post_slp_locks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _has_active_slp boolean;
DECLARE _is_override boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.slp_submissions
    WHERE lead_id = NEW.id AND status NOT IN ('cancelled', 'declined')
  ) INTO _has_active_slp;

  IF NOT _has_active_slp THEN RETURN NEW; END IF;

  -- Cluster head / data admin can override
  _is_override := public.has_role(auth.uid(), 'cluster_head') OR public.has_role(auth.uid(), 'data_admin');
  IF _is_override THEN RETURN NEW; END IF;

  IF NEW.pan IS DISTINCT FROM OLD.pan
     OR NEW.monthly_income IS DISTINCT FROM OLD.monthly_income
     OR NEW.existing_obligations IS DISTINCT FROM OLD.existing_obligations
     OR NEW.loan_amount IS DISTINCT FROM OLD.loan_amount
     OR NEW.product IS DISTINCT FROM OLD.product
     OR NEW.employment_type IS DISTINCT FROM OLD.employment_type
  THEN
    RAISE EXCEPTION 'Lead field locked after Submit to Lending Partner. Cluster Head override required.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_lead_post_slp_lock BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_slp_locks();

-- Audit log: append-only enforcement
CREATE OR REPLACE FUNCTION public.block_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_log is append-only'; END;
$$;
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();

-- Audit writer
CREATE OR REPLACE FUNCTION public.write_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  SELECT public.current_user_role() INTO _role;
  INSERT INTO public.audit_log (actor_id, actor_role, action, entity_type, entity_id, before, after)
  VALUES (
    auth.uid(), _role,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER trg_audit_leads AFTER INSERT OR UPDATE OR DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER trg_audit_slp AFTER INSERT OR UPDATE ON public.slp_submissions FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER trg_audit_followups AFTER INSERT OR UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER trg_audit_calls AFTER INSERT ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER trg_audit_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.write_audit();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- profiles: any authenticated can read; users can update self; admins can update anyone
CREATE POLICY profiles_select_all ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'data_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'data_admin'));

-- user_roles: self-read; admin manage
CREATE POLICY user_roles_select_self ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'data_admin') OR public.has_role(auth.uid(), 'cluster_head') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY user_roles_admin_write ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'data_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'data_admin'));

-- products: read all auth; write admin
CREATE POLICY products_select ON public.products FOR SELECT TO authenticated USING (true);

-- partners: read all auth; write admin (via service role / admin policy)
CREATE POLICY partners_select ON public.lending_partners FOR SELECT TO authenticated USING (true);
CREATE POLICY partners_admin_write ON public.lending_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'data_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'data_admin'));

-- dispositions: read all auth
CREATE POLICY dispositions_select ON public.dispositions FOR SELECT TO authenticated USING (true);
CREATE POLICY dispositions_admin_write ON public.dispositions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'data_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'data_admin'));

-- lead_batches: admin write, all auth read
CREATE POLICY lead_batches_select ON public.lead_batches FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'data_admin') OR public.has_role(auth.uid(), 'cluster_head') OR public.has_role(auth.uid(), 'manager')
);
CREATE POLICY lead_batches_insert ON public.lead_batches FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'data_admin')
);

-- Helper: can current user access this lead?
CREATE OR REPLACE FUNCTION public.can_access_lead(_lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(auth.uid(), 'data_admin')
    OR public.has_role(auth.uid(), 'cluster_head')
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = _lead_id AND (
        l.assigned_agent_id = auth.uid()
        OR (public.has_role(auth.uid(), 'manager')
            AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = l.assigned_agent_id AND p.manager_id = auth.uid()))
      )
    )
$$;

-- leads
CREATE POLICY leads_select ON public.leads FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'data_admin')
  OR public.has_role(auth.uid(), 'cluster_head')
  OR assigned_agent_id = auth.uid()
  OR (public.has_role(auth.uid(), 'manager') AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = assigned_agent_id AND p.manager_id = auth.uid()
  ))
);
CREATE POLICY leads_insert ON public.leads FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'data_admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'cluster_head')
  OR public.has_role(auth.uid(), 'agent')
);
CREATE POLICY leads_update ON public.leads FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'data_admin')
  OR public.has_role(auth.uid(), 'cluster_head')
  OR assigned_agent_id = auth.uid()
  OR (public.has_role(auth.uid(), 'manager') AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = assigned_agent_id AND p.manager_id = auth.uid()
  ))
);

-- lead child tables: via can_access_lead
CREATE POLICY lel_all ON public.lead_existing_loans FOR ALL TO authenticated
  USING (public.can_access_lead(lead_id)) WITH CHECK (public.can_access_lead(lead_id));
CREATE POLICY lsp_all ON public.lead_selected_partners FOR ALL TO authenticated
  USING (public.can_access_lead(lead_id)) WITH CHECK (public.can_access_lead(lead_id));
CREATE POLICY notes_select ON public.lead_notes FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY notes_insert ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (public.can_access_lead(lead_id));

CREATE POLICY calls_select ON public.call_logs FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY calls_insert ON public.call_logs FOR INSERT TO authenticated WITH CHECK (public.can_access_lead(lead_id) AND agent_id = auth.uid());

CREATE POLICY fu_select ON public.follow_ups FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY fu_insert ON public.follow_ups FOR INSERT TO authenticated WITH CHECK (public.can_access_lead(lead_id));
CREATE POLICY fu_update ON public.follow_ups FOR UPDATE TO authenticated USING (public.can_access_lead(lead_id));

CREATE POLICY slp_select ON public.slp_submissions FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY slp_insert ON public.slp_submissions FOR INSERT TO authenticated WITH CHECK (
  public.can_access_lead(lead_id) AND (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'cluster_head')
    OR public.has_role(auth.uid(), 'data_admin')
  )
);
CREATE POLICY slp_update ON public.slp_submissions FOR UPDATE TO authenticated USING (
  public.can_access_lead(lead_id) AND (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'cluster_head')
    OR public.has_role(auth.uid(), 'data_admin')
  )
);

-- audit_log: managers+ read scoped, no writes (triggers only)
CREATE POLICY audit_select ON public.audit_log FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'data_admin')
  OR public.has_role(auth.uid(), 'cluster_head')
  OR public.has_role(auth.uid(), 'manager')
);

-- notifications
CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- SEEDS
-- =====================================================
INSERT INTO public.products (slug, label) VALUES
  ('personal_loan', 'Personal Loan'),
  ('business_loan', 'Business Loan'),
  ('home_loan', 'Home Loan'),
  ('loan_against_property', 'Loan Against Property'),
  ('credit_card', 'Credit Card');

INSERT INTO public.dispositions (code, label, category, outcome_group, requires_follow_up) VALUES
  ('interested', 'Interested', 'positive', 'progress', true),
  ('callback_requested', 'Callback Requested', 'positive', 'progress', true),
  ('docs_pending', 'Documents Pending', 'positive', 'progress', true),
  ('not_interested', 'Not Interested', 'negative', 'closed', false),
  ('not_eligible', 'Not Eligible', 'negative', 'closed', false),
  ('wrong_number', 'Wrong Number', 'invalid', 'closed', false),
  ('no_answer', 'No Answer', 'neutral', 'retry', true),
  ('busy', 'Busy', 'neutral', 'retry', true),
  ('switched_off', 'Switched Off', 'neutral', 'retry', true),
  ('do_not_call', 'Do Not Call', 'negative', 'closed', false);

INSERT INTO public.lending_partners (name, products, integration_type, min_credit_score, max_foir, min_income, status) VALUES
  ('HDFC Bank', ARRAY['personal_loan','home_loan','credit_card'], 'manual', 700, 55.00, 25000, 'active'),
  ('ICICI Bank', ARRAY['personal_loan','business_loan'], 'manual', 680, 60.00, 20000, 'active'),
  ('Bajaj Finserv', ARRAY['personal_loan','loan_against_property'], 'manual', 650, 65.00, 18000, 'active');
