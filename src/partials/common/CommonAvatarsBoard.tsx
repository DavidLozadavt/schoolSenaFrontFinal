
interface IAvatarsItem {
  path?: string;
  filename?: string;
  fallback?: string;
  variant?: string;
}
interface IAvatarsItems extends Array<IAvatarsItem> {}

interface IAvatarsProps {
  size?: string;
  group: IAvatarsItem[];
  more?: { variant?: string; number?: number | string; label?: string };
  className?: string;
  onClickAvatar?:any;
}
const CommonAvatarsBoard = ({ size = 'size-6', group, more, className,onClickAvatar }: IAvatarsProps) => {
  const maxVisible = 5; 

  const renderItem = (each: IAvatarsItem, index: number) => {
    return (
      <div
      onClick={() => onClickAvatar && onClickAvatar(each, index)}
      key={index} className="flex">
        {each.filename ? (
          <img
            src={`${each.filename}`} 
            className={`hover:z-5 relative shrink-0 rounded-full ring-1 ring-light-light ${size}`}
            alt="Avatar"
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {group.slice(0, maxVisible).map((each, index) => renderItem(each, index))}
      {group.length > maxVisible && (
        <div className="flex">
          <span className={`relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-semibold leading-none text-3xs ${size}`}>
            +{group.length - maxVisible}
          </span>
        </div>
      )}
    </div>
  );
};

export { CommonAvatarsBoard };
