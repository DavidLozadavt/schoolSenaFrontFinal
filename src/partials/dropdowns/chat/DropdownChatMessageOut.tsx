import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

interface IDropdownChatMessageOutProps {
  text: string;
  file: { archivo: string }[];
  time: string;
  read: boolean;
}

const DropdownChatMessageOut = ({ text, time, read, file }: IDropdownChatMessageOutProps) => {
  return (
    <div className="flex items-end justify-end gap-3.5 px-5">
      <div className="flex flex-col gap-1.5">
        {text?.trim() && (
          <div
            className="card shadow-none flex bg-primary text-primary-inverse text-2sm font-medium flex-col gap-2.5 p-3  rounded-br-none"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        )}

        {file?.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {file.map((f, idx) => {
              const parts = f.archivo.split('_');
              const fileName = parts[parts.length - 1];

              return (
                <div key={idx} className="bg-white shadow rounded-xl p-2 w-[240px]">
                  <img
                    src={f.archivo}
                    alt={fileName}
                    className="rounded-md mb-1 max-h-[150px] object-cover"
                  />
                  <p className="text-xs text-gray-700 truncate">{fileName}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end relative">
          <span className="text-2xs font-medium text-gray-600 mr-6">{time}</span>
          <KeenIcon
            icon="double-check"
            className={clsx('text-lg absolute', read ? 'text-success' : 'text-gray-400')}
          />
        </div>
      </div>
    </div>
  );
};

export { DropdownChatMessageOut, type IDropdownChatMessageOutProps };
