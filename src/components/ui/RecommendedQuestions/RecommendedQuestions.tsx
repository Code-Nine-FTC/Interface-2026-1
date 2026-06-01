import { useState, useEffect } from "react";
import styles from "./RecommendedQuestions.module.css";

const PERGUNTAS_PADRAO = [
    // Queimadas e desmatamento
    "Quantos focos de queimada no município de São Paulo?", 
    "Mostre alertas de desmatamento no município de São Paulo",
  
    // Territórios e conservação
    "Quantas terras indígenas existem no estado de São Paulo?",
    "Quantas unidades de conservação há em São Paulo?",
    "Mostre territórios quilombolas no estado de São Paulo",
  
    // CAR / imóveis rurais
    "Quantos imóveis rurais estão cadastrados no CAR em São Paulo?",
    "Mostre imóveis rurais cadastrados no CAR no município de Campinas",
  
    // Relações (mapa + listagens)
    "Quais imóveis rurais tiveram focos de queimada em São Paulo?",
  
    // Consultas por imóvel (quando o usuário tiver um CAR)
    "Quantos focos de queimada há na propriedade com código CAR SP-3500105-268208B9F3A84F508B9C79474EA557EC?",
    "Quais passivos ambientais existem no imóvel rural com código CAR SP-3500709-F80A461130164CF9A0B0FEAB5611FA40?",
  ];

interface RecommendedQuestionsProps {
    onSelect: (pergunta: string) => void;
}

export default function RecommendedQuestions({ onSelect }: RecommendedQuestionsProps) {
    const [perguntas, setPerguntas] = useState<string[]>([]);

    useEffect(() => {

        const shuffled = [...PERGUNTAS_PADRAO].sort(() => 0.5 - Math.random());
        

        const escolhidas = shuffled.slice(0, 3);
        

        escolhidas.sort((a, b) => b.length - a.length);
        
        setPerguntas(escolhidas);
    }, []);


    if (perguntas.length === 0) return null;


    const [maiorPergunta, ...menoresPerguntas] = perguntas;

    return (
        <div className={styles.container}>
            <div className={styles.topRow}>
                <button 
                    className={styles.badge} 
                    onClick={() => onSelect(maiorPergunta)}
                >
                    {maiorPergunta}
                </button>
            </div>

            <div className={styles.bottomRow}>
                {menoresPerguntas.map((pergunta, index) => (
                    <button 
                        key={index} 
                        className={styles.badge} 
                        onClick={() => onSelect(pergunta)}
                    >
                        {pergunta}
                    </button>
                ))}
            </div>
        </div>
    );
}