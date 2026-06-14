import { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import type { HealthCheckupRecord, Child, GrowthMetricType } from "@/types";
import {
  GROWTH_METRIC_LABELS,
  GROWTH_METRIC_UNITS,
} from "@/data/growthStandards";
import {
  calculateAgeMonths,
  getGrowthPercentileAtAge,
  calculatePercentileValue,
  getGrowthStatus,
  getGrowthStandardAges,
} from "@/utils/growthUtils";

interface GrowthChartProps {
  child: Child;
  records: HealthCheckupRecord[];
  metric: GrowthMetricType;
}

export interface GrowthChartRef {
  getSvgElement: () => SVGSVGElement | null;
}

const GrowthChart = forwardRef<GrowthChartRef, GrowthChartProps>(
  ({ child, records, metric }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
    }));

    const chartData = useMemo(() => {
      const width = 700;
      const height = 400;
      const padding = { top: 40, right: 40, bottom: 50, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      const standardAges = getGrowthStandardAges(child.gender, metric);
      const maxAge = Math.max(...standardAges);

      const recordAges = records
        .filter((r) => r[metric] !== undefined)
        .map((r) => calculateAgeMonths(child.birthDate, r.checkupDate));

      const xMax = Math.max(maxAge, ...recordAges, 12);
      const xMin = 0;

      let yMin: number, yMax: number;
      const percentileAtMin = getGrowthPercentileAtAge(
        child.gender,
        metric,
        xMin
      );
      const percentileAtMax = getGrowthPercentileAtAge(
        child.gender,
        metric,
        xMax
      );

      if (metric === "height") {
        yMin = Math.floor(
          Math.min(percentileAtMin?.p3 || 40, percentileAtMax?.p3 || 80) - 5
        );
        yMax = Math.ceil(
          Math.max(percentileAtMin?.p97 || 55, percentileAtMax?.p97 || 110) + 5
        );
      } else if (metric === "weight") {
        yMin = Math.floor(
          Math.min(percentileAtMin?.p3 || 2, percentileAtMax?.p3 || 10) - 1
        );
        yMax = Math.ceil(
          Math.max(percentileAtMin?.p97 || 4.5, percentileAtMax?.p97 || 22) + 2
        );
      } else {
        yMin = Math.floor(
          Math.min(percentileAtMin?.p3 || 30, percentileAtMax?.p3 || 45) - 2
        );
        yMax = Math.ceil(
          Math.max(percentileAtMin?.p97 || 38, percentileAtMax?.p97 || 52) + 2
        );
      }

      const xScale = (age: number) =>
        padding.left + ((age - xMin) / (xMax - xMin)) * chartWidth;
      const yScale = (value: number) =>
        padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

      const percentileLines: { key: string; points: string; color: string; dash?: boolean }[] = [];
      const percentileKeys = ["p3", "p15", "p50", "p85", "p97"] as const;
      const colors = {
        p3: "#f87171",
        p15: "#fbbf24",
        p50: "#22c55e",
        p85: "#fbbf24",
        p97: "#f87171",
      };

      percentileKeys.forEach((key) => {
        const points: string[] = [];
        standardAges.forEach((age) => {
          const pData = getGrowthPercentileAtAge(child.gender, metric, age);
          if (pData) {
            points.push(`${xScale(age)},${yScale(pData[key])}`);
          }
        });
        percentileLines.push({
          key,
          points: points.join(" "),
          color: colors[key],
          dash: key !== "p50",
        });
      });

      const dataPoints = records
        .filter((r) => r[metric] !== undefined)
        .map((record) => {
          const age = calculateAgeMonths(child.birthDate, record.checkupDate);
          const value = record[metric]!;
          const pData = getGrowthPercentileAtAge(child.gender, metric, age);
          const percentile = pData
            ? calculatePercentileValue(value, pData)
            : 50;
          const status = getGrowthStatus(percentile);
          return {
            age,
            value,
            percentile,
            status,
            date: record.checkupDate,
            x: xScale(age),
            y: yScale(value),
          };
        })
        .sort((a, b) => a.age - b.age);

      const dataLinePoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

      const xTicks: number[] = [];
      const tickInterval = xMax <= 12 ? 2 : xMax <= 24 ? 3 : 6;
      for (let i = 0; i <= xMax; i += tickInterval) {
        xTicks.push(i);
      }
      if (xMax % tickInterval !== 0) {
        xTicks.push(xMax);
      }

      const yTicks: number[] = [];
      const yTickCount = 6;
      const yStep = (yMax - yMin) / yTickCount;
      for (let i = 0; i <= yTickCount; i++) {
        yTicks.push(yMin + i * yStep);
      }

      const normalAreaTop = standardAges.map(
        (age) =>
          `${xScale(age)},${yScale(
            getGrowthPercentileAtAge(child.gender, metric, age)?.p97 || yMax
          )}`
      );
      const normalAreaBottom = [...standardAges]
        .reverse()
        .map(
          (age) =>
            `${xScale(age)},${yScale(
              getGrowthPercentileAtAge(child.gender, metric, age)?.p3 || yMin
            )}`
        );
      const normalAreaPath = [...normalAreaTop, ...normalAreaBottom].join(" ");

      return {
        width,
        height,
        padding,
        chartWidth,
        chartHeight,
        xScale,
        yScale,
        xMax,
        xMin,
        yMax,
        yMin,
        xTicks,
        yTicks,
        percentileLines,
        dataPoints,
        dataLinePoints,
        normalAreaPath,
      };
    }, [child, records, metric]);

    const unit = GROWTH_METRIC_UNITS[metric];
    const label = GROWTH_METRIC_LABELS[metric];

    return (
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full h-auto"
          style={{ minWidth: "500px" }}
        >
          <defs>
            <linearGradient id="normalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#86efac" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <polygon
            points={chartData.normalAreaPath}
            fill="url(#normalGradient)"
            opacity={0.5}
          />

          {chartData.yTicks.map((tick, i) => (
            <line
              key={`y-grid-${i}`}
              x1={chartData.padding.left}
              y1={chartData.yScale(tick)}
              x2={chartData.width - chartData.padding.right}
              y2={chartData.yScale(tick)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {chartData.percentileLines.map((line) => (
            <polyline
              key={line.key}
              points={line.points}
              fill="none"
              stroke={line.color}
              strokeWidth={line.key === "p50" ? 2 : 1}
              strokeDasharray={line.dash ? "6 4" : undefined}
              opacity={0.7}
            />
          ))}

          {chartData.dataPoints.length > 1 && (
            <polyline
              points={chartData.dataLinePoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {chartData.dataPoints.map((point, i) => (
            <g key={`point-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.status === "attention" ? 7 : 5}
                fill={point.status === "attention" ? "#ef4444" : "#3b82f6"}
                stroke="white"
                strokeWidth="2"
              />
              <title>
                {`日期: ${point.date}\n年龄: ${point.age}个月\n${label}: ${point.value}${unit}\n百分位: P${point.percentile.toFixed(1)}`}
              </title>
            </g>
          ))}

          <line
            x1={chartData.padding.left}
            y1={chartData.height - chartData.padding.bottom}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.height - chartData.padding.bottom}
            stroke="#d1d5db"
            strokeWidth="2"
          />
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top}
            x2={chartData.padding.left}
            y2={chartData.height - chartData.padding.bottom}
            stroke="#d1d5db"
            strokeWidth="2"
          />

          {chartData.xTicks.map((tick, i) => (
            <g key={`x-tick-${i}`}>
              <line
                x1={chartData.xScale(tick)}
                y1={chartData.height - chartData.padding.bottom}
                x2={chartData.xScale(tick)}
                y2={chartData.height - chartData.padding.bottom + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={chartData.xScale(tick)}
                y={chartData.height - chartData.padding.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {tick}月
              </text>
            </g>
          ))}

          {chartData.yTicks.map((tick, i) => (
            <g key={`y-tick-${i}`}>
              <line
                x1={chartData.padding.left - 5}
                y1={chartData.yScale(tick)}
                x2={chartData.padding.left}
                y2={chartData.yScale(tick)}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={chartData.padding.left - 10}
                y={chartData.yScale(tick) + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          <text
            x={chartData.width / 2}
            y={chartData.height - 15}
            textAnchor="middle"
            fontSize="13"
            fill="#4b5563"
            fontWeight="500"
          >
            年龄 (月)
          </text>

          <text
            x={15}
            y={chartData.height / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#4b5563"
            fontWeight="500"
            transform={`rotate(-90, 15, ${chartData.height / 2})`}
          >
            {label} ({unit})
          </text>

          <text
            x={chartData.width / 2}
            y={20}
            textAnchor="middle"
            fontSize="15"
            fill="#374151"
            fontWeight="600"
          >
            {child.name} - {label}生长曲线
          </text>
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">P50 (中位数)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-amber-400 border-t border-dashed"></div>
            <span className="text-gray-600">P15 / P85</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-400 border-t border-dashed"></div>
            <span className="text-gray-600">P3 / P97</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">测量值</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">需关注</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <span className="font-medium">正常范围：</span>
          百分位在 P3 - P97 之间为正常范围；低于 P3 或高于 P97 建议咨询儿保医生。
        </div>
      </div>
    );
  }
);

GrowthChart.displayName = "GrowthChart";

export default GrowthChart;
