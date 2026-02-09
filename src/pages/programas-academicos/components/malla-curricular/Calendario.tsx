import { Calendar } from "lucide-react";

export const Calendario = () => {
  const daysOfWeek = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
  const assignedDays: Record<number, number> = {
    3: 2,
    7: 1,
    10: 3,
    15: 1,
    22: 2,
  };

  const daysInMonth = 31;
  const startOffset = 3;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar size={18} className="text-green-600" /> Calendario de Asignaciones
          </h3>
        </div>
      </div>

      <div className="text-center font-medium">enero 2026</div>

      <div className="grid grid-cols-7 text-center text-sm text-gray-500">
        {daysOfWeek.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-6 text-center">
        {cells.map((day, i) => (
          <div key={i} className="h-14 flex flex-col items-center justify-center">
            {day !== null && (
              <>
                <span className="text-sm font-medium">{day}</span>
                {assignedDays[day] && (
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: assignedDays[day] }).map((_, idx) => (
                      <span key={idx} className="h-2 w-2 rounded-full bg-green-500" />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
