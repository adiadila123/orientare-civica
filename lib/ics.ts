const LEGAL_DEADLINE_DAYS = 15;

function addDaysToDateOnly(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatIcsTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

interface DeadlineIcsParams {
  caseNumber: string;
  pvIssueDate: string;
  now?: Date;
}

export function buildContestationDeadlineIcs({ caseNumber, pvIssueDate, now = new Date() }: DeadlineIcsParams): string {
  const deadline = addDaysToDateOnly(pvIssueDate, LEGAL_DEADLINE_DAYS);
  const dtstamp = formatIcsTimestamp(now);
  const uid = `${caseNumber}-${deadline}@undemerg.ro`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unde Merg//Contestatie PV//RO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${deadline}`,
    `SUMMARY:Termen limită contestație PV ${caseNumber}`,
    'DESCRIPTION:Ultima zi pentru a depune contestația\\, conform art. 31 din O.G. nr. 2/2001 (15 zile calendaristice de la comunicarea procesului-verbal). Confirmă termenul exact direct cu instanța competentă.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
