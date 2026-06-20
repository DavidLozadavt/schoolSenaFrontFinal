import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  persons?: any;
  onClose: () => void;
  onSave?: () => void;
}

const PER_PAGE = 5;

const ModalBoardUsers = ({ open, onClose, persons, onSave }: ModalProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const idBoard = localStorage.getItem('idBoard');

  // Estados para búsqueda y paginación
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearch('');
      setCurrentPage(1);
    }
  }, [open]);

  // Filtrar persons localmente por búsqueda
  const filteredPersons = useMemo(() => {
    if (!persons) return [];
    if (!search.trim()) return persons;

    const term = search.toLowerCase().trim();
    return persons.filter((person: any) => {
      const fullName =
        `${person.persona?.nombre1 ?? ''} ${person.persona?.nombre2 ?? ''} ${person.persona?.apellido1 ?? ''} ${person.persona?.apellido2 ?? ''}`.toLowerCase();
      const email = (person.email ?? '').toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [persons, search]);

  // Calcular paginación
  const total = filteredPersons.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPersons = useMemo(() => {
    const start = (safeCurrentPage - 1) * perPage;
    return filteredPersons.slice(start, start + perPage);
  }, [filteredPersons, safeCurrentPage, perPage]);

  // Reiniciar página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [search, perPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const data = { users: selectedIds, idBoard: idBoard };
    try {
      await axios.post(`assign_board`, data);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  /** Renderiza los botones de página con delta (como en la plantilla) */
  const renderPageButtons = () => {
    if (totalPages <= 1) return null;

    const delta = 2;
    const pages: React.ReactNode[] = [];
    const startPage = Math.max(2, safeCurrentPage - delta);
    const endPage = Math.min(totalPages - 1, safeCurrentPage + delta);

    // Primera página
    pages.push(
      <button
        key={1}
        className={`btn ${safeCurrentPage === 1 ? 'btn-active' : ''}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );

    // Elipsis inicial
    if (safeCurrentPage > delta + 2) {
      pages.push(
        <span key="dots-start" className="flex items-center px-2">
          ...
        </span>
      );
    }

    // Páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`btn ${safeCurrentPage === i ? 'btn-active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Elipsis final
    if (safeCurrentPage < totalPages - delta - 1) {
      pages.push(
        <span key="dots-end" className="flex items-center px-2">
          ...
        </span>
      );
    }

    // Última página
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          className={`btn ${safeCurrentPage === totalPages ? 'btn-active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[900px] top-[5%] p-4 flex flex-col max-h-[85vh]">
        <ModalHeader>
          <ModalTitle>Agregar Miembros</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        {/* Buscador */}
        <div className="px-2 mt-2 pb-3">
          <label className="input input-sm">
            <KeenIcon icon="magnifier" />
            <input
              placeholder="Buscar por nombre o correo..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <ModalBody className="grid gap-1 px-0 py-5 overflow-y-auto min-h-0 scrollbar-hide">
          {paginatedPersons.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              {search ? 'No se encontraron usuarios con ese criterio.' : 'No hay usuarios disponibles.'}
            </p>
          ) : (
            paginatedPersons.map((person: any) => (
              <div key={person.id} className="flex items-center gap-4 p-2 border-b">
                <img
                  src={person.persona?.rutaFotoUrl}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                />

                <div className="flex-1">
                  <p className="font-bold">
                    {person.persona?.nombre1 ?? ''} {person.persona?.nombre2 ?? ''}{' '}
                    {person.persona?.apellido1 ?? ''} {person.persona?.apellido2 ?? ''}
                  </p>
                  <p className="text-sm text-gray-600">{person.email}</p>
                </div>

                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={selectedIds.includes(person.id)}
                  onChange={() => handleCheckboxChange(person.id)}
                />
              </div>
            ))
          )}

          {/* Controles de paginación (estilo plantilla) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-4 px-4 text-gray-600 text-2sm font-medium">
              <div className="flex items-center gap-2">
                Mostrando
                <select
                  className="select select-sm w-16"
                  value={perPage}
                  onChange={(e) => setPerPage(+e.target.value)}
                >
                  <option value={PER_PAGE}>{PER_PAGE}</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                Por página
              </div>

              <div className="flex items-center gap-4 order-1 md:order-2">
                <span>
                  {(safeCurrentPage - 1) * perPage + 1} -{' '}
                  {Math.min(safeCurrentPage * perPage, total)} de {total}
                </span>
                <div className="pagination flex gap-2">
                  <button
                    className="btn"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                  >
                    <KeenIcon icon="black-left" />
                  </button>

                  {renderPageButtons()}

                  <button
                    className="btn"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                  >
                    <KeenIcon icon="black-right" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={selectedIds.length === 0}
            >
              Guardar ({selectedIds.length})
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalBoardUsers };
