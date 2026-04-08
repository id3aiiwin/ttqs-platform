export type UserRole = 'consultant' | 'admin' | 'instructor' | 'supervisor' | 'analyst' | 'hr' | 'manager' | 'employee' | 'student'

export type ActionItem = {
  id: string
  content: string
  assignee: string | null
  due_date: string | null
  completed: boolean
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          company_id: string | null
          department_id: string | null
          signature_url: string | null
          job_title: string | null
          hire_date: string | null
          birthday: string | null
          line_user_id: string | null
          roles: string[]
          instructor_level: string | null
          accumulated_hours: number
          annual_hours: number
          refresh_training_count: number
          articles_count: number
          recommendations_count: number
          internship_reports_reviewed: number
          promotion_status: string | null
          promotion_target_level: string | null
          promotion_applied_at: string | null
          promotion_history: Record<string, unknown>[]
          analyst_level: string | null
          is_personal_client: boolean
          average_satisfaction: number
          customer_level: string | null
          customer_tags: string[]
          total_spending: number
          gender: string | null
          phone: string | null
          r1_pattern: string | null
          l2_pattern: string | null
          scheduled_assessment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          company_id?: string | null
          department_id?: string | null
          job_title?: string | null
          hire_date?: string | null
          birthday?: string | null
          line_user_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          company_id?: string | null
          department_id?: string | null
          job_title?: string | null
          hire_date?: string | null
          birthday?: string | null
          line_user_id?: string | null
          accumulated_hours?: number
          annual_hours?: number
          average_satisfaction?: number
          instructor_level?: string | null
          promotion_status?: string | null
          analyst_level?: string | null
          customer_level?: string | null
          customer_tags?: string[]
          total_spending?: number
          r1_pattern?: string | null
          l2_pattern?: string | null
          scheduled_assessment_date?: string | null
        }
        Relationships: []
      }
      line_notifications: {
        Row: { id: string; course_id: string | null; sent_by: string | null; message: string; recipient_count: number; failed_count: number; sent_at: string }
        Insert: { id?: string; course_id?: string | null; sent_by?: string | null; message: string; recipient_count?: number; failed_count?: number }
        Update: {}
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          contact_person: string | null
          contact_email: string | null
          contact_phone: string | null
          ttqs_level: 'bronze' | 'silver' | 'gold' | null
          ttqs_expiry_date: string | null
          status: 'active' | 'inactive' | 'pending'
          annual_settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          ttqs_level?: 'bronze' | 'silver' | 'gold' | null
          ttqs_expiry_date?: string | null
          status?: 'active' | 'inactive' | 'pending'
          annual_settings?: Record<string, unknown>
        }
        Update: {
          name?: string
          industry?: string | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          ttqs_level?: 'bronze' | 'silver' | 'gold' | null
          ttqs_expiry_date?: string | null
          status?: 'active' | 'inactive' | 'pending'
          annual_settings?: Record<string, unknown>
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          manager_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          manager_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          manager_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          company_id: string | null
          title: string
          description: string | null
          status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
          start_date: string | null
          end_date: string | null
          hours: number | null
          trainer: string | null
          budget: number | null
          created_by: string
          course_type: string
          material_submit_date: string | null
          teaching_log_submit_date: string | null
          review_status: string
          reject_reason: string | null
          is_counted_in_hours: boolean
          default_fee: number | null
          total_revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          title: string
          description?: string | null
          status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          hours?: number | null
          trainer?: string | null
          budget?: number | null
          created_by: string
          course_type?: string
          default_fee?: number | null
        }
        Update: {
          company_id?: string | null
          title?: string
          description?: string | null
          status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          hours?: number | null
          trainer?: string | null
          budget?: number | null
          course_type?: string
          review_status?: string
          reject_reason?: string | null
          is_counted_in_hours?: boolean
          material_submit_date?: string | null
          teaching_log_submit_date?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          company_id: string
          meeting_date: string
          meeting_time: string | null
          meeting_type: 'onsite' | 'online' | 'phone'
          attendees_consultant: string[]
          attendees_company: string | null
          discussion_points: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          meeting_date: string
          meeting_time?: string | null
          meeting_type?: 'onsite' | 'online' | 'phone'
          attendees_consultant?: string[]
          attendees_company?: string | null
          discussion_points?: string | null
          created_by?: string | null
        }
        Update: {
          company_id?: string
          meeting_date?: string
          meeting_time?: string | null
          meeting_type?: 'onsite' | 'online' | 'phone'
          attendees_consultant?: string[]
          attendees_company?: string | null
          discussion_points?: string | null
        }
        Relationships: []
      }
      meeting_action_items: {
        Row: {
          id: string
          meeting_id: string
          content: string
          assignee_id: string | null
          due_date: string | null
          is_added_to_todo: boolean
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          content: string
          assignee_id?: string | null
          due_date?: string | null
          is_added_to_todo?: boolean
          is_completed?: boolean
        }
        Update: {
          content?: string
          assignee_id?: string | null
          due_date?: string | null
          is_added_to_todo?: boolean
          is_completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      course_forms: {
        Row: {
          id: string
          course_id: string
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O'
          name: string
          standard_name: string | null
          ttqs_indicator: string | null
          form_type: 'online' | 'upload' | 'auto'
          sort_order: number
          status: 'pending' | 'in_progress' | 'completed'
          file_url: string | null
          form_data: Record<string, unknown> | null
          field_schema: Record<string, unknown> | null
          notes: string | null
          template_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O'
          name: string
          standard_name?: string | null
          ttqs_indicator?: string | null
          form_type: 'online' | 'upload' | 'auto'
          sort_order?: number
          status?: 'pending' | 'in_progress' | 'completed'
          file_url?: string | null
          form_data?: Record<string, unknown> | null
          field_schema?: Record<string, unknown> | null
          notes?: string | null
          template_id?: string | null
        }
        Update: {
          name?: string
          standard_name?: string | null
          ttqs_indicator?: string | null
          form_type?: 'online' | 'upload' | 'auto'
          sort_order?: number
          status?: 'pending' | 'in_progress' | 'completed'
          file_url?: string | null
          form_data?: Record<string, unknown> | null
          field_schema?: Record<string, unknown> | null
          notes?: string | null
        }
        Relationships: []
      }
      company_form_templates: {
        Row: {
          id: string
          company_id: string
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O'
          name: string
          standard_name: string | null
          ttqs_indicator: string | null
          form_type: 'online' | 'upload' | 'auto'
          sort_order: number
          needs_customization: boolean
          is_confirmed: boolean
          confirmed_at: string | null
          confirmed_by: string | null
          field_schema: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O'
          name: string
          standard_name?: string | null
          ttqs_indicator?: string | null
          form_type: 'online' | 'upload' | 'auto'
          sort_order?: number
          needs_customization?: boolean
          is_confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          field_schema?: Record<string, unknown> | null
        }
        Update: {
          name?: string
          standard_name?: string | null
          ttqs_indicator?: string | null
          form_type?: 'online' | 'upload' | 'auto'
          sort_order?: number
          needs_customization?: boolean
          is_confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          field_schema?: Record<string, unknown> | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          id: string
          title: string
          tier: number
          linked_to_course_form: boolean
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O' | null
          auto_generated_from: 'JD' | 'course_form' | null
          ttqs_indicator: string | null
          description: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          tier: number
          linked_to_course_form?: boolean
          pddro_phase?: 'P' | 'D' | 'DO' | 'R' | 'O' | null
          auto_generated_from?: 'JD' | 'course_form' | null
          ttqs_indicator?: string | null
          description?: string | null
          sort_order?: number
        }
        Update: {
          title?: string
          tier?: number
          linked_to_course_form?: boolean
          pddro_phase?: 'P' | 'D' | 'DO' | 'R' | 'O' | null
          auto_generated_from?: 'JD' | 'course_form' | null
          ttqs_indicator?: string | null
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          id: string
          company_id: string
          template_id: string | null
          doc_number: string | null
          title: string
          tier: number
          version: string | null
          source: 'template' | 'upload' | 'auto_generated'
          file_url: string | null
          linked_to_course_form: boolean
          pddro_phase: 'P' | 'D' | 'DO' | 'R' | 'O' | null
          auto_generated_from: 'JD' | 'course_form' | null
          status: 'draft' | 'pending_review' | 'approved'
          ttqs_indicator: string | null
          notes: string | null
          created_by: string | null
          approval_id: string | null
          filled_content: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          template_id?: string | null
          doc_number?: string | null
          title: string
          tier: number
          version?: string | null
          source?: 'template' | 'upload' | 'auto_generated'
          file_url?: string | null
          linked_to_course_form?: boolean
          pddro_phase?: 'P' | 'D' | 'DO' | 'R' | 'O' | null
          auto_generated_from?: 'JD' | 'course_form' | null
          status?: 'draft' | 'pending_review' | 'approved'
          ttqs_indicator?: string | null
          notes?: string | null
          created_by?: string | null
          approval_id?: string | null
          filled_content?: Record<string, unknown> | null
        }
        Update: {
          doc_number?: string | null
          title?: string
          tier?: number
          version?: string | null
          source?: 'template' | 'upload' | 'auto_generated'
          file_url?: string | null
          status?: 'draft' | 'pending_review' | 'approved'
          notes?: string | null
          approval_id?: string | null
          filled_content?: Record<string, unknown> | null
        }
        Relationships: []
      }
      company_document_versions: {
        Row: {
          id: string
          document_id: string
          version: string
          file_url: string | null
          change_note: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version: string
          file_url?: string | null
          change_note?: string | null
          changed_by?: string | null
        }
        Update: {
          version?: string
          file_url?: string | null
          change_note?: string | null
        }
        Relationships: []
      }
      company_document_reviews: {
        Row: {
          id: string
          document_id: string
          reviewer_id: string
          status: 'needs_revision' | 'approved'
          comment: string | null
          reviewed_at: string
        }
        Insert: {
          id?: string
          document_id: string
          reviewer_id: string
          status: 'needs_revision' | 'approved'
          comment?: string | null
        }
        Update: {
          status?: 'needs_revision' | 'approved'
          comment?: string | null
        }
        Relationships: []
      }
      competency_form_defaults: {
        Row: {
          id: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          field_name: string
          standard_name: string
          field_type: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required: boolean
          options: Record<string, unknown> | null
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          field_name: string
          standard_name: string
          field_type?: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required?: boolean
          options?: Record<string, unknown> | null
          description?: string | null
          sort_order?: number
        }
        Update: {
          field_name?: string
          standard_name?: string
          field_type?: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required?: boolean
          options?: Record<string, unknown> | null
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      competency_form_templates: {
        Row: {
          id: string
          company_id: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          default_field_id: string | null
          field_name: string
          standard_name: string | null
          display_name: string | null
          field_type: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required: boolean
          options: Record<string, unknown> | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          default_field_id?: string | null
          field_name: string
          standard_name?: string | null
          display_name?: string | null
          field_type?: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required?: boolean
          options?: Record<string, unknown> | null
          sort_order?: number
        }
        Update: {
          field_name?: string
          display_name?: string | null
          field_type?: 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
          is_required?: boolean
          options?: Record<string, unknown> | null
          sort_order?: number
        }
        Relationships: []
      }
      competency_form_entries: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          version: string | null
          status: 'draft' | 'in_progress' | 'submitted' | 'reviewed' | 'approved'
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          form_type: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
          version?: string | null
          status?: 'draft' | 'in_progress' | 'submitted' | 'reviewed' | 'approved'
        }
        Update: {
          version?: string | null
          status?: 'draft' | 'in_progress' | 'submitted' | 'reviewed' | 'approved'
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      competency_form_entry_values: {
        Row: {
          id: string
          entry_id: string
          template_field_id: string | null
          field_name: string
          value: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          template_field_id?: string | null
          field_name: string
          value?: Record<string, unknown> | null
        }
        Update: {
          field_name?: string
          value?: Record<string, unknown> | null
        }
        Relationships: []
      }
      employee_certificates: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          name: string
          issuer: string | null
          issued_date: string | null
          expiry_date: string | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          name: string
          issuer?: string | null
          issued_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
        }
        Update: {
          name?: string
          issuer?: string | null
          issued_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
        }
        Relationships: []
      }
      employee_idp: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          created_by: string | null
          competency_name: string
          current_level: number
          target_level: number
          target_date: string | null
          related_courses: unknown[]
          status: 'in_progress' | 'completed' | 'paused'
          consultant_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          created_by?: string | null
          competency_name: string
          current_level?: number
          target_level?: number
          target_date?: string | null
          related_courses?: unknown[]
          status?: 'in_progress' | 'completed' | 'paused'
          consultant_notes?: string | null
        }
        Update: {
          competency_name?: string
          current_level?: number
          target_level?: number
          target_date?: string | null
          related_courses?: unknown[]
          status?: 'in_progress' | 'completed' | 'paused'
          consultant_notes?: string | null
        }
        Relationships: []
      }
      core_competency_scores: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          competency_name: string
          score: number
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          competency_name: string
          score?: number
        }
        Update: {
          score?: number
        }
        Relationships: []
      }
      core_competency_catalog: {
        Row: { id: string; name: string; category: string; description: string | null; company_id: string | null; sort_order: number; created_at: string }
        Insert: { id?: string; name: string; category?: string; description?: string | null; company_id?: string | null; sort_order?: number }
        Update: { name?: string; category?: string; description?: string | null; sort_order?: number }
        Relationships: []
      }
      job_competency_requirements: {
        Row: { id: string; company_id: string; job_title: string; competency_name: string; required_level: number; created_at: string }
        Insert: { id?: string; company_id: string; job_title: string; competency_name: string; required_level?: number }
        Update: { job_title?: string; competency_name?: string; required_level?: number }
        Relationships: []
      }
      course_enrollments: {
        Row: { id: string; course_id: string; employee_id: string; company_id: string; status: string; completion_date: string | null; certificate_url: string | null; score: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; course_id: string; employee_id: string; company_id: string; status?: string; completion_date?: string | null; certificate_url?: string | null; score?: number | null }
        Update: { status?: string; completion_date?: string | null; certificate_url?: string | null; score?: number | null }
        Relationships: []
      }
      passport_share_settings: {
        Row: { id: string; employee_id: string; company_id: string; is_public: boolean; share_token: string | null; share_sections: Record<string, boolean>; expires_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; employee_id: string; company_id: string; is_public?: boolean; share_token?: string | null; share_sections?: Record<string, boolean>; expires_at?: string | null }
        Update: { is_public?: boolean; share_token?: string | null; share_sections?: Record<string, boolean>; expires_at?: string | null }
        Relationships: []
      }
      company_contracts: {
        Row: { id: string; company_id: string; contract_name: string; contract_type: string; signed_date: string | null; start_date: string | null; end_date: string | null; amount: number | null; status: string; file_url: string | null; plan_id: string | null; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; company_id: string; contract_name: string; contract_type?: string; signed_date?: string | null; start_date?: string | null; end_date?: string | null; amount?: number | null; status?: string; file_url?: string | null; plan_id?: string | null; notes?: string | null; created_by?: string | null }
        Update: { contract_name?: string; contract_type?: string; signed_date?: string | null; start_date?: string | null; end_date?: string | null; amount?: number | null; status?: string; file_url?: string | null; plan_id?: string | null; notes?: string | null }
        Relationships: []
      }
      training_plans: {
        Row: { id: string; name: string; is_active: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; is_active?: boolean; created_by?: string | null }
        Update: { name?: string; is_active?: boolean }
        Relationships: []
      }
      company_proposals: {
        Row: { id: string; company_id: string; year: number; proposal_name: string; description: string | null; applied_amount: number | null; approved_amount: number | null; reimbursed_amount: number | null; status: string; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; company_id: string; year: number; proposal_name: string; description?: string | null; applied_amount?: number | null; approved_amount?: number | null; reimbursed_amount?: number | null; status?: string; notes?: string | null; created_by?: string | null }
        Update: { year?: number; proposal_name?: string; description?: string | null; applied_amount?: number | null; approved_amount?: number | null; reimbursed_amount?: number | null; status?: string; notes?: string | null }
        Relationships: []
      }
      company_ttqs_plans: {
        Row: { id: string; company_id: string; year: number; status: string; created_by: string | null; approved_by: string | null; locked_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; company_id: string; year: number; status?: string; created_by?: string | null }
        Update: { status?: string; approved_by?: string | null; locked_at?: string | null }
        Relationships: []
      }
      company_ttqs_indicators: {
        Row: { id: string; plan_id: string; indicator_number: string; guided_answers: Record<string, string>; free_text: string | null; file_urls: string[]; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; plan_id: string; indicator_number: string; guided_answers?: Record<string, string>; free_text?: string | null; file_urls?: string[]; status?: string }
        Update: { guided_answers?: Record<string, string>; free_text?: string | null; file_urls?: string[]; status?: string }
        Relationships: []
      }
      company_ttqs_annotations: {
        Row: { id: string; indicator_id: string; annotator_id: string; content: string; annotation_type: string; created_at: string }
        Insert: { id?: string; indicator_id: string; annotator_id: string; content: string; annotation_type: string }
        Update: { content?: string; annotation_type?: string }
        Relationships: []
      }
      survey_respondents: {
        Row: { id: string; name: string; birthday: string; email: string | null; phone: string | null; line_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; birthday: string; email?: string | null; phone?: string | null; line_id?: string | null }
        Update: { name?: string; birthday?: string; email?: string | null; phone?: string | null; line_id?: string | null }
        Relationships: []
      }
      course_surveys: {
        Row: { id: string; course_id: string; is_active: boolean; custom_questions: unknown[]; created_at: string; updated_at: string }
        Insert: { id?: string; course_id: string; is_active?: boolean; custom_questions?: unknown[] }
        Update: { is_active?: boolean; custom_questions?: unknown[] }
        Relationships: []
      }
      course_survey_responses: {
        Row: { id: string; survey_id: string; respondent_id: string | null; learning_effect_scores: number[]; course_scores: number[]; instructor_scores: number[]; venue_scores: number[]; open_answers: Record<string, string>; future_courses: string[]; submitted_at: string }
        Insert: { id?: string; survey_id: string; respondent_id?: string | null; learning_effect_scores?: number[]; course_scores?: number[]; instructor_scores?: number[]; venue_scores?: number[]; open_answers?: Record<string, string>; future_courses?: string[] }
        Update: {}
        Relationships: []
      }
      course_photos: {
        Row: { id: string; course_id: string; file_url: string; uploaded_by: string | null; created_at: string }
        Insert: { id?: string; course_id: string; file_url: string; uploaded_by?: string | null }
        Update: { file_url?: string }
        Relationships: []
      }
      course_materials: {
        Row: { id: string; course_id: string; material_type: string; file_name: string; file_url: string; file_size: number | null; uploaded_by: string | null; uploaded_at: string }
        Insert: { id?: string; course_id: string; material_type: string; file_name: string; file_url: string; file_size?: number | null; uploaded_by?: string | null }
        Update: { file_name?: string; file_url?: string }
        Relationships: []
      }
      knowledge_base_templates: {
        Row: { id: string; name: string; standard_name: string | null; doc_number_format: string | null; pddro_phase: string; document_type: string; tier: number | null; version: string | null; description: string | null; content: string | null; structured_content: Record<string, unknown> | null; file_url: string | null; auto_replace_rules: { placeholder: string; field: string }[]; review_reminders: { section: string; description: string }[]; ttqs_indicator: string | null; access_level: string; allowed_companies: string[]; is_system: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; standard_name?: string | null; doc_number_format?: string | null; pddro_phase?: string; document_type?: string; tier?: number | null; version?: string | null; description?: string | null; content?: string | null; structured_content?: Record<string, unknown> | null; file_url?: string | null; auto_replace_rules?: unknown[]; review_reminders?: unknown[]; ttqs_indicator?: string | null; access_level?: string; allowed_companies?: string[]; is_system?: boolean; created_by?: string | null }
        Update: { name?: string; standard_name?: string | null; doc_number_format?: string | null; pddro_phase?: string; document_type?: string; tier?: number | null; version?: string | null; description?: string | null; content?: string | null; structured_content?: Record<string, unknown> | null; file_url?: string | null; auto_replace_rules?: unknown[]; review_reminders?: unknown[]; ttqs_indicator?: string | null; access_level?: string; allowed_companies?: string[]; is_system?: boolean }
        Relationships: []
      }
      knowledge_base_usage: {
        Row: { id: string; template_id: string; company_id: string; used_in: string; created_at: string }
        Insert: { id?: string; template_id: string; company_id: string; used_in?: string }
        Update: {}
        Relationships: []
      }
      company_signers: {
        Row: { id: string; company_id: string; signer_role: string; profile_id: string | null; signer_name: string | null; signature_url: string | null; sort_order: number; created_at: string; updated_at: string }
        Insert: { id?: string; company_id: string; signer_role: string; profile_id?: string | null; signer_name?: string | null; signature_url?: string | null; sort_order?: number }
        Update: { signer_role?: string; profile_id?: string | null; signer_name?: string | null; signature_url?: string | null; sort_order?: number }
        Relationships: []
      }
      approval_flows: {
        Row: { id: string; company_id: string; name: string; steps: { order: number; signer_role: string }[]; is_default: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; company_id: string; name: string; steps?: { order: number; signer_role: string }[]; is_default?: boolean }
        Update: { name?: string; steps?: { order: number; signer_role: string }[]; is_default?: boolean }
        Relationships: []
      }
      document_approvals: {
        Row: { id: string; document_id: string | null; meeting_id: string | null; flow_id: string | null; status: string; current_step: number; initiated_by: string | null; initiated_at: string; completed_at: string | null }
        Insert: { id?: string; document_id?: string | null; meeting_id?: string | null; flow_id?: string | null; status?: string; current_step?: number; initiated_by?: string | null }
        Update: { status?: string; current_step?: number; completed_at?: string | null }
        Relationships: []
      }
      document_approval_signatures: {
        Row: { id: string; approval_id: string; step_order: number; signer_role: string; signer_id: string | null; signer_name: string | null; signature_url: string | null; status: string; comment: string | null; signed_at: string | null }
        Insert: { id?: string; approval_id: string; step_order: number; signer_role: string; signer_id?: string | null; signer_name?: string | null; signature_url?: string | null; status?: string; comment?: string | null }
        Update: { signer_id?: string | null; signer_name?: string | null; signature_url?: string | null; status?: string; comment?: string | null; signed_at?: string | null }
        Relationships: []
      }
      quizzes: {
        Row: { id: string; title: string; description: string | null; questions: { id: string; type: string; question: string; options?: string[]; correct_answer: string | string[]; points: number }[]; time_limit: number | null; pass_score: number; is_published: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; description?: string | null; questions?: unknown[]; time_limit?: number | null; pass_score?: number; is_published?: boolean; created_by?: string | null }
        Update: { title?: string; description?: string | null; questions?: unknown[]; time_limit?: number | null; pass_score?: number; is_published?: boolean }
        Relationships: []
      }
      quiz_attempts: {
        Row: { id: string; quiz_id: string; user_id: string; answers: unknown[]; score: number | null; total: number | null; percentage: number | null; passed: boolean; completed_at: string }
        Insert: { id?: string; quiz_id: string; user_id: string; answers?: unknown[]; score?: number | null; total?: number | null; percentage?: number | null; passed?: boolean }
        Update: {}
        Relationships: []
      }
      instructor_extra_hours: {
        Row: { id: string; instructor_id: string; hours: number; reason: string | null; date: string | null; added_by: string | null; created_at: string }
        Insert: { id?: string; instructor_id: string; hours: number; reason?: string | null; date?: string | null; added_by?: string | null }
        Update: { hours?: number; reason?: string | null }
        Relationships: []
      }
      interactions: {
        Row: { id: string; contact_date: string; subject: string; contact_type: string; contact_person: string | null; handler: string | null; content: string | null; target_type: string | null; target_id: string | null; target_name: string | null; next_action: string | null; next_action_date: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; contact_date?: string; subject: string; contact_type?: string; contact_person?: string | null; handler?: string | null; content?: string | null; target_type?: string | null; target_id?: string | null; target_name?: string | null; next_action?: string | null; next_action_date?: string | null; created_by?: string | null }
        Update: { subject?: string; contact_type?: string; content?: string | null; next_action?: string | null; next_action_date?: string | null }
        Relationships: []
      }
      todos: {
        Row: { id: string; title: string; description: string | null; due_date: string | null; status: string; priority: string; type: string; related_type: string | null; related_id: string | null; related_name: string | null; source: string | null; source_id: string | null; assigned_to: string | null; completed_at: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; title: string; due_date?: string | null; status?: string; priority?: string; type?: string; related_type?: string | null; related_name?: string | null; assigned_to?: string | null; created_by?: string | null }
        Update: { title?: string; status?: string; priority?: string; completed_at?: string | null }
        Relationships: []
      }
      admin_checklists: {
        Row: { id: string; course_id: string; items: unknown[]; checked: Record<string, boolean>; updated_by: string | null; updated_at: string }
        Insert: { id?: string; course_id: string; items?: unknown[]; checked?: Record<string, boolean> }
        Update: { items?: unknown[]; checked?: Record<string, boolean> }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; message: string; icon: string; link: string | null; is_read: boolean; created_at: string }
        Insert: { id?: string; user_id: string; message: string; icon?: string; link?: string | null }
        Update: { is_read?: boolean }
        Relationships: []
      }
      products: {
        Row: { id: string; title: string; description: string | null; type: 'course' | 'quiz' | 'ebook'; price: number; status: string; cover_image: string | null; content_type: string | null; content_url: string | null; units: { title: string; youtubeId?: string; description?: string }[]; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; description?: string | null; type: 'course' | 'quiz' | 'ebook'; price?: number; status?: string; cover_image?: string | null; content_type?: string | null; content_url?: string | null; units?: unknown[]; created_by?: string | null }
        Update: { title?: string; description?: string | null; type?: 'course' | 'quiz' | 'ebook'; price?: number; status?: string; cover_image?: string | null; content_type?: string | null; content_url?: string | null; units?: unknown[] }
        Relationships: []
      }
      shop_orders: {
        Row: { id: string; user_id: string; user_name: string | null; product_id: string; product_name: string | null; amount: number; status: string; payment_note: string | null; payment_date: string | null; confirmed_by: string | null; created_at: string }
        Insert: { id?: string; user_id: string; user_name?: string | null; product_id: string; product_name?: string | null; amount?: number; status?: string; payment_note?: string | null }
        Update: { status?: string; payment_note?: string | null; payment_date?: string | null; confirmed_by?: string | null }
        Relationships: []
      }
      user_licenses: {
        Row: { id: string; user_id: string; product_id: string; status: string; purchased_at: string; expires_at: string | null }
        Insert: { id?: string; user_id: string; product_id: string; status?: string; expires_at?: string | null }
        Update: { status?: string; expires_at?: string | null }
        Relationships: []
      }
      quiz_results: {
        Row: { id: string; user_id: string; product_id: string; score: number | null; total: number | null; percentage: number | null; summary: string | null; result_data: Record<string, unknown> | null; completed_at: string }
        Insert: { id?: string; user_id: string; product_id: string; score?: number | null; total?: number | null; percentage?: number | null; summary?: string | null; result_data?: Record<string, unknown> | null }
        Update: {}
        Relationships: []
      }
      analyst_certifications: {
        Row: { id: string; analyst_id: string; level: string; stage: number; requirements_met: Record<string, unknown>; certified_at: string | null; certified_by: string | null; created_at: string }
        Insert: { id?: string; analyst_id: string; level: string; stage?: number; requirements_met?: Record<string, unknown>; certified_at?: string | null; certified_by?: string | null }
        Update: { level?: string; stage?: number; requirements_met?: Record<string, unknown>; certified_at?: string | null }
        Relationships: []
      }
      analyst_cases: {
        Row: { id: string; analyst_id: string; client_id: string | null; client_name: string | null; case_title: string; case_date: string | null; case_type: string; status: string; notes: string | null; file_url: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; analyst_id: string; client_id?: string | null; client_name?: string | null; case_title: string; case_date?: string | null; case_type?: string; status?: string; notes?: string | null; file_url?: string | null }
        Update: { client_name?: string | null; case_title?: string; case_date?: string | null; case_type?: string; status?: string; notes?: string | null; file_url?: string | null }
        Relationships: []
      }
      talent_assessments: {
        Row: { id: string; profile_id: string; drives: { id: number; name: string; description: string; percentage: number; pattern: string }[]; brain_regions: Record<string, unknown>; assessment_date: string | null; assessment_version: string | null; assessment_spending: number; assessor_id: string | null; assessor_name: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; profile_id: string; drives?: unknown[]; brain_regions?: Record<string, unknown>; assessment_date?: string | null; assessment_version?: string | null; assessment_spending?: number; assessor_id?: string | null; assessor_name?: string | null; notes?: string | null }
        Update: { drives?: unknown[]; brain_regions?: Record<string, unknown>; assessment_date?: string | null; assessment_version?: string | null; assessment_spending?: number; notes?: string | null }
        Relationships: []
      }
      course_registrations: {
        Row: { id: string; course_id: string; student_id: string | null; student_name: string | null; student_email: string | null; student_phone: string | null; fee: number; payment_status: 'unpaid' | 'paid' | 'confirmed'; payment_date: string | null; account_last5: string | null; payment_note: string | null; registered_at: string }
        Insert: { id?: string; course_id: string; student_id?: string | null; student_name?: string | null; student_email?: string | null; student_phone?: string | null; fee?: number; payment_status?: 'unpaid' | 'paid' | 'confirmed'; payment_date?: string | null; account_last5?: string | null; payment_note?: string | null }
        Update: { student_name?: string | null; fee?: number; payment_status?: 'unpaid' | 'paid' | 'confirmed'; payment_date?: string | null; account_last5?: string | null; payment_note?: string | null }
        Relationships: []
      }
      course_templates_v2: {
        Row: { id: string; name: string; course_type: string; hours: number | null; description: string | null; default_fee: number | null; outline: unknown[]; target_audience: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; course_type?: string; hours?: number | null; description?: string | null; default_fee?: number | null; outline?: unknown[]; target_audience?: string | null; created_by?: string | null }
        Update: { name?: string; course_type?: string; hours?: number | null; description?: string | null; default_fee?: number | null; outline?: unknown[]; target_audience?: string | null }
        Relationships: []
      }
      course_tracking: {
        Row: { id: string; course_id: string; tracking_date: string; expected_count: number | null; actual_count: number | null; absent_list: { name: string; reason: string }[]; schedule_status: string; equipment_ok: boolean; equipment_note: string | null; engagement_level: string; engagement_note: string | null; has_incident: boolean; incident_desc: string | null; incident_action: string | null; photo_count: number; summary: string | null; recorded_by: string | null; recorded_by_name: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; course_id: string; tracking_date?: string; expected_count?: number | null; actual_count?: number | null; absent_list?: unknown[]; schedule_status?: string; equipment_ok?: boolean; equipment_note?: string | null; engagement_level?: string; engagement_note?: string | null; has_incident?: boolean; incident_desc?: string | null; incident_action?: string | null; photo_count?: number; summary?: string | null; recorded_by?: string | null; recorded_by_name?: string | null }
        Update: { expected_count?: number | null; actual_count?: number | null; absent_list?: unknown[]; schedule_status?: string; equipment_ok?: boolean; equipment_note?: string | null; engagement_level?: string; engagement_note?: string | null; has_incident?: boolean; incident_desc?: string | null; incident_action?: string | null; photo_count?: number; summary?: string | null }
        Relationships: []
      }
      course_notes: {
        Row: { id: string; course_id: string; author_id: string | null; author_name: string | null; note_type: string; content: string; is_internal: boolean; employee_id: string | null; employee_name: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; course_id: string; author_id?: string | null; author_name?: string | null; note_type?: string; content: string; is_internal?: boolean; employee_id?: string | null; employee_name?: string | null }
        Update: { note_type?: string; content?: string; is_internal?: boolean }
        Relationships: []
      }
      pddro_form_field_schemas: {
        Row: { id: string; standard_name: string; version: number; field_schema: Record<string, unknown>; description: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; standard_name: string; version?: number; field_schema?: Record<string, unknown>; description?: string | null }
        Update: { standard_name?: string; version?: number; field_schema?: Record<string, unknown>; description?: string | null }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; user_id: string | null; user_name: string | null; action: string; entity_type: string; entity_id: string | null; details: Record<string, unknown>; ip_address: string | null; created_at: string }
        Insert: { id?: string; user_id?: string | null; user_name?: string | null; action: string; entity_type: string; entity_id?: string | null; details?: Record<string, unknown>; ip_address?: string | null }
        Update: {}
        Relationships: []
      }
      line_message_templates: {
        Row: { id: string; category: 'instructor' | 'student' | 'client'; name: string; content: string; description: string | null; variables: string[]; is_default: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; category: 'instructor' | 'student' | 'client'; name: string; content: string; description?: string | null; variables?: string[]; is_default?: boolean; created_by?: string | null }
        Update: { name?: string; content?: string; description?: string | null; variables?: string[]; is_default?: boolean }
        Relationships: []
      }
      line_send_logs: {
        Row: { id: string; template_id: string | null; category: string; recipient_type: string; recipient_name: string | null; recipient_count: number; failed_count: number; message_content: string; context_type: string | null; context_id: string | null; sent_by: string | null; sent_by_name: string | null; created_at: string }
        Insert: { id?: string; template_id?: string | null; category: string; recipient_type: string; recipient_name?: string | null; recipient_count?: number; failed_count?: number; message_content: string; context_type?: string | null; context_id?: string | null; sent_by?: string | null; sent_by_name?: string | null }
        Update: {}
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 方便使用的型別別名
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingActionItem = Database['public']['Tables']['meeting_action_items']['Row']
export type CourseForm = Database['public']['Tables']['course_forms']['Row']
export type CompanyFormTemplate = Database['public']['Tables']['company_form_templates']['Row']
export type DocumentTemplate = Database['public']['Tables']['document_templates']['Row']
export type CompanyDocument = Database['public']['Tables']['company_documents']['Row']
export type CompanyDocumentVersion = Database['public']['Tables']['company_document_versions']['Row']
export type CompanyDocumentReview = Database['public']['Tables']['company_document_reviews']['Row']
export type LineMessageTemplate = Database['public']['Tables']['line_message_templates']['Row']
export type LineSendLog = Database['public']['Tables']['line_send_logs']['Row']

// 職能表單型別
export type CompetencyFormType = 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
export type FormFieldType = 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date' | 'repeating_group' | 'table'
