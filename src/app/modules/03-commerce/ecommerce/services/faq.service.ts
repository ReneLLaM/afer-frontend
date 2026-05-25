import { Injectable } from '@angular/core';
import { FaqItem } from '../pages/preguntas-frecuentes-page/interfaces/faq.interface';

@Injectable({ providedIn: 'root' })
export class FaqService {
  readonly faqItems: FaqItem[] = [
    {
      id: 'sucursales',
      question: '¿Dónde tienen sucursales?',
      answer:
        'Actualmente nuestra única sucursal está en Sucre. Puedes visitarnos en nuestro punto de venta principal para recibir atención personalizada.',
    },
    {
      id: 'ubicacion',
      question: '¿Dónde están ubicados?',
      answer:
        'Estamos ubicados en Sucre, en la Plazuela Las Heroínas N° 26, esquina Ricardo Bacherer (zona Ex Refisur). Abrimos de lunes a viernes de 08:30 a 13:00 y de 14:30 a 19:45, y los sábados de 08:30 a 19:00. ¡Te esperamos!',
    },
    {
      id: 'envios',
      question: '¿Realizan envíos?',
      answer:
        'Sí, realizamos envíos a nivel nacional. Para nuestros clientes en Sucre, Oruro, Cochabamba y La Paz ofrecemos entregas a domicilio gratuitas. Para el resto del país, trabajamos con empresas de courier confiables para garantizar que tus productos lleguen en perfectas condiciones.',
    },
    {
      id: 'credito',
      question: '¿Dan productos a crédito?',
      answer:
        'Sí, ofrecemos opciones de crédito a través de nuestras entidades financieras asociadas. Los requisitos y plazos varían según el producto y la entidad. Te recomendamos visitar nuestra tienda o contactarnos para recibir asesoría personalizada sobre las opciones disponibles.',
    },
    {
      id: 'cambios',
      question: '¿Es posible realizar cambios en productos adquiridos?',
      answer:
        'Sí, aceptamos cambios dentro de los primeros 7 días hábiles posteriores a la compra, siempre que el producto se encuentre en su empaque original, sin uso y en perfectas condiciones. Para productos con defecto de fábrica, el plazo se extiende según la garantía del fabricante.',
    },
    {
      id: 'tiempo-entrega',
      question: '¿Qué tiempo demora en llegar un pedido?',
      answer:
        'El tiempo de entrega depende de tu ubicación. Para entregas en Sucre, el plazo es de 24 a 48 horas hábiles. Para Oruro, Cochabamba y La Paz, de 2 a 4 días hábiles. Para el resto del país, puede tomar de 5 a 7 días hábiles dependiendo de la empresa de courier.',
    },
    {
      id: 'defecto',
      question: '¿Qué hago si un producto tiene defecto de fábrica?',
      answer:
        'Si detectas un defecto de fábrica, contáctanos dentro del período de garantía. Deberás presentar tu factura o comprobante de compra y el producto en su empaque original. Evaluaremos el caso y procederemos con el cambio, reparación o reembolso según corresponda.',
    },
    {
      id: 'inspeccionar',
      question: '¿Por qué es importante inspeccionar los productos?',
      answer:
        'Es fundamental que inspecciones tus productos en el momento de la entrega para verificar que estén en perfectas condiciones. Si detectas algún daño visible, golpe o瑕疵, repórtalo de inmediato a nuestro equipo para poder gestionar el cambio o la devolución sin contratiempos.',
    },
    {
      id: 'servicio-tecnico',
      question: '¿Ofrecen servicio técnico o reparaciones?',
      answer:
        'Sí, contamos con servicio técnico especializado para reparaciones y mantenimiento de electrodomésticos y equipos electrónicos. También ofrecemos instalación de soportes para televisores, limpieza y mantenimiento de cocinas, e instalación de extractores y campanas.',
    },
    {
      id: 'pagos',
      question: '¿Cuáles son sus formas de pago?',
      answer:
        'Aceptamos múltiples formas de pago para tu comodidad: efectivo, transferencia bancaria, depósito en cuenta, tarjetas de débito y crédito, y pagos a través de nuestras entidades financieras asociadas. Consulta con nuestro equipo las opciones disponibles para tu compra.',
    },
    {
      id: 'probar',
      question: '¿Puedo probar los electrodomésticos antes de comprarlos?',
      answer:
        '¡Claro que sí! En nuestras sucursales contamos con showrooms donde puedes ver, tocar y probar los electrodomésticos en funcionamiento. Nuestro equipo te brindará toda la asesoría necesaria para que tomes la mejor decisión de compra.',
    },
  ];
}
