import { useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Wrench, LogOut, ArrowLeft } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import HousekeepingSupervisorDashboard from './HousekeepingSupervisorDashboard';

type ModuleType = 'selector' | 'domacinstvo' | 'tehnicka';

export default function AdminModuleSelector() {
  const { user, logout } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('selector');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const BackButton = () => (
    <button
      onClick={() => setSelectedModule('selector')}
      className="fixed top-20 left-4 z-[100] flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium">Nazad na izbor</span>
    </button>
  );

  // If Domacinstvo module is selected
  if (selectedModule === 'domacinstvo') {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="success">
            <IonTitle>Domacinstvo</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => setSelectedModule('selector')}>
                <ArrowLeft className="w-5 h-5 mr-1" />
                Nazad
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <HousekeepingSupervisorDashboard />
        </IonContent>
      </IonPage>
    );
  }

  // If Tehnicka sluzba module is selected
  if (selectedModule === 'tehnicka') {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Tehnicka Sluzba</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => setSelectedModule('selector')}>
                <ArrowLeft className="w-5 h-5 mr-1" />
                Nazad
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <AdminDashboard />
        </IonContent>
      </IonPage>
    );
  }

  // Module selector screen
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Hotel Management System</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Odjava
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center p-6">
          {/* Welcome message */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Dobrodosli, {user?.fullName || user?.username}!
            </h1>
            <p className="text-gray-600 text-lg">
              Izaberite modul za rad
            </p>
          </div>

          {/* Module cards */}
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            {/* Housekeeping Module */}
            <button
              onClick={() => setSelectedModule('domacinstvo')}
              className="group relative w-72 h-80 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
                {/* Icon container */}
                <div className="w-24 h-24 bg-emerald-100 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                  <Home className="w-12 h-12 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-gray-800 group-hover:text-white mb-3 transition-colors duration-300">
                  Domacinstvo
                </h2>
                <p className="text-gray-500 group-hover:text-white/80 text-center transition-colors duration-300">
                  Upravljanje sobama, ciscenje, inspekcija i raspored sobarica
                </p>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 group-hover:bg-white/20 rounded-full">
                  <span className="text-xs font-semibold text-emerald-700 group-hover:text-white transition-colors duration-300">
                    Housekeeping
                  </span>
                </div>
              </div>
            </button>

            {/* Technical Service Module */}
            <button
              onClick={() => setSelectedModule('tehnicka')}
              className="group relative w-72 h-80 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
                {/* Icon container */}
                <div className="w-24 h-24 bg-blue-100 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                  <Wrench className="w-12 h-12 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-gray-800 group-hover:text-white mb-3 transition-colors duration-300">
                  Tehnicka Sluzba
                </h2>
                <p className="text-gray-500 group-hover:text-white/80 text-center transition-colors duration-300">
                  Radni nalozi, reklamacije, odrzavanje i upravljanje zadacima
                </p>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-100 group-hover:bg-white/20 rounded-full">
                  <span className="text-xs font-semibold text-blue-700 group-hover:text-white transition-colors duration-300">
                    Maintenance
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p>Hotel Management System v2.0</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
