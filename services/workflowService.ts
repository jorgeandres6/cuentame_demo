
import { RiskLevel, InterventionType } from "../types";

// FASE 3: Motor de Flujo de Trabajo - Lógica de Derivación Institucional (ECUADOR)
// Basado en: "Protocolos de Actuación frente a situaciones de violencia detectadas o cometidas en el sistema educativo" (MINEDUC)

export const determineProtocol = (risk: RiskLevel, typology: string): { protocol: InterventionType, assignedTo: string, routeDescription: string } => {
  
  switch (risk) {
    case RiskLevel.LOW:
      // Conflictos leves, disrupción en clase
      return {
        protocol: InterventionType.TUTORING,
        assignedTo: 'DECE (Acompañamiento)',
        routeDescription: 'Ruta: Mediación Escolar / Tutoría + Seguimiento DECE'
      };

    case RiskLevel.MEDIUM:
      // Acoso Escolar (Bullying), Discriminación, Negligencia leve
      // Requiere informe escrito y notificación a representantes
      return {
        protocol: InterventionType.DIRECTION,
        assignedTo: 'DECE y Rectorado',
        routeDescription: 'Ruta: Informe de Hecho -> Rectorado -> Medidas Educativas / Restaurativas'
      };

    case RiskLevel.HIGH:
      // Violencia Física, Violencia Intrafamiliar, Drogas
      // Implica derivación externa administrativa o judicial
      const isFamily = typology.includes("intrafamiliar");
      return {
        protocol: InterventionType.EXTERNAL,
        assignedTo: isFamily ? 'Junta Cantonal de Protección' : 'Distrito Educativo y Policía (DINAPEN)',
        routeDescription: isFamily 
            ? 'Ruta: Denuncia en Junta Cantonal de Protección de Derechos + Seguimiento DECE'
            : 'Ruta: Distrito Educativo + DINAPEN + Medidas de Protección'
      };

    case RiskLevel.CRITICAL:
      // Violencia Sexual, Suicidio, Delitos flagrantes
      // Ruta de actuación inmediata (Denuncia Fiscalía en < 24h)
      let additional = "";
      if (typology.includes("suicida") || typology.includes("autolesiones")) {
        additional = " + Ministerio de Salud Pública (MSP)";
      }
      return {
        protocol: InterventionType.EXTERNAL,
        assignedTo: 'Fiscalía y Distrito Educativo',
        routeDescription: `Ruta: DENUNCIA INMEDIATA FISCALÍA + Informe a Distrito + UDAI${additional}`
      };

    default:
      return {
        protocol: InterventionType.TUTORING,
        assignedTo: 'DECE (Evaluación Inicial)',
        routeDescription: 'Ruta: Entrevista preliminar y valoración de riesgo'
      };
  }
};
