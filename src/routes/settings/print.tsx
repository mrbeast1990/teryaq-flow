import { createFileRoute } from "@tanstack/react-router";
import { ImageUp, Save } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { DEFAULT_PRINT_SETTINGS, savePrintSettings, usePrintSettings, type PrintSettings } from "@/lib/printSettings";

const MAX_LOGO_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PROCESSED_LOGO_BYTES = 900 * 1024;
const MAX_LOGO_SIDE = 1400;
const SUPPORTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

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

  const handleLogo = async (file?: File) => {
    setLogoError("");
    setSaved(false);
    if (!file) return;
    if (!SUPPORTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("الصيغ المدعومة: PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      setLogoError("حجم الشعار كبير. الحد الأقصى للصورة الأصلية هو 5MB.");
      return;
    }
    try {
      const processedLogo = await processLogoFile(file);
      update("logoDataUrl", processedLogo);
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : "تعذر تجهيز الشعار للطباعة. جرّب صورة أخرى.");
    }
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
              <p className="text-[11px] text-muted-foreground">يحفظ محليًا في هذا المتصفح بعد ضغطه، ويستخدم في الطباعة فقط.</p>
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

function dataUrlByteSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر قراءة ملف الشعار."));
    image.src = src;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الشعار."));
    reader.readAsDataURL(file);
  });
}

async function processLogoFile(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const ratio = Math.min(1, MAX_LOGO_SIDE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز الشعار للطباعة.");
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const preferredType = file.type === "image/png" ? "image/png" : "image/webp";
  let dataUrl = canvas.toDataURL(preferredType, 0.9);
  if (dataUrlByteSize(dataUrl) > MAX_PROCESSED_LOGO_BYTES && preferredType === "image/png") {
    dataUrl = canvas.toDataURL("image/webp", 0.92);
  }
  if (dataUrlByteSize(dataUrl) > MAX_PROCESSED_LOGO_BYTES) {
    dataUrl = canvas.toDataURL("image/webp", 0.82);
  }
  if (dataUrlByteSize(dataUrl) > MAX_PROCESSED_LOGO_BYTES) {
    throw new Error("تمت معالجة الشعار لكن حجمه لا يزال كبيرًا للحفظ المحلي. جرّب صورة أبسط أو أصغر.");
  }
  return dataUrl;
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
