import MapComponent from '../../components/ui/MapComponent/MapComponent';
import styles from './Dashboard.module.css';



const poluicaoLocalizacoes = [
  { lat: -23.5505, lng: -46.6333, nome: 'São Paulo (Centro)', indice: 67 },
  { lat: -23.4729, lng: -46.5541, nome: 'Zona Leste', indice: 72 },
  { lat: -23.5505, lng: -46.7667, nome: 'Zona Oeste', indice: 58 },
  { lat: -23.6432, lng: -46.7583, nome: 'Guarulhos', indice: 65 },
  { lat: -23.8103, lng: -46.3078, nome: 'São Bernardo do Campo', indice: 71 },
];

const queimadasLocalizacoes = [
  { lat: -21.9757, lng: -48.5805, nome: 'Ribeirão Preto (23 casos)', casos: 23 },
  { lat: -22.2237, lng: -49.6481, nome: 'Bauru (45 casos)', casos: 45 },
  { lat: -21.1453, lng: -47.8538, nome: 'Araraquara (28 casos)', casos: 28 },
  { lat: -22.7241, lng: -45.7071, nome: 'São José dos Campos (19 casos)', casos: 19 },
  { lat: -19.8267, lng: -49.6492, nome: 'Franca (40 casos)', casos: 40 },
];

const quilombosLocalizacoes = [
  { lat: -24.1883, lng: -48.7654, nome: 'Quilombo A', status: 'Protegido' },
  { lat: -23.2237, lng: -48.6481, nome: 'Quilombo B', status: 'Em Processo' },
  { lat: -22.9103, lng: -47.0589, nome: 'Quilombo C', status: 'Pendente' },
  { lat: -21.8267, lng: -49.6492, nome: 'Quilombo D', status: 'Protegido' },
  { lat: -23.6432, lng: -46.7583, nome: 'Quilombo E', status: 'Em Processo' },
];

export default function Dashboard() {

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>📈 Dashboard de Monitoramento</h1>
        <p className={styles.subtitle}>Estado de São Paulo - Dados de Poluição, Queimadas e Quilombos</p>
      </div>



      <MapComponent
        poluicaoLocalizacoes={poluicaoLocalizacoes}
        queimadasLocalizacoes={queimadasLocalizacoes}
        quilombosLocalizacoes={quilombosLocalizacoes}
      />
    </div>
  );
}