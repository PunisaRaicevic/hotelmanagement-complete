import { useAuth } from '@/contexts/AuthContext';
import AdminModuleSelector from './AdminModuleSelector';
import ReceptionistModuleSelector from './ReceptionistModuleSelector';
import OperatorDashboard from './OperatorDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import WorkerDashboard from './WorkerDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import ManagerDashboard from './ManagerDashboard';
import ComplaintSubmissionDashboard from './ComplaintSubmissionDashboard';
import HousekeeperDashboard from './HousekeeperDashboard';
import HousekeepingSupervisorDashboard from './HousekeepingSupervisorDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  // Render role-specific dashboard
  if (!user) {
    return null;
  }

  switch (user.role) {
    case 'admin':
      return <AdminModuleSelector />;
    case 'operater':
      return <OperatorDashboard />;
    case 'sef':
      return <SupervisorDashboard />;
    case 'radnik':
      return <WorkerDashboard />;
    case 'serviser':
      return <TechnicianDashboard />;
    case 'menadzer':
      return <ManagerDashboard />;
    case 'sobarica':
      return <HousekeeperDashboard />;
    case 'sef_domacinstva':
      return <HousekeepingSupervisorDashboard />;
    case 'recepcioner':
      return <ReceptionistModuleSelector />;
    default:
      // All other roles use complaint submission dashboard
      return <ComplaintSubmissionDashboard />;
  }
}
