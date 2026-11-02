// v2 demo videosu: AYNI sahnede (Karar 2 · Test) model iki oyuncu için iki farklı karar veriyor.
// Oyuncu 1 dikkatli: giriş hikâyesini okuyor, 1. kararda düşünüp güvenli seçeneği seçiyor.
// Oyuncu 2 aceleci: girişi hemen geçiyor, 1. kararda hızla riskli seçeneği seçiyor.
// Eşik parametresi YOK: kararı gerçek model verir (rozet olasılığı ve eşiği gösterir).
// npm run cy:demo → cypress/videos/demo2.cy.js.mp4
const bekle = (ms) => cy.wait(ms);

const profil = (seviye) => {
  cy.visit('/?sira=sabit');
  bekle(1200);
  cy.get(`[data-cy=opt-level-${seviye}]`).click(); bekle(400);
  cy.get('[data-cy=opt-role-devops]').click(); bekle(400);
  cy.get('[data-cy=opt-goal-kriz]').click(); bekle(400);
  cy.get('[data-cy=start]').click();
};

describe('Demo v2 · aynı sahne, iki oyuncu, iki model kararı', () => {
  it('Oyuncu 1 · dikkatli', () => {
    profil('orta');
    bekle(14000); // giriş hikâyesini okuyor
    cy.get('[data-cy=intro-next]').click();
    bekle(9000);  // 1. kararı düşünüyor
    cy.get('[data-cy=choice-A]').click(); bekle(6000);
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=decision-k2]').should('be.visible');
    cy.get('[data-cy=model-rozet]').scrollIntoView(); bekle(6000);
  });

  it('Oyuncu 2 · aceleci', () => {
    profil('orta');
    bekle(1500);  // girişi hemen geçiyor
    cy.get('[data-cy=intro-next]').click();
    bekle(1500);  // 1. kararı hızla veriyor
    cy.get('[data-cy=choice-B]').click(); bekle(1500);
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=decision-k2]').should('be.visible');
    cy.get('[data-cy=model-rozet]').scrollIntoView(); bekle(6000);
  });
});
