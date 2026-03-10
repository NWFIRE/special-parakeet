import React, { useState, useEffect, useRef, useId } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Printer, Loader2, Droplets, ChevronDown, Camera, X } from "lucide-react";
import SignaturePad from "../components/inspections/SignaturePad";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOfflineData } from "../components/offline/useOfflineData";
import { offlineStorage } from "../components/offline/offlineStorage";
import { useAutoSave } from "../components/reports/useAutoSave";

// Smart combobox
function ComboField({ label, value, onChange, options, placeholder = "" }) {
    const listId = useId();
    return (
        <div>
            {label && <Label className="text-xs text-slate-500 uppercase mb-1 block">{label}</Label>}
            <div className="relative">
                <Input
                    list={listId}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="pr-8"
                />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <datalist id={listId}>
                {options.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
        </div>
    );
}

const TAG_OPTIONS = ["Green Tag", "Yellow Tag", "Red Tag"];
const YNA_OPTIONS = ["Yes", "No", "N/A"];

const CHECKLIST_ITEMS = [
    { key: "q1",  label: "Pertinent parties notified before conducting inspection?" },
    { key: "q2",  label: "Adequate drainage ensured prior to draining system?" },
    { key: "q3",  label: "System impairment program implemented before conducting inspection?" },
    { key: "q4",  label: "Flushing connection of one main removed?" },
    { key: "q5",  label: "Organic/Inorganic Material Present?" },
    { key: "q6",  label: "Sprinkler of one branch line removed?" },
    { key: "q7",  label: "Organic/Inorganic Material Present?" },
    { key: "q8",  label: "Sprinkler branch line outlet removed?" },
    { key: "q9",  label: "Organic/Inorganic Material Present?" },
    { key: "q10", label: "Interior of system valve examined?" },
    { key: "q11", label: "Organic/Inorganic Material Present?" },
    { key: "q12", label: "All additional check valves/strainers examined?" },
    { key: "q13", label: "Organic/Inorganic Material Present?" },
    { key: "q14", label: "Sprinkler system in service upon arrival?" },
    { key: "q15", label: "Sprinkler system returned to service after inspection?" },
    { key: "q16", label: "Alarm panel clear after inspection?" },
];

const DEFAULT_CHECKLIST = Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, ""]));

const DEFAULT_FORM = {
    inspection_date: "",
    tag_status: "",
    inspection_location: "",
    checklist: DEFAULT_CHECKLIST,
    system_photos: [],
    notes: "",
    customer_name: "",
    customer_signature_url: "",
    technician_name: "",
    technician_license: "",
    technician_signature_url: "",
};

export default function FiveYearSprinklerReport() {
    const urlParams = new URLSearchParams(window.location.search);
    const inspectionId = urlParams.get("inspection_id") || urlParams.get("id");
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const { isOnline, queueSync } = useOfflineData();

    const saveInFlightRef = useRef(false);
    const reportIdRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
    const updateChecklist = (key, val) => setFormData(prev => ({
        ...prev,
        checklist: { ...prev.checklist, [key]: val }
    }));

    const { data: inspection = [], isLoading: loadingInspection } = useQuery({
        queryKey: ["inspection", inspectionId],
        queryFn: async () => {
            const insp = await base44.entities.Inspection.get(inspectionId);
            return insp ? [insp] : [];
        },
        enabled: !!inspectionId,
    });

    const { data: existingReport = [], isLoading: loadingReport } = useQuery({
        queryKey: ["fiveYearSprinklerReport", inspectionId],
        queryFn: () => base44.entities.FiveYearSprinklerReport.filter({ inspection_id: inspectionId }),
        enabled: !!inspectionId,
    });

    const { data: properties = [] } = useQuery({
        queryKey: ["properties"],
        queryFn: () => base44.entities.Property.list(),
    });
    const { data: clients = [] } = useQuery({
        queryKey: ["clients"],
        queryFn: () => base44.entities.Client.list(),
    });

    useEffect(() => {
        if (existingReport?.[0]?.id) reportIdRef.current = existingReport[0].id;
    }, [existingReport]);

    useEffect(() => {
        if (isInitialized || loadingReport || loadingInspection || !inspectionId) return;
        const load = async () => {
            if (!isOnline) {
                const cached = await offlineStorage.getCachedData(`five_year_sprinkler_${inspectionId}`);
                if (cached) { setFormData(prev => ({ ...prev, ...cached })); setIsInitialized(true); return; }
            }
            if (existingReport.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    ...existingReport[0],
                    checklist: { ...DEFAULT_CHECKLIST, ...(existingReport[0].checklist || {}) }
                }));
                setIsInitialized(true);
            } else if (currentInspection) {
                setFormData(prev => ({
                    ...prev,
                    technician_name: currentInspection.inspector_name || "",
                    inspection_date: currentInspection.scheduled_date || "",
                }));
                setIsInitialized(true);
            }
        };
        load();
    }, [existingReport, isInitialized, loadingReport, loadingInspection, inspectionId]);

    const currentInspection = inspection?.[0];
    const property = properties.find(p => p.id === currentInspection?.property_id);
    const client = clients.find(c => c.id === currentInspection?.client_id);

    const autoSaveFunction = async (data) => {
        if (!inspectionId) return;
        const payload = {
            ...data,
            inspection_id: inspectionId,
            property_id: currentInspection?.property_id,
            client_id: currentInspection?.client_id,
        };
        if (isOnline) {
            const existingId = reportIdRef.current || existingReport?.[0]?.id;
            if (existingId) {
                await base44.entities.FiveYearSprinklerReport.update(existingId, payload);
            } else {
                const created = await base44.entities.FiveYearSprinklerReport.create(payload);
                if (created?.id) reportIdRef.current = created.id;
            }
            await queryClient.invalidateQueries({ queryKey: ["fiveYearSprinklerReport", inspectionId] });
        } else {
            await offlineStorage.cacheData(`five_year_sprinkler_${inspectionId}`, payload);
        }
    };

    useAutoSave({
        data: formData,
        reportIdRef,
        saveInFlightRef,
        saveFunction: autoSaveFunction,
        localKey: `five_year_sprinkler_${inspectionId}`,
        options: { delay: 3000, enabled: !!inspectionId },
    });

    const handleSave = async () => {
        if (!inspectionId) { toast.error("Missing inspection data"); return; }
        if (saveInFlightRef.current) { toast.info("Save already in progress..."); return; }
        saveInFlightRef.current = true;
        setIsSaving(true);
        try {
            await autoSaveFunction(formData);
            toast.success("Report saved successfully");
        } catch (e) {
            toast.error("Failed to save report");
        } finally {
            setIsSaving(false);
            saveInFlightRef.current = false;
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            update("system_photos", [...(formData.system_photos || []), file_url]);
        } catch {
            toast.error("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    };

    const removePhoto = (idx) => {
        update("system_photos", formData.system_photos.filter((_, i) => i !== idx));
    };

    if (loadingInspection || loadingReport) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!currentInspection) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Inspection Not Found</h2>
                    <Link to={createPageUrl("Inspections")}><Button variant="outline">Back to Inspections</Button></Link>
                </div>
            </div>
        );
    }

    const displayDate = formData.inspection_date
        ? format(new Date(formData.inspection_date + "T00:00:00"), "MM/dd/yyyy")
        : (currentInspection.scheduled_date ? format(new Date(currentInspection.scheduled_date + "T00:00:00"), "MM/dd/yyyy") : "");

    // Helper: get Yes/No/N/A label cell value
    const yna = (val) => ({
        yes: val === "Yes" ? "✓" : "",
        no:  val === "No"  ? "✓" : "",
        na:  val === "N/A" ? "✓" : "",
    });

    return (
        <div className="min-h-screen print:bg-white">
            <style>{`
                @media print {
                    @page { margin: 0.3in 0.4in; size: letter; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-size: 8pt; line-height: 1.2; color: #000; }
                    .no-print, .print\\:hidden { display: none !important; }
                    .max-w-4xl { max-width: 100%; margin: 0; padding: 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { padding: 0.03in 0.05in; border: 0.5px solid #aaa; vertical-align: middle; }
                    th { font-weight: bold; background: #efefef; text-align: center; font-size: 7pt; }
                    .print-section { margin-bottom: 0.1in; }
                    .print-footer {
                        position: fixed; bottom: 0; left: 0; right: 0;
                        height: 0.55in; display: flex; align-items: center;
                        padding: 0 0.4in; border-top: 1px solid #ccc;
                        background: white; font-size: 7pt;
                    }
                    .print-footer-logo { height: 0.3in; width: auto; margin-right: 0.15in; }
                    .print-footer-text { flex: 1; text-align: center; font-size: 7pt; line-height: 1.3; }
                    .yna-cell { text-align: center; width: 0.45in; font-size: 11pt; font-weight: bold; }
                    .checklist-num { width: 0.25in; text-align: right; font-size: 7.5pt; padding-right: 0.04in; }
                }
            `}</style>

            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 print:p-0">

                {/* ===== PRINT VIEW ===== */}

                {/* Print Header */}
                <div className="hidden print:block print-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.1in" }}>
                        <div>
                            <img
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/ab5e51f05_LOGO-2024-BlackSurround.jpg"
                                alt="NW Fire & Safety"
                                style={{ height: "0.85in", width: "auto" }}
                            />
                            <div style={{ fontSize: "6.5pt", marginTop: "0.04in" }}>
                                2517 N Van Buren St Enid, OK 73703 &nbsp; 580-540-3119 &nbsp; OK #466, AC441117
                            </div>
                            <div style={{ fontSize: "6.5pt", fontWeight: "bold" }}>All inspections/testing completed in accord with NFPA 25</div>
                        </div>
                        <table style={{ width: "3.2in" }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "0.9in", fontWeight: "bold", fontSize: "7pt" }}>Customer</td>
                                    <td style={{ fontSize: "7pt" }}>{client?.company_name || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", fontSize: "7pt" }}>Address</td>
                                    <td style={{ fontSize: "7pt" }}>{property?.address || client?.address || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", fontSize: "7pt" }}>City, St, Zip</td>
                                    <td style={{ fontSize: "7pt" }}></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", fontSize: "7pt" }}>Inspection Date</td>
                                    <td style={{ fontSize: "7pt" }}>{displayDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", fontSize: "7pt" }}>Tag Status</td>
                                    <td style={{ fontSize: "7pt" }}>{formData.tag_status}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print Title */}
                <div className="hidden print:block print-section" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12pt", fontWeight: "bold", letterSpacing: "0.02em" }}>5 YEAR INTERNAL INSPECTION REPORT</div>
                    <div style={{ fontSize: "8pt", marginTop: "0.06in" }}>Inspection Location</div>
                    <div style={{ display: "inline-block", border: "0.5px solid #aaa", padding: "0.04in 0.3in", marginTop: "0.04in", fontSize: "8pt", minWidth: "2in" }}>
                        {formData.inspection_location}
                    </div>
                </div>

                {/* Print Checklist */}
                <div className="hidden print:block print-section" style={{ marginTop: "0.12in" }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }} colSpan="2"></th>
                                <th className="yna-cell">YES</th>
                                <th className="yna-cell">NO</th>
                                <th className="yna-cell">N/A</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CHECKLIST_ITEMS.map((item, idx) => {
                                const v = yna(formData.checklist?.[item.key] || "");
                                return (
                                    <tr key={item.key}>
                                        <td className="checklist-num">{idx + 1}.</td>
                                        <td style={{ fontSize: "8pt", fontWeight: "bold" }}>{item.label}</td>
                                        <td className="yna-cell">{v.yes}</td>
                                        <td className="yna-cell">{v.no}</td>
                                        <td className="yna-cell">{v.na}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Print Notes */}
                {formData.notes && (
                    <div className="hidden print:block print-section">
                        <table>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold", fontSize: "7.5pt" }}>Notes:</td>
                                </tr>
                                <tr>
                                    <td style={{ minHeight: "0.6in", verticalAlign: "top", fontSize: "7.5pt" }}>{formData.notes}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Print Signatures */}
                <div className="hidden print:block print-section" style={{ marginTop: "0.15in" }}>
                    <table>
                        <tbody>
                            <tr>
                                <td style={{ width: "50%", verticalAlign: "bottom", padding: "0.05in" }}>
                                    {formData.customer_signature_url && (
                                        <img src={formData.customer_signature_url} alt="Customer Signature" style={{ maxHeight: "0.5in", width: "auto" }} />
                                    )}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "0.05in", paddingTop: "0.02in", fontSize: "7pt" }}>
                                        <strong>Customer Name Print</strong>
                                        {formData.customer_name && <span>: {formData.customer_name}</span>}
                                    </div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "bottom", padding: "0.05in" }}>
                                    {formData.technician_signature_url && (
                                        <img src={formData.technician_signature_url} alt="Technician Signature" style={{ maxHeight: "0.5in", width: "auto" }} />
                                    )}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "0.05in", paddingTop: "0.02in", fontSize: "7pt" }}>
                                        <strong>Technician Name / Lic. #</strong>
                                        {formData.technician_name && <span>: {formData.technician_name}{formData.technician_license ? ` / ${formData.technician_license}` : ""}</span>}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print System Photos — page 2 */}
                {formData.system_photos?.length > 0 && (
                    <div className="hidden print:block" style={{ pageBreakBefore: "always", paddingTop: "0.2in" }}>
                        <div style={{ textAlign: "center", fontSize: "12pt", fontWeight: "bold", marginBottom: "0.15in" }}>System Photos</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.1in" }}>
                            {formData.system_photos.map((url, idx) => (
                                <div key={idx} style={{ border: "0.5px solid #aaa", height: "1.8in", overflow: "hidden" }}>
                                    <img src={url} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== SCREEN VIEW ===== */}

                {/* Screen Header */}
                <div className="no-print mb-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Link to={createPageUrl("InspectionDetails") + `?id=${inspectionId}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="p-2 rounded-xl bg-cyan-600">
                            <Droplets className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">5-Year Internal Sprinkler Report</h1>
                            <p className="text-slate-500 text-xs">NFPA 25 – {client?.company_name || ""}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving} className="h-9 px-3">
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)} className="h-9 px-3">Preview</Button>
                            <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-9 px-3">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Customer & Inspection Info */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Customer &amp; Inspection Info</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Customer</Label>
                            <p className="font-semibold text-slate-900">{client?.company_name || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Address</Label>
                            <p className="font-medium text-slate-900">{property?.address || client?.address || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Inspection Date</Label>
                            <Input
                                type="date"
                                value={formData.inspection_date?.slice(0, 10) || currentInspection.scheduled_date?.slice(0, 10) || ""}
                                onChange={(e) => update("inspection_date", e.target.value)}
                            />
                        </div>
                        <ComboField label="Tag Status" value={formData.tag_status} onChange={(v) => update("tag_status", v)} options={TAG_OPTIONS} placeholder="Select tag" />
                        <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-500 uppercase">Inspection Location</Label>
                            <Input value={formData.inspection_location} onChange={(e) => update("inspection_location", e.target.value)} placeholder="e.g., Main Riser Room" />
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Inspection Checklist</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                        {/* Header row */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 pb-1 border-b">
                            <span className="text-xs font-bold text-slate-500 uppercase">Item</span>
                            {["YES", "NO", "N/A"].map(h => (
                                <span key={h} className="text-xs font-bold text-slate-500 uppercase text-center w-12">{h}</span>
                            ))}
                        </div>
                        {CHECKLIST_ITEMS.map((item, idx) => (
                            <div key={item.key} className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center py-1 border-b border-slate-50">
                                <span className="text-sm font-medium text-slate-800">
                                    <span className="text-slate-400 mr-1">{idx + 1}.</span>{item.label}
                                </span>
                                {["Yes", "No", "N/A"].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => updateChecklist(item.key, formData.checklist?.[item.key] === opt ? "" : opt)}
                                        className={`w-12 h-9 rounded-lg border text-xs font-bold transition-all ${
                                            formData.checklist?.[item.key] === opt
                                                ? opt === "Yes" ? "bg-emerald-500 text-white border-emerald-500"
                                                : opt === "No" ? "bg-rose-500 text-white border-rose-500"
                                                : "bg-slate-400 text-white border-slate-400"
                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* System Photos */}
                <Card className="mb-4 print:hidden">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            System Photos
                            <label className="cursor-pointer">
                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                    <span>
                                        {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                        {uploadingPhoto ? "Uploading..." : "Add Photo"}
                                    </span>
                                </Button>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                            </label>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {formData.system_photos?.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No photos added yet</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {formData.system_photos.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea value={formData.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Enter any notes..." className="h-28" />
                    </CardContent>
                </Card>

                {/* Signatures */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Signatures</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">Technician Name</Label>
                                <Input value={formData.technician_name} onChange={(e) => update("technician_name", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">Lic #</Label>
                                <Input value={formData.technician_license} onChange={(e) => update("technician_license", e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <SignaturePad label="Technician Signature" value={formData.technician_signature_url} onChange={(url) => update("technician_signature_url", url)} />
                            <div>
                                <div className="mb-2">
                                    <Label className="text-xs text-slate-500 uppercase">Customer Name</Label>
                                    <Input value={formData.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
                                </div>
                                <SignaturePad label="Customer Signature" value={formData.customer_signature_url} onChange={(url) => update("customer_signature_url", url)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Save */}
                <Button onClick={handleSave} disabled={isSaving} className="w-full bg-orange-500 hover:bg-orange-600 mb-8 print:hidden">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {isSaving ? "Saving..." : "Save Report"}
                </Button>

                {/* Preview Dialog */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
                        <DialogHeader><DialogTitle>Report Preview</DialogTitle></DialogHeader>
                        <div className="bg-white p-6" style={{ fontSize: "8pt", fontFamily: "system-ui, sans-serif" }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <div>
                                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/ab5e51f05_LOGO-2024-BlackSurround.jpg" alt="NW Fire & Safety" style={{ height: "70px", width: "auto" }} />
                                    <div style={{ fontSize: "6pt", marginTop: "4px" }}>2517 N Van Buren St Enid, OK 73703 | 580-540-3119 | OK #466, AC441117</div>
                                    <div style={{ fontSize: "6pt", fontWeight: "bold" }}>All inspections/testing completed in accord with NFPA 25</div>
                                </div>
                                <table style={{ width: "45%", borderCollapse: "collapse", fontSize: "7pt" }}>
                                    <tbody>
                                        {[["Customer", client?.company_name], ["Address", property?.address || client?.address], ["City, St, Zip", ""], ["Inspection Date", displayDate], ["Tag Status", formData.tag_status]].map(([k, v]) => (
                                            <tr key={k}>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px 4px", fontWeight: "bold", width: "40%" }}>{k}</td>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px 4px" }}>{v || ""}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11pt", margin: "6px 0 2px" }}>5 YEAR INTERNAL INSPECTION REPORT</div>
                            <div style={{ textAlign: "center", fontSize: "8pt", marginBottom: "2px" }}>Inspection Location</div>
                            <div style={{ textAlign: "center", border: "0.5px solid #aaa", display: "inline-block", padding: "2px 20px", marginBottom: "8px", width: "100%", boxSizing: "border-box" }}>{formData.inspection_location || ""}</div>
                            {/* Checklist */}
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt" }}>
                                <thead>
                                    <tr>
                                        <th colSpan="2" style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "left" }}></th>
                                        <th style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", width: "36px" }}>YES</th>
                                        <th style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", width: "36px" }}>NO</th>
                                        <th style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", width: "36px" }}>N/A</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CHECKLIST_ITEMS.map((item, idx) => {
                                        const v = yna(formData.checklist?.[item.key] || "");
                                        return (
                                            <tr key={item.key}>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px 4px", width: "20px", textAlign: "right" }}>{idx + 1}.</td>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px 4px", fontWeight: "bold" }}>{item.label}</td>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", fontSize: "11pt", fontWeight: "bold" }}>{v.yes}</td>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", fontSize: "11pt", fontWeight: "bold" }}>{v.no}</td>
                                                <td style={{ border: "0.5px solid #aaa", padding: "2px", textAlign: "center", fontSize: "11pt", fontWeight: "bold" }}>{v.na}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {/* Notes */}
                            {formData.notes && (
                                <div style={{ marginTop: "8px", border: "0.5px solid #aaa", padding: "4px", fontSize: "7pt" }}>
                                    <strong>Notes:</strong> {formData.notes}
                                </div>
                            )}
                            {/* Signatures */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <div>
                                    {formData.customer_signature_url && <img src={formData.customer_signature_url} alt="Customer sig" style={{ maxHeight: "40px", width: "auto" }} />}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "4px", paddingTop: "2px", fontSize: "7pt" }}>
                                        <strong>Customer Name Print</strong>: {formData.customer_name}
                                    </div>
                                </div>
                                <div>
                                    {formData.technician_signature_url && <img src={formData.technician_signature_url} alt="Tech sig" style={{ maxHeight: "40px", width: "auto" }} />}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "4px", paddingTop: "2px", fontSize: "7pt" }}>
                                        <strong>Technician Name / Lic. #</strong>: {formData.technician_name}{formData.technician_license ? ` / ${formData.technician_license}` : ""}
                                    </div>
                                </div>
                            </div>
                            {/* Photos */}
                            {formData.system_photos?.length > 0 && (
                                <div style={{ marginTop: "12px" }}>
                                    <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "10pt", marginBottom: "6px" }}>System Photos</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                                        {formData.system_photos.map((url, idx) => (
                                            <div key={idx} style={{ border: "0.5px solid #aaa", height: "100px", overflow: "hidden" }}>
                                                <img src={url} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Print Footer */}
                <div className="hidden print:block print-footer">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/321b7a425_FooterLogo.png" alt="NW Fire & Safety" className="print-footer-logo" />
                    <div className="print-footer-text">
                        <strong>Northwest Fire &amp; Safety, LLC</strong><br />
                        2517 N Van Buren • Enid, OK 73703<br />
                        (580) 540-3119 • www.nwfireandsafety.com
                    </div>
                </div>
            </div>
        </div>
    );
}