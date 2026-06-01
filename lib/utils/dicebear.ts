/** DiceBear initials avatar for admin display (profile, welcome strip). */
export function dicebearInitialsUrl(seed: string): string {
  const params = new URLSearchParams({
    seed: seed.trim() || "Administrator",
    backgroundColor: "1a2e5e",
    textColor: "f5a623",
    fontSize: "38",
    bold: "true",
  });
  return `https://api.dicebear.com/7.x/initials/svg?${params.toString()}`;
}
