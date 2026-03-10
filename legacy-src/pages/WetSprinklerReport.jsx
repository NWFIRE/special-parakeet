import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignaturePad from "@/components/inspections/SignaturePad";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Save, AlertCircle, Eye, Plus, Trash2 } from "lucide-react";
import { useAutoSave } from "../components/reports/useAutoSave";
import AutoSaveIndicator from "../components/reports/AutoSaveIndicator";
import { useOfflineData } from "../components/offline/useOfflineData";
import { offlineStorage } from "../components/offline/offlineStorage";
import { toast } from "sonner";

const YNA = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 gap-2">
        <span className="text-sm flex-1">{label}</span>
        <div className="flex gap-1">
            {["Yes", "No", "N/A"].map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
                        value === opt
                            ? opt === "Yes" ? "bg-green-600 text-white border-green-600"
                            : opt === "No" ? "bg-red-600 text-white border-red-600"
                            : "bg-slate-500 text-white border-slate-500"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const YN = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 gap-2">
        <span className="text-sm flex-1">{label}</span>
        <div className="flex gap-1">
            {["Yes", "No"].map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
                        value === opt
                            ? opt === "Yes" ? "bg-green-600 text-white border-green-600"
                            : "bg-red-600 text-white border-red-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

export default function WetSprinklerReport() {
    const [showSaveAlert, setShowSaveAlert] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const { isOnline, queueSync } = useOfflineData();

    const urlParams = new URLSearchParams(window.location.search);
    const inspectionId = urlParams.get("inspection_id");

    const emptyReport = {
        service_date: "",
        inspection_type: "Annual",
        location_in_building: "",
        owner_section: {
            q1_building_occupied: null,
            q2_occupancy_hazard_same: null,
            q3_fire_protection_in_service: null,
            q4_no_modification: null,
            q5_no_actuation: null,
            q6_building_modifications: null,
            explanation: ""
        },
        owner_name: "",
        owner_signature_url: "",
        weekly_checklist: {
            q1_valves_correct_position: null,
            q2_locked_supervised_accessible: null
        },
        monthly_checklist: {
            q1_head_wrench_present: null,
            q2_gauges_normal_pressure: null,
            q3_alarm_valve_no_damage: null,
            q4_alarm_valve_trim_position: null,
            q5_no_leaks_retard_drain: null
        },
        quarterly_checklist: {
            q1_fdc_not_damaged: null,
            q2_alarm_devices_no_damage: null,
            q3_hydraulic_nameplate_legible: null
        },
        annual_checklist: {
            q1_proper_spare_heads: null,
            q2_no_corrosion_paint: null,
            q3_no_obstruction_damage: null,
            q4_liquid_glass_bulb: null,
            q5_pipe_no_corrosion: null,
            q6_pipe_no_damage_alignment: null,
            q7_hangers_no_damage: null,
            q8_adequate_heat: null,
            q9_escutcheon_plates_present: null,
            q10_system_monitored: null
        },
        five_year_checklist: {
            q1_alarm_valves_pass_internal: null,
            q2_check_valves_inspected: null
        },
        alarm_valve_info: {
            manufacturer: "",
            alarm_devices: "",
            valve_size: "",
            year: ""
        },
        sprinkler_head_info: [
            { manufacturer: "", type: "", year: "", temp: "", glass_bulb: "" }
        ],
        quarterly_tests: {
            no_flow_static_pressure: "",
            full_flow_residual_pressure: "",
            q3_full_flow_observed: null,
            q4_results_comparable: null,
            q5_water_flow_alarm_passed: null,
            q6_inspectors_test_open: null,
            q7_inspectors_test_location: "",
            q8_bypass_connection_open: null,
            q9_valve_supervisory_switch: null
        },
        annual_tests: {
            q1_standard_heads_under_50: null,
            q2_standard_heads_over_50_tested: null,
            q3_fast_response_under_20: null,
            q4_fast_response_over_20_tested: null,
            q5_control_valves_operate: null,
            q6_antifreeze_gravity_correct: null,
            q7_antifreeze_gravity_reading: ""
        },
        five_year_tests: {
            q1_gauges_replaced_calibrated: null,
            q2_high_temp_heads_tested: null
        },
        maintenance_items: {
            q1_riser_clearance: null,
            q2_system_left_in_service: null,
            q3_system_tagged: null,
            type_of_tag: ""
        },
        comments: "",
        technician_name: "",
        technician_license: "",
        technician_signature_url: "",
        assisting_technician_name: "",
        assisting_technician_license: "",
        customer_name: "",
        customer_signature_url: ""
    };

    const [report, setReport] = useState(emptyReport);
    const [address, setAddress] = useState("");

    const { data: inspection, isLoading: inspectionLoading } = useQuery({
        queryKey: ["inspection", inspectionId],
        queryFn: () => inspectionId ? base44.entities.Inspection.filter({ id: inspectionId }) : null,
        enabled: !!inspectionId,
    });

    const { data: properties } = useQuery({
        queryKey: ["properties"],
        queryFn: () => base44.entities.Property.list(),
    });

    const { data: clients } = useQuery({
        queryKey: ["clients"],
        queryFn: () => base44.entities.Client.list(),
    });

    const { data: existingReports } = useQuery({
        queryKey: ["wetSprinklerReports", inspectionId],
        queryFn: () => inspectionId ? base44.entities.WetSprinklerReport.filter({ inspection_id: inspectionId }) : null,
        enabled: !!inspectionId,
    });

    useEffect(() => {
        const load = async () => {
            if (!isOnline) {
                const cached = await offlineStorage.getCachedData(`wet_sprinkler_report_${inspectionId}`);
                if (cached) { setReport(cached); return; }
            }
            if (existingReports?.length > 0) {
                const existing = existingReports[0];
                setReport({ ...emptyReport, ...existing });
            }
        };
        load();
    }, [existingReports, isOnline, inspectionId]);

    useEffect(() => {
        if (inspection?.length > 0 && properties && clients) {
            const insp = inspection[0];
            const property = properties.find(p => p.id === insp?.property_id);
            const client = clients.find(c => c.id === insp?.client_id);
            if (property?.address) setAddress(property.address);
            else if (client?.address) setAddress(client.address);
            if (insp?.inspector_name && !report.technician_name) {
                setReport(prev => ({ ...prev, technician_name: insp.inspector_name, technician_license: insp.inspector_license || "" }));
            }
        }
    }, [inspection, properties, clients]);

    const set = (path, value) => {
        setReport(prev => {
            const keys = path.split(".");
            if (keys.length === 1) return { ...prev, [path]: value };
            return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } };
        });
        setIsDirty(true);
    };

    const addHeadRow = () => {
        setReport(prev => ({
            ...prev,
            sprinkler_head_info: [...(prev.sprinkler_head_info || []), { manufacturer: "", type: "", year: "", temp: "", glass_bulb: "" }]
        }));
        setIsDirty(true);
    };

    const updateHead = (idx, field, val) => {
        setReport(prev => {
            const updated = [...(prev.sprinkler_head_info || [])];
            updated[idx] = { ...updated[idx], [field]: val };
            return { ...prev, sprinkler_head_info: updated };
        });
        setIsDirty(true);
    };

    const removeHead = (idx) => {
        setReport(prev => ({
            ...prev,
            sprinkler_head_info: prev.sprinkler_head_info.filter((_, i) => i !== idx)
        }));
        setIsDirty(true);
    };

    async function handleSave() {
        setIsSaving(true);
        try {
            const inspectionData = inspection?.[0];
            const reportData = {
                ...report,
                inspection_id: inspectionData?.id,
                property_id: inspectionData?.property_id,
                client_id: inspectionData?.client_id,
            };
            if (isOnline) {
                if (existingReports?.length > 0) {
                    await base44.entities.WetSprinklerReport.update(existingReports[0].id, reportData);
                } else {
                    await base44.entities.WetSprinklerReport.create(reportData);
                }
                setIsDirty(false);
                setShowSaveAlert(true);
            } else {
                await offlineStorage.cacheData(`wet_sprinkler_report_${inspectionId}`, reportData);
                if (existingReports?.length > 0) {
                    await queueSync('update_wet_sprinkler_report', { id: existingReports[0].id, updates: reportData });
                } else {
                    await queueSync('create_wet_sprinkler_report', reportData);
                }
                toast.success("Saved offline - will sync when connected");
                setIsDirty(false);
            }
        } catch (error) {
            toast.error("Failed to save report");
        } finally {
            setIsSaving(false);
        }
    }

    const { isSaving: isAutoSaving, lastSaved } = useAutoSave(report, handleSave, { enabled: isDirty });

    if (inspectionLoading) return <div className="p-6 text-center animate-pulse text-slate-400">Loading...</div>;

    if (!inspection || inspection.length === 0) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader><CardTitle className="text-red-900 flex items-center gap-2"><AlertCircle className="h-5 w-5" />Inspection Not Found</CardTitle></CardHeader>
                    <CardContent className="text-red-800">The inspection could not be loaded. Please go back and try again.</CardContent>
                </Card>
            </div>
        );
    }

    const inspectionData = inspection[0];
    const propertyData = properties?.find(p => p.id === inspectionData?.property_id);
    const clientData = clients?.find(c => c.id === inspectionData?.client_id);

    const PrintView = () => (
        <div className="bg-white text-black text-xs" style={{ fontFamily: "Arial, sans-serif", fontSize: "7.5pt", lineHeight: "1.3" }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ea7ea2af617913d24cec9/de84799aa_NWFIRE-MobileNoBG.png" alt="NW Fire" style={{ height: "60px" }} />
                <div className="text-right text-xs">
                    <div>2517 N. Van Buren</div>
                    <div>Enid, OK 73703</div>
                    <div>580-540-3119</div>
                    <div>www.nwfireandsafety.com</div>
                    <div>OK #466</div>
                </div>
            </div>
            <div className="text-center font-bold text-sm mb-1 border-t border-b border-black py-1">
                Form for Inspection, Testing and Maintenance of Fire Sprinkler Systems
            </div>
            <div className="text-center text-xs mb-2">Information on this form covers the requirements of <u>NFPA 25</u> for fire sprinkler per IFC and the State of Oklahoma.</div>

            {/* Top Info */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
                <tbody>
                    <tr>
                        <td style={{ border: "1px solid black", padding: "2px 4px", width: "50%", fontWeight: "bold" }}>Date: {report.service_date}</td>
                        <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold" }}>Type of Inspection: {report.inspection_type?.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold" }}>Client Name: {clientData?.company_name}</td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold" }}>Address: {address}</td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold" }}>Location: {report.location_in_building}</td>
                    </tr>
                </tbody>
            </table>

            {/* Owner Section */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "2px" }}>Owner's Section</div>
            {[
                ["1. Is the building occupied?", report.owner_section?.q1_building_occupied],
                ["2. Have the occupancy and hazard of contents remained the same?", report.owner_section?.q2_occupancy_hazard_same],
                ["3. Are all fire protection systems in service?", report.owner_section?.q3_fire_protection_in_service],
                ["4. Has the system remained in service without modification?", report.owner_section?.q4_no_modification],
                ["5. Was the system free of actuation of devices or alarms?", report.owner_section?.q5_no_actuation],
                ["6. Have any building modifications or remodels taken place?", report.owner_section?.q6_building_modifications],
            ].map(([q, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ccc", padding: "1px 0" }}>
                    <span>{q}</span>
                    <span style={{ fontWeight: "bold" }}>☐Yes ☐No &nbsp;&nbsp; <span style={{ fontWeight: "bold", textDecoration: v ? "underline" : "none" }}>{v || ""}</span></span>
                </div>
            ))}
            {report.owner_section?.explanation && <div style={{ marginTop: "2px" }}>Explain: {report.owner_section.explanation}</div>}
            <div style={{ display: "flex", gap: "20px", marginTop: "4px", marginBottom: "4px" }}>
                <div>Owner or Representative Name: {report.owner_name}</div>
                <div>Owner or Representative Signature: _______________</div>
            </div>

            {/* Checklists */}
            {[
                { title: "Weekly Inspection Items:", items: [
                    ["1. Valves in correct (open/closed) position?", report.weekly_checklist?.q1_valves_correct_position, true],
                    ["2. Locked, supervised and accessible?", report.weekly_checklist?.q2_locked_supervised_accessible, true],
                ]},
                { title: "Monthly Inspection Items:", items: [
                    ["1. Sprinkler head wrench present?", report.monthly_checklist?.q1_head_wrench_present, true],
                    ["2. Gauges showing normal pressure?", report.monthly_checklist?.q2_gauges_normal_pressure, true],
                    ["3. Alarm valve free of physical damage?", report.monthly_checklist?.q3_alarm_valve_no_damage, true],
                    ["4. Alarm valve trim in proper position?", report.monthly_checklist?.q4_alarm_valve_trim_position, true],
                    ["5. No leaks from valve retard or drain?", report.monthly_checklist?.q5_no_leaks_retard_drain, true],
                ]},
                { title: "Quarterly Inspection Items:", items: [
                    ["1. Fire department connection not damaged?", report.quarterly_checklist?.q1_fdc_not_damaged, true],
                    ["2. Alarm devices free of damage?", report.quarterly_checklist?.q2_alarm_devices_no_damage, true],
                    ["3. Hydraulic name plate present and legible?", report.quarterly_checklist?.q3_hydraulic_nameplate_legible, true],
                ]},
                { title: "Annual Inspection Items:", items: [
                    ["1. Proper number and types of spare heads?", report.annual_checklist?.q1_proper_spare_heads, true],
                    ["2. Sprinklers free of corrosion or paint?", report.annual_checklist?.q2_no_corrosion_paint, true],
                    ["3. Sprinkler free of obstruction or damage?", report.annual_checklist?.q3_no_obstruction_damage, true],
                    ["4. Liquid present in glass bulb sprinklers?", report.annual_checklist?.q4_liquid_glass_bulb, true],
                    ["5. Visible pipe free of corrosion or loads?", report.annual_checklist?.q5_pipe_no_corrosion, true],
                    ["6. Visible pipe free of damage and alignment?", report.annual_checklist?.q6_pipe_no_damage_alignment, true],
                    ["7. Visible pipe hangers free of damage?", report.annual_checklist?.q7_hangers_no_damage, true],
                    ["8. Adequate heat in areas with wet piping?", report.annual_checklist?.q8_adequate_heat, true],
                    ["9. All escutcheon/cover plates are present?", report.annual_checklist?.q9_escutcheon_plates_present, true],
                    ["10. Is the sprinkler system monitored?", report.annual_checklist?.q10_system_monitored, true],
                ]},
                { title: "Five Year Inspection Items:", items: [
                    ["1. Alarm valves and associated strainers, filters and restricted orifices pass internal inspection?", report.five_year_checklist?.q1_alarm_valves_pass_internal, true],
                    ["2. Check valves internally inspected, all parts operate, and move freely and in good condition?", report.five_year_checklist?.q2_check_valves_inspected, true],
                ]},
            ].map(({ title, items }) => (
                <div key={title} style={{ marginBottom: "3px" }}>
                    <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{title}</div>
                    {items.map(([q, v, hasNA], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ddd", padding: "1px 0" }}>
                            <span>{q}</span>
                            <span>☐Yes ☐No {hasNA ? "☐N/A" : ""} &nbsp;<b>{v || ""}</b></span>
                        </div>
                    ))}
                </div>
            ))}

            {/* Alarm Valve Info */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginTop: "4px" }}>Alarm Valve Information:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginBottom: "4px" }}>
                <div>Manufacturer: {report.alarm_valve_info?.manufacturer}</div>
                <div>Alarm devices: {report.alarm_valve_info?.alarm_devices}</div>
                <div>Valve size: {report.alarm_valve_info?.valve_size}</div>
                <div>Year: {report.alarm_valve_info?.year}</div>
            </div>

            {/* PAGE 2 */}
            <div style={{ pageBreakBefore: "always" }} />

            {/* Sprinkler Head Info */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "2px" }}>Sprinkler Head Information:</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px", fontSize: "7pt" }}>
                <thead>
                    <tr>{["Manufacturer", "Type", "Year", "Temp", "Glass Bulb?"].map(h => (
                        <th key={h} style={{ border: "1px solid black", padding: "2px", textAlign: "center", background: "#eee" }}>{h}</th>
                    ))}</tr>
                </thead>
                <tbody>
                    {(report.sprinkler_head_info || []).map((row, i) => (
                        <tr key={i}>
                            {["manufacturer", "type", "year", "temp", "glass_bulb"].map(f => (
                                <td key={f} style={{ border: "1px solid black", padding: "2px", minHeight: "16px" }}>{row[f] || ""}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Quarterly Tests */}
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>Quarterly Test Items:</div>
            <div style={{ marginBottom: "2px" }}>Sprinkler system main drain test.</div>
            {[
                ["1. Record no flow static pressure.", null, false, report.quarterly_tests?.no_flow_static_pressure],
                ["2. Record full flow residual pressure.", null, false, report.quarterly_tests?.full_flow_residual_pressure],
                ["3. Was full flow observed?", report.quarterly_tests?.q3_full_flow_observed, true, null],
                ["4. Results comparable to last test?", report.quarterly_tests?.q4_results_comparable, true, null],
                ["5. Water flow alarm device passed test?", report.quarterly_tests?.q5_water_flow_alarm_passed, true, null],
                ["6. Inspectors test connection open?", report.quarterly_tests?.q6_inspectors_test_open, true, null],
                ["7. Inspectors Test Location?", null, false, report.quarterly_tests?.q7_inspectors_test_location],
                ["8. Bypass connection open?", report.quarterly_tests?.q8_bypass_connection_open, true, null],
                ["9. Valve supervisory switch operational?", report.quarterly_tests?.q9_valve_supervisory_switch, true, null],
            ].map(([q, v, yn, text], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ddd", padding: "1px 0" }}>
                    <span>{q}</span>
                    <span>{yn ? <>☐Yes ☐No ☐N/A &nbsp;<b>{v || ""}</b></> : <b>{text || ""}</b>}</span>
                </div>
            ))}

            {/* Annual Tests */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginTop: "4px" }}>Annual Test Items:</div>
            {[
                ["1. Standard heads less than 50 years old?", report.annual_tests?.q1_standard_heads_under_50],
                ["2. Standard heads over 50 years old tested within last 10 years?", report.annual_tests?.q2_standard_heads_over_50_tested],
                ["3. Fast response heads less than 20 years old?", report.annual_tests?.q3_fast_response_under_20],
                ["4. Fast response heads over 20 years old tested within the last 10 years?", report.annual_tests?.q4_fast_response_over_20_tested],
                ["5. All control valves operate properly?", report.annual_tests?.q5_control_valves_operate],
                ["6. Anti-freeze specific gravity correct?", report.annual_tests?.q6_antifreeze_gravity_correct],
            ].map(([q, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ddd", padding: "1px 0" }}>
                    <span>{q}</span>
                    <span>☐Yes ☐No ☐N/A &nbsp;<b>{v || ""}</b></span>
                </div>
            ))}
            <div style={{ padding: "1px 0", borderBottom: "0.5px solid #ddd" }}>7. Anti-freeze specific gravity reading? <b>{report.annual_tests?.q7_antifreeze_gravity_reading}</b></div>

            {/* Five Year Tests */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginTop: "4px" }}>Five Year Test Items:</div>
            {[
                ["1. Gauges over 5 years old replaced or calibrated?", report.five_year_tests?.q1_gauges_replaced_calibrated],
                ["2. Heads rated for high temperature tested?", report.five_year_tests?.q2_high_temp_heads_tested],
            ].map(([q, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ddd", padding: "1px 0" }}>
                    <span>{q}</span>
                    <span>☐Yes ☐No ☐N/A &nbsp;<b>{v || ""}</b></span>
                </div>
            ))}

            {/* Maintenance */}
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginTop: "4px" }}>Maintenance Items:</div>
            {[
                ["1. Riser maintains 3 foot of clearance?", report.maintenance_items?.q1_riser_clearance],
                ["2. System left in service?", report.maintenance_items?.q2_system_left_in_service],
                ["3. Was system tagged?", report.maintenance_items?.q3_system_tagged],
            ].map(([q, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #ddd", padding: "1px 0" }}>
                    <span>{q}</span>
                    <span>☐Yes ☐No ☐N/A &nbsp;<b>{v || ""}</b></span>
                </div>
            ))}
            <div style={{ padding: "1px 0", borderBottom: "0.5px solid #ddd", display: "flex", justifyContent: "space-between" }}>
                <span>4. Type of tag?</span>
                <span style={{ border: "1px solid black", padding: "0 8px", minWidth: "60px", fontWeight: "bold" }}>{report.maintenance_items?.type_of_tag || ""}</span>
            </div>

            {/* Comments */}
            <div style={{ fontWeight: "bold", marginTop: "6px" }}>Comments:</div>
            <div style={{ border: "1px solid black", minHeight: "40px", padding: "4px", marginBottom: "6px" }}>{report.comments}</div>

            {/* Signatures */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
                <tbody>
                    <tr>
                        <td style={{ border: "1px solid black", padding: "4px", width: "50%" }}>
                            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>Inspector</div>
                            <div style={{ minHeight: "30px" }}>{report.technician_name}</div>
                        </td>
                        <td style={{ border: "1px solid black", padding: "4px" }}>
                            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>Assisting Technician/Trainee</div>
                            <div style={{ minHeight: "30px" }}>{report.assisting_technician_name}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ border: "1px solid black", padding: "4px" }}>
                            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>License/Certification</div>
                            <div style={{ minHeight: "20px" }}>{report.technician_license}</div>
                        </td>
                        <td style={{ border: "1px solid black", padding: "4px" }}>
                            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>License/Certification</div>
                            <div style={{ minHeight: "20px" }}>{report.assisting_technician_license}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className="text-center mt-2 text-xs">Inspection Services Performed By:</div>
            <div className="text-center text-xs">OK #441117</div>
        </div>
    );

    return (
        <div className="min-h-screen p-3 sm:p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 print:hidden space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Wet Sprinkler Inspection Report</h1>
                        <AutoSaveIndicator isSaving={isAutoSaving} lastSaved={lastSaved} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2 flex-1"><Eye className="h-4 w-4" />Preview</Button>
                        <Button variant="outline" onClick={() => setTimeout(() => window.print(), 100)} className="gap-2 flex-1"><Printer className="h-4 w-4" />Print</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 flex-1 bg-orange-500 hover:bg-orange-600"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save"}</Button>
                    </div>
                </div>

                <div className="space-y-4 print:hidden">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader><CardTitle>Report Info</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Client</Label>
                                    <div className="font-medium text-sm mt-1">{clientData?.company_name}</div>
                                </div>
                                <div>
                                    <Label>Property</Label>
                                    <div className="font-medium text-sm mt-1">{propertyData?.name}</div>
                                </div>
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
                            </div>
                            <div>
                                <Label>Location in Building</Label>
                                <Input value={report.location_in_building} onChange={e => set("location_in_building", e.target.value)} placeholder="e.g. Main Riser Room" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Service Date</Label>
                                    <Input type="date" value={report.service_date} onChange={e => set("service_date", e.target.value)} />
                                </div>
                                <div>
                                    <Label>Type of Inspection</Label>
                                    <Select value={report.inspection_type} onValueChange={v => set("inspection_type", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Weekly", "Monthly", "Quarterly", "Annual", "Five Year"].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Tag Status</Label>
                                <Select value={report.maintenance_items?.type_of_tag} onValueChange={v => set("maintenance_items.type_of_tag", v)}>
                                    <SelectTrigger className={`mt-1 font-semibold ${report.maintenance_items?.type_of_tag === "Green Tag" ? "bg-green-100 text-green-800 border-green-400" : report.maintenance_items?.type_of_tag === "Red Tag" ? "bg-red-100 text-red-800 border-red-400" : report.maintenance_items?.type_of_tag === "Yellow Tag" ? "bg-yellow-100 text-yellow-800 border-yellow-400" : ""}`}>
                                        <SelectValue placeholder="Select tag color..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Green Tag">🟢 Green Tag (Pass)</SelectItem>
                                        <SelectItem value="Yellow Tag">🟡 Yellow Tag (Deficiency)</SelectItem>
                                        <SelectItem value="Red Tag">🔴 Red Tag (Out of Service)</SelectItem>
                                        <SelectItem value="No Tag">⬜ No Tag</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Owner Section */}
                    <Card>
                        <CardHeader><CardTitle>Owner's Section</CardTitle></CardHeader>
                        <CardContent>
                            <YN label="1. Is the building occupied?" value={report.owner_section?.q1_building_occupied} onChange={v => set("owner_section.q1_building_occupied", v)} />
                            <YN label="2. Have the occupancy and hazard of contents remained the same?" value={report.owner_section?.q2_occupancy_hazard_same} onChange={v => set("owner_section.q2_occupancy_hazard_same", v)} />
                            <YN label="3. Are all fire protection systems in service?" value={report.owner_section?.q3_fire_protection_in_service} onChange={v => set("owner_section.q3_fire_protection_in_service", v)} />
                            <YN label="4. Has the system remained in service without modification?" value={report.owner_section?.q4_no_modification} onChange={v => set("owner_section.q4_no_modification", v)} />
                            <YN label="5. Was the system free of actuation of devices or alarms?" value={report.owner_section?.q5_no_actuation} onChange={v => set("owner_section.q5_no_actuation", v)} />
                            <YN label="6. Have any building modifications or remodels taken place?" value={report.owner_section?.q6_building_modifications} onChange={v => set("owner_section.q6_building_modifications", v)} />
                            <div className="mt-3">
                                <Label>Explain any "NO" answers</Label>
                                <Textarea value={report.owner_section?.explanation} onChange={e => set("owner_section.explanation", e.target.value)} className="h-16 mt-1" />
                            </div>
                            <div className="mt-3">
                                <Label>Owner or Representative Name</Label>
                                <Input value={report.owner_name} onChange={e => set("owner_name", e.target.value)} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Checklist */}
                    <Card>
                        <CardHeader><CardTitle className="text-blue-700">Weekly Inspection Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Valves in correct (open/closed) position?" value={report.weekly_checklist?.q1_valves_correct_position} onChange={v => set("weekly_checklist.q1_valves_correct_position", v)} />
                            <YNA label="2. Locked, supervised and accessible?" value={report.weekly_checklist?.q2_locked_supervised_accessible} onChange={v => set("weekly_checklist.q2_locked_supervised_accessible", v)} />
                        </CardContent>
                    </Card>

                    {/* Monthly Checklist */}
                    <Card>
                        <CardHeader><CardTitle className="text-blue-700">Monthly Inspection Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Sprinkler head wrench present?" value={report.monthly_checklist?.q1_head_wrench_present} onChange={v => set("monthly_checklist.q1_head_wrench_present", v)} />
                            <YNA label="2. Gauges showing normal pressure?" value={report.monthly_checklist?.q2_gauges_normal_pressure} onChange={v => set("monthly_checklist.q2_gauges_normal_pressure", v)} />
                            <YNA label="3. Alarm valve free of physical damage?" value={report.monthly_checklist?.q3_alarm_valve_no_damage} onChange={v => set("monthly_checklist.q3_alarm_valve_no_damage", v)} />
                            <YNA label="4. Alarm valve trim in proper position?" value={report.monthly_checklist?.q4_alarm_valve_trim_position} onChange={v => set("monthly_checklist.q4_alarm_valve_trim_position", v)} />
                            <YNA label="5. No leaks from valve retard or drain?" value={report.monthly_checklist?.q5_no_leaks_retard_drain} onChange={v => set("monthly_checklist.q5_no_leaks_retard_drain", v)} />
                        </CardContent>
                    </Card>

                    {/* Quarterly Checklist */}
                    <Card>
                        <CardHeader><CardTitle className="text-blue-700">Quarterly Inspection Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Fire department connection not damaged?" value={report.quarterly_checklist?.q1_fdc_not_damaged} onChange={v => set("quarterly_checklist.q1_fdc_not_damaged", v)} />
                            <YNA label="2. Alarm devices free of damage?" value={report.quarterly_checklist?.q2_alarm_devices_no_damage} onChange={v => set("quarterly_checklist.q2_alarm_devices_no_damage", v)} />
                            <YNA label="3. Hydraulic name plate present and legible?" value={report.quarterly_checklist?.q3_hydraulic_nameplate_legible} onChange={v => set("quarterly_checklist.q3_hydraulic_nameplate_legible", v)} />
                        </CardContent>
                    </Card>

                    {/* Annual Checklist */}
                    <Card>
                        <CardHeader><CardTitle className="text-blue-700">Annual Inspection Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Proper number and types of spare heads?" value={report.annual_checklist?.q1_proper_spare_heads} onChange={v => set("annual_checklist.q1_proper_spare_heads", v)} />
                            <YNA label="2. Sprinklers free of corrosion or paint?" value={report.annual_checklist?.q2_no_corrosion_paint} onChange={v => set("annual_checklist.q2_no_corrosion_paint", v)} />
                            <YNA label="3. Sprinkler free of obstruction or damage?" value={report.annual_checklist?.q3_no_obstruction_damage} onChange={v => set("annual_checklist.q3_no_obstruction_damage", v)} />
                            <YNA label="4. Liquid present in glass bulb sprinklers?" value={report.annual_checklist?.q4_liquid_glass_bulb} onChange={v => set("annual_checklist.q4_liquid_glass_bulb", v)} />
                            <YNA label="5. Visible pipe free of corrosion or loads?" value={report.annual_checklist?.q5_pipe_no_corrosion} onChange={v => set("annual_checklist.q5_pipe_no_corrosion", v)} />
                            <YNA label="6. Visible pipe free of damage and alignment?" value={report.annual_checklist?.q6_pipe_no_damage_alignment} onChange={v => set("annual_checklist.q6_pipe_no_damage_alignment", v)} />
                            <YNA label="7. Visible pipe hangers free of damage?" value={report.annual_checklist?.q7_hangers_no_damage} onChange={v => set("annual_checklist.q7_hangers_no_damage", v)} />
                            <YNA label="8. Adequate heat in areas with wet piping?" value={report.annual_checklist?.q8_adequate_heat} onChange={v => set("annual_checklist.q8_adequate_heat", v)} />
                            <YNA label="9. All escutcheon/cover plates are present?" value={report.annual_checklist?.q9_escutcheon_plates_present} onChange={v => set("annual_checklist.q9_escutcheon_plates_present", v)} />
                            <YNA label="10. Is the sprinkler system monitored?" value={report.annual_checklist?.q10_system_monitored} onChange={v => set("annual_checklist.q10_system_monitored", v)} />
                        </CardContent>
                    </Card>

                    {/* Five Year Checklist */}
                    <Card>
                        <CardHeader><CardTitle className="text-blue-700">Five Year Inspection Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Alarm valves and associated strainers, filters and restricted orifices pass internal inspection?" value={report.five_year_checklist?.q1_alarm_valves_pass_internal} onChange={v => set("five_year_checklist.q1_alarm_valves_pass_internal", v)} />
                            <YNA label="2. Check valves internally inspected, all parts operate, and move freely and in good condition?" value={report.five_year_checklist?.q2_check_valves_inspected} onChange={v => set("five_year_checklist.q2_check_valves_inspected", v)} />
                        </CardContent>
                    </Card>

                    {/* Alarm Valve Info */}
                    <Card>
                        <CardHeader><CardTitle>Alarm Valve Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            <div><Label>Manufacturer</Label><Input value={report.alarm_valve_info?.manufacturer} onChange={e => set("alarm_valve_info.manufacturer", e.target.value)} className="mt-1" /></div>
                            <div><Label>Alarm Devices</Label><Input value={report.alarm_valve_info?.alarm_devices} onChange={e => set("alarm_valve_info.alarm_devices", e.target.value)} className="mt-1" /></div>
                            <div><Label>Valve Size</Label><Input value={report.alarm_valve_info?.valve_size} onChange={e => set("alarm_valve_info.valve_size", e.target.value)} className="mt-1" /></div>
                            <div><Label>Year</Label><Input value={report.alarm_valve_info?.year} onChange={e => set("alarm_valve_info.year", e.target.value)} className="mt-1" /></div>
                        </CardContent>
                    </Card>

                    {/* Sprinkler Head Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Sprinkler Head Information</CardTitle>
                            <Button size="sm" onClick={addHeadRow} className="bg-orange-500 hover:bg-orange-600 gap-1"><Plus className="h-3 w-3" />Add Row</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            {["Manufacturer", "Type", "Year", "Temp", "Glass Bulb?", ""].map(h => (
                                                <th key={h} className="px-2 py-1 text-left text-xs font-medium text-slate-600">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(report.sprinkler_head_info || []).map((row, i) => (
                                            <tr key={i} className="border-t">
                                                {["manufacturer", "type", "year", "temp", "glass_bulb"].map(f => (
                                                    <td key={f} className="px-1 py-1">
                                                        <Input value={row[f] || ""} onChange={e => updateHead(i, f, e.target.value)} className="h-8 text-xs" />
                                                    </td>
                                                ))}
                                                <td className="px-1 py-1">
                                                    <Button size="sm" variant="ghost" onClick={() => removeHead(i)} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quarterly Tests */}
                    <Card>
                        <CardHeader><CardTitle className="text-purple-700">Quarterly Test Items</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-3 font-medium">Sprinkler system main drain test.</p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <Label>1. No flow static pressure</Label>
                                    <Input value={report.quarterly_tests?.no_flow_static_pressure} onChange={e => set("quarterly_tests.no_flow_static_pressure", e.target.value)} placeholder="PSI" className="mt-1" />
                                </div>
                                <div>
                                    <Label>2. Full flow residual pressure</Label>
                                    <Input value={report.quarterly_tests?.full_flow_residual_pressure} onChange={e => set("quarterly_tests.full_flow_residual_pressure", e.target.value)} placeholder="PSI" className="mt-1" />
                                </div>
                            </div>
                            <YNA label="3. Was full flow observed?" value={report.quarterly_tests?.q3_full_flow_observed} onChange={v => set("quarterly_tests.q3_full_flow_observed", v)} />
                            <YNA label="4. Results comparable to last test?" value={report.quarterly_tests?.q4_results_comparable} onChange={v => set("quarterly_tests.q4_results_comparable", v)} />
                            <YNA label="5. Water flow alarm device passed test?" value={report.quarterly_tests?.q5_water_flow_alarm_passed} onChange={v => set("quarterly_tests.q5_water_flow_alarm_passed", v)} />
                            <YNA label="6. Inspectors test connection open?" value={report.quarterly_tests?.q6_inspectors_test_open} onChange={v => set("quarterly_tests.q6_inspectors_test_open", v)} />
                            <div className="py-2 border-b border-slate-100">
                                <Label>7. Inspectors Test Location</Label>
                                <Input value={report.quarterly_tests?.q7_inspectors_test_location} onChange={e => set("quarterly_tests.q7_inspectors_test_location", e.target.value)} className="mt-1" />
                            </div>
                            <YNA label="8. Bypass connection open?" value={report.quarterly_tests?.q8_bypass_connection_open} onChange={v => set("quarterly_tests.q8_bypass_connection_open", v)} />
                            <YNA label="9. Valve supervisory switch operational?" value={report.quarterly_tests?.q9_valve_supervisory_switch} onChange={v => set("quarterly_tests.q9_valve_supervisory_switch", v)} />
                        </CardContent>
                    </Card>

                    {/* Annual Tests */}
                    <Card>
                        <CardHeader><CardTitle className="text-purple-700">Annual Test Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Standard heads less than 50 years old?" value={report.annual_tests?.q1_standard_heads_under_50} onChange={v => set("annual_tests.q1_standard_heads_under_50", v)} />
                            <YNA label="2. Standard heads over 50 years old tested within last 10 years?" value={report.annual_tests?.q2_standard_heads_over_50_tested} onChange={v => set("annual_tests.q2_standard_heads_over_50_tested", v)} />
                            <YNA label="3. Fast response heads less than 20 years old?" value={report.annual_tests?.q3_fast_response_under_20} onChange={v => set("annual_tests.q3_fast_response_under_20", v)} />
                            <YNA label="4. Fast response heads over 20 years old tested within the last 10 years?" value={report.annual_tests?.q4_fast_response_over_20_tested} onChange={v => set("annual_tests.q4_fast_response_over_20_tested", v)} />
                            <YNA label="5. All control valves operate properly?" value={report.annual_tests?.q5_control_valves_operate} onChange={v => set("annual_tests.q5_control_valves_operate", v)} />
                            <YNA label="6. Anti-freeze specific gravity correct?" value={report.annual_tests?.q6_antifreeze_gravity_correct} onChange={v => set("annual_tests.q6_antifreeze_gravity_correct", v)} />
                            <div className="py-2">
                                <Label>7. Anti-freeze specific gravity reading</Label>
                                <Input value={report.annual_tests?.q7_antifreeze_gravity_reading} onChange={e => set("annual_tests.q7_antifreeze_gravity_reading", e.target.value)} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Five Year Tests */}
                    <Card>
                        <CardHeader><CardTitle className="text-purple-700">Five Year Test Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Gauges over 5 years old replaced or calibrated?" value={report.five_year_tests?.q1_gauges_replaced_calibrated} onChange={v => set("five_year_tests.q1_gauges_replaced_calibrated", v)} />
                            <YNA label="2. Heads rated for high temperature tested?" value={report.five_year_tests?.q2_high_temp_heads_tested} onChange={v => set("five_year_tests.q2_high_temp_heads_tested", v)} />
                        </CardContent>
                    </Card>

                    {/* Maintenance */}
                    <Card>
                        <CardHeader><CardTitle>Maintenance Items</CardTitle></CardHeader>
                        <CardContent>
                            <YNA label="1. Riser maintains 3 foot of clearance?" value={report.maintenance_items?.q1_riser_clearance} onChange={v => set("maintenance_items.q1_riser_clearance", v)} />
                            <YNA label="2. System left in service?" value={report.maintenance_items?.q2_system_left_in_service} onChange={v => set("maintenance_items.q2_system_left_in_service", v)} />
                            <YNA label="3. Was system tagged?" value={report.maintenance_items?.q3_system_tagged} onChange={v => set("maintenance_items.q3_system_tagged", v)} />
                            <div className="py-2 mt-2">
                                <Label>4. Type of tag</Label>
                                <Select value={report.maintenance_items?.type_of_tag} onValueChange={v => set("maintenance_items.type_of_tag", v)}>
                                    <SelectTrigger className={`mt-1 font-semibold ${report.maintenance_items?.type_of_tag === "Green Tag" ? "bg-green-100 text-green-800 border-green-400" : report.maintenance_items?.type_of_tag === "Red Tag" ? "bg-red-100 text-red-800 border-red-400" : report.maintenance_items?.type_of_tag === "Yellow Tag" ? "bg-yellow-100 text-yellow-800 border-yellow-400" : ""}`}>
                                        <SelectValue placeholder="Select tag color..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Green Tag">🟢 Green Tag (Pass)</SelectItem>
                                        <SelectItem value="Yellow Tag">🟡 Yellow Tag (Deficiency)</SelectItem>
                                        <SelectItem value="Red Tag">🔴 Red Tag (Out of Service)</SelectItem>
                                        <SelectItem value="No Tag">⬜ No Tag</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments */}
                    <Card>
                        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea value={report.comments} onChange={e => set("comments", e.target.value)} className="h-24" placeholder="Additional comments..." />
                        </CardContent>
                    </Card>

                    {/* Inspector Info */}
                    <Card>
                        <CardHeader><CardTitle>Inspector Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Inspector Name</Label>
                                    <Input value={report.technician_name} onChange={e => set("technician_name", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>License/Certification</Label>
                                    <Input value={report.technician_license} onChange={e => set("technician_license", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Assisting Technician/Trainee</Label>
                                    <Input value={report.assisting_technician_name} onChange={e => set("assisting_technician_name", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Asst. License/Certification</Label>
                                    <Input value={report.assisting_technician_license} onChange={e => set("assisting_technician_license", e.target.value)} className="mt-1" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signatures */}
                    <Card>
                        <CardHeader><CardTitle>Signatures</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="mb-2 block font-semibold">Technician Signature</Label>
                                <SignaturePad
                                    label="Technician Signature"
                                    value={report.technician_signature_url}
                                    onChange={(dataUrl) => set("technician_signature_url", dataUrl)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="customer_name" className="mb-1 block font-semibold">Customer / Owner Name</Label>
                                <Input
                                    id="customer_name"
                                    value={report.customer_name}
                                    onChange={e => set("customer_name", e.target.value)}
                                    placeholder="Customer name"
                                    className="mb-3"
                                />
                                <Label className="mb-2 block font-semibold">Customer Signature</Label>
                                <SignaturePad
                                    label="Customer Signature"
                                    value={report.customer_signature_url}
                                    onChange={(dataUrl) => set("customer_signature_url", dataUrl)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2 bg-orange-500 hover:bg-orange-600">
                        <Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Report"}
                    </Button>
                </div>

                {/* Print View */}
                <div className="hidden print:block">
                    <PrintView />
                </div>

                {/* Preview Dialog */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
                        <DialogHeader><DialogTitle>Report Preview</DialogTitle></DialogHeader>
                        <div className="p-4"><PrintView /></div>
                    </DialogContent>
                </Dialog>

                {/* Save Alert */}
                <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
                    <AlertDialogContent>
                        <AlertDialogTitle>Report Saved</AlertDialogTitle>
                        <AlertDialogDescription>The wet sprinkler report has been saved successfully.</AlertDialogDescription>
                        <AlertDialogAction onClick={() => setShowSaveAlert(false)}>OK</AlertDialogAction>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.25in; size: letter; }
                    body { font-size: 7.5pt !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                }
            `}</style>
        </div>
    );
}