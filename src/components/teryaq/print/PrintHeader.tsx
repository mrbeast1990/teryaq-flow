import type { ReactNode } from "react";
import { usePrintSettings } from "@/lib/printSettings";

type PrintHeaderProps = {
  title: string;
  subtitle?: ReactNode;
};

export function PrintHeader({ title, subtitle }: PrintHeaderProps) {
  const settings = usePrintSettings();

  return (
    <header className="print-doc-header">
      <div className="print-logo-box">
        {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="" /> : <span>TF</span>}
      </div>
      <div className="print-doc-heading">
        <h1>{settings.pharmacyName || "صيدلية الترياق الشافي"}</h1>
        {settings.secondaryLine ? <p>{settings.secondaryLine}</p> : null}
        {settings.address || settings.phone ? (
          <p>
            {[settings.address, settings.phone].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {settings.commercialText ? <p>{settings.commercialText}</p> : null}
      </div>
      <div className="print-doc-title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </header>
  );
}

export function PrintFooter() {
  const settings = usePrintSettings();

  return (
    <footer className="print-doc-footer">
      <span>تاريخ الطباعة: {new Date().toLocaleString("ar-LY")}</span>
      {settings.footerNote ? <span>{settings.footerNote}</span> : null}
    </footer>
  );
}
