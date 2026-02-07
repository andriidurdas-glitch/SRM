import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, UsersThree, ChartBar } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [groupStats, setGroupStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedGroupStats, setSelectedGroupStats] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    description: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
      
      // Fetch stats for each group
      const statsPromises = response.data.map(group =>
        axios.get(`${BACKEND_URL}/api/statistics/group/${group.id}`)
          .then(res => ({ [group.id]: res.data }))
          .catch(() => ({ [group.id]: null }))
      );
      const statsResults = await Promise.all(statsPromises);
      const statsMap = Object.assign({}, ...statsResults);
      setGroupStats(statsMap);
    } catch (error) {
      toast.error('Помилка завантаження груп');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && currentGroup) {
        await axios.put(`${BACKEND_URL}/api/groups/${currentGroup.id}`, formData);
        toast.success('Групу оновлено');
      } else {
        await axios.post(`${BACKEND_URL}/api/groups`, formData);
        toast.success('Групу додано');
      }
      setDialogOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const handleEdit = (group) => {
    setEditMode(true);
    setCurrentGroup(group);
    setFormData({
      name: group.name,
      schedule: group.schedule || '',
      description: group.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити групу?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/groups/${id}`);
      toast.success('Групу видалено');
      fetchGroups();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      schedule: '',
      description: '',
    });
    setEditMode(false);
    setCurrentGroup(null);
  };

  const viewGroupStats = (groupId) => {
    const stats = groupStats[groupId];
    if (stats) {
      setSelectedGroupStats(stats);
      setStatsDialogOpen(true);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="groups-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Групи
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Управління тренувальними групами
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-group-button"
              className="bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                {editMode ? 'Редагувати групу' : 'Додати групу'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Назва групи</Label>
                <Input
                  data-testid="group-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-sm"
                  placeholder="Наприклад: U-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Розклад</Label>
                <Input
                  data-testid="group-schedule-input"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="rounded-sm"
                  placeholder="Наприклад: Пн, Ср, Пт 18:00-19:30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Опис</Label>
                <textarea
                  data-testid="group-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm p-3 min-h-[80px]"
                  placeholder="Додаткова інформація про групу"
                />
              </div>
              <Button
                type="submit"
                data-testid="group-submit-button"
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                {editMode ? 'Оновити' : 'Додати'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const stats = groupStats[group.id];
          return (
            <Card key={group.id} data-testid={`group-card-${group.id}`} className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-zinc-100 p-3 rounded-sm">
                  <UsersThree size={32} weight="duotone" className="text-zinc-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-xl font-bold truncate">{group.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="bg-primary/10 px-3 py-1 rounded-sm">
                      <p className="text-sm font-bold text-primary">
                        👥 {group.player_count} {group.player_count === 1 ? 'гравець' : group.player_count < 5 ? 'гравці' : 'гравців'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {stats && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-50 rounded-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Відвідуваність</p>
                    <p className="font-heading text-2xl font-bold text-emerald-600">{stats.attendance_rate}%</p>
                    <p className="text-xs text-muted-foreground">{stats.present_count}/{stats.total_attendance_records}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Дохід</p>
                    <p className="font-heading text-lg font-bold text-primary">{stats.total_revenue}₴</p>
                    <p className="text-xs text-muted-foreground">{stats.total_sessions} сесій</p>
                  </div>
                </div>
              )}
              
              {group.schedule && (
                <div className="mt-4 p-3 bg-accent rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Розклад</p>
                  <p className="text-sm text-foreground">{group.schedule}</p>
                </div>
              )}
              {group.description && (
                <div className="mt-3 p-3 bg-muted rounded-sm">
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                {stats && stats.player_stats && stats.player_stats.length > 0 && (
                  <Button
                    onClick={() => viewGroupStats(group.id)}
                    data-testid={`view-stats-${group.id}`}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-sm border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <ChartBar size={16} className="mr-1" />
                    Статистика
                  </Button>
                )}
                <Button
                  onClick={() => handleEdit(group)}
                  data-testid={`edit-group-${group.id}`}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-sm border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Pencil size={16} className="mr-1" />
                  Редагувати
                </Button>
                <Button
                  onClick={() => handleDelete(group.id)}
                  data-testid={`delete-group-${group.id}`}
                  variant="outline"
                  size="sm"
                  className="rounded-sm border-2 border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Group Statistics Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold uppercase">
              Детальна статистика групи
            </DialogTitle>
          </DialogHeader>
          {selectedGroupStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Відвідуваність</p>
                  <p className="font-heading text-3xl font-bold text-emerald-600">{selectedGroupStats.attendance_rate}%</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Дохід</p>
                  <p className="font-heading text-2xl font-bold text-primary">{selectedGroupStats.total_revenue}₴</p>
                </div>
                <div className="p-4 bg-zinc-100 rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Тренувань</p>
                  <p className="font-heading text-2xl font-bold">{selectedGroupStats.total_sessions}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-heading text-lg font-semibold uppercase mb-3">Статистика по гравцях</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedGroupStats.player_stats.map((pStat, idx) => (
                    <div key={pStat.player_id} className="flex items-center justify-between p-3 bg-muted rounded-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground">#{idx + 1}</span>
                        <div>
                          <p className="font-medium">{pStat.player_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pStat.present_count}/{pStat.total_sessions} тренувань
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-heading text-xl font-bold ${
                          pStat.attendance_rate >= 80 ? 'text-emerald-600' :
                          pStat.attendance_rate >= 60 ? 'text-orange-600' : 'text-destructive'
                        }`}>
                          {pStat.attendance_rate}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {groups.length === 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <UsersThree size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">Груп ще немає. Створіть першу!</p>
        </Card>
      )}
    </div>
  );
};

export default Groups;