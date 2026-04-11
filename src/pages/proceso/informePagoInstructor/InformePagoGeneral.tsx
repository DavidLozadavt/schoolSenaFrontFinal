import React, { useState } from 'react'
import ContratoGeneralInstructor from './contratoInstructor/ContratoGeneralInstructor'
import InformeGeneralInstructor from './informeInstructor/InformeGeneralInstructor'
import RmiInstructor from './rmiInstructor/RmiInstructor'
import PagoGeneralInstructor from './pago/PagoGeneralInstructor'

const STEPS = [
  {
    number: 1,
    title: 'Contrato',
    description: 'Información general del contrato',
    icon: 'ki-document',
  },
  {
    number: 2,
    title: 'RMI',
    description: 'Reporte Mensual del Instructor',
    icon: 'ki-calendar-tick',
  },
  {
    number: 3,
    title: 'Informes',
    description: 'Informes y comisiones por periodo',
    icon: 'ki-chart-line-star',
  },
  {
    number: 4,
    title: 'Pago',
    description: 'Archivo de pago',
    icon: 'ki-wallet',
  },
  
]

const InformePagoGeneral: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1)
  }

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Informe del contrato
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Siga los pasos para gestionar su contrato, informes y reporte mensual
        </p>
      </div>

      {/* ── Stepper horizontal ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Línea de fondo */}
          <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-200 dark:bg-coal-300 mx-12" />
          {/* Línea de progreso */}
          <div
            className="absolute top-6 left-0 h-[2px] bg-blue-500 mx-12 transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%`, maxWidth: 'calc(100% - 6rem)' }}
          />

          {STEPS.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <button
                key={step.number}
                onClick={() => setCurrentStep(index)}
                className="relative z-10 flex flex-col items-center gap-2 group flex-1"
              >
                {/* Círculo */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                    ${isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                      : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white dark:bg-coal-500 border-gray-300 dark:border-coal-300 text-gray-400 dark:text-gray-500 group-hover:border-blue-300 group-hover:text-blue-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <i className="ki-outline ki-check text-lg" />
                  ) : (
                    <i className={`ki-outline ${step.icon} text-lg`} />
                  )}
                </div>

                {/* Texto */}
                <div className="text-center">
                  <p
                    className={`text-xs font-bold transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                  >
                    Paso {step.number}
                  </p>
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-gray-800 dark:text-white'
                        : isCompleted
                          ? 'text-gray-700 dark:text-gray-200'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contenido del paso actual ── */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        {/* Encabezado del paso */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300 bg-gray-50/50 dark:bg-coal-500 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <i className={`ki-outline ${STEPS[currentStep].icon} text-blue-600 dark:text-blue-400 text-base`} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {STEPS[currentStep].description}
            </p>
          </div>
          <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-coal-400 px-2.5 py-1 rounded-full">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>

        {/* Contenido */}
        <div>
          {currentStep === 0 && <ContratoGeneralInstructor />}
          {currentStep === 1 && <RmiInstructor />}
          {currentStep === 2 && <InformeGeneralInstructor />}
          {currentStep === 3 && <PagoGeneralInstructor />}
        </div>
      </div>

      {/* ── Navegación (Anterior / Siguiente) ── */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className={`
            flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all
            ${currentStep === 0
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 hover:bg-gray-50 dark:hover:bg-coal-400 shadow-sm'
            }
          `}
        >
          <i className="ki-outline ki-left text-sm" />
          Anterior
        </button>

        <div className="flex gap-1.5">
          {STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-600 w-6'
                  : index < currentStep
                    ? 'bg-green-400'
                    : 'bg-gray-300 dark:bg-coal-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStep === STEPS.length - 1}
          className={`
            flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all
            ${currentStep === STEPS.length - 1
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20'
            }
          `}
        >
          Siguiente
          <i className="ki-outline ki-right text-sm" />
        </button>
      </div>
    </div>
  )
}

export default InformePagoGeneral
