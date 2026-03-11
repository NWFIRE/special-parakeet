import { InspectionOutcome, InspectionServiceType, MembershipRole, PrismaClient, ReportStatus, SubscriptionStatus, TaskPriority, TaskStatus, UserType } from "@prisma/client";
import { hashPassword } from "../lib/password";

const db = new PrismaClient();

async function main() {
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.invite.deleteMany();
  await db.subscription.deleteMany();
  await db.inspectionFieldAudit.deleteMany();
  await db.inspectionReportAsset.deleteMany();
  await db.inspectionAsset.deleteMany();
  await db.inspectionReport.deleteMany();
  await db.clientSite.deleteMany();
  await db.teamProfile.deleteMany();
  await db.membership.deleteMany();
  await db.user.deleteMany();
  await db.client.deleteMany();
  await db.account.deleteMany();
  await db.session.deleteMany();
  await db.team.deleteMany();

  const owner = await db.user.create({
    data: {
      name: "Sarah Chen",
      email: "owner@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: {
        create: {
          role: MembershipRole.OWNER,
          team: {
            create: {
              name: "TradeWorx Demo",
              slug: "tradeworx-demo",
              subscription: { create: { status: SubscriptionStatus.ACTIVE, stripePriceId: "price_demo" } },
              profile: {
                create: {
                  companyName: "TradeWorx Fire & Life Safety",
                  phone: "(312) 555-0188",
                  email: "service@tradeworx.dev",
                  website: "https://tradeworx.dev",
                  addressLine1: "214 W Randolph St",
                  city: "Chicago",
                  state: "IL",
                  postalCode: "60606",
                  licenseNumbers: ["IL FAC 09214", "NICET II - FA 33812"],
                  certificationText: "Certified fire protection inspection and reporting services for extinguishers, alarms, sprinklers, suppression systems, and egress lighting.",
                  reportDisclaimer: "This report reflects conditions observed at the time of inspection and should be paired with timely corrective action for any deficiencies noted.",
                  footerText: "TradeWorx Fire & Life Safety | 24-hour documentation delivery | Service records retained digitally.",
                  primaryColor: "#0f766e"
                }
              }
            }
          }
        }
      }
    },
    include: { memberships: true }
  });

  const teamId = owner.memberships[0].teamId;

  const admin = await db.user.create({
    data: {
      name: "Jordan Rivera",
      email: "admin@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: { create: { role: MembershipRole.ADMIN, teamId } }
    }
  });

  const member = await db.user.create({
    data: {
      name: "Casey Moore",
      email: "member@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: { create: { role: MembershipRole.MEMBER, teamId } }
    }
  });

  const client = await db.client.create({
    data: {
      teamId,
      companyName: "North Ridge Properties",
      contactName: "Avery Collins",
      contactEmail: "client@tradeworx.dev",
      contactPhone: "(312) 555-0144",
      siteCount: 3,
      notes: "Prefers digital reports within 24 hours of inspection completion."
    }
  });

  await db.user.create({
    data: {
      name: "Avery Collins",
      email: "client@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      userType: UserType.CUSTOMER,
      clientId: client.id
    }
  });

  const tower = await db.clientSite.create({
    data: {
      teamId,
      clientId: client.id,
      name: "North Ridge Tower",
      siteCode: "NRT-01",
      addressLine1: "2140 Lakeview Ave",
      city: "Chicago",
      state: "IL",
      postalCode: "60614",
      contactName: "Avery Collins",
      contactEmail: "client@tradeworx.dev",
      contactPhone: "(312) 555-0144",
      notes: "Front desk provides roof access keys.",
      reportDefaults: { afterHours: false, customerDelivery: "email" }
    }
  });

  const kitchen = await db.clientSite.create({
    data: {
      teamId,
      clientId: client.id,
      name: "North Ridge Bistro",
      siteCode: "NRB-02",
      addressLine1: "2190 Lakeview Ave",
      city: "Chicago",
      state: "IL",
      postalCode: "60614",
      contactName: "Store Manager",
      contactPhone: "(312) 555-0173",
      notes: "Kitchen inspections scheduled before 10 AM."
    }
  });

  const alarmPanel = await db.inspectionAsset.create({
    data: {
      teamId,
      clientId: client.id,
      siteId: tower.id,
      serviceType: InspectionServiceType.FIRE_ALARM,
      name: "Main Fire Alarm Control Panel",
      location: "Electrical room",
      assetTag: "FA-CTRL-01",
      deviceType: "Addressable control panel",
      manufacturer: "Notifier",
      model: "NFS2-3030",
      serialNumber: "N3030-CHI-4471",
      ulListing: "UL 864",
      complianceFrequency: "Quarterly",
      lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      defaultCodeReferences: ["NFPA 72", "UL 864"],
      profileData: { panelName: "Main FACP", panelLocation: "Electrical room", batteryInfo: "2 x 12V 18Ah", communicationPath: "Cellular + IP", sensitivityResult: "Within listed range" },
      lastInspectionData: { status: "PASS", checks: [{ key: "panelNormal", label: "Panel normal condition", status: "PASS", note: "No trouble conditions." }] }
    }
  });

  const extinguisher = await db.inspectionAsset.create({
    data: {
      teamId,
      clientId: client.id,
      siteId: tower.id,
      serviceType: InspectionServiceType.FIRE_EXTINGUISHER,
      name: "Rear Exit ABC Extinguisher",
      location: "Rear exit corridor",
      assetTag: "FE-REAR-01",
      deviceType: "Portable extinguisher",
      manufacturer: "Amerex",
      model: "B402",
      serialNumber: "AX-991842",
      ulListing: "UL 299 / UL 711 4A:80B:C",
      complianceFrequency: "Annual",
      lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 360),
      nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      defaultCodeReferences: ["NFPA 10"],
      profileData: { extinguisherType: "ABC", size: "10 lb", lastAnnualService: new Date(Date.now() - 1000 * 60 * 60 * 24 * 360).toISOString().slice(0, 10), lastSixYearService: "2022-03-12", lastHydroTest: "2019-03-12", gaugeStatus: "In range" }
    }
  });

  const kitchenSystem = await db.inspectionAsset.create({
    data: {
      teamId,
      clientId: client.id,
      siteId: kitchen.id,
      serviceType: InspectionServiceType.KITCHEN_SUPPRESSION,
      name: "Cook line wet chemical system",
      location: "Main line hood",
      assetTag: "KS-LINE-01",
      deviceType: "Wet chemical suppression system",
      manufacturer: "Ansul",
      model: "R-102",
      serialNumber: "ANS-66312",
      complianceFrequency: "Semi-annual",
      lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 170),
      nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
      defaultCodeReferences: ["NFPA 17A", "NFPA 96"],
      profileData: { systemManufacturer: "Ansul", systemModel: "R-102", applianceCoverage: "Range, charbroiler, fryers", pullStationLocation: "Rear cook line exit", cylinderDetails: "1 x 3-gallon wet chemical" }
    }
  });

  const project = await db.project.create({ data: { teamId, name: "Inspection Launch", description: "Roll out branded reporting and customer delivery." } });
  await db.task.createMany({
    data: [
      { teamId, projectId: project.id, assigneeId: owner.id, title: "Finalize PDF layout QA", description: "Review printable report hierarchy and logo usage.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { teamId, projectId: project.id, assigneeId: admin.id, title: "Verify kitchen suppression templates", description: "Confirm common deficiency boilerplate and appliance coverage details.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4) }
    ]
  });

  const alarmReport = await db.inspectionReport.create({
    data: {
      teamId,
      clientId: client.id,
      siteId: tower.id,
      title: "Quarterly Fire Alarm Inspection - North Ridge Tower",
      reportNumber: "FA-2026-Q1",
      inspectionType: "fire_alarm",
      serviceType: InspectionServiceType.FIRE_ALARM,
      status: ReportStatus.ISSUED,
      overallStatus: InspectionOutcome.PASS,
      propertyName: tower.name,
      propertyAddress: "2140 Lakeview Ave, Chicago, IL 60614",
      pointOfContact: tower.contactName,
      inspectorName: admin.name,
      frequencyLabel: "Quarterly",
      serviceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      nextInspectionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 80),
      summary: "Quarterly fire alarm inspection completed with all sampled initiating and notification devices operating normally.",
      recommendationSummary: "Continue routine quarterly testing and replace standby batteries at next annual interval.",
      notes: "System normal on departure.",
      codeReferences: ["NFPA 72", "UL 864"],
      checklistItems: [],
      deficiencies: [],
      equipmentSummary: [],
      technicianLicense: "NICET II - FA 33812",
      technicianCertification: "State licensed fire alarm inspector",
      customerSignature: { name: "Avery Collins", signedAt: new Date().toISOString() },
      technicianSignature: { name: admin.name, signedAt: new Date().toISOString() },
      photoUrls: [],
      autoFillSummary: [{ assetName: alarmPanel.name, autoFilledFields: ["manufacturer", "model", "serialNumber"] }],
      finalizedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      portalPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      pdfUrl: "http://localhost:3000/inspections/placeholder/print"
    }
  });

  const alarmAssetRow = await db.inspectionReportAsset.create({
    data: {
      reportId: alarmReport.id,
      assetId: alarmPanel.id,
      assetName: alarmPanel.name,
      location: alarmPanel.location,
      assetTag: alarmPanel.assetTag,
      deviceType: alarmPanel.deviceType,
      manufacturer: alarmPanel.manufacturer,
      model: alarmPanel.model,
      serialNumber: alarmPanel.serialNumber,
      ulListing: alarmPanel.ulListing,
      complianceFrequency: alarmPanel.complianceFrequency,
      lastServiceDate: alarmPanel.lastServiceDate,
      nextServiceDate: alarmPanel.nextServiceDate,
      status: InspectionOutcome.PASS,
      attributes: { panelName: "Main FACP", panelLocation: "Electrical room", batteryInfo: "2 x 12V 18Ah", communicationPath: "Cellular + IP", sensitivityResult: "Within listed range" },
      testResults: [
        { key: "panelNormal", label: "Panel normal condition", status: "PASS", note: "No active trouble conditions." },
        { key: "notificationDevices", label: "Notification appliances tested", status: "PASS", note: "Sampled horns and strobes verified." }
      ],
      codeReferences: ["NFPA 72", "UL 864"],
      autofillMeta: { manufacturer: { sourceType: "ASSET_RECORD", sourceLabel: "Asset record", sourceValue: "Notifier" } }
    }
  });

  await db.inspectionFieldAudit.create({
    data: {
      reportId: alarmReport.id,
      reportAssetId: alarmAssetRow.id,
      changedById: admin.id,
      fieldPath: "manufacturer",
      sourceType: "ASSET_RECORD",
      sourceLabel: "Asset record",
      sourceValue: "Notifier",
      finalValue: "Notifier",
      wasOverridden: false
    }
  });

  const extinguisherReport = await db.inspectionReport.create({
    data: {
      teamId,
      clientId: client.id,
      siteId: tower.id,
      title: "Annual Fire Extinguisher Inspection - North Ridge Tower",
      reportNumber: "FE-2026-001",
      inspectionType: "fire_extinguisher",
      serviceType: InspectionServiceType.FIRE_EXTINGUISHER,
      status: ReportStatus.INVOICED,
      overallStatus: InspectionOutcome.ATTENTION,
      propertyName: tower.name,
      propertyAddress: "2140 Lakeview Ave, Chicago, IL 60614",
      pointOfContact: tower.contactName,
      inspectorName: admin.name,
      frequencyLabel: "Annual",
      serviceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      nextInspectionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 362),
      summary: "Annual extinguisher inspection completed. One unit required replacement due to low pressure.",
      recommendationSummary: "Replace low-pressure rear corridor extinguisher and confirm mounting bracket remains compliant.",
      notes: "Replacement was quoted but not completed on visit.",
      codeReferences: ["NFPA 10"],
      checklistItems: [],
      deficiencies: [],
      equipmentSummary: [],
      technicianLicense: "IL FAC 09214",
      technicianCertification: "Portable fire extinguisher service technician",
      customerSignature: { name: "Avery Collins", signedAt: new Date().toISOString() },
      technicianSignature: { name: admin.name, signedAt: new Date().toISOString() },
      photoUrls: [],
      autoFillSummary: [{ assetName: extinguisher.name, autoFilledFields: ["manufacturer", "model", "serialNumber", "attributes.extinguisherType"] }],
      finalizedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      portalPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      pdfUrl: "http://localhost:3000/inspections/placeholder/print"
    }
  });

  await db.inspectionReportAsset.create({
    data: {
      reportId: extinguisherReport.id,
      assetId: extinguisher.id,
      assetName: extinguisher.name,
      location: extinguisher.location,
      assetTag: extinguisher.assetTag,
      deviceType: extinguisher.deviceType,
      manufacturer: extinguisher.manufacturer,
      model: extinguisher.model,
      serialNumber: extinguisher.serialNumber,
      ulListing: extinguisher.ulListing,
      complianceFrequency: extinguisher.complianceFrequency,
      lastServiceDate: extinguisher.lastServiceDate,
      nextServiceDate: extinguisher.nextServiceDate,
      status: InspectionOutcome.ATTENTION,
      deficiencySummary: "Pressure gauge below the operable range.",
      recommendationText: "Replace or recharge the extinguisher and re-tag after service.",
      followUpRequired: true,
      attributes: { extinguisherType: "ABC", size: "10 lb", gaugeStatus: "Low", lastAnnualService: "2025-03-14", lastSixYearService: "2022-03-12", lastHydroTest: "2019-03-12" },
      testResults: [
        { key: "sealPin", label: "Seal and pin intact", status: "PASS", note: "Seal intact at time of inspection." },
        { key: "physicalDamage", label: "No physical damage or corrosion", status: "PASS", note: "Cabinet and shell in good condition." },
        { key: "pressure", label: "Pressure / gauge status", status: "ATTENTION", note: "Gauge reading below operable range." }
      ],
      codeReferences: ["NFPA 10"],
      appliedTemplateKeys: ["low-pressure"],
      autofillMeta: { manufacturer: { sourceType: "ASSET_RECORD", sourceLabel: "Asset record", sourceValue: "Amerex" } }
    }
  });

  await db.inspectionReport.update({ where: { id: alarmReport.id }, data: { pdfUrl: `http://localhost:3000/inspections/${alarmReport.id}/print` } });
  await db.inspectionReport.update({ where: { id: extinguisherReport.id }, data: { pdfUrl: `http://localhost:3000/inspections/${extinguisherReport.id}/print` } });

  await db.invite.create({
    data: {
      email: "newhire@tradeworx.dev",
      role: MembershipRole.MEMBER,
      token: "demo-invite-token",
      teamId,
      invitedById: owner.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });