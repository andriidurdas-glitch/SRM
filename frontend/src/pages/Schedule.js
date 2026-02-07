import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Schedule = () => {
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    group_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:30',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchGroups();
    fetchSessions();
  }, [selectedDate]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, group_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sessions`, {
        params: { date: selectedDate },
      });
      setSessions(response.data);
    } catch (error) {
      toast.error('Помилка завантаження розкладу');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/sessions`, formData);
      toast.success('Тренування додано');
      setDialogOpen(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const resetForm = () => {
    setFormData({
      group_id: groups.length > 0 ? groups[0].id : '',
      date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '19:30',
      location: '',
      notes: '',
    });
  };

  const getGroupName = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : 'Невідома група';
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  if (loading && sessions.length === 0) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="schedule-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Розклад
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Календар тренувань
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-session-button"
              className="bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                Нове тренування
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Група</Label>
                <select
                  data-testid="session-group-select"
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Дата</Label>
                <input
                  data-testid="session-date-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Початок</Label>
                  <input
                    data-testid="session-start-time-input"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Кінець</Label>
                  <input
                    data-testid="session-end-time-input"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Місце</Label>
                <Input
                  data-testid="session-location-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="rounded-sm"
                  placeholder="Наприклад: Стадіон Центральний"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Примітки</Label>
                <textarea
                  data-testid="session-notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm p-3 min-h-[80px]"
                />
              </div>
              <Button
                type="submit"
                data-testid="session-submit-button"
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                Додати
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button onClick={goToPreviousDay} variant="outline" className="rounded-sm">
            ← Попередній день
          </Button>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold uppercase tracking-tight">
              {new Date(selectedDate).toLocaleDateString('uk-UA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Button
              onClick={goToToday}
              variant="link"
              className="text-primary text-xs uppercase mt-1"
              data-testid="go-to-today-button"
            >
              Сьогодні
            </Button>
          </div>
          <Button onClick={goToNextDay} variant="outline" className="rounded-sm">
            Наступний день →
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
            <CalendarIcon size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
            <p className="text-muted-foreground">Немає запланованих тренувань на цей день</p>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card
              key={session.id}
              data-testid={`session-card-${session.id}`}
              className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-sm">
                  <CalendarIcon size={32} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold uppercase tracking-tight">
                    {getGroupName(session.group_id)}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{session.start_time} - {session.end_time}</span>
                    </div>
                    {session.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{session.location}</span>
                      </div>
                    )}
                  </div>
                  {session.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-sm">
                      <p className="text-xs text-muted-foreground">{session.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Schedule;