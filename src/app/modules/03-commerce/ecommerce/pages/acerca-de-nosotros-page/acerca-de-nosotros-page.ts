import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SeoService } from '../../../../../core/services/seo.service';

interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  imageUrl: string;
}

interface MissionVisionItem {
  type: 'mission' | 'vision';
  title: string;
  description: string;
}

interface ValueItem {
  title: string;
  description: string;
}

interface AboutContent {
  hero: { badge: string; title: string; description: string };
  history: { images: string[]; paragraphs: string[]; quote: string };
  timeline: TimelineEvent[];
  missionVision: MissionVisionItem[];
  values: ValueItem[];
}

const ABOUT_CONTENT: AboutContent = {
  hero: {
    badge: 'AFER Bolivia',
    title: 'Acerca de Nosotros',
    description: 'Innovando el futuro desde nuestras raíces, construyendo confianza, tecnología y sueños desde 2009.',
  },
  history: {
    images: ['/assets/Acerca-de-nosotros/300.jpg', '/assets/Acerca-de-nosotros/90.jpg'],
    paragraphs: [
      'Desde 2009, AFER Bolivia ha sido sinónimo de innovación, construyendo empresas y forjando sueños en cada proyecto. Fundada por dos visionarios que, con poco capital y una determinación inquebrantable, lograron superar los desafíos del mercado boliviano.',
      'Con una visión inspiradora de estructuras japonesas, un equipo comprometido y estrategias audaces en redes sociales, AFER Bolivia transformó obstáculos en oportunidades, especialmente durante la pandemia, cuando su digitalización le permitió crecer aún más.',
      'A lo largo de estos años, AFER Bolivia ha evolucionado y expandido sus servicios, sin perder su esencia de atención personalizada y cercanía con el cliente. Hoy, AFER Bolivia continúa siendo la diferencia, construyendo el futuro con pasión y visión.',
    ],
    quote: 'En AFER Bolivia, creemos que el éxito es para quienes se reinventan y abrazan cada desafío. ¡Construyamos juntos el futuro!',
  },
  timeline: [
    { year: 2009, title: 'Inicio de AFER Bolivia', description: 'Nace una visión enfocada en innovación, crecimiento y confianza.', imageUrl: '/assets/Acerca-de-nosotros/Group 177.png' },
    { year: 2010, title: 'Expansión Comercial', description: 'Nuevas oportunidades y consolidación empresarial.', imageUrl: '/assets/Acerca-de-nosotros/Group 178.png' },
    { year: 2011, title: 'Innovación Tecnológica', description: 'Incorporación de nuevas soluciones y tecnología.', imageUrl: '/assets/Acerca-de-nosotros/Group 179.png' },
    { year: 2012, title: 'Modernización', description: 'Evolución continua de nuestros servicios.', imageUrl: '/assets/Acerca-de-nosotros/Group 187.png' },
    { year: 2014, title: 'Consolidación', description: 'Fortalecimiento de marca y posicionamiento.', imageUrl: '/assets/Acerca-de-nosotros/Group 180.png' },
    { year: 2015, title: 'Nuevos Servicios', description: 'Mejor experiencia y más soluciones para clientes.', imageUrl: '/assets/Acerca-de-nosotros/Group 181.png' },
    { year: 2017, title: 'Crecimiento Nacional', description: 'Expansión y reconocimiento en el mercado.', imageUrl: '/assets/Acerca-de-nosotros/Group 184.png' },
    { year: 2018, title: 'Transformación Digital', description: 'Adaptación estratégica a nuevas tecnologías.', imageUrl: '/assets/Acerca-de-nosotros/Group 185.png' },
    { year: 2019, title: 'Mayor Comunidad', description: 'Cercanía y confianza con nuestros clientes.', imageUrl: '/assets/Acerca-de-nosotros/Group 182.png' },
    { year: 2024, title: 'Construyendo el Futuro', description: 'Continuamos innovando con pasión, visión y compromiso.', imageUrl: '/assets/Acerca-de-nosotros/Group 183.png' },
  ],
  missionVision: [
    { type: 'mission', title: 'Misión', description: 'Proporcionar a nuestros clientes variedad de modelos de productos electrónicos y electrodomésticos de marcas reconocidas, con garantía de marca, comprometidos en satisfacer sus necesidades, con precios justos, apoyados por un ambiente de calidez y una atención profesional y personalizada.' },
    { type: 'vision', title: 'Visión', description: 'Ser la empresa líder en el rubro, facilitando a las personas su día a día con productos en tecnología innovadora, logrando ser para nuestros clientes la mejor opción, mediante un desarrollo humano y profesional de nuestro personal.' },
  ],
  values: [
    { title: 'Responsabilidad', description: 'Responsabilidad con nuestros clientes en la oferta de productos originales, con garantía y características correspondientes. Responsabilidad con nuestro personal en desarrollo y capacitación.' },
    { title: 'Innovación', description: 'Buscamos continuamente productos con desarrollo tecnológico innovador y servicios que nos diferencien de la competencia y mejoren nuestra eficiencia.' },
    { title: 'Transparencia', description: 'Estamos totalmente abiertos a nuestros clientes, proveedores y empleados trasladando toda la información necesaria que nos permita mejorar nuestros vínculos, nuestra oferta comercial y nuestra eficiencia.' },
    { title: 'Eficiencia', description: 'Para alcanzar el éxito la eficiencia es parte de nuestro ADN. Analizamos cada detalle de nuestra cadena de valor para automatizar y ahorrar en todo aquello que no aporta valor, mejorando nuestros servicios y calidad.' },
    { title: 'Calidad', description: 'Ofrecemos productos garantizados y una atención profesional y personalizada para asegurar una experiencia confiable para nuestros clientes.' },
  ],
};

@Component({
  selector: 'app-acerca-de-nosotros-page',
  standalone: true,
  imports: [],
  templateUrl: './acerca-de-nosotros-page.html',
  styleUrl: './acerca-de-nosotros-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcercaDeNosotrosPage {
  private readonly seoService = inject(SeoService);
  readonly content: AboutContent = ABOUT_CONTENT;

  constructor() {
    this.seoService.updateSeoData({
      title: 'Acerca de Nosotros | AFER Bolivia',
      description: 'Conoce la historia, misión y visión de AFER Bolivia. Innovando desde 2009 para ofrecerte lo mejor en tecnología y hogar.'
    });
  }
}
