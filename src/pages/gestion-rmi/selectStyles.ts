const selectStyles = {
  control: ({ isFocused }: any) => `
    bg-white dark:bg-coal-400
    border ${isFocused ? 'border-primary-500' : 'border-gray-300 dark:border-coal-200'}
    rounded-md min-h-[38px] px-2 cursor-pointer flex items-center shadow-sm
  `,
  singleValue: () => 'text-gray-900 dark:!text-white font-medium',
  placeholder: () => '!text-gray-400 dark:!text-gray-300',
  input: () => 'text-gray-900 dark:!text-white',
  valueContainer: () => 'flex items-center gap-1 flex-wrap py-1',
  menu: () => `
    !bg-white dark:!bg-coal-500
    border border-gray-200 dark:border-coal-300
    rounded-md shadow-lg mt-1 z-50
  `,
  menuList: () => 'py-1',
  option: ({ isFocused, isSelected }: any) => `
    cursor-pointer px-3 py-2 text-sm
    ${
      isSelected
        ? '!bg-primary-500 !text-white'
        : isFocused
          ? '!bg-gray-100 dark:!bg-coal-600 !text-gray-900 dark:!text-white'
          : '!text-gray-900 dark:!text-white'
    }
  `,
  indicatorsContainer: () => 'flex items-center px-1',
  indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300 w-px self-stretch my-2 mx-1',
  dropdownIndicator: () =>
    'text-gray-500 dark:!text-gray-200 hover:text-gray-700 dark:hover:!text-white p-1',
  clearIndicator: () =>
    'text-gray-400 dark:!text-gray-200 hover:text-gray-600 dark:hover:!text-white p-1',
  noOptionsMessage: () => '!text-gray-400 dark:!text-gray-300 text-sm px-3 py-2'
};

export default selectStyles;
