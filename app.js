require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT;

// Connexió a la base de dades MySQL mitjançant variables d'entorn
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

con.connect((err) => {
  if (err) {
    console.error('Error connectant a MySQL:', err);
    return;
  }
  console.log('Connectat a MySQL!');
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

  con.query(sql, (err, result) => {
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
      preguntes: preguntesSeleccionades.map(p => p.id)
    });

    res.json({
      sessionId: sessionId,
      preguntes: preguntesSeleccionades
    });
  });
});

// POST /respostes: rep les respostes de l'usuari
app.post('/respostes', (req, res) => {
  console.log('Respostes rebudes:', req.body);
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Servidor escoltant al port ${port}`);
});
