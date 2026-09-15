const tabs = [...document.querySelectorAll('[data-role]')];
let currentRole = journeys.find(j => j.id === location.hash.slice(1)) || journeys[0];
function renderStep(index) {
  const s = currentRole.steps[index];
  document.querySelectorAll('.step').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
  document.querySelector('#detail').innerHTML = `<div><p class="eyebrow">ЭТАП ${index + 1} / 6</p><h3>${s[0]}</h3><p>${s[1]}</p><div class="result"><p class="label">Результат этапа</p><p>${s[6]}</p></div></div><div><div class="cell"><p class="label">Ожидание участника</p><p>${s[2]}</p></div><div class="cell"><p class="label">Точка контакта</p><p>${s[3]}</p></div></div><div><div class="cell"><p class="label">Возможная трудность</p><p>${s[4]}</p></div><div class="cell"><p class="label">Ответ в сценарии MVP</p><p>${s[5]}</p></div></div>`;
}
function renderRole(id) {
  currentRole = journeys.find(j => j.id === id) || journeys[0];
  tabs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === currentRole.id)));
  document.querySelector('#role-tag').textContent = currentRole.tag;
  document.querySelector('#journey-title').textContent = currentRole.title;
  document.querySelector('#goal').textContent = currentRole.goal;
  document.querySelector('#boundary').innerHTML = `<b>Граница ответственности.</b> ${currentRole.boundary}`;
  document.querySelector('#steps').innerHTML = currentRole.steps.map((s, i) => `<button class="step" type="button" aria-pressed="false" data-step="${i}"><span>0${i + 1}</span>${s[0]}</button>`).join('');
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => renderStep(Number(b.dataset.step))));
  renderStep(0);
}
tabs.forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.role; renderRole(b.dataset.role); }));
window.addEventListener('hashchange', () => renderRole(location.hash.slice(1)));
document.querySelector('#print').addEventListener('click', () => window.print());
document.querySelector('#print-all').innerHTML = journeys.map(j => `<section><p>SUNLEO · Концепция MVP · 12.09.2026 · 1 площадка / 3 места</p><h2>${j.label}: ${j.title}</h2><p>${j.goal}</p><p>Одно место на день 09:00–21:00; записи клиентов автоматические. Минимум 5 000 ₽ невозвратный и входит в долю ПВУ 50%. SUNLEO — 0%. Списание резерва — после подтверждения мастером оказанной услуги.</p><table><thead><tr><th>Этап и действие</th><th>Ожидание / контакт</th><th>Трудность / ответ MVP</th><th>Результат</th></tr></thead><tbody>${j.steps.map((s,i) => `<tr><td><b>${i+1}. ${s[0]}</b><br>${s[1]}</td><td>${s[2]}<br><br>${s[3]}</td><td>${s[4]}<br><br>${s[5]}</td><td>${s[6]}</td></tr>`).join('')}</tbody></table><p>${j.boundary}</p><p>Открытые решения: каталог и тарифы услуг, реальные платежи и выплаты, отмены клиентов, проверка мастеров, состав комплекта, сроки и критерии успеха пилота.</p></section>`).join('');
renderRole(currentRole.id);
