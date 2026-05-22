import { useState, useEffect } from "react";
import styles from "./RecommendedQuestions.module.css";

const PERGUNTAS_PADRAO = [
    "Dados sobre aldeias indígenas no estado de São Paulo",
    "Mostre queimadas na cidade de São Paulo",
    "Mostre dados sobre imóveis do sicar",
    "Mostre dados sobre imóveis do sicar em São Paulo",
    "Mostre dados sobre imóveis do sicar em São Paulo com área maior que 1000m²",
    "Mostre dados sobre imóveis do sicar em São Paulo com área maior que 1000m² e valor menor que R$500.000",
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