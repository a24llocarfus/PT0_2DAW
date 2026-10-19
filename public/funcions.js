// ==========================================
// 1. CONSTANTS I VARIABLES GLOBALS
// ==========================================

// TEMPSLIMIT: Temps en segons abans no s'acabi la partida (30 segons)
var TEMPSLIMIT = 30; 

// temps: Comptador dels segons que han passat des de l'inici
var temps = 0; 

// idTimer: Identificador del temporitzador (setInterval)
var idTimer; 

// pregActual: Índex de la pregunta que es mostra per pantalla actualment
var pregActual = 0; 

// totalpreguntes: Número total de preguntes carregades
var totalpreguntes = 0; 

// estatDeLaPartida: Objecte que fa de 'memòria' del joc per gestionar la sessió i puntuació
var estatDeLaPartida = {
  sessionId: null,          // Identificador de seguretat de la sessió al Servidor
  contadorPreguntes: 0,     // Nombre de preguntes que l'usuari ja ha contestat
  respostesUsuari: []       // Array on es guarden les opcions triades
};

// ==========================================
// 2. FUNCIONS (LÒGICA I DOM)
// ==========================================

/**
 * Funció mostrarUsuariRegistrat
 * Oculta el formulari de nom i mostra el joc. Activa la partida.
 * @param {String} nom - El nom de l'usuari
 */
function mostrarUsuariRegistrat(nom) {
  var divBenvinguda = document.getElementById("div_benvinguda");
  var grupInputNom = document.getElementById("grup_input_nom");
  var btnEsborrarNom = document.getElementById("btn_esborrar_nom");
  
  divBenvinguda.innerHTML = `Hola ${nom}, prepara't per jugar!`;
  divBenvinguda.classList.remove("d-none");
  grupInputNom.classList.add("d-none");
  btnEsborrarNom.classList.remove("d-none");
  
  // Ara sí, mostrem la interfície del joc i arrenquem!
  document.getElementById("pantalla_joc").classList.remove("d-none");
  comencarPartida();
}

/**
 * Funció mostrarUsuariNoRegistrat
 * Amaga el joc, para el temps, i mostra el formulari per posar el nom.
 */
function mostrarUsuariNoRegistrat() {
  var divBenvinguda = document.getElementById("div_benvinguda");
  var grupInputNom = document.getElementById("grup_input_nom");
  var btnEsborrarNom = document.getElementById("btn_esborrar_nom");
  var inputNom = document.getElementById("input_nom");

  divBenvinguda.innerHTML = "";
  divBenvinguda.classList.add("d-none");
  grupInputNom.classList.remove("d-none");
  btnEsborrarNom.classList.add("d-none");
  inputNom.value = "";
  
  // Ocultem el joc totalment i aturem el temps per no gastar-lo
  document.getElementById("pantalla_joc").classList.add("d-none");
  if(idTimer) {
      clearInterval(idTimer);
  }
}

/**
 * Funció comencarPartida
 * Reinicia variables, posa en marxa el cronòmetre i fa la petició GET a /dades
 */
function comencarPartida() {
  temps = 0;
  estatDeLaPartida.contadorPreguntes = 0;
  document.getElementById("cronometre").innerHTML = `⏱️ ${TEMPSLIMIT} s`;
  
  if(idTimer) {
      clearInterval(idTimer);
  }
  
  // CRONÒMETRE / TEMPORITZADOR
  idTimer = setInterval(function() {
    temps++;
    document.getElementById("cronometre").innerHTML = `⏱️ ${TEMPSLIMIT - temps} s`;
    
    // Si s'arriba al temps límit, forcem l'enviament de respostes
    if (temps >= TEMPSLIMIT) {
      alert("S'ha acabat el temps! Enviant resultats...");
      clearInterval(idTimer);
      Enviar(); 
    }
  }, 1000);

  // CÀRREGA ASÍNCRONA DE DADES (Fetch)
  fetch('/dades')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
      console.log("Dades carregades", data);
      estatDeLaPartida.sessionId = data.sessionId;
      iniciarPartida(data.preguntes);
    })
    .catch(function(error) {
      console.error("Error carregant les dades:", error);
    });
}

/**
 * Funció iniciarPartida
 * Genera tot el codi HTML de les preguntes (targetes i botons) i l'injecta al DOM
 * @param {Array} preguntes - Llista de preguntes enviades pel servidor
 */
function iniciarPartida(preguntes) {
  // Comprovem la llargada correcta de les preguntes
  totalpreguntes = Array.isArray(preguntes) ? preguntes.length : 0;
  MostrarMarcador();
  
  // Creem un array buit preparat per guardar les opcions que triï l'usuari
  estatDeLaPartida.respostesUsuari = new Array(totalpreguntes).fill(null);

  var contingut = ""; // Variable on sumarem text HTML mitjançant template literals (`)

  // Bucle per crear cadascuna de les targetes de pregunta
  for (var i = 0; i < totalpreguntes; i++) {
    // Només mostrem la primera pregunta, les altres s'amaguen amb "d-none"
    var visibilitat = (i === 0) ? "" : "d-none";
    
    contingut += `
      <div class="card mb-2 shadow-none border-0 pregunta_div ${visibilitat}" data-index-div="${i}">
        <div class="card-body p-0">
            <h5 class="card-title text-dark mb-2 fw-bold pregunta-titol">${i + 1}. ${preguntes[i].pregunta}</h5>
            ${preguntes[i].imatge ? `<div class="mb-2 pregunta-img-box"><img class="pregunta-img border shadow-sm" src="${preguntes[i].imatge}"></div>` : ''}
            <div class="row g-2 mt-1">
    `;

    // Bucle secundari per afegir cadascuna de les 4 respostes d'aquella pregunta
    var nombreRespostes = preguntes[i].respostes ? preguntes[i].respostes.length : 0;
    for (var j = 0; j < nombreRespostes; j++) {
      contingut += `
        <div class="col-6 d-flex">
            <button class="btnRespuesta btn btn-outline-primary btn-sm fw-semibold" 
              data-id-pregunta="${preguntes[i].id}" 
              data-id-resposta="${preguntes[i].respostes[j].id}" 
              data-index="${i}">
              ${preguntes[i].respostes[j].etiqueta}
            </button>
        </div>
      `;
    }
    
    contingut += `</div></div></div>`;
  }

  // Injectem l'HTML complet a la pantalla de joc
  document.getElementById("partida").innerHTML = contingut;
  
  // Finalment, mostrem els botons de Següent i Anterior
  document.getElementById("controls_navegacio").classList.remove("d-none");
  actualitzarBotonsNavegacio();
}

/**
 * Funció actualitzarBotonsNavegacio
 * Gestiona quins botons han d'estar bloquejats (ex: no es pot anar enrere si som a la 1a pregunta)
 */
function actualitzarBotonsNavegacio() {
    var btnAnterior = document.getElementById("btn_anterior");
    var btnSeguent = document.getElementById("btn_seguent");

    if (pregActual === 0) {
        btnAnterior.disabled = true;
    } else {
        btnAnterior.disabled = false;
    }

    if (pregActual === totalpreguntes - 1) {
        btnSeguent.disabled = true;
    } else {
        btnSeguent.disabled = false;
    }
}

/**
 * Funció marcarResposta
 * Registra a la memòria la selecció de l'usuari i mostra el botó final si cal.
 * @param {Number} idPregunta - L'ID de la pregunta a la BBDD
 * @param {Number} idResposta - L'ID de l'opció triada (1,2,3,4)
 * @param {Number} i - L'índex visual de la targeta (0 a 9)
 */
function marcarResposta(idPregunta, idResposta, i) {
  // Comprovem si és el primer cop que clica a aquesta targeta
  if (estatDeLaPartida.respostesUsuari[i] === null) {
    estatDeLaPartida.contadorPreguntes++;
  }

  // Guardem o sobreescrivim la resposta a la memòria (estatDeLaPartida)
  estatDeLaPartida.respostesUsuari[i] = {
    pregunta: idPregunta,
    resposta: idResposta
  };

  MostrarMarcador();

  // Si ja ha respost totes les preguntes, mostrem el botó verd d'ENVIAR
  if (estatDeLaPartida.contadorPreguntes === totalpreguntes) {
    document.getElementById("btn_enviar").classList.remove("d-none");
  }
}

/**
 * Funció MostrarMarcador
 * Actualitza visualment quantes preguntes porta contestades el jugador.
 */
function MostrarMarcador() {
  document.getElementById("marcador").innerHTML = `<span class="badge bg-light text-secondary border px-2 py-1 fw-bold" style="font-size: 0.82rem;">${estatDeLaPartida.contadorPreguntes} / ${totalpreguntes}</span>`;
}

/**
 * Funció Enviar
 * Envia l'objecte de sessió amb les respostes al backend per la correcció.
 */
function Enviar() {
  clearInterval(idTimer); // Aturem el temps de seguida
  
  // Fem la petició tipus POST per pujar dades
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
    .then(function(response) {
        return response.json();
    })
    .then(function(dades) {
      if (dades.error) {
        alert("Atenció: " + dades.error);
        return;
      }
      
      var aprovat = dades.nota >= (dades.total / 2);
      var classe = aprovat ? "alert-success" : "alert-danger";
      var panellJoc = document.getElementById("partida").parentElement;
      
      panellJoc.innerHTML = `
        <div class="alert ${classe} text-center p-4 my-2">
            <h3 class="fw-bold mb-2">NOTA FINAL</h3>
            <h1 class="display-4 fw-bold my-3">${dades.nota} / ${dades.total}</h1>
            <button class="btn btn-dark btn-sm fw-bold px-4 py-2 mt-2" onclick="location.reload()">🔄 Tornar a jugar</button>
        </div>
      `;
    })
    .catch(function(error) {
      console.error("Error en enviar les respostes:", error);
    });
}

// ==========================================
// 3. MAIN (Programa Principal d'Inici)
// ==========================================
window.addEventListener("load", function () {
  
  // COMPROVACIÓ D'USUARI AL LOCALSTORAGE
  var nomGuardat = localStorage.getItem("nom_usuari");
  var btnGuardarNom = document.getElementById("btn_guardar_nom");
  var btnEsborrarNom = document.getElementById("btn_esborrar_nom");
  var inputNom = document.getElementById("input_nom");

  if (nomGuardat !== null) {
    mostrarUsuariRegistrat(nomGuardat);
  } else {
    mostrarUsuariNoRegistrat();
  }

  // EVENT - Botó de guardar nom
  btnGuardarNom.addEventListener("click", function() {
    var nom = inputNom.value.trim();
    if (nom !== "") {
      localStorage.setItem("nom_usuari", nom);
      mostrarUsuariRegistrat(nom);
    } else {
      alert("Si us plau, introdueix un nom vàlid.");
    }
  });

  // EVENT - Botó de canviar de jugador (esborrar memòria cau)
  btnEsborrarNom.addEventListener("click", function() {
    localStorage.removeItem("nom_usuari");
    mostrarUsuariNoRegistrat();
  });

  // EVENT - Botons Anterior i Següent (paginació de la partida)
  document.getElementById("btn_anterior").addEventListener("click", function() {
    if (pregActual > 0) {
      // Ocultem la targeta actual
      var elementsActuals = document.querySelectorAll('.pregunta_div[data-index-div="' + pregActual + '"]');
      if (elementsActuals.length > 0) elementsActuals[0].classList.add("d-none");
      
      // Retrocedim índex i mostrem l'anterior
      pregActual--;
      var elementsAnteriors = document.querySelectorAll(`.pregunta_div[data-index-div="${pregActual}"]`);
      if (elementsAnteriors.length > 0) elementsAnteriors[0].classList.remove("d-none");
      
      actualitzarBotonsNavegacio();
    }
  });

  document.getElementById("btn_seguent").addEventListener("click", function() {
    if (pregActual < totalpreguntes - 1) {
      // Ocultem la targeta actual
      var elementsActuals = document.querySelectorAll('.pregunta_div[data-index-div="' + pregActual + '"]');
      if (elementsActuals.length > 0) elementsActuals[0].classList.add("d-none");
      
      // Avancem índex i mostrem la següent
      pregActual++;
      var elementsSeguents = document.querySelectorAll(`.pregunta_div[data-index-div="${pregActual}"]`);
      if (elementsSeguents.length > 0) elementsSeguents[0].classList.remove("d-none");
      
      actualitzarBotonsNavegacio();
    }
  });

  // EVENT DELEGATION - Gestió dels clics als botons de resposta a tota la zona "partida"
  document.getElementById("partida").addEventListener("click", function(e) {
    if (e.target.classList.contains("btnRespuesta")) {
      var idPregunta = Number(e.target.dataset.idPregunta);
      var idResposta = Number(e.target.dataset.idResposta);
      var index = Number(e.target.dataset.index);
      
      // Netegem els colors grocs de tots els botons que corresponguin només a AQUESTA targeta
      var botons = document.querySelectorAll(`button[data-index="${index}"]`);
      for (var b = 0; b < botons.length; b++) {
          botons[b].classList.remove('btn-warning', 'text-dark');
          botons[b].classList.add('btn-outline-primary');
      }
      
      // Marquem el botó escollit (que ha rebut el clic) de color groc
      e.target.classList.remove('btn-outline-primary');
      e.target.classList.add('btn-warning', 'text-dark');
  
      // Ho desem a la memòria de l'estat de la partida
      marcarResposta(idPregunta, idResposta, index);
    }
  });

  // EVENT - Botó gran d'Enviar Respostes Finals
  document.getElementById("btn_enviar").addEventListener("click", Enviar);

});
