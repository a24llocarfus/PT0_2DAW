var $ = function(id) { 
    return document.getElementById(id); 
};

// Array global per guardar la informació de les preguntes carregades de la BBDD
var preguntesLlistat = [];

// Funció inicial un cop l'HTML hagi carregat
window.addEventListener('load', function() {
    carregarPreguntes();
    $('btn_nova_pregunta').addEventListener('click', mostrarFormulariNou);
    $('btn_cancelar').addEventListener('click', amagarFormulari);
    $('admin_form').addEventListener('submit', guardarPregunta);
});

// GET - Funcio per cridar a l'API i pintar la taula
function carregarPreguntes() {
    fetch('/api/preguntes')
        .then(function(res) { return res.json(); })
        .then(function(dades) {
            preguntesLlistat = dades;
            var tbody = $('taula_preguntes');
            tbody.innerHTML = ''; 

            dades.forEach(function(preguntaItem) {
                var tr = document.createElement('tr');
                var imatgeHtml = preguntaItem.imatge ? `<a href="${preguntaItem.imatge}" class="badge bg-info text-decoration-none p-2" target="_blank">Veure</a>` : '<span class="badge bg-secondary p-2">No</span>';
                
                tr.innerHTML = `
                    <td>${preguntaItem.id}</td>
                    <td>${preguntaItem.pregunta}</td>
                    <td>${imatgeHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2 fw-bold" onclick="prepararEdicio(${preguntaItem.id})">Modificar</button>
                        <button class="btn btn-sm btn-outline-danger fw-bold" onclick="eliminarPregunta(${preguntaItem.id})">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(function(err) { console.error("Error al carregar les preguntes:", err); });
}

function mostrarFormulariNou() {
    $('titol_formulari').innerText = 'Nova Pregunta';
    $('admin_form').reset();
    $('form_id').value = ''; 
    
    $('formulari_edicio').classList.remove('d-none');
    $('llistat_preguntes').classList.add('d-none');
    $('btn_nova_pregunta').classList.add('d-none');
}

function amagarFormulari() {
    $('formulari_edicio').classList.add('d-none');
    $('llistat_preguntes').classList.remove('d-none');
    $('btn_nova_pregunta').classList.remove('d-none');
}

window.prepararEdicio = function(id) {
    var pregunta = null;
    for (var i = 0; i < preguntesLlistat.length; i++) {
        if (preguntesLlistat[i].id === id) {
            pregunta = preguntesLlistat[i];
            break;
        }
    }
    
    if (!pregunta) return;

    $('titol_formulari').innerText = 'Modificar Pregunta';
    $('form_id').value = pregunta.id; 
    $('form_pregunta').value = pregunta.pregunta;
    $('form_resp1').value = pregunta.resposta_1;
    $('form_resp2').value = pregunta.resposta_2;
    $('form_resp3').value = pregunta.resposta_3;
    $('form_resp4').value = pregunta.resposta_4;
    $('form_correcta').value = pregunta.resposta_correcta;
    $('form_imatge').value = pregunta.imatge || '';

    $('formulari_edicio').classList.remove('d-none');
    $('llistat_preguntes').classList.add('d-none');
    $('btn_nova_pregunta').classList.add('d-none');
};

function guardarPregunta(e) {
    e.preventDefault(); 
    var id = $('form_id').value;
    var dades = {
        pregunta: $('form_pregunta').value,
        resposta_1: $('form_resp1').value,
        resposta_2: $('form_resp2').value,
        resposta_3: $('form_resp3').value,
        resposta_4: $('form_resp4').value,
        resposta_correcta: $('form_correcta').value,
        imatge: $('form_imatge').value
    };

    var url = '/api/preguntes';
    var metode = 'POST'; 

    if (id !== '') {
        url = '/api/preguntes/' + id;
        metode = 'PUT'; 
    }

    fetch(url, {
        method: metode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dades)
    })
    .then(function(res) { return res.json(); })
    .then(function(resultat) {
        alert(resultat.missatge); 
        amagarFormulari();
        carregarPreguntes(); 
    })
    .catch(function(err) { console.error("Error guardant a l'API:", err); });
}

window.eliminarPregunta = function(id) {
    if(confirm("Estàs completament segur que vols eliminar aquesta pregunta per sempre?")) {
        fetch('/api/preguntes/' + id, {
            method: 'DELETE'
        })
        .then(function(res) { return res.json(); })
        .then(function(resultat) {
            alert(resultat.missatge);
            carregarPreguntes(); 
        })
        .catch(function(err) { console.error("Error eliminant a l'API:", err); });
    }
};
