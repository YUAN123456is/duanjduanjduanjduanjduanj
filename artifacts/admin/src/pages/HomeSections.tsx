import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListHomeSections,
  getListHomeSectionsQueryKey,
  useCreateHomeSection,
  useUpdateHomeSection,
  useDeleteHomeSection,
  useSetHomeSectionDramas,
  useListDramas,
  getListDramasQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LayoutList, Plus, Trash2, Pencil, GripVertical } from "lucide-react";

const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
});

export default function HomeSections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const { data: sections, isLoading } = useListHomeSections({
    query: { queryKey: getListHomeSectionsQueryKey() },
  });

  const { data: dramas } = useListDramas(undefined, {
    query: { queryKey: getListDramasQueryKey() },
  });

  const createSection = useCreateHomeSection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHomeSectionsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Section created", description: "New home section added." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create section.", variant: "destructive" });
      },
    },
  });

  const updateSection = useUpdateHomeSection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHomeSectionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update section.", variant: "destructive" });
      },
    },
  });

  const deleteSection = useDeleteHomeSection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHomeSectionsQueryKey() });
        toast({ title: "Section deleted" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete section.", variant: "destructive" });
      },
    },
  });

  const setSectionDramas = useSetHomeSectionDramas({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHomeSectionsQueryKey() });
        setEditingSectionId(null);
        toast({ title: "Dramas updated", description: "Section membership saved." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save drama assignments.", variant: "destructive" });
      },
    },
  });

  const form = useForm<z.infer<typeof createSectionSchema>>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: z.infer<typeof createSectionSchema>) {
    createSection.mutate({ data: { name: values.name, sortOrder: sections?.length ?? 0 } });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this home section? Dramas assigned to it will no longer appear there.")) {
      deleteSection.mutate({ sectionId: id });
    }
  }

  function moveSortOrder(sectionId: string, currentOrder: number, direction: -1 | 1) {
    updateSection.mutate({ sectionId, data: { sortOrder: currentOrder + direction } });
  }

  const editingSection = sections?.find((s) => s.id === editingSectionId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Home Sections</h1>
          <p className="text-muted-foreground mt-1">
            Curate rows shown on the mobile home screen and control their order and dramas.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> New Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Home Section</DialogTitle>
              <DialogDescription>
                Give it a display name. You can assign dramas to it after creating.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input placeholder="🔥 Trending Now" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSection.isPending}>
                    {createSection.isPending ? "Creating..." : "Create Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !sections || sections.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <LayoutList size={32} />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">No home sections yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create a section like "Trending Now" or "New Releases" to curate what shows on the mobile home screen.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Create First Section</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...sections]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((section) => (
              <Card key={section.id} className="border-border/50 shadow-sm p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="text-muted-foreground shrink-0" size={18} />
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{section.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {section.dramas.length} drama{section.dramas.length === 1 ? "" : "s"} · sort order {section.sortOrder}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSortOrder(section.id, section.sortOrder, -1)}
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSortOrder(section.id, section.sortOrder, 1)}
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingSectionId(section.id)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Dramas
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={!!editingSectionId} onOpenChange={(open) => !open && setEditingSectionId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Dramas — {editingSection?.name}</DialogTitle>
            <DialogDescription>
              Choose which dramas appear in this section. Order below controls display order in the row.
            </DialogDescription>
          </DialogHeader>
          {editingSection && dramas && (
            <DramaAssignmentEditor
              dramas={dramas}
              initialAssigned={editingSection.dramas}
              isSaving={setSectionDramas.isPending}
              onSave={(assignments) => {
                setSectionDramas.mutate({ sectionId: editingSection.id, data: { dramas: assignments } });
              }}
              onCancel={() => setEditingSectionId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DramaAssignmentEditor({
  dramas,
  initialAssigned,
  isSaving,
  onSave,
  onCancel,
}: {
  dramas: { id: string; titleEn: string; coverUrl: string }[];
  initialAssigned: { dramaId: string; sortOrder: number }[];
  isSaving: boolean;
  onSave: (assignments: { dramaId: string; sortOrder: number }[]) => void;
  onCancel: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    [...initialAssigned].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.dramaId),
  );

  function toggle(dramaId: string) {
    setSelectedIds((prev) =>
      prev.includes(dramaId) ? prev.filter((id) => id !== dramaId) : [...prev, dramaId],
    );
  }

  function move(dramaId: string, direction: -1 | 1) {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(dramaId);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">In this section</Label>
          <div className="space-y-1.5 mt-1.5">
            {selectedIds.map((id, idx) => {
              const drama = dramas.find((d) => d.id === id);
              if (!drama) return null;
              return (
                <div key={id} className="flex items-center gap-2 border border-border/50 rounded-md p-2">
                  <img src={drama.coverUrl} alt={drama.titleEn} className="h-10 w-7 object-cover rounded-sm shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{drama.titleEn}</span>
                  <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => move(id, -1)}>↑</Button>
                  <Button variant="outline" size="sm" disabled={idx === selectedIds.length - 1} onClick={() => move(id, 1)}>↓</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggle(id)}>Remove</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">All dramas</Label>
        <div className="space-y-1 mt-1.5 max-h-64 overflow-y-auto border border-border/50 rounded-md p-2">
          {dramas.map((drama) => (
            <label key={drama.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={selectedIds.includes(drama.id)} onCheckedChange={() => toggle(drama.id)} />
              <img src={drama.coverUrl} alt={drama.titleEn} className="h-8 w-6 object-cover rounded-sm shrink-0" />
              <span className="text-sm truncate">{drama.titleEn}</span>
            </label>
          ))}
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSaving}
          onClick={() =>
            onSave(selectedIds.map((dramaId, sortOrder) => ({ dramaId, sortOrder })))
          }
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}
