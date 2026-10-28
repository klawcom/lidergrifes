export function isStoreManager(email: string | null | undefined, confirmed: boolean, adminRole: boolean) {
  return confirmed && adminRole && email?.toLowerCase() === 'klaw.com@gmail.com';
}
export function checkoutEmail(guestEmail: string, verifiedOwnerEmail: string | null) {
  return (verifiedOwnerEmail ?? guestEmail).trim().toLowerCase();
}
export function canUpdateCustomer(existingOwner: string | null, authenticatedOwner: string | null) {
  return authenticatedOwner !== null && (existingOwner === null || existingOwner === authenticatedOwner);
}