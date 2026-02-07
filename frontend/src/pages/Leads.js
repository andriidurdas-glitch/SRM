import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, UserPlus, Phone, PaperPlaneTilt, CheckCircle, Clock, Question, XCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [groups, setGroups] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [convertData, setConvertData] = useState({
    group_id: '',
    birth_year: new Date().getFullYear() - 10
  });
  const [formData, setFormData] = useState({
    child_name: '',
    parent_contact: '',
    trial_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchLeads();
    fetchGroups();
    fetchStatistics();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leads`);
      setLeads(response.data);
    } catch (error) {
      toast.error('Помилка завантаження заявок');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
      if (response.data.length > 0) {
        setConvertData(prev => ({ ...prev, group_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leads/statistics/overview`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && currentLead) {
        await axios.put(`${BACKEND_URL}/api/leads/${currentLead.id}`, formData);
        toast.success('Заявку оновлено');
      } else {
        await axios.post(`${BACKEND_URL}/api/leads`, formData);
        toast.success('Заявку додано');
      }
      setDialogOpen(false);
      resetForm();
      fetchLeads();
      fetchStatistics();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    try {
      await axios.post(
        `${BACKEND_URL}/api/leads/${selectedLead.id}/convert`,
        null,
        { params: convertData }
      );
      toast.success('Гравця успішно додано!');
      setConvertDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
      fetchStatistics();
    } catch (error) {
      toast.error('Помилка конвертації');
    }
  };

  const handleEdit = (lead) => {
    setEditMode(true);
    setCurrentLead(lead);
    setFormData({
      child_name: lead.child_name,
      parent_contact: lead.parent_contact,
      trial_date: lead.trial_date,
      notes: lead.notes || '',
      status: lead.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити заявку?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/leads/${id}`);
      toast.success('Заявку видалено');
      fetchLeads();
      fetchStatistics();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({
      child_name: '',
      parent_contact: '',
      trial_date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'scheduled'
    });
    setEditMode(false);
    setCurrentLead(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'attended': return <CheckCircle size={20} weight="fill" className="text-emerald-600" />;
      case 'thinking': return <Question size={20} weight="fill" className="text-orange-600" />;
      case 'converted': return <UserPlus size={20} weight="fill" className="text-primary" />;
      case 'no_show': return <XCircle size={20} weight="fill" className="text-destructive" />;
      default: return <Clock size={20} weight="fill" className="text-zinc-500" />;
    }
  };

  const getStatusText = (status) => {
    const statuses = {
      scheduled: 'Заплановано',
      attended: 'Прийшов',
      thinking: 'Думає',
      converted: 'Записався',
      no_show: 'Не прийшов'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Завантаження...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="leads-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Пробні тренування
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            Управління заявками на пробні
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-lead-button"
              className="bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide"
            >
              <Plus size={20} weight="bold" className="mr-2" />Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                {editMode ? 'Редагувати заявку' : 'Нова заявка'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ім'я дитини</Label>
                <Input
                  data-testid="lead-name-input"
                  value={formData.child_name}
                  onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                  required
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Телефон батьків</Label>
                <Input
                  data-testid="lead-contact-input"
                  value={formData.parent_contact}
                  onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
                  required
                  className="rounded-sm"
                  placeholder="+380..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Дата пробного</Label>
                <input
                  data-testid="lead-date-input"
                  type="date"
                  value={formData.trial_date}
                  onChange={(e) => setFormData({ ...formData, trial_date: e.target.value })}
                  required
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Статус</Label>
                <select
                  data-testid="lead-status-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                >
                  <option value="scheduled">Заплановано</option>
                  <option value="attended">Прийшов</option>
                  <option value="thinking">Думає</option>
                  <option value="no_show">Не прийшов</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Нотатки</Label>
                <textarea
                  data-testid="lead-notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm p-3 min-h-[80px]"
                />
              </div>
              <Button
                type="submit"
                data-testid="lead-submit-button"
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                {editMode ? 'Оновити' : 'Додати'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Всього заявок</p>
            <p className="font-heading text-3xl font-bold">{statistics.total_leads}</p>
          </Card>
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Прийшло</p>
            <p className="font-heading text-3xl font-bold text-emerald-600">{statistics.status_counts.attended}</p>
          </Card>
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Записалось</p>
            <p className="font-heading text-3xl font-bold text-primary">{statistics.status_counts.converted}</p>
          </Card>
          <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Конверсія</p>
            <p className="font-heading text-3xl font-bold text-primary">{statistics.conversion_rate}%</p>
          </Card>
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} data-testid={`lead-card-${lead.id}`} className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(lead.status)}
                  <h3 className="font-heading text-xl font-bold">{lead.child_name}</h3>
                  <span className="text-xs px-2 py-1 bg-zinc-100 rounded-sm uppercase font-bold">
                    {getStatusText(lead.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Дата: {new Date(lead.trial_date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <div className="flex gap-2 mt-2">
                  <a
                    href={`tel:${lead.parent_contact}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Phone size={16} weight="fill" />
                    {lead.parent_contact}
                  </a>
                  <a
                    href={`https://t.me/${lead.parent_contact.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <PaperPlaneTilt size={16} weight="fill" />
                    Telegram
                  </a>
                </div>
                {lead.notes && (
                  <div className="mt-3 p-2 bg-muted rounded-sm">
                    <p className="text-xs text-muted-foreground">{lead.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {lead.status !== 'converted' && (
                  <Button
                    onClick={() => {
                      setSelectedLead(lead);
                      setConvertDialogOpen(true);
                    }}
                    data-testid={`convert-lead-${lead.id}`}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-sm font-bold uppercase"
                  >
                    <UserPlus size={16} className="mr-1" />
                    Записати
                  </Button>
                )}
                <Button
                  onClick={() => handleEdit(lead)}
                  data-testid={`edit-lead-${lead.id}`}
                  variant="outline"
                  className="rounded-sm border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  onClick={() => handleDelete(lead.id)}
                  data-testid={`delete-lead-${lead.id}`}
                  variant="outline"
                  className="rounded-sm border-2 border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {leads.length === 0 && (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <UserPlus size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">Ще немає заявок на пробні тренування</p>
        </Card>
      )}

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold uppercase">
              Записати гравця
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <p className="text-sm"><strong>Дитина:</strong> {selectedLead.child_name}</p>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Група</Label>
                <select
                  value={convertData.group_id}
                  onChange={(e) => setConvertData({ ...convertData, group_id: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Рік народження</Label>
                <Input
                  type="number"
                  value={convertData.birth_year}
                  onChange={(e) => setConvertData({ ...convertData, birth_year: parseInt(e.target.value) })}
                  className="rounded-sm"
                />
              </div>
              <Button
                onClick={handleConvert}
                className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase"
              >
                Записати гравцем
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;