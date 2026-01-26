import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown, Building2, Wrench, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const [showTestAccounts, setShowTestAccounts] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Decorative blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute top-0 -right-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-40 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 glass rounded-xl border-white/50 hover:bg-white/50 min-h-11"
              data-testid="button-language-selector"
            >
              <Globe className="h-5 w-5 text-emerald-700" />
              <span className="text-base font-medium text-emerald-800">{i18n.language === 'sr' ? 'SR' : 'EN'}</span>
              <ChevronDown className="h-4 w-4 text-emerald-600 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong rounded-xl">
            <DropdownMenuItem
              onClick={() => handleLanguageChange('sr')}
              data-testid="option-language-sr"
              className={`rounded-lg ${i18n.language === 'sr' ? 'bg-emerald-100 text-emerald-800' : ''}`}
            >
              🇷🇸 Srpski
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLanguageChange('en')}
              data-testid="option-language-en"
              className={`rounded-lg ${i18n.language === 'en' ? 'bg-emerald-100 text-emerald-800' : ''}`}
            >
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        {/* Glass Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 w-full max-w-md shadow-xl">
          {/* Logo Section */}
          <div className="text-center mb-8">
            {/* Modern Logo Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-lg shadow-emerald-500/30">
                  <Building2 className="w-10 h-10 text-white absolute" style={{ top: '18px', left: '18px' }} />
                  <Wrench className="w-8 h-8 text-white/90 absolute" style={{ bottom: '14px', right: '14px' }} />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 blur-xl opacity-40 -z-10" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gradient mb-2">
              Hotel Management
            </h1>
            <p className="text-lg font-medium text-emerald-800 mb-1">
              {i18n.language === 'sr' ? 'Upravljanje hotelom' : 'Hotel Management System'}
            </p>
            <p className="text-muted-foreground text-sm">
              {i18n.language === 'sr' ? 'Prijavite se da nastavite' : 'Sign in to continue'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-emerald-800">
                {t('username')}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={i18n.language === 'sr' ? 'Unesite korisničko ime' : 'Enter username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 text-base rounded-xl border-emerald-200 bg-white/70 focus:border-emerald-500 focus:ring-emerald-500/20 placeholder:text-emerald-400"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-emerald-800">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={i18n.language === 'sr' ? 'Unesite lozinku' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base rounded-xl border-emerald-200 bg-white/70 focus:border-emerald-500 focus:ring-emerald-500/20 placeholder:text-emerald-400"
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-6 rounded-xl btn-gradient"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {i18n.language === 'sr' ? 'Prijavljivanje...' : 'Signing in...'}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>

          {/* Development Mode - Test Accounts */}
          {import.meta.env.DEV && (
            <div className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="w-full text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 min-h-11 rounded-xl"
              >
                {showTestAccounts ? '▼' : '▶'} Test nalozi (Dev Mode)
              </Button>

              {showTestAccounts && (
                <div className="mt-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/50">
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 font-semibold text-emerald-700 pb-2 border-b border-emerald-200">
                      <span>{t('username')}</span>
                      <span>Lozinka</span>
                      <span>Uloga</span>
                    </div>
                    {[
                      { user: 'admin', role: 'Admin' },
                      { user: 'aleksandar', role: 'Operater' },
                      { user: 'petar', role: 'Šef' },
                      { user: 'direktor', role: 'Menadžer' },
                      { user: 'jovan', role: 'Radnik' },
                      { user: 'marko', role: 'Serviser' },
                      { user: 'milica', role: 'Recepcioner' }
                    ].map(({ user, role }) => (
                      <div key={user} className="grid grid-cols-3 gap-2 text-emerald-600">
                        <span className="font-mono text-xs">{user}</span>
                        <span className="font-mono text-xs">pass...</span>
                        <span className="text-xs">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center relative z-10">
        <p className="text-xs text-emerald-600/70">
          © 2025 Hotel Management • {i18n.language === 'sr' ? 'Sva prava zadržana' : 'All rights reserved'}
        </p>
      </div>
    </div>
  );
}
