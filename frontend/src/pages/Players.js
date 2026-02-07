import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, UserCircle, ArrowLeft, UsersThree } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Players = () => {
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [playerStats, setPlayerStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    birth_year: new Date().getFullYear() - 10,
    parent_contact: '',
    group_id: '',
    notes: '',
    jersey_number: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchPlayersForGroup(selectedGroup.id);
    }
  }, [selectedGroup]);

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

  const fetchPlayersForGroup = async (groupId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/players`);
      const groupPlayers = response.data.filter(p => p.group_id === groupId);
      setPlayers(groupPlayers);
      
      const statsPromises = groupPlayers.map(player =>
        axios.get(`${BACKEND_URL}/api/statistics/player/${player.id}`)
          .then(res => ({ [player.id]: res.data }))
          .catch(() => ({ [player.id]: null }))
      );
      const statsResults = await Promise.all(statsPromises);
      const statsMap = Object.assign({}, ...statsResults);
      setPlayerStats(statsMap);
    } catch (error) {
      toast.error('Помилка завантаження гравців');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData, group_id: selectedGroup.id };
      if (editMode && currentPlayer) {
        await axios.put(`${BACKEND_URL}/api/players/${currentPlayer.id}`, submitData);
        toast.success('Гравця оновлено');
      } else {
        await axios.post(`${BACKEND_URL}/api/players`, submitData);
        toast.success('Гравця додано');
      }
      setDialogOpen(false);
      resetForm();
      fetchPlayersForGroup(selectedGroup.id);
      fetchGroups();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const handleEdit = (player) => {
    setEditMode(true);
    setCurrentPlayer(player);
    setFormData({
      full_name: player.full_name,
      birth_year: player.birth_year,
      parent_contact: player.parent_contact,
      group_id: player.group_id || '',
      notes: player.notes || '',
      jersey_number: player.jersey_number || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити гравця?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/players/${id}`);
      toast.success('Гравця видалено');
      fetchPlayersForGroup(selectedGroup.id);
      fetchGroups();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      birth_year: new Date().getFullYear() - 10,
      parent_contact: '',
      group_id: '',
      notes: '',
      jersey_number: '',
    });
    setEditMode(false);
    setCurrentPlayer(null);
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-destructive';
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setPlayers([]);
    setPlayerStats({});
  };

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  // Show groups list
  if (!selectedGroup) {
    return (
      <div className="max-w-7xl mx-auto" data-testid="players-page">
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Гравці
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Оберіть групу щоб побачити гравців
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card
              key={group.id}
              data-testid={`group-selector-${group.id}`}
              onClick={() => setSelectedGroup(group)}
              className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-sm">
                  <UsersThree size={32} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold uppercase tracking-tight">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Гравців: {group.player_count}</p>
                  {group.schedule && (
                    <p className="text-xs text-muted-foreground mt-2">{group.schedule}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
            <UsersThree size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
            <p className="text-muted-foreground">Спочатку створіть групи в розділі "Групи"</p>
          </Card>
        )}
      </div>
    );
  }

  // Show players for selected group
  return (
    <div className="max-w-7xl mx-auto" data-testid="players-list-page">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToGroups}
            data-testid="back-to-groups-button"
            variant="outline"
            className="rounded-sm"
          >
            <ArrowLeft size={20} className="mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
              {selectedGroup.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              {players.length} {players.length === 1 ? 'гравець' : 'гравців'}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-player-button"
              className="bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                {editMode ? 'Редагувати гравця' : 'Додати гравця'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">ПІБ</Label>
                <Input
                  data-testid="player-name-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Рік народження</Label>
                <Input
                  data-testid="player-birth-year-input"
                  type="number"
                  value={formData.birth_year}
                  onChange={(e) => setFormData({ ...formData, birth_year: parseInt(e.target.value) })}
                  required
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Контакт батьків</Label>
                <Input
                  data-testid="player-contact-input"
                  value={formData.parent_contact}
                  onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
                  required
                  className="rounded-sm"
                  placeholder="+380..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Нотатки</Label>
                <textarea
                  data-testid="player-notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm p-3 min-h-[80px]"
                />
              </div>
              <Button
                type="submit"
                data-testid="player-submit-button"
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                {editMode ? 'Оновити' : 'Додати'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => {
          const stats = playerStats[player.id];
          return (
            <Card key={player.id} data-testid={`player-card-${player.id}`} className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="bg-accent p-3 rounded-sm">
                  <UserCircle size={32} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-xl font-bold truncate">
                    {player.full_name}{player.jersey_number ? ` — №${player.jersey_number}` : ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">Рік: {player.birth_year}</p>
                  <p className="text-sm text-muted-foreground truncate">{player.parent_contact}</p>
                </div>
              </div>
              
              {stats && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-50 rounded-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Відвідуваність</p>
                    <p className={`font-heading text-2xl font-bold ${
                      stats.attendance_rate >= 80 ? 'text-emerald-600' :
                      stats.attendance_rate >= 60 ? 'text-orange-600' : 'text-destructive'
                    }`}>{stats.attendance_rate}%</p>
                    <p className="text-xs text-muted-foreground">{stats.present_count}/{stats.total_sessions}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Оплачено</p>
                    <p className="font-heading text-lg font-bold text-primary">{stats.total_paid}₴</p>
                    <p className="text-xs text-muted-foreground">{stats.payment_count} платежів</p>
                  </div>
                </div>
              )}
              
              {player.notes && (
                <div className="mt-4 p-3 bg-muted rounded-sm">
                  <p className="text-xs text-muted-foreground">{player.notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleEdit(player)}
                  data-testid={`edit-player-${player.id}`}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-sm border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Pencil size={16} className="mr-1" />
                  Редагувати
                </Button>
                <Button
                  onClick={() => handleDelete(player.id)}
                  data-testid={`delete-player-${player.id}`}
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

      {players.length === 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <UserCircle size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">У цій групі ще немає гравців. Додайте першого!</p>
        </Card>
      )}
    </div>
  );
};

export default Players;