import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignIn } from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username,
        password,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onLogin();
      }
    } catch (error) {
      toast.error('Помилка входу. Перевірте дані.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-sm shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-primary">
              Sport CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              Система управління тренуваннями
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Логін
              </Label>
              <Input
                id="username"
                data-testid="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white border-zinc-200 focus:ring-2 focus:ring-primary/20 rounded-sm h-10 px-3"
                placeholder="Введіть логін"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Пароль
              </Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-zinc-200 focus:ring-2 focus:ring-primary/20 rounded-sm h-10 px-3"
                placeholder="Введіть пароль"
              />
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-orange-600 rounded-sm font-bold uppercase tracking-wide shadow-sm transition-transform active:scale-95 h-11"
            >
              {loading ? (
                'Завантаження...'
              ) : (
                <>
                  <SignIn size={20} className="mr-2" weight="bold" />
                  Увійти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-accent rounded-sm">
            <p className="text-xs text-center text-muted-foreground">
              Тестові дані: <span className="font-bold text-foreground">coach / coach123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;