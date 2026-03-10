import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const frequencyMonths = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
};

function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function toDateStr(date) {
    return date.toISOString().substring(0, 7); // YYYY-MM
}

function toFullDateStr(date) {
    return date.toISOString().substring(0, 10); // YYYY-MM-DD
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const today = new Date();
        // Look ahead 2 months to schedule upcoming inspections
        const lookAheadDate = addMonths(today, 2);

        // Fetch all active service plans
        const plans = await base44.asServiceRole.entities.PropertyServicePlan.filter({ is_active: true });

        const results = { created: 0, skipped: 0, errors: [] };

        for (const plan of plans) {
            try {
                const dueReportTypes = [];
                let earliestDueDate = null;

                for (const item of plan.service_items) {
                    const frequencyMo = frequencyMonths[item.recurrence_frequency];
                    if (!frequencyMo) continue;

                    // Calculate when this service is next due
                    let nextDueDate;
                    if (item.last_inspected_date) {
                        const lastDate = new Date(item.last_inspected_date);
                        nextDueDate = addMonths(lastDate, frequencyMo);
                    } else if (item.start_month) {
                        // Use the configured start month as the baseline
                        const startDate = new Date(item.start_month + '-01');
                        nextDueDate = startDate;
                    } else if (plan.recurrence_start_months?.[item.report_type]) {
                        // Use per-report start month set on the inspection itself
                        nextDueDate = new Date(plan.recurrence_start_months[item.report_type] + '-01');
                    } else {
                        // Never inspected and no start month — due now
                        nextDueDate = today;
                    }

                    // Check if this service is due within the look-ahead window
                    if (nextDueDate <= lookAheadDate) {
                        dueReportTypes.push(item.report_type);
                        if (!earliestDueDate || nextDueDate < earliestDueDate) {
                            earliestDueDate = nextDueDate;
                        }
                    }
                }

                if (dueReportTypes.length === 0) {
                    results.skipped++;
                    continue;
                }

                // Check if an inspection already exists for this property in the due month
                const dueMonthStr = toDateStr(earliestDueDate);
                const existingInspections = await base44.asServiceRole.entities.Inspection.filter({
                    property_id: plan.property_id,
                    status: 'scheduled'
                });

                const alreadyScheduled = existingInspections.some(insp =>
                    insp.scheduled_date && insp.scheduled_date.startsWith(dueMonthStr.substring(0, 7))
                );

                if (alreadyScheduled) {
                    results.skipped++;
                    continue;
                }

                // Determine overall inspection_type based on the shortest frequency in the due list
                const dueItems = plan.service_items.filter(i => dueReportTypes.includes(i.report_type));
                const shortestFrequency = dueItems.reduce((shortest, item) => {
                    return frequencyMonths[item.recurrence_frequency] < frequencyMonths[shortest]
                        ? item.recurrence_frequency
                        : shortest;
                }, dueItems[0].recurrence_frequency);

                // Create the new inspection
                await base44.asServiceRole.entities.Inspection.create({
                    property_id: plan.property_id,
                    client_id: plan.client_id,
                    property_name: plan.property_name || '',
                    inspector_id: plan.inspector_id || '',
                    inspector_name: plan.inspector_name || '',
                    inspector_license: plan.inspector_license || '',
                    scheduled_date: dueMonthStr,
                    inspection_type: shortestFrequency,
                    report_types: dueReportTypes,
                    status: 'scheduled',
                    is_recurring: true,
                    overall_result: 'pending'
                });

                results.created++;
            } catch (err) {
                results.errors.push({ plan_id: plan.id, error: err.message });
            }
        }

        return Response.json({
            success: true,
            message: `Generated ${results.created} inspections, skipped ${results.skipped}`,
            ...results
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});