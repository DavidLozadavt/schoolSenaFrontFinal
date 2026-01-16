const getData = (key: string): unknown | undefined => {
  try {
    const data = localStorage.getItem(key);

    if (data) {
      return JSON.parse(data);
    }
    return undefined;
  } catch (error) {
    console.error('Error al leer del local storage', error);
    return undefined;
  }
};

const setData = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error al guardar en local storage', error);
  }
};

export { getData, setData };
