
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clapperboard, ImageIcon, BookOpen, Download, Share2 } from 'lucide-react';
import Image from 'next/image';

const allAssets = [
  { id: 'asset-1', type: 'Clip', name: 'Clip Discours - Éthique de l\'IA', date: '2024-07-29', project: 'Campagne Marketing T3', preview: 'https://placehold.co/300x200/6A0DAD/FFFFFF?text=Clip' },
  { id: 'asset-2', type: 'Image', name: 'Visuel pour post LinkedIn', date: '2024-07-28', project: 'Campagne Marketing T3', preview: 'https://i.postimg.cc/8Pj321Vq/image.png' },
  { id: 'asset-3', type: 'Vidéo Avatar', name: 'Vidéo de Bienvenue - Nouvelle Recrue', date: '2024-07-28', project: 'Interne', preview: 'https://placehold.co/300x200/000066/FFFFFF?text=Avatar' },
  { id: 'asset-4', type: 'eBook', name: 'Guide SEO 2024', date: '2024-07-27', project: 'Extraits de Podcast', preview: 'https://placehold.co/300x200/FF851B/FFFFFF?text=eBook' },
  ...Array.from({length: 8}, (_,i) => ({id: `asset-${i+5}`, type: 'Clip', name: `Clip Marketing ${i+1}`, date: '2024-07-26', project: 'Campagne Marketing T3', preview: `https://placehold.co/300x200/6A0DAD/FFFFFF?text=Clip+${i+1}`}))
];

const AssetCard = ({ asset }: { asset: typeof allAssets[0] }) => {
    const getIcon = () => {
        switch(asset.type) {
            case 'Clip': return <Clapperboard className="h-4 w-4"/>;
            case 'Image': return <ImageIcon className="h-4 w-4"/>;
            case 'Vidéo Avatar': return <Clapperboard className="h-4 w-4"/>;
            case 'eBook': return <BookOpen className="h-4 w-4"/>;
            default: return null;
        }
    }

    return (
        <Card className="overflow-hidden">
            <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
                <Image src={asset.preview} alt={asset.name} fill className="object-cover"/>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-base line-clamp-1">{asset.name}</CardTitle>
                <CardDescription className="text-xs flex items-center gap-2">
                    {getIcon()} {asset.type} <span>&bull;</span> {asset.date}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{asset.project}</span>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7"><Share2 className="h-4 w-4"/></Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function LibraryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredAssets = allAssets.filter(asset => 
        (asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.project.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (typeFilter === 'all' || asset.type === typeFilter)
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bibliothèque d'Assets</h1>
        <p className="text-slate-500 dark:text-slate-400">Retrouvez, gérez et partagez tous les contenus générés par l'IA.</p>
      </div>

       <div className="flex items-center gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par nom, projet..." className="pl-10"/>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Clip">Clip</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Vidéo Avatar">Vidéo Avatar</SelectItem>
                    <SelectItem value="eBook">eBook</SelectItem>
                </SelectContent>
            </Select>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
       {filteredAssets.length === 0 && (
         <div className="text-center py-16 text-slate-500">
            <p>Aucun asset ne correspond à votre recherche.</p>
         </div>
       )}

    </div>
  );
}
