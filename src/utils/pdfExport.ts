import jsPDF from "jspdf";
import type { Child, HealthCheckupRecord, GrowthMetricType } from "@/types";
import { GROWTH_METRIC_LABELS } from "@/data/growthStandards";
import {
  calculateAgeMonths,
  getGrowthPercentileAtAge,
  calculatePercentileValue,
  getGrowthStatus,
} from "./growthUtils";
import type { VaccineCheckReportData, VaccineCheckItem } from "./vaccineCheckReport";
import { ageMonthToText } from "./vaccineCheckReport";

export function svgToDataUrl(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], {
    type: "image/svg+xml;charset=utf-8",
  });
  return URL.createObjectURL(svgBlob);
}

export function svgToPngDataUrl(
  svg: SVGSVGElement,
  scale: number = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const dataUrl = svgToDataUrl(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法获取 canvas context"));
        return;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(dataUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(dataUrl);
      reject(new Error("SVG 转图片失败"));
    };
    img.src = dataUrl;
  });
}

interface ExportGrowthPdfOptions {
  child: Child;
  records: HealthCheckupRecord[];
  chartSvgs: Record<GrowthMetricType, SVGSVGElement | null>;
}

export async function exportGrowthPdf({
  child,
  records,
  chartSvgs,
}: ExportGrowthPdfOptions) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("儿童生长发育报告", pageWidth / 2, y, { align: "center" });
  y += 10;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`姓名：${child.name}`, margin, y);
  y += 6;
  pdf.text(`性别：${child.gender === "male" ? "男" : "女"}`, margin, y);
  y += 6;
  pdf.text(`出生日期：${child.birthDate}`, margin, y);
  y += 6;
  pdf.text(
    `报告生成日期：${new Date().toLocaleDateString("zh-CN")}`,
    margin,
    y
  );
  y += 10;

  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  const metrics: GrowthMetricType[] = ["height", "weight", "headCircumference"];

  for (const metric of metrics) {
    const svg = chartSvgs[metric];
    if (!svg) continue;

    if (y + 120 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `${GROWTH_METRIC_LABELS[metric]}生长曲线`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 8;

    try {
      const pngDataUrl = await svgToPngDataUrl(svg, 2);
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (imgWidth * svg.clientHeight) / svg.clientWidth;

      pdf.addImage(pngDataUrl, "PNG", margin, y, imgWidth, imgHeight);
      y += imgHeight + 8;
    } catch (e) {
      console.error("图表转图片失败:", e);
      y += 50;
    }
  }

  if (y + 50 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("体检记录明细", pageWidth / 2, y, { align: "center" });
  y += 10;

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.checkupDate).getTime() - new Date(b.checkupDate).getTime()
  );

  const colX = [margin, margin + 30, margin + 60, margin + 90, margin + 120];
  const colHeaders = ["日期", "年龄", "身高", "体重", "头围"];

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  colHeaders.forEach((header, i) => {
    pdf.text(header, colX[i], y);
  });
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setLineWidth(0.3);
  pdf.line(margin, y - 2, pageWidth - margin, y - 2);

  for (const record of sortedRecords) {
    if (y + 6 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    const ageMonths = calculateAgeMonths(child.birthDate, record.checkupDate);
    const ageText = `${ageMonths}个月`;

    pdf.text(record.checkupDate, colX[0], y);
    pdf.text(ageText, colX[1], y);
    pdf.text(
      record.height ? `${record.height} cm` : "-",
      colX[2],
      y
    );
    pdf.text(
      record.weight ? `${record.weight} kg` : "-",
      colX[3],
      y
    );
    pdf.text(
      record.headCircumference ? `${record.headCircumference} cm` : "-",
      colX[4],
      y
    );
    y += 6;
  }

  y += 4;
  if (y + 40 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("生长评估说明", margin, y);
  y += 6;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const lines = [
    "• P3-P97 为正常生长范围，约 94% 的健康儿童在此范围内。",
    "• P50 为中位数，代表同龄儿童的平均水平。",
    "• 低于 P3 或高于 P97 建议咨询儿保医生进行评估。",
    "• 生长趋势比单次测量值更重要，持续跟踪观察发育情况。",
    "• 本报告数据仅供参考，具体诊断请以专业医生意见为准。",
  ];

  lines.forEach((line) => {
    if (y + 5 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 5;
  });

  const fileName = `${child.name}_生长发育报告_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.pdf`;
  pdf.save(fileName);
}

export function getRecordAnalysis(
  child: Child,
  record: HealthCheckupRecord
): {
  heightPercentile?: number;
  weightPercentile?: number;
  headCircumferencePercentile?: number;
  heightStatus?: "normal" | "attention";
  weightStatus?: "normal" | "attention";
  headCircumferenceStatus?: "normal" | "attention";
} {
  const ageMonths = calculateAgeMonths(child.birthDate, record.checkupDate);
  const result: ReturnType<typeof getRecordAnalysis> = {};

  if (record.height !== undefined) {
    const pData = getGrowthPercentileAtAge(child.gender, "height", ageMonths);
    if (pData) {
      result.heightPercentile = calculatePercentileValue(record.height, pData);
      result.heightStatus = getGrowthStatus(result.heightPercentile);
    }
  }

  if (record.weight !== undefined) {
    const pData = getGrowthPercentileAtAge(child.gender, "weight", ageMonths);
    if (pData) {
      result.weightPercentile = calculatePercentileValue(record.weight, pData);
      result.weightStatus = getGrowthStatus(result.weightPercentile);
    }
  }

  if (record.headCircumference !== undefined) {
    const pData = getGrowthPercentileAtAge(
      child.gender,
      "headCircumference",
      ageMonths
    );
    if (pData) {
      result.headCircumferencePercentile = calculatePercentileValue(
        record.headCircumference,
        pData
      );
      result.headCircumferenceStatus = getGrowthStatus(
        result.headCircumferencePercentile
      );
    }
  }

  return result;
}

function formatDateCN(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

function addPdfVaccineStatusLabel(
  pdf: jsPDF,
  item: VaccineCheckItem,
  x: number,
  y: number,
  pageHeight: number,
  margin: number,
  pageWidth: number
): number {
  const statusMap = {
    completed: "[完成]",
    partial: "[部分]",
    missing: "[漏种]",
  };
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${item.name}`, x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(item.description, x + 60, y);

  pdf.setFontSize(9);
  if (item.status === "completed") {
    pdf.setTextColor(92, 184, 92);
  } else if (item.status === "partial") {
    pdf.setTextColor(230, 184, 0);
  } else {
    pdf.setTextColor(217, 83, 79);
  }
  pdf.text(statusMap[item.status], pageWidth - margin - 20, y);
  pdf.setTextColor(0);

  y += 6;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const progressText = `${item.completedDoses}/${item.totalDoses} 剂次完成`;
  pdf.text(progressText, x + 2, y);
  y += 5;

  item.doseDetails.forEach((dose) => {
    if (y + 10 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    const statusText = dose.isCompleted
      ? `第${dose.dose}剂 ${ageMonthToText(dose.ageMonth)} - 已接种 ${dose.vaccinationDate || ""}`
      : `第${dose.dose}剂 ${ageMonthToText(dose.ageMonth)} - 未接种`;
    if (dose.isCompleted) {
      pdf.setTextColor(92, 184, 92);
    } else {
      pdf.setTextColor(217, 83, 79);
    }
    pdf.setFontSize(8);
    pdf.text("  " + statusText, x + 2, y);
    pdf.setTextColor(0);
    y += 5;
  });

  return y;
}

export async function exportVaccineCheckPdf(report: VaccineCheckReportData) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("国家免疫规划疫苗", pageWidth / 2, y, { align: "center" });
  y += 4;
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("儿童入园/入学预防接种查验报告", pageWidth / 2, y, { align: "center" });
  y += 10;

  pdf.setLineWidth(0.6);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("儿童基本信息", margin, y);
  y += 7;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`姓名：${report.child.name}`, margin, y);
  pdf.text(
    `性别：${report.child.gender === "male" ? "男" : "女"}`,
    margin + 60,
    y
  );
  y += 6;
  pdf.text(`出生日期：${report.child.birthDate}`, margin, y);
  pdf.text(
    `当前年龄：${ageMonthToText(report.currentAgeMonths)}`,
    margin + 60,
    y
  );
  y += 6;
  pdf.text(
    `报告日期：${formatDateCN(new Date())}`,
    margin,
    y
  );
  y += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  let statusTitle = "查验结论：";
  if (report.overallStatus === "completed") {
    pdf.setTextColor(92, 184, 92);
    statusTitle += "查验合格";
  } else if (report.overallStatus === "partial") {
    pdf.setTextColor(230, 184, 0);
    statusTitle += "部分完成";
  } else {
    pdf.setTextColor(217, 83, 79);
    statusTitle += "需要补种";
  }
  pdf.text(statusTitle, margin, y);
  pdf.setTextColor(0);
  y += 7;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const completion =
    report.totalRequiredDoses > 0
      ? (report.completedDoses / report.totalRequiredDoses) * 100
      : 0;
  pdf.text(
    `接种完成率：${report.completedDoses}/${report.totalRequiredDoses} 剂次 (${completion.toFixed(0)}%)`,
    margin,
    y
  );
  y += 6;
  pdf.text(
    `已完成疫苗：${report.completedVaccines.length} 种`,
    margin,
    y
  );
  pdf.text(
    `部分完成：${report.partiallyCompletedVaccines.length} 种`,
    margin + 50,
    y
  );
  pdf.text(
    `漏种疫苗：${report.missingVaccines.length} 种`,
    margin + 100,
    y
  );
  y += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("疫苗接种情况明细", margin, y);
  y += 10;

  const addVaccineSection = (
    title: string, items: VaccineCheckItem[]) => {
      if (items.length === 0) return;
      if (y + 8 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${title} (${items.length}种)`, margin, y);
      y += 7;

      items.forEach((item) => {
        if (y + 30 > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        y = addPdfVaccineStatusLabel(
          pdf,
          item,
          margin + 2,
          y,
          pageHeight,
          margin,
          pageWidth
        );
        y += 4;
      });
      y += 4;
    };

  addVaccineSection("一、已完成接种的疫苗", report.completedVaccines);
  addVaccineSection("二、部分完成的疫苗", report.partiallyCompletedVaccines);
  addVaccineSection("三、漏种的疫苗", report.missingVaccines);

  if (y + 50 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  } else {
    y += 15;
  }

  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120, 120, 120);
  const noteLines = [
    "说明：",
    "1. 本报告根据国家免疫规划疫苗儿童免疫程序（6岁/入学前）要求生成。",
    "2. 如对查验结果有疑问，请咨询当地接种单位或疾病预防控制中心。",
    "3. 漏种疫苗请尽快到就近的接种单位进行补种。",
    "4. 本报告仅作参考，具体以接种记录请以接种单位出具的正式证明为准。",
  ];
  noteLines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 5;
  });
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(0);
  pdf.text("家长/监护人签字：_______________", margin, y);
  pdf.text("接种单位盖章：_______________", margin + 85, y);
  y += 10;
  pdf.text(
    `日期：${formatDateCN(new Date())}`,
    pageWidth - margin - 40,
    y
  );

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  y += 15;
  pdf.text(
    "本报告由儿童健康记录工具自动生成",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  pdf.setTextColor(0);

  const fileName = `${report.child.name}_入园入学接种查验报告_${new Date()
    .toLocaleDateString("zh-CN")
    .replace(/\//g, "-")}.pdf`;
  pdf.save(fileName);
}

