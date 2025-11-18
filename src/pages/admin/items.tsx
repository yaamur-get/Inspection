
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Package, DollarSign } from "lucide-react";
import { MainItem, SubItem } from "@/types";
import { itemService } from "@/services/itemService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Dialog for editing/adding items
interface EditItemDialogProps {
  item?: MainItem | SubItem;
  mainItems?: MainItem[];
  onSave: (item: any) => Promise<void>;
  isMain: boolean;
}

function EditItemDialog({ item, mainItems, onSave, isMain }: EditItemDialogProps) {
  const [editedItem, setEditedItem] = useState(item);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    if(editedItem) {
        await onSave(editedItem);
    }
    setIsOpen(false);
  };
  
  useEffect(() => {
    setEditedItem(item);
  }, [item])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-slate-600 hover:text-blue-600">
            <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isMain ? "Edit Main Item" : "Edit Sub Item"}</DialogTitle>
        </DialogHeader>
        {editedItem && (
          <div className="space-y-4">
            <Input
              value={editedItem.name}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              placeholder="Name (English)"
            />
            <Input
              value={editedItem.name_ar}
              onChange={(e) => setEditedItem({ ...editedItem, name_ar: e.target.value })}
              placeholder="Name (Arabic)"
            />
            {!isMain && 'unit' in editedItem && (
              <>
                <Input
                  value={editedItem.unit}
                  onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
                  placeholder="Unit of Measurement (English)"
                />
                 <Input
                  value={editedItem.unit_ar}
                  onChange={(e) => setEditedItem({ ...editedItem, unit_ar: e.target.value })}
                  placeholder="Unit of Measurement (Arabic)"
                />
                <Input
                  type="number"
                  value={editedItem.unit_price}
                  onChange={(e) => setEditedItem({ ...editedItem, unit_price: Number(e.target.value) })}
                  placeholder="Unit Price"
                />
                <Select onValueChange={(value) => setEditedItem({...editedItem, main_item_id: value})} value={(editedItem as SubItem).main_item_id}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Main Item" />
                    </SelectTrigger>
                    <SelectContent>
                        {mainItems?.map(main => (
                            <SelectItem key={main.id} value={main.id}>{main.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog for adding items
interface AddItemDialogProps {
    onSave: (item: any) => Promise<void>;
    isMain: boolean;
    mainItemId?: string;
    mainItems?: MainItem[];
}
  
function AddItemDialog({ onSave, isMain, mainItemId, mainItems }: AddItemDialogProps) {
    const getInitialState = () => isMain 
        ? { name: "", name_ar: "" } 
        : { name: "", name_ar: "", unit: "", unit_ar: "", unit_price: 0, main_item_id: mainItemId };

    const [newItem, setNewItem] = useState<Partial<MainItem & SubItem>>(getInitialState());
    const [isOpen, setIsOpen] = useState(false);
  
    const handleSave = async () => {
      await onSave(newItem);
      setIsOpen(false);
      setNewItem(getInitialState());
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>{isMain ? "Add Main Item" : "Add Sub Item"}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isMain ? "Add New Main Item" : "Add New Sub Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newItem.name || ""}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Name (English)"
            />
            <Input
              value={newItem.name_ar || ""}
              onChange={(e) => setNewItem({ ...newItem, name_ar: e.target.value })}
              placeholder="Name (Arabic)"
            />
            {!isMain && (
              <>
                <Input
                  value={(newItem as SubItem).unit || ""}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="Unit of Measurement (English)"
                />
                <Input
                  value={(newItem as SubItem).unit_ar || ""}
                  onChange={(e) => setNewItem({ ...newItem, unit_ar: e.target.value })}
                  placeholder="Unit of Measurement (Arabic)"
                />
                <Input
                  type="number"
                  value={(newItem as SubItem).unit_price || 0}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                  placeholder="Unit Price"
                />
                 <Select onValueChange={(value) => setNewItem({...newItem, main_item_id: value})} value={(newItem as SubItem).main_item_id}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Main Item" />
                    </SelectTrigger>
                    <SelectContent>
                        {mainItems?.map(main => (
                            <SelectItem key={main.id} value={main.id}>{main.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save Item</Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export default function ItemManagement() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mainItems, setMainItems] = useState<MainItem[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if(user) {
        fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
        const items = await itemService.getAllMainItems();
        setMainItems(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        toast({ title: "Error", description: "Could not fetch items.", variant: "destructive" });
    }
  };

  const seedDatabase = async () => {
    const mainItemsData: Omit<MainItem, "id" | "created_at" | "sub_items">[] = [
        { name: "Toilets and Ablution Areas", name_ar: "دورات المياه والمواضئ" },
        { name: "Air Conditioning and Ventilation", name_ar: "التكييف والتهوية" },
        { name: "Electricity and Lighting", name_ar: "الكهرباء والإضاءة" },
        { name: "Furniture and Carpets", name_ar: "الأثاث والفرش" },
    ];
      
    const subItemsData: Omit<SubItem, "id" | "created_at">[] = [
        { main_item_id: "a1", name: "Clean toilet", name_ar: "تنظيف دورة مياه", unit: "unit", unit_ar: "وحدة", unit_price: 50, },
        { main_item_id: "a1", name: "Repair faucet", name_ar: "إصلاح صنبور", unit: "piece", unit_ar: "قطعة", unit_price: 30, },
        { main_item_id: "a2", name: "Clean AC filter", name_ar: "تنظيف فلتر مكيف", unit: "unit", unit_ar: "وحدة", unit_price: 20, },
        { main_item_id: "a2", name: "AC maintenance", name_ar: "صيانة مكيف", unit: "unit", unit_ar: "وحدة", unit_price: 150, },
        { main_item_id: "a3", name: "Replace lamp", name_ar: "تغيير لمبة", unit: "piece", unit_ar: "قطعة", unit_price: 15, },
        { main_item_id: "a4", name: "Clean carpet", name_ar: "تنظيف سجاد", unit: "sqm", unit_ar: "متر مربع", unit_price: 10, },
        { main_item_id: "a4", name: "Repair chair", name_ar: "إصلاح كرسي", unit: "piece", unit_ar: "قطعة", unit_price: 40, },
    ];

    try {
        const { count, error: deleteSubError } = await supabase.from("sub_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if(deleteSubError) throw deleteSubError;
        const { error: deleteMainError } = await supabase.from("main_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if(deleteMainError) throw deleteMainError;
      
        const mainIdMap: { [key: string]: string } = {};
        const tempMainIds = ["a1", "a2", "a3", "a4"];

        for(const item of mainItemsData) {
            const { data, error } = await supabase.from("main_items").insert({ name: item.name, name_ar: item.name_ar, }).select().single();
            if (error) throw error;
            if(data?.id) {
              const tempId = tempMainIds.shift();
              if (tempId) {
                mainIdMap[tempId] = data.id;
              }
            }
        }

        await Promise.all(
            subItemsData.map(item =>
                supabase.from("sub_items").insert({
                    ...item,
                    main_item_id: mainIdMap[item.main_item_id] || item.main_item_id
                })
            )
        );
        toast({ title: "Success", description: "Database seeded successfully." });
        fetchItems();
    } catch(error) {
        console.error("Error seeding database:", error)
        toast({ title: "Error", description: "Could not seed database.", variant: "destructive" });
    }
  };

  const handleCreateMainItem = async (item: { name: string, name_ar: string}) => {
    try {
        await itemService.createMainItem(item);
        toast({ title: "Success", description: "Main item created." });
        fetchItems();
    } catch(e) {
        toast({ title: "Error", description: "Failed to create main item.", variant: "destructive" });
    }
  }

  const handleUpdateMainItem = async (item: MainItem) => {
    try {
        await itemService.updateMainItem(item.id, item);
        toast({ title: "Success", description: "Main item updated." });
        fetchItems();
    } catch(e) {
        toast({ title: "Error", description: "Failed to update main item.", variant: "destructive" });
    }
  }

  const handleCreateSubItem = async (item: Omit<SubItem, "id" | "created_at">) => {
    try {
        await itemService.createSubItem(item);
        toast({ title: "Success", description: "Sub item created." });
        fetchItems();
    } catch(e) {
        toast({ title: "Error", description: "Failed to create sub item.", variant: "destructive" });
    }
  }

  const handleUpdateSubItem = async (item: SubItem) => {
    try {
        await itemService.updateSubItem(item.id, item);
        toast({ title: "Success", description: "Sub item updated." });
        fetchItems();
    } catch(e) {
        toast({ title: "Error", description: "Failed to update sub item.", variant: "destructive" });
    }
  }

  const handleDeleteMainItem = async (id: string) => {
      if(!window.confirm("Are you sure? This will delete all associated sub-items.")) return;
      try {
          await itemService.deleteMainItem(id);
          toast({ title: "Success", description: "Main item deleted." });
          fetchItems();
      } catch (e) {
          toast({ title: "Error", description: "Failed to delete main item.", variant: "destructive" });
      }
  }

  const handleDeleteSubItem = async (id: string) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await itemService.deleteSubItem(id);
        toast({ title: "Success", description: "Sub item deleted." });
        fetchItems();
    } catch (e) {
        toast({ title: "Error", description: "Failed to delete sub item.", variant: "destructive" });
    }
}


  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Item Management</h1>
          <p>Configure inspection items and sub-items.</p>
        </div>
        <div className="flex space-x-2">
            <Button onClick={seedDatabase}>Seed Database</Button>
            <AddItemDialog onSave={handleCreateMainItem} isMain={true} />
        </div>
      </div>

        <div className="space-y-6">
          {mainItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{item.name_ar}</CardTitle>
                <div className="flex items-center space-x-2">
                  <EditItemDialog item={item} onSave={handleUpdateMainItem} isMain={true} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-600 hover:text-red-600"
                    onClick={() => handleDeleteMainItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul>
                  {item.sub_items &&
                    item.sub_items.map((sub) => (
                      <li key={sub.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p>{sub.name_ar}</p>
                          <p className="text-sm text-gray-500">
                            Unit: {sub.unit}, Price: {sub.unit_price} SAR
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <EditItemDialog
                            item={sub}
                            mainItems={mainItems}
                            onSave={handleUpdateSubItem}
                            isMain={false}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-red-600"
                            onClick={() => handleDeleteSubItem(sub.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
                <div className="mt-4">
                  <AddItemDialog
                    mainItemId={item.id}
                    onSave={handleCreateSubItem}
                    isMain={false}
                    mainItems={mainItems}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
