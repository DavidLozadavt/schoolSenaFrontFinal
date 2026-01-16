// // import {
// //   ChannelStats,
// //   EarningsChart,
// //   EntryCallout,
// //   Highlights,
// //   TeamMeeting,
// //   Teams
// // } from './blocks';
// import React, { useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { DataGrid, KeenIcon } from '@/components';
// import { ColumnDef } from '@tanstack/react-table';
// import axios from 'axios';


// interface IPaymentMethod {
//   id: number;
//   detalleMedioPago: string;
// }

// const Demo1LightSidebarContent = () => {
//   const storageFilterId = 'payments-filter';

//   const columns = useMemo<ColumnDef<IPaymentMethod>[]>(
//     () => [
//       {
//         accessorFn: (row) => row.id,
//         id: 'id',
//         header: () => 'Código',
//         enableSorting: true,
//         cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
//         meta: {
//           className: 'w-[100px]',
//           cellClassName: 'text-gray-700 font-normal'
//         }
//       },
//       {
//         accessorFn: (row) => row.detalleMedioPago,
//         id: 'nombreMedio',
//         header: () => 'Nombre Medio de Pago',
//         enableSorting: true,
//         cell: (info) => (
//           <Link
//             className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
//             to="#"
//           >
//             {info.row.original.detalleMedioPago}
//           </Link>
//         ),
//         meta: {
//           className: 'min-w-[250px]',
//           cellClassName: 'text-gray-700 font-normal'
//         }
//       },
//       {
//         id: 'edit',
//         header: () => '',
//         enableSorting: false,
//         cell: ({ row }) => (
//           <button
//             className="btn btn-sm btn-icon btn-clear btn-light"
//             onClick={() => alert(`Clicked on edit for ${row.original.detalleMedioPago}`)}
//           >
//             <KeenIcon icon="notepad-edit" />
//           </button>
//         ),
//         meta: {
//           className: 'w-[60px]'
//         }
//       },
//       {
//         id: 'delete',
//         header: () => '',
//         enableSorting: false,
//         cell: ({ row }) => (
//           <button
//             className="btn btn-sm btn-icon btn-clear btn-light"
//             onClick={() => alert(`Clicked on delete for ${row.original.detalleMedioPago}`)}
//           >
//             <KeenIcon icon="trash" />
//           </button>
//         ),
//         meta: {
//           className: 'w-[60px]'
//         }
//       }
//     ],
//     []
//   );

//   const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>('');
//   const [searchTerm, setSearchTerm] = useState(() => {
//     return localStorage.getItem(storageFilterId) || '';
//   });

//   useEffect(() => {
//     localStorage.setItem(storageFilterId, searchTerm);
//   }, [searchTerm]);

//   useEffect(() => {
//     const fetchPaymentMethods = async () => {
//       try {
//         const response = await axios.get('medio_pagos');
//         setPaymentMethods(response.data);
//       } catch (err) {
//         setError(`Error fetching payment methods: ${err}`);
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     // Llama a la función después de definirla
//     fetchPaymentMethods();
//   }, []); // Dependencias vacías, se ejecutará una vez al montar el componente
  
  
  

//   const filteredData = useMemo(() => {
//     if (!searchTerm) return paymentMethods;
//     return paymentMethods.filter((payment) =>
//       payment.detalleMedioPago.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [searchTerm, paymentMethods]);

//   if (loading) {
//     return <div>Loading...</div>; // Muestra un mensaje de carga mientras se obtienen los datos
//   }

//   if (error) {
//     return <div>{error}</div>; // Muestra el error si ocurre
//   }

//   return (
//     <div className="card card-grid min-w-full">
//       <div className="card-header flex-wrap py-5">
//         <h3 className="card-title">Métodos de Pago</h3>
//         <div className="flex gap-6">
//           <div className="relative">
//             <KeenIcon
//               icon="magnifier"
//               className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
//             />
//             <input
//               type="text"
//               placeholder="Buscar Medio de Pago"
//               className="input input-sm pl-8"
//               value={searchTerm}
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="card-body">
//         <DataGrid
//           key={JSON.stringify(filteredData)}
//           columns={columns}
//           data={filteredData}
//           pagination={{ size: 10 }}
//           sorting={[{ id: 'nombreMedio', desc: false }]}
//         />
//       </div>
//     </div>
//   );
// };

import {
  ChannelStats,
  EarningsChart,
  EntryCallout,
  Highlights,
  TeamMeeting,
  Teams
} from './blocks';

const Demo1LightSidebarContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-5 lg:gap-7.5 h-full items-stretch">
            <ChannelStats />
          </div>
        </div>

        <div className="lg:col-span-2">
          <EntryCallout className="h-full" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <Highlights limit={3} />
        </div>

        <div className="lg:col-span-2">
          <EarningsChart />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <TeamMeeting />
        </div>

        <div className="lg:col-span-2">
          <Teams />
        </div>
      </div>
    </div>
  );
};

export { Demo1LightSidebarContent };
