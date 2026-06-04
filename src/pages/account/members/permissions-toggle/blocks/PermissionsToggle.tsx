import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { CommonHexagonBadge } from '@/partials/common';
import { PermissionModel } from '../models/_Permission';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolbarDescription } from '@/partials/toolbar';
import { Container } from '@/components/container';
import { useSnackbar } from 'notistack';
import { RoleModel } from '../../roles/models/_Role';
import Swal from 'sweetalert2';
import icons from './icons';

/* ────────────────────────────────────────────────────────────────────────────
 * Helper: build a tree from flat permission list
 * ──────────────────────────────────────────────────────────────────────────── */
const buildTree = (flat: PermissionModel[]): PermissionModel[] => {
  const map = new Map<number, PermissionModel>();
  const roots: PermissionModel[] = [];

  flat.forEach((p) => {
    map.set(p.id, { ...p, children: [] });
  });

  map.forEach((node) => {
    // Use != null to allow parent id = 0 (if any) and avoid falsy checks
    if (node.idPermissionPadre != null && map.has(node.idPermissionPadre)) {
      map.get(node.idPermissionPadre)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Helper: collect all descendant IDs (for cycle prevention)
 * ──────────────────────────────────────────────────────────────────────────── */
const collectDescendantIds = (nodeId: number, flat: PermissionModel[]): Set<number> => {
  const ids = new Set<number>();
  const queue = flat.filter((p) => p.idPermissionPadre === nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    ids.add(current.id);
    flat.filter((p) => p.idPermissionPadre === current.id).forEach((child) => queue.push(child));
  }
  return ids;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
const PermissionsToggle = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionModel[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingParent, setUpdatingParent] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [savingDescriptionId, setSavingDescriptionId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    icon: '',
    path: '',
    idPermissionPadre: null as number | null
  });
  const [modalMode, setModalMode] = useState<'edit' | 'create'>('edit');

  const { enqueueSnackbar } = useSnackbar();
  const [createSaving, setCreateSaving] = useState(false);

  /* ── Fetch data ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      try {
        const rolesResponse = await axios.get('roles');
        // Normalize role IDs to numbers
        const rolesData = rolesResponse.data || [];
        setRoles(
          rolesData.map((r: any) => ({
            ...r,
            id: Number(r.id)
          })) as RoleModel[]
        );

        const permissionsResponse = await axios.get('permisos');
        const permissionsData = permissionsResponse.data || [];
        // Normalize permission IDs and parent IDs to numbers (or null)
        const normalized = permissionsData.map(
          (p: any) =>
            ({
              ...p,
              id: Number(p.id),
              idPermissionPadre:
                p.idPermissionPadre === null ||
                p.idPermissionPadre === undefined ||
                p.idPermissionPadre === ''
                  ? null
                  : Number(p.idPermissionPadre)
            }) as PermissionModel
        );
        setPermissions(normalized);
      } catch (err) {
        setError('Hubo un error al obtener los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchRolesAndPermissions();
  }, []);

  /* ── Build tree from flat list ───────────────────────────────────────── */
  const tree = useMemo(() => buildTree(permissions), [permissions]);

  // Filter tree by search query (name or description)
  const filterTreeByQuery = useCallback(
    (nodes: PermissionModel[], q: string): PermissionModel[] => {
      if (!q) return nodes;
      const lower = q.toLowerCase();

      return nodes.reduce<PermissionModel[]>((acc, node) => {
        const children = node.children ? filterTreeByQuery(node.children!, q) : [];
        const matches =
          node.name.toLowerCase().includes(lower) ||
          (node.description || '').toLowerCase().includes(lower);

        if (matches || children.length > 0) {
          acc.push({ ...node, children });
        }
        return acc;
      }, []);
    },
    []
  );

  const filteredTree = useMemo(
    () => filterTreeByQuery(tree, searchQuery),
    [tree, searchQuery, filterTreeByQuery]
  );

  // When searching, expand results to reveal matches
  useEffect(() => {
    if (!searchQuery) return;
    const collectIds = (nodes: PermissionModel[], acc: Set<number>) => {
      nodes.forEach((n) => {
        acc.add(n.id);
        if (n.children && n.children.length) collectIds(n.children, acc);
      });
    };

    const allMatchIds = new Set<number>();
    collectIds(filteredTree, allMatchIds);
    setExpandedNodes(allMatchIds);
  }, [searchQuery, filteredTree]);

  // When clearing search, collapse back to previous state (empty)
  useEffect(() => {
    if (!searchQuery) setExpandedNodes(new Set());
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTree.length / pageSize));

  const paginatedRoots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTree.slice(start, start + pageSize);
  }, [filteredTree, currentPage, pageSize]);

  /* ── Role change ─────────────────────────────────────────────────────── */
  const handleRoleChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = Number(event.target.value);
    setSelectedRole(roleId);

    const response = await axios.get(`permisos_rol?rol=${roleId}`);
    setActivePermissions(response.data);
  }, []);

  /* ── Toggle permission ───────────────────────────────────────────────── */
  const handlePermissionChange = useCallback(
    (permissionName: string) => {
      const permission = permissions.find((p) => p.name === permissionName);
      if (!permission) return;
      // Collect descendant information
      const descendantIds = collectDescendantIds(permission.id, permissions);
      const hasChildren = descendantIds.size > 0;
      const descendantNames = permissions.filter((p) => descendantIds.has(p.id)).map((p) => p.name);

      // Collect ancestors (parents chain) to auto-select them when selecting a child
      const collectAncestorIds = (node: PermissionModel, flat: PermissionModel[]) => {
        const ids: number[] = [];
        let parentId = node.idPermissionPadre ?? null;
        while (parentId != null) {
          const parent = flat.find((p) => p.id === parentId);
          if (!parent) break;
          ids.push(parent.id);
          parentId = parent.idPermissionPadre ?? null;
        }
        return ids;
      };

      const ancestorIds = collectAncestorIds(permission, permissions);
      const ancestorNames = permissions
        .filter((p) => ancestorIds.includes(p.id))
        .map((p) => p.name);

      // If selecting (not unchecking) and ancestors are not selected, auto-select them and notify
      if (!activePermissions.includes(permissionName) && ancestorNames.length > 0) {
        const ancestorsToAdd = ancestorNames.filter((n) => !activePermissions.includes(n));
        if (ancestorsToAdd.length > 0) {
          setActivePermissions((current) => {
            const next = new Set(current);
            ancestorsToAdd.forEach((n) => next.add(n));
            next.add(permissionName);
            return Array.from(next);
          });
          enqueueSnackbar(
            `Se seleccionará también el/los padre(s) ${ancestorsToAdd.join(', ')} para que se pueda ver el sidebar`,
            { variant: 'info' }
          );
          return;
        }
      }

      const allNames = [permissionName, ...descendantNames];

      setActivePermissions((prevState) => {
        // If already checked, just uncheck everything
        if (prevState.includes(permissionName)) {
          return prevState.filter((n) => !allNames.includes(n));
        }

        // If it's a parent permission and not yet checked, ask user
        if (hasChildren) {
          Swal.fire({
            title: '¿Incluir permisos secundarios?',
            html: `<p>Este permiso tiene ${descendantNames.length} permiso(s) secundario(s).</p><p>¿Deseas asignar también todos los permisos secundarios?</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, incluir todos',
            cancelButtonText: 'No, solo este',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d'
          }).then((result) => {
            if (result.isConfirmed) {
              // Add parent + all children
              setActivePermissions((current) => {
                const next = new Set(current);
                allNames.forEach((n) => next.add(n));
                return Array.from(next);
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // Add only parent
              setActivePermissions((current) => {
                const next = new Set(current);
                next.add(permissionName);
                return Array.from(next);
              });
            }
          });
          return prevState;
        } else {
          // No children, just add the permission
          const next = new Set(prevState);
          next.add(permissionName);
          return Array.from(next);
        }
      });
    },
    [permissions, activePermissions, enqueueSnackbar]
  );

  /* ── Description editing ────────────────────────────────────────────── */
  const cancelEditDescription = useCallback(() => {
    // Modal is handled by React state, no additional action needed
  }, []);

  const saveDescription = useCallback(
    async (
      nodeId: number,
      fieldsToSave: {
        name?: string | null;
        description: string;
        icon?: string | null;
        path?: string | null;
        idPermissionPadre?: number | null;
      }
    ) => {
      setSavingDescriptionId(nodeId);
      const payload = {
        name: fieldsToSave.name ?? undefined,
        description: fieldsToSave.description,
        descripcion: fieldsToSave.description,
        icon: fieldsToSave.icon ?? null,
        path: fieldsToSave.path ?? null,
        idPermissionPadre: fieldsToSave.idPermissionPadre ?? null
      };
      try {
        // Try PUT first. If the server rejects with 405, fallback to POST.
        try {
          await axios.put(`permisos/${nodeId}`, payload);
        } catch (err: unknown) {
          if (axios.isAxiosError(err) && err.response?.status === 405) {
            await axios.post(`permisos/${nodeId}`, payload);
          } else {
            throw err;
          }
        }

        setPermissions(
          (prev) =>
            prev.map((p) =>
              p.id === nodeId
                ? {
                    ...p,
                    name: fieldsToSave.name ?? p.name,
                    description: fieldsToSave.description,
                    icon: fieldsToSave.icon ?? undefined,
                    path: fieldsToSave.path ?? undefined,
                    idPermissionPadre: fieldsToSave.idPermissionPadre ?? null
                  }
                : p
            ) as PermissionModel[]
        );
        enqueueSnackbar('Descripción actualizada', { variant: 'success' });
        cancelEditDescription();
      } catch (err) {
        enqueueSnackbar('Error al actualizar la descripción', { variant: 'error' });
      } finally {
        setSavingDescriptionId(null);
      }
    },
    [enqueueSnackbar, cancelEditDescription]
  );

  const handleSaveEditModal = useCallback(async () => {
    if (modalMode === 'edit') {
      if (editingNodeId === null) return;

      const fieldsToSave = {
        name: editFormData.name,
        description: editFormData.description,
        icon: editFormData.icon || null,
        path: editFormData.path || null,
        idPermissionPadre: editFormData.idPermissionPadre
      };

      await saveDescription(editingNodeId, fieldsToSave);
      setIsEditModalOpen(false);
      setEditingNodeId(null);
    } else {
      // create mode
      if (!editFormData.name.trim()) {
        enqueueSnackbar('El nombre es requerido', { variant: 'warning' });
        return;
      }
      setCreateSaving(true);
      try {
        const payload = {
          name: editFormData.name,
          description: editFormData.description || null,
          idPermissionPadre: editFormData.idPermissionPadre,
          icon: editFormData.icon || null,
          path: editFormData.path || null
        };

        const response = await axios.post('permisos/crear', payload);
        const created = response.data.permission || response.data;

        setPermissions((prev) => [...prev, created] as PermissionModel[]);
        enqueueSnackbar('Permiso creado correctamente', { variant: 'success' });
        setIsEditModalOpen(false);
        setEditFormData({ name: '', description: '', icon: '', path: '', idPermissionPadre: null });
      } catch (err) {
        enqueueSnackbar('Error al crear el permiso', { variant: 'error' });
      } finally {
        setCreateSaving(false);
      }
    }
  }, [editingNodeId, editFormData, saveDescription, enqueueSnackbar]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingNodeId(null);
  }, []);

  const startEditDescription = useCallback(
    (nodeId: number, current: string, node?: PermissionModel) => {
      setModalMode('edit');
      setEditingNodeId(nodeId);
      setEditFormData({
        name: node?.name || '',
        description: node?.description || '',
        icon: node?.icon || '',
        path: node?.path || '',
        idPermissionPadre: node?.idPermissionPadre ?? null
      });
      setIsEditModalOpen(true);
    },
    []
  );

  /* ── Save role permissions ───────────────────────────────────────────── */
  const assignPermissions = useCallback(async () => {
    if (selectedRole === null) return;

    setSaving(true);
    try {
      const permissionIds = permissions
        .filter((permission) => activePermissions.includes(permission.name))
        .map((permission) => permission.id);

      const payload = {
        idRol: selectedRole,
        funciones: permissionIds
      };

      await axios.put('asignar_rol_permiso', payload);
      enqueueSnackbar('Permisos asignados correctamente', {
        variant: 'success'
      });
    } catch (err) {
      enqueueSnackbar('Hubo un error al asignar los permisos', {
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [selectedRole, activePermissions, permissions, enqueueSnackbar]);

  /* ── Set parent (hierarchy) ──────────────────────────────────────────── */
  const handleSetParent = useCallback(
    async (childId: number, newParentId: number | null) => {
      setUpdatingParent(childId);
      try {
        await axios.post(`permissions/${childId}/set-parent`, {
          parent_id: newParentId
        });

        // Optimistic UI update
        setPermissions((prev) =>
          prev.map((p) => (p.id === childId ? { ...p, idPermissionPadre: newParentId } : p))
        );
        enqueueSnackbar('Padre actualizado correctamente', {
          variant: 'success'
        });
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'Error al actualizar el padre';
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        setUpdatingParent(null);
      }
    },
    [enqueueSnackbar]
  );

  /* ── Confirm parent change ───────────────────────────────────────────── */
  const handleParentChange = useCallback(
    (childId: number, newParentId: number | null) => {
      const child = permissions.find((p) => p.id === childId);
      if (!child) return;

      const currentParent =
        child.idPermissionPadre != null
          ? permissions.find((p) => p.id === child.idPermissionPadre)
          : null;
      const newParent = newParentId ? permissions.find((p) => p.id === newParentId) : null;

      const currentParentText = currentParent ? currentParent.name : 'Raíz (sin padre)';
      const newParentText = newParent ? newParent.name : 'Raíz (sin padre)';

      Swal.fire({
        title: '¿Cambiar padre del permiso?',
        html: `
          <div style="text-align: left;">
            <p><strong>Permiso:</strong> ${child.name}</p>
            <p><strong>Padre actual:</strong> ${currentParentText}</p>
            <p><strong>Nuevo padre:</strong> ${newParentText}</p>
            <p style="margin-top: 12px; color: #666;">Esta acción reorganizará la jerarquía de permisos.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          handleSetParent(childId, newParentId);
        }
      });
    },
    [permissions, handleSetParent]
  );

  /* ── Expand / Collapse ───────────────────────────────────────────────── */
  const toggleExpand = useCallback((nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  /* ── Render a tree node ──────────────────────────────────────────────── */
  const renderNode = useCallback(
    (node: PermissionModel, depth: number = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const isChecked = activePermissions.includes(node.name);
      const isUpdating = updatingParent === node.id;

      // Build selectable parent options: exclude self + descendants (cycle prevention)
      const descendantIds = collectDescendantIds(node.id, permissions);
      const selectableParents = permissions.filter(
        (p) => p.id !== node.id && !descendantIds.has(p.id)
      );

      return (
        <div key={node.id}>
          {/* ── Node row ────────────────────────────────────────────── */}
          <div
            className={`
              rounded-xl border p-4 flex items-center justify-between gap-2.5
              transition-all duration-200
              ${depth > 0 ? 'border-l-4 border-l-primary/20' : ''}
            `}
            style={depth > 0 ? { marginLeft: `${depth * 32}px` } : undefined}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Expand / Collapse toggle */}
              <button
                type="button"
                className={`
                  flex items-center justify-center w-6 h-6 rounded
                  transition-colors duration-150
                  ${hasChildren ? 'hover:bg-gray-200 cursor-pointer' : 'opacity-0 pointer-events-none'}
                `}
                onClick={() => toggleExpand(node.id)}
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                <KeenIcon icon={isExpanded ? 'down' : 'right'} className="text-sm text-gray-500" />
              </button>

              <CommonHexagonBadge
                stroke="stroke-gray-300"
                fill={depth === 0 ? 'fill-primary-light' : 'fill-gray-100'}
                size="size-[45px]"
                badge={
                  <KeenIcon
                    icon={depth === 0 ? 'shield-tick' : 'security-user'}
                    className={`text-lg ${depth === 0 ? 'text-primary' : 'text-gray-500'}`}
                  />
                }
              />

              <div className="flex flex-col gap-1 min-w-0">
                <span className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900">
                  {node.name}
                  {hasChildren && (
                    <span className="text-2xs text-gray-400 font-normal">
                      ({node.children!.length} sub-permisos)
                    </span>
                  )}
                </span>
                <div className="text-2sm text-gray-700 truncate flex items-center gap-2">
                  <span className="truncate">{node.description}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => startEditDescription(node.id, node.description || '', node)}
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 min-w-[320px]">
              {/* Parent selector */}
              <ParentSearchSelect
                value={node.idPermissionPadre ?? null}
                options={selectableParents}
                disabled={isUpdating}
                onChange={(newParentId) => handleParentChange(node.id, newParentId)}
              />

              {/* Permission toggle */}
              <div className="switch switch-sm">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handlePermissionChange(node.name)}
                />
              </div>
            </div>
          </div>

          {/* ── Children (recursive) ─────────────────────────────────── */}
          {hasChildren && isExpanded && (
            <div className="mt-1 space-y-1">
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [
      activePermissions,
      expandedNodes,
      handlePermissionChange,
      handleParentChange,
      permissions,
      toggleExpand,
      updatingParent,
      startEditDescription
    ]
  );

  if (error) return <div>{error}</div>;

  return (
    <Container>
      <div className="card">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold leading-none text-gray-900 mb-2">
              Asignar Permisos
            </h1>
            <ToolbarDescription>
              Gestiona y asigna permisos a los roles – vista jerárquica
            </ToolbarDescription>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              className="input input-sm w-64"
              placeholder="Buscar permisos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select className="select" value={selectedRole || ''} onChange={handleRoleChange}>
              <option value="" disabled>
                Seleccionar un rol
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-2 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
              onClick={() => {
                setModalMode('create');
                setEditFormData({
                  name: '',
                  description: '',
                  icon: '',
                  path: '',
                  idPermissionPadre: null
                });
                setIsEditModalOpen(true);
              }}
            >
              Crear permiso
            </button>
          </div>
        </div>

        {/* ── Tree body ───────────────────────────────────────────────── */}
        <div className="card-body py-5 lg:py-7.5 space-y-2">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Cargando permisos…</p>
          ) : tree.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay permisos registrados.</p>
          ) : (
            paginatedRoots.map((root) => renderNode(root))
          )}

          {/* Pagination controls */}
          {tree.length > pageSize && (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Mostrar:</label>
                <select
                  className="select select-sm pr-8"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end items-center pt-4">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={assignPermissions}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Permission Modal */}
      <Modal open={isEditModalOpen} onClose={handleCloseEditModal}>
        <ModalContent className="max-w-2xl min-w-[500px]">
          <ModalHeader>
            <ModalTitle>
              <div className="p-2">
                {modalMode === 'create'
                  ? 'Crear Permiso'
                  : `Editar Permiso: ${permissions.find((p) => p.id === editingNodeId)?.name || ''}`}
              </div>
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="block font-semibold text-sm text-gray-900 mb-2">
                  Nombre {modalMode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  className="input input-sm w-full"
                  placeholder="Ej: GESTION_USUARIOS"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              {/* Descripción */}
              <div>
                <label className="block font-semibold text-sm text-gray-900 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  className="input input-sm w-full"
                  placeholder="Descripción del permiso"
                  value={editFormData.description}
                  data-preserve-case
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                />
                <p className="text-2xs text-gray-600 mt-1">
                  Con esta descripción se visualizará en el sidebar
                </p>
              </div>

              {/* Ícono */}
              <div>
                <label className="block font-semibold text-sm text-gray-900 mb-2">Ícono</label>
                <IconPickerField
                  value={editFormData.icon}
                  onChange={(v) => setEditFormData({ ...editFormData, icon: v })}
                />
                <p className="text-2xs text-gray-600 mt-1">
                  🎨 Nombre del ícono (KeenIcon) para mostrar visualmente
                </p>
              </div>

              {/* Ruta (Path) */}
              <div>
                <label className="block font-semibold text-sm text-gray-900 mb-2">
                  Ruta (Path)
                </label>
                <input
                  type="text"
                  className="input input-sm w-full"
                  placeholder="Ej: /admin/usuarios"
                  value={editFormData.path}
                  data-preserve-case
                  onChange={(e) => setEditFormData({ ...editFormData, path: e.target.value })}
                />
                <p className="text-2xs text-gray-600 mt-1">
                  🔗 Ruta de navegación asociada a este permiso
                </p>
              </div>

              {/* Padre */}
              <div>
                <label className="block font-semibold text-sm text-gray-900 mb-2">
                  Permiso padre
                </label>
                <ParentSearchSelect
                  value={editFormData.idPermissionPadre}
                  options={
                    modalMode === 'edit' && editingNodeId
                      ? permissions.filter((p) => {
                          const descendants = collectDescendantIds(editingNodeId, permissions);
                          return p.id !== editingNodeId && !descendants.has(p.id);
                        })
                      : permissions
                  }
                  onChange={(newParentId) =>
                    setEditFormData({ ...editFormData, idPermissionPadre: newParentId })
                  }
                />
                <p className="text-2xs text-gray-600 mt-1">
                  Deja en "Raíz (sin padre)" si es de nivel superior
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCloseEditModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveEditModal}
                  disabled={
                    modalMode === 'edit' ? savingDescriptionId === editingNodeId : createSaving
                  }
                >
                  {modalMode === 'edit'
                    ? savingDescriptionId === editingNodeId
                      ? 'Guardando...'
                      : 'Guardar cambios'
                    : createSaving
                      ? 'Creando...'
                      : 'Crear permiso'}
                </button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
});

export default PermissionsToggle;

/* ────────────────────────────────────────────────────────────────────────────
 * Component: Searchable parent selector
 * ──────────────────────────────────────────────────────────────────────────── */
interface ParentSearchSelectProps {
  value: number | null;
  options: PermissionModel[];
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

const IconPickerField = React.memo(
  ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
      const q = query.toLowerCase();
      return q ? icons.filter((ic) => ic.nombre.toLowerCase().includes(q)) : icons;
    }, [query]);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
          setQuery('');
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <div ref={ref}>
        {/* Trigger button */}
        <button
          type="button"
          className="w-full select select-sm flex items-center justify-between gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`flex items-center gap-2 ${!value ? 'text-gray-400' : ''}`}>
            {value && <KeenIcon icon={value} className="text-base text-primary" />}
            <span className="truncate">{value || 'Seleccionar ícono…'}</span>
          </span>
          <KeenIcon icon="down" className="text-xs text-gray-500 shrink-0" />
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 w-full rounded-xl border shadow-dropdown overflow-hidden"
            style={{ backgroundColor: 'var(--tw-light)', borderColor: 'var(--tw-gray-200)' }}
          >
            {/* Search */}
            <div className="p-2 border-b" style={{ borderColor: 'var(--tw-gray-200)' }}>
              <input
                autoFocus
                type="text"
                className="input input-sm w-full"
                placeholder="Buscar ícono..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {/* Grid */}
            <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-6 gap-1">
              {/* Opción vacía */}
              <button
                type="button"
                title="Sin ícono"
                className={`flex items-center justify-center h-9 rounded-lg border text-xs transition-colors
                  ${!value ? 'border-primary bg-primary-light' : 'border-gray-300 hover:bg-gray-100'}`}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="text-gray-400">—</span>
              </button>
              {filtered.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  title={ic.nombre}
                  className={`flex items-center justify-center h-9 rounded-lg border transition-colors
                    ${
                      value === ic.nombre
                        ? 'border-primary bg-primary-light'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  onClick={() => {
                    onChange(ic.nombre);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <KeenIcon icon={ic.nombre} className="text-lg" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-6 text-center text-sm text-gray-400 py-3">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

/* ────────────────────────────────────────────────────────────────────────────
 * Component: Searchable parent selector
 * ──────────────────────────────────────────────────────────────────────────── */
interface ParentSearchSelectProps {
  value: number | null;
  options: PermissionModel[];
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

const ParentSearchSelect = React.memo(
  ({ value, options, disabled, onChange }: ParentSearchSelectProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = value
      ? (options.find((p) => p.id === value)?.name ?? 'Raíz (sin padre)')
      : 'Raíz (sin padre)';

    const filtered = useMemo(() => {
      const q = query.toLowerCase();
      return q ? options.filter((p) => p.name.toLowerCase().includes(q)) : options;
    }, [options, query]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setQuery('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: number | null) => {
      onChange(id);
      setOpen(false);
      setQuery('');
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          className="select select-sm w-full text-left flex items-center justify-between gap-1 truncate"
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span className="truncate text-sm">{selectedLabel}</span>
          <KeenIcon icon="down" className="text-xs text-gray-500 shrink-0" />
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 w-full rounded-xl border shadow-dropdown overflow-hidden"
            style={{
              backgroundColor: 'var(--tw-light)',
              borderColor: 'var(--tw-gray-200)'
            }}
          >
            {/* Search input */}
            <div className="p-2" style={{ borderBottom: '1px solid var(--tw-gray-200)' }}>
              <input
                autoFocus
                type="text"
                className="input input-sm w-full"
                placeholder="Buscar permiso..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Options list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              <li>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-gray-100
                    ${value === null ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  onClick={() => handleSelect(null)}
                >
                  Raíz (sin padre)
                </button>
              </li>

              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 text-center">Sin resultados</li>
              ) : (
                filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-gray-100
                        ${
                          value === p.id ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'
                        }`}
                      onClick={() => handleSelect(p.id)}
                    >
                      {p.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
