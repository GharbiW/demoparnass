
import { TechnicianProfileClient } from "@/components/technicians/technician-profile-client";

export default function TechnicianProfilePage({
  params,
}: {
  params: { technicianId: string };
}) {
  return <TechnicianProfileClient technicianId={params.technicianId} />;
}
