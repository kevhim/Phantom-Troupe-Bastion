import React, { useState } from 'react';
import { Layout, NavTab } from './components/Layout';
import { IntroSplash } from './components/IntroSplash';
import { PaymentsView } from './views/PaymentsView';
import { ApprovalsView } from './views/ApprovalsView';
import { RulesView } from './views/RulesView';
import { HardwareView } from './views/HardwareView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('payments');
  const [replayKey, setReplayKey] = useState(0);

  const handleReplayIntro = () => {
    setReplayKey((prev) => prev + 1);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'payments':
        return <PaymentsView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'rules':
        return <RulesView />;
      case 'hardware':
        return <HardwareView />;
      default:
        return <PaymentsView />;
    }
  };

  return (
    <>
      <IntroSplash replayKey={replayKey} />
      <Layout 
        currentTab={currentTab} 
        onTabChange={setCurrentTab}
        onReplayIntro={handleReplayIntro}
      >
        {renderActiveView()}
      </Layout>
    </>
  );
};

export default App;
