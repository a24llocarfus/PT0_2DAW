require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT;

// Connexió a la base de dades MySQL mitjançant un pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Comprovació de la connexió a MySQL
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connectant a MySQL:', err.message);
    return;
  }
  console.log('Connectat a MySQL correctament!');
  connection.release();
});

app.use(cors());
app.use(express.json());

// Servir fitxers estàtics de la carpeta public (front-end)
app.use(express.static(path.join(__dirname, 'public')));

// Guardar les sessions de joc en memòria
const sessions = new Map();

// GET /dades: obté les preguntes de la BBDD, les transforma i en retorna 10
app.get('/dades', (req, res) => {
  const sql = 'SELECT * FROM preguntes';

  pool.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error consultant la base de dades' });
    }

    // Transformació de la taula SQL a l'estructura JSON que espera el client
    const preguntesTransformades = result.map((fila) => ({
      id: fila.id,
      pregunta: fila.pregunta,
      respostes: [
        { id: 1, etiqueta: fila.resposta_1 },
        { id: 2, etiqueta: fila.resposta_2 },
        { id: 3, etiqueta: fila.resposta_3 },
        { id: 4, etiqueta: fila.resposta_4 }
      ],
      imatge: fila.imatge
    }));

    // Barregem i seleccionem 10 preguntes per a la partida
    const sessionId = uuidv4();
    const dadesBarrejades = [...preguntesTransformades].sort(() => Math.random() - 0.5);
    const preguntesSeleccionades = dadesBarrejades.slice(0, 10);

    sessions.set(sessionId, {
      preguntes: preguntesSeleccionades.map(preguntaSeleccionada => preguntaSeleccionada.id)
    });

    res.json({
      sessionId: sessionId,
      preguntes: preguntesSeleccionades
    });
  });
});

// POST /respostes: rep les respostes de l'usuari i retorna la puntuacio
app.post('/respostes', (req, res) => {
  const { sessionId, respostes } = req.body;

  if (!sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Sessió invàlida o ja enviada prèviament' });
  }

  // Obtenim totes les respostes correctes de la BBDD
  const sql = 'SELECT id, resposta_correcta FROM preguntes';
  pool.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error consultant BBDD per corregir' });

    let encerts = 0;
    const sessioInfo = sessions.get(sessionId);
    const totalPreguntes = sessioInfo.preguntes.length;

    // Comparem les respostes del jugador amb la base de dades
    respostes.forEach(respostaClient => {
      // 'respostaClient' pot ser null si l'usuari s'ha deixat aquella pregunta en blanc
      if (respostaClient !== null) {
        const preguntaDb = results.find(preguntaBBDD => preguntaBBDD.id === respostaClient.pregunta);
        if (preguntaDb && Number(preguntaDb.resposta_correcta) === Number(respostaClient.resposta)) {
          encerts++;
        }
      }
    });

    // Esborrem la sessió per evitar trampes de tornar-ho a enviar
    sessions.delete(sessionId);

    // Retornem la nota
    res.json({ 
      ok: true, 
      nota: encerts, 
      total: totalPreguntes 
    });
  });
});

// ==========================================
// CRUD ADMINISTRACIÓ
// ==========================================

// 1. OBTENIR totes les preguntes (Llegir)
app.get('/api/preguntes', (req, res) => {
  const sql = 'SELECT * FROM preguntes';
  pool.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error consultant BBDD' });
    res.json(results);
  });
});

// 2. CREAR una nova pregunta (Crear)
// Ara rebrem la 'imatge' directament com un text (URL) dins del JSON
app.post('/api/preguntes', (req, res) => {
  const { pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge } = req.body;
  const sql = `INSERT INTO preguntes (pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  pool.query(sql, [pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error creant la pregunta' });
    res.json({ missatge: 'Pregunta creada correctament', id: result.insertId });
  });
});

// 3. MODIFICAR una pregunta existent (Actualitzar)
app.put('/api/preguntes/:id', (req, res) => {
  const id = req.params.id;
  const { pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge } = req.body;
  const sql = `UPDATE preguntes 
               SET pregunta = ?, resposta_1 = ?, resposta_2 = ?, resposta_3 = ?, resposta_4 = ?, resposta_correcta = ?, imatge = ?
               WHERE id = ?`;

  pool.query(sql, [pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error actualitzant la pregunta' });
    res.json({ missatge: 'Pregunta actualitzada correctament' });
  });
});

// 4. ELIMINAR una pregunta (Esborrar)
app.delete('/api/preguntes/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM preguntes WHERE id = ?';

  pool.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error eliminant la pregunta' });
    res.json({ missatge: 'Pregunta eliminada correctament' });
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escoltant al port ${port}`);
});

server.on('error', (err) => {
  console.error('Error al servidor Express:', err.message);
});
