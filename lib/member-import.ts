import * as XLSX from "xlsx";
import { memberSchema, POLICE_RANKS, type MemberFormData } from "@/lib/validations/member.schema";

/** Member table fields for bulk import (excludes id, photo, createdAt, updatedAt). */
export const MEMBER_IMPORT_FIELDS = [
  "firstName",
  "lastName",
  "otherNames",
  "dob",
  "sex",
  "rank",
  "contact",
  "department",
  "division",
  "district",
  "station",
  "status",
] as const;

export type MemberImportField = (typeof MEMBER_IMPORT_FIELDS)[number];

export const MEMBER_IMPORT_TEMPLATE_FILENAME = "gps-staff-import-template.xlsx";

export const MEMBER_IMPORT_EXAMPLE_ROW: Record<MemberImportField, string> = {
  firstName: "Kwame",
  lastName: "Mensah",
  otherNames: "",
  dob: "1990-05-15",
  sex: "MALE",
  rank: "Constable",
  contact: "+233241234567",
  department: "General Duties",
  division: "Eastern North",
  district: "Bunkpurugu",
  station: "Nakpanduri",
  status: "ACTIVE",
};

export type MemberImportRowError = {
  row: number;
  message: string;
};

export type MemberImportResult = {
  imported: number;
  failed: number;
  errors: MemberImportRowError[];
};

function cellText(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && value > 20000 && value < 100000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${m}-${d}`;
    }
  }
  return String(value).trim();
}

function isEmptyRow(record: Record<string, string>): boolean {
  return Object.values(record).every((value) => value === "");
}

export function parseMemberImportRecord(
  record: Record<string, string>,
  rowNumber: number,
): { ok: true; data: MemberFormData; row: number } | { ok: false; row: number; message: string } {
  const payload = {
    firstName: record.firstName,
    lastName: record.lastName,
    otherNames: record.otherNames || undefined,
    dob: record.dob,
    sex: record.sex,
    rank: record.rank,
    contact: record.contact,
    department: record.department,
    division: record.division,
    district: record.district,
    station: record.station,
    status: record.status || "ACTIVE",
  };

  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return { ok: false, row: rowNumber, message };
  }

  return { ok: true, data: parsed.data, row: rowNumber };
}

export function parseMemberImportBuffer(buffer: Buffer, filename: string): MemberFormData[] {
  const lower = filename.toLowerCase();
  const rows: Record<string, string>[] = [];

  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV file must include a header row and at least one data row.");
    }
    const headerLine = lines[0]!;
    const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    validateHeaders(headers);

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]!);
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        if (key) {
          record[key] = values[j]?.trim() ?? "";
        }
      }
      if (!isEmptyRow(normalizeRecord(record))) {
        rows.push(normalizeRecord(record));
      }
    }
  } else {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Workbook has no sheets.");
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error("Could not read the first worksheet.");
    }

    const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    }) as unknown[][];

    if (matrix.length < 2) {
      throw new Error("Spreadsheet must include a header row and at least one data row.");
    }

    const headers = matrix[0]!.map((cell) => cellText(cell));
    validateHeaders(headers);

    for (let i = 1; i < matrix.length; i++) {
      const line = matrix[i] ?? [];
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        if (key) {
          record[key] = cellText(line[j]);
        }
      }
      const normalized = normalizeRecord(record);
      if (!isEmptyRow(normalized)) {
        rows.push(normalized);
      }
    }
  }

  if (rows.length === 0) {
    throw new Error("No data rows found.");
  }

  if (rows.length > 500) {
    throw new Error("Maximum 500 rows per upload.");
  }

  const parsedRows: MemberFormData[] = [];
  const errors: MemberImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = parseMemberImportRecord(rows[i]!, i + 2);
    if (result.ok) {
      parsedRows.push(result.data);
    } else {
      errors.push({ row: result.row, message: result.message });
    }
  }

  if (errors.length > 0) {
    const detail = errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join("\n");
    const suffix = errors.length > 5 ? `\n…and ${errors.length - 5} more.` : "";
    throw new Error(`${errors.length} row(s) failed validation.\n${detail}${suffix}`);
  }

  return parsedRows;
}

function normalizeRecord(record: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const field of MEMBER_IMPORT_FIELDS) {
    normalized[field] = record[field]?.trim() ?? "";
  }
  return normalized;
}

function validateHeaders(headers: string[]): void {
  const missing = MEMBER_IMPORT_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(", ")}`);
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function buildMemberImportTemplateBuffer(): Buffer {
  const membersSheet = XLSX.utils.aoa_to_sheet([
    [...MEMBER_IMPORT_FIELDS],
    MEMBER_IMPORT_FIELDS.map((field) => MEMBER_IMPORT_EXAMPLE_ROW[field]),
  ]);

  membersSheet["!cols"] = MEMBER_IMPORT_FIELDS.map((field) => ({
    wch: Math.max(field.length, MEMBER_IMPORT_EXAMPLE_ROW[field].length + 2, 14),
  }));

  const instructions = [
    ["Field", "Required", "Format / allowed values"],
    ["firstName", "Yes", "Text, max 50 characters"],
    ["lastName", "Yes", "Text, max 50 characters"],
    ["otherNames", "No", "Text, max 100 characters (leave blank if none)"],
    ["dob", "Yes", "Date as YYYY-MM-DD"],
    ["sex", "Yes", "MALE or FEMALE"],
    ["rank", "Yes", `One of: ${POLICE_RANKS.join(", ")}`],
    ["contact", "Yes", "Ghana phone: +233 followed by 9 digits"],
    ["department", "Yes", "Text, max 120 characters"],
    ["division", "Yes", "Text, max 100 characters"],
    ["district", "Yes", "Text, max 100 characters"],
    ["station", "Yes", "Text, max 100 characters"],
    ["status", "No", "ACTIVE, SICK, INJURED, MATERNITY_LEAVE, or RETIRED (defaults to ACTIVE)"],
    ["", "", "Photo is not imported — add photos individually after upload."],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 72 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, membersSheet, "Members");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
