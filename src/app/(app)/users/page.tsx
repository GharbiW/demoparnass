import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 font-headline">Utilisateurs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cette page permettra de gérer les utilisateurs et leurs rôles. Fonctionnalité à venir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
