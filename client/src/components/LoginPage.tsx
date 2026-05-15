import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown, Loader2 } from 'lucide-react';

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
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: '#0F2040',
        backgroundImage:
          'radial-gradient(ellipse 50% 35% at 18% 0%, rgba(195, 149, 76, 0.35), transparent 60%),' +
          'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(195, 149, 76, 0.20), transparent 60%),' +
          'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(60, 95, 145, 0.40), transparent 70%),' +
          'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
      }}
    >
      {/* Soft floating gold orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.20) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.14) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-gold-500/30 bg-white/10 backdrop-blur-md text-gold-100 hover:bg-white/20 hover:text-white min-h-11"
              data-testid="button-language-selector"
            >
              <Globe className="h-5 w-5 text-gold-400" />
              <span className="text-base font-medium">{i18n.language === 'sr' ? 'SR' : 'EN'}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl bg-emerald-950/95 backdrop-blur-md border-gold-500/30 text-white">
            <DropdownMenuItem
              onClick={() => handleLanguageChange('sr')}
              data-testid="option-language-sr"
              className={`rounded-lg ${i18n.language === 'sr' ? 'bg-gold-500/20 text-gold-200' : 'text-white/80'}`}
            >
              🇷🇸 Srpski
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLanguageChange('en')}
              data-testid="option-language-en"
              className={`rounded-lg ${i18n.language === 'en' ? 'bg-gold-500/20 text-gold-200' : 'text-white/80'}`}
            >
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        {/* Glass Card */}
        <div className="rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-2xl border border-gold-500/20 ring-1 ring-white/10">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                {/* Soft gold halo behind the logo */}
                <div className="absolute inset-0 rounded-3xl blur-2xl" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.55) 0%, transparent 70%)' }} />
                <img
                  src="/icon-512.webp"
                  alt="Hotel"
                  className="relative w-24 h-24 rounded-3xl shadow-xl ring-1 ring-gold-500/30"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              <span className="text-emerald-900">Hotel </span>
              <span className="text-gold-600">Management</span>
            </h1>
            <p className="text-base font-medium text-emerald-900/80 mb-1">
              {i18n.language === 'sr' ? 'Upravljanje hotelom' : 'Hotel Management System'}
            </p>
            <p className="text-emerald-900/50 text-sm">
              {i18n.language === 'sr' ? 'Prijavite se da nastavite' : 'Sign in to continue'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-emerald-900">
                {t('username')}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={i18n.language === 'sr' ? 'Unesite korisničko ime' : 'Enter username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 text-base rounded-xl border-emerald-900/15 bg-white focus:border-gold-500 focus:ring-gold-500/20 placeholder:text-emerald-900/30"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-emerald-900">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={i18n.language === 'sr' ? 'Unesite lozinku' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base rounded-xl border-emerald-900/15 bg-white focus:border-gold-500 focus:ring-gold-500/20 placeholder:text-emerald-900/30"
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-lg shadow-emerald-900/30"
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

          {/* Test Accounts — visible in production too so klijenti mogu
              da probaju različite uloge bez pravljenja pravih naloga.
              Sve test lozinke su 111111. */}
          {(
            <div className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="w-full text-sm text-gold-700 hover:text-gold-800 hover:bg-gold-50/60 min-h-11 rounded-xl"
              >
                {showTestAccounts ? '▼' : '▶'} Demo nalozi — probajte aplikaciju
              </Button>

              {showTestAccounts && (
                <div className="mt-3 p-4 rounded-xl bg-emerald-50/50 border border-gold-500/20">
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 font-semibold text-emerald-900 pb-2 border-b border-gold-500/30">
                      <span>{t('username')}</span>
                      <span>Lozinka</span>
                      <span>Uloga</span>
                    </div>
                    {[
                      { user: 'admin',           role: 'Administrator' },
                      { user: 'operater',        role: 'Operater' },
                      { user: 'recepcioner',     role: 'Recepcioner' },
                      { user: 'sef_tehnicke',    role: 'Šef tehničke' },
                      { user: 'sef_domacinstva', role: 'Šef domaćinstva' },
                      { user: 'serviser1',       role: 'Serviser' },
                      { user: 'radnik1',         role: 'Radnik' },
                      { user: 'sobarica1',       role: 'Sobarica' },
                      { user: 'guest_display',   role: 'Guest Display' },
                    ].map(({ user, role }) => (
                      <div key={user} className="grid grid-cols-3 gap-2 text-emerald-900/80">
                        <span className="font-mono text-xs">{user}</span>
                        <span className="font-mono text-xs text-gold-700">111111</span>
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
        <p className="text-xs text-gold-300/40 tracking-wide">
          © 2025 Hotel Management • {i18n.language === 'sr' ? 'Sva prava zadržana' : 'All rights reserved'}
        </p>
      </div>
    </div>
  );
}
