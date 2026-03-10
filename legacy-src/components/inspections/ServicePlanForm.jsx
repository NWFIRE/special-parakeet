import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Plus, X, Bell, Droplets, Flame, Lightbulb, ChefHat, Activity, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const reportTypeOptions = [
    { value: "fire_alarm", label: "Fire Alarm System", icon: Bell, color: "bg-[#FF000D]" },
    { value: "sprinkler_system", label: "Sprinkler System", icon: Droplets, color: "bg-[#B0E0E6]" },
    { value: "fire_extinguisher", label: "Fire Extinguisher", icon: Flame, color: "bg-[#FF7F00]" },
    { value: "emergency_lighting", label: "Emergency Lighting", icon: Lightbulb, color: "bg-[#DDB022]" },
    { value: "kitchen_suppression", label: "Kitchen Suppression", icon: ChefHat, color: "bg-blue-500" },
    { value: "fire_pump", label: "Fire Pump", icon: Activity, color: "bg-teal-500" },
    { value: "pdf_upload", label: "PDF Upload", icon: FileText, color: "bg-slate-500" },
];

const frequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "semi_annual", label: "Semi-Annual (every 6 months)" },
    { value: "annual", label: "Annual (every 12 months)" },
];

const frequencyColors = {
    monthly: "bg-blue-100 text-blue-700",
    quarterly: "bg-purple-100 text-purple-700",
    semi_annual: "bg-amber-100 text-amber-700",
    annual: "bg-emerald-100 text-emerald-700",
};

export default function ServicePlanForm({ open, onClose, plan, clients, onSaved }) {
    const [formData, setFormData] = useState({
        client_id: "",
        property_name: "",
        inspector_id: "",
        inspector_name: "",
        inspector_license: "",
        is_active: true,
        service_items: [],
    });
    const [clientSearch, setClientSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
    });

    const { data: userProfiles = [] } = useQuery({
        queryKey: ['userProfiles'],
        queryFn: () => base44.entities.UserProfile.list(),
    });

    const inspectors = users
        .filter(user => {
            const profile = userProfiles.find(p => p.user_id === user.id);
            return profile && profile.role === 'user' && profile.status !== 'disabled';
        })
        .map(user => {
            const profile = userProfiles.find(p => p.user_id === user.id);
            return {
                id: user.id,
                name: profile?.display_name || user.full_name || user.email,
            };
        });

    useEffect(() => {
        if (plan) {
            setFormData({
                client_id: plan.client_id || "",
                property_name: plan.property_name || "",
                inspector_id: plan.inspector_id || "",
                inspector_name: plan.inspector_name || "",
                inspector_license: plan.inspector_license || "",
                is_active: plan.is_active !== undefined ? plan.is_active : true,
                service_items: plan.service_items || [],
            });
        } else {
            setFormData({
                client_id: "",
                property_name: "",
                inspector_id: "",
                inspector_name: "",
                inspector_license: "",
                is_active: true,
                service_items: [],
            });
        }
    }, [plan, open]);

    const toggleReportType = (reportType) => {
        const existing = formData.service_items.find(i => i.report_type === reportType);
        if (existing) {
            setFormData({
                ...formData,
                service_items: formData.service_items.filter(i => i.report_type !== reportType)
            });
        } else {
            setFormData({
                ...formData,
                service_items: [...formData.service_items, { report_type: reportType, recurrence_frequency: "annual", start_month: "" }]
            });
        }
    };

    const updateFrequency = (reportType, frequency) => {
        setFormData({
            ...formData,
            service_items: formData.service_items.map(item =>
                item.report_type === reportType ? { ...item, recurrence_frequency: frequency } : item
            )
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client_id) {
            toast.error("Please select a client");
            return;
        }
        if (formData.service_items.length === 0) {
            toast.error("Please select at least one service type");
            return;
        }

        setIsSaving(true);
        try {
            if (plan) {
                await base44.entities.PropertyServicePlan.update(plan.id, formData);
                toast.success("Service plan updated");
            } else {
                await base44.entities.PropertyServicePlan.create(formData);
                toast.success("Service plan created");
            }
            onSaved();
        } catch (err) {
            toast.error("Failed to save service plan");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">
                        {plan ? "Edit Service Plan" : "New Service Plan"}
                    </SheetTitle>
                    <SheetDescription>
                        Set per-service recurrence frequencies. Each report type can have its own schedule.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Client */}
                    <div className="space-y-2">
                        <Label>Client *</Label>
                        <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="px-2 pb-2">
                                    <Input
                                        placeholder="Search clients..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="h-8"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {clients?.filter(c =>
                                    c.company_name?.toLowerCase().includes(clientSearch.toLowerCase())
                                ).map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Property Name */}
                    <div className="space-y-2">
                        <Label>Property Name & Address</Label>
                        <Textarea
                            value={formData.property_name}
                            onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                            placeholder="Main Office Building, 123 Main St, City, State ZIP"
                            rows={2}
                        />
                    </div>

                    {/* Default Inspector */}
                    <div className="space-y-2">
                        <Label>Default Inspector</Label>
                        <Select
                            value={formData.inspector_id}
                            onValueChange={(v) => {
                                const inspector = inspectors.find(i => i.id === v);
                                setFormData({ ...formData, inspector_id: v, inspector_name: inspector?.name || "" });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select inspector (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {inspectors.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Inspector License */}
                    <div className="space-y-2">
                        <Label>Inspector License #</Label>
                        <Input
                            value={formData.inspector_license}
                            onChange={(e) => setFormData({ ...formData, inspector_license: e.target.value })}
                            placeholder="License number"
                        />
                    </div>

                    {/* Service Items */}
                    <div className="space-y-2">
                        <Label>Services & Frequencies *</Label>
                        <p className="text-xs text-slate-500">Select each service and choose how often it should be inspected.</p>
                        <div className="border rounded-lg divide-y divide-slate-100 bg-slate-50">
                            {reportTypeOptions.map(type => {
                                const Icon = type.icon;
                                const isChecked = formData.service_items.some(i => i.report_type === type.value);
                                const selectedItem = formData.service_items.find(i => i.report_type === type.value);

                                return (
                                    <div key={type.value} className="p-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`svc-${type.value}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleReportType(type.value)}
                                            />
                                            <label htmlFor={`svc-${type.value}`} className="flex items-center gap-2 cursor-pointer flex-1">
                                                <div className={`p-1.5 rounded ${type.color}`}>
                                                    <Icon className="h-3.5 w-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium">{type.label}</span>
                                            </label>
                                            {isChecked && selectedItem && (
                                                <Badge className={`text-xs ${frequencyColors[selectedItem.recurrence_frequency] || ""}`}>
                                                    {frequencyOptions.find(f => f.value === selectedItem.recurrence_frequency)?.label?.split(" ")[0]}
                                                </Badge>
                                            )}
                                        </div>
                                        {isChecked && (
                                            <div className="mt-2 ml-8 space-y-2">
                                                <Select
                                                    value={selectedItem?.recurrence_frequency || "annual"}
                                                    onValueChange={(v) => updateFrequency(type.value, v)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {frequencyOptions.map(f => (
                                                            <SelectItem key={f.value} value={f.value} className="text-xs">
                                                                {f.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div>
                                                    <label className="text-xs text-slate-500 mb-1 block">Start Month</label>
                                                    <Input
                                                        type="month"
                                                        className="h-8 text-xs"
                                                        value={selectedItem?.start_month || ""}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            service_items: formData.service_items.map(item =>
                                                                item.report_type === type.value ? { ...item, start_month: e.target.value } : item
                                                            )
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {plan ? "Update" : "Create"} Plan
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}