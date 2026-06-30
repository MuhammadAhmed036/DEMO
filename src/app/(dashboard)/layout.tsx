import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { StatusFooter } from "@/components/layout/StatusFooter";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";

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
        <main className="flex-1 overflow-x-hidden">{children}</main>
        <StatusFooter />
      </div>
      <CreateAlertModal />
    </div>
  );
}
