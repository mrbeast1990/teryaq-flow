import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { accountMetadataKey, type AccountKind, type AccountMetadata } from "./accountDirectory";

type Change = {
  key: string;
  at: string;
  by: string;
  before: AccountMetadata | null;
  after: AccountMetadata;
};
type Store = { version: 1; records: Record<string, AccountMetadata>; history: Change[] };

export function createAccountMetadataStore(
  directory = path.join(process.cwd(), ".data", "account-administration"),
) {
  const file = path.join(directory, "accounts.json");
  let queue: Promise<unknown> = Promise.resolve();
  async function read(): Promise<Store> {
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as Store;
      if (parsed.version !== 1 || !parsed.records || !Array.isArray(parsed.history))
        throw new Error("مخزن الحسابات غير صالح.");
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { version: 1, records: {}, history: [] };
      throw error;
    }
  }
  return {
    async records(sourceId: string, kind: AccountKind) {
      const db = await read();
      return Object.values(db.records).filter(
        (row) => row.sourceId === sourceId && row.kind === kind,
      );
    },
    async update(
      input: {
        sourceId: string;
        kind: AccountKind;
        personNo: number;
        closed?: boolean;
        phone?: string;
        revision: number;
        originalPhone?: string | null;
      },
      actor: string,
    ) {
      const operation = queue
        .catch(() => undefined)
        .then(async () => {
          const key = accountMetadataKey(input.sourceId, input.kind, input.personNo);
          if (input.closed !== undefined && typeof input.closed !== "boolean")
            throw new Error("حالة القفل غير صحيحة.");
          if (
            input.phone !== undefined &&
            (typeof input.phone !== "string" ||
              !input.phone.trim() ||
              input.phone.length > 80 ||
              (input.phone.match(/[0-9٠-٩۰-۹]/g)?.length || 0) < 3 ||
              /[\r\n]/.test(input.phone) ||
              !/^[0-9٠-٩۰-۹+().\s-]+$/.test(input.phone))
          ) {
            throw new Error("أدخل رقم هاتف صالحًا؛ لا يمكن استبدال الرقم بقيمة فارغة.");
          }
          if (input.closed === undefined && input.phone === undefined)
            throw new Error("لا توجد تعديلات للحفظ.");
          const db = await read();
          const previous = db.records[key];
          if ((previous?.revision || 0) !== input.revision)
            throw Object.assign(
              new Error("تغيّر الحساب من جهاز آخر. حدّث القائمة ثم أعد المحاولة."),
              { status: 409 },
            );
          const at = new Date().toISOString();
          const next: AccountMetadata = {
            sourceId: input.sourceId,
            kind: input.kind,
            personNo: input.personNo,
            closed: input.closed ?? previous?.closed ?? false,
            phone: input.phone ?? previous?.phone ?? null,
            originalPhone: previous?.originalPhone ?? input.originalPhone ?? null,
            revision: (previous?.revision || 0) + 1,
            updatedAt: at,
            updatedBy: actor,
          };
          db.records[key] = next;
          db.history.push({ key, at, by: actor, before: previous || null, after: next });
          await mkdir(directory, { recursive: true });
          const temporary = `${file}.${randomUUID()}.tmp`;
          await writeFile(temporary, JSON.stringify(db, null, 2), {
            encoding: "utf8",
            mode: 0o600,
          });
          await rename(temporary, file);
          return next;
        });
      queue = operation;
      return operation;
    },
  };
}

export const accountMetadataStore = createAccountMetadataStore();
