import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel } from '../components/AnimatedComponents';
import { 
  QrCodeIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon,
  TableCellsIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface Table {
  id: number;
  number: string;
  area: string;
  capacity: number;
  status: string;
}

export const QRManager: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://172.29.228.80:9002/api/tables');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error loading tables:', error);
      // Datos de ejemplo si falla
      setTables([
        { id: 1, number: 'T01', area: 'Salón Principal', capacity: 4, status: 'available' },
        { id: 2, number: 'T02', area: 'Salón Principal', capacity: 2, status: 'available' },
        { id: 3, number: 'T03', area: 'Terraza', capacity: 6, status: 'available' },
        { id: 4, number: 'T04', area: 'Terraza', capacity: 4, status: 'available' },
        { id: 5, number: 'T05', area: 'VIP', capacity: 8, status: 'available' },
      ]);
    }
  };

  const getQRUrl = (tableId: number) => {
    return `${baseUrl}/menu/${tableId}`;
  };

  const downloadQR = (tableNumber: string, tableId: number) => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Mesa_${tableNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printQR = (tableId: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrElement = document.getElementById(`qr-container-${tableId}`);
    if (!qrElement) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Mesa ${tables.find(t => t.id === tableId)?.number}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
              border: 2px solid #333;
              border-radius: 10px;
            }
            h1 { margin-bottom: 20px; }
            .info { margin: 20px 0; font-size: 18px; }
          </style>
        </head>
        <body>
          ${qrElement.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Gestor de Códigos QR"
        subtitle="Genera y administra los códigos QR para las mesas del restaurante"
        actions={[
          {
            label: 'Ver Demo Menú',
            onClick: () => window.open('/menu/1', '_blank'),
            variant: 'secondary',
            icon: QrCodeIcon
          },
          {
            label: 'Imprimir Todos',
            onClick: () => window.print(),
            variant: 'primary',
            icon: PrinterIcon
          }
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassPanel className="p-6 hover:shadow-xl transition-shadow">
                <div id={`qr-container-${table.id}`} className="text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TableCellsIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-lg">Mesa {table.number}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{table.area}</span>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                    <QRCodeSVG
                      id={`qr-${table.id}`}
                      value={getQRUrl(table.id)}
                      size={200}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/logo.png",
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      Capacidad: {table.capacity} personas
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      {getQRUrl(table.id)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => downloadQR(table.number, table.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Descargar
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => printQR(table.id)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      Imprimir
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(getQRUrl(table.id), '_blank')}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Panel de instrucciones */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <QrCodeIcon className="h-6 w-6 text-purple-600" />
              ¿Cómo usar los códigos QR?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">1. Descarga o Imprime</h4>
                <p className="text-sm text-gray-600">
                  Descarga los QR en formato PNG o imprímelos directamente desde el navegador.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">2. Coloca en las Mesas</h4>
                <p className="text-sm text-gray-600">
                  Coloca los códigos QR en soportes visibles en cada mesa correspondiente.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">3. Los Clientes Escanean</h4>
                <p className="text-sm text-gray-600">
                  Los clientes escanean con su móvil y acceden al menú digital con chat IA integrado.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Consejo:</strong> Imprime los QR en material resistente o plastifícalo para mayor durabilidad. 
                Considera agregar instrucciones simples como "Escanea para ver el menú" debajo del código.
              </p>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
};