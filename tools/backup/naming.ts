function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function nextBackupFileName(date: Date, existingNames: readonly string[]): string {
  const day = formatDate(date);
  const pattern = new RegExp(`^bckp-${day}-(\\d+)\\.json$`);

  let highest = 0;
  for (const name of existingNames) {
    const match = pattern.exec(name);
    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  }
  return `bckp-${day}-${highest + 1}.json`;
}
