import { createFileRoute } from "@tanstack/react-router";
import { ImageUp, Save } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { DEFAULT_PRINT_SETTINGS, savePrintSettings, usePrintSettings, type PrintSettings } from "@/lib/printSettings";

export const Route = createFileRoute("/settings/print")({
  head: () => ({
    meta: [{ title: "إعدادات الطباعة — Teryaq" }],
  }),
  component: PrintSettingsPage,
});

function PrintSettingsPage() {
  const current = usePrintSettings();
  const [settings, setSettings] = useState<PrintSettings>(current);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState("");

  const update = (key: keyof PrintSettings, value: string) => {
    setSaved(false);
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const save = () => {
    savePrintSettings(settings);
    setSaved(true);
  };

  const handleLogo = (file?: File) => {
    setLogoError("");
    setSaved(false);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("الصيغ المدعومة: PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > 600 * 1024) {
      setLogoError("حجم الشعار كبير. اختر صورة أقل من 600KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <PageHeader title="إعدادات الطباعة" subtitle="تفضيلات محلية لقوالب الفواتير وكشوف الحساب والإيصالات." showBack />

      <div className="space-y-4 pb-8">
        <section className="card-surface space-y-3 p-3">
          <Field label="اسم الصيدلية" value={settings.pharmacyName} onChange={(value) => update("pharmacyName", value)} />
          <Field label="العنوان" value={settings.address} onChange={(value) => update("address", value)} />
          <Field label="الهاتف" value={settings.phone} onChange={(value) => update("phone", value)} />
          <Field label="سطر إضافي" value={settings.secondaryLine} onChange={(value) => update("secondaryLine", value)} />
          <Field label="بيانات تجارية / ضريبية اختيارية" value={settings.commercialText} onChange={(value) => update("commercialText", value)} />
          <Field label="ملاحظة أسفل الطباعة" value={settings.footerNote} onChange={(value) => update("footerNote", value)} />
        </section>

        <section className="card-surface space-y-3 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">الشعار</h2>
              <p className="text-[11px] text-muted-foreground">يحفظ محليًا في هذا المتصفح ويستخدم في الطباعة فقط.</p>
            </div>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12px] font-bold hover:bg-secondary">
              <ImageUp className="size-4" />
              اختيار
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleLogo(event.target.files?.[0])} />
            </label>
          </div>
          {settings.logoDataUrl ? (
            <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
              <img src={settings.logoDataUrl} alt="" className="size-14 rounded-lg border border-border object-contain bg-white" />
              <button type="button" className="text-[12px] font-bold text-destructive" onClick={() => update("logoDataUrl", "")}>
                إزالة الشعار
              </button>
            </div>
          ) : null}
          {logoError ? <p className="text-[11px] font-bold text-destructive">{logoError}</p> : null}
        </section>

        <div className="flex flex-wrap gap-2">
          <ActionButton label="حفظ" icon={Save} onClick={save} />
          <ActionButton label="استعادة الافتراضي" variant="outline" onClick={() => setSettings(DEFAULT_PRINT_SETTINGS)} />
          {saved ? <span className="rounded-lg bg-success/10 px-3 py-2 text-[12px] font-bold text-success">تم الحفظ</span> : null}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
      />
    </label>
  );
}
