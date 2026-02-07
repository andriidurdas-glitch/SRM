import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendUp, CurrencyDollar, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GroupAnalytics = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [analytics, setAnalytics] = useState(null);
  const [groupStats, setGroupStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchAnalytics();
    }
  }, [selectedGroup, selectedMonth]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
    } catch (error) {
      toast.error('Помилка завантаження груп');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [financeRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/finance/dashboard`, { params: { month: selectedMonth } }),
        axios.get(`${BACKEND_URL}/api/statistics/group/${selectedGroup.id}`)
      ]);
      
      setAnalytics(financeRes.data);
      setGroupStats(statsRes.data);
    } catch (error) {
      toast.error('Помилка завантаження аналітики');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  if (!selectedGroup) {
    return (
      <div className="max-w-7xl mx-auto" data-testid="group-analytics-page">
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Аналітика по групах
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Оберіть групу для перегляду детальної статистики
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card
              key={group.id}
              data-testid={`analytics-group-${group.id}`}
              onClick={() => setSelectedGroup(group)}
              className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-sm">
                  <Users size={32} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold uppercase tracking-tight">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Гравців: {group.player_count}</p>
                  {group.monthly_fee > 0 && (
                    <p className="text-sm font-bold text-primary mt-2">{group.monthly_fee}₴/міс</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const groupRevenue = analytics?.group_revenue?.[selectedGroup.id] || {};
  const debtorsForGroup = analytics?.debtors?.filter(d => d.group_id === selectedGroup.id) || [];

  return (
    <div className="max-w-7xl mx-auto" data-testid="group-analytics-detail">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={() => setSelectedGroup(null)}
          data-testid="back-button"
          variant="outline"
          className="rounded-sm"
        >
          <ArrowLeft size={20} className="mr-2" />
          Назад
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            {selectedGroup.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Аналітика за {new Date(selectedMonth + '-01').toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Місяць</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            data-testid="month-selector"
            className="bg-white border border-zinc-200 rounded-sm h-10 px-3"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Гравців у групі
              </p>
              <p className="font-heading text-3xl font-bold">{selectedGroup.player_count}</p>
            </div>
            <div className="bg-zinc-100 p-3 rounded-sm">
              <Users size={28} weight="duotone" className="text-zinc-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Відвідуваність
              </p>
              <p className="font-heading text-3xl font-bold text-emerald-600">
                {groupStats?.attendance_rate || 0}%
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-sm">
              <TrendUp size={28} weight="duotone" className="text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Дохід за місяць
              </p>
              <p className="font-heading text-3xl font-bold text-primary">
                {groupRevenue.revenue || 0}₴
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-sm">
              <CurrencyCircle size={28} weight="duotone" className="text-primary" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Середній чек
              </p>
              <p className="font-heading text-3xl font-bold">
                {groupRevenue.payment_count > 0 
                  ? Math.round(groupRevenue.revenue / groupRevenue.payment_count)
                  : 0}₴
              </p>
            </div>
            <div className="bg-zinc-100 p-3 rounded-sm">
              <CurrencyCircle size={28} weight="duotone" className="text-zinc-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Debtors Section */}
      {debtorsForGroup.length > 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-destructive/10 p-2 rounded-sm">
              <Warning size={24} weight="duotone" className="text-destructive" />
            </div>
            <h3 className="font-heading text-xl font-semibold uppercase tracking-tight">
              Боржники ({debtorsForGroup.length})
            </h3>
          </div>
          <div className="space-y-2">
            {debtorsForGroup.map((debtor) => (
              <div
                key={debtor.player_id}
                data-testid={`debtor-${debtor.player_id}`}
                className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-sm"
              >
                <div>
                  <p className="font-medium">{debtor.player_name}</p>
                  <p className="text-xs text-muted-foreground">{debtor.parent_contact}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-xl font-bold text-destructive">{debtor.debt_amount}₴</p>
                  <p className="text-xs text-muted-foreground">борг</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Player Statistics Chart */}
      {groupStats && groupStats.player_stats && groupStats.player_stats.length > 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <h3 className="font-heading text-xl font-semibold uppercase tracking-tight mb-6">
            Відвідуваність гравців
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupStats.player_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis 
                dataKey="player_name" 
                stroke="#71717A" 
                style={{ fontSize: '12px', fontFamily: 'Manrope' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#71717A" style={{ fontSize: '12px', fontFamily: 'Manrope' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '4px',
                  fontFamily: 'Manrope',
                }}
              />
              <Bar dataKey="attendance_rate" fill="#FF6600" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

export default GroupAnalytics;