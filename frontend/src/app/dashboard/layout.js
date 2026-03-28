import Sidebar from '../../components/Sidebar';

export const metadata = {
  title: 'Dashboard — AutoPost Hub',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
