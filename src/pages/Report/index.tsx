import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTitle } from "../../context/TitleContext";
import { buscarChats, ChatListItem } from "../../services/chatListService";
import { buscarResumoRelatorio, ResumoRelatorioData, buscarHistoricoChat } from "../../services/chatHistoricoService";
import type { Mapa } from "../../services/chatService";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
    computeGeoStats,
    formatHa,
    labelTipo,
    METHODOLOGY_TEXT,
    type GeoReportStats,
} from "./reportUtils";
import styles from "./Report.module.css";

const MAP_CAPTURE_DELAY_MS = 900;

const normalizeReportMarkdown = (text: string) => {
    return text
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter((line) => line.trim() !== "**")
        .join("\n")
        .trim();
};

type PdfTextSegment = {
    text: string;
    bold: boolean;
};

const parseBoldMarkdown = (text: string): PdfTextSegment[] => {
    const segments: PdfTextSegment[] = [];
    let cursor = 0;

    while (cursor < text.length) {
        const start = text.indexOf("**", cursor);

        if (start === -1) {
            segments.push({ text: text.slice(cursor), bold: false });
            break;
        }

        if (start > cursor) {
            segments.push({ text: text.slice(cursor, start), bold: false });
        }

        const end = text.indexOf("**", start + 2);

        if (end === -1) {
            cursor = start + 2;
            continue;
        }

        const boldText = text.slice(start + 2, end);
        if (boldText) {
            segments.push({ text: boldText, bold: true });
        }

        cursor = end + 2;
    }

    return segments.filter((segment) => segment.text.length > 0);
};

const addWrappedMarkdownText = (
    doc: jsPDF,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    pageHeight: number,
    margin: number,
    lineHeight: number,
    footerReserve = 18
) => {
    let cursorY = startY;
    const lines = text.replace(/\r\n/g, "\n").split("\n");

    const ensurePageSpace = () => {
        if (cursorY > pageHeight - margin - footerReserve) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const drawLine = (lineSegments: PdfTextSegment[]) => {
        ensurePageSpace();

        let cursorX = x;
        lineSegments.forEach((segment) => {
            doc.setFont("helvetica", segment.bold ? "bold" : "normal");
            doc.text(segment.text, cursorX, cursorY);
            cursorX += doc.getTextWidth(segment.text);
        });

        cursorY += lineHeight;
    };

    lines.forEach((line) => {
        const markdownSegments = parseBoldMarkdown(line);
        let currentLine: PdfTextSegment[] = [];
        let currentWidth = 0;

        if (markdownSegments.length === 0) {
            cursorY += lineHeight;
            return;
        }

        markdownSegments.forEach((segment) => {
            const parts = segment.text.match(/\s+|\S+/g) || [];

            parts.forEach((part) => {
                if (part.trim() === "" && currentLine.length === 0) {
                    return;
                }

                doc.setFont("helvetica", segment.bold ? "bold" : "normal");
                const partWidth = doc.getTextWidth(part);

                if (currentWidth + partWidth > maxWidth && currentLine.length > 0 && part.trim() !== "") {
                    drawLine(currentLine);
                    currentLine = [];
                    currentWidth = 0;
                }

                currentLine.push({ text: part, bold: segment.bold });
                currentWidth += partWidth;
            });
        });

        if (currentLine.length > 0) {
            drawLine(currentLine);
        }
    });

    doc.setFont("helvetica", "normal");

    return cursorY;
};

type PdfLayout = {
    doc: jsPDF;
    margin: number;
    maxWidth: number;
    pageWidth: number;
    pageHeight: number;
    footerReserve: number;
};

function ensurePdfSpace(layout: PdfLayout, cursorY: number, needed: number): number {
    if (cursorY + needed > layout.pageHeight - layout.margin - layout.footerReserve) {
        layout.doc.addPage();
        return layout.margin;
    }
    return cursorY;
}

function pdfSectionTitle(layout: PdfLayout, title: string, cursorY: number): number {
    cursorY = ensurePdfSpace(layout, cursorY, 14);
    layout.doc.setFont("helvetica", "bold");
    layout.doc.setFontSize(13);
    layout.doc.setTextColor(30, 41, 59);
    layout.doc.text(title, layout.margin, cursorY);
    return cursorY + 8;
}

function pdfBodyText(layout: PdfLayout, text: string, cursorY: number, fontSize = 10): number {
    layout.doc.setFont("helvetica", "normal");
    layout.doc.setFontSize(fontSize);
    layout.doc.setTextColor(51, 65, 85);
    const lines = layout.doc.splitTextToSize(text, layout.maxWidth);
    lines.forEach((line: string) => {
        cursorY = ensurePdfSpace(layout, cursorY, 6);
        layout.doc.text(line, layout.margin, cursorY);
        cursorY += fontSize === 9 ? 4.2 : 5;
    });
    return cursorY;
}

function pdfBulletLines(layout: PdfLayout, lines: string[], cursorY: number): number {
    lines.forEach((line) => {
        cursorY = ensurePdfSpace(layout, cursorY, 6);
        const wrapped = layout.doc.splitTextToSize(`• ${line}`, layout.maxWidth);
        layout.doc.text(wrapped, layout.margin, cursorY);
        cursorY += wrapped.length * 4.5;
    });
    return cursorY + 4;
}

function addPdfPageFooters(doc: jsPDF, pageWidth: number, pageHeight: number, chatRef: string) {
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Atlas NLP · Página ${page} de ${totalPages} · Ref. ${chatRef}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: "center" }
        );
    }
}

function addGeoStatsToPdf(layout: PdfLayout, stats: GeoReportStats, cursorY: number): number {
    cursorY = pdfSectionTitle(layout, "Indicadores do conjunto", cursorY);

    const kpiLines = [
        `Registros no mapa: ${stats.total.toLocaleString("pt-BR")}`,
        `Com área informada: ${stats.comArea.toLocaleString("pt-BR")}`,
        `Área total: ${formatHa(stats.areaTotalHa)} ha`,
        `Área média: ${formatHa(stats.areaMediaHa)} ha`,
        `Maior área: ${formatHa(stats.areaMaxHa)} ha`,
        `Menor área: ${formatHa(stats.areaMinHa)} ha`,
    ];

    cursorY = pdfBulletLines(layout, kpiLines, cursorY);

    const tipoEntries = Object.entries(stats.porTipo);
    if (tipoEntries.length > 0) {
        cursorY = ensurePdfSpace(layout, cursorY, 8);
        layout.doc.setFont("helvetica", "bold");
        layout.doc.setFontSize(10);
        layout.doc.setTextColor(30, 41, 59);
        layout.doc.text("Distribuição por tipo", layout.margin, cursorY);
        cursorY += 6;

        const tipoLines = tipoEntries.map(
            ([tipo, count]) => `${labelTipo(tipo)}: ${count.toLocaleString("pt-BR")}`
        );
        cursorY = pdfBulletLines(layout, tipoLines, cursorY);
    }

    return cursorY;
}

function addTopAreasToPdf(layout: PdfLayout, stats: GeoReportStats, cursorY: number): number {
    if (stats.top10.length === 0) return cursorY;

    cursorY = pdfSectionTitle(layout, "Maiores áreas no conjunto", cursorY);

    const lines = stats.top10.map((row, index) => {
        const area = row.areaHa > 0 ? `${formatHa(row.areaHa)} ha` : "área não informada";
        const local = row.municipio !== "—" ? ` · ${row.municipio}` : "";
        return `${index + 1}. ${area} — ${row.nome}${local}`;
    });

    return pdfBulletLines(layout, lines, cursorY);
}

function KpiGrid({ stats }: { stats: GeoReportStats }) {
    const items = [
        { label: "Registros no mapa", value: stats.total.toLocaleString("pt-BR") },
        { label: "Área total", value: `${formatHa(stats.areaTotalHa)} ha` },
        { label: "Área média", value: `${formatHa(stats.areaMediaHa)} ha` },
        { label: "Maior área", value: `${formatHa(stats.areaMaxHa)} ha` },
    ];

    return (
        <div className={styles.kpiGrid}>
            {items.map((item) => (
                <div key={item.label} className={styles.kpiCard}>
                    <span className={styles.kpiValue}>{item.value}</span>
                    <span className={styles.kpiLabel}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

function TopAreasList({ stats, total }: { stats: GeoReportStats; total: number }) {
    if (stats.top10.length === 0) return null;

    return (
        <>
            <ol className={styles.topAreasList}>
                {stats.top10.map((row, index) => (
                    <li key={`${row.codigoCar}-${index}`} className={styles.topAreaItem}>
                        <span className={styles.topAreaRank}>{index + 1}</span>
                        <div className={styles.topAreaContent}>
                            <span className={styles.topAreaArea}>
                                {row.areaHa > 0 ? `${formatHa(row.areaHa)} ha` : "Área não informada"}
                            </span>
                            <span className={styles.topAreaMeta}>
                                {row.nome}
                                {row.municipio !== "—" ? ` · ${row.municipio}` : ""}
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
            {total > stats.top10.length && (
                <p className={styles.topAreasNote}>
                    Exibindo os {stats.top10.length} maiores entre {total.toLocaleString("pt-BR")} registros do mapa.
                </p>
            )}
        </>
    );
}

function MapLegend({ porTipo }: { porTipo: Record<string, number> }) {
    const entries = Object.entries(porTipo);
    if (entries.length === 0) {
        return (
            <ul className={styles.mapLegend}>
                <li>
                    <span className={styles.legendSwatch} style={{ background: "#f39c12" }} />
                    Geometrias da consulta
                </li>
            </ul>
        );
    }

    return (
        <ul className={styles.mapLegend}>
            {entries.map(([tipo, count]) => (
                <li key={tipo}>
                    <span className={styles.legendSwatch} style={{ background: "#52b788" }} />
                    {labelTipo(tipo)} ({count})
                </li>
            ))}
        </ul>
    );
}

export default function Report() {
    const { setTitle } = useTitle();
    const location = useLocation();

    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string>("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [reportData, setReportData] = useState<ResumoRelatorioData | null>(null);
    const [geoJsonData, setGeoJsonData] = useState<Mapa | null>(null);
    const [perguntaOriginal, setPerguntaOriginal] = useState<string | null>(null);
    const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const chatDropdownRef = useRef<HTMLDivElement>(null);

    const geoStats = useMemo(
        () => (geoJsonData?.features?.length ? computeGeoStats(geoJsonData) : null),
        [geoJsonData]
    );

    useEffect(() => {
        setTitle("Gerador de Relatórios");

        buscarChats().then((data) => {
            const ordenados = [...data].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setChats(ordenados);

            const params = new URLSearchParams(location.search);
            const urlChatId = params.get("chat_id");

            if (urlChatId) {
                setSelectedChatId(urlChatId);
            } else if (ordenados.length > 0) {
                setSelectedChatId(ordenados[0].id);
            } else {
                setIsLoading(false);
            }
        });
    }, [setTitle, location.search]);

    useEffect(() => {
        if (!selectedChatId) return;

        const carregarDadosRelatorio = async () => {
            setIsLoading(true);
            try {
                const dados = await buscarResumoRelatorio(selectedChatId);
                setReportData(dados);

                const historicoCompleto = await buscarHistoricoChat(selectedChatId);
                setGeoJsonData(historicoCompleto.mapa ?? null);

                const primeiraPergunta = historicoCompleto.mensagens?.find((m) => m.pergunta)?.pergunta;
                setPerguntaOriginal(primeiraPergunta ?? null);
            } catch {
                setReportData({
                    resumo: "Não foi possível carregar as informações deste chat.",
                    fontes: [],
                });
                setGeoJsonData(null);
                setPerguntaOriginal(null);
            } finally {
                setIsLoading(false);
            }
        };

        carregarDadosRelatorio();
    }, [selectedChatId]);

    useEffect(() => {
        if (!isChatMenuOpen) return;

        const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
            if (!chatDropdownRef.current?.contains(event.target as Node)) {
                setIsChatMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [isChatMenuOpen]);

    const handleGenerateReport = async () => {
        if (!reportData) return;

        setIsGenerating(true);
        try {
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - margin * 2;
            const footerReserve = 18;
            const layout: PdfLayout = { doc, margin, maxWidth, pageWidth, pageHeight, footerReserve };

            const resumoRelatorio = normalizeReportMarkdown(reportData.resumo);
            const chatName = chats.find((c) => c.id === selectedChatId)?.title || "Análise Geoespacial";
            const chatRef = selectedChatId.slice(0, 8);

            let cursorY = margin;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(30, 41, 59);
            doc.text("Relatório de Análise Ambiental", pageWidth / 2, cursorY, { align: "center" });
            cursorY += 9;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Tema: ${chatName}`, pageWidth / 2, cursorY, { align: "center" });
            cursorY += 5;
            doc.text(
                `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
                pageWidth / 2,
                cursorY,
                { align: "center" }
            );
            cursorY += 5;
            doc.text(`Referência: ${chatRef}`, pageWidth / 2, cursorY, { align: "center" });
            cursorY += 12;

            doc.setDrawColor(226, 232, 240);
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 12;

            if (perguntaOriginal) {
                cursorY = pdfSectionTitle(layout, "Pergunta analisada", cursorY);
                cursorY = pdfBodyText(layout, perguntaOriginal, cursorY);
                cursorY += 6;
            }

            cursorY = pdfSectionTitle(layout, "Síntese das conclusões", cursorY);
            cursorY = addWrappedMarkdownText(
                doc,
                resumoRelatorio,
                margin,
                cursorY,
                maxWidth,
                pageHeight,
                margin,
                5,
                footerReserve
            );
            cursorY += 8;

            if (geoStats) {
                cursorY = addGeoStatsToPdf(layout, geoStats, cursorY);
                cursorY = addTopAreasToPdf(layout, geoStats, cursorY);
            }

            if (geoJsonData && mapRef.current) {
                cursorY = ensurePdfSpace(layout, cursorY, 100);
                cursorY = pdfSectionTitle(layout, "Mapeamento geoespacial", cursorY);

                await new Promise((resolve) => setTimeout(resolve, MAP_CAPTURE_DELAY_MS));

                const canvas = await html2canvas(mapRef.current, {
                    useCORS: true,
                    allowTaint: true,
                    scale: 2,
                    backgroundColor: "#ffffff",
                });
                const imgData = canvas.toDataURL("image/png");
                const imgWidth = maxWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxImgHeight = pageHeight - margin * 2 - footerReserve - 20;

                const finalHeight = Math.min(imgHeight, maxImgHeight);
                const finalWidth = (finalHeight / imgHeight) * imgWidth;

                cursorY = ensurePdfSpace(layout, cursorY, finalHeight + 4);
                doc.addImage(imgData, "PNG", margin, cursorY, finalWidth, finalHeight);
                cursorY += finalHeight + 10;
            } else if (!geoJsonData) {
                cursorY = pdfSectionTitle(layout, "Mapeamento geoespacial", cursorY);
                cursorY = pdfBodyText(
                    layout,
                    "Não há camada geoespacial associada a este chat na exportação.",
                    cursorY
                );
                cursorY += 6;
            }

            cursorY = pdfSectionTitle(layout, "Metodologia e limitações", cursorY);
            cursorY = pdfBodyText(layout, METHODOLOGY_TEXT, cursorY, 9);
            cursorY += 6;

            if (reportData.fontes && reportData.fontes.length > 0) {
                cursorY = pdfSectionTitle(layout, "Fontes oficiais consultadas", cursorY);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);

                reportData.fontes.forEach((fonte) => {
                    cursorY = ensurePdfSpace(layout, cursorY, 12);
                    const orgaoText = fonte.orgao ? ` (${fonte.orgao})` : "";
                    const textoFonte = `• ${fonte.nome}${orgaoText}`;
                    const linhasFonte = doc.splitTextToSize(textoFonte, maxWidth);
                    doc.setTextColor(51, 65, 85);
                    doc.text(linhasFonte, margin, cursorY);
                    cursorY += linhasFonte.length * 4;

                    if (fonte.url) {
                        cursorY = ensurePdfSpace(layout, cursorY, 6);
                        doc.setTextColor(37, 99, 235);
                        doc.textWithLink("Acessar base de dados", margin + 4, cursorY, { url: fonte.url });
                        doc.setTextColor(51, 65, 85);
                        cursorY += 5;
                    }
                    cursorY += 2;
                });
            }

            addPdfPageFooters(doc, pageWidth, pageHeight, chatRef);
            doc.save(`Relatorio_${chatName.replace(/\s+/g, "_")}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedChat = chats.find((chat) => chat.id === selectedChatId);
    const isChatSelectorDisabled = isLoading || chats.length === 0;
    const chatTitle = chats.find((c) => c.id === selectedChatId)?.title || "Análise Geoespacial";
    const generatedAt = new Date().toLocaleString("pt-BR");

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.chatSelector}>
                    <label htmlFor="chatSelect" className={styles.chatLabel}>
                        Selecione o Chat:
                    </label>
                    <div
                        className={styles.chatSelectWrap}
                        ref={chatDropdownRef}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setIsChatMenuOpen(false);
                            }
                        }}
                    >
                        <button
                            id="chatSelect"
                            type="button"
                            className={styles.chatSelect}
                            onClick={() => setIsChatMenuOpen((open) => !open)}
                            disabled={isChatSelectorDisabled}
                            aria-haspopup="listbox"
                            aria-expanded={isChatMenuOpen}
                        >
                            <span className={styles.chatSelectText}>
                                {selectedChat
                                    ? `${selectedChat.title} (${new Date(selectedChat.created_at).toLocaleDateString()})`
                                    : "-- Selecione um chat --"}
                            </span>
                        </button>

                        {isChatMenuOpen && !isChatSelectorDisabled && (
                            <div className={styles.chatOptions} role="listbox" aria-label="Chats disponiveis">
                                {chats.map((chat) => {
                                    const isSelected = chat.id === selectedChatId;

                                    return (
                                        <button
                                            key={chat.id}
                                            type="button"
                                            className={`${styles.chatOption} ${isSelected ? styles.chatOptionActive : ""}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            title={chat.title}
                                            onClick={() => {
                                                setSelectedChatId(chat.id);
                                                setIsChatMenuOpen(false);
                                            }}
                                        >
                                            <span className={styles.chatOptionTitle}>{chat.title}</span>
                                            <span className={styles.chatOptionDate}>
                                                {new Date(chat.created_at).toLocaleDateString()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.mainPanel}>
                {isLoading ? (
                    <div className={styles.reportDocument}>
                        <div className={styles.skeletonTitle} style={{ width: "40%" }} />
                        <div className={styles.skeletonBox} style={{ height: "200px", margin: "20px 0" }} />
                        <div className={styles.skeletonLine} style={{ width: "95%" }} />
                        <div className={styles.skeletonLine} style={{ width: "80%" }} />
                    </div>
                ) : !reportData || !reportData.resumo ? (
                    <div className={styles.reportDocument}>
                        <p className={styles.emptyState}>Nenhum dado encontrado ou nenhum chat selecionado.</p>
                    </div>
                ) : (
                    <div className={styles.reportDocument}>
                        <div className={styles.documentHeader}>
                            <h2 className={styles.documentTitle}>Relatório de Análise Ambiental</h2>
                            <p className={styles.documentMeta}>
                                <strong>Tema:</strong> {chatTitle}
                            </p>
                            <p className={styles.documentMeta}>
                                <strong>Gerado em:</strong> {generatedAt}
                            </p>
                            {selectedChatId && (
                                <p className={styles.documentMeta}>
                                    <strong>Referência:</strong> {selectedChatId.slice(0, 8)}
                                </p>
                            )}
                        </div>

                        <hr className={styles.documentDivider} />

                        {perguntaOriginal && (
                            <div className={styles.reportSection}>
                                <h3 className={`${styles.sectionTitle} ${styles.sectionTitlePurple}`}>
                                    Pergunta analisada
                                </h3>
                                <p className={styles.questionText}>{perguntaOriginal}</p>
                            </div>
                        )}

                        <div className={styles.reportSection}>
                            <h3 className={`${styles.sectionTitle} ${styles.sectionTitleBlue}`}>
                                Síntese das conclusões
                            </h3>
                            <div className={styles.reportMarkdown}>
                                <ReactMarkdown>{normalizeReportMarkdown(reportData.resumo)}</ReactMarkdown>
                            </div>
                        </div>

                        {geoStats && (
                            <div className={styles.reportSection}>
                                <h3 className={`${styles.sectionTitle} ${styles.sectionTitleOrange}`}>
                                    Indicadores do conjunto
                                </h3>
                                <KpiGrid stats={geoStats} />
                                {Object.keys(geoStats.porTipo).length > 0 && (
                                    <ul className={styles.tipoList}>
                                        {Object.entries(geoStats.porTipo).map(([tipo, count]) => (
                                            <li key={tipo}>
                                                <strong>{labelTipo(tipo)}:</strong>{" "}
                                                {count.toLocaleString("pt-BR")} registro(s)
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {geoStats && geoStats.top10.length > 0 && (
                            <div className={styles.reportSection}>
                                <h3 className={`${styles.sectionTitle} ${styles.sectionTitleTeal}`}>
                                    Maiores áreas no conjunto
                                </h3>
                                <TopAreasList stats={geoStats} total={geoStats.total} />
                            </div>
                        )}

                        {geoJsonData ? (
                            <div className={styles.reportSection}>
                                <h3 className={`${styles.sectionTitle} ${styles.sectionTitleGreen}`}>
                                    Mapeamento geoespacial
                                </h3>
                                <div className={styles.mapCapture} ref={mapRef}>
                                    <div className={styles.mapWrapper}>
                                        <MapComponent
                                            poluicaoLocalizacoes={[]}
                                            queimadasLocalizacoes={[]}
                                            quilombosLocalizacoes={[]}
                                            geoJsonData={geoJsonData}
                                            renderKey={selectedChatId}
                                        />
                                    </div>
                                    <MapLegend porTipo={geoStats?.porTipo ?? {}} />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.reportSection}>
                                <h3 className={`${styles.sectionTitle} ${styles.sectionTitleGreen}`}>
                                    Mapeamento geoespacial
                                </h3>
                                <p className={styles.noMapNote}>
                                    Não há camada geoespacial associada a este chat.
                                </p>
                            </div>
                        )}

                        <div className={styles.reportSection}>
                            <h3 className={`${styles.sectionTitle} ${styles.sectionTitleGray}`}>
                                Metodologia e limitações
                            </h3>
                            <p className={styles.methodology}>{METHODOLOGY_TEXT}</p>
                        </div>

                        {reportData.fontes && reportData.fontes.length > 0 && (
                            <div className={styles.sourcesSection}>
                                <h3 className={styles.sourcesTitle}>Fontes oficiais consultadas</h3>
                                <ul className={styles.sourcesList}>
                                    {reportData.fontes.map((fonte, index) => (
                                        <li key={index}>
                                            <strong>{fonte.nome}</strong>
                                            {fonte.orgao ? ` (${fonte.orgao})` : ""}
                                            {fonte.url && (
                                                <span className={styles.sourceLinkWrap}>
                                                    {" "}
                                                    —{" "}
                                                    <a href={fonte.url} target="_blank" rel="noreferrer">
                                                        Acessar base de dados
                                                    </a>
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className={styles.documentFooter}>Gerado automaticamente por Atlas NLP.</p>
                    </div>
                )}

                <button
                    className={styles.generateButton}
                    onClick={handleGenerateReport}
                    disabled={isGenerating || isLoading || !reportData?.resumo}
                >
                    {isGenerating ? "Gerando PDF..." : "Baixar como PDF"}
                </button>
            </main>
        </div>
    );
}
