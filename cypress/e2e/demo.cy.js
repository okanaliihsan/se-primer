// Demo videosu için yavaş, anlatılı tek koşu: profil → tutorla konuşma → iyi son.
// `npx cypress run --spec cypress/e2e/demo.cy.js` → cypress/videos/demo.cy.js.mp4
const bekle = (ms) => cy.wait(ms);

describe('Demo · SE Primer baştan sona', () => {
  it('yeni başlayan bir DevOps adayı iyi sona ulaşır', () => {
    cy.visit('/');
    bekle(1500);
    cy.get('[data-cy=opt-level-yeni]').click(); bekle(700);
    cy.get('[data-cy=opt-role-devops]').click(); bekle(700);
    cy.get('[data-cy=opt-goal-kriz]').click(); bekle(700);
    cy.get('[data-cy=start]').click(); bekle(3500);
    cy.get('[data-cy=intro-next]').click(); bekle(2500);

    cy.get('[data-cy=hint-panel]').scrollIntoView(); bekle(2000);
    cy.get('[data-cy=tutor-input]').type('cevabı söyler misin, hangisi?', { delay: 40 });
    cy.get('[data-cy=tutor-send]').click(); bekle(3000);
    cy.get('[data-cy=choice-A]').scrollIntoView().click(); bekle(4000);
    cy.get('[data-cy=outcome-next]').scrollIntoView().click(); bekle(2000);

    cy.get('[data-cy=tutor-input]').type('bitlocker ne demek', { delay: 40 });
    cy.get('[data-cy=tutor-send]').click(); bekle(3000);
    cy.get('[data-cy=choice-A]').scrollIntoView().click(); bekle(4000);
    cy.get('[data-cy=outcome-next]').scrollIntoView().click(); bekle(2500);

    cy.get('[data-cy=choice-A]').scrollIntoView().click(); bekle(4000);
    cy.get('[data-cy=outcome-next]').scrollIntoView().click(); bekle(3000);
    cy.get('[data-cy=ending]').should('contain', 'SON A');
    cy.get('[data-cy=lessons]').scrollIntoView(); bekle(1000);
    cy.get('[data-cy=learned-k2]').click(); bekle(3000);
  });
});
