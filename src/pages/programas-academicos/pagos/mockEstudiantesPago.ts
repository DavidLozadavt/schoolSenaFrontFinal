export interface EstudiantePagoMock {
  idEstudiante: number;
  nombre: string;
  documento: string;
  idMatricula: number;
  idTransaccion: number;
}

export const estudiantesPagoMock: EstudiantePagoMock[] = [
  {
    idEstudiante: 1,
    nombre: 'Juan Pablo Pérez',
    documento: '1002456789',
    idMatricula: 88,
    idTransaccion: 120
  },
  {
    idEstudiante: 2,
    nombre: 'María Fernanda López',
    documento: '1005678901',
    idMatricula: 89,
    idTransaccion: 121
  },
  {
    idEstudiante: 3,
    nombre: 'Carlos Andrés Gómez',
    documento: '1098765432',
    idMatricula: 90,
    idTransaccion: 122
  }
];
