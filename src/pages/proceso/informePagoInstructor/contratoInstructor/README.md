# ContratoGeneralInstructor - Estructura Modularizada

## 📁 Estructura de Carpetas

```
contratoInstructor/
├── ContratoGeneralInstructor.tsx    # Componente principal (197 líneas)
├── types.ts                         # Interfaces TypeScript
├── constants.ts                     # Constantes y estilos
├── actividadesInciales.ts          # (archivo existente)
├── hooks/
│   ├── index.ts                    # Exporta todos los hooks
│   ├── useContrato.ts              # Lógica de carga y edición del contrato
│   └── useActividades.ts           # CRUD de actividades
├── components/
│   ├── index.ts                    # Exporta todos los componentes
│   ├── ContratoHeader.tsx          # Banner del centro de formación
│   ├── ActividadesButton.tsx       # Botón con contador de actividades
│   └── ContratoSupervisor.tsx      # Sección completa de supervisor y detalles
└── modals/
    ├── index.ts                    # Exporta todos los modales
    ├── ActividadesModal.tsx        # Modal principal de actividades
    ├── ActividadesForm.tsx         # Formulario crear/editar actividades
    ├── ActividadesList.tsx         # Listado de actividades
    ├── HelpModal.tsx               # Modal de ayuda
    └── MissingFieldsModal.tsx      # Modal de validación
```

## 🎯 Componentes Principales

### ContratoGeneralInstructor.tsx (Componente Principal)
- 📏 **197 líneas** (antes: 1220)
- ✨ Más limpio y legible
- Importa y orquesta todos los submódulos
- Responsable de la validación externa (useImperativeHandle)

### types.ts
- Interfaces TypeScript compartidas
- `Contrato`, `ActividadContrato`, `CentroFormacion`, etc.
- `ContratoGeneralInstructorRef` para validación externa
- `ContratoFormData` y `ActividadFormData` para formularios

### constants.ts
- `FORMAS_DE_PAGO`: Array de opciones de pago
- `FORMA_PAGO_STYLES`: Estilos Tailwind por forma de pago
- `ACTIVIDADES_MINIMAS`: Constante reutilizable (6)

## 🪝 Hooks Personalizados

### useContrato()
**Responsabilidades:**
- Cargar datos del contrato desde la API
- Gestionar estado de edición
- Manejar cambios en el formulario
- Guardar cambios en el servidor
- Gestionar búsqueda y selección de ciudades

**Devuelve:**
```typescript
{
  contrato, loading, editing, saving,
  ciudades, ciudadSearch, form, setForm, setCiudadSearch,
  handleEdit, handleCancel, handleSave,
  ciudadesFiltradas, ciudadSeleccionadaLabel
}
```

### useActividades(contratoId)
**Responsabilidades:**
- Cargar, crear, actualizar, eliminar actividades
- Gestionar modal de actividades
- Gestionar modal de ayuda
- Generar 6 actividades base
- Mantener contador total de actividades

**Devuelve:**
```typescript
{
  actividades, loadingActividades, totalActividades,
  showActividadesModal, showHelpModal, openForm,
  actividadForm, editingActividad, savingActividad,
  baseActividadIds,
  setShowActividadesModal, setShowHelpModal, setOpenForm, setActividadForm,
  handleOpenActividades, handleCloseActividadesModal,
  handleEditActividad, handleCancelActividadEdit,
  handleSaveActividad, handleDeleteActividad,
  handleRegistrarBase, loadActividades
}
```

## 🧩 Componentes UI

### ContratoHeader
- Banner con logo del centro de formación
- Información de contacto y dirección
- Número de contrato

### ActividadesButton
- Botón interactivo para abrir modal de actividades
- Burbuja de contador (verde si ≥ 6, naranja si < 6)
- Barra de progreso visual
- Estados: "Cargando", "0 actividades", "Listo para informe"

### ContratoSupervisor
- Sección supervisor (nombre y cargo)
- Detalles del contrato (forma de pago, descripción, SIIF, objeto)
- Documento del instructor (ciudad de expedición)
- Modo edición con formularios e inputs

## 📱 Modales

### MissingFieldsModal
- Muestra lista de campos obligatorios faltantes
- Simple y enfocado

### HelpModal
- Explica cómo generar las 6 actividades base
- Botón para crear actividades automáticamente

### ActividadesForm
- Acordeón expandible/colapsable
- Campos: Obligaciones, Acciones Realizadas, Evidencias
- Modo crear y editar

### ActividadesList
- Listado de actividades registradas
- Botones para editar cada actividad
- Botón eliminar (excepto para actividades base)
- Estado vacío con call-to-action

### ActividadesModal (Contenedor)
- Orquesta Form y List
- Header con número de contrato

## ✅ Beneficios de la Modularización

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas del componente principal** | 1220 | 197 |
| **Complejidad** | Alta | Baja |
| **Reutilización** | Difícil | Fácil |
| **Testabilidad** | Baja | Alta |
| **Mantenibilidad** | Difícil | Fácil |
| **Cambios visualization** | Requiere scroll | Rápido |

## 🔄 Flujo de Datos

```
ContratoGeneralInstructor
├── useContrato() → Estado del contrato
│   ├── form (supervisorContrato, cargoSupervisor, etc.)
│   ├── editing, saving
│   └── handlers (handleEdit, handleCancel, handleSave)
│
├── useActividades() → Estado de actividades
│   ├── actividades[], totalActividades
│   ├── showActividadesModal, showHelpModal
│   └── handlers (save, delete, edit, etc.)
│
└── Componentes
    ├── ContratoHeader (props: contrato)
    ├── ActividadesButton (props: totalActividades, onOpenActividades)
    ├── ContratoSupervisor (props: contrato, form, editing, handlers)
    └── Modales (props: estado, handlers)
```

## 🚀 Próximos Pasos Opcionales

1. **Tests unitarios** para cada hook y componente
2. **Storybook** para documentar componentes UI
3. **Extractor de lógica**: Separar lógica API en servicio
4. **Contexto** para evitar pasar props profundas
5. **Optimizaciones** con `useMemo` y `useCallback`

## 📝 Notas

- La validación externa se mantiene en el componente principal con `useImperativeHandle`
- Los hooks manejan toda la lógica interna
- Los componentes son puramente presentacionales
- Los modales están desacoplados del contenedor principal
