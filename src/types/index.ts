import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Mosque = Database["public"]["Tables"]["mosques"]["Row"];
export type MainItem = Database["public"]["Tables"]["main_items"]["Row"] & {
  sub_items: SubItem[];
};
export type SubItem = Database["public"]["Tables"]["sub_items"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"] & {
  map_photo_url?: string | null;
  mosques: Mosque;
  report_issues: Issue[];
};
export type IssuePhoto = Database["public"]["Tables"]["issue_photos"]["Row"];
export type Issue = Omit<Database["public"]["Tables"]["report_issues"]["Row"], 'notes'> & {
  notes?: string | null;
  main_items: MainItem;
  issue_items: IssueItem[];
  issue_photos: IssuePhoto[];
};
export type IssueItem = Database["public"]["Tables"]["issue_items"]["Row"] & {
  sub_items: SubItem;
  unit_price?: number | null;
};

export interface User {
    id: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role: "admin" | "technician";
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}
