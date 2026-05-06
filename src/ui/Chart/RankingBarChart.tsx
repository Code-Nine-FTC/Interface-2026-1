import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

export interface RankingItem {
  municipio: string;
  valor: number;
  unidade: string;
  percentual_do_estado: number;
}

interface RankingBarChartProps {
  title: string;
  data: RankingItem[];
  color?: string;
}

export function RankingBarChart({ title, data, color = '#1976d2' }: RankingBarChartProps) {
  const labels = data.map((d) => d.municipio);
  const values = data.map((d) => d.valor);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: color,
      },
    ],
  };

  const options: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const idx = context.dataIndex;
            const unit = data[idx]?.unidade || '';
            return `${context.parsed.y} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Município' } },
      y: { title: { display: true, text: data[0]?.unidade || '' } },
    },
  };

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>{title}</h4>
      <Bar data={chartData} options={options} />
    </div>
  );
}
