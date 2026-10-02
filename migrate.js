const mysql = require('mysql2');
const preguntes = require('./preguntes.json').preguntes;
const respostes = require('./respostes.json').respostes;

// Connexió a la base de dades local de Docker
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'quiz_db',
  multipleStatements: true
});

con.connect((err) => {
  if (err) {
    console.error('Error connectant a MySQL:', err);
    return;
  }
  console.log('Connectat a MySQL!');

  // Creem la taula automàticament a la BBDD existent
  const sqlInit = `
    CREATE TABLE IF NOT EXISTS preguntes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pregunta TEXT NOT NULL,
      resposta_1 VARCHAR(255) NOT NULL,
      resposta_2 VARCHAR(255) NOT NULL,
      resposta_3 VARCHAR(255) NOT NULL,
      resposta_4 VARCHAR(255) NOT NULL,
      resposta_correcta TINYINT NOT NULL,
      imatge VARCHAR(500) DEFAULT NULL
    );
    TRUNCATE TABLE preguntes;
  `;

  con.query(sqlInit, (err) => {
    if (err) {
      console.error('Error preparant la base de dades:', err.message);
      con.end();
      return;
    }

    console.log('✅ Taula "preguntes" a punt.');

    let inserides = 0;
    preguntes.forEach((p) => {
      const respCorrectaObj = respostes.find(r => r.id === p.id);
      const respostaCorrecta = respCorrectaObj ? respCorrectaObj.resposta_correcta : 1;

      const sqlInsert = `INSERT INTO preguntes (id, pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const valors = [
        p.id,
        p.pregunta,
        p.respostes[0] ? p.respostes[0].etiqueta : '',
        p.respostes[1] ? p.respostes[1].etiqueta : '',
        p.respostes[2] ? p.respostes[2].etiqueta : '',
        p.respostes[3] ? p.respostes[3].etiqueta : '',
        respostaCorrecta,
        p.imatge || null
      ];

      con.query(sqlInsert, valors, (err) => {
        if (err) {
          console.error(`Error inserint pregunta ${p.id}:`, err.message);
        } else {
          inserides++;
          if (inserides === preguntes.length) {
            console.log(`🎉 Migració completada! S'han inserit les ${inserides} preguntes a la base de dades.`);
            con.end();
          }
        }
      });
    });
  });
});
