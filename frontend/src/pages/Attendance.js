import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar as CalendarIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Attendance = () => {
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [trainingDays, setTrainingDays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (selectedGroup && selectedDate) {
      fetchAttendance();
    }
  }, [selectedGroup, selectedDate]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/groups`);
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].id);
      }
    } catch (error) {
      toast.error('Помилка завантаження груп');
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/players`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance`, {
        params: { group_id: selectedGroup, date: selectedDate },
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (playerId, status) => {
    try {
      await axios.post(`${BACKEND_URL}/api/attendance`, {
        player_id: playerId,
        group_id: selectedGroup,
        date: selectedDate,
        status,
        notes: '',
      });
      toast.success('Відвідуваність відмічено');
      fetchAttendance();
    } catch (error) {
      toast.error('Помилка збереження');
    }
  };

  const getPlayerStatus = (playerId) => {
    const record = attendance.find((a) => a.player_id === playerId);
    return record ? record.status : null;
  };

  const groupPlayers = players.filter((p) => p.group_id === selectedGroup);

  return (
    <div className="max-w-7xl mx-auto" data-testid="attendance-page">
      <div className="mb-8">
        <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight">
          Відвідуваність
        </h1>
        <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
          Журнал відвідування тренувань
        </p>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Група</label>
            <select
              data-testid="attendance-group-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
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
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Дата</label>
            <input
              data-testid="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-sm h-10 px-3"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Завантаження...</div>
      ) : groupPlayers.length === 0 ? (
        <Card className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 text-center">
          <CalendarIcon size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">У цій групі немає гравців</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupPlayers.map((player) => {
            const status = getPlayerStatus(player.id);
            return (
              <Card
                key={player.id}
                data-testid={`attendance-player-${player.id}`}
                className="bg-white border border-zinc-200 rounded-sm shadow-sm p-5"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-bold truncate">{player.full_name}</h3>
                    <p className="text-sm text-muted-foreground">Рік: {player.birth_year}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => markAttendance(player.id, 'present')}
                      data-testid={`mark-present-${player.id}`}
                      className={`rounded-sm font-bold uppercase ${
                        status === 'present'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle size={20} weight={status === 'present' ? 'fill' : 'regular'} className="mr-2" />
                      Присутній
                    </Button>
                    <Button
                      onClick={() => markAttendance(player.id, 'absent')}
                      data-testid={`mark-absent-${player.id}`}
                      className={`rounded-sm font-bold uppercase ${
                        status === 'absent'
                          ? 'bg-destructive text-white hover:bg-red-600'
                          : 'bg-white border-2 border-destructive text-destructive hover:bg-red-50'
                      }`}
                    >
                      <XCircle size={20} weight={status === 'absent' ? 'fill' : 'regular'} className="mr-2" />
                      Відсутній
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Attendance;