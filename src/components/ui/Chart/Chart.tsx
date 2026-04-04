import { useMemo, useState } from "react";
import styles from "./Chart.module.css";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    ResponsiveContainer,
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
    { label: "Barra", value: "bar" },
    { label: "Pizza", value: "pie" },
    { label: "Linha", value: "line" },
    { label: "Área", value: "area" },
];

export default function Chart({ region, data: externalData, loading, title = "Quantidade por tipo de dado:" }: Props) {
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel =
        chartOptions.find((o) => o.value === chartType)?.label;

    if (loading) {
        return <div style={{ color: "var(--text-secondary)" }}>Carregando...</div>;
    }

    const chartData = useMemo(() => {
        if (externalData) return externalData;
        if (region) return buildChartData(region);
        return [];
    }, [externalData, region]);

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>
                    {title}
                </span>

                <div className={styles.dropdownWrapper}>
                    <div
                        className={styles.dropdownButton}
                        onClick={() => setIsOpen((prev) => !prev)}
                    >
                        {selectedLabel}
                        <span>▼</span>
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

            <div className={styles.chartWrapper}>
                {chartType !== "pie" && (
                    <ResponsiveContainer width="100%" height={300}>
                        <>
                            {chartType === "bar" && (
                                <BarChart data={chartData}>
                                    <XAxis tick={{ fill: "var(--text-secondary)" }} dataKey="name" />
                                    <YAxis tick={{ fill: "var(--text-secondary)" }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="var(--orange-main)" />
                                </BarChart>
                            )}

                            {chartType === "line" && (
                                <LineChart data={chartData}>
                                    <XAxis tick={{ fill: "var(--text-secondary)" }} dataKey="name" />
                                    <YAxis tick={{ fill: "var(--text-secondary)" }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--orange-main)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            )}

                            {chartType === "area" && (
                                <AreaChart data={chartData}>
                                    <XAxis tick={{ fill: "var(--text-secondary)" }} dataKey="name" />
                                    <YAxis tick={{ fill: "var(--text-secondary)" }} />
                                    <Tooltip />
                                    <Area
                                        dataKey="value"
                                        fill="var(--orange-main)"
                                        stroke="var(--orange-main)"
                                    />
                                </AreaChart>
                            )}
                        </>
                    </ResponsiveContainer>
                )}

                {chartType === "pie" && (
                    <div className={styles.pieContainer}>
                        <ResponsiveContainer width="60%" height={300}>
                            <PieChart>
                                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100}>
                                    {chartData.map((_, index) => (
                                        <Cell key={index} fill="var(--orange-main)" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className={styles.legend}>
                            {chartData.map((item, index) => (
                                <div key={index} className={styles.legendItem}>
                                    <div className={styles.colorBox} />
                                    {item.name} ({item.value})
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}