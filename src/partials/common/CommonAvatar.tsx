import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

interface IAvatarProps {
  image?: string;
  fallback?: string;
  icon?: string;
  iconClass?: string;
  badgeClass?: string;
  className?: string;
  imageClass?: string;
}

const CommonAvatar = ({
  image,
  fallback,
  icon,
  iconClass,
  badgeClass,
  className,
  imageClass
}: IAvatarProps) => {
  return (
    <div className={clsx(className)}>
      {image && (
        <Zoom>
          <img
            src={toAbsoluteUrl(`${image}`)}
            className={clsx(
              imageClass || 'w-full h-full rounded-full object-contain object-center cursor-zoom-in'
            )}
            alt="avatar"
          />
        </Zoom>
      )}
      {!image && fallback && fallback}
      {!image && !fallback && icon && (
        <KeenIcon icon={icon} className={clsx(iconClass)} />
      )}
      {badgeClass && <div className={clsx(badgeClass)}></div>}
    </div>
  );
};

export { CommonAvatar, type IAvatarProps };
