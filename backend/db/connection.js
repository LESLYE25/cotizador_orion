import mysql from 'mysql2/promise';

export const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',         // cambia si tu usuario MySQL es distinto
  password: '',         // pon tu contraseña si tiene
  database: 'cotizador_orion'
});

console.log('✅ Conexión a MySQL establecida');
