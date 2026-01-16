import React, { useState } from 'react';

type Course = {
  id: string;
  title: string;
  color: string; // tailwind border/bg/text classes
};

type ScheduleEvent = {
  id: string;
  title: string;
  day: number; // 0..6 Monday..Sunday
  startHour: number; // hour in 24h (e.g., 9.5 for 09:30)
  endHour: number; // hour in 24h
  colorClass: string;
};

const courses: Course[] = [
  {
    id: '1',
    title: 'Technology',
    color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    id: '2',
    title: 'Artificial Intelligence',
    color: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
  },
  {
    id: '3',
    title: 'Business Management',
    color:
      'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  },
  {
    id: '4',
    title: 'UX Design',
    color: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  },
  {
    id: '5',
    title: 'Applied Science',
    color: 'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
  },
  {
    id: '6',
    title: 'Artificial Intelligence',
    color: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
  }
];

const events: ScheduleEvent[] = [
  {
    id: 'e1',
    title: 'Applied Science',
    day: 0,
    startHour: 9.5,
    endHour: 11.2,
    colorClass: 'bg-pink-400/95 text-white dark:bg-pink-600'
  },
  {
    id: 'e2',
    title: 'Technology',
    day: 2,
    startHour: 11.5,
    endHour: 12.5,
    colorClass: 'bg-blue-400/95 text-white dark:bg-blue-600'
  },
  {
    id: 'e3',
    title: 'UX Design',
    day: 3,
    startHour: 12.0,
    endHour: 13.6,
    colorClass: 'bg-amber-300/95 text-black dark:bg-amber-500 dark:text-white'
  },
  {
    id: 'e4',
    title: 'Artificial Intelligence',
    day: 2,
    startHour: 14.0,
    endHour: 15.6,
    colorClass: 'bg-cyan-200/95 text-black dark:bg-cyan-600 dark:text-white'
  },
  {
    id: 'e5',
    title: 'Business Management',
    day: 3,
    startHour: 15.0,
    endHour: 16.0,
    colorClass: 'bg-orange-300/95 text-white dark:bg-orange-600'
  }
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const startHour = 9;
const endHour = 18;
const rows = (endHour - startHour) * 2; // half-hour slots

function hourToRow(h: number) {
  return Math.round((h - startHour) * 2) + 1;
}

const ProfesoresContent: React.FC = () => {
  const [selectedDay] = useState<number>(2); // destacar miércoles por defecto

  return (
    <div className="p-4 space-y-6 min-h-[80vh] bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-2xl">
          <input
            placeholder="Search..."
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url('/media/avatars/avatar-1.jpg')` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-lg border shadow-sm dark:border-neutral-700 ${c.color}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{c.title}</h4>
                  <div className="text-xs text-gray-400 dark:text-gray-500">•••</div>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="dark:text-white">View Classes</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="dark:text-white">View Students</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-gray-700 dark:text-white">
            WEEKLY COURSE SCHEDULE
          </h3>

          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-neutral-700">
              <div className="w-20 py-3 text-xs text-gray-400 dark:text-white">Week</div>

              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 py-3 text-center text-sm font-semibold ${
                    i === selectedDay
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-white'
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-white">
                    {new Date().getDate() + (i - selectedDay)}
                  </div>

                  <div className="mt-1 text-gray-700 dark:text-white">{days[i]}</div>
                </div>
              ))}
            </div>

            <div className="relative grid grid-cols-[80px_1fr]">
              {/* Horas */}
              <div className="border-r border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                {Array.from({ length: rows }).map((_, i) => {
                  const h = startHour + i * 0.5;
                  const label = `${Math.floor(h)
                    .toString()
                    .padStart(2, '0')}:${h % 1 === 0 ? '00' : '30'}`;

                  return (
                    <div
                      key={i}
                      className="h-10 text-xs text-gray-400 dark:text-white flex items-center justify-end pr-2 border-b border-gray-100 dark:border-neutral-700"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Grilla */}
              <div className="p-4">
                <div
                  className="relative grid"
                  style={{
                    gridTemplateColumns: `repeat(7, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, 40px)`
                  }}
                >
                  {Array.from({ length: rows }).map((_, r) => (
                    <div
                      key={r}
                      className="col-span-7 border-b border-gray-100 dark:border-neutral-700"
                      style={{ gridColumn: '1 / -1', gridRow: `${r + 1}` }}
                    />
                  ))}

                  {events.map((ev) => {
                    const rowStart = hourToRow(ev.startHour);
                    const rowEnd = hourToRow(ev.endHour);

                    return (
                      <div
                        key={ev.id}
                        className={`rounded-lg p-2 text-sm shadow-md ${ev.colorClass} text-white`}
                        style={{
                          gridColumn: `${ev.day + 1}`,
                          gridRow: `${rowStart} / ${rowEnd}`,
                          zIndex: 10
                        }}
                      >
                        <div className="font-semibold text-xs text-white">{ev.title}</div>
                        <div className="text-[11px] text-white/80">
                          {`${Math.floor(ev.startHour)}:${
                            ev.startHour % 1 === 0 ? '00' : '30'
                          } - ${Math.floor(ev.endHour)}:${ev.endHour % 1 === 0 ? '00' : '30'}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">February 2024</h4>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-white">
                  ◀
                </button>
                <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-white">
                  ▶
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-white">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-2 rounded text-gray-500 dark:text-white">
                  {d}
                </div>
              ))}

              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`py-2 rounded ${
                    i === 0 ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-white'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <h4 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h4>

            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-red-400 rounded" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Applied Science Homework
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white">
                    2nd of February - Tuesday
                  </div>
                  <div className="text-xs text-gray-400 dark:text-white mt-1">11:30 - 12:30</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-orange-400 rounded" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Technology Exam
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white">
                    3rd of February - Wednesday
                  </div>
                  <div className="text-xs text-gray-400 dark:text-white mt-1">11:30 - 12:30</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-yellow-300 rounded" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    AI Workshop
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white">
                    5th of February - Tuesday
                  </div>
                  <div className="text-xs text-gray-400 dark:text-white mt-1">11:30 - 12:30</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-emerald-300 rounded" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    UX Design Conference
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white">
                    8th of February - Monday
                  </div>
                  <div className="text-xs text-gray-400 dark:text-white mt-1">11:30 - 12:30</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfesoresContent;
