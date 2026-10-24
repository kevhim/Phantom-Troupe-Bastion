import React from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { 
  Shield, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface AppSidebarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ currentRoute, onRouteChange }) => {
  const { approvalQueue, userRole, setUserRole, riskLevel } = useBastionStore();

  const navItems = [
    { id: 'overview', index: '01', label: 'Command Overview', path: '/overview' },
    { id: 'agent', index: '02', label: 'Agent Workbench', path: '/agent' },
    { id: 'wallet', index: '03', label: 'Smart Account & Policies', path: '/wallet' },
    { id: 'approvals', index: '04', label: 'Hardware Approvals', path: '/approvals', badge: approvalQueue.length },
    { id: 'security', index: '05', label: 'Security & Containment', path: '/security' },
    { id: 'hardware', index: '06', label: 'Devices & Pinouts', path: '/hardware' },
    { id: 'evidence', index: '07', label: 'Forensics & Audit', path: '/evidence' },
    { id: 'settings', index: '08', label: 'Presets & Configuration', path: '/settings' },
  ];

  return (
    <aside className="w-72 bg-white border-r-2 border-black flex flex-col justify-between h-[calc(100vh-6rem)] select-none shrink-0">
      {/* Top: Logo & System Identity */}
      <div>
        <div className="p-5 border-b-2 border-black bg-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-sans font-extrabold text-xl tracking-tight text-black">
                  BASTION
                </span>
                <span className="font-mono text-xs font-bold px-1.5 py-0.2 bg-black text-white">
                  X V2
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-[0.12em] text-muted pt-1 border-t border-rule-light">
            <span className={`w-2 h-2 ${
              riskLevel === 'TRUSTED' ? 'bg-black' :
              riskLevel === 'SUSPICIOUS' ? 'bg-[#c90000]' : 'bg-[#c90000] animate-pulse'
            }`} />
            <span>POSTURE: <strong className="text-black font-bold">{riskLevel}</strong></span>
          </div>
        </div>

        {/* Index Rail Navigation */}
        <nav className="p-0 divide-y-2 divide-black">
          <div className="px-5 py-2.5 bg-surface text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-black border-b-2 border-black">
            System Index Rail
          </div>
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-none ${
                  isActive 
                    ? 'bg-black text-white font-bold' 
                    : 'bg-white text-black hover:bg-surface'
                }`}
              >
                <div className="flex items-baseline space-x-3">
                  <span className={`font-mono text-xs font-bold ${
                    isActive ? 'text-[#c90000]' : 'text-muted'
                  }`}>
                    {item.index}
                  </span>
                  <span className="font-sans font-bold text-xs uppercase tracking-[0.06em]">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                      isActive ? 'bg-[#c90000] text-white' : 'bg-black text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Role Switcher & Supervisor Attestation */}
      <div className="p-4 border-t-2 border-black bg-surface">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted font-bold">
            Authority Tier
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
            {userRole}
          </span>
        </div>
        <button
          onClick={() => setUserRole(userRole === 'OPERATOR' ? 'SUPERVISOR' : 'OPERATOR')}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-black hover:text-white text-black border-2 border-black transition-none text-xs font-sans font-bold uppercase tracking-wider"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Switch to {userRole === 'OPERATOR' ? 'Supervisor' : 'Operator'}</span>
        </button>
      </div>
    </aside>
  );
};
