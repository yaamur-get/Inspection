import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Mosque } from "@/types";

type MosqueInsert = Database["public"]["Tables"]["mosques"]["Insert"];
type MosqueUpdate = Database["public"]["Tables"]["mosques"]["Update"];
type MosqueInsertOptional = Omit<MosqueInsert, "created_by"> & { created_by?: string };

export const mosqueService = {
  async getAllMosques(): Promise<Mosque[]> {
    const { data, error } = await supabase
      .from("mosques")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mosques:", error);
      throw error;
    }
    return (data as Mosque[]) || [];
  },

  async getMosqueById(id: string): Promise<Mosque | null> {
    const { data, error } = await supabase
      .from("mosques")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching mosque with id ${id}:`, error);
      throw error;
    }
    return data as Mosque | null;
  },

  async createMosque(mosque: MosqueInsertOptional): Promise<Mosque> {
    const { data, error } = await supabase
      .from("mosques")
      .insert([mosque])
      .select()
      .single();

    if (error) {
      console.error("Error creating mosque:", error);
      throw error;
    }
    return data as Mosque;
  },

  async updateMosque(id: string, updates: MosqueUpdate): Promise<Mosque> {
    const { data, error } = await supabase
      .from("mosques")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating mosque with id ${id}:`, error);
      throw error;
    }
    return data as Mosque;
  },

  async deleteMosque(id: string): Promise<boolean> {
    const { error } = await supabase.from("mosques").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting mosque with id ${id}:`, error);
      throw error;
    }
    return true;
  },
};
