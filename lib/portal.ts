export function canViewInspectionReport(userType: "INTERNAL" | "CUSTOMER", userClientId: string | null | undefined, reportClientId: string) {
  if (userType !== "CUSTOMER") {
    return false;
  }

  return Boolean(userClientId && userClientId === reportClientId);
}
