export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export function selectedMonth(value?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const current = `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
  return (
    (/^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "") ? value : current) + "-01"
  );
}
