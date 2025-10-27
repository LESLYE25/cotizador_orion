import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión MySQL
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cotizador_orion",
});

// ✅ Obtener último número de cotización
app.get("/api/last-cotizacion", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT numero_cotizacion FROM cotizaciones ORDER BY id DESC LIMIT 1"
    );
    let nextNumber = "000001";

    if (rows.length > 0) {
      const last = parseInt(rows[0].numero_cotizacion, 10);
      nextNumber = String(last + 1).padStart(6, "0");
    }

    res.json({ nextNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo número de cotización" });
  }
});

// ✅ Guardar cotización con productos
app.post("/api/cotizaciones", async (req, res) => {
  try {
    const {
      numero_cotizacion,
      cliente,
      dni,
      direccion,
      fecha_emision,
      fecha_venc,
      validez,
      tiempo_entrega,
      subtotal,
      igv,
      total,
      productos,
    } = req.body;

    // 1️⃣ Guardar la cabecera
    const [result] = await db.query(
      `INSERT INTO cotizaciones 
        (numero_cotizacion, cliente, dni, direccion, fecha_emision, fecha_venc, validez, tiempo_entrega, subtotal, igv, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_cotizacion,
        cliente,
        dni,
        direccion,
        fecha_emision,
        fecha_venc,
        validez,
        tiempo_entrega,
        subtotal,
        igv,
        total,
      ]
    );

    const idCotizacion = result.insertId;

    // 2️⃣ Guardar los productos asociados
    if (Array.isArray(productos) && productos.length > 0) {
      const insertPromises = productos.map((p) =>
        db.query(
          `INSERT INTO productos (id_cotizacion, cantidad, unidad, descripcion, precio_unit, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            idCotizacion,
            p.cantidad || 0,
            p.unidad || "",
            p.descripcion || "",
            p.precioUnit || 0,
            p.total || 0,
          ]
        )
      );
      await Promise.all(insertPromises);
    }

    res.json({
      message: `✅ Cotización ${numero_cotizacion} guardada correctamente con ${productos.length} productos.`,
      id: idCotizacion,
    });
  } catch (err) {
    console.error("❌ Error al guardar la cotización:", err);
    res.status(500).json({ error: "Error al guardar la cotización ❌" });
  }
});

app.listen(5000, () =>
  console.log("✅ Servidor corriendo en http://localhost:5000")
);
