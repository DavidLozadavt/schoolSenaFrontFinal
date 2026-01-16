// 📝 types.ts (Modificado para Tareas)

// 📅 INTERFAZ DE TAREA
export interface Task {
  id: string;
  title: string;
  start: string;      // YYYY-MM-DD
  end: string;        // YYYY-MM-DD
  time: string;       // HH:MM (Hora de inicio)
  duration: number;   // Duración en minutos
  color: string;
  // meetingUrl: string; // Se elimina si no es necesario
  assigned?: string; // Nuevo campo opcional para un gestor de tareas
}

// 🗓️ TAREAS DE EJEMPLO ACTUALIZADAS
export const exampleTasks: Task[] = [
  {
    id: "1",
    title: "Revisar arquitectura base",
    start: "2025-11-19", // Fecha anterior para simular tarea finalizada
    end: "2025-11-19",
    time: "10:00", 
    duration: 120,
    color: "bg-green-400",
  },
  {
    id: "2",
    title: "Preparar demo para cliente",
    start: "2025-11-21", // Hoy
    end: "2025-11-21",
    time: "14:00", // Hora en el futuro (14:00)
    duration: 30,
    color: "bg-red-500", 
  },
  {
    id: "3",
    title: "Documentación de API",
    start: "2025-11-22", 
    end: "2025-11-22",
    time: "14:00",
    duration: 60,
    color: "bg-purple-500",
  },
  {
    id: "4",
    title: "Bugfix Crítico #404",
    start: "2025-11-25", 
    end: "2025-11-25",
    time: "09:00",
    duration: 90,
    color: "bg-yellow-500",
  }
];

// ELIMINACIÓN DE: participantsList y la interfaz Participant.