import { MiscFaq, MiscHelp2 } from '@/partials/misc';

import { Members } from './blocks';

const AccountPermissionsToggleContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* <PermissionsToggle /> */}

      <Members />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { AccountPermissionsToggleContent };
