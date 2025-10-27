import React, { useState, useEffect } from "react";
import { Plus, Trash2, Printer, FileDown } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function formatNumber(n) {
  return String(n).padStart(6, "0");
}

export default function CotizadorOrion() {
  const [cotizacionNum, setCotizacionNum] = useState("------");
  const [cliente, setCliente] = useState("");
  const [dni, setDni] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [fechaVenc, setFechaVenc] = useState("");
  const [validez, setValidez] = useState("30 días");
  const [tiempoEntrega, setTiempoEntrega] = useState("Inmediato");
  const [incluirIGV, setIncluirIGV] = useState(true);

  const [productos, setProductos] = useState([
    { id: 1, cantidad: "", unidad: "Und", descripcion: "", precioUnit: "", total: 0 },
  ]);

  // 🧾 Cargar número desde la base al iniciar
  useEffect(() => {
    const fetchNumero = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/last-cotizacion");
        const data = await res.json();
        setCotizacionNum(data.nextNumber);
      } catch (err) {
        console.error("Error al cargar número:", err);
      }
    };
    fetchNumero();
  }, []);

  const agregarProducto = () => {
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    setProductos([...productos, { id: nuevoId, cantidad: "", unidad: "Und", descripcion: "", precioUnit: "", total: 0 }]);
  };

  const eliminarProducto = (id) => {
    if (productos.length > 1) setProductos(productos.filter((p) => p.id !== id));
  };

  const actualizarProducto = (id, campo, valor) => {
    setProductos(
      productos.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [campo]: valor };
          if (campo === "cantidad" || campo === "precioUnit") {
            const cant = parseFloat(updated.cantidad) || 0;
            const precio = parseFloat(updated.precioUnit) || 0;
            updated.total = cant * precio;
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleDniChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) setDni(value);
  };

  const subtotal = productos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
  const igv = incluirIGV ? subtotal * 0.18 : 0;
  const total = subtotal + igv;

  const imprimir = () => window.print();

  const exportarPDF = async () => {
    const input = document.getElementById("cotizacion");
    if (!input) {
      alert("No se encontró la sección de cotización.");
      return;
    }
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Cotizacion_Orion_${cotizacionNum}.pdf`);
  };

  const exportarimg = async () => {
    const input = document.getElementById("cotizacion");
    if (!input) {
      alert("No se encontró la sección de cotización.");
      return;
    }
    const link = document.createElement("a");
    document.body.appendChild(link);
    const imgData = canvas.toDataURL("image/png");
    const canvas = await html2canvas(input, { scale: 2 }); 
    link.href = imgData;
    link.download = `Cotizacion_Orion_${cotizacionNum}.png`;
  };

  const guardarEnBase = async () => {
    try {
      const data = {
        numero_cotizacion: cotizacionNum,
        cliente,
        dni,
        direccion,
        fecha_emision: fechaEmision,
        fecha_venc: fechaVenc,
        validez,
        tiempo_entrega: tiempoEntrega,
        subtotal,
        igv,
        total,
        productos,
      };

      const res = await fetch("http://localhost:5000/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        alert(`✅ Cotización ${cotizacionNum} guardada correctamente`);
        nuevoRegistro();
      } else {
        alert("❌ Error al guardar la cotización");
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar la cotización ❌");
    }
  };

  const nuevoRegistro = async () => {
    setCliente("");
    setDni("");
    setDireccion("");
    setFechaEmision(new Date().toISOString().split("T")[0]);
    setFechaVenc("");
    setValidez("30 días");
    setTiempoEntrega("Inmediato");
    setProductos([{ id: 1, cantidad: "", unidad: "Und", descripcion: "", precioUnit: "", total: 0 }]);

    // 🔄 Pedir nuevo número desde la base
    const res = await fetch("http://localhost:5000/api/last-cotizacion");
    const data = await res.json();
    setCotizacionNum(data.nextNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 print:hidden flex gap-4">
          <button onClick={imprimir} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Printer size={18} /> Imprimir
          </button>
          <button onClick={guardarEnBase} className="bg-yellow-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700">
            Guardar
          </button>
          <button onClick={exportarPDF} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <FileDown size={18} /> Exportar
          </button>
          <button onClick={exportarimg} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <FileDown size={18} /> Exportar imagen
          </button>
        </div>

        <div className="bg-white shadow-lg p-8" id="cotizacion">
          <div className="flex justify-between items-start mb-4 border-gray-300">
            <div className="flex items-center gap-4">
              <div className="w-80 ">
                <img
                  src="/images/logo-orion.png"
                  alt="Logo Orion Technologies"
                  className="w-full object-contain"
                />
              </div>

            </div>
            <div className="text-right border-2 border-gray-800 p-3">
              <div className="text-xl font-bold">RUC: 10428003689</div>
              <div className="text-xl font-bold">Cotización Nro. {cotizacionNum}</div>
            </div>
          </div>

          <div className="mb-6 text-sm">
            <div className="font-bold mb-1">ORION TECHNOLOGIES</div>
            <div>JR. TACNA 248 - CHULUCANAS - PIURA</div>
            <div>TELÉFONO CELULAR: 969879291</div>
            <div>VENDEDOR: IVAN MENDOZA VALDIVIEZO</div>
          </div>

          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300"></div>


          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">SEÑOR(ES):</label>
                <input type="text" value={cliente} onChange={(e)=>setCliente(e.target.value)} className="w-full border-b-2 border-gray-400 px-2 py-1 print:border-0" placeholder="Nombre del cliente"/>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">DNI:</label>
                <input type="text" value={dni} onChange={(e)=>setDni(e.target.value)} className="w-full border-b-2 border-gray-400 px-2 py-1 print:border-0" placeholder="DNI del cliente"/>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">DIRECCIÓN:</label>
                <input type="text" value={direccion} onChange={(e)=>setDireccion(e.target.value)} className="w-full border-b-2 border-gray-400 px-2 py-1 print:border-0" placeholder="Dirección del cliente"/>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">FECHA DE EMISIÓN:</label>
                <input type="date" value={fechaEmision} onChange={(e)=>setFechaEmision(e.target.value)} className="w-full border-b-2 border-gray-400 px-2 py-1 print:border-0"/>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">FECHA DE VENCIMIENTO:</label>
                <input type="date" value={fechaVenc} onChange={(e)=>setFechaVenc(e.target.value)} className="w-full border-b-2 border-gray-400 px-2 py-1 print:border-0"/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">VALIDEZ DE COTIZACIÓN</label>
              <input type="text" value={validez} onChange={(e)=>setValidez(e.target.value)} className="w-full border-2 border-gray-400 px-2 py-1 text-center print:border" placeholder="Ej: 30 días"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">TIEMPO DE ENTREGA</label>
              <input type="text" value={tiempoEntrega} onChange={(e)=>setTiempoEntrega(e.target.value)} className="w-full border-2 border-gray-400 px-2 py-1 text-center print:border" placeholder="Ej: Inmediato"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">MONEDA</label>
              <div className="w-full border-2 border-gray-400 px-2 py-1 text-center bg-gray-50">PEN</div>
            </div>
          </div>

          <table className="w-full border-2 border-gray-800 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-2 text-sm w-16">CANTIDAD</th>
                <th className="border border-gray-800 px-2 py-2 text-sm w-24">UNIDAD</th>
                <th className="border border-gray-800 px-2 py-2 text-sm">DESCRIPCIÓN</th>
                <th className="border border-gray-800 px-2 py-2 text-sm w-32">PRECIO UNITARIO</th>
                <th className="border border-gray-800 px-2 py-2 text-sm w-32">IMPORTE</th>
                <th className="border border-gray-800 px-2 py-2 text-sm w-16 print:hidden">-</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod)=>(
                <tr key={prod.id}>
                  <td className="border border-gray-800 px-2 py-1">
                    <input type="number" value={prod.cantidad} onChange={(e)=>actualizarProducto(prod.id,'cantidad',e.target.value)} className="w-full px-1 py-1 text-center" placeholder="0"/>
                  </td>
                  <td className="border border-gray-800 px-2 py-1">
                    <select value={prod.unidad} onChange={(e)=>actualizarProducto(prod.id,'unidad',e.target.value)} className="w-full px-1 py-1">
                      <option>Und</option>
                      <option>Servicio</option>
                      <option>Metro</option>
                      <option>Kg</option>
                    </select>
                  </td>
                  <td className="border border-gray-800 px-2 py-1">
                    <input type="text" value={prod.descripcion} onChange={(e)=>actualizarProducto(prod.id,'descripcion',e.target.value)} className="w-full px-1 py-1" placeholder="Descripción del producto o servicio"/>
                  </td>
                  <td className="border border-gray-800 px-2 py-1">
                    <input type="number" value={prod.precioUnit} onChange={(e)=>actualizarProducto(prod.id,'precioUnit',e.target.value)} className="w-full px-1 py-1 text-right" placeholder="0.00" step="0.01"/>
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-right font-semibold">S/ {(parseFloat(prod.total)||0).toFixed(2)}</td>
                  <td className="border border-gray-800 px-2 py-1 text-center print:hidden">
                    <button onClick={()=>eliminarProducto(prod.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-6 print:hidden">
            <button onClick={agregarProducto} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700">
              <Plus size={16}/> Agregar Producto
            </button>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold">SUB TOTAL</span><span>S/ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold">IGV (18%)</span><span>S/ {igv.toFixed(2)}</span></div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg"><span>IMPORTE</span><span>S/ {total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}