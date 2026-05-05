import { SidebarMenu } from './SidebarMenu';

interface Props {
  height?: number;
}

const SidebarContent = ({ height = 0 }: Props) => {
  return (
    <div className="sidebar-content flex min-h-0 flex-1 flex-col pe-2 lg:pt-1">
      <div
        className="flex min-h-0 grow shrink-0 flex-col ps-2 pt-1 lg:ps-5 lg:pt-0 pe-3 scrollable-y-hover"
        style={{
          ...(height > 0 && { height: `${height}px` })
        }}
      >
        <SidebarMenu />
      </div>
    </div>
  );
};

export { SidebarContent };
