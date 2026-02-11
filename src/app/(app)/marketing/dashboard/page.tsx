
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingData } from "@/lib/marketing-data";
import { useEffect, useState } from "react";

// We need to dynamically import Chart.js components to avoid SSR errors
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MarketingDashboardPage() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { usage, renderJobs } = marketingData;

  const chartData = {
    labels: ['Il y a 7 jours', 'Il y a 6 jours', 'Il y a 5 jours', 'Il y a 4 jours', 'Il y a 3 jours', 'Hier', 'Aujourd\'hui'],
    datasets: [{
      label: 'Rendus',
      data: [40, 38, 32, 25, 22, 18, 12],
      backgroundColor: 'rgba(89, 255, 204, 0.2)',
      borderColor: '#59FFCC',
      borderWidth: 2,
      pointBackgroundColor: '#59FFCC',
      pointRadius: 4,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
    },
    plugins: {
      legend: { display: false }
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap: { [key: string]: string } = {
        'Terminé': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'En cours': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 animate-pulse',
        'En attente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'Échoué': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusMap[status] || ''}">${status}</span>`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord Marketing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Object.values(usage).map((stat, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mt-2">{stat.current.toLocaleString()}</p>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-3">
                 <div className="h-full bg-primary rounded-full" style={{ width: `${(stat.current / stat.total) * 100}%` }}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rendus par Jour</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isClient && <Line data={chartData} options={chartOptions} />}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entonnoir de Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {[
                    {label: 'Vidéos d\'Entrée', value: 100, color: 'bg-primary'},
                    {label: 'Moments Forts Détectés', value: 85, color: 'bg-blue-500'},
                    {label: 'Clips Approuvés', value: 60, color: 'bg-cyan-500'},
                    {label: 'Clips Rendus', value: 55, color: 'bg-teal-500'},
                    {label: 'Publiés', value: 40, color: 'bg-accent/80'},
                ].map(item => (
                <div className="w-full" key={item.label}>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span>{item.value}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div className={`${item.color} h-2.5 rounded-full`} style={{width: `${item.value}%`}}></div>
                    </div>
                </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tâches Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                  {renderJobs.slice(0, 4).map(job => (
                  <li key={job.id} className="flex items-center justify-between">
                      <div>
                          <p className="font-medium">{job.title || (job as any).name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{job.type} &bull; {job.date}</p>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: getStatusChip(job.status) }} />
                  </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
