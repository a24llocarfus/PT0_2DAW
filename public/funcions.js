let estatDeLaPartida = {
  sessionId: null,
  contadorPreguntes: 0,
  respostesUsuari: []
};

let totalpreguntes = 0;

// Utilitzem ruta relativa '/dades' per aprofitar que el backend serveix l'estàtic en el mateix origen
fetch('/dades')
  .then(response => response.json())
  .then(data => {
    console.log("Dades carregades", data);
    estatDeLaPartida.sessionId = data.sessionId;
    iniciarPartida(data.preguntes);
  })
  .catch(error => {
    console.error("Error carregant les dades:", error);
  });

function iniciarPartida(preguntes) {
  totalpreguntes = Array.isArray(preguntes) ? preguntes.length : 0;
  MostrarMarcador();
  estatDeLaPartida.respostesUsuari = new Array(totalpreguntes).fill(null);

  let contingut = "";

  for (let i = 0; i < totalpreguntes; i++) {
    contingut += `
      <h2>${preguntes[i].pregunta}</h2>
      <img width="100" src="${preguntes[i].imatge}">
      <br>`;

    for (let j = 0; j < (preguntes[i].respostes ? preguntes[i].respostes.length : 0); j++) {
      contingut += `
        <button 
          class="btnRespuesta" 
          data-id-pregunta="${preguntes[i].id}" 
          data-id-resposta="${preguntes[i].respostes[j].id}" 
          data-index="${i}">
          ${preguntes[i].respostes[j].etiqueta}
        </button>`;
    }
  }

  document.getElementById("partida").innerHTML = contingut;
}

// Delegació d'esdeveniments amb un únic addEventListener al contenidor pare
document.getElementById("partida").addEventListener("click", function(e) {
  if (e.target.classList.contains("btnRespuesta")) {
    const idPregunta = Number(e.target.dataset.idPregunta);
    const idResposta = Number(e.target.dataset.idResposta);
    const index = Number(e.target.dataset.index);
    marcarResposta(idPregunta, idResposta, index);
  }
});

// Listener per al botó d'enviar
document.getElementById("btn_enviar").addEventListener("click", Enviar);

function marcarResposta(idPregunta, idResposta, i) {
  if (estatDeLaPartida.respostesUsuari[i] === null) {
    estatDeLaPartida.contadorPreguntes++;
  }

  estatDeLaPartida.respostesUsuari[i] = {
    pregunta: idPregunta,
    resposta: idResposta
  };

  console.log("Estat de la partida:", estatDeLaPartida);
  MostrarMarcador();

  if (estatDeLaPartida.contadorPreguntes === totalpreguntes) {
    document.getElementById("btn_enviar").classList.remove("hidden");
  }
}

function MostrarMarcador() {
  document.getElementById("marcador").innerHTML = `<p>${estatDeLaPartida.contadorPreguntes} / ${totalpreguntes}</p>`;
}

function Enviar() {
  // Utilitzem ruta relativa '/respostes'
  fetch('/respostes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: estatDeLaPartida.sessionId,
      respostes: estatDeLaPartida.respostesUsuari
    })
  })
    .then(response => response.json())
    .then(dades => {
      console.log("Resposta del servidor:", dades);
    })
    .catch(error => {
      console.error("Error en enviar les respostes:", error);
    });
}
