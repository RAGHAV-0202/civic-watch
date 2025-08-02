// export type Json =
//   | string
//   | number
//   | boolean
//   | null
//   | { [key: string]: Json | undefined }
//   | Json[]

// export type Database = {
//   // Allows to automatically instanciate createClient with right options
//   // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
//   __InternalSupabase: {
//     PostgrestVersion: "12.2.12 (cd3cf9e)"
//   }
//   public: {
//     Tables: {
//       crime_categories: {
//         Row: {
//           color: string | null
//           created_at: string
//           description: string | null
//           id: string
//           name: string
//         }
//         Insert: {
//           color?: string | null
//           created_at?: string
//           description?: string | null
//           id?: string
//           name: string
//         }
//         Update: {
//           color?: string | null
//           created_at?: string
//           description?: string | null
//           id?: string
//           name?: string
//         }
//         Relationships: []
//       }
//       crime_reports: {
//         Row: {
//           address: string | null
//           category_id: string
//           created_at: string
//           description: string
//           evidence_urls: string[] | null
//           id: string
//           is_anonymous: boolean | null
//           latitude: number
//           longitude: number
//           priority: string | null
//           status: string | null
//           title: string
//           updated_at: string
//           user_id: string
//         }
//         Insert: {
//           address?: string | null
//           category_id: string
//           created_at?: string
//           description: string
//           evidence_urls?: string[] | null
//           id?: string
//           is_anonymous?: boolean | null
//           latitude: number
//           longitude: number
//           priority?: string | null
//           status?: string | null
//           title: string
//           updated_at?: string
//           user_id: string
//         }
//         Update: {
//           address?: string | null
//           category_id?: string
//           created_at?: string
//           description?: string
//           evidence_urls?: string[] | null
//           id?: string
//           is_anonymous?: boolean | null
//           latitude?: number
//           longitude?: number
//           priority?: string | null
//           status?: string | null
//           title?: string
//           updated_at?: string
//           user_id?: string
//         }
//         Relationships: [
//           {
//             foreignKeyName: "crime_reports_category_id_fkey"
//             columns: ["category_id"]
//             isOneToOne: false
//             referencedRelation: "crime_categories"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       profiles: {
//         Row: {
//           created_at: string
//           full_name: string | null
//           id: string
//           phone: string | null
//           role: string | null
//           updated_at: string
//           user_id: string
//         }
//         Insert: {
//           created_at?: string
//           full_name?: string | null
//           id?: string
//           phone?: string | null
//           role?: string | null
//           updated_at?: string
//           user_id: string
//         }
//         Update: {
//           created_at?: string
//           full_name?: string | null
//           id?: string
//           phone?: string | null
//           role?: string | null
//           updated_at?: string
//           user_id?: string
//         }
//         Relationships: []
//       }
//     }
//     Views: {
//       [_ in never]: never
//     }
//     Functions: {
//       [_ in never]: never
//     }
//     Enums: {
//       [_ in never]: never
//     }
//     CompositeTypes: {
//       [_ in never]: never
//     }
//   }
// }

// type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

// type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

// export type Tables<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
//         DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
//       DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
//       Row: infer R
//     }
//     ? R
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
//         DefaultSchema["Views"])
//     ? (DefaultSchema["Tables"] &
//         DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
//         Row: infer R
//       }
//       ? R
//       : never
//     : never

// export type TablesInsert<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof DefaultSchema["Tables"]
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
//       Insert: infer I
//     }
//     ? I
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
//     ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
//         Insert: infer I
//       }
//       ? I
//       : never
//     : never

// export type TablesUpdate<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof DefaultSchema["Tables"]
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
//       Update: infer U
//     }
//     ? U
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
//     ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
//         Update: infer U
//       }
//       ? U
//       : never
//     : never

// export type Enums<
//   DefaultSchemaEnumNameOrOptions extends
//     | keyof DefaultSchema["Enums"]
//     | { schema: keyof DatabaseWithoutInternals },
//   EnumName extends DefaultSchemaEnumNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
//     : never = never,
// > = DefaultSchemaEnumNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
//   : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
//     ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
//     : never

// export type CompositeTypes<
//   PublicCompositeTypeNameOrOptions extends
//     | keyof DefaultSchema["CompositeTypes"]
//     | { schema: keyof DatabaseWithoutInternals },
//   CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
//     : never = never,
// > = PublicCompositeTypeNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
//   : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
//     ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
//     : never

// export const Constants = {
//   public: {
//     Enums: {},
//   },
// } as const


// integrations/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type CrimeCategory = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  created_at: string;
};

export type CrimeReport = {
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

// define a Database type for Supabase

export interface Database {
  public: {
    Tables: {
      crime_categories: {
        Row: CrimeCategory;
        Insert: Partial<CrimeCategory> & { name: string };
        Update: Partial<CrimeCategory>;
      };
      crime_reports: {
        Row: CrimeReport;
        Insert: Partial<CrimeReport> & {
          title: string;
          description: string;
          category_id: string;
          latitude: number;
          longitude: number;
          user_id: string;
        };
        Update: Partial<CrimeReport>;
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
