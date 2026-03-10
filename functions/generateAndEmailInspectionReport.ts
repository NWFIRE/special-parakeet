import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        // Support entity automation payload (event.entity_id or data.id) and direct calls
        const inspection_id = body.inspection_id || body.event?.entity_id || body.data?.id;

        if (!inspection_id) {
            return Response.json({ error: 'inspection_id is required' }, { status: 400 });
        }

        // Use data from automation payload if available, otherwise fetch directly
        let inspectionData = (body.data?.id === inspection_id) ? body.data : null;
        if (!inspectionData) {
            const results = await base44.asServiceRole.entities.Inspection.filter({ id: inspection_id });
            inspectionData = results?.[0];
        }

        if (!inspectionData) {
            return Response.json({ error: 'Inspection not found' }, { status: 404 });
        }

        // Only process completed inspections
        if (inspectionData.status !== 'completed') {
            return Response.json({ success: false, message: 'Inspection not completed, skipping' });
        }

        // Fetch client and property in parallel
        const [clientResults, propertyResults] = await Promise.all([
            base44.asServiceRole.entities.Client.filter({ id: inspectionData.client_id }),
            inspectionData.property_id
                ? base44.asServiceRole.entities.Property.filter({ id: inspectionData.property_id })
                : Promise.resolve([])
        ]);

        const client = clientResults?.[0];
        const property = propertyResults?.[0];

        if (!client) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        if (!client.email) {
            return Response.json({ success: false, message: 'Client has no email address, skipping' });
        }

        const propertyName = inspectionData.property_name || property?.name || 'your property';
        const inspectionDate = inspectionData.completed_date || inspectionData.scheduled_date || 'N/A';
        const reportTypes = (inspectionData.report_types || [])
            .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
            .join(', ');

        const deficiencies = inspectionData.deficiencies || [];
        let deficiencyText = '';
        if (deficiencies.length > 0) {
            deficiencyText = `\nDeficiencies Found (${deficiencies.length}):\n`;
            deficiencies.forEach((def, i) => {
                deficiencyText += `  ${i + 1}. ${def.description || 'No description'} (Severity: ${def.severity || 'unknown'})\n`;
            });
        }

        const notesText = inspectionData.notes
            ? `\nInspector Notes:\n${inspectionData.notes}\n`
            : '';

        const emailSubject = `Fire Safety Inspection Complete - ${propertyName}`;
        const emailBody = `Dear ${client.contact_name || client.company_name},

Your fire safety inspection for ${propertyName} has been completed on ${inspectionDate}.

Inspector: ${inspectionData.inspector_name || 'N/A'}
Inspection Type: ${inspectionData.inspection_type?.replace(/_/g, ' ') || 'N/A'}
Report Types: ${reportTypes || 'N/A'}
Overall Result: ${inspectionData.overall_result || 'Pending'}
${deficiencyText}${notesText}
If you have any questions regarding this inspection, please contact us.

Best regards,
Northwest Fire & Safety, LLC
(580) 540-3119
www.nwfireandsafety.com`;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: client.email,
            subject: emailSubject,
            body: emailBody
        });

        return Response.json({
            success: true,
            message: 'Inspection summary email sent',
            inspection_id,
            client_email: client.email
        });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});