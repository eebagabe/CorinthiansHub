const ORDEM = ["Goleiro", "Defensor", "Meio-campista", "Atacante"];
const PLURAL = { Goleiro: "Goleiros", Defensor: "Defensores", "Meio-campista": "Meio-campistas", Atacante: "Atacantes" };

fetch("data/players.json")
  .then((r) => r.json())
  .then((jogadores) => {
    document.getElementById("elenco").innerHTML = ORDEM.map((pos) => `
      <section>
        <h2>${PLURAL[pos]}</h2>
        <div class="grid">
          ${jogadores.filter((j) => j.posicao === pos).map((j) => `
            <article class="card">
              ${j.foto ? `<img src="${j.foto}" alt="${j.nome}" loading="lazy">` : `<div class="sem-foto">${j.numero}</div>`}
              <span class="numero">${j.numero}</span>
              <h3>${j.nome}</h3>
              <p>${j.posicao}</p>
            </article>`).join("")}
        </div>
      </section>`).join("");
  });
