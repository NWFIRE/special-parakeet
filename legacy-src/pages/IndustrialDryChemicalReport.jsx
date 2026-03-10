import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Upload, Flame, Printer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import SignaturePad from "../components/inspections/SignaturePad";
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
import { useAutoSave } from "../components/reports/useAutoSave";
import AutoSaveIndicator from "../components/reports/AutoSaveIndicator";
import { useOfflineData } from "../components/offline/useOfflineData";
import { offlineStorage } from "../components/offline/offlineStorage";

const fusibleLinkTemps = ["165°F", "212°F", "280°F", "286°F", "360°F", "450°F", "500°F"];
const blowOffCapMaterials = ["Rubber", "Stainless"];
const gasValveSizes = ['3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'];
const quantityOptions = Array.from({ length: 21 }, (_, i) => i.toString());
const ductQuantityOptions = ["0", "1", "2", "3", "4", "5"];

const checklistItems = [
  { key: "q1",  label: "System installed in accordance with MFG & UL?" },
  { key: "q2",  label: "System discharged prior to arrival?" },
  { key: "q3",  label: "Evidence of tampering since last inspection?" },
  { key: "q4",  label: "Hazard properly covered w/ correct nozzles?" },
  { key: "q5",  label: "Check position of all nozzles?" },
  { key: "q6",  label: "Pressure gauge in proper range if equipped?" },
  { key: "q7",  label: "Checked cartridge weight or replaced?" },
  { key: "q8",  label: "Checked pneumatic actuator?" },
  { key: "q9",  label: "Inspected cylinder and mount?" },
  { key: "q10", label: "Operated system with terminal link?" },
  { key: "q11", label: "Checked operation of electronic detection?" },
  { key: "q12", label: "Checked travel of cable and link position?" },
  { key: "q13", label: "Replaced fusible link(s)?" },
  { key: "q14", label: "Checked operation of manual pull station?" },
  { key: "q15", label: "Checked operation of time delay?" },
  { key: "q16", label: "Checked operation of micro-switch?" },
  { key: "q17", label: "Checked operation of gas valve?" },
  { key: "q18", label: "Checked operation of shut downs?" },
  { key: "q19", label: "Checked reserve power supply?" },
  { key: "q20", label: "Piping/conduit securely bracketed?" },
  { key: "q21", label: "Nozzles cleaned and proper caps in place?" },
  { key: "q22", label: "Fire alarm interconnection functioning?" },
  { key: "q23", label: "Proper fire extinguishers for other areas?" },
  { key: "q24", label: "Personnel instructed on operation of system?" },
  { key: "q25", label: "Monthly inspections being performed?" },
  { key: "q26", label: "System discharged since last inspection?" },
  { key: "q27", label: "System returned to normal operational condition?" },
  { key: "q28", label: "Plans of original installation on site?" },
  { key: "q29", label: "Inspection tag installed on system?" },
];

export default function IndustrialDryChemicalReport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const inspectionId = urlParams.get('inspection_id');

  const [formData, setFormData] = useState({
    inspection_id: inspectionId || "",
    client_id: "",
    property_id: "",
    service_date: "",
    service_time: "",
    type_of_service: "",
    system_status: "Green Tag",
    system_size_lbs: "",
    num_cylinders: "",
    ul_1254_compliant: false,
    system_location: "",
    area_protected: "",
    manufacturer: "",
    model: "",
    cylinder_dates: "",
    checklist: {},
    fusible_links_used: [],
    blow_off_caps_qty: 0,
    blow_off_caps_type: "",
    last_cylinder_hydro_date: "",
    num_ducts: "",
    duct_sizes_nozzles: "",
    duct_nozzle_type: "",
    size_of_gas_valve: "",
    type_of_gas_valve: "N/A",
    comments_deficiencies: "",
    system_photos: [],
    technician_name: "",
    technician_license: "",
    customer_name: "",
    customer_signature_url: ""
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { isOnline, queueSync } = useOfflineData();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
  });

  const { data: inspection } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => base44.entities.Inspection.filter({ id: inspectionId }),
    enabled: !!inspectionId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ['existingIndustrialDryChemicalReport', inspectionId],
    queryFn: () => base44.entities.IndustrialDryChemicalReport.filter({ inspection_id: inspectionId }),
    enabled: !!inspectionId,
  });

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const loadReportData = async () => {
      if (!isOnline) {
        const cachedData = await offlineStorage.getCachedData(`industrial_dry_chemical_report_${inspectionId}`);
        if (cachedData) {
          setFormData(prev => ({
            ...prev,
            ...cachedData,
            fusible_links_used: cachedData.fusible_links_used || [],
          }));
          return;
        }
      }

      if (inspection?.[0] || existingReport?.[0]) {
        const insp = inspection?.[0];
        const report = existingReport?.[0];
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        const fusibleLinksArray = report?.fusible_links_used
          ? report.fusible_links_used.split(", ").map(link => {
              const match = link.match(/(\d+)x\s(\d+)\s*°?F/i);
              const qty = match?.[1] || "";
              const temp = match?.[2] ? `${match[2]}°F` : "";
              return { quantity: qty, temperature: temp };
            })
          : [];

        setFormData(prev => ({
          ...prev,
          inspection_id: report?.inspection_id || inspectionId || "",
          client_id: report?.client_id || insp?.client_id || "",
          property_id: report?.property_id || insp?.property_id || "",
          service_date: report?.service_date || insp?.scheduled_date || currentDate,
          service_time: report?.service_time || insp?.scheduled_time || currentTime,
          type_of_service: report?.type_of_service || "",
          system_status: report?.system_status || "Green Tag",
          system_size_lbs: report?.system_size_lbs || "",
          num_cylinders: report?.num_cylinders || "",
          ul_1254_compliant: report?.ul_1254_compliant || false,
          system_location: report?.system_location || "",
          area_protected: report?.area_protected || "",
          manufacturer: report?.manufacturer || "",
          model: report?.model || "",
          cylinder_dates: report?.cylinder_dates || "",
          checklist: report?.checklist || {},
          fusible_links_used: fusibleLinksArray,
          blow_off_caps_qty: report?.blow_off_caps_qty ?? 0,
          blow_off_caps_type: report?.blow_off_caps_type || "",
          last_cylinder_hydro_date: report?.last_cylinder_hydro_date || "",
          num_ducts: report?.num_ducts || "",
          duct_sizes_nozzles: report?.duct_sizes_nozzles || "",
          duct_nozzle_type: report?.duct_nozzle_type || "",
          size_of_gas_valve: report?.size_of_gas_valve || "",
          type_of_gas_valve: report?.type_of_gas_valve || "N/A",
          comments_deficiencies: report?.comments_deficiencies || "",
          system_photos: report?.system_photos || [],
          technician_name: (report?.technician_name && report.technician_name.trim()) || insp?.inspector_name || "",
          technician_license: report?.technician_license || "",
          customer_name: report?.customer_name || "",
          customer_signature_url: report?.customer_signature_url || ""
        }));
      }
    };

    loadReportData();
  }, [inspection, existingReport, inspectionId, isOnline]);

  const filteredProperties = properties.filter(p => p.client_id === formData.client_id);

  const handleChecklistChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: value }
    }));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const errors = [];
    if (!formData.service_date) errors.push("Service Date");
    if (!formData.client_id) errors.push("Client");
    if (!formData.technician_name) errors.push("Technician Name");

    if (errors.length > 0) {
      toast.error(`Please fill in the following required fields: ${errors.join(", ")}`);
      return;
    }

    setIsSaving(true);

    try {
      const fusibleLinksString =
        formData.fusible_links_used?.length > 0
          ? formData.fusible_links_used
              .filter((l) => l.quantity && l.temperature)
              .map((l) => `${l.quantity}x ${l.temperature}`)
              .join(", ")
          : "";

      const blowOffCapsString =
        Number(formData.blow_off_caps_qty || 0) > 0
          ? `${formData.blow_off_caps_qty}x ${formData.blow_off_caps_type || ""}`.trim()
          : "";

      const dataToSave = {
        inspection_id: formData.inspection_id,
        client_id: formData.client_id,
        property_id: formData.property_id,
        service_date: formData.service_date,
        service_time: formData.service_time,
        type_of_service: formData.type_of_service,
        system_status: formData.system_status,
        system_size_lbs: formData.system_size_lbs,
        num_cylinders: formData.num_cylinders,
        ul_1254_compliant: formData.ul_1254_compliant,
        system_location: formData.system_location,
        area_protected: formData.area_protected,
        manufacturer: formData.manufacturer,
        model: formData.model,
        cylinder_dates: formData.cylinder_dates,
        checklist: formData.checklist,
        fusible_links_used: fusibleLinksString,
        blow_off_caps_qty: formData.blow_off_caps_qty,
        blow_off_caps_type: formData.blow_off_caps_type,
        blow_off_caps_used: blowOffCapsString,
        last_cylinder_hydro_date: formData.last_cylinder_hydro_date,
        num_ducts: formData.num_ducts,
        duct_sizes_nozzles: formData.duct_sizes_nozzles,
        duct_nozzle_type: formData.duct_nozzle_type,
        size_of_gas_valve: formData.size_of_gas_valve,
        type_of_gas_valve: formData.type_of_gas_valve,
        comments_deficiencies: formData.comments_deficiencies,
        system_photos: formData.system_photos,
        technician_name: formData.technician_name,
        technician_license: formData.technician_license,
        customer_name: formData.customer_name,
        customer_signature_url: formData.customer_signature_url,
      };

      if (isOnline) {
        if (existingReport?.[0]?.id) {
          await base44.entities.IndustrialDryChemicalReport.update(existingReport[0].id, dataToSave);
          toast.success("Report updated successfully");
        } else {
          await base44.entities.IndustrialDryChemicalReport.create(dataToSave);
          toast.success("Report created successfully");
        }

        if (formData.comments_deficiencies && formData.comments_deficiencies.trim()) {
          const existingDeficiencies = await base44.entities.Deficiency.filter({
            inspection_id: inspectionId,
            category: "kitchen_suppression"
          });
          if (existingDeficiencies.length === 0) {
            await base44.entities.Deficiency.create({
              inspection_id: inspectionId,
              property_id: formData.property_id,
              client_id: formData.client_id,
              title: "Industrial Dry Chemical System Issues",
              description: formData.comments_deficiencies,
              severity: formData.system_status === "Red Tag" ? "critical" : formData.system_status === "Yellow Tag" ? "high" : "medium",
              category: "kitchen_suppression",
              status: "open"
            });
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["existingIndustrialDryChemicalReport", inspectionId] });
        await queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
        setIsDirty(false);
      } else {
        await offlineStorage.cacheData(`industrial_dry_chemical_report_${inspectionId}`, dataToSave);
        if (existingReport?.[0]?.id) {
          await queueSync('update_industrial_dry_chemical_report', { id: existingReport[0].id, updates: dataToSave });
        } else {
          await queueSync('create_industrial_dry_chemical_report', dataToSave);
        }
        toast.success("Report saved offline - will sync when connected");
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(isOnline ? "Failed to save report" : "Failed to save offline");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = (e) => {
    if (isDirty) {
      e.preventDefault();
      setShowExitDialog(true);
    }
  };

  const { isSaving: isAutoSaving, lastSaved } = useAutoSave(formData, handleSubmit, { enabled: isDirty });

  return (
    <div className="min-h-screen print:bg-white">
      <style>{`
        :root{
          --brand-blue:#0060B0;
          --brand-orange:#F06000;
          --text:#1a1a1a;
          --muted:#666;
          --line:#e9e9e9;
          --soft:#fafafa;
        }
        @media print {
          @page { margin: 0.5in; }
          body{ font-family:"Helvetica Neue", Helvetica, Arial, sans-serif; font-size:12px; color:var(--text); margin:0; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print\\:hidden { display: none !important; }
          .report-header{ display:grid; grid-template-columns:180px 1fr 240px; align-items:start; column-gap:16px; }
          .logo{ max-height:90px; width:auto; display:block; }
          .report-title{ text-align:center; font-size:22px; font-weight:800; color:var(--brand-blue); margin-top:10px; }
          .company-subtitle{ text-align:center; font-size:11px; color:var(--muted); margin-top:6px; }
          .meta-block{ text-align:right; font-size:11px; line-height:1.6; }
          .divider{ height:3px; background:var(--brand-orange); border-radius:3px; margin:18px 0 24px; }
          .section{ margin-bottom:22px; }
          .info-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px 40px; }
          .info-item strong{ display:block; font-size:11px; text-transform:uppercase; color:var(--brand-blue); letter-spacing:.5px; }
          .badge{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; border:1px solid var(--line); background:#fff; }
          .badge-green{ color:#2e7d32; border-color:#cfe8d4; background:#f4fbf6; }
          .badge-red{ color:#c62828; border-color:#f0c8c8; background:#fff6f6; }
          .badge-orange{ color:var(--brand-orange); border-color:#ffd9c4; background:#fff7f2; }
          .card{ border:1px solid var(--line); border-radius:10px; padding:14px; background:white; page-break-inside:avoid; }
          .card-title{ font-weight:800; color:var(--brand-blue); margin-bottom:8px; }
          table{ width:100%; border-collapse:collapse; }
          thead{ display:table-header-group; border-bottom:2px solid var(--brand-blue); }
          th{ text-align:left; padding:10px 6px; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--brand-blue); }
          td{ padding:8px 6px; border-bottom:1px solid var(--line); font-size:11px; }
          tr{ page-break-inside:avoid; break-inside:avoid; }
          .signature-row{ display:flex; justify-content:space-between; margin-top:20px; }
          .signature-block{ width:48%; }
          .signature-line{ border-bottom:1px solid #000; height:40px; margin-bottom:6px; }
          .signature-image{ height:40px; margin-bottom:6px; }
          .footer{ margin-top:30px; font-size:10px; text-align:center; color:#888; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 print:p-0 overflow-x-hidden">
        {/* Print Header */}
        <div className="hidden print:block">
          <div className="report-header">
            <div>
              <img className="logo" src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/de84799aa_NWFIRE-MobileNoBG.png" alt="NW Fire & Safety Logo" />
            </div>
            <div>
              <div className="report-title">Industrial Dry Chemical System Report</div>
              <div className="company-subtitle">
                580-540-3119 | 2517 N Van Buren, Enid, OK 73703<br />
                OK #AC441117, #466
              </div>
            </div>
            <div className="meta-block">
              <div><strong>Date:</strong> {formData.service_date ? format(new Date(formData.service_date), "MM/dd/yyyy") : 'N/A'}</div>
              <div><strong>Technician:</strong> {formData.technician_name || 'N/A'}</div>
              <div><strong>Report #:</strong> {inspectionId?.slice(0, 8).toUpperCase() || 'N/A'}</div>
            </div>
          </div>
          <div className="divider"></div>
        </div>

        <div className="mb-3 print:mb-2">
          <div className="flex justify-center mb-2 print:hidden">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/ab5e51f05_LOGO-2024-BlackSurround.jpg"
              alt="NW Fire & Safety"
              className="h-16 w-auto"
            />
          </div>
          <div className="text-center mb-4 print:hidden text-xs leading-tight">
            <div>Northwest Fire & Safety, LLC</div>
            <div>580-540-3119</div>
            <div>2517 N Van Buren - Enid, OK 73703</div>
            <div>www.nwfireandsafety.com</div>
            <div>OK # AC441117, 466</div>
          </div>

          <div className="no-print mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("InspectionDetails") + `?id=${inspectionId}`} onClick={handleBackClick}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 rounded-xl bg-orange-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Industrial Dry Chemical System</h1>
                <p className="text-slate-500 text-xs truncate">NFPA 17 Requirements</p>
              </div>
              <AutoSaveIndicator isSaving={isAutoSaving} lastSaved={lastSaved} />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 relative overflow-hidden no-print"
          >
            {isSaving && (
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 animate-pulse pointer-events-none" />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{existingReport?.[0] ? "Update Report" : "Save Report"}</>
              )}
            </span>
          </Button>
        </div>

        {/* Print: Info grid */}
        <div className="hidden print:block">
          <div className="section">
            <div className="info-grid">
              <div className="info-item">
                <strong>Client</strong>
                <span>{clients.find(c => c.id === formData.client_id)?.company_name || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Property</strong>
                <span>{properties.find(p => p.id === formData.property_id)?.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>Property Address</strong>
                <span>{properties.find(p => p.id === formData.property_id)?.address || clients.find(c => c.id === formData.client_id)?.address || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Inspection Type</strong>
                <span>{formData.type_of_service || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>System Status</strong>
                <span className={`badge ${formData.system_status === 'Green Tag' ? 'badge-green' : formData.system_status === 'Red Tag' ? 'badge-red' : 'badge-orange'}`}>{formData.system_status}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="card">
              <div className="card-title">System Details</div>
              <table>
                <tbody>
                  <tr>
                    <td style={{ width: "25%" }}><strong>Size (Lbs):</strong></td>
                    <td style={{ width: "25%" }}>{formData.system_size_lbs || "-"}</td>
                    <td style={{ width: "25%" }}><strong># Cylinders:</strong></td>
                    <td style={{ width: "25%" }}>{formData.num_cylinders || "-"}</td>
                  </tr>
                  <tr>
                    <td><strong>Manufacturer:</strong></td>
                    <td>{formData.manufacturer || "-"}</td>
                    <td><strong>Model:</strong></td>
                    <td>{formData.model || "-"}</td>
                  </tr>
                  <tr>
                    <td><strong>Location:</strong></td>
                    <td>{formData.system_location || "-"}</td>
                    <td><strong>Area Protected:</strong></td>
                    <td>{formData.area_protected || "-"}</td>
                  </tr>
                  <tr>
                    <td><strong>Last Hydro:</strong></td>
                    <td>{formData.last_cylinder_hydro_date || "-"}</td>
                    <td><strong>Gas Valve:</strong></td>
                    <td>{formData.type_of_gas_valve} - {formData.size_of_gas_valve || "N/A"}</td>
                  </tr>
                  <tr>
                    <td><strong>UL 1254 Compliant:</strong></td>
                    <td colSpan="3">{formData.ul_1254_compliant ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <div className="card">
              <div className="card-title">Inspection Checklist</div>
              <table>
                <tbody>
                  {checklistItems.map((item, idx) => (
                    <tr key={item.key}>
                      <td style={{ width: "70%" }}>{idx + 1}. {item.label}</td>
                      <td style={{ width: "30%", textAlign: "center" }}><strong>{formData.checklist[item.key] || "N/A"}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <div className="card">
              <div className="card-title">Additional Details</div>
              <table>
                <tbody>
                  <tr>
                    <td style={{ width: "25%" }}><strong>Fusible Links:</strong></td>
                    <td style={{ width: "25%" }}>
                      {formData.fusible_links_used?.map(l => `${l.quantity}x ${l.temperature}`).join(", ") || "-"}
                    </td>
                    <td style={{ width: "25%" }}><strong>Caps Used:</strong></td>
                    <td style={{ width: "25%" }}>
                      {formData.blow_off_caps_qty > 0
                        ? `${formData.blow_off_caps_qty}x ${formData.blow_off_caps_type || ""}`.trim()
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td><strong># Ducts:</strong></td>
                    <td>{formData.num_ducts || "-"}</td>
                    <td><strong>Duct Size:</strong></td>
                    <td>{formData.duct_sizes_nozzles || "-"}</td>
                  </tr>
                  <tr>
                    <td><strong>Duct Nozzle Type & Qty:</strong></td>
                    <td colSpan="3">{formData.duct_nozzle_type || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {formData.comments_deficiencies && (
            <div className="section">
              <div className="card">
                <div className="card-title">Comments / Deficiencies</div>
                <div style={{fontSize: "11px", whiteSpace: "pre-wrap"}}>{formData.comments_deficiencies}</div>
              </div>
            </div>
          )}

          {formData.system_photos.length > 0 && (
            <div className="section">
              <div className="card">
                <div className="card-title">System Photos</div>
                <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px"}}>
                  {formData.system_photos.map((url, idx) => (
                    <img key={idx} src={url} alt={`System photo ${idx + 1}`} style={{width: "100%", height: "1in", objectFit: "cover", border: "1px solid var(--line)", borderRadius: "4px"}} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="section">
            <div className="card">
              <div className="card-title">Signatures</div>
              <div className="signature-row">
                <div className="signature-block">
                  {formData.customer_signature_url ?
                    <img src={formData.customer_signature_url} className="signature-image" alt="Customer Signature" /> :
                    <div className="signature-line"></div>}
                  Customer Signature<br />
                  Printed Name: {formData.customer_name || '____________________'}<br />
                  Date: ____________________
                </div>
                <div className="signature-block">
                  <div className="signature-line"></div>
                  Technician Signature<br />
                  Printed Name: {formData.technician_name || '____________________'}<br />
                  License #: {formData.technician_license || '____________________'}
                </div>
              </div>
            </div>
          </div>

          <div className="footer">
            Generated by NW FIRE Mobile | NFPA 17 Compliant Report
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6 print:hidden">
          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Service Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service Date *</Label>
                <Input type="date" value={formData.service_date} onChange={(e) => { setFormData({ ...formData, service_date: e.target.value }); setIsDirty(true); }} required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Service Time</Label>
                <Input type="time" value={formData.service_time} onChange={(e) => { setFormData({ ...formData, service_time: e.target.value }); setIsDirty(true); }} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Type of Service</Label>
                <Select value={formData.type_of_service} onValueChange={(value) => { setFormData({ ...formData, type_of_service: value }); setIsDirty(true); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select service type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                    <SelectItem value="Install">Install</SelectItem>
                    <SelectItem value="Recharge">Recharge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>System Status</Label>
                <Select value={formData.system_status} onValueChange={(value) => { setFormData({ ...formData, system_status: value }); setIsDirty(true); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green Tag">Green Tag</SelectItem>
                    <SelectItem value="Yellow Tag">Yellow Tag</SelectItem>
                    <SelectItem value="Red Tag">Red Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Client & Property Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.client_id} onValueChange={(value) => { setFormData({ ...formData, client_id: value, property_id: "" }); setIsDirty(true); }}>
                  <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={formData.property_id} onValueChange={(value) => { setFormData({ ...formData, property_id: value }); setIsDirty(true); }} disabled={!formData.client_id || filteredProperties.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                  <SelectContent>
                    {filteredProperties.map(property => (
                      <SelectItem key={property.id} value={property.id}>{property.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">System Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Size (Lbs)</Label>
                  <Input type="number" value={formData.system_size_lbs} onChange={(e) => { setFormData({ ...formData, system_size_lbs: e.target.value }); setIsDirty(true); }} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Cylinders</Label>
                  <Input type="number" value={formData.num_cylinders} onChange={(e) => { setFormData({ ...formData, num_cylinders: e.target.value }); setIsDirty(true); }} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ul_1254_compliant"
                  checked={formData.ul_1254_compliant}
                  onCheckedChange={(checked) => { setFormData({ ...formData, ul_1254_compliant: checked }); setIsDirty(true); }}
                />
                <Label htmlFor="ul_1254_compliant">UL 1254 Compliant</Label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>System Location</Label>
                  <Input value={formData.system_location} onChange={(e) => { setFormData({ ...formData, system_location: e.target.value }); setIsDirty(true); }} />
                </div>
                <div className="space-y-2">
                  <Label>Area Protected</Label>
                  <Input value={formData.area_protected} onChange={(e) => { setFormData({ ...formData, area_protected: e.target.value }); setIsDirty(true); }} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer} onChange={(e) => { setFormData({ ...formData, manufacturer: e.target.value }); setIsDirty(true); }} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={formData.model} onChange={(e) => { setFormData({ ...formData, model: e.target.value }); setIsDirty(true); }} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cylinder Dates</Label>
                <Input value={formData.cylinder_dates} onChange={(e) => { setFormData({ ...formData, cylinder_dates: e.target.value }); setIsDirty(true); }} placeholder="e.g., 01/2023, 03/2024" />
              </div>
              <div className="space-y-2">
                <Label>Last Cylinder Hydro Date</Label>
                <Input type="date" value={formData.last_cylinder_hydro_date} onChange={(e) => { setFormData({ ...formData, last_cylinder_hydro_date: e.target.value }); setIsDirty(true); }} />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">System Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.map((item, idx) => (
                <div key={item.key} className="flex items-center justify-between gap-2">
                  <Label className="flex-1 text-sm">{idx + 1}. {item.label}</Label>
                  <Select value={formData.checklist[item.key] || ""} onValueChange={(value) => { handleChecklistChange(item.key, value); setIsDirty(true); }}>
                    <SelectTrigger className="w-[100px] shrink-0"><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Fusible Links Used
                <Button type="button" variant="outline" size="sm" onClick={() => { setFormData(prev => ({ ...prev, fusible_links_used: [...prev.fusible_links_used, { quantity: "", temperature: "" }] })); setIsDirty(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Link
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.fusible_links_used.map((link, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-end">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Select value={link.quantity || ""} onValueChange={(value) => { const newLinks = [...formData.fusible_links_used]; newLinks[index].quantity = value; setFormData({ ...formData, fusible_links_used: newLinks }); setIsDirty(true); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Qty" /></SelectTrigger>
                      <SelectContent>{quantityOptions.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Select value={link.temperature || ""} onValueChange={(value) => { const newLinks = [...formData.fusible_links_used]; newLinks[index].temperature = value; setFormData({ ...formData, fusible_links_used: newLinks }); setIsDirty(true); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Temp" /></SelectTrigger>
                      <SelectContent>{fusibleLinkTemps.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setFormData({ ...formData, fusible_links_used: formData.fusible_links_used.filter((_, i) => i !== index) }); setIsDirty(true); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Additional Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blow-Off Caps Used (Qty)</Label>
                  <Select value={String(formData.blow_off_caps_qty ?? 0)} onValueChange={(value) => { setFormData({ ...formData, blow_off_caps_qty: Number(value) }); setIsDirty(true); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{quantityOptions.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blow-Off Caps Used (Type)</Label>
                  <Select value={formData.blow_off_caps_type || ""} onValueChange={(value) => { setFormData({ ...formData, blow_off_caps_type: value }); setIsDirty(true); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select material" /></SelectTrigger>
                    <SelectContent>{blowOffCapMaterials.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Ducts</Label>
                  <Select value={formData.num_ducts || ""} onValueChange={(value) => { setFormData({ ...formData, num_ducts: value }); setIsDirty(true); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select number" /></SelectTrigger>
                    <SelectContent>{ductQuantityOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duct Size</Label>
                  <Input value={formData.duct_sizes_nozzles} onChange={(e) => { setFormData({ ...formData, duct_sizes_nozzles: e.target.value }); setIsDirty(true); }} placeholder="e.g., 20x20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duct Nozzle Type and Quantity</Label>
                  <Input value={formData.duct_nozzle_type} onChange={(e) => { setFormData({ ...formData, duct_nozzle_type: e.target.value }); setIsDirty(true); }} placeholder="e.g., Type A - 2 nozzles" />
                </div>
                <div className="space-y-2">
                  <Label>Size of Gas Valve</Label>
                  <Select value={formData.size_of_gas_valve} onValueChange={(value) => { setFormData({ ...formData, size_of_gas_valve: value }); setIsDirty(true); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder='Select size' /></SelectTrigger>
                    <SelectContent>{gasValveSizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type of Gas Valve</Label>
                <Select value={formData.type_of_gas_valve} onValueChange={(value) => { setFormData({ ...formData, type_of_gas_valve: value }); setIsDirty(true); }}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Comments / Deficiencies</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={formData.comments_deficiencies} onChange={(e) => { setFormData({ ...formData, comments_deficiencies: e.target.value }); setIsDirty(true); }} rows={5} placeholder="Enter any comments or deficiencies here..." />
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">System Photos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  if (e.target.files) {
                    try {
                      const files = Array.from(e.target.files);
                      const newPhotos = [];
                      for (const file of files) {
                        if (isOnline) {
                          const result = await base44.integrations.Core.UploadFile({ file });
                          newPhotos.push(result.file_url);
                        } else {
                          const reader = new FileReader();
                          const photoData = await new Promise((resolve) => { reader.onload = (event) => resolve(event.target.result); reader.readAsDataURL(file); });
                          newPhotos.push(photoData);
                          await offlineStorage.saveOfflinePhoto(inspectionId, photoData);
                          await queueSync('upload_photo', { inspectionId, photoData, filename: file.name });
                        }
                      }
                      setFormData(prev => ({ ...prev, system_photos: [...prev.system_photos, ...newPhotos] }));
                      setIsDirty(true);
                    } catch (error) {
                      toast.error("Failed to save photos");
                    }
                  }
                }}
                className="hidden"
                id="photo-upload-idc"
              />
              <label htmlFor="photo-upload-idc" className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload photos</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.system_photos.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`System ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setFormData({ ...formData, system_photos: formData.system_photos.filter((_, i) => i !== index) }); setIsDirty(true); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Signatures</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Technician Name *</Label>
                <Input value={formData.technician_name} onChange={(e) => { setFormData({ ...formData, technician_name: e.target.value }); setIsDirty(true); }} required />
              </div>
              <div className="space-y-2">
                <Label>Technician License</Label>
                <Input value={formData.technician_license} onChange={(e) => { setFormData({ ...formData, technician_license: e.target.value }); setIsDirty(true); }} />
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={formData.customer_name} onChange={(e) => { setFormData({ ...formData, customer_name: e.target.value }); setIsDirty(true); }} />
              </div>
              <div className="space-y-2">
                <Label>Customer Signature</Label>
                <SignaturePad value={formData.customer_signature_url} onChange={(signature) => { setFormData({ ...formData, customer_signature_url: signature }); setIsDirty(true); }} />
              </div>
            </CardContent>
          </Card>

          <div className="no-print mt-6 flex items-center gap-3">
            <AutoSaveIndicator isSaving={isAutoSaving} lastSaved={lastSaved} />
            <Button type="button" onClick={handleSubmit} disabled={isSaving} size="lg" className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 relative overflow-hidden">
              {isSaving && <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 animate-pulse pointer-events-none" />}
              <span className="relative z-10 flex items-center justify-center">
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />{existingReport?.[0] ? "Update Report" : "Save Report"}</>}
              </span>
            </Button>
          </div>
        </form>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>You have unsaved changes. Are you sure you want to leave without saving?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay on Page</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate(createPageUrl("InspectionDetails") + `?id=${inspectionId}`)}>
                Leave Without Saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}