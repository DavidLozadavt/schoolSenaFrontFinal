import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Fragment, useState } from "react";
import SolicitudInstructorContent from "./SolicitudInstructorContent";


const SolicitudInstructorPage = () => {
    const { currentLayout } = useLayout();
    const [open, setOpen] = useState(false);
    const [reload, setReload] = useState(false);
    
    const handleSave = () => {
        setReload(!reload);
        setOpen(false);
    };

    return (
        <Fragment>
            {currentLayout?.name === 'demo1-layout' && (
                <Container>
                    <Toolbar>
                        <ToolbarHeading>
                            <ToolbarPageTitle />
                            <ToolbarDescription>Gestiona las solicitudes de instructores</ToolbarDescription>
                        </ToolbarHeading>
                    </Toolbar>
                </Container>
            )}
            <Container>
                <SolicitudInstructorContent reload={reload} />
            </Container>
        </Fragment>
    );
};

export default SolicitudInstructorPage;
