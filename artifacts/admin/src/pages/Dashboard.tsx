import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, PlaySquare, Eye, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Metrics and performance across your drama catalog.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Dramas",
      value: summary.totalDramas.toLocaleString(),
      icon: Film,
      description: "Published and unpublished",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Episodes",
      value: summary.totalEpisodes.toLocaleString(),
      icon: PlaySquare,
      description: "Across all dramas",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Total Views",
      value: summary.totalViews.toLocaleString(),
      icon: Eye,
      description: "All-time views",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Ad Unlocks Today",
      value: summary.adUnlocksToday.toLocaleString(),
      icon: Unlock,
      description: "Episodes unlocked via ads",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Metrics and performance across your drama catalog.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor} ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
