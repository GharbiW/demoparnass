
"use client";

import { useParams } from 'next/navigation';
import { campaigns, type Campaign } from '@/lib/campaigns-data';
import { prospects } from '@/lib/prospects-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, CheckCircle, Percent, MousePointerClick, Send, UserCheck, Eye, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function CampaignDetailPage() {
    const params = useParams();
    const campaignId = params.campaignId as string;
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
        return (
            <Card>
                <CardHeader><CardTitle>Campagne non trouvée</CardTitle></CardHeader>
                <CardContent><p>La campagne que vous cherchez n'existe pas.</p></CardContent>
            </Card>
        );
    }
    
    const recipients = prospects.slice(0, campaign.recipientCount);
    const openedCount = Math.floor(campaign.recipientCount * (campaign.openRate / 100));
    const clickedCount = Math.floor(campaign.recipientCount * (campaign.clickRate / 100));
    const convertedCount = Math.floor(clickedCount * 0.1); // 10% conversion rate of clicks

    const getStatusVariant = (status: 'Nouveau' | 'Contacté' | 'En négociation') => {
        if(status === 'Contacté') return 'secondary';
        return 'outline';
    }


    return (
        <div className="space-y-6">
             <div>
                <Button variant="ghost" asChild>
                    <Link href="/commercial/campaigns"><ArrowLeft className="mr-2"/>Retour aux campagnes</Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline mt-2">{campaign.name}</h1>
                <p className="text-muted-foreground">{campaign.sendDate} • {campaign.targetSegment}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Emails Envoyés" value={campaign.recipientCount.toString()} icon={Send}/>
                <StatCard title="Taux d'Ouverture" value={`${campaign.openRate.toFixed(1)}%`} icon={Eye}/>
                <StatCard title="Taux de Clics" value={`${campaign.clickRate.toFixed(1)}%`} icon={MousePointerClick}/>
                <StatCard title="Nouveaux Prospects" value={convertedCount.toString()} icon={UserCheck}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Contenu de l'Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-sm">Sujet</h3>
                                <p className="text-sm p-2 bg-muted/50 rounded-md mt-1">{campaign.subject}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-sm">Contenu</h3>
                                <div className="prose prose-sm max-w-none p-4 border rounded-md mt-1" dangerouslySetInnerHTML={{ __html: campaign.content || '' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Performance des Destinataires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Prospect</TableHead>
                                    <TableHead>Société</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-center">A ouvert</TableHead>
                                    <TableHead className="text-center">A cliqué</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipients.slice(0, 10).map((prospect, i) => (
                                     <TableRow key={prospect.id}>
                                        <TableCell className="font-medium">{prospect.name}</TableCell>
                                        <TableCell>{prospect.company}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(prospect.status)}>{prospect.status}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            {i < openedCount ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto"/> : <XCircle className="h-5 w-5 text-muted-foreground/50 mx-auto"/>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {i < clickedCount ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto"/> : <XCircle className="h-5 w-5 text-muted-foreground/50 mx-auto"/>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

