import React, { useState, useEffect } from 'react';
import { Plus, CurrencyDollar, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    player_id: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPlayers();
    fetchPayments();
  }, [selectedMonth]);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/players`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/payments`, {
        params: { month: selectedMonth },
      });
      setPayments(response.data);
    } catch (error) {
      toast.error('Помилка завантаження платежів');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/payments`, formData);
      toast.success('Платіж зареєстровано');
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const resetForm = () => {
    setFormData({
      player_id: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7),
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.full_name : 'Невідомо';
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="finance-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Фінанси
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Облік оплат та доходів
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-payment-button"
              className="bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                Зареєструвати платіж
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Гравець</Label>
                <select
                  data-testid="payment-player-select"
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                >
                  <option value="">Оберіть гравця</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Сума (грн)</Label>
                <Input
                  data-testid="payment-amount-input"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                  className="rounded-sm"
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Місяць</Label>
                <input
                  data-testid="payment-month-input"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Дата оплати</Label>
                <input
                  data-testid="payment-date-input"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Примітки</Label>
                <textarea
                  data-testid="payment-notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm p-3 min-h-[80px]"
                />
              </div>
              <Button
                type="submit"
                data-testid="payment-submit-button"
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                Зареєструвати
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Загальний дохід
            </p>
            <p className="font-heading text-3xl font-bold text-primary">{totalRevenue.toFixed(2)} ₴</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Фільтр по місяцю</label>
            <input
              data-testid="finance-month-filter"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-zinc-200 rounded-sm h-10 px-3"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {payments.map((payment) => (
          <Card
            key={payment.id}
            data-testid={`payment-card-${payment.id}`}
            className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-sm">
                  <CurrencyCircle size={24} className="text-primary" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold">{getPlayerName(payment.player_id)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl font-bold text-primary">{payment.amount.toFixed(2)} ₴</p>
                <p className="text-xs text-muted-foreground uppercase">{payment.month}</p>
              </div>
            </div>
            {payment.notes && (
              <div className="mt-3 p-3 bg-muted rounded-sm">
                <p className="text-xs text-muted-foreground">{payment.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {payments.length === 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <CurrencyCircle size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">Платежів за цей місяць не знайдено</p>
        </Card>
      )}
    </div>
  );
};

export default Finance;