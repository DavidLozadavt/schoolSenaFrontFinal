import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { DataGrid, KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';

import { ColumnDef } from '@tanstack/react-table';
import Timeline from './timeLine';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  idRutaPadre: any;
}


const ModalInfoRuta = ({open, idRutaPadre, onClose}:ModalProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[960px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{'Información de rutas'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
         
          <div className="card-body">
           <Timeline 
           idRutaPadre={idRutaPadre}
           />
          </div>
          <div className="flex justify-end gap-3 px-4 mt-4">
            {/* <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button> */}
          </div>
          </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ModalInfoRuta