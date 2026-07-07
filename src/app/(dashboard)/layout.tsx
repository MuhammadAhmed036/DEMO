import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BackendStatusBanner } from "@/components/layout/BackendStatusBanner";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { AlertWatcherMount } from "@/components/alerts/AlertWatcherMount";
import { CameraAutoSyncMount } from "@/components/map/CameraAutoSyncMount";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-surface-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <BackendStatusBanner />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
      <CreateAlertModal />
      <AlertWatcherMount />
      <CameraAutoSyncMount />
    </div>
  );
}
