import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
interface ModalProps {
  open: boolean;
  data: any;
  onClose: () => void;
}
const ModalObservacionPreocupacional = ({ open, data, onClose }: ModalProps) => {

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Observaciones Preocupacionales</ModalTitle>

          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

<ModalBody className="grid gap-4 px-0 py-5">
  <div className="p-2">
    {Array.isArray(data) && data.length > 0 ? (
      <ul className="list-none space-y-2">
        {data.map((item) => (
          <li key={item.id} className="flex items-start gap-4">
         <span className="text-gray-700 font-bold mt-3">•</span>

            <textarea
              className="w-full border rounded p-2 resize-none textarea mt-3"
              rows={3}
              readOnly
              value={item.observacion}
            />
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500 italic">No hay observaciones registradas</p>
    )}
  </div>
</ModalBody>


      </ModalContent>
    </Modal>
  );
};

export { ModalObservacionPreocupacional };
