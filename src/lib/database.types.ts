/**
 * Types de la base Supabase.
 *
 * Régénérer après toute migration :
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type UserRole = "super_admin" | "teacher" | "student";
export type AccountStatus = "invited" | "active" | "suspended";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Scenario = "job_interview" | "academic" | "business" | "fluency";
export type ModuleKind =
  | "listening"
  | "pronunciation"
  | "simulation"
  | "vocabulary"
  | "grammar"
  | "other";
export type PathSessionStatus = "locked" | "open" | "booked" | "done";
export type BookingStatus = "scheduled" | "completed" | "canceled" | "no_show";
export type ResourceKind = "pdf" | "audio" | "video" | "link" | "doc";
export type AssignmentStatus = "todo" | "done";
export type DiscoveryStatus =
  | "to_qualify"
  | "scheduled"
  | "confirmed"
  | "thinking"
  | "converted"
  | "lost";
export type ReportStatus = "draft" | "published";

export type AgendaItem = { duration: string; label: string };
export type FollowUp = { label: string; done: boolean };
export type EvaluationAnswer = { question: string; answer: string };

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: AccountStatus;
  avatar_url: string | null;
  timezone: string;
  booking_enabled: boolean;
  booking_credits: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentProfile = {
  id: string;
  teacher_id: string | null;
  initial_level: CefrLevel | null;
  target_level: CefrLevel | null;
  scenario: Scenario | null;
  goal: string | null;
  goal_in_own_words: string | null;
  availability: string[];
  teacher_notes: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Consent = {
  id: string;
  user_id: string;
  kind: "terms" | "privacy" | "pedagogical_data" | "marketing";
  granted: boolean;
  version: string;
  granted_at: string;
};

export type DiscoveryCall = {
  id: string;
  teacher_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: DiscoveryStatus;
  notes: string | null;
  follow_ups: FollowUp[];
  converted_student_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PathTemplate = {
  id: string;
  teacher_id: string;
  name: string;
  scenario: Scenario | null;
  description: string | null;
  session_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateSession = {
  id: string;
  template_id: string;
  position: number;
  title: string;
  module: ModuleKind;
  goal: string | null;
  agenda: AgendaItem[];
  default_homework: string[];
};

export type LearningPath = {
  id: string;
  student_id: string;
  teacher_id: string;
  template_id: string | null;
  name: string;
  scenario: Scenario | null;
  is_active: boolean;
  started_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PathSession = {
  id: string;
  path_id: string;
  position: number;
  title: string;
  module: ModuleKind;
  goal: string | null;
  agenda: AgendaItem[];
  status: PathSessionStatus;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  student_id: string;
  teacher_id: string;
  path_session_id: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  meet_url: string | null;
  student_note: string | null;
  calendly_event_uri: string | null;
  calendly_invitee_uri: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
  canceled_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionReport = {
  id: string;
  booking_id: string;
  student_id: string;
  teacher_id: string;
  theme: string | null;
  strengths: string | null;
  improvements: string | null;
  private_notes: string | null;
  skills: string[];
  status: ReportStatus;
  published_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Vue `student_reports` : sans les notes privées de l'enseignant. */
export type StudentReport = {
  id: string;
  booking_id: string;
  student_id: string;
  teacher_id: string;
  theme: string | null;
  strengths: string | null;
  improvements: string | null;
  skills: string[];
  published_at: string | null;
  read_at: string | null;
  starts_at: string;
  session_position: number | null;
  session_title: string | null;
};

export type Resource = {
  id: string;
  teacher_id: string;
  title: string;
  kind: ResourceKind;
  storage_path: string | null;
  external_url: string | null;
  description: string | null;
  duration_label: string | null;
  created_at: string;
};

export type ResourceShare = {
  resource_id: string;
  student_id: string;
  shared_at: string;
};

export type Assignment = {
  id: string;
  student_id: string;
  teacher_id: string;
  path_session_id: string | null;
  resource_id: string | null;
  title: string;
  instructions: string | null;
  due_label: string | null;
  due_at: string | null;
  status: AssignmentStatus;
  completed_at: string | null;
  created_at: string;
};

export type SelfEvaluation = {
  id: string;
  student_id: string;
  path_id: string | null;
  answers: EvaluationAnswer[];
  free_comment: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

export type NotificationPreferences = {
  user_id: string;
  session_reminders: boolean;
  email_reminders: boolean;
  report_published: boolean;
};

export type AdminOverview = {
  students: number;
  teachers: number;
  active_students: number;
  lessons_completed: number;
  lessons_upcoming: number;
  reports_published: number;
  active_last_7_days: number;
};

export type TeacherActivity = {
  teacher_id: string;
  full_name: string | null;
  email: string;
  student_count: number;
  lessons_completed: number;
  reports_pending: number;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type View<Row> = { Row: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      student_profiles: Table<StudentProfile>;
      consents: Table<Consent>;
      deletion_requests: Table<{
        id: string;
        user_id: string;
        reason: string | null;
        requested_at: string;
        processed_at: string | null;
      }>;
      discovery_calls: Table<DiscoveryCall>;
      path_templates: Table<PathTemplate>;
      template_sessions: Table<TemplateSession>;
      learning_paths: Table<LearningPath>;
      path_sessions: Table<PathSession>;
      bookings: Table<Booking>;
      booking_reminders: Table<{
        booking_id: string;
        offset_label: "d3" | "d1" | "h1";
        sent_at: string;
      }>;
      session_reports: Table<SessionReport>;
      resources: Table<Resource>;
      resource_shares: Table<ResourceShare>;
      assignments: Table<Assignment>;
      self_evaluations: Table<SelfEvaluation>;
      notification_preferences: Table<NotificationPreferences>;
    };
    Views: {
      student_reports: View<StudentReport>;
      admin_overview: View<AdminOverview>;
      teacher_activity: View<TeacherActivity>;
    };
    Functions: {
      path_progress: {
        Args: { path: string };
        Returns: { total: number; done: number; pct: number }[];
      };
      assign_template: {
        Args: { p_template_id: string; p_student_id: string; p_name?: string };
        Returns: string;
      };
      publish_report: { Args: { p_report_id: string }; Returns: undefined };
      request_account_deletion: {
        Args: { p_reason?: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      cefr_level: CefrLevel;
      scenario: Scenario;
      module_kind: ModuleKind;
      path_session_status: PathSessionStatus;
      booking_status: BookingStatus;
      resource_kind: ResourceKind;
      assignment_status: AssignmentStatus;
      discovery_status: DiscoveryStatus;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
