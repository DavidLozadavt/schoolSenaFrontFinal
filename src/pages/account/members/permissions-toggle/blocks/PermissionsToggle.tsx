import { KeenIcon } from '@/components';
import { CommonHexagonBadge } from '@/partials/common';
import { PermissionModel } from '../models/_Permission';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ToolbarDescription } from '@/partials/toolbar';
import { Container } from '@/components/container';
import { useSnackbar } from 'notistack';
import { RoleModel } from '../../roles/models/_Role';

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
    if (node.idPermissionPadre && map.has(node.idPermissionPadre)) {
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
const collectDescendantIds = (
  nodeId: number,
  flat: PermissionModel[]
): Set<number> => {
  const ids = new Set<number>();
  const queue = flat.filter((p) => p.idPermissionPadre === nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    ids.add(current.id);
    flat
      .filter((p) => p.idPermissionPadre === current.id)
      .forEach((child) => queue.push(child));
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
  const [editingDescriptionId, setEditingDescriptionId] = useState<number | null>(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState<string>('');
  const [savingDescriptionId, setSavingDescriptionId] = useState<number | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  /* ── Fetch data ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      try {
        const rolesResponse = await axios.get('roles');
        setRoles(rolesResponse.data);
        const permissionsResponse = await axios.get('permisos');
        setPermissions(permissionsResponse.data);
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

  const filteredTree = useMemo(() => filterTreeByQuery(tree, searchQuery), [tree, searchQuery, filterTreeByQuery]);

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
  const handleRoleChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const roleId = Number(event.target.value);
      setSelectedRole(roleId);

      const response = await axios.get(`permisos_rol?rol=${roleId}`);
      setActivePermissions(response.data);
    },
    []
  );

  /* ── Toggle permission ───────────────────────────────────────────────── */
  const handlePermissionChange = useCallback((permissionName: string) => {
    setActivePermissions((prevState) => {
      const permission = permissions.find((p) => p.name === permissionName);
      if (!permission) return prevState;

      // collect descendant ids and map to names
      const descendantIds = collectDescendantIds(permission.id, permissions);
      const descendantNames = permissions
        .filter((p) => descendantIds.has(p.id))
        .map((p) => p.name);

      const allNames = [permissionName, ...descendantNames];

      if (prevState.includes(permissionName)) {
        // uncheck: remove the permission and all its descendants
        return prevState.filter((n) => !allNames.includes(n));
      } else {
        // check: add the permission and all its descendants (avoid duplicates)
        const next = new Set(prevState);
        allNames.forEach((n) => next.add(n));
        return Array.from(next);
      }
    });
  }, [permissions]);

  /* ── Description editing ────────────────────────────────────────────── */
  const startEditDescription = useCallback((nodeId: number, current: string) => {
    setEditingDescriptionId(nodeId);
    setEditingDescriptionValue(current || '');
  }, []);

  const cancelEditDescription = useCallback(() => {
    setEditingDescriptionId(null);
    setEditingDescriptionValue('');
  }, []);

  const saveDescription = useCallback(
    async (nodeId: number) => {
      setSavingDescriptionId(nodeId);
      const payload = { description: editingDescriptionValue, descripcion: editingDescriptionValue };
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

        setPermissions((prev) =>
          prev.map((p) => (p.id === nodeId ? { ...p, description: editingDescriptionValue } : p))
        );
        enqueueSnackbar('Descripción actualizada', { variant: 'success' });
        cancelEditDescription();
      } catch (err) {
        enqueueSnackbar('Error al actualizar la descripción', { variant: 'error' });
      } finally {
        setSavingDescriptionId(null);
      }
    },
    [editingDescriptionValue, enqueueSnackbar, cancelEditDescription]
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
        funciones: permissionIds,
      };

      await axios.put('asignar_rol_permiso', payload);
      enqueueSnackbar('Permisos asignados correctamente', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar('Hubo un error al asignar los permisos', {
        variant: 'error',
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
          parent_id: newParentId,
        });

        // Optimistic UI update
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === childId ? { ...p, idPermissionPadre: newParentId } : p
          )
        );
        enqueueSnackbar('Padre actualizado correctamente', {
          variant: 'success',
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
              ${depth > 0 ? 'ml-8 border-l-4 border-l-primary/20' : ''}
            `}
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
                <KeenIcon
                  icon={isExpanded ? 'down' : 'right'}
                  className="text-sm text-gray-500"
                />
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
                  {editingDescriptionId === node.id ? (
                    <>
                      <input
                        className="input input-sm w-full"
                        value={editingDescriptionValue}
                        onChange={(e) => setEditingDescriptionValue(e.target.value)}
                        placeholder="Descripción"
                        data-preserve-case
                      />
                      <button
                        type="button"
                        className="btn btn-xs"
                        onClick={() => saveDescription(node.id)}
                        disabled={savingDescriptionId === node.id}
                      >
                        {savingDescriptionId === node.id ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={cancelEditDescription}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="truncate">{node.description}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => startEditDescription(node.id, node.description || '')}
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Parent selector */}
              <select
                className="select select-sm w-44"
                value={node.idPermissionPadre ?? ''}
                disabled={isUpdating}
                onChange={(e) =>
                  handleSetParent(
                    node.id,
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Raíz (sin padre)</option>
                {selectableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

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
      handleSetParent,
      permissions,
      toggleExpand,
      updatingParent,
      editingDescriptionId,
      editingDescriptionValue,
      startEditDescription,
      cancelEditDescription,
      saveDescription,
      savingDescriptionId,
      setEditingDescriptionValue,
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
            <select
              className="select"
              value={selectedRole || ''}
              onChange={handleRoleChange}
            >
              <option value="" disabled>
                Seleccionar un rol
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Tree body ───────────────────────────────────────────────── */}
        <div className="card-body py-5 lg:py-7.5 space-y-2">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Cargando permisos…</p>
          ) : tree.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay permisos registrados.
            </p>
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
    </Container>
  );
});

export default PermissionsToggle;
