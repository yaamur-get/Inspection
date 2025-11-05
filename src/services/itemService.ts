
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MainItem = Database["public"]["Tables"]["main_items"]["Row"];
type MainItemInsert = Database["public"]["Tables"]["main_items"]["Insert"];
type SubItem = Database["public"]["Tables"]["sub_items"]["Row"];
type SubItemInsert = Database["public"]["Tables"]["sub_items"]["Insert"];

export const itemService = {
  async getAllMainItems() {
    const { data, error } = await supabase
      .from("main_items")
      .select(`
        *,
        sub_items (
          *
        )
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getMainItemById(id: string) {
    const { data, error } = await supabase
      .from("main_items")
      .select(`
        *,
        sub_items (
          *
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createMainItem(item: MainItemInsert) {
    const { data, error } = await supabase
      .from("main_items")
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data as MainItem;
  },

  async updateMainItem(id: string, updates: Partial<MainItemInsert>) {
    const { data, error } = await supabase
      .from("main_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as MainItem;
  },

  async deleteMainItem(id: string) {
    const { error } = await supabase
      .from("main_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async createSubItem(subItem: SubItemInsert) {
    const { data, error } = await supabase
      .from("sub_items")
      .insert([subItem])
      .select()
      .single();

    if (error) throw error;
    return data as SubItem;
  },

  async updateSubItem(id: string, updates: Partial<SubItemInsert>) {
    const { data, error } = await supabase
      .from("sub_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as SubItem;
  },

  async deleteSubItem(id: string) {
    const { error } = await supabase
      .from("sub_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async getSubItemsByMainItem(mainItemId: string) {
    const { data, error } = await supabase
      .from("sub_items")
      .select("*")
      .eq("main_item_id", mainItemId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as SubItem[];
  }
};
