import { toAbsoluteUrl } from '@/utils';

interface IDropdownChatMessageInProps {
  text: string;
  time: string;
  avatar: string;
  file: { archivo: string }[];
}

const DropdownChatMessageIn = ({ text, time, avatar, file }: IDropdownChatMessageInProps) => {
  return (
    <div className="flex items-end gap-3.5 px-5">
      <img src={toAbsoluteUrl(avatar)} className="rounded-full size-9" alt="" />

      <div className="flex flex-col gap-1.5">
        {text?.trim() && (
          <div
            className="card shadow-none flex flex-col bg-gray-100 gap-2.5 p-3 rounded-bl-none text-2sm font-medium text-gray-700"
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

        <span className="text-2xs font-medium text-gray-500">{time}</span>
      </div>
    </div>
  );
};

export { DropdownChatMessageIn, type IDropdownChatMessageInProps };
