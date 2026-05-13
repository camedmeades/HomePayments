import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Dashboard } from './routes/dashboard';
import { Bills } from './routes/bills';
import { Calendar } from './routes/calendar';
import { Entities } from './routes/entities';
import { Categories } from './routes/categories';
import { Suppliers } from './routes/suppliers';
import { Trends } from './routes/trends';
import { Insights } from './routes/insights';
import { Settings } from './routes/settings';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/entities" element={<Entities />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}
