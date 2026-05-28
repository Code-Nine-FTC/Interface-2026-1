import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTitle } from "../../context/TitleContext";
import { buscarChats, ChatListItem } from "../../services/chatListService";
import { buscarResumoRelatorio, ResumoRelatorioData, buscarHistoricoChat } from "../../services/chatHistoricoService";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./Report.module.css";


const normalizeReportMarkdown = (text: string) => {
    return text
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter(line => line.trim() !== "**")
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

    return segments.filter(segment => segment.text.length > 0);
};

const addWrappedMarkdownText = (
    doc: jsPDF,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    pageHeight: number,
    margin: number,
    lineHeight: number
) => {
    let cursorY = startY;
    const lines = text.replace(/\r\n/g, "\n").split("\n");

    const ensurePageSpace = () => {
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const drawLine = (lineSegments: PdfTextSegment[]) => {
        ensurePageSpace();

        let cursorX = x;
        lineSegments.forEach(segment => {
            doc.setFont("helvetica", segment.bold ? "bold" : "normal");
            doc.text(segment.text, cursorX, cursorY);
            cursorX += doc.getTextWidth(segment.text);
        });

        cursorY += lineHeight;
    };

    lines.forEach(line => {
        const markdownSegments = parseBoldMarkdown(line);
        let currentLine: PdfTextSegment[] = [];
        let currentWidth = 0;

        if (markdownSegments.length === 0) {
            cursorY += lineHeight;
            return;
        }

        markdownSegments.forEach(segment => {
            const parts = segment.text.match(/\s+|\S+/g) || [];

            parts.forEach(part => {
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

export default function Report() {
    const { setTitle } = useTitle();
    const location = useLocation();
    
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string>("");
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [reportData, setReportData] = useState<ResumoRelatorioData | null>(null);
    const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
    
   
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle("Gerador de Relatórios");
        
        buscarChats().then((data) => {
            const ordenados = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
                if (historicoCompleto && historicoCompleto.mapa) {
                    setGeoJsonData(historicoCompleto.mapa);
                } else {
                    setGeoJsonData(null);
                }
            } catch (error) {
                setReportData({
                    resumo: "Não foi possível carregar as informações deste chat.",
                    fontes: []
                });
                setGeoJsonData(null);
            } finally {
                setIsLoading(false);
            }
        };

        carregarDadosRelatorio();
    }, [selectedChatId]);

    
    const handleGenerateReport = async () => {
        if (!reportData) return;
        
        setIsGenerating(true);
        try {
            
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20; 
            const maxWidth = pageWidth - (margin * 2);
            const resumoRelatorio = normalizeReportMarkdown(reportData.resumo);
            let cursorY = margin; 

            // --- CABEÇALHO ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("Relatório de Análise Ambiental", pageWidth / 2, cursorY, { align: "center" });
            cursorY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const chatName = chats.find(c => c.id === selectedChatId)?.title || "Análise Geoespacial";
            doc.text(`Tema: ${chatName}`, pageWidth / 2, cursorY, { align: "center" });
            cursorY += 5;
            
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, cursorY, { align: "center" });
            cursorY += 15;

            doc.setDrawColor(200, 200, 200);
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 15;

            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Síntese das Conclusões", margin, cursorY);
            cursorY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10); 
            
            
            cursorY = addWrappedMarkdownText(doc, resumoRelatorio, margin, cursorY, maxWidth, pageHeight, margin, 5);
            cursorY += 10;

         
            if (geoJsonData && mapRef.current) {
                
                if (cursorY + 90 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.text("Mapeamento Geoespacial", margin, cursorY);
                cursorY += 8;

                
                const canvas = await html2canvas(mapRef.current, { 
                    useCORS: true, 
                    scale: 2 
                });
                const imgData = canvas.toDataURL("image/png");
                
                
                const imgWidth = maxWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.addImage(imgData, "PNG", margin, cursorY, imgWidth, imgHeight);
                cursorY += imgHeight + 15;
            }

            // --- FONTES ---
            if (reportData.fontes && reportData.fontes.length > 0) {
                if (cursorY + 30 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text("Fontes oficiais consultadas:", margin, cursorY);
                cursorY += 8;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9); 
                
                reportData.fontes.forEach(fonte => {
                    
                    if (cursorY > pageHeight - margin) {
                        doc.addPage();
                        cursorY = margin;
                    }
                    
                    const orgaoText = fonte.orgao ? `(${fonte.orgao})` : "";
                    const textoFonte = `• ${fonte.nome} ${orgaoText}`;
                    
                    const linhasFonte = doc.splitTextToSize(textoFonte, maxWidth);
                    doc.text(linhasFonte, margin, cursorY);
                    cursorY += (linhasFonte.length * 4); 

                    if (fonte.url) {
                        doc.setTextColor(37, 99, 235); 
                        doc.textWithLink("Acessar base de dados", margin + 5, cursorY, { url: fonte.url });
                        doc.setTextColor(0, 0, 0); 
                        cursorY += 5;
                    }
                    cursorY += 3; 
                });
            }

           
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Gerado automaticamente por Atlas NLP.", pageWidth / 2, pageHeight - 10, { align: "center" });

            doc.save(`Relatorio_${chatName.replace(/\s+/g, '_')}.pdf`);
            
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                    <label htmlFor="chatSelect" style={{ marginRight: '10px', fontWeight: 'bold' }}>Selecione o Chat:</label>
                    <select 
                        id="chatSelect"
                        value={selectedChatId}
                        onChange={(e) => setSelectedChatId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '300px' }}
                        disabled={isLoading || chats.length === 0}
                    >
                        <option value="" disabled>-- Selecione um chat --</option>
                        {chats.map(chat => (
                            <option key={chat.id} value={chat.id}>
                                {chat.title} ({new Date(chat.created_at).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    className={styles.refreshButton} 
                    onClick={() => {
                        const current = selectedChatId;
                        setSelectedChatId("");
                        setTimeout(() => setSelectedChatId(current), 5);
                    }}
                    title="Atualizar dados"
                    disabled={isLoading || !selectedChatId}
                >
                    
                </button>
            </header>

            <main className={styles.mainPanel}>
                {isLoading ? (
                    <div className={styles.reportDocument}>
                        <div className={styles.skeletonTitle} style={{ width: "40%" }}></div>
                        <div className={styles.skeletonBox} style={{ height: "200px", margin: "20px 0" }}></div>
                        <div className={styles.skeletonLine} style={{ width: "95%" }}></div>
                        <div className={styles.skeletonLine} style={{ width: "80%" }}></div>
                    </div>
                ) : !reportData || !reportData.resumo ? (
                    <div className={styles.reportDocument}>
                        <p style={{ textAlign: "center", color: "#666" }}>
                            Nenhum dado encontrado ou nenhum chat selecionado.
                        </p>
                    </div>
                ) : (
                    /* MOLDE HTML (APENAS PARA VISUALIZAÇÃO DO USUÁRIO) */
                    <div className={styles.reportDocument}>
                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                            <h2 style={{ color: "#1e293b", marginBottom: "5px", fontSize: "22px" }}>Relatório de Análise Ambiental</h2>
                            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                                <strong>Tema:</strong> {chats.find(c => c.id === selectedChatId)?.title || "Análise Geoespacial"}
                            </p>
                        </div>
                        
                        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", marginBottom: "20px" }} />

                        <div style={{ marginBottom: "25px" }}>
                            <h3 style={{ color: "#1e293b", fontSize: "16px", marginBottom: "10px", borderLeft: "4px solid #3b82f6", paddingLeft: "8px" }}>
                                Síntese das Conclusões
                            </h3>
                            <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                                <ReactMarkdown>
                                    {normalizeReportMarkdown(reportData.resumo)}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {geoJsonData && (
                            <div style={{ marginBottom: "25px" }}>
                                <h3 style={{ color: "#1e293b", fontSize: "16px", marginBottom: "10px", borderLeft: "4px solid #10b981", paddingLeft: "8px" }}>
                                    Mapeamento Geoespacial
                                </h3>
                                {}
                                <div className={styles.mapWrapper} ref={mapRef}>
                                    <MapComponent 
                                        poluicaoLocalizacoes={[]}
                                        queimadasLocalizacoes={[]}
                                        quilombosLocalizacoes={[]}
                                        geoJsonData={geoJsonData}
                                        renderKey={selectedChatId}
                                    />
                                </div>
                            </div>
                        )}

                        {reportData.fontes && reportData.fontes.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <h3 style={{ color: "#1e293b", fontSize: "14px", marginBottom: "8px" }}>📚 Fontes oficiais consultadas:</h3>
                                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#475569" }}>
                                    {reportData.fontes.map((fonte, index) => (
                                        <li key={index} style={{ marginBottom: "5px" }}>
                                            <strong>{fonte.nome}</strong> {fonte.orgao ? `(${fonte.orgao})` : ""}
                                            {fonte.url && (
                                                <span style={{ marginLeft: "5px" }}>
                                                    - <a href={fonte.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>Acessar base de dados</a>
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    className={styles.generateButton} 
                    onClick={handleGenerateReport}
                    disabled={isGenerating || isLoading || !reportData?.resumo}
                >
                    {isGenerating ? "Processando Múltiplas Páginas..." : "Baixar como PDF"}
                </button>
            </main>
        </div>
    );
}
