import { useState } from "react";
import { Link } from "wouter";
import { useListDramas, getListDramasQueryKey, useCreateDrama, useDeleteDrama } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Film, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const createDramaSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  coverUrl: z.string().url("Must be a valid URL"),
});

export default function DramasList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dramas, isLoading } = useListDramas(undefined, {
    query: { queryKey: getListDramasQueryKey() }
  });

  const createDrama = useCreateDrama({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDramasQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Drama created", description: "Successfully created new drama." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create drama.", variant: "destructive" });
      }
    }
  });

  const deleteDrama = useDeleteDrama({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDramasQueryKey() });
        toast({ title: "Drama deleted", description: "Successfully deleted drama." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete drama.", variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof createDramaSchema>>({
    resolver: zodResolver(createDramaSchema),
    defaultValues: {
      titleEn: "",
      coverUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=60",
    },
  });

  function onSubmit(values: z.infer<typeof createDramaSchema>) {
    createDrama.mutate({
      data: {
        titleEn: values.titleEn,
        coverUrl: values.coverUrl,
        isPublished: false,
        freeEpisodesCount: 3,
        episodesPerAdUnlock: 1,
        interstitialAdFreq: 3,
      }
    });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this drama? This action cannot be undone.")) {
      deleteDrama.mutate({ dramaId: id });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Dramas</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog of short dramas.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> New Drama
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Drama</DialogTitle>
              <DialogDescription>
                Add a new drama to your catalog. You can add episodes and edit details later.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Title</FormLabel>
                      <FormControl>
                        <Input placeholder="The Billionaire's Revenge" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL (Vertical)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createDrama.isPending}>
                    {createDrama.isPending ? "Creating..." : "Create Drama"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !dramas || dramas.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <Film size={32} />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">No dramas found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Your catalog is currently empty. Create your first drama to get started.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Create First Drama</Button>
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px]">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Episodes</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dramas.map((drama) => (
                  <TableRow key={drama.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="h-14 w-10 rounded-md overflow-hidden bg-muted border border-border/50 shadow-sm">
                        <img 
                          src={drama.coverUrl} 
                          alt={drama.titleEn} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dramas/${drama.id}`} className="font-semibold text-foreground hover:text-primary transition-colors block">
                        {drama.titleEn}
                      </Link>
                      {drama.tags && drama.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {drama.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-sm font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {drama.isPublished ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Published</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal text-muted-foreground">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {drama.totalEpisodes}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Eye size={14} />
                        <span className="font-medium">{drama.viewsCount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {format(new Date(drama.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <Link href={`/dramas/${drama.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(drama.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Drama
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
