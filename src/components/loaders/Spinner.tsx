const Spinner = () => {
  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;


  const textColor = theme === 'dark' ? 'text-gray-700' : 'text-black';

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-40">
      <img
        className="h-[50px] max-w-none"
        src="https://admin.virtualt.org/default/logoweb.png"
        alt="logo"
      />
      <div className={`${textColor} font-medium text-sm mt-2 flex space-x-0.75`}>
        {"Cargando...".split("").map((char, index) => (
          <span
            key={index}
            className="inline-block animate-smooth-bounce"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Spinner;
