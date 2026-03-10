import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Settings2, Trash2, Edit, RefreshCw, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";
import ServicePlanForm from "@/components/inspections/ServicePlanForm";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const frequencyLabels = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semi_annual: "Semi-Annual",
    annual: "Annual",
};

const reportTypeLabels = {
    fire_alarm: "Fire Alarm",
    sprinkler_system: "Sprinkler",
    fire_extinguisher: "Fire Extinguisher",
    emergency_lighting: "Emergency Lighting",
    standpipe_system: "Standpipe",
    fire_pump: "Fire Pump",
    kitchen_suppression: "Kitchen Suppression",
    pdf_upload: "PDF Upload",
};

const frequencyColors = {
    monthly: "bg-blue-100 text-blue-700",
    quarterly: "bg-purple-100 text-purple-700",
    semi_annual: "bg-amber-100 text-amber-700",
    annual: "bg-emerald-100 text-emerald-700",
};

export default function ServicePlans() {
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [deletingPlan, setDeletingPlan] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const queryClient = useQueryClient();

    const { data: plans = [], isLoading: loadingPlans } = useQuery({
        queryKey: ['servicePlans'],
        queryFn: () => base44.entities.PropertyServicePlan.list('-created_date'),
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.PropertyServicePlan.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicePlans'] });
            setDeletingPlan(null);
            toast.success("Service plan deleted");
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }) => base44.entities.PropertyServicePlan.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicePlans'] });
        },
    });

    const handleGenerateNow = async () => {
        setIsGenerating(true);
        try {
            const response = await base44.functions.invoke('generateSmartRecurringInspections', {});
            toast.success(response.data?.message || "Inspections generated successfully");
            queryClient.invalidateQueries({ queryKey: ['inspections'] });
        } catch (err) {
            toast.error("Failed to generate inspections");
        } finally {
            setIsGenerating(false);
        }
    };

    const getClientName = (clientId) => clients.find(c => c.id === clientId)?.company_name || "Unknown Client";

    const filteredPlans = plans.filter(plan => {
        if (!searchQuery) return true;
        const clientName = getClientName(plan.client_id);
        return (
            plan.property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            clientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Service Plans</h1>
                        <p className="text-slate-500 mt-1">
                            Configure recurring service schedules per property — each report type can have its own frequency
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleGenerateNow}
                            disabled={isGenerating}
                            className="gap-2"
                        >
                            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Generate Now
                        </Button>
                        <Button
                            onClick={() => { setEditingPlan(null); setShowForm(true); }}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Plan
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by property or client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-slate-200"
                    />
                </div>

                {/* Plans Grid */}
                {loadingPlans ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                    </div>
                ) : filteredPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlans.map(plan => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md ${
                                    plan.is_active ? "border-slate-100" : "border-slate-200 opacity-60"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">
                                            {plan.property_name || "Unnamed Property"}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {getClientName(plan.client_id)}
                                        </p>
                                    </div>
                                    <Badge className={plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                                        {plan.is_active ? "Active" : "Paused"}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {(plan.service_items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-700">{reportTypeLabels[item.report_type] || item.report_type}</span>
                                            <Badge className={`text-xs ${frequencyColors[item.recurrence_frequency] || "bg-slate-100 text-slate-600"}`}>
                                                {frequencyLabels[item.recurrence_frequency] || item.recurrence_frequency}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleActiveMutation.mutate({ id: plan.id, is_active: !plan.is_active })}
                                        className="text-xs text-slate-500 hover:text-slate-700"
                                    >
                                        {plan.is_active ? "Pause" : "Activate"}
                                    </Button>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditingPlan(plan); setShowForm(true); }}
                                            className="text-slate-400 hover:text-orange-600"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingPlan(plan)}
                                            className="text-slate-400 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Settings2}
                        title="No service plans yet"
                        description="Create a service plan to automatically schedule recurring inspections with per-service frequencies"
                        action="New Plan"
                        onAction={() => setShowForm(true)}
                    />
                )}
            </div>

            <ServicePlanForm
                open={showForm}
                onClose={() => { setShowForm(false); setEditingPlan(null); }}
                plan={editingPlan}
                clients={clients}
                onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ['servicePlans'] });
                    setShowForm(false);
                    setEditingPlan(null);
                }}
            />

            <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service Plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will stop automatic inspection generation for this property. Existing inspections will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deletingPlan.id)}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}