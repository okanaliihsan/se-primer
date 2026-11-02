// Ortak komutlar: profil seçimi ve bir yolu baştan sona oynama.

Cypress.Commands.add('profil', (level = 'orta', role = 'devops', goal = 'kriz') => {
  cy.visit('/');
  cy.get(`[data-cy=opt-level-${level}]`).click();
  cy.get(`[data-cy=opt-role-${role}]`).click();
  cy.get(`[data-cy=opt-goal-${goal}]`).click();
  cy.get('[data-cy=start]').click();
  cy.get('[data-cy=intro-next]').click();
});

// yol: "AAB" gibi üç harf → k1, k2, k3 kararları
Cypress.Commands.add('oyna', (yol) => {
  ['k1', 'k2', 'k3'].forEach((k, i) => {
    cy.get(`[data-cy=decision-${k}]`).should('be.visible');
    cy.get(`[data-cy=choice-${yol[i]}]`).click();
    cy.get('[data-cy=outcome]').should('be.visible');
    cy.get('[data-cy=outcome-next]').click();
  });
});

// Diferansiyel test: her satırda uygulamanın tam hassasiyetli olasılığı (data-p) ile
// Python test kahininin olasılığı (data-py) arasındaki fark toleranstan küçük olmalı.
Cypress.Commands.add('farklarKucuk', (tolerans) => {
  cy.get('[data-cy=parite-vaka]').each(($tr) => {
    const fark = Math.abs(parseFloat($tr.attr('data-p')) - parseFloat($tr.attr('data-py')));
    expect(fark, 'fark').to.be.lessThan(tolerans);
  });
});
