import React from 'react';
import { EnvironmentModeStrip } from './EnvironmentModeStrip';
import { GlobalTopbar } from './GlobalTopbar';
import { AppSidebar } from './AppSidebar';
import { GlobalIncidentBanner } from './GlobalIncidentBanner';
import { ApprovalDrawer } from './ApprovalDrawer';
import { AuditFooter } from './AuditFooter';

interface AppShellProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentRoute, onRouteChange, children }) => {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans overflow-x-hidden">
      {/* 1. Top Environment Mode Strip */}
      <EnvironmentModeStrip />

      {/* 2. Global Topbar */}
      <GlobalTopbar />

      {/* 3. Global Incident Banner (conditional on panic/incident) */}
      <GlobalIncidentBanner onInspectSecurity={() => onRouteChange('security')} />

      {/* Main Body: Continuous Grid Layout (Sidebar Index Rail + Content Matrix) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 4. Index Rail */}
        <AppSidebar currentRoute={currentRoute} onRouteChange={onRouteChange} />

        {/* Content Matrix Viewport */}
        <main className="flex-1 overflow-y-auto bg-surface/40 p-8 h-[calc(100vh-6rem)]">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* 5. Approval Drawer (Fly-out modal on right) */}
      <ApprovalDrawer onOpenApprovalsRoute={() => onRouteChange('approvals')} />

      {/* 6. Audit Footer */}
      <AuditFooter />
    </div>
  );
};
