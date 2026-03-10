import { MembershipRole, PrismaClient, ReportStatus, SubscriptionStatus, TaskPriority, TaskStatus, UserType } from "@prisma/client";
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
      email: "owner@taskflow.dev",
      passwordHash: await hashPassword("Password123!"),
      memberships: {
        create: {
          role: MembershipRole.OWNER,
          team: {
            create: {
              name: "TaskFlow Demo",
              slug: "taskflow-demo",
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
      email: "admin@taskflow.dev",
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
      email: "member@taskflow.dev",
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
      companyName: "North Ridge Properties",
      contactName: "Avery Collins",
      contactEmail: "client@taskflow.dev"
    }
  });

  await db.user.create({
    data: {
      name: "Avery Collins",
      email: "client@taskflow.dev",
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
      email: "newhire@taskflow.dev",
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
        clientId: client.id,
        title: "Quarterly Fire Alarm Inspection",
        inspectionType: "fire_alarm",
        status: ReportStatus.INVOICED,
        propertyName: "North Ridge Tower",
        propertyAddress: "2140 Lakeview Ave, Chicago, IL",
        inspectorName: "Jordan Rivera",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
        notes: "System passed. One pull station cover was replaced during service.",
        checklistItems: [
          { item: "Panel tested", status: "pass", notes: "No faults detected." },
          { item: "Notification devices", status: "pass", notes: "All horns and strobes operational." }
        ],
        deficiencies: []
      },
      {
        clientId: client.id,
        title: "Wet Sprinkler Annual Inspection",
        inspectionType: "wet_sprinkler",
        status: ReportStatus.INVOICED,
        propertyName: "North Ridge Annex",
        propertyAddress: "2190 Lakeview Ave, Chicago, IL",
        inspectorName: "Casey Moore",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 43),
        notes: "System operational with one corrective action recommended.",
        checklistItems: [
          { item: "Main drain test", status: "pass", notes: "Residual pressure within range." },
          { item: "Valve tamper switches", status: "pass", notes: "All signals received." }
        ],
        deficiencies: [
          { description: "Corrosion visible on riser clamp", severity: "medium", location: "Mechanical room", corrective_action: "Replace clamp within 30 days" }
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
