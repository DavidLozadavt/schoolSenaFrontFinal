import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
interface ModalProps {
  open: boolean;
  onClose: () => void;
}
const ModalLinksAntecedentes = ({ open, onClose }: ModalProps) => {
  const links = [
    {
      title: 'Antecedentes Policía',
      url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/antecedentes.xhtml'
    },
    {
      title: 'Antecedentes Procuraduría',
      url: 'https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx'
    },
    {
      title: 'Sistema RNMC (Medidas Correctivas)',
      url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx'
    },
    {
      title: 'Contraloría - Antecedentes Fiscales',
      url: 'https://www.contraloria.gov.co/control-fiscal/responsabilidad-fiscal/certificado-de-antecedentes-fiscales'
    },
    {
      title: 'Consulta de Inhabilidades',
      url: 'https://inhabilidades.policia.gov.co:8080/'
    }
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Accesos directos a consultas oficiales</ModalTitle>

          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-4 px-0 py-5">
          {links.map((link, index) => (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4  border rounded-lg shadow hover:shadow-lg hover:border-blue-500 transition"
            >
              <p className="font-semibold text-gray-800">{link.title}</p>
              <p className="text-xs text-gray-500 mt-1">Ir al sitio oficial</p>
            </a>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalLinksAntecedentes };
