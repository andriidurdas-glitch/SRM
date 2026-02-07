import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, UserCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [groups, setGroups] = useState([]);
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
  });

  useEffect(() => {
    fetchPlayers();
    fetchGroups();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/players`);
      setPlayers(response.data);
      
      // Fetch stats for each player
      const statsPromises = response.data.map(player =>
        axios.get(`${BACKEND_URL}/api/statistics/player/${player.id}`)
          .then(res => ({ [player.id]: res.data }))
          .catch(() => ({ [player.id]: null }))
      );
      const statsResults = await Promise.all(statsPromises);
      const statsMap = Object.assign({}, ...statsResults);
      setPlayerStats(statsMap);
    } catch (error) {
      toast.error('Помилка завантаження гравців');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && currentPlayer) {
        await axios.put(`${BACKEND_URL}/api/players/${currentPlayer.id}`, formData);
        toast.success('Гравця оновлено');
      } else {
        await axios.post(`${BACKEND_URL}/api/players`, formData);
        toast.success('Гравця додано');
      }
      setDialogOpen(false);
      resetForm();
      fetchPlayers();
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити гравця?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/players/${id}`);
      toast.success('Гравця видалено');
      fetchPlayers();
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
    });
    setEditMode(false);
    setCurrentPlayer(null);
  };

  const getGroupName = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : 'Без групи';
  };

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="players-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Гравці
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Управління гравцями
          </p>
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
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Група</Label>
                <select
                  data-testid="player-group-select"
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                >
                  <option value="">Без групи</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
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
        {players.map((player) => (
          <Card key={player.id} data-testid={`player-card-${player.id}`} className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="bg-accent p-3 rounded-sm">
                <UserCircle size={32} weight="duotone" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-xl font-bold truncate">{player.full_name}</h3>
                <p className="text-sm text-muted-foreground">Рік: {player.birth_year}</p>
                <p className="text-sm text-muted-foreground truncate">{player.parent_contact}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mt-2">
                  {getGroupName(player.group_id)}
                </p>
              </div>
            </div>
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
        ))}
      </div>

      {players.length === 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <UserCircle size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">Гравців ще немає. Додайте першого!</p>
        </Card>
      )}
    </div>
  );
};

export default Players;