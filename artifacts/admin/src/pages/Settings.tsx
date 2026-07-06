import { useGetGlobalConfig, getGetGlobalConfigQueryKey, useUpdateGlobalConfig, GlobalConfigUpdateActiveAdNetwork } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Settings2, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  globalAdEnabled: z.boolean(),
  activeAdNetwork: z.enum(["admob", "applovin", "ironsource"]),
  maxDailyAdUnlocks: z.coerce.number().min(0).max(100),
  iosRewardUnitId: z.string().optional(),
  androidRewardUnitId: z.string().optional(),
  reviewModeActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useGetGlobalConfig({
    query: { queryKey: getGetGlobalConfigQueryKey() }
  });

  const updateConfig = useUpdateGlobalConfig({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGlobalConfigQueryKey() });
        toast({
          title: "Settings saved",
          description: "Global configuration has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Error saving settings",
          description: "Failed to update global configuration. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      globalAdEnabled: true,
      activeAdNetwork: "admob",
      maxDailyAdUnlocks: 5,
      iosRewardUnitId: "",
      androidRewardUnitId: "",
      reviewModeActive: false,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        globalAdEnabled: config.globalAdEnabled,
        activeAdNetwork: config.activeAdNetwork as any,
        maxDailyAdUnlocks: config.maxDailyAdUnlocks,
        iosRewardUnitId: config.iosRewardUnitId || "",
        androidRewardUnitId: config.androidRewardUnitId || "",
        reviewModeActive: config.reviewModeActive,
      });
    }
  }, [config, form]);

  function onSubmit(values: FormValues) {
    updateConfig.mutate({
      data: {
        globalAdEnabled: values.globalAdEnabled,
        activeAdNetwork: values.activeAdNetwork as GlobalConfigUpdateActiveAdNetwork,
        maxDailyAdUnlocks: values.maxDailyAdUnlocks,
        iosRewardUnitId: values.iosRewardUnitId || undefined,
        androidRewardUnitId: values.androidRewardUnitId || undefined,
        reviewModeActive: values.reviewModeActive,
      }
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out max-w-5xl">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Global Settings</h1>
        <p className="text-muted-foreground mt-1">Configure monetization, ad networks, and compliance overrides.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                    <Settings2 size={18} />
                  </div>
                  <CardTitle>Monetization Rules</CardTitle>
                </div>
                <CardDescription>Control how users unlock content globally.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="globalAdEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 shadow-sm bg-background">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">Enable Ads Globally</FormLabel>
                        <FormDescription>
                          Master switch for all rewarded and interstitial ads.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDailyAdUnlocks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Daily Ad Unlocks Per User</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Limit how many episodes a single user can unlock via ads per day.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activeAdNetwork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Ad Network</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admob">Google AdMob</SelectItem>
                          <SelectItem value="applovin">AppLovin MAX</SelectItem>
                          <SelectItem value="ironsource">ironSource</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The primary ad mediation network used in the mobile app.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md">
                      <Smartphone size={18} />
                    </div>
                    <CardTitle>Ad Unit IDs</CardTitle>
                  </div>
                  <CardDescription>Network-specific identifiers for rewarded video ads.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="iosRewardUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>iOS Reward Unit ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ca-app-pub-xxx/yyy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="androidRewardUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Android Reward Unit ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ca-app-pub-xxx/zzz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm border-l-4 border-l-amber-500">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
                      <ShieldCheck size={18} />
                    </div>
                    <CardTitle>App Store Review Mode</CardTitle>
                  </div>
                  <CardDescription>Bypass monetization walls during app review.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="reviewModeActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 shadow-sm bg-amber-500/5">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold text-amber-900 dark:text-amber-500">Enable Review Mode</FormLabel>
                          <FormDescription className="text-amber-800/80 dark:text-amber-500/80 max-w-[280px]">
                            When active, ads are simulated and all content is unlocked instantly.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateConfig.isPending} size="lg" className="font-semibold px-8 shadow-md">
              {updateConfig.isPending ? "Saving..." : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
