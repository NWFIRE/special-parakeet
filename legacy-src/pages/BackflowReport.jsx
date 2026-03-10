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
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Printer, Loader2, Droplets, ChevronDown } from "lucide-react";
import SignaturePad from "../components/inspections/SignaturePad";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOfflineData } from "../components/offline/useOfflineData";
import { offlineStorage } from "../components/offline/offlineStorage";
import { useAutoSave } from "../components/reports/useAutoSave";

// Smart combobox: dropdown suggestions + free-type custom text
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

const PROTECTION_TYPES = ["Premise Isolation", "In-Premise", "Dedicated Fire Line", "Domestic Water Line"];
const ORIENTATIONS = ["Horizontal", "Vertical"];
const ASSEMBLY_TYPES_BFP = ["RPBA", "RPDA", "DCVA", "DCDA"];
const RESULT_OPTIONS = ["Closed Tight", "Leaked"];
const PASS_FAIL_OPTIONS = ["Pass", "Fail"];
const SIGHT_TUBE_OPTIONS = ["Closed Tight", "Leaked"];
const TAG_OPTIONS = ["Green Tag", "Yellow Tag", "Red Tag"];

const DEFAULT_FORM = {
    inspection_date: "",
    tag_status: "",
    assembly_make: "",
    assembly_model: "",
    assembly_serial_number: "",
    assembly_size: "",
    assembly_type: "",
    external_bfp_number: "",
    location_of_assembly: "",
    protection_type: "",
    orientation: "",
    line_pressure_psi: "",
    backflow_assembly_type: "",
    cv1_rp_psid: "",
    cv1_rp_result: "",
    cv2_psid: "",
    cv2_result: "",
    relief_valve_psid: "",
    relief_valve_pass_fail: "",
    cv_3psid_buffer_psid: "",
    cv_3psid_buffer_pass_fail: "",
    cv1_final_result: "",
    cv1_final_pass_fail: "",
    cv2_final_result: "",
    cv2_final_pass_fail: "",
    sight_tube: "",
    comments_deficiencies: "",
    technician_name: "",
    technician_license: "",
    technician_signature_url: "",
    customer_name: "",
    customer_signature_url: "",
};

export default function BackflowReport() {
    const urlParams = new URLSearchParams(window.location.search);
    const inspectionId = urlParams.get("inspection_id") || urlParams.get("id");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const { isOnline, queueSync } = useOfflineData();

    const saveInFlightRef = useRef(false);
    const reportIdRef = useRef(null);
    const latestRef = useRef(formData);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => { latestRef.current = formData; }, [formData]);

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const { data: inspection = [], isLoading: loadingInspection } = useQuery({
        queryKey: ["inspection", inspectionId],
        queryFn: async () => {
            const insp = await base44.entities.Inspection.get(inspectionId);
            return insp ? [insp] : [];
        },
        enabled: !!inspectionId,
    });

    const { data: existingReport = [], isLoading: loadingReport } = useQuery({
        queryKey: ["backflowReport", inspectionId],
        queryFn: () => base44.entities.BackflowReport.filter({ inspection_id: inspectionId }),
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
        if (existingReport?.[0]?.id) {
            reportIdRef.current = existingReport[0].id;
        }
    }, [existingReport]);

    useEffect(() => {
        if (isInitialized || loadingReport || loadingInspection || !inspectionId) return;
        const load = async () => {
            if (!isOnline) {
                const cached = await offlineStorage.getCachedData(`backflow_report_${inspectionId}`);
                if (cached) { setFormData(prev => ({ ...prev, ...cached })); setIsInitialized(true); return; }
            }
            if (existingReport.length > 0) {
                setFormData(prev => ({ ...prev, ...existingReport[0] }));
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
                await base44.entities.BackflowReport.update(existingId, payload);
            } else {
                const created = await base44.entities.BackflowReport.create(payload);
                if (created?.id) reportIdRef.current = created.id;
            }
            await queryClient.invalidateQueries({ queryKey: ["backflowReport", inspectionId] });
        } else {
            await offlineStorage.cacheData(`backflow_report_${inspectionId}`, payload);
            const existingId = reportIdRef.current || existingReport?.[0]?.id;
            if (existingId) {
                await queueSync("update_backflow_report", { id: existingId, updates: payload });
            } else {
                await queueSync("create_backflow_report", payload);
            }
        }
    };

    useAutoSave({
        data: formData,
        reportIdRef,
        saveInFlightRef,
        saveFunction: autoSaveFunction,
        localKey: `backflow_report_${inspectionId}`,
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
        ? (formData.inspection_date.length === 10 ? format(new Date(formData.inspection_date + "T00:00:00"), "MM/dd/yyyy") : format(new Date(formData.inspection_date), "MM/dd/yyyy"))
        : (currentInspection.scheduled_date ? format(new Date(currentInspection.scheduled_date + "T00:00:00"), "MM/dd/yyyy") : "N/A");

    return (
        <div className="min-h-screen print:bg-white">
            <style>{`
                @media print {
                    @page { margin: 0.3in 0.4in; size: letter; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-size: 8pt; line-height: 1.15; color: #000; }
                    .no-print, .print\\:hidden { display: none !important; }
                    .max-w-4xl { max-width: 100%; margin: 0; padding: 0; }
                    .print-logo { height: 0.9in !important; width: auto !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 7pt; }
                    td, th { padding: 0.03in 0.05in; border: 0.5px solid #ccc; vertical-align: middle; }
                    th { font-weight: bold; background: #f0f0f0; text-align: center; }
                    .print-section { margin-bottom: 0.1in; }
                    .print-footer {
                        position: fixed; bottom: 0; left: 0; right: 0;
                        height: 0.55in; display: flex; align-items: center;
                        padding: 0 0.4in; border-top: 1px solid #ccc;
                        background: white; font-size: 7pt;
                    }
                    .print-footer-logo { height: 0.3in; width: auto; margin-right: 0.15in; }
                    .print-footer-text { flex: 1; text-align: center; font-size: 7pt; line-height: 1.3; }
                }
            `}</style>

            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 print:p-0">

                {/* Print Header */}
                <div className="hidden print:block text-center mb-2">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/de84799aa_NWFIRE-MobileNoBG.png"
                        alt="NW Fire & Safety"
                        className="print-logo"
                        style={{ height: "90px", width: "auto", margin: "0 auto", display: "block" }}
                    />
                    <div style={{ fontSize: "7pt", lineHeight: "1.2", marginTop: "0.05in" }}>
                        <div style={{ fontWeight: "bold" }}>Northwest Fire &amp; Safety, LLC</div>
                        <div>580-540-3119 | 2517 N Van Buren - Enid, OK 73703 | OK #AC441117, #466</div>
                    </div>
                    <h2 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0.08in 0 0.04in" }}>
                        Form For Inspection, Testing &amp; Maintenance Of Backflow Assemblies Per NFPA 25
                    </h2>
                </div>

                {/* Print: Customer Info */}
                <div className="hidden print:block print-section">
                    <table>
                        <tbody>
                            <tr>
                                <td style={{ width: "25%" }}><strong>Customer/Location:</strong></td>
                                <td style={{ width: "25%" }}>{client?.company_name || ""}</td>
                                <td style={{ width: "25%" }}><strong>Inspection Date:</strong></td>
                                <td style={{ width: "25%" }}>{displayDate}</td>
                            </tr>
                            <tr>
                                <td><strong>Address:</strong></td>
                                <td>{property?.address || client?.address || ""}</td>
                                <td><strong>Tag Status:</strong></td>
                                <td>{formData.tag_status}</td>
                            </tr>
                            <tr>
                                <td><strong>Phone Number:</strong></td>
                                <td>{client?.phone || ""}</td>
                                <td><strong>Contact:</strong></td>
                                <td>{client?.contact_name || ""}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Assembly Info */}
                <div className="hidden print:block print-section">
                    <table>
                        <thead>
                            <tr><th colSpan="6">Backflow Preventer Assembly Information</th></tr>
                            <tr>
                                <th>Assembly Make</th>
                                <th>Assembly Model</th>
                                <th>Assembly Serial #</th>
                                <th>Assembly Size</th>
                                <th>Assembly Type</th>
                                <th>External BFP #</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{formData.assembly_make}</td>
                                <td>{formData.assembly_model}</td>
                                <td>{formData.assembly_serial_number}</td>
                                <td>{formData.assembly_size}</td>
                                <td>{formData.assembly_type}</td>
                                <td>{formData.external_bfp_number}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Location & Config */}
                <div className="hidden print:block print-section">
                    <table>
                        <tbody>
                            <tr>
                                <td colSpan="4"><strong>Location Of Backflow Assembly:</strong> {formData.location_of_assembly}</td>
                            </tr>
                            <tr>
                                <td style={{ width: "25%" }}><strong>Protection Type:</strong></td>
                                <td style={{ width: "25%" }}>{formData.protection_type}</td>
                                <td style={{ width: "25%" }}><strong>Orientation:</strong></td>
                                <td style={{ width: "25%" }}>{formData.orientation}</td>
                            </tr>
                            <tr>
                                <td><strong>Line Pressure (PSI):</strong></td>
                                <td>{formData.line_pressure_psi}</td>
                                <td><strong>Backflow Assembly Type:</strong></td>
                                <td>{formData.backflow_assembly_type}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Test Results */}
                <div className="hidden print:block print-section">
                    <table>
                        <thead>
                            <tr><th colSpan="8">Initial Backflow Preventer Test Results</th></tr>
                            <tr>
                                <th colSpan="2">Check Valve #1 RP Pressure Drop</th>
                                <th colSpan="2">Check Valve #2</th>
                                <th colSpan="2">Relief Valve (&lt;2PSID) Opened At</th>
                                <th colSpan="2">Check Valve (&lt;3PSID) A-B=Buffer</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ width: "12.5%" }}>{formData.cv1_rp_psid} PSID</td>
                                <td style={{ width: "12.5%" }}>{formData.cv1_rp_result}</td>
                                <td style={{ width: "12.5%" }}>{formData.cv2_psid} PSID</td>
                                <td style={{ width: "12.5%" }}>{formData.cv2_result}</td>
                                <td style={{ width: "12.5%" }}>{formData.relief_valve_psid} PSID</td>
                                <td style={{ width: "12.5%" }}>{formData.relief_valve_pass_fail}</td>
                                <td style={{ width: "12.5%" }}>{formData.cv_3psid_buffer_psid} PSID</td>
                                <td style={{ width: "12.5%" }}>{formData.cv_3psid_buffer_pass_fail}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Final Results */}
                <div className="hidden print:block print-section">
                    <table>
                        <thead>
                            <tr>
                                <th colSpan="3">Check Valve #1</th>
                                <th colSpan="3">Check Valve #2</th>
                                <th colSpan="2">Sight Tube</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ width: "12.5%" }}><strong>Result:</strong> {formData.cv1_final_result}</td>
                                <td style={{ width: "12.5%" }}></td>
                                <td style={{ width: "12.5%" }}><strong>Pass/Fail:</strong> {formData.cv1_final_pass_fail}</td>
                                <td style={{ width: "12.5%" }}><strong>Result:</strong> {formData.cv2_final_result}</td>
                                <td style={{ width: "12.5%" }}></td>
                                <td style={{ width: "12.5%" }}><strong>Pass/Fail:</strong> {formData.cv2_final_pass_fail}</td>
                                <td colSpan="2">{formData.sight_tube}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Comments */}
                <div className="hidden print:block print-section">
                    <table>
                        <tbody>
                            <tr>
                                <td><strong>Comments / Deficiencies:</strong></td>
                            </tr>
                            <tr>
                                <td style={{ height: "0.6in", verticalAlign: "top" }}>{formData.comments_deficiencies}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Print: Signatures */}
                <div className="hidden print:block print-section">
                    <table>
                        <tbody>
                            <tr>
                                <td style={{ width: "50%", verticalAlign: "bottom" }}>
                                    {formData.technician_signature_url && (
                                        <img src={formData.technician_signature_url} alt="Technician Signature" style={{ maxHeight: "0.5in", width: "auto" }} />
                                    )}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "0.05in", paddingTop: "0.02in" }}>
                                        <strong>Technician Name / Lic #:</strong> {formData.technician_name}{formData.technician_license ? ` / ${formData.technician_license}` : ""}
                                    </div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "bottom" }}>
                                    {formData.customer_signature_url && (
                                        <img src={formData.customer_signature_url} alt="Customer Signature" style={{ maxHeight: "0.5in", width: "auto" }} />
                                    )}
                                    <div style={{ borderTop: "1px solid #000", marginTop: "0.05in", paddingTop: "0.02in" }}>
                                        <strong>Customer Name:</strong> {formData.customer_name}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== SCREEN VIEW ===== */}

                {/* Screen Header */}
                <div className="no-print mb-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Link to={createPageUrl("InspectionDetails") + `?id=${inspectionId}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="p-2 rounded-xl bg-blue-600">
                            <Droplets className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Backflow Report</h1>
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

                {/* Customer / Inspection Info */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Customer &amp; Inspection Info</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Customer / Location</Label>
                            <p className="font-semibold text-slate-900">{client?.company_name || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Address</Label>
                            <p className="font-medium text-slate-900">{property?.address || client?.address || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Phone Number</Label>
                            <p className="font-medium text-slate-900">{client?.phone || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Contact</Label>
                            <p className="font-medium text-slate-900">{client?.contact_name || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Inspection Date</Label>
                            <Input
                                type="date"
                                value={formData.inspection_date?.slice(0, 10) || currentInspection.scheduled_date?.slice(0, 10) || ""}
                                onChange={(e) => update("inspection_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <ComboField label="Tag Status" value={formData.tag_status} onChange={(v) => update("tag_status", v)} options={TAG_OPTIONS} placeholder="Select tag status" />
                        </div>
                    </CardContent>
                </Card>

                {/* Assembly Information */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Backflow Preventer Assembly Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Assembly Make</Label>
                            <Input value={formData.assembly_make} onChange={(e) => update("assembly_make", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Assembly Model</Label>
                            <Input value={formData.assembly_model} onChange={(e) => update("assembly_model", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Assembly Serial #</Label>
                            <Input value={formData.assembly_serial_number} onChange={(e) => update("assembly_serial_number", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Assembly Size</Label>
                            <Input value={formData.assembly_size} onChange={(e) => update("assembly_size", e.target.value)} placeholder='e.g., 1", 2"' />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Assembly Type</Label>
                            <Input value={formData.assembly_type} onChange={(e) => update("assembly_type", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">External BFP #</Label>
                            <Input value={formData.external_bfp_number} onChange={(e) => update("external_bfp_number", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-500 uppercase">Location Of Backflow Assembly</Label>
                            <Input value={formData.location_of_assembly} onChange={(e) => update("location_of_assembly", e.target.value)} />
                        </div>
                        <div>
                            <ComboField label="Protection Type" value={formData.protection_type} onChange={(v) => update("protection_type", v)} options={PROTECTION_TYPES} />
                        </div>
                        <div>
                            <ComboField label="Orientation" value={formData.orientation} onChange={(v) => update("orientation", v)} options={ORIENTATIONS} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase">Line Pressure (PSI)</Label>
                            <Input value={formData.line_pressure_psi} onChange={(e) => update("line_pressure_psi", e.target.value)} placeholder="e.g., 80" />
                        </div>
                        <div>
                            <ComboField label="Backflow Assembly Type" value={formData.backflow_assembly_type} onChange={(v) => update("backflow_assembly_type", v)} options={ASSEMBLY_TYPES_BFP} />
                        </div>
                    </CardContent>
                </Card>

                {/* Initial Test Results */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Initial Backflow Preventer Test Results</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* CV1 RP Pressure Drop */}
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Check Valve #1 – RP Pressure Drop</h4>
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">PSID Reading</Label>
                                <Input value={formData.cv1_rp_psid} onChange={(e) => update("cv1_rp_psid", e.target.value)} placeholder="e.g., 2.5" />
                            </div>
                            <ComboField label="Result" value={formData.cv1_rp_result} onChange={(v) => update("cv1_rp_result", v)} options={RESULT_OPTIONS} />
                        </div>

                        {/* CV2 */}
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Check Valve #2</h4>
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">PSID Reading</Label>
                                <Input value={formData.cv2_psid} onChange={(e) => update("cv2_psid", e.target.value)} placeholder="e.g., 2.5" />
                            </div>
                            <ComboField label="Result" value={formData.cv2_result} onChange={(v) => update("cv2_result", v)} options={RESULT_OPTIONS} />
                        </div>

                        {/* Relief Valve */}
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Relief Valve (&lt;2PSID) Opened At</h4>
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">PSID Reading</Label>
                                <Input value={formData.relief_valve_psid} onChange={(e) => update("relief_valve_psid", e.target.value)} placeholder="e.g., 1.8" />
                            </div>
                            <ComboField label="Pass/Fail" value={formData.relief_valve_pass_fail} onChange={(v) => update("relief_valve_pass_fail", v)} options={PASS_FAIL_OPTIONS} />
                        </div>

                        {/* CV <3PSID A-B=Buffer */}
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Check Valve (&lt;3PSID) A-B=Buffer</h4>
                            <div>
                                <Label className="text-xs text-slate-500 uppercase">PSID Reading</Label>
                                <Input value={formData.cv_3psid_buffer_psid} onChange={(e) => update("cv_3psid_buffer_psid", e.target.value)} placeholder="e.g., 1.2" />
                            </div>
                            <ComboField label="Pass/Fail" value={formData.cv_3psid_buffer_pass_fail} onChange={(v) => update("cv_3psid_buffer_pass_fail", v)} options={PASS_FAIL_OPTIONS} />
                        </div>
                    </CardContent>
                </Card>

                {/* Final Results */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Final Results</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Check Valve #1</h4>
                            <ComboField label="Result" value={formData.cv1_final_result} onChange={(v) => update("cv1_final_result", v)} options={RESULT_OPTIONS} />
                            <ComboField label="Pass/Fail" value={formData.cv1_final_pass_fail} onChange={(v) => update("cv1_final_pass_fail", v)} options={PASS_FAIL_OPTIONS} />
                        </div>
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Check Valve #2</h4>
                            <ComboField label="Result" value={formData.cv2_final_result} onChange={(v) => update("cv2_final_result", v)} options={RESULT_OPTIONS} />
                            <ComboField label="Pass/Fail" value={formData.cv2_final_pass_fail} onChange={(v) => update("cv2_final_pass_fail", v)} options={PASS_FAIL_OPTIONS} />
                        </div>
                        <div className="space-y-3 p-3 rounded-lg bg-slate-50 border">
                            <h4 className="font-semibold text-sm">Sight Tube</h4>
                            <ComboField label="Result" value={formData.sight_tube} onChange={(v) => update("sight_tube", v)} options={SIGHT_TUBE_OPTIONS} />
                        </div>
                    </CardContent>
                </Card>

                {/* Comments / Deficiencies */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Comments / Deficiencies</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea
                            value={formData.comments_deficiencies}
                            onChange={(e) => update("comments_deficiencies", e.target.value)}
                            placeholder="Enter any comments or deficiencies found..."
                            className="h-28"
                        />
                    </CardContent>
                </Card>

                {/* Signatures */}
                <Card className="mb-4 print:hidden">
                    <CardHeader><CardTitle className="text-base">Technician &amp; Customer</CardTitle></CardHeader>
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
                            <SignaturePad
                                label="Technician Signature"
                                value={formData.technician_signature_url}
                                onChange={(url) => update("technician_signature_url", url)}
                            />
                            <div>
                                <div className="mb-2">
                                    <Label className="text-xs text-slate-500 uppercase">Customer Name</Label>
                                    <Input value={formData.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
                                </div>
                                <SignaturePad
                                    label="Customer Signature"
                                    value={formData.customer_signature_url}
                                    onChange={(url) => update("customer_signature_url", url)}
                                />
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
                        <div className="bg-white p-6" style={{ fontSize: "8pt", lineHeight: "1.15", fontFamily: "system-ui, sans-serif" }}>
                            <div className="flex justify-center mb-2">
                                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/ab5e51f05_LOGO-2024-BlackSurround.jpg" alt="NW Fire & Safety" style={{ height: "0.8in", width: "auto" }} />
                            </div>
                            <div className="text-center mb-2 text-xs">
                                <div>Northwest Fire &amp; Safety, LLC | 580-540-3119</div>
                                <div>2517 N Van Buren - Enid, OK 73703 | OK #AC441117, #466</div>
                            </div>
                            <div className="text-center font-bold text-sm mb-3">Form For Inspection, Testing &amp; Maintenance Of Backflow Assemblies Per NFPA 25</div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt", marginBottom: "6px" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Customer:</strong> {client?.company_name}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Date:</strong> {displayDate}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Tag:</strong> {formData.tag_status}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }} colSpan="2"><strong>Address:</strong> {property?.address || client?.address}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Phone:</strong> {client?.phone}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt", marginBottom: "6px" }}>
                                <thead>
                                    <tr style={{ background: "#f0f0f0" }}>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Make</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Model</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Serial #</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Size</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Type</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>BFP #</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {[formData.assembly_make, formData.assembly_model, formData.assembly_serial_number, formData.assembly_size, formData.assembly_type, formData.external_bfp_number].map((v, i) => (
                                            <td key={i} style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{v || "—"}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt", marginBottom: "6px" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Location:</strong> {formData.location_of_assembly}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Protection:</strong> {formData.protection_type}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Orientation:</strong> {formData.orientation}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>Pressure:</strong> {formData.line_pressure_psi} PSI</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}><strong>BFP Type:</strong> {formData.backflow_assembly_type}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt", marginBottom: "6px" }}>
                                <thead>
                                    <tr style={{ background: "#f0f0f0" }}>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">CV#1 RP Drop</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">CV#2</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">Relief Valve</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">CV &lt;3PSID Buffer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv1_rp_psid} PSID</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv1_rp_result}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv2_psid} PSID</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv2_result}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.relief_valve_psid} PSID</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.relief_valve_pass_fail}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv_3psid_buffer_psid} PSID</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv_3psid_buffer_pass_fail}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt", marginBottom: "6px" }}>
                                <thead>
                                    <tr style={{ background: "#f0f0f0" }}>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">CV#1 Final</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }} colSpan="2">CV#2 Final</th>
                                        <th style={{ border: "0.5px solid #ccc", padding: "2px" }}>Sight Tube</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv1_final_result}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv1_final_pass_fail}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv2_final_result}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.cv2_final_pass_fail}</td>
                                        <td style={{ border: "0.5px solid #ccc", padding: "2px 4px" }}>{formData.sight_tube}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {formData.comments_deficiencies && (
                                <div style={{ border: "0.5px solid #ccc", padding: "4px", marginBottom: "6px", fontSize: "7pt" }}>
                                    <strong>Comments / Deficiencies:</strong> {formData.comments_deficiencies}
                                </div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                                <div style={{ border: "0.5px solid #ccc", padding: "4px" }}>
                                    {formData.technician_signature_url && <img src={formData.technician_signature_url} alt="Tech sig" style={{ maxHeight: "0.5in", width: "auto" }} />}
                                    <div style={{ borderTop: "0.5px solid #000", marginTop: "4px", fontSize: "7pt" }}>
                                        Technician: {formData.technician_name} {formData.technician_license && `/ ${formData.technician_license}`}
                                    </div>
                                </div>
                                <div style={{ border: "0.5px solid #ccc", padding: "4px" }}>
                                    {formData.customer_signature_url && <img src={formData.customer_signature_url} alt="Cust sig" style={{ maxHeight: "0.5in", width: "auto" }} />}
                                    <div style={{ borderTop: "0.5px solid #000", marginTop: "4px", fontSize: "7pt" }}>
                                        Customer: {formData.customer_name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Print Footer */}
                <div className="hidden print:block print-footer">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/321b7a425_FooterLogo.png"
                        alt="NW Fire & Safety"
                        className="print-footer-logo"
                    />
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