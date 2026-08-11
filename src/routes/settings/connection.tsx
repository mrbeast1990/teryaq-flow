import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Database, PlugZap, Save, Server, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { ErrorState, LoadingState } from "@/components/teryaq/States";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import {
  ApiError,
  type ConnectionPayload,
  type SavedConnection,
  getConnections,
  getSystemStatus,
  saveConnection,
  testConnection,
  useConnection,
} from "@/lib/api";

export const Route = createFileRoute("/settings/connection")({
  head: () => ({
    meta: [
      { title: "إدارة الاتصال — Teryaq" },
      { name: "description", content: "إدارة اتصال Teryaq Flow بواجهة Teryaq SQL Connector الحالية." },
    ],
  }),
  component: ConnectionSettingsPage,
});

type FormState = {
  id: string;
  name: string;
  server: string;
  database: string;
  user: string;
  password: string;
  port: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  tdsVersion: string;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  server: "",
  database: "",
  user: "",
  password: "",
  port: "",
  encrypt: false,
  trustServerCertificate: true,
  tdsVersion: "7_3_A",
};

function fromConnection(connection?: SavedConnection | null): FormState {
  if (!connection) return emptyForm;
  return {
    id: connection.id,
    name: connection.name || "",
    server: connection.server || "",
    database: connection.database || "",
    user: connection.user || "",
    password: "",
    port: connection.port ? String(connection.port) : "",
    encrypt: Boolean(connection.encrypt),
    trustServerCertificate: connection.trustServerCertificate ?? true,
    tdsVersion: connection.tdsVersion || "7_3_A",
  };
}

function toPayload(form: FormState): ConnectionPayload {
  const payload: ConnectionPayload = {
    id: form.id || undefined,
    name: form.name.trim() || form.server.trim(),
    server: form.server.trim(),
    database: form.database.trim(),
    user: form.user.trim(),
    password: form.password,
    port: form.port.trim() ? Number(form.port) : null,
    encrypt: form.encrypt,
    trustServerCertificate: form.trustServerCertificate,
    tdsVersion: form.tdsVersion.trim() || "7_3_A",
  };
  return payload;
}

function formatDateTime(value?: string | null) {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compactServer(server?: string | null) {
  if (!server) return "غير محدد";
  const lower = server.toLowerCase();
  if (lower.startsWith("localhost")) return "Localhost";
  if (lower.startsWith("desktop-7gfv")) return "DESKTOP";
  return server.split("\\")[0] || server;
}

function connectionError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع.";
}

function ConnectionSettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [notice, setNotice] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["systemStatus"],
    queryFn: () => getSystemStatus(),
    refetchInterval: 30000,
  });

  const connectionsQuery = useQuery({
    queryKey: ["connections"],
    queryFn: () => getConnections(),
  });

  const activeConnection = useMemo(() => {
    const activeId = connectionsQuery.data?.activeConnectionId;
    return connectionsQuery.data?.connections.find((item) => item.id === activeId) ?? null;
  }, [connectionsQuery.data]);

  useEffect(() => {
    if (!editingId && activeConnection) {
      setForm(fromConnection(activeConnection));
    }
  }, [activeConnection, editingId]);

  const clearServerDataCache = async () => {
    queryClient.removeQueries();
    await Promise.all([statusQuery.refetch(), connectionsQuery.refetch()]);
  };

  const switchMutation = useMutation({
    mutationFn: (id: string) => useConnection(id),
    onSuccess: async () => {
      setNotice("تم تبديل الاتصال بنجاح. تم مسح بيانات السيرفر السابق وإعادة طلب الحالة.");
      await clearServerDataCache();
    },
  });

  const testMutation = useMutation({
    mutationFn: (payload: ConnectionPayload) => testConnection(payload),
    onSuccess: () => setNotice("اختبار الاتصال نجح."),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ConnectionPayload) => saveConnection(payload),
    onSuccess: async () => {
      setNotice("تم حفظ الاتصال وتفعيله بنجاح.");
      setEditingId(null);
      setForm((current) => ({ ...current, password: "" }));
      await clearServerDataCache();
    },
  });

  const isBusy = switchMutation.isPending || testMutation.isPending || saveMutation.isPending;
  const error = switchMutation.error || testMutation.error || saveMutation.error;

  const handleEdit = (connection: SavedConnection) => {
    setEditingId(connection.id);
    setForm(fromConnection(connection));
    setNotice(null);
  };

  const handleSwitch = async (connection: SavedConnection) => {
    if (connection.id === connectionsQuery.data?.activeConnectionId) return;
    const ok = window.confirm(
      `سيتم تبديل الاتصال إلى:\n${connection.server}\n${connection.database}\n\nسيتم تحديث بيانات الشاشة ومسح cache السيرفر السابق. هل تريد المتابعة؟`,
    );
    if (!ok) return;
    setNotice(null);
    await switchMutation.mutateAsync(connection.id);
  };

  const handleTest = () => {
    setNotice(null);
    testMutation.mutate(toPayload(form));
  };

  const handleSave = () => {
    setNotice(null);
    saveMutation.mutate(toPayload(form));
  };

  const status = statusQuery.data;
  const connected = Boolean(status?.connected);

  return (
    <AppShell>
      <PageHeader
        title="إدارة الاتصال"
        subtitle="تبديل وتعديل الاتصالات المحفوظة في Teryaq SQL Connector الحالي"
        actions={<ActionButton label="رجوع" icon={ArrowRight} variant="outline" onClick={() => window.history.back()} />}
      />

      <section className="card-surface mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
              <Database className="size-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold">حالة الاتصال</p>
              <p className="text-[11px] text-muted-foreground">تأتي مباشرة من /api/status</p>
            </div>
          </div>
          <StatusBadge label={connected ? "Connected ✓" : "Disconnected"} tone={connected ? "success" : "danger"} />
        </div>

        {statusQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : statusQuery.isError ? (
          <ErrorState description={connectionError(statusQuery.error)} onRetry={() => statusQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <InfoCell label="السيرفر" value={status?.server || "غير محدد"} />
            <InfoCell label="قاعدة البيانات" value={status?.database || status?.databaseName || "غير محدد"} />
            <InfoCell label="Profile" value={status?.profile || "غير محدد"} />
            <InfoCell label="آخر اتصال" value={formatDateTime(status?.lastConnectionTime)} />
          </div>
        )}
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold">الاتصالات المحفوظة</h2>
          <StatusBadge label={`${connectionsQuery.data?.connections.length ?? 0} اتصال`} tone="info" />
        </div>

        {connectionsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : connectionsQuery.isError ? (
          <ErrorState description={connectionError(connectionsQuery.error)} onRetry={() => connectionsQuery.refetch()} />
        ) : (
          <div className="space-y-2">
            {connectionsQuery.data?.connections.map((connection) => {
              const active = connection.id === connectionsQuery.data?.activeConnectionId;
              return (
                <article key={connection.id} className={`card-surface p-3 ${active ? "ring-2 ring-success/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[13px] font-extrabold">{connection.name}</h3>
                        {active ? <StatusBadge label="نشط ✓" tone="success" /> : <StatusBadge label="غير نشط" tone="neutral" />}
                      </div>
                      <p className="mt-1 truncate text-[12px] font-semibold">{connection.server}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {connection.database} · {compactServer(connection.server)} · آخر اتصال: {formatDateTime(connection.lastConnectionAt)}
                      </p>
                    </div>
                    <Server className="mt-1 size-5 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ActionButton label="تعديل" variant="outline" onClick={() => handleEdit(connection)} disabled={isBusy} />
                    <ActionButton
                      label={active ? "الاتصال نشط" : "تبديل"}
                      variant={active ? "ghost" : "primary"}
                      onClick={() => handleSwitch(connection)}
                      disabled={active || isBusy}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">اختبار وتعديل الاتصال</h2>
            <p className="text-[11px] text-muted-foreground">لا يتم عرض كلمة المرور المحفوظة ولا تخزن في المتصفح.</p>
          </div>
        </div>

        <div className="grid gap-2">
          <TextField label="الاسم" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <TextField label="Server" value={form.server} onChange={(value) => setForm((current) => ({ ...current, server: value }))} />
          <TextField label="Database" value={form.database} onChange={(value) => setForm((current) => ({ ...current, database: value }))} />
          <TextField label="Username" value={form.user} onChange={(value) => setForm((current) => ({ ...current, user: value }))} />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            placeholder="اتركه فارغًا لاستخدام كلمة المرور المحفوظة"
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Port" value={form.port} onChange={(value) => setForm((current) => ({ ...current, port: value }))} />
            <TextField label="TDS Version" value={form.tdsVersion} onChange={(value) => setForm((current) => ({ ...current, tdsVersion: value }))} />
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-bold">
            Trust Server Certificate
            <input
              type="checkbox"
              checked={form.trustServerCertificate}
              onChange={(event) => setForm((current) => ({ ...current, trustServerCertificate: event.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-bold">
            Encrypt
            <input
              type="checkbox"
              checked={form.encrypt}
              onChange={(event) => setForm((current) => ({ ...current, encrypt: event.target.checked }))}
            />
          </label>
        </div>

        {notice ? <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-2 text-[12px] font-bold text-success">{notice}</div> : null}
        {error ? <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-[12px] font-bold text-destructive">{connectionError(error)}</div> : null}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <ActionButton label="اختبار" icon={PlugZap} variant="outline" onClick={handleTest} disabled={isBusy} />
          <ActionButton label="حفظ" icon={Save} variant="primary" onClick={handleSave} disabled={isBusy} />
          <ActionButton
            label="إلغاء"
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setForm(fromConnection(activeConnection));
              setNotice(null);
            }}
            disabled={isBusy}
          />
        </div>
      </section>
    </AppShell>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-extrabold">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] font-semibold outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
