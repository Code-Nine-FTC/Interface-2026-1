import { useMemo, useState } from "react";
import styles from "./Chart.module.css";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
    LineChart, Line, AreaChart, Area, ResponsiveContainer, Legend
} from "recharts";
import type { RegionData } from "../RegionCard/types";
import { buildChartData, type ChartDataItem } from "./chartData";

type Props = {
    region?: RegionData;
    data?: ChartDataItem[];
    loading?: boolean;
    title?: string;
};

type ChartType = "bar" | "pie" | "line" | "area";

const chartOptions = [
    { label: "Gráfico de Barra", value: "bar" },
    { label: "Gráfico de Pizza", value: "pie" },
    { label: "Gráfico de Linha", value: "line" },
    { label: "Gráfico de Área", value: "area" },
];

const PIE_COLORS = [
    "var(--orange-main)",
    "#ffb74d",
    "#ff9800",
    "#ffe0b2",
    "#f57c00",
    "#ffcc80"
];

export default function Chart({ region, data: externalData, loading, title = "Métricas Detalhadas" }: Props) {
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = chartOptions.find((o) => o.value === chartType)?.label;

    const chartData = useMemo(() => {
        if (region) return buildChartData(region);
        if (externalData) return externalData;
        return [];
    }, [externalData, region]);

    if (loading) return <div className={styles.loading}>Carregando dados...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>{title}</span>

                <div className={styles.dropdownWrapper}>
                    <div className={styles.dropdownButton} onClick={() => setIsOpen(!isOpen)}>
                        {selectedLabel}
                        <span className={isOpen ? styles.arrowUp : styles.arrowDown}>▼</span>
                    </div>

                    {isOpen && (
                        <div className={styles.dropdownList}>
                            {chartOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={styles.item}
                                    onClick={() => {
                                        setChartType(opt.value as ChartType);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} dataKey="name" interval={0} />
                            <YAxis tick={{ fill: "var(--text-secondary)" }} />
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar name="Quantidade" dataKey="value" fill="var(--orange-main)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : chartType === "line" ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} interval={0} />
                            <YAxis tick={{ fill: "var(--text-secondary)" }} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36}/>
                            <Line name="Tendência" type="monotone" dataKey="value" stroke="var(--orange-main)" strokeWidth={3} dot={{ r: 6 }} />
                        </LineChart>
                    ) : chartType === "area" ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} interval={0} />
                            <YAxis tick={{ fill: "var(--text-secondary)" }} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36}/>
                            <Area name="Densidade" type="monotone" dataKey="value" fill="var(--orange-main)" stroke="var(--orange-main)" fillOpacity={0.3} />
                        </AreaChart>
                    ) : (
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                        </PieChart>
                    )}
                </ResponsiveContainer>
                
                {chartType === "pie" && (
                    <div className={styles.legend}>
                        {chartData.map((entry, index) => (
                            <div key={`legend-${index}`} className={styles.legendItem}>
                                <div 
                                    className={styles.colorBox} 
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                                />
                                <span style={{ fontSize: '0.75rem' }}>
                                    {entry.name}: <strong>{entry.value}</strong>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}