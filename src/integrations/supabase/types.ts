// integrations/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type IssueCategory = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  created_at: string;
};

export type IssueReport = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  address?: string | null;
  evidence_urls?: string[] | null;
  latitude: number;
  longitude: number;
  is_anonymous?: boolean | null;
  priority?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Profile = {
  id: string;
  user_id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      issue_categories: {
        Row: IssueCategory;
        Insert: Partial<IssueCategory> & { name: string };
        Update: Partial<IssueCategory>;
      };
      issue_reports: {
        Row: IssueReport;
        Insert: Partial<IssueReport> & {
          title: string;
          description: string;
          category_id: string;
          latitude: number;
          longitude: number;
          user_id: string;
        };
        Update: Partial<IssueReport>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { user_id: string };
        Update: Partial<Profile>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}