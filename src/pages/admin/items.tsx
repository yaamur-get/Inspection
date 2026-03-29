
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2, Trash2, ArrowRight } from "lucide-react";
import { Cause, MainItem, Spec, SubItem } from "@/types";
import { itemService } from "@/services/itemService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// Dialog for editing/adding items
interface EditItemDialogProps {
  item?: MainItem | SubItem;
  mainItems?: MainItem[];
  onSave: (item: MainItem | SubItem) => Promise<void>;
  isMain: boolean;
}

function EditItemDialog({ item, mainItems, onSave, isMain }: EditItemDialogProps) {
  const [editedItem, setEditedItem] = useState<MainItem | SubItem | undefined>(item);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">{isMain ? "تعديل بند رئيسي" : "تعديل بند فرعي"}</DialogTitle>
        </DialogHeader>
        {editedItem && (
          <div className="space-y-4" dir="rtl">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم البند بالإنجليزي:</label>
              <Input
                value={editedItem.name}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                placeholder="أدخل الاسم بالإنجليزي"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم البند بالعربي:</label>
              <Input
                value={editedItem.name_ar}
                onChange={(e) => setEditedItem({ ...editedItem, name_ar: e.target.value })}
                placeholder="أدخل الاسم بالعربي"
              />
            </div>
            {!isMain && 'unit' in editedItem && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم البند في الجدول:</label>
                  <Input
                    value={editedItem.name_table || ""}
                    onChange={(e) => setEditedItem({ ...editedItem, name_table: e.target.value })}
                    placeholder="أدخل اسم البند في الجدول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">وحدة القياس بالإنجليزي:</label>
                  <Input
                    value={editedItem.unit}
                    onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
                    placeholder="أدخل وحدة القياس بالإنجليزي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">وحدة القياس بالعربي:</label>
                  <Input
                    value={editedItem.unit_ar}
                    onChange={(e) => setEditedItem({ ...editedItem, unit_ar: e.target.value })}
                    placeholder="أدخل وحدة القياس بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">سعر الوحدة:</label>
                  <Input
                    type="number"
                    value={editedItem.unit_price}
                    onChange={(e) => setEditedItem({ ...editedItem, unit_price: Number(e.target.value) })}
                    placeholder="أدخل سعر الوحدة"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">البند الرئيسي:</label>
                  <Select onValueChange={(value) => setEditedItem({...editedItem, main_item_id: value})} value={(editedItem as SubItem).main_item_id}>
                      <SelectTrigger>
                          <SelectValue placeholder="اختر البند الرئيسي" />
                      </SelectTrigger>
                      <SelectContent>
                          {mainItems?.map(main => (
                              <SelectItem key={main.id} value={main.id}>{main.name_ar}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
          <Button onClick={handleSave}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog for adding items
interface AddItemDialogProps {
    onSave: (item: Partial<MainItem> | Partial<SubItem>) => Promise<void>;
    isMain: boolean;
    mainItemId?: string;
    mainItems?: MainItem[];
}
  
function AddItemDialog({ onSave, isMain, mainItemId, mainItems }: AddItemDialogProps) {
    const getInitialState = () => isMain 
        ? { name: "", name_ar: "" } 
        : { name: "", name_ar: "", unit: "", unit_ar: "", unit_price: 0, main_item_id: mainItemId, name_table: "" };

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
          <Button>{isMain ? "إضافة بند رئيسي" : "إضافة بند فرعي"}</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">{isMain ? "إضافة بند رئيسي جديد" : "إضافة بند فرعي جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم البند بالإنجليزي:</label>
              <Input
                value={newItem.name || ""}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="أدخل الاسم بالإنجليزي"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم البند بالعربي:</label>
              <Input
                value={newItem.name_ar || ""}
                onChange={(e) => setNewItem({ ...newItem, name_ar: e.target.value })}
                placeholder="أدخل الاسم بالعربي"
              />
            </div>
            {!isMain && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم البند في الجدول:</label>
                  <Input
                    value={(newItem as SubItem).name_table || ""}
                    onChange={(e) => setNewItem({ ...newItem, name_table: e.target.value })}
                    placeholder="أدخل اسم البند في الجدول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">وحدة القياس بالإنجليزي:</label>
                  <Input
                    value={(newItem as SubItem).unit || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="أدخل وحدة القياس بالإنجليزي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">وحدة القياس بالعربي:</label>
                  <Input
                    value={(newItem as SubItem).unit_ar || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit_ar: e.target.value })}
                    placeholder="أدخل وحدة القياس بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">سعر الوحدة:</label>
                  <Input
                    type="number"
                    value={(newItem as SubItem).unit_price || 0}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    placeholder="أدخل سعر الوحدة"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">البند الرئيسي:</label>
                  <Select onValueChange={(value) => setNewItem({...newItem, main_item_id: value})} value={(newItem as SubItem).main_item_id}>
                      <SelectTrigger>
                          <SelectValue placeholder="اختر البند الرئيسي" />
                      </SelectTrigger>
                      <SelectContent>
                          {mainItems?.map(main => (
                              <SelectItem key={main.id} value={main.id}>{main.name_ar}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ البند</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export default function ItemManagement() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mainItems, setMainItems] = useState<MainItem[]>([]);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [newCauseBySubItem, setNewCauseBySubItem] = useState<Record<string, string>>({});
  const [newSpecBySubItem, setNewSpecBySubItem] = useState<Record<string, string>>({});
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [editingCauseText, setEditingCauseText] = useState("");
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editingSpecText, setEditingSpecText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickMainId, setQuickMainId] = useState("");
  const mainItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const fetchItems = useCallback(async () => {
    try {
        const [items, allCauses, allSpecs] = await Promise.all([
          itemService.getAllMainItems(),
          itemService.getAllCauses(),
          itemService.getAllSpecs(),
        ]);
        setMainItems(items);
        setCauses(allCauses);
        setSpecs(allSpecs);
    } catch (error) {
        console.error("Error fetching items:", error);
        toast({ title: "Error", description: "Could not fetch items.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if(user) {
        fetchItems();
    }
  }, [user, fetchItems]);

  const seedDatabase = async () => {
    const mainItemsData: Omit<MainItem, "id" | "created_at" | "sub_items">[] = [
        { name: "Toilets and Ablution Areas", name_ar: "دورات المياه والمواضئ" },
        { name: "Air Conditioning and Ventilation", name_ar: "التكييف والتهوية" },
        { name: "Electricity and Lighting", name_ar: "الكهرباء والإضاءة" },
        { name: "Furniture and Carpets", name_ar: "الأثاث والفرش" },
    ];
      
    const subItemsData: Omit<SubItem, "id" | "created_at">[] = [
        { main_item_id: "a1", name: "Clean toilet", name_ar: "تنظيف دورة مياه", unit: "unit", unit_ar: "وحدة", unit_price: 50, name_table: null },
        { main_item_id: "a1", name: "Repair faucet", name_ar: "إصلاح صنبور", unit: "piece", unit_ar: "قطعة", unit_price: 30, name_table: null },
        { main_item_id: "a2", name: "Clean AC filter", name_ar: "تنظيف فلتر مكيف", unit: "unit", unit_ar: "وحدة", unit_price: 20, name_table: null },
        { main_item_id: "a2", name: "AC maintenance", name_ar: "صيانة مكيف", unit: "unit", unit_ar: "وحدة", unit_price: 150, name_table: null },
        { main_item_id: "a3", name: "Replace lamp", name_ar: "تغيير لمبة", unit: "piece", unit_ar: "قطعة", unit_price: 15, name_table: null },
        { main_item_id: "a4", name: "Clean carpet", name_ar: "تنظيف سجاد", unit: "sqm", unit_ar: "متر مربع", unit_price: 10, name_table: null },
        { main_item_id: "a4", name: "Repair chair", name_ar: "إصلاح كرسي", unit: "piece", unit_ar: "قطعة", unit_price: 40, name_table: null },
    ];

    try {
        const { error: deleteSubError } = await supabase.from("sub_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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
    } catch(error) {
        console.error("Error creating main item:", error);
        toast({ title: "Error", description: "Failed to create main item.", variant: "destructive" });
    }
  }

  const handleUpdateMainItem = async (item: MainItem) => {
    try {
        await itemService.updateMainItem(item.id, item);
        toast({ title: "Success", description: "Main item updated." });
        fetchItems();
    } catch(error) {
        console.error("Error updating main item:", error);
        toast({ title: "Error", description: "Failed to update main item.", variant: "destructive" });
    }
  }

  const handleCreateSubItem = async (item: Omit<SubItem, "id" | "created_at">) => {
    try {
        await itemService.createSubItem(item);
        toast({ title: "Success", description: "Sub item created." });
        fetchItems();
    } catch(error) {
        console.error("Error creating sub item:", error);
        toast({ title: "Error", description: "Failed to create sub item.", variant: "destructive" });
    }
  }

  const handleUpdateSubItem = async (item: SubItem) => {
    try {
        await itemService.updateSubItem(item.id, item);
        toast({ title: "Success", description: "Sub item updated." });
        fetchItems();
    } catch(error) {
        console.error("Error updating sub item:", error);
        toast({ title: "Error", description: "Failed to update sub item.", variant: "destructive" });
    }
  }

  const handleDeleteMainItem = async (id: string) => {
      if(!window.confirm("Are you sure? This will delete all associated sub-items.")) return;
      try {
          await itemService.deleteMainItem(id);
          toast({ title: "Success", description: "Main item deleted." });
          fetchItems();
      } catch (error) {
          console.error("Error deleting main item:", error);
          toast({ title: "Error", description: "Failed to delete main item.", variant: "destructive" });
      }
  }

  const handleDeleteSubItem = async (id: string) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await itemService.deleteSubItem(id);
        toast({ title: "Success", description: "Sub item deleted." });
        fetchItems();
    } catch (error) {
        console.error("Error deleting sub item:", error);
        toast({ title: "Error", description: "Failed to delete sub item.", variant: "destructive" });
    }
}

  const getSubItemCauses = (subItemId: string) =>
    causes.filter((cause) => cause.sub_item_id === subItemId);

  const getSubItemSpecs = (subItemId: string) =>
    specs.filter((spec) => spec.sub_item_id === subItemId);

  const handleCreateCause = async (subItemId: string) => {
    const name = (newCauseBySubItem[subItemId] || "").trim();
    if (!name) return;

    try {
      await itemService.createCause({ sub_item_id: subItemId, name_ar: name });
      setNewCauseBySubItem((prev) => ({ ...prev, [subItemId]: "" }));
      toast({ title: "Success", description: "Cause created." });
      fetchItems();
    } catch (error) {
      console.error("Error creating cause:", error);
      toast({ title: "Error", description: "Failed to create cause.", variant: "destructive" });
    }
  };

  const handleUpdateCause = async () => {
    if (!editingCauseId) return;
    const name = editingCauseText.trim();
    if (!name) return;

    try {
      await itemService.updateCause(editingCauseId, { name_ar: name });
      setEditingCauseId(null);
      setEditingCauseText("");
      toast({ title: "Success", description: "Cause updated." });
      fetchItems();
    } catch (error) {
      console.error("Error updating cause:", error);
      toast({ title: "Error", description: "Failed to update cause.", variant: "destructive" });
    }
  };

  const handleDeleteCause = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await itemService.deleteCause(id);
      toast({ title: "Success", description: "Cause deleted." });
      fetchItems();
    } catch (error) {
      console.error("Error deleting cause:", error);
      toast({ title: "Error", description: "Failed to delete cause.", variant: "destructive" });
    }
  };

  const handleCreateSpec = async (subItemId: string) => {
    const name = (newSpecBySubItem[subItemId] || "").trim();
    if (!name) return;

    try {
      await itemService.createSpec({ sub_item_id: subItemId, name });
      setNewSpecBySubItem((prev) => ({ ...prev, [subItemId]: "" }));
      toast({ title: "Success", description: "Spec created." });
      fetchItems();
    } catch (error) {
      console.error("Error creating spec:", error);
      toast({ title: "Error", description: "Failed to create spec.", variant: "destructive" });
    }
  };

  const handleUpdateSpec = async () => {
    if (!editingSpecId) return;
    const name = editingSpecText.trim();
    if (!name) return;

    try {
      await itemService.updateSpec(editingSpecId, { name });
      setEditingSpecId(null);
      setEditingSpecText("");
      toast({ title: "Success", description: "Spec updated." });
      fetchItems();
    } catch (error) {
      console.error("Error updating spec:", error);
      toast({ title: "Error", description: "Failed to update spec.", variant: "destructive" });
    }
  };

  const handleDeleteSpec = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await itemService.deleteSpec(id);
      toast({ title: "Success", description: "Spec deleted." });
      fetchItems();
    } catch (error) {
      console.error("Error deleting spec:", error);
      toast({ title: "Error", description: "Failed to delete spec.", variant: "destructive" });
    }
  };

  const filteredMainItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return mainItems;

    return mainItems.filter((mainItem) => {
      const mainMatches =
        (mainItem.name_ar || "").toLowerCase().includes(query) ||
        (mainItem.name || "").toLowerCase().includes(query);

      if (mainMatches) return true;

      const hasMatchingSubItem = (mainItem.sub_items || []).some((subItem) => {
        const subMatches =
          (subItem.name_ar || "").toLowerCase().includes(query) ||
          (subItem.name || "").toLowerCase().includes(query) ||
          (subItem.name_table || "").toLowerCase().includes(query);

        if (subMatches) return true;

        const causeMatches = causes
          .filter((cause) => cause.sub_item_id === subItem.id)
          .some((cause) => (cause.name_ar || "").toLowerCase().includes(query));

        if (causeMatches) return true;

        const specMatches = specs
          .filter((spec) => spec.sub_item_id === subItem.id)
          .some((spec) => (spec.name || "").toLowerCase().includes(query));

        return specMatches;
      });

      return hasMatchingSubItem;
    });
  }, [mainItems, causes, specs, searchTerm]);


  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>رجوع للرئيسية</span>
          </Button>
        </div>
        <div className="flex space-x-2">
            <Button onClick={seedDatabase}>Seed Database</Button>
            <AddItemDialog onSave={handleCreateMainItem} isMain={true} />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Item Management</h1>
        <p>Configure inspection items and sub-items.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2" dir="rtl">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث سريع في البند الرئيسي / الفرعي / المسبب / المواصفة"
        />
        <Select
          value={quickMainId}
          onValueChange={(value) => {
            setQuickMainId(value);
            mainItemRefs.current[value]?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتقال سريع إلى بند رئيسي" />
          </SelectTrigger>
          <SelectContent>
            {mainItems.map((mainItem) => (
              <SelectItem key={mainItem.id} value={mainItem.id}>
                {mainItem.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

        <div className="space-y-6">
          {filteredMainItems.map((item) => (
            <div key={item.id} ref={(node) => {
              mainItemRefs.current[item.id] = node;
            }}>
            <Card>
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
                <Accordion type="multiple" className="w-full">
                  {(item.sub_items || [])
                    .filter((sub) => {
                      const query = searchTerm.trim().toLowerCase();
                      if (!query) return true;

                      const subMatches =
                        (sub.name_ar || "").toLowerCase().includes(query) ||
                        (sub.name || "").toLowerCase().includes(query) ||
                        (sub.name_table || "").toLowerCase().includes(query);

                      if (subMatches) return true;

                      const causeMatches = getSubItemCauses(sub.id).some((cause) =>
                        (cause.name_ar || "").toLowerCase().includes(query)
                      );

                      if (causeMatches) return true;

                      return getSubItemSpecs(sub.id).some((spec) =>
                        (spec.name || "").toLowerCase().includes(query)
                      );
                    })
                    .map((sub) => {
                      const subCauses = getSubItemCauses(sub.id);
                      const subSpecs = getSubItemSpecs(sub.id);

                      return (
                      <AccordionItem key={sub.id} value={sub.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="w-full text-right">
                            <p className="font-medium">{sub.name_ar}</p>
                            <p className="text-sm text-gray-500">
                              Unit: {sub.unit}, Price: {sub.unit_price} SAR • المسببات: {subCauses.length} • المواصفات: {subSpecs.length}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="flex items-center justify-between">
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
                        </div>

                        <div className="mt-3 rounded-md border p-3 space-y-4" dir="rtl">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">المسببات</p>
                            <div className="flex gap-2">
                              <Input
                                value={newCauseBySubItem[sub.id] || ""}
                                onChange={(e) =>
                                  setNewCauseBySubItem((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                placeholder="أضف مسبب جديد"
                              />
                              <Button size="sm" onClick={() => handleCreateCause(sub.id)}>إضافة</Button>
                            </div>
                            <div className="space-y-1">
                              {subCauses.map((cause) => (
                                <div key={cause.id} className="flex items-center gap-2">
                                  {editingCauseId === cause.id ? (
                                    <>
                                      <Input
                                        value={editingCauseText}
                                        onChange={(e) => setEditingCauseText(e.target.value)}
                                      />
                                      <Button size="sm" onClick={handleUpdateCause}>حفظ</Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingCauseId(null);
                                          setEditingCauseText("");
                                        }}
                                      >
                                        إلغاء
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <p className="flex-1 text-sm">{cause.name_ar}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingCauseId(cause.id);
                                          setEditingCauseText(cause.name_ar);
                                        }}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-600 hover:text-red-600"
                                        onClick={() => handleDeleteCause(cause.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold">المواصفات</p>
                            <div className="flex gap-2">
                              <Input
                                value={newSpecBySubItem[sub.id] || ""}
                                onChange={(e) =>
                                  setNewSpecBySubItem((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                placeholder="أضف مواصفة جديدة"
                              />
                              <Button size="sm" onClick={() => handleCreateSpec(sub.id)}>إضافة</Button>
                            </div>
                            <div className="space-y-1">
                              {subSpecs.map((spec) => (
                                <div key={spec.id} className="flex items-center gap-2">
                                  {editingSpecId === spec.id ? (
                                    <>
                                      <Input
                                        value={editingSpecText}
                                        onChange={(e) => setEditingSpecText(e.target.value)}
                                      />
                                      <Button size="sm" onClick={handleUpdateSpec}>حفظ</Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingSpecId(null);
                                          setEditingSpecText("");
                                        }}
                                      >
                                        إلغاء
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <p className="flex-1 text-sm">{spec.name}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingSpecId(spec.id);
                                          setEditingSpecText(spec.name);
                                        }}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-600 hover:text-red-600"
                                        onClick={() => handleDeleteSpec(spec.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        </AccordionContent>
                      </AccordionItem>
                    )})}
                </Accordion>
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
            </div>
          ))}
        </div>
    </div>
  );
}
