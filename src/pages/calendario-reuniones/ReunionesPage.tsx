import React, { useState } from "react";
import ListaReuniones from "./components/ListaReuniones"; 
import { Task, exampleTasks } from "./types";

const NewTaskModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 "
            onClick={onClose} 
        >
            <div 
                className="w-full max-w-lg p-6 bg-white rounded-lg shadow-2xl dark:bg-gray-800"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                    📝 Crear Nueva Tarea / Evento
                </h3>
                
                <form className="space-y-4">
                    <input type="text" placeholder="Título de la Tarea" className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input type="date" className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input type="number" placeholder="Duración (minutos)" className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </form>
                
                <div className="flex justify-end mt-6 space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-800 transition bg-gray-300 rounded-lg hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Crear Tarea
                    </button>
                </div>
            </div>
        </div>
    );
};


const CalendarView: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
    <div className="flex flex-col h-full p-6 bg-white shadow-2xl dark:bg-gray-800 rounded-xl">
        <h3 className="mb-6 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Calendario de Tareas 🗓️
        </h3>
        <div className="grid flex-grow grid-cols-7 gap-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="font-bold text-center text-gray-600 dark:text-gray-300">{day}</div>
            ))}
            {Array(35).fill(null).map((_, i) => {
                const task = tasks.find(t => parseInt(t.id) === i + 1);
                return (
                    <div 
                        key={i} 
                        className={`min-h-[100px] border border-gray-200 dark:border-gray-600 rounded-sm p-1 text-xs ${i % 7 === 0 || i % 7 === 6 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                    >
                        <span className="font-medium text-gray-500 dark:text-gray-400">Nov {i + 1}</span>
                        {task && (
                            <div className={`mt-1 p-1 rounded-md text-white text-xs truncate ${task.color} shadow-sm`}>
                                {task.title.split(' ')[0]}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
            Vista de calendario simplificada para mostrar la programación de las tareas.
        </p>
    </div>
);


const ReunionesPage = () => {
  const [tasks] = useState<Task[]>(exampleTasks);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);


  return (
    <div className="flex flex-col min-h-screen gap-4 p-4 font-sans transition-colors bg-gray-100 lg:flex-row md:gap-6 md:p-6 dark:bg-[--tw-page-bg-dark]">
      
      <ListaReuniones 
        tasks={tasks}
        activeMeetingId={undefined} // Ya no hay "activa"
        onScheduleClick={openModal} // Función para abrir el modal de nueva tarea
      />

      {/* --- PANTALLA PRINCIPAL: VISTA DE CALENDARIO --- */}
      <div className="flex-grow h-full min-h-[500px]"> 
        <CalendarView tasks={tasks} />
      </div>

      {/* RENDERIZAR EL MODAL */}
      <NewTaskModal isOpen={isModalOpen} onClose={closeModal} />

    </div>
  );
};

export default ReunionesPage;