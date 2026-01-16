export interface UltimoHistorialPrecio {
    id: number;
    valorCompra: string;
    ValorVenta: string;
    idProducto: number;
    fechaActualizacion: string;
  }
  
  export interface Producto {
    id: number;
    serial: string;
    modelo: string;
    estado: string;
    caracteristicas: string;
    urlProducto: string;
    rutaProductoUrl: string;
    valorVenta: any;
    ultimoHistorialPrecio: UltimoHistorialPrecio;
  }
  
  export interface ProductoItem {
    id: number;
    cantidad: number;
    producto: Producto;
    idShoppingCart?: any;
  }
  

  
 export type ItemSeleccionado =
   | {
       tipo: 'producto';
       producto: ProductoItem;
       cantidad: number;
       idAsignacion?: number; 
     }
   | {
       tipo: 'servicio';
       id: number;
       nombre: string;
       valorUnitario: number;
       cantidad: number;
       idAsignacion?: number
     };
 


  
  