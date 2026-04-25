export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_checklists: {
        Row: {
          checked: Json | null
          course_id: string
          id: string
          items: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          checked?: Json | null
          course_id: string
          id?: string
          items?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          checked?: Json | null
          course_id?: string
          id?: string
          items?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_checklists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_checklists_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_cases: {
        Row: {
          analyst_id: string
          case_date: string | null
          case_title: string
          case_type: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          file_url: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          analyst_id: string
          case_date?: string | null
          case_title: string
          case_type?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          analyst_id?: string
          case_date?: string | null
          case_title?: string
          case_type?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_cases_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyst_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_certifications: {
        Row: {
          analyst_id: string
          certified_at: string | null
          certified_by: string | null
          created_at: string
          id: string
          level: string
          requirements_met: Json | null
          stage: number
        }
        Insert: {
          analyst_id: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          id?: string
          level: string
          requirements_met?: Json | null
          stage?: number
        }
        Update: {
          analyst_id?: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          id?: string
          level?: string
          requirements_met?: Json | null
          stage?: number
        }
        Relationships: [
          {
            foreignKeyName: "analyst_certifications_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyst_certifications_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_flows: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          annual_settings: Json | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          doc_code: string | null
          id: string
          industry: string | null
          name: string
          name_en: string | null
          status: Database["public"]["Enums"]["company_status"]
          tax_id: string | null
          ttqs_expiry_date: string | null
          ttqs_level: Database["public"]["Enums"]["ttqs_level"] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          annual_settings?: Json | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          doc_code?: string | null
          id?: string
          industry?: string | null
          name: string
          name_en?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          tax_id?: string | null
          ttqs_expiry_date?: string | null
          ttqs_level?: Database["public"]["Enums"]["ttqs_level"] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          annual_settings?: Json | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          doc_code?: string | null
          id?: string
          industry?: string | null
          name?: string
          name_en?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          tax_id?: string | null
          ttqs_expiry_date?: string | null
          ttqs_level?: Database["public"]["Enums"]["ttqs_level"] | null
          updated_at?: string
        }
        Relationships: []
      }
      company_contracts: {
        Row: {
          amount: number | null
          company_id: string
          contract_name: string
          contract_type: string
          created_at: string
          created_by: string | null
          end_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          plan_id: string | null
          signed_date: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          company_id: string
          contract_name: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          signed_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          company_id?: string
          contract_name?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          signed_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_document_reviews: {
        Row: {
          comment: string | null
          document_id: string
          id: string
          reviewed_at: string
          reviewer_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          document_id: string
          id?: string
          reviewed_at?: string
          reviewer_id: string
          status: string
        }
        Update: {
          comment?: string | null
          document_id?: string
          id?: string
          reviewed_at?: string
          reviewer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_document_versions: {
        Row: {
          change_note: string | null
          changed_at: string
          changed_by: string | null
          document_id: string
          file_url: string | null
          id: string
          version: string
        }
        Insert: {
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          document_id: string
          file_url?: string | null
          id?: string
          version: string
        }
        Update: {
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          document_id?: string
          file_url?: string | null
          id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_document_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          approval_id: string | null
          auto_generated_from: string | null
          company_id: string
          created_at: string
          created_by: string | null
          doc_number: string | null
          file_url: string | null
          filled_content: Json | null
          id: string
          linked_to_course_form: boolean
          notes: string | null
          pddro_phase: Database["public"]["Enums"]["pddro_phase"] | null
          source: string
          status: string
          template_id: string | null
          tier: number
          title: string
          ttqs_indicator: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          approval_id?: string | null
          auto_generated_from?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          file_url?: string | null
          filled_content?: Json | null
          id?: string
          linked_to_course_form?: boolean
          notes?: string | null
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"] | null
          source?: string
          status?: string
          template_id?: string | null
          tier: number
          title: string
          ttqs_indicator?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          approval_id?: string | null
          auto_generated_from?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          file_url?: string | null
          filled_content?: Json | null
          id?: string
          linked_to_course_form?: boolean
          notes?: string | null
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"] | null
          source?: string
          status?: string
          template_id?: string | null
          tier?: number
          title?: string
          ttqs_indicator?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "document_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_form_templates: {
        Row: {
          company_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          field_schema: Json | null
          form_type: string
          id: string
          is_confirmed: boolean
          name: string
          needs_customization: boolean
          pddro_phase: Database["public"]["Enums"]["pddro_phase"]
          sort_order: number
          standard_name: string | null
          ttqs_indicator: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          field_schema?: Json | null
          form_type: string
          id?: string
          is_confirmed?: boolean
          name: string
          needs_customization?: boolean
          pddro_phase: Database["public"]["Enums"]["pddro_phase"]
          sort_order?: number
          standard_name?: string | null
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          field_schema?: Json | null
          form_type?: string
          id?: string
          is_confirmed?: boolean
          name?: string
          needs_customization?: boolean
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"]
          sort_order?: number
          standard_name?: string | null
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_form_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_form_templates_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_proposals: {
        Row: {
          applied_amount: number | null
          approved_amount: number | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          proposal_name: string
          reimbursed_amount: number | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          applied_amount?: number | null
          approved_amount?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          proposal_name: string
          reimbursed_amount?: number | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          applied_amount?: number | null
          approved_amount?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          proposal_name?: string
          reimbursed_amount?: number | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_signers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          profile_id: string | null
          signature_url: string | null
          signer_name: string | null
          signer_role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          profile_id?: string | null
          signature_url?: string | null
          signer_name?: string | null
          signer_role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          signature_url?: string | null
          signer_name?: string | null
          signer_role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_signers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_signers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ttqs_annotations: {
        Row: {
          annotation_type: string
          annotator_id: string
          content: string
          created_at: string
          id: string
          indicator_id: string
        }
        Insert: {
          annotation_type: string
          annotator_id: string
          content: string
          created_at?: string
          id?: string
          indicator_id: string
        }
        Update: {
          annotation_type?: string
          annotator_id?: string
          content?: string
          created_at?: string
          id?: string
          indicator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ttqs_annotations_annotator_id_fkey"
            columns: ["annotator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ttqs_annotations_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "company_ttqs_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ttqs_indicators: {
        Row: {
          created_at: string
          file_urls: Json
          free_text: string | null
          guided_answers: Json
          id: string
          indicator_number: string
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_urls?: Json
          free_text?: string | null
          guided_answers?: Json
          id?: string
          indicator_number: string
          plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_urls?: Json
          free_text?: string | null
          guided_answers?: Json
          id?: string
          indicator_number?: string
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ttqs_indicators_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "company_ttqs_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ttqs_plans: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          locked_at: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_ttqs_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ttqs_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ttqs_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_form_defaults: {
        Row: {
          created_at: string
          description: string | null
          field_name: string
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id: string
          is_required: boolean
          options: Json | null
          sort_order: number
          standard_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_name: string
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          is_required?: boolean
          options?: Json | null
          sort_order?: number
          standard_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_name?: string
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_type?: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          is_required?: boolean
          options?: Json | null
          sort_order?: number
          standard_name?: string
        }
        Relationships: []
      }
      competency_form_entries: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          form_type?: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_form_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_form_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_form_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_form_entry_values: {
        Row: {
          created_at: string
          entry_id: string
          field_name: string
          id: string
          template_field_id: string | null
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          entry_id: string
          field_name: string
          id?: string
          template_field_id?: string | null
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          entry_id?: string
          field_name?: string
          id?: string
          template_field_id?: string | null
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_form_entry_values_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "competency_form_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_form_entry_values_template_field_id_fkey"
            columns: ["template_field_id"]
            isOneToOne: false
            referencedRelation: "competency_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_form_reviews: {
        Row: {
          action: string
          comment: string
          created_at: string
          entry_id: string
          id: string
          reviewer_id: string
        }
        Insert: {
          action: string
          comment?: string
          created_at?: string
          entry_id: string
          id?: string
          reviewer_id: string
        }
        Update: {
          action?: string
          comment?: string
          created_at?: string
          entry_id?: string
          id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competency_form_reviews_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "competency_form_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_form_templates: {
        Row: {
          company_id: string
          created_at: string
          default_field_id: string | null
          display_name: string | null
          field_name: string
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id: string
          is_required: boolean
          options: Json | null
          sort_order: number
          standard_name: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_field_id?: string | null
          display_name?: string | null
          field_name: string
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_type: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          is_required?: boolean
          options?: Json | null
          sort_order?: number
          standard_name?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_field_id?: string | null
          display_name?: string | null
          field_name?: string
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_type?: Database["public"]["Enums"]["competency_form_type"]
          id?: string
          is_required?: boolean
          options?: Json | null
          sort_order?: number
          standard_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competency_form_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_form_templates_default_field_id_fkey"
            columns: ["default_field_id"]
            isOneToOne: false
            referencedRelation: "competency_form_defaults"
            referencedColumns: ["id"]
          },
        ]
      }
      core_competency_catalog: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "core_competency_catalog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_url: string | null
          company_id: string
          completion_date: string | null
          course_id: string
          created_at: string
          employee_id: string
          id: string
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          company_id: string
          completion_date?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          company_id?: string
          completion_date?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_forms: {
        Row: {
          course_id: string
          created_at: string
          field_schema: Json | null
          file_url: string | null
          form_data: Json | null
          form_type: string
          id: string
          name: string
          notes: string | null
          pddro_phase: Database["public"]["Enums"]["pddro_phase"]
          sort_order: number
          standard_name: string | null
          status: string
          template_id: string | null
          ttqs_indicator: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          field_schema?: Json | null
          file_url?: string | null
          form_data?: Json | null
          form_type: string
          id?: string
          name: string
          notes?: string | null
          pddro_phase: Database["public"]["Enums"]["pddro_phase"]
          sort_order?: number
          standard_name?: string | null
          status?: string
          template_id?: string | null
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          field_schema?: Json | null
          file_url?: string | null
          form_data?: Json | null
          form_type?: string
          id?: string
          name?: string
          notes?: string | null
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"]
          sort_order?: number
          standard_name?: string | null
          status?: string
          template_id?: string | null
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_forms_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "company_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          material_type: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          material_type: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          material_type?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          course_id: string
          created_at: string
          employee_id: string | null
          employee_name: string | null
          id: string
          is_internal: boolean
          note_type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          course_id: string
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          is_internal?: boolean
          note_type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          course_id?: string
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          is_internal?: boolean
          note_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_photos: {
        Row: {
          course_id: string
          created_at: string
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_photos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          account_last5: string | null
          course_id: string
          fee: number | null
          id: string
          payment_date: string | null
          payment_note: string | null
          payment_status: string | null
          registered_at: string
          student_email: string | null
          student_id: string | null
          student_name: string | null
          student_phone: string | null
        }
        Insert: {
          account_last5?: string | null
          course_id: string
          fee?: number | null
          id?: string
          payment_date?: string | null
          payment_note?: string | null
          payment_status?: string | null
          registered_at?: string
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          student_phone?: string | null
        }
        Update: {
          account_last5?: string | null
          course_id?: string
          fee?: number | null
          id?: string
          payment_date?: string | null
          payment_note?: string | null
          payment_status?: string | null
          registered_at?: string
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          student_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_survey_responses: {
        Row: {
          course_scores: Json
          future_courses: Json
          id: string
          instructor_scores: Json
          learning_effect_scores: Json
          open_answers: Json
          respondent_id: string | null
          submitted_at: string
          survey_id: string
          venue_scores: Json
        }
        Insert: {
          course_scores?: Json
          future_courses?: Json
          id?: string
          instructor_scores?: Json
          learning_effect_scores?: Json
          open_answers?: Json
          respondent_id?: string | null
          submitted_at?: string
          survey_id: string
          venue_scores?: Json
        }
        Update: {
          course_scores?: Json
          future_courses?: Json
          id?: string
          instructor_scores?: Json
          learning_effect_scores?: Json
          open_answers?: Json
          respondent_id?: string | null
          submitted_at?: string
          survey_id?: string
          venue_scores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "course_survey_responses_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "survey_respondents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "course_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      course_surveys: {
        Row: {
          course_id: string
          created_at: string
          custom_questions: Json
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          custom_questions?: Json
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          custom_questions?: Json
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_surveys_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_templates_v2: {
        Row: {
          course_type: string | null
          created_at: string
          created_by: string | null
          default_fee: number | null
          description: string | null
          hours: number | null
          id: string
          name: string
          outline: Json | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          course_type?: string | null
          created_at?: string
          created_by?: string | null
          default_fee?: number | null
          description?: string | null
          hours?: number | null
          id?: string
          name: string
          outline?: Json | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          course_type?: string | null
          created_at?: string
          created_by?: string | null
          default_fee?: number | null
          description?: string | null
          hours?: number | null
          id?: string
          name?: string
          outline?: Json | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_templates_v2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tracking: {
        Row: {
          absent_list: Json | null
          actual_count: number | null
          course_id: string
          created_at: string
          engagement_level: string | null
          engagement_note: string | null
          equipment_note: string | null
          equipment_ok: boolean | null
          expected_count: number | null
          has_incident: boolean | null
          id: string
          incident_action: string | null
          incident_desc: string | null
          photo_count: number | null
          recorded_by: string | null
          recorded_by_name: string | null
          schedule_status: string | null
          summary: string | null
          tracking_date: string
          updated_at: string
        }
        Insert: {
          absent_list?: Json | null
          actual_count?: number | null
          course_id: string
          created_at?: string
          engagement_level?: string | null
          engagement_note?: string | null
          equipment_note?: string | null
          equipment_ok?: boolean | null
          expected_count?: number | null
          has_incident?: boolean | null
          id?: string
          incident_action?: string | null
          incident_desc?: string | null
          photo_count?: number | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          schedule_status?: string | null
          summary?: string | null
          tracking_date?: string
          updated_at?: string
        }
        Update: {
          absent_list?: Json | null
          actual_count?: number | null
          course_id?: string
          created_at?: string
          engagement_level?: string | null
          engagement_note?: string | null
          equipment_note?: string | null
          equipment_ok?: boolean | null
          expected_count?: number | null
          has_incident?: boolean | null
          id?: string
          incident_action?: string | null
          incident_desc?: string | null
          photo_count?: number | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          schedule_status?: string | null
          summary?: string | null
          tracking_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tracking_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tracking_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          budget: number | null
          company_id: string | null
          course_type: string | null
          created_at: string
          created_by: string
          default_fee: number | null
          description: string | null
          end_date: string | null
          hours: number | null
          id: string
          is_counted_in_hours: boolean | null
          material_submit_date: string | null
          reject_reason: string | null
          review_status: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["course_status"]
          teaching_log_submit_date: string | null
          title: string
          total_revenue: number | null
          trainer: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id?: string | null
          course_type?: string | null
          created_at?: string
          created_by: string
          default_fee?: number | null
          description?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string
          is_counted_in_hours?: boolean | null
          material_submit_date?: string | null
          reject_reason?: string | null
          review_status?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          teaching_log_submit_date?: string | null
          title: string
          total_revenue?: number | null
          trainer?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string | null
          course_type?: string | null
          created_at?: string
          created_by?: string
          default_fee?: number | null
          description?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string
          is_counted_in_hours?: boolean | null
          material_submit_date?: string | null
          reject_reason?: string | null
          review_status?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          teaching_log_submit_date?: string | null
          title?: string
          total_revenue?: number | null
          trainer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approval_signatures: {
        Row: {
          approval_id: string
          comment: string | null
          id: string
          signature_url: string | null
          signed_at: string | null
          signer_id: string | null
          signer_name: string | null
          signer_role: string
          status: string
          step_order: number
        }
        Insert: {
          approval_id: string
          comment?: string | null
          id?: string
          signature_url?: string | null
          signed_at?: string | null
          signer_id?: string | null
          signer_name?: string | null
          signer_role: string
          status?: string
          step_order: number
        }
        Update: {
          approval_id?: string
          comment?: string | null
          id?: string
          signature_url?: string | null
          signed_at?: string | null
          signer_id?: string | null
          signer_name?: string | null
          signer_role?: string
          status?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_approval_signatures_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "document_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approval_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approvals: {
        Row: {
          completed_at: string | null
          current_step: number
          document_id: string | null
          flow_id: string | null
          id: string
          initiated_at: string
          initiated_by: string | null
          meeting_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          document_id?: string | null
          flow_id?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          meeting_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          document_id?: string | null
          flow_id?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          meeting_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "approval_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          auto_generated_from: string | null
          created_at: string
          description: string | null
          id: string
          linked_to_course_form: boolean
          pddro_phase: Database["public"]["Enums"]["pddro_phase"] | null
          sort_order: number
          tier: number
          title: string
          ttqs_indicator: string | null
          updated_at: string
        }
        Insert: {
          auto_generated_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          linked_to_course_form?: boolean
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"] | null
          sort_order?: number
          tier: number
          title: string
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Update: {
          auto_generated_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          linked_to_course_form?: boolean
          pddro_phase?: Database["public"]["Enums"]["pddro_phase"] | null
          sort_order?: number
          tier?: number
          title?: string
          ttqs_indicator?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_extra_hours: {
        Row: {
          added_by: string | null
          created_at: string
          date: string | null
          hours: number
          id: string
          instructor_id: string
          reason: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          date?: string | null
          hours: number
          id?: string
          instructor_id: string
          reason?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          date?: string | null
          hours?: number
          id?: string
          instructor_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_extra_hours_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_extra_hours_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          contact_date: string
          contact_person: string | null
          contact_type: string | null
          content: string | null
          created_at: string
          created_by: string | null
          handler: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          subject: string
          target_id: string | null
          target_name: string | null
          target_type: string | null
          updated_at: string
        }
        Insert: {
          contact_date?: string
          contact_person?: string | null
          contact_type?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          handler?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          subject: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Update: {
          contact_date?: string
          contact_person?: string | null
          contact_type?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          handler?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          subject?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_competency_requirements: {
        Row: {
          company_id: string
          competency_name: string
          created_at: string
          id: string
          job_title: string
          required_level: number
        }
        Insert: {
          company_id: string
          competency_name: string
          created_at?: string
          id?: string
          job_title: string
          required_level?: number
        }
        Update: {
          company_id?: string
          competency_name?: string
          created_at?: string
          id?: string
          job_title?: string
          required_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_competency_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_templates: {
        Row: {
          access_level: string
          allowed_companies: Json
          auto_replace_rules: Json
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          doc_number_format: string | null
          document_type: string
          file_url: string | null
          id: string
          is_system: boolean
          name: string
          pddro_phase: string
          review_reminders: Json
          standard_name: string | null
          structured_content: Json | null
          tier: number | null
          ttqs_indicator: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          access_level?: string
          allowed_companies?: Json
          auto_replace_rules?: Json
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doc_number_format?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_system?: boolean
          name: string
          pddro_phase?: string
          review_reminders?: Json
          standard_name?: string | null
          structured_content?: Json | null
          tier?: number | null
          ttqs_indicator?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          access_level?: string
          allowed_companies?: Json
          auto_replace_rules?: Json
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doc_number_format?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_system?: boolean
          name?: string
          pddro_phase?: string
          review_reminders?: Json
          standard_name?: string | null
          structured_content?: Json | null
          tier?: number | null
          ttqs_indicator?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_usage: {
        Row: {
          company_id: string
          created_at: string
          id: string
          template_id: string
          used_in: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          template_id: string
          used_in?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          template_id?: string
          used_in?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      line_message_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      line_notifications: {
        Row: {
          course_id: string | null
          failed_count: number
          id: string
          message: string
          recipient_count: number
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          course_id?: string | null
          failed_count?: number
          id?: string
          message: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          course_id?: string | null
          failed_count?: number
          id?: string
          message?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      line_send_logs: {
        Row: {
          category: string
          context_id: string | null
          context_type: string | null
          created_at: string | null
          failed_count: number | null
          id: string
          message_content: string
          recipient_count: number | null
          recipient_name: string | null
          recipient_type: string
          sent_by: string | null
          sent_by_name: string | null
          template_id: string | null
        }
        Insert: {
          category: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          message_content: string
          recipient_count?: number | null
          recipient_name?: string | null
          recipient_type: string
          sent_by?: string | null
          sent_by_name?: string | null
          template_id?: string | null
        }
        Update: {
          category?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          message_content?: string
          recipient_count?: number | null
          recipient_name?: string | null
          recipient_type?: string
          sent_by?: string | null
          sent_by_name?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_send_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "line_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          content: string
          created_at: string
          due_date: string | null
          id: string
          is_added_to_todo: boolean
          is_completed: boolean
          meeting_id: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          content: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_added_to_todo?: boolean
          is_completed?: boolean
          meeting_id: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_added_to_todo?: boolean
          is_completed?: boolean
          meeting_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          approval_id: string | null
          attendees_company: string | null
          attendees_consultant: Json
          company_id: string
          created_at: string
          created_by: string | null
          discussion_points: string | null
          id: string
          meeting_date: string
          meeting_time: string | null
          meeting_type: string
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          attendees_company?: string | null
          attendees_consultant?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          discussion_points?: string | null
          id?: string
          meeting_date: string
          meeting_time?: string | null
          meeting_type?: string
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          attendees_company?: string | null
          attendees_consultant?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          discussion_points?: string | null
          id?: string
          meeting_date?: string
          meeting_time?: string | null
          meeting_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "document_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passport_share_settings: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          expires_at: string | null
          id: string
          is_public: boolean
          share_sections: Json
          share_token: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          share_sections?: Json
          share_token?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          share_sections?: Json
          share_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passport_share_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_share_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pddro_form_field_schemas: {
        Row: {
          created_at: string
          description: string | null
          field_schema: Json
          id: string
          standard_name: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          id?: string
          standard_name: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          id?: string
          standard_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          content_type: string | null
          content_url: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          price: number
          status: string | null
          title: string
          type: string
          units: Json | null
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          content_url?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price?: number
          status?: string | null
          title: string
          type: string
          units?: Json | null
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          content_url?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price?: number
          status?: string | null
          title?: string
          type?: string
          units?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accumulated_hours: number | null
          analyst_level: string | null
          annual_hours: number | null
          articles_count: number | null
          average_satisfaction: number | null
          birthday: string | null
          company_id: string | null
          created_at: string
          customer_level: string | null
          customer_tags: string[] | null
          department_id: string | null
          email: string
          full_name: string | null
          gender: string | null
          hire_date: string | null
          id: string
          instructor_level: string | null
          internship_reports_reviewed: number | null
          is_personal_client: boolean | null
          job_title: string | null
          l2_pattern: string | null
          line_user_id: string | null
          phone: string | null
          promotion_applied_at: string | null
          promotion_history: Json | null
          promotion_status: string | null
          promotion_target_level: string | null
          r1_pattern: string | null
          recommendations_count: number | null
          refresh_training_count: number | null
          role: Database["public"]["Enums"]["user_role"]
          roles: string[] | null
          scheduled_assessment_date: string | null
          signature_url: string | null
          total_spending: number | null
          updated_at: string
        }
        Insert: {
          accumulated_hours?: number | null
          analyst_level?: string | null
          annual_hours?: number | null
          articles_count?: number | null
          average_satisfaction?: number | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          customer_level?: string | null
          customer_tags?: string[] | null
          department_id?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id: string
          instructor_level?: string | null
          internship_reports_reviewed?: number | null
          is_personal_client?: boolean | null
          job_title?: string | null
          l2_pattern?: string | null
          line_user_id?: string | null
          phone?: string | null
          promotion_applied_at?: string | null
          promotion_history?: Json | null
          promotion_status?: string | null
          promotion_target_level?: string | null
          r1_pattern?: string | null
          recommendations_count?: number | null
          refresh_training_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[] | null
          scheduled_assessment_date?: string | null
          signature_url?: string | null
          total_spending?: number | null
          updated_at?: string
        }
        Update: {
          accumulated_hours?: number | null
          analyst_level?: string | null
          annual_hours?: number | null
          articles_count?: number | null
          average_satisfaction?: number | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          customer_level?: string | null
          customer_tags?: string[] | null
          department_id?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          instructor_level?: string | null
          internship_reports_reviewed?: number | null
          is_personal_client?: boolean | null
          job_title?: string | null
          l2_pattern?: string | null
          line_user_id?: string | null
          phone?: string | null
          promotion_applied_at?: string | null
          promotion_history?: Json | null
          promotion_status?: string | null
          promotion_target_level?: string | null
          r1_pattern?: string | null
          recommendations_count?: number | null
          refresh_training_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[] | null
          scheduled_assessment_date?: string | null
          signature_url?: string | null
          total_spending?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          passed: boolean | null
          percentage: number | null
          quiz_id: string
          score: number | null
          total: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id: string
          score?: number | null
          total?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          completed_at: string
          id: string
          percentage: number | null
          product_id: string
          result_data: Json | null
          score: number | null
          summary: string | null
          total: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          percentage?: number | null
          product_id: string
          result_data?: Json | null
          score?: number | null
          summary?: string | null
          total?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          percentage?: number | null
          product_id?: string
          result_data?: Json | null
          score?: number | null
          summary?: string | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          pass_score: number | null
          questions: Json
          time_limit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          pass_score?: number | null
          questions?: Json
          time_limit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          pass_score?: number | null
          questions?: Json
          time_limit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          amount: number
          confirmed_by: string | null
          created_at: string
          id: string
          payment_date: string | null
          payment_note: string | null
          product_id: string
          product_name: string | null
          status: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number
          confirmed_by?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_note?: string | null
          product_id: string
          product_name?: string | null
          status?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          confirmed_by?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_note?: string | null
          product_id?: string
          product_name?: string | null
          status?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_respondents: {
        Row: {
          birthday: string
          created_at: string
          email: string | null
          id: string
          line_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          birthday: string
          created_at?: string
          email?: string | null
          id?: string
          line_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birthday?: string
          created_at?: string
          email?: string | null
          id?: string
          line_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      talent_assessments: {
        Row: {
          assessment_date: string | null
          assessment_spending: number | null
          assessment_version: string | null
          assessor_id: string | null
          assessor_name: string | null
          brain_regions: Json | null
          created_at: string
          drives: Json
          id: string
          notes: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          assessment_date?: string | null
          assessment_spending?: number | null
          assessment_version?: string | null
          assessor_id?: string | null
          assessor_name?: string | null
          brain_regions?: Json | null
          created_at?: string
          drives?: Json
          id?: string
          notes?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string | null
          assessment_spending?: number | null
          assessment_version?: string | null
          assessor_id?: string | null
          assessor_name?: string | null
          brain_regions?: Json | null
          created_at?: string
          drives?: Json
          id?: string
          notes?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_id: string | null
          related_name: string | null
          related_type: string | null
          source: string | null
          source_id: string | null
          status: string | null
          title: string
          type: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_id?: string | null
          related_name?: string | null
          related_type?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          title: string
          type?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_id?: string | null
          related_name?: string | null
          related_type?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_licenses: {
        Row: {
          expires_at: string | null
          id: string
          product_id: string
          purchased_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          product_id: string
          purchased_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          product_id?: string
          purchased_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_consultant: { Args: never; Returns: boolean }
    }
    Enums: {
      company_status: "active" | "inactive" | "pending"
      competency_form_type:
        | "job_analysis"
        | "job_description"
        | "competency_standard"
        | "competency_assessment"
      course_status:
        | "draft"
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
      form_field_type:
        | "text"
        | "textarea"
        | "select"
        | "rating"
        | "checkbox"
        | "number"
        | "date"
        | "repeating_group"
        | "table"
      pddro_phase: "P" | "D" | "DO" | "R" | "O"
      ttqs_level: "bronze" | "silver" | "gold"
      user_role:
        | "consultant"
        | "hr"
        | "manager"
        | "employee"
        | "admin"
        | "instructor"
        | "supervisor"
        | "analyst"
        | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      company_status: ["active", "inactive", "pending"],
      competency_form_type: [
        "job_analysis",
        "job_description",
        "competency_standard",
        "competency_assessment",
      ],
      course_status: [
        "draft",
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      form_field_type: [
        "text",
        "textarea",
        "select",
        "rating",
        "checkbox",
        "number",
        "date",
        "repeating_group",
        "table",
      ],
      pddro_phase: ["P", "D", "DO", "R", "O"],
      ttqs_level: ["bronze", "silver", "gold"],
      user_role: [
        "consultant",
        "hr",
        "manager",
        "employee",
        "admin",
        "instructor",
        "supervisor",
        "analyst",
        "student",
      ],
    },
  },
} as const
