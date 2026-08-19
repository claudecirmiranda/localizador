(function () {
  const form = document.getElementById('form-busca');
  const inputCep = document.getElementById('cep');
  const mensagemErro = document.getElementById('mensagem-erro');
  const secaoResultados = document.getElementById('resultados-secao');
  const listaResultados = document.getElementById('lista-resultados');
  const cepRef = document.getElementById('resultados-cep-ref');
  const estadoVazio = document.getElementById('estado-vazio');
  const carregando = document.getElementById('carregando');
  const templateCard = document.getElementById('template-card');

  // Máscara simples de CEP: 00000-000
  inputCep.addEventListener('input', () => {
    let digitos = inputCep.value.replace(/\D/g, '').slice(0, 8);
    if (digitos.length > 5) {
      digitos = `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
    }
    inputCep.value = digitos;
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderErro();

    const cep = inputCep.value.trim();
    if (!/^\d{5}-?\d{3}$/.test(cep)) {
      mostrarErro('Digite um CEP válido, no formato 00000-000.');
      return;
    }

    await buscarEstabelecimentos(cep);
  });

  async function buscarEstabelecimentos(cep) {
    mostrarCarregando(true);
    secaoResultados.hidden = true;
    estadoVazio.hidden = true;

    try {
      const resposta = await fetch(`/api/estabelecimentos?cep=${encodeURIComponent(cep)}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível concluir a busca.');
      }

      renderizarResultados(dados);
    } catch (erro) {
      mostrarErro(erro.message);
    } finally {
      mostrarCarregando(false);
    }
  }

  function renderizarResultados(dados) {
    listaResultados.innerHTML = '';

    if (!dados.resultados || dados.resultados.length === 0) {
      estadoVazio.hidden = false;
      return;
    }

    cepRef.textContent = dados.consulta.cep;

    dados.resultados.forEach((item) => {
      const card = templateCard.content.cloneNode(true);

      const logo = card.querySelector('.card__logo');
      logo.src = item.logo || '/logos/placeholder.png';
      logo.alt = item.apelido;

      card.querySelector('.card__nome').textContent = item.apelido;
      card.querySelector('.card__endereco').textContent = item.endereco;
      card.querySelector('.card__distancia').textContent = `${formatarNumero(item.distancia_km)} km`;
      card.querySelector('.card__tempo').textContent = `${item.tempo_minutos} min`;

      const cta = card.querySelector('.card__cta');
      cta.href = item.maps_url;

      listaResultados.appendChild(card);
    });

    secaoResultados.hidden = false;
  }

  function formatarNumero(valor) {
    return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }

  function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.hidden = false;
  }

  function esconderErro() {
    mensagemErro.hidden = true;
  }

  function mostrarCarregando(ativo) {
    carregando.hidden = !ativo;
  }
})();
