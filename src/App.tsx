import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlannerProvider } from './context/PlannerContext';
import Header from './components/Header';
// HomePage kept in project but bypassed from public flow — redirected to /intro
// import HomePage from './pages/HomePage';
import IntroPage from './pages/IntroPage';
import ObjectivePage from './pages/ObjectivePage';
import InvestmentPage from './pages/InvestmentPage';
import DeadlinePage from './pages/DeadlinePage';
import LeadPage from './pages/LeadPage';
import CatalogPage from './pages/CatalogPage';
import ProjectPage from './pages/ProjectPage';
import VisualizePage from './pages/VisualizePage';
import ObjetivoPage from './pages/ObjetivoPage';
import InvestimentoPage from './pages/InvestimentoPage';
import PrazoPage from './pages/PrazoPage';
import PerfilPage from './pages/PerfilPage';
import EquipamentosPage from './pages/EquipamentosPage';
import RevisaoPage from './pages/RevisaoPage';
import PreviaPage from './pages/PreviaPage';
import ConfirmacaoPage from './pages/ConfirmacaoPage';

import AdminLeadsPage from './pages/AdminLeadsPage';
import AdminMessagesPage from './pages/AdminMessagesPage';

// Pages that show the Header with Stepper


function AppLayout() {
  return (
    <div className="bg-app min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/"             element={<Navigate to="/intro" replace />} />
          <Route path="/intro"        element={<IntroPage />} />
          <Route path="/objective"    element={<ObjectivePage />} />
          <Route path="/investment"   element={<InvestmentPage />} />
          <Route path="/deadline"     element={<DeadlinePage />} />
          <Route path="/lead"         element={<LeadPage />} />
          <Route path="/catalog"      element={<CatalogPage />} />
          <Route path="/project"      element={<ProjectPage />} />
          <Route path="/objetivo"     element={<ObjetivoPage />} />
          <Route path="/investimento" element={<InvestimentoPage />} />
          <Route path="/prazo"        element={<PrazoPage />} />
          <Route path="/perfil"       element={<PerfilPage />} />
          <Route path="/equipamentos" element={<EquipamentosPage />} />
          <Route path="/revisao"      element={<RevisaoPage />} />
          <Route path="/previa"       element={<PreviaPage />} />
          <Route path="/confirmacao"  element={<ConfirmacaoPage />} />
          <Route path="/confirmation" element={<ConfirmacaoPage />} />
          <Route path="/visualize"    element={<VisualizePage />} />
          <Route path="/admin"         element={<Navigate to="/admin/leads" replace />} />
          <Route path="/admin/leads"   element={<AdminLeadsPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          {/* Fallback */}
          <Route path="*"             element={<Navigate to="/intro" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlannerProvider>
        <AppLayout />
      </PlannerProvider>
    </BrowserRouter>
  );
}
