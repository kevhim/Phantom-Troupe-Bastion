import React, { useState } from 'react';
import { Layout, ViewId } from './components/Layout';
import { DashboardView } from './views/DashboardView';
import { ApprovalsView } from './views/ApprovalsView';
import { SecurityView } from './views/SecurityView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'security':
        return <SecurityView />;
      case 'settings':
        return <SettingsView onNavigate={(view) => setCurrentView(view as ViewId)} />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
