import React, { useState, useEffect } from 'react';
import { Users, UsersThree, Check, CurrencyCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_players: 0,
    total_groups: 0,
    today_attendance: 0,
    month_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/statistics/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Всього гравців',
      value: stats.total_players,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Активних груп',
      value: stats.total_groups,
      icon: UsersThree,
      color: 'text-zinc-700',
      bgColor: 'bg-zinc-100',
    },
    {
      title: 'Присутні сьогодні',
      value: stats.today_attendance,
      icon: Check,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Дохід цього місяця',
      value: `${stats.month_revenue.toFixed(0)} ₴`,
      icon: CurrencyCircle,
      color: 'text-primary',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Головна панель
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
          Головна панель
        </h1>
        <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
          Огляд статистики та діяльності
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              data-testid={`stat-card-${index}`}
              className="stat-card bg-white border border-zinc-200 rounded-sm shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {card.title}
                  </p>
                  <p className="font-heading text-3xl font-bold tracking-tight">{card.value}</p>
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-sm`}>
                  <Icon size={28} weight="duotone" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <h3 className="font-heading text-2xl font-semibold uppercase tracking-tight mb-4">
            Швидкі дії
          </h3>
          <div className="space-y-3">
            <a
              href="/players"
              className="block p-4 bg-accent hover:bg-accent/70 rounded-sm transition-colors"
            >
              <p className="font-medium text-foreground">Додати нового гравця</p>
            </a>
            <a
              href="/attendance"
              className="block p-4 bg-accent hover:bg-accent/70 rounded-sm transition-colors"
            >
              <p className="font-medium text-foreground">Відмітити відвідуваність</p>
            </a>
            <a
              href="/finance"
              className="block p-4 bg-accent hover:bg-accent/70 rounded-sm transition-colors"
            >
              <p className="font-medium text-foreground">Зареєструвати оплату</p>
            </a>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <h3 className="font-heading text-2xl font-semibold uppercase tracking-tight mb-4">
            Останні оновлення
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Тут буде інформація про останні зміни в системі</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;