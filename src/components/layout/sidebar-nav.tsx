

"use client"

import {
  LayoutDashboard,
  Users,
  Wrench,
  Fuel,
  ShieldCheck,
  Leaf,
  AlertTriangle,
  Settings,
  UserCog,
  Bot,
  GanttChartSquare,
  FileText,
  FileSignature,
  Building,
  Route,
  ClipboardList,
  HardHat,
  CalendarCheck,
  Truck,
  FileClock,
  MessageSquare,
  Contact,
  Users2,
  Scissors,
  Clapperboard,
  BookOpen,
  Library,
  Workflow,
  Sparkles as MarketingIcon,
  Image as ImageIcon,
  Mails,
  DollarSign,
  Sparkles,
  Search,
  CalendarHeart,
} from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const commercialMenuItems = [
  { href: '/commercial/prospects', label: 'Prospection', icon: Contact },
  { href: '/commercial/campaigns', label: 'Campagnes', icon: Mails },
  { href: '/commercial', label: 'Clients', icon: Building },
  { href: '/commercial/facturation', label: 'Facturation', icon: FileText },
  { href: '/contracts', label: 'Cahier des Charges', icon: FileSignature },
  { href: '/design/requests', label: 'Prestations à planifier', icon: FileClock },
]

const conceptionMenuItems = [
    { href: '/conception/planning', label: 'Planning Global', icon: GanttChartSquare },
    { href: '/conception/a-placer', label: 'À Placer', icon: ClipboardList },
    { href: '/conception/courses', label: 'Courses', icon: Route },
    { href: '/conception/sup', label: 'Créer un SUP', icon: CalendarCheck },
    { href: '/conception/conducteurs', label: 'Conducteurs', icon: Users2 },
    { href: '/conception/reporting', label: 'Reporting', icon: LayoutDashboard },
]

const exploitationMenuItems = [
    { href: '/dispatch', label: 'Dispatch', icon: ClipboardList },
    { href: '/trips', label: 'Trajets', icon: Route },
    { href: '/planning', label: 'Planning', icon: GanttChartSquare },
    { href: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
    { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
]

const backOfficeMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vehicles', label: 'Vehicules', icon: Truck },
    { href: '/drivers', label: 'Chauffeurs', icon: Contact },
    { href: '/technicians', label: 'Techniciens', icon: HardHat },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/fuel', label: 'Carburant', icon: Fuel },
    { href: '/invoices', label: 'Notes de Frais', icon: DollarSign },
    { href: '/dlq', label: 'DLQ', icon: AlertTriangle },
    { href: '/rse', label: 'RSE', icon: Leaf },
]

const rhMenuItems = [
  { href: '/employees', label: 'Employés', icon: Users2 },
  { href: '/conges', label: 'Congés Individuels', icon: CalendarCheck },
  { href: '/conges/campaign', label: 'Campagnes Congés', icon: CalendarHeart },
  { href: '/formations', label: 'Formations', icon: ShieldCheck },
]

const marketingMenuItems = [
  { href: "/marketing/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/marketing/long-short", label: "Long→Court", icon: Scissors },
  { href: "/marketing/avatar", label: "Avatar", icon: Clapperboard },
  { href: "/marketing/visuals", label: "Visuels", icon: ImageIcon },
  { href: "/marketing/ebook", label: "eBook", icon: BookOpen },
  { href: "/marketing/workflows", label: "Workflows", icon: Workflow },
  { href: "/marketing/library", label: "Bibliothèque", icon: Library },
]

const aiMenuItems = [
    { href: '/ia/command', label: 'Ask Parnass AI', icon: Bot },
    { href: '/ia/knowledge', label: 'ParnassGPT', icon: Sparkles },
    { href: '/vehicles/DEMO-VIN-123', label: 'Maintenance Prédictive', icon: Wrench },
    { href: '/explain-kpi', label: 'Explain My KPI', icon: Search },
]

const autresMenuItems = [
    { href: '/users', label: 'Utilisateurs', icon: UserCog },
    { href: '/settings', label: 'Paramètres', icon: Settings },
    { href: '/communications', label: 'Communications', icon: MessageSquare },
]


export function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    // Exact match for some routes, otherwise startsWith
    if (href === '/dashboard' || href === '/commercial' || href === '/contracts') return pathname === href;
    if (href === '/drivers') return pathname.startsWith('/drivers') || pathname.startsWith('/chauffeurs');
    if (href === '/conges') return pathname === '/conges';
    if (href === '/anomalies') return pathname === '/anomalies';
    if (href === '/planning') return pathname === '/planning';
    if (href === '/conception/planning') return pathname === '/conception/planning';
    return pathname.startsWith(href);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
            <Image src="https://parnass-transport.com/wp-content/uploads/2025/05/logo.webp" alt="Parnass Transport Logo" width={150} height={40} className="w-auto h-10"/>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Accordion type="multiple" className="w-full" defaultValue={['commercial', 'conception', 'exploitation', 'back-office', 'rh', 'marketing', 'ia', 'autres']}>
            <AccordionItem value="commercial" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Commercial</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {commercialMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conception" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Conception</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {conceptionMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="exploitation" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Exploitation</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {exploitationMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="back-office" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Back Office</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {backOfficeMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rh" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Ressources Humaines</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {rhMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="marketing" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Marketing</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {marketingMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}><Icon className="mr-2 h-4 w-4" />{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ia" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">IA / Proactivité</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {aiMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="mr-2 h-4 w-4" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="autres" className="border-none">
                <AccordionTrigger className="p-2 hover:no-underline text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground">Autres</AccordionTrigger>
                <AccordionContent className="pb-0 pl-4">
                    <SidebarMenu>
                        {autresMenuItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton asChild isActive={isActive(href)} size="sm" variant="ghost">
                                    <Link href={href}>{Icon && <Icon className="h-4 w-4 mr-2" />}{label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </SidebarContent>
    </Sidebar>
  )
}
