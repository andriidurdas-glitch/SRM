import React, { useState, useEffect } from 'react';
import { ChartBar, Users, TrendUp, CurrencyDollar } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Statistics = () => {
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

  const attendanceData = [
    { name: 'Пн', value: 15 },
    { name: 'Вт', value: 18 },
    { name: 'Ср', value: 20 },
    { name: 'Чт', value: 17 },
    { name: 'Пт', value: 19 },
    { name: 'Сб', value: 22 },
    { name: 'Нд', value: 10 },
  ];

  const revenueData = [
    { month: 'Січ', value: 15000 },
    { month: 'Лют', value: 18000 },
    { month: 'Бер', value: 17000 },
    { month: 'Кві', value: 20000 },
    { month: 'Тра', value: 19000 },
    { month: 'Чер', value: 22000 },
  ];

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="statistics-page">
      <div className="mb-8">
        <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
          Статистика
        </h1>
        <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
          Аналітика та звіти
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Гравці
              </p>
              <p className="font-heading text-3xl font-bold">{stats.total_players}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-sm">
              <Users size={28} weight="duotone" className="text-primary" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Групи
              </p>
              <p className="font-heading text-3xl font-bold">{stats.total_groups}</p>
            </div>
            <div className="bg-zinc-100 p-3 rounded-sm">
              <ChartBar size={28} weight="duotone" className="text-zinc-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Сьогодні
              </p>
              <p className="font-heading text-3xl font-bold">{stats.today_attendance}</p>
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
                Дохід
              </p>
              <p className="font-heading text-2xl font-bold">{stats.month_revenue.toFixed(0)} ₴</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-sm">
              <CurrencyCircle size={28} weight="duotone" className="text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <h3 className="font-heading text-xl font-semibold uppercase tracking-tight mb-6">
            Відвідуваність по днях
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="name" stroke="#71717A" style={{ fontSize: '12px', fontFamily: 'Manrope' }} />
              <YAxis stroke="#71717A" style={{ fontSize: '12px', fontFamily: 'Manrope' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '4px',
                  fontFamily: 'Manrope',
                }}
              />
              <Bar dataKey="value" fill="#FF6600" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
          <h3 className="font-heading text-xl font-semibold uppercase tracking-tight mb-6">
            Дохід по місяцях
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="month" stroke="#71717A" style={{ fontSize: '12px', fontFamily: 'Manrope' }} />
              <YAxis stroke="#71717A" style={{ fontSize: '12px', fontFamily: 'Manrope' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '4px',
                  fontFamily: 'Manrope',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#FF6600" strokeWidth={3} dot={{ fill: '#FF6600', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
        <h3 className="font-heading text-xl font-semibold uppercase tracking-tight mb-4">
          Загальна аналітика
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-accent rounded-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Середня відвідуваність
            </p>
            <p className="font-heading text-2xl font-bold text-primary">85%</p>
          </div>
          <div className="p-4 bg-muted rounded-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Середній дохід на гравця
            </p>
            <p className="font-heading text-2xl font-bold">450 ₴</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Активних гравців
            </p>
            <p className="font-heading text-2xl font-bold text-emerald-600">{stats.total_players}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Statistics;