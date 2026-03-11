import { InspectionServiceType, MembershipRole, PrismaClient, ReportStatus, SubscriptionStatus, TaskPriority, TaskStatus, UserType } from "@prisma/client";
import { hashPassword } from "../lib/password";

const db = new PrismaClient();

async function main() {
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.invite.deleteMany();
  await db.subscription.deleteMany();
  await db.membership.deleteMany();
  await db.inspectionReport.deleteMany();
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
              subscription: {
                create: {
                  status: SubscriptionStatus.ACTIVE,
                  stripePriceId: "price_demo"
                }
              }
            }
          }
        }
      }
    },
    include: {
      memberships: true
    }
  });

  const teamId = owner.memberships[0].teamId;

  const admin = await db.user.create({
    data: {
      name: "Jordan Rivera",
      email: "admin@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: {
        create: {
          role: MembershipRole.ADMIN,
          teamId
        }
      }
    }
  });

  const member = await db.user.create({
    data: {
      name: "Casey Moore",
      email: "member@tradeworx.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: {
        create: {
          role: MembershipRole.MEMBER,
          teamId
        }
      }
    }
  });

  const client = await db.client.create({
    data: {
      teamId,
      companyName: "North Ridge Properties",
      contactName: "Avery Collins",
      contactEmail: "client@tradeworx.dev",
      contactPhone: "(312) 555-0144",
      siteCount: 4,
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

  const websiteRedesign = await db.project.create({
    data: {
      teamId,
      name: "Website Refresh",
      description: "Refresh the landing page, billing CTA, and onboarding flow."
    }
  });

  const mobileOps = await db.project.create({
    data: {
      teamId,
      name: "Mobile Experience",
      description: "Reduce friction on task updates for field teams."
    }
  });

  await db.task.createMany({
    data: [
      {
        teamId,
        projectId: websiteRedesign.id,
        assigneeId: owner.id,
        title: "Finalize pricing comparison",
        description: "Ship the three-plan comparison table for the launch page.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
      },
      {
        teamId,
        projectId: websiteRedesign.id,
        assigneeId: admin.id,
        title: "QA signup funnel",
        description: "Verify invite acceptance, workspace creation, and first project flow.",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1)
      },
      {
        teamId,
        projectId: mobileOps.id,
        assigneeId: member.id,
        title: "Polish drag-and-drop on mobile",
        description: "Improve task card interactions on small screens.",
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
      },
      {
        teamId,
        projectId: mobileOps.id,
        title: "Add overdue analytics widget",
        description: "Track overdue tasks for owners and admins.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      }
    ]
  });

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

  await db.inspectionReport.createMany({
    data: [
      {
        teamId,
        clientId: client.id,
        title: "Quarterly Fire Alarm Inspection",
        reportNumber: "FA-2401",
        serviceType: InspectionServiceType.FIRE_ALARM,
        status: ReportStatus.INVOICED,
        propertyName: "North Ridge Tower",
        propertyAddress: "2140 Lakeview Ave, Chicago, IL",
        pointOfContact: "Avery Collins",
        inspectorName: "Jordan Rivera",
        frequencyLabel: "Quarterly",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
        nextInspectionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 72),
        notes: "System passed. One pull station cover was replaced during service.",
        checklistItems: [
          { item: "Control panel normal", status: "PASS", notes: "No faults detected." },
          { item: "Notification devices tested", status: "PASS", notes: "All horns and strobes operational." },
          { item: "Initiating devices sampled", status: "PASS", notes: "Smoke and pull stations verified." }
        ],
        deficiencies: [],
        equipmentSummary: [
          { category: "Panels", quantity: "1", notes: "Main FACP online" },
          { category: "Devices tested", quantity: "18", notes: "Sample set completed" }
        ]
      },
      {
        teamId,
        clientId: client.id,
        title: "Wet Sprinkler Annual Inspection",
        reportNumber: "SP-2407",
        serviceType: InspectionServiceType.FIRE_SPRINKLER,
        status: ReportStatus.INVOICED,
        propertyName: "North Ridge Annex",
        propertyAddress: "2190 Lakeview Ave, Chicago, IL",
        pointOfContact: "Facilities Desk",
        inspectorName: "Casey Moore",
        frequencyLabel: "Annual",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 43),
        nextInspectionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 320),
        notes: "System operational with one corrective action recommended.",
        checklistItems: [
          { item: "Main drain test", status: "PASS", notes: "Residual pressure within range." },
          { item: "Valve tamper switches", status: "PASS", notes: "All signals received." },
          { item: "Riser room condition", status: "REPAIR_REQUIRED", notes: "Corrosion on riser clamp." }
        ],
        deficiencies: [
          { description: "Corrosion visible on riser clamp", severity: "MEDIUM", location: "Mechanical room", corrective_action: "Replace clamp within 30 days", due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() }
        ],
        equipmentSummary: [
          { category: "Risers", quantity: "2", notes: "One dry, one wet" },
          { category: "Control valves", quantity: "4", notes: "All sealed" }
        ]
      },
      {
        teamId,
        clientId: client.id,
        title: "Portable Fire Extinguisher Service",
        reportNumber: "FE-2411",
        serviceType: InspectionServiceType.FIRE_EXTINGUISHER,
        status: ReportStatus.ISSUED,
        propertyName: "North Ridge Retail",
        propertyAddress: "2212 Lakeview Ave, Chicago, IL",
        pointOfContact: "Store Manager",
        inspectorName: "Jordan Rivera",
        frequencyLabel: "Annual",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        nextInspectionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 353),
        notes: "Three extinguishers re-tagged. One unit replaced due to low pressure.",
        checklistItems: [
          { item: "Pressure gauge in operable range", status: "PASS", notes: "11 of 12 units in range." },
          { item: "Tamper seals intact", status: "PASS", notes: "All serviced units sealed." },
          { item: "Mounting and signage", status: "PASS", notes: "Accessible and visible." }
        ],
        deficiencies: [
          { description: "Low pressure on 10 lb ABC extinguisher", severity: "HIGH", location: "Rear exit corridor", corrective_action: "Replaced on site", due_date: null }
        ],
        equipmentSummary: [
          { category: "ABC 10 lb", quantity: "9", notes: "One replaced" },
          { category: "CO2 5 lb", quantity: "3", notes: "All in service" }
        ]
      }
    ]
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

