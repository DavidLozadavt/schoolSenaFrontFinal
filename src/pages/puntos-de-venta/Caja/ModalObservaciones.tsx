
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { DataGrid, KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';

import { ColumnDef } from '@tanstack/react-table';
import ObservacionesViaje from './ObservacionesViaje';

interface ModalProps {
    open: boolean;
    data?: any;
    onClose: () => void;
    idViaje?: any;
}

const ModalObservaciones = ({ open, onClose, data, idViaje }: ModalProps) => {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalContent className="max-w-[600px] top-[15%] p-4">
                <ModalHeader>
                    <ModalTitle>Observaciones viaje</ModalTitle>
                    <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
                        <KeenIcon icon="cross" />
                    </button>
                </ModalHeader>
                <ModalBody className="grid gap-5 px-0 py-5">

                    <ObservacionesViaje idViaje={idViaje} />

                    <div className="flex justify-end gap-3 px-4 mt-4">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>

                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalObservaciones