import { KeenIcon } from "@/components";

interface TabHeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const TabHeader = ({ activeTab, setActiveTab }: TabHeaderProps) => {
  const tabs = [
    {
      id: 'productos',
      label: 'Productos',
      icon: (
       <KeenIcon icon="parcel" />
      )
    },
    {
      id: 'servicios',
      label: 'Servicios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-0 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            relative px-6 py-4 font-semibold text-sm transition-all duration-300
            flex items-center justify-center gap-3
            ${activeTab === tab.id ? 'bg-primary/10' : ''}
          `}
        >
          <span className={activeTab === tab.id ? 'scale-110 transition-transform' : ''}>
            {tab.icon}
          </span>
          <span className="text-base">{tab.label}</span>

          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

export { TabHeader };
