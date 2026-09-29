import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  Filler,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  Filler
);

interface TrendChartProps {
  labels: string[];
  stressScores: number[];
  hrvValues?: number[];
  sleepHours?: number[];
  restingHeartRates?: number[];
  title?: string;
  height?: number;
}

export const TrendLineChart: React.FC<TrendChartProps> = ({
  labels,
  stressScores,
  title = 'Personnel Stress Score Trend (0-100)',
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Gradient fill under the stress line
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.20)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Stress Score',
            data: stressScores,
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: stressScores.map((s) =>
              s >= 70 ? '#ef4444' : s >= 40 ? '#f59e0b' : '#10b981'
            ),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4.5,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#e2e8f0',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = Number(context.raw);
                const tag = val >= 70 ? 'High Risk' : val >= 40 ? 'Moderate' : 'Optimal';
                return `Stress: ${val}/100 (${tag})`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              stepSize: 20,
              color: '#94a3b8',
              font: { size: 11 },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, stressScores, height]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </h4>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low (0-39)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate (40-69)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High (70-100)
          </span>
        </div>
      </div>
      <div style={{ height: `${height}px` }} className="relative w-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

interface MultiMetricChartProps {
  labels: string[];
  hrv: number[];
  sleep: number[];
  rhr: number[];
  height?: number;
}

export const MultiMetricChart: React.FC<MultiMetricChartProps> = ({
  labels,
  hrv,
  sleep,
  rhr,
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'HRV (ms)',
            data: hrv,
            borderColor: '#06b6d4',
            backgroundColor: '#06b6d4',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y',
            pointRadius: 3,
          },
          {
            label: 'Sleep (hours)',
            data: sleep,
            borderColor: '#8b5cf6',
            backgroundColor: '#8b5cf6',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1',
            pointRadius: 3,
          },
          {
            label: 'Resting HR (bpm)',
            data: rhr,
            borderColor: '#f43f5e',
            backgroundColor: '#f43f5e',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y',
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              color: '#94a3b8',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 8,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
            title: { display: true, text: 'HRV (ms) / Heart Rate (bpm)', color: '#94a3b8', font: { size: 10 } },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#8b5cf6', font: { size: 11 } },
            title: { display: true, text: 'Sleep (hrs)', color: '#8b5cf6', font: { size: 10 } },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, hrv, sleep, rhr, height]);

  return (
    <div style={{ height: `${height}px` }} className="relative w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

interface DistributionBarChartProps {
  lowCount: number;
  moderateCount: number;
  highCount: number;
  height?: number;
}

export const DistributionBarChart: React.FC<DistributionBarChartProps> = ({
  lowCount,
  moderateCount,
  highCount,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Low Risk (0-39)', 'Moderate Risk (40-69)', 'High Risk (70-100)'],
        datasets: [
          {
            label: 'Personnel Count',
            data: [lowCount, moderateCount, highCount],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderRadius: 4,
            barThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { stepSize: 2, color: '#94a3b8', font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [lowCount, moderateCount, highCount, height]);

  return (
    <div style={{ height: `${height}px` }} className="relative w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};
