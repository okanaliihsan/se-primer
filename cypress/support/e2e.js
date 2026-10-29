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
