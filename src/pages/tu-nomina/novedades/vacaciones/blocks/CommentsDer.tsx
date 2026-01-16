import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

interface IDropdownChatMessageOutProps {
  text: string;
  time: string;
  read: boolean;
  avatar: string;
}

const CommentsDer = ({ text, time, read, avatar }: IDropdownChatMessageOutProps) => {
  
  return (
    <div className="flex items-end justify-end gap-3.5 px-5">
      <div className="flex flex-col gap-1.5">
        <div
          className="card shadow-none flex bg-primary text-primary-inverse text-2sm font-medium flex-col gap-2.5 p-3  rounded-br-none"
          dangerouslySetInnerHTML={{ __html: text }}
        />

        <div className="flex items-center justify-end relative">
          <span className="text-2xs font-medium text-gray-600 ">{time}</span>
        </div>
      </div>

      <div className="relative shrink-0 mb-4">
        <img src={avatar} className="rounded-full size-9" alt="" />
      </div>
    </div>
  );
};

export { CommentsDer, type IDropdownChatMessageOutProps };
