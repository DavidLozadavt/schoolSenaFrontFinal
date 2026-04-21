import * as React from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

const DEFAULT_TOOLTIP_CLASSES =
  '!text-white !rounded-md !text-xs !font-normal !bg-[--tw-tooltip-background-color] !box-shadow[--tw-tooltip-box-shadow] !border[--tw-tooltip-border] !px-2 !py-1.5';

// Tooltip component that applies utility classes and custom styles.
// Puedes pasar `classes.tooltip` para sustituir el panel (p. ej. panel claro en calendario).
const DefaultTooltip = ({ className = '', classes: userClasses, ...props }: TooltipProps) => (
  <Tooltip
    TransitionProps={{ timeout: 300 }}
    {...props}
    classes={{
      ...userClasses,
      popper: [className, userClasses?.popper].filter(Boolean).join(' ') || undefined,
      tooltip: userClasses?.tooltip ?? DEFAULT_TOOLTIP_CLASSES
    }}
  />
);

export { DefaultTooltip };
