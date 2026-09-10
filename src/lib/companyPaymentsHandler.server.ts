import {
  createAttachmentUrl,
  createCompany,
  createPayment,
  deleteAttachment,
  deletePayment,
  listCompanies,
  listPayments,
  listPaymentsForExport,
  readSignedAttachment,
  saveAttachment,
  setPaymentDeducted,
  updateCompany,
  updatePayment,
  type PaymentFilters,
} from "./companyPaymentsStore.server";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function error(message: string, status = 400) {
  return json({ message }, status);
}

function currentUser(request: Request) {
  return (
    request.headers.get("cf-access-authenticated-user-email") ||
    request.headers.get("x-forwarded-user") ||
    request.headers.get("x-user-email") ||
    "مستخدم Flow"
  );
}

function filtersFromUrl(url: URL): PaymentFilters {
  return {
    companyId: url.searchParams.get("companyId") || undefined,
    status: (url.searchParams.get("status") as PaymentFilters["status"]) || "pending",
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    search: url.searchParams.get("search") || undefined,
    page: Number(url.searchParams.get("page") || 1),
    pageSize: Number(url.searchParams.get("pageSize") || 25),
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function handleCompanyPaymentsRequest(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "payments";
  try {
    if (request.method === "GET") {
      if (action === "companies") {
        return json(await listCompanies(url.searchParams.get("search") || undefined));
      }
      if (action === "attachment") {
        const attachment = await readSignedAttachment(
          url.searchParams.get("id") || "",
          url.searchParams.get("expires") || "",
          url.searchParams.get("token") || "",
        );
        return new Response(attachment.bytes, {
          headers: {
            "Content-Type": attachment.mimeType,
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
            "Cache-Control": "private, no-store",
          },
        });
      }
      if (action === "attachment-url") {
        return json({ url: await createAttachmentUrl(url.searchParams.get("paymentId") || "") });
      }
      if (action === "export") {
        const rows = await listPaymentsForExport(filtersFromUrl(url));
        const header = [
          "الشركة",
          "المبلغ",
          "التاريخ",
          "النوع",
          "الملاحظات",
          "رقم العملية/الصك",
          "الحالة",
          "مسجل السداد",
          "قام بالخصم",
          "تاريخ الخصم",
          "مرفق",
        ];
        const body = rows.map((row) =>
          [
            row.companyName,
            row.amount.toFixed(3),
            row.date,
            row.type === "bank" ? "مصرف" : "كاش",
            row.notes,
            row.referenceNo,
            row.status === "deducted" ? "مخصوم" : "لم يخصم",
            row.createdBy,
            row.deductedBy || "",
            row.deductedAt || "",
            row.attachment?.fileName || "",
          ]
            .map(csvCell)
            .join(","),
        );
        return new Response(`\uFEFF${[header.map(csvCell).join(","), ...body].join("\r\n")}`, {
          headers: {
            "Content-Type": "application/vnd.ms-excel; charset=utf-8",
            "Content-Disposition": 'attachment; filename="company-payments.csv"',
            "Cache-Control": "no-store",
          },
        });
      }
      return json(await listPayments(filtersFromUrl(url)));
    }

    if (request.method === "POST" && action === "upload-attachment") {
      const formData = await request.formData();
      const paymentId = String(formData.get("paymentId") || "");
      const file = formData.get("file");
      if (!(file instanceof File)) return error("المرفق غير صحيح.");
      return json(await saveAttachment(paymentId, file, currentUser(request)));
    }

    if (request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      switch (action) {
        case "create-company":
          return json(await createCompany(body, currentUser(request)), 201);
        case "update-company":
          return json(await updateCompany(body, currentUser(request)));
        case "create-payment":
          return json(await createPayment(body, currentUser(request)), 201);
        case "update-payment":
          return json(await updatePayment(body, currentUser(request)));
        case "delete-payment":
          return json(await deletePayment(String(body.id || "")));
        case "set-deducted":
          return json(await setPaymentDeducted(String(body.id || ""), Boolean(body.deducted), currentUser(request)));
        case "delete-attachment":
          return json(await deleteAttachment(String(body.paymentId || "")));
      }
    }
    return error("إجراء غير معروف.", 404);
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "تعذر تنفيذ الطلب.");
  }
}
