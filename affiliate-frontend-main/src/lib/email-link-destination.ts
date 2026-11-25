/** Allow only the portal screens supported by email links; never redirect off-site. */
export function emailLinkDestination(search: string): string {
  const next = new URLSearchParams(search).get("next");
  return next && ["/dashboard", "/dashboard/referrals", "/dashboard/wallet", "/dashboard/settings"].includes(next)
    ? next
    : "/dashboard";
}
