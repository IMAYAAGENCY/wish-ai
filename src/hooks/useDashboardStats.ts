import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalClicks: number;
  totalCommissions: number;
  topKeywords: Array<{ keyword: string; count: number }>;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalClicks: 0,
    totalCommissions: 0,
    topKeywords: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch total affiliate clicks
      const { count: clicksCount, error: clicksError } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true });

      if (clicksError) throw clicksError;

      // Fetch total commissions sum
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount');

      if (commissionsError) throw commissionsError;

      const totalCommissions = commissionsData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Fetch today's top searched keywords
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: searchesData, error: searchesError } = await supabase
        .from('user_searches')
        .select('query')
        .gte('created_at', today.toISOString());

      if (searchesError) throw searchesError;

      // Count keyword frequencies
      const keywordCounts: Record<string, number> = {};
      searchesData?.forEach((search) => {
        const keyword = search.query.toLowerCase().trim();
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });

      // Sort and get top 5
      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

      setStats({
        totalUsers: usersCount || 0,
        totalClicks: clicksCount || 0,
        totalCommissions,
        topKeywords,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, error, refetch: fetchStats };
};
