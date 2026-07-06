import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetDrama, getGetDramaQueryKey, 
  useUpdateDrama, 
  useCreateEpisode, 
  useUpdateEpisode, 
  useDeleteEpisode 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, GripVertical, Image as ImageIcon, PlaySquare, Plus, Save, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ADDITIONAL_LOCALES: { code: string; label: string }[] = [
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Vietnamese" },
  { code: "id", label: "Indonesian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh-Hant", label: "Chinese (Traditional)" },
];

const titlesSchema = z.object(
  Object.fromEntries(ADDITIONAL_LOCALES.map((l) => [l.code, z.string().optional()])),
);

const metadataSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titles: titlesSchema,
  coverUrl: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  tags: z.string(), // We'll parse this to array
  isPublished: z.boolean(),
});

const rulesSchema = z.object({
  freeEpisodesCount: z.coerce.number().min(0),
  episodesPerAdUnlock: z.coerce.number().min(1),
  interstitialAdFreq: z.coerce.number().min(1),
});

const episodeSchema = z.object({
  episodeNumber: z.coerce.number().min(1),
  title: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL"),
  duration: z.coerce.number().min(1),
});

export default function DramaEdit() {
  const [, params] = useRoute("/dramas/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("metadata");
  const [editingEpisode, setEditingEpisode] = useState<any>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);

  const { data: drama, isLoading } = useGetDrama(id, {
    query: { enabled: !!id, queryKey: getGetDramaQueryKey(id) }
  });

  const updateDrama = useUpdateDrama({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDramaQueryKey(id) });
        toast({ title: "Drama updated", description: "Successfully saved changes." });
      },
      onError: () => toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" })
    }
  });

  const createEpisode = useCreateEpisode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDramaQueryKey(id) });
        setIsEpisodeModalOpen(false);
        toast({ title: "Episode added", description: "Successfully added new episode." });
      },
      onError: () => toast({ title: "Error", description: "Failed to add episode.", variant: "destructive" })
    }
  });

  const updateEpisode = useUpdateEpisode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDramaQueryKey(id) });
        setIsEpisodeModalOpen(false);
        toast({ title: "Episode updated", description: "Successfully updated episode." });
      },
      onError: () => toast({ title: "Error", description: "Failed to update episode.", variant: "destructive" })
    }
  });

  const deleteEpisode = useDeleteEpisode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDramaQueryKey(id) });
        toast({ title: "Episode deleted", description: "Successfully removed episode." });
      },
      onError: () => toast({ title: "Error", description: "Failed to delete episode.", variant: "destructive" })
    }
  });

  const emptyTitles = Object.fromEntries(ADDITIONAL_LOCALES.map((l) => [l.code, ""]));

  const metaForm = useForm<z.infer<typeof metadataSchema>>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      titleEn: "", titles: emptyTitles, coverUrl: "", description: "", tags: "", isPublished: false
    }
  });

  const rulesForm = useForm<z.infer<typeof rulesSchema>>({
    resolver: zodResolver(rulesSchema),
    defaultValues: { freeEpisodesCount: 3, episodesPerAdUnlock: 1, interstitialAdFreq: 3 }
  });

  const epForm = useForm<z.infer<typeof episodeSchema>>({
    resolver: zodResolver(episodeSchema),
    defaultValues: { episodeNumber: 1, title: "", videoUrl: "", duration: 60 }
  });

  useEffect(() => {
    if (drama) {
      metaForm.reset({
        titleEn: drama.titleEn,
        titles: { ...emptyTitles, ...(drama.titles || {}) },
        coverUrl: drama.coverUrl,
        description: drama.description || "",
        tags: drama.tags ? drama.tags.join(", ") : "",
        isPublished: drama.isPublished
      });
      rulesForm.reset({
        freeEpisodesCount: drama.freeEpisodesCount,
        episodesPerAdUnlock: drama.episodesPerAdUnlock,
        interstitialAdFreq: drama.interstitialAdFreq
      });
    }
  }, [drama, metaForm, rulesForm]);

  function onMetaSubmit(values: z.infer<typeof metadataSchema>) {
    const titles: Record<string, string> = {};
    for (const [code, value] of Object.entries(values.titles || {})) {
      if (value && value.trim().length > 0) titles[code] = value;
    }
    updateDrama.mutate({
      dramaId: id,
      data: {
        titleEn: values.titleEn,
        titles,
        coverUrl: values.coverUrl,
        description: values.description || undefined,
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        isPublished: values.isPublished
      }
    });
  }

  function onRulesSubmit(values: z.infer<typeof rulesSchema>) {
    updateDrama.mutate({
      dramaId: id,
      data: {
        freeEpisodesCount: values.freeEpisodesCount,
        episodesPerAdUnlock: values.episodesPerAdUnlock,
        interstitialAdFreq: values.interstitialAdFreq
      }
    });
  }

  function onEpSubmit(values: z.infer<typeof episodeSchema>) {
    if (editingEpisode) {
      updateEpisode.mutate({
        episodeId: editingEpisode.id,
        data: {
          episodeNumber: values.episodeNumber,
          title: values.title || undefined,
          videoUrl: values.videoUrl,
          duration: values.duration
        }
      });
    } else {
      createEpisode.mutate({
        dramaId: id,
        data: {
          episodeNumber: values.episodeNumber,
          title: values.title || undefined,
          videoUrl: values.videoUrl,
          duration: values.duration
        }
      });
    }
  }

  function openNewEpisode() {
    const nextNum = drama?.episodes?.length ? Math.max(...drama.episodes.map(e => e.episodeNumber)) + 1 : 1;
    setEditingEpisode(null);
    epForm.reset({ episodeNumber: nextNum, title: "", videoUrl: "", duration: 60 });
    setIsEpisodeModalOpen(true);
  }

  function openEditEpisode(ep: any) {
    setEditingEpisode(ep);
    epForm.reset({
      episodeNumber: ep.episodeNumber,
      title: ep.title || "",
      videoUrl: ep.videoUrl,
      duration: ep.duration
    });
    setIsEpisodeModalOpen(true);
  }

  if (isLoading || !drama) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="flex gap-6">
          <Skeleton className="h-[400px] w-64 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Sort episodes safely safely
  const sortedEpisodes = [...(drama.episodes || [])].sort((a, b) => a.episodeNumber - b.episodeNumber);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 ease-out pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dramas">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold tracking-tight truncate">{drama.titleEn}</h1>
            {drama.isPublished ? (
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 whitespace-nowrap">Published</Badge>
            ) : (
              <Badge variant="secondary" className="whitespace-nowrap">Draft</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm truncate mt-1">
            ID: {drama.id} • {drama.totalEpisodes} episodes • {drama.viewsCount.toLocaleString()} views
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="metadata">Metadata & Rules</TabsTrigger>
          <TabsTrigger value="episodes">Episodes ({drama.totalEpisodes})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metadata" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle>Core Details</CardTitle>
                  <CardDescription>Main metadata displayed to users in the app.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...metaForm}>
                    <form onSubmit={metaForm.handleSubmit(onMetaSubmit)} className="space-y-5">
                      <FormField
                        control={metaForm.control}
                        name="titleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>English Title (Primary)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        {ADDITIONAL_LOCALES.map((locale) => (
                          <FormField
                            key={locale.code}
                            control={metaForm.control}
                            name={`titles.${locale.code}` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{locale.label} Title (Optional)</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormField
                        control={metaForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Synopsis / Description</FormLabel>
                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={metaForm.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (comma separated)</FormLabel>
                            <FormControl><Input placeholder="Romance, Billionaire, Revenge" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={metaForm.control}
                        name="coverUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Image URL</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={metaForm.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-semibold">Publish Status</FormLabel>
                              <FormDescription>Make this drama visible in the mobile app.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={updateDrama.isPending}>
                          {updateDrama.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Metadata</>}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md"><Settings2 size={18} /></div>
                    <CardTitle>Monetization Rules</CardTitle>
                  </div>
                  <CardDescription>Override global ad settings for this specific drama.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...rulesForm}>
                    <form onSubmit={rulesForm.handleSubmit(onRulesSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <FormField
                          control={rulesForm.control}
                          name="freeEpisodesCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Free Episodes</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormDescription>Number of eps before paywall.</FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={rulesForm.control}
                          name="episodesPerAdUnlock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eps per Ad Unlock</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormDescription>Granted per rewarded video.</FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={rulesForm.control}
                          name="interstitialAdFreq"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interstitial Freq</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormDescription>Show ad every N episodes.</FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit" variant="secondary" disabled={updateDrama.isPending}>
                          Save Rules
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border border-border/50 shadow-md bg-muted relative">
                  {drama.coverUrl ? (
                    <img src={drama.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon size={48} className="mb-2 opacity-50" />
                      <span className="text-sm font-medium">No cover image</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                    <h3 className="text-white font-display font-bold text-xl leading-tight line-clamp-2">{drama.titleEn}</h3>
                    <p className="text-white/80 text-sm mt-1">{drama.totalEpisodes} Episodes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="episodes" className="mt-6 space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
            <div>
              <h3 className="font-semibold font-display">Episode List</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and reorder episodes for this drama.</p>
            </div>
            <Button onClick={openNewEpisode}>
              <Plus className="mr-2 h-4 w-4" /> Add Episode
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {sortedEpisodes.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                  <PlaySquare size={24} />
                </div>
                <h3 className="font-medium mb-1">No episodes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add the first episode to get started.</p>
                <Button variant="outline" size="sm" onClick={openNewEpisode}>Add Episode</Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {sortedEpisodes.map((ep) => (
                  <div key={ep.id} className="flex items-center p-3 sm:p-4 hover:bg-muted/30 transition-colors group">
                    <div className="text-muted-foreground/40 mr-3 cursor-grab hover:text-foreground">
                      <GripVertical size={18} />
                    </div>
                    <div className="w-12 h-12 bg-primary/10 text-primary font-display font-bold text-lg rounded-md flex items-center justify-center shrink-0 mr-4">
                      {ep.episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className="font-semibold text-sm truncate">{ep.title || `Episode ${ep.episodeNumber}`}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={12} /> {Math.floor(ep.duration / 60)}:{(ep.duration % 60).toString().padStart(2, '0')}</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{ep.videoUrl}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => openEditEpisode(ep)}>Edit</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                        if (confirm(`Delete episode ${ep.episodeNumber}?`)) {
                          deleteEpisode.mutate({ episodeId: ep.id });
                        }
                      }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEpisodeModalOpen} onOpenChange={setIsEpisodeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEpisode ? `Edit Episode ${editingEpisode.episodeNumber}` : "Add New Episode"}</DialogTitle>
            <DialogDescription>
              {editingEpisode ? "Update episode details and media source." : "Add a new episode to this drama."}
            </DialogDescription>
          </DialogHeader>
          <Form {...epForm}>
            <form onSubmit={epForm.handleSubmit(onEpSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={epForm.control}
                  name="episodeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode Number</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={epForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={epForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <FormControl><Input placeholder="E.g. The Betrayal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={epForm.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Content URL (HLS / MP4)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEpisodeModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createEpisode.isPending || updateEpisode.isPending}>
                  {editingEpisode ? "Save Changes" : "Add Episode"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
