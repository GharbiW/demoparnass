
import { VehicleDetailClient } from "@/components/vehicles/vehicle-detail-client";

export default function VehicleDetailPage({ params }: { params: { vin: string } }) {
  return <VehicleDetailClient vin={params.vin} />;
}
