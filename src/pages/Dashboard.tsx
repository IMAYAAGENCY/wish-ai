import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, MousePointerClick, DollarSign, TrendingUp, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { stats, isLoading, error } = useDashboardStats();
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your WISH AI platform metrics</p>
          </div>
          <Button
            onClick={() => navigate('/linkedin-test')}
            variant="outline"
            className="gap-2"
          >
            <Linkedin className="w-4 h-4" />
            Test LinkedIn Post
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Affiliate Clicks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affiliate Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalClicks}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total clicks tracked</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Commissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${stats.totalCommissions.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total earned</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Today's Top Keywords Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Keywords Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.topKeywords.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique searches</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords Table */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Top Searched Keywords</CardTitle>
            <CardDescription>Most popular search terms from today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats.topKeywords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No searches recorded today yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats.topKeywords.map((item, index) => (
                  <div
                    key={item.keyword}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-foreground capitalize">
                        {item.keyword}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Searches:</span>
                      <span className="font-bold text-foreground">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
