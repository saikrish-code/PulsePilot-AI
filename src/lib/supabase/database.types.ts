export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brand_profiles: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          industry: string;
          description: string;
          audience: string;
          voice_traits: string[];
          banned_phrases: string[];
          goals: Json;
          platforms: string[];
          website: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          industry: string;
          description: string;
          audience: string;
          voice_traits: string[];
          banned_phrases: string[];
          goals: Json;
          platforms: string[];
          website?: string | null;
          timezone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          industry?: string;
          description?: string;
          audience?: string;
          voice_traits?: string[];
          banned_phrases?: string[];
          goals?: Json;
          platforms?: string[];
          website?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_profiles_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          brand_profile_id: string;
          title: string;
          objective: string;
          audience: string;
          offer: string | null;
          key_messages: string[];
          platforms: string[];
          start_date: string;
          end_date: string;
          content_pillars: string[];
          constraints: string[];
          success_metrics: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          brand_profile_id: string;
          title: string;
          objective: string;
          audience: string;
          offer?: string | null;
          key_messages: string[];
          platforms: string[];
          start_date: string;
          end_date: string;
          content_pillars: string[];
          constraints: string[];
          success_metrics: string[];
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          brand_profile_id?: string;
          title?: string;
          objective?: string;
          audience?: string;
          offer?: string | null;
          key_messages?: string[];
          platforms?: string[];
          start_date?: string;
          end_date?: string;
          content_pillars?: string[];
          constraints?: string[];
          success_metrics?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_brand_profile_id_fkey";
            columns: ["brand_profile_id"];
            isOneToOne: false;
            referencedRelation: "brand_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_items: {
        Row: {
          id: string;
          workspace_id: string;
          campaign_id: string;
          platform: string;
          hook: string;
          caption: string;
          hashtags: string[];
          cta: string | null;
          media_brief: string | null;
          status: string;
          provenance: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          campaign_id: string;
          platform: string;
          hook: string;
          caption: string;
          hashtags: string[];
          cta?: string | null;
          media_brief?: string | null;
          status: string;
          provenance: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          campaign_id?: string;
          platform?: string;
          hook?: string;
          caption?: string;
          hashtags?: string[];
          cta?: string | null;
          media_brief?: string | null;
          status?: string;
          provenance?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_metrics: {
        Row: {
          id: string;
          workspace_id: string;
          content_item_id: string | null;
          platform: string;
          captured_at: string;
          impressions: number;
          engagements: number;
          clicks: number | null;
          conversions: number | null;
          provenance: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          content_item_id?: string | null;
          platform: string;
          captured_at: string;
          impressions: number;
          engagements: number;
          clicks?: number | null;
          conversions?: number | null;
          provenance: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          content_item_id?: string | null;
          platform?: string;
          captured_at?: string;
          impressions?: number;
          engagements?: number;
          clicks?: number | null;
          conversions?: number | null;
          provenance?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_metrics_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_metrics_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};