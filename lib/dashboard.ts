import { db } from "@/lib/db";

export async function getDashboardData(teamId: string) {
  return db.membership.findFirst({
    where: { teamId },
    include: {
      team: {
        include: {
          projects: {
            include: {
              tasks: true
            },
            orderBy: {
              createdAt: "desc"
            }
          },
          memberships: {
            include: {
              user: true
            }
          },
          invites: {
            where: {
              acceptedAt: null,
              expiresAt: {
                gt: new Date()
              }
            }
          },
          clients: {
            orderBy: {
              companyName: "asc"
            }
          },
          reports: {
            include: {
              client: true
            },
            orderBy: [
              {
                completedAt: "desc"
              },
              {
                createdAt: "desc"
              }
            ],
            take: 5
          },
          subscription: true
        }
      }
    }
  });
}

