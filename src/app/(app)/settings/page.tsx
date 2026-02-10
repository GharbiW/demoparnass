import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 font-headline">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de l'Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cette page permettra de gérer les paramètres de l'organisation. Fonctionnalité à venir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
